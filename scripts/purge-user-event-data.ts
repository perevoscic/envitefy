import "dotenv/config";

import { del } from "@vercel/blob";
import { Pool } from "pg";

import { collectAppOwnedBlobUrls } from "../src/lib/event-media.ts";

const DEFAULT_USER_IDS = [
  "73239dae-05d6-4c8c-bc6c-fbcebfdecca3",
  "5784adb5-6275-4e5c-ba26-1640694d3481",
  "6d568f3d-896a-432d-b654-056e6d79e181",
  "ab64743e-0698-4c52-a362-c244ef758b9c",
  "d4ea2932-6141-435c-a19f-7d5afe3b3e2b",
  "84691814-8ff6-48b4-8341-898aefae9f9c",
  "07b29fd4-6e7d-4fc8-b0a5-a82bacc6b36f",
];

type EventRow = {
  id: string;
  user_id: string | null;
  title: string;
  data: any;
  created_at: string | null;
};

function parseArgs(argv: string[]) {
  const userIds: string[] = [];
  let apply = false;
  let jsonReport = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      apply = false;
      continue;
    }
    if (arg === "--json-report") {
      jsonReport = true;
      continue;
    }
    if (arg === "--user-id") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --user-id");
      userIds.push(next);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node --experimental-strip-types scripts/purge-user-event-data.ts [--dry-run] [--apply] [--json-report] [--user-id <uuid> ...]",
      );
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    apply,
    jsonReport,
    userIds: Array.from(new Set(userIds.length ? userIds : DEFAULT_USER_IDS)),
  };
}

async function bestEffortDeleteBlobRefs(refs: string[]): Promise<string[]> {
  if (!refs.length) return [];
  try {
    await del(refs);
    return [];
  } catch (error) {
    console.error("[purge-user-event-data] blob delete failed", {
      refs,
      message: error instanceof Error ? error.message : String(error),
    });
    return refs;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const userRes = await pool.query<{ id: string; email: string | null }>(
      `select id, email
       from users
       where id = any($1::uuid[])
       order by id asc`,
      [args.userIds],
    );
    const users = userRes.rows;
    const lowerEmails = Array.from(
      new Set(
        users
          .map((row) => String(row.email || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    const eventRes = await pool.query<EventRow>(
      `select id, user_id, title, data, created_at
       from event_history
       where user_id = any($1::uuid[])
       order by created_at asc nulls last, id asc`,
      [args.userIds],
    );
    const ownedEvents = eventRes.rows;
    const ownedEventIds = ownedEvents.map((row) => row.id);

    let discoveryBlobRefs: string[] = [];
    try {
      const discoveryRes = await pool.query<{
        storage_pathname: string | null;
        storage_url: string | null;
      }>(
        `select storage_pathname, storage_url
         from event_history_input_blobs
         where event_id = any($1::uuid[])`,
        [ownedEventIds.length ? ownedEventIds : ["00000000-0000-0000-0000-000000000000"]],
      );
      discoveryBlobRefs = discoveryRes.rows
        .flatMap((row) => [row.storage_url, row.storage_pathname])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    } catch (error) {
      if ((error as any)?.code !== "42P01") throw error;
    }

    const ownedBlobRefs = ownedEvents.flatMap((row) => collectAppOwnedBlobUrls(row.data));
    const shareCountRes = await pool.query<{ count: string }>(
      `select count(*)::text as count
       from event_shares
       where owner_user_id = any($1::uuid[])
          or recipient_user_id = any($1::uuid[])`,
      [args.userIds],
    ).catch((error) => {
      if ((error as any)?.code === "42P01") return { rows: [{ count: "0" }] };
      throw error;
    });
    const rsvpCountRes = await pool.query<{ count: string }>(
      `select count(*)::text as count
       from rsvp_responses
       where user_id = any($1::uuid[])
          or lower(coalesce(email, '')) = any($2::text[])`,
      [args.userIds, lowerEmails.length ? lowerEmails : [""]],
    ).catch((error) => {
      if ((error as any)?.code === "42P01") return { rows: [{ count: "0" }] };
      throw error;
    });
    const registryItemCountRes = await pool.query<{ count: string }>(
      `select count(*)::text as count
       from registry_items
       where event_id = any($1::text[])`,
      [ownedEventIds],
    ).catch((error) => {
      if ((error as any)?.code === "42P01") return { rows: [{ count: "0" }] };
      throw error;
    });
    const registryClaimCountRes = await pool.query<{ count: string }>(
      `select count(*)::text as count
       from registry_claims
       where item_id in (
         select id
         from registry_items
         where event_id = any($1::text[])
       )`,
      [ownedEventIds],
    ).catch((error) => {
      if ((error as any)?.code === "42P01") return { rows: [{ count: "0" }] };
      throw error;
    });

    const report = {
      mode: args.apply ? "apply" : "dry-run",
      userIds: args.userIds,
      usersFound: users.length,
      ownedEventCount: ownedEvents.length,
      ownedEventIds,
      shareRows: Number(shareCountRes.rows[0]?.count || 0),
      rsvpRows: Number(rsvpCountRes.rows[0]?.count || 0),
      registryItems: Number(registryItemCountRes.rows[0]?.count || 0),
      registryClaims: Number(registryClaimCountRes.rows[0]?.count || 0),
      ownedBlobRefs: Array.from(new Set(ownedBlobRefs)),
      discoveryBlobRefs: Array.from(new Set(discoveryBlobRefs)),
      sampleEvents: ownedEvents.slice(0, 10).map((row) => ({
        id: row.id,
        title: row.title,
        created_at: row.created_at,
      })),
    };

    if (!args.apply) {
      if (args.jsonReport) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(report);
      }
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      if (args.userIds.length) {
        await client
          .query(
            `delete from event_shares
             where owner_user_id = any($1::uuid[])
                or recipient_user_id = any($1::uuid[])`,
            [args.userIds],
          )
          .catch((error) => {
            if ((error as any)?.code !== "42P01") throw error;
          });
        await client
          .query(
            `delete from rsvp_responses
             where user_id = any($1::uuid[])
                or lower(coalesce(email, '')) = any($2::text[])`,
            [args.userIds, lowerEmails.length ? lowerEmails : [""]],
          )
          .catch((error) => {
            if ((error as any)?.code !== "42P01") throw error;
          });
      }

      if (ownedEventIds.length) {
        await client
          .query(
            `delete from registry_claims
             where item_id in (
               select id
               from registry_items
               where event_id = any($1::text[])
             )`,
            [ownedEventIds],
          )
          .catch((error) => {
            if ((error as any)?.code !== "42P01") throw error;
          });
        await client
          .query(`delete from registry_items where event_id = any($1::text[])`, [ownedEventIds])
          .catch((error) => {
            if ((error as any)?.code !== "42P01") throw error;
          });
        await client.query(`delete from event_history where user_id = any($1::uuid[])`, [args.userIds]);
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    const blobDeleteFailures = await bestEffortDeleteBlobRefs(
      Array.from(new Set([...ownedBlobRefs, ...discoveryBlobRefs])),
    );
    const finalReport = {
      ...report,
      blobDeleteFailures,
    };
    if (args.jsonReport) {
      console.log(JSON.stringify(finalReport, null, 2));
    } else {
      console.log(finalReport);
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("[purge-user-event-data] failed", error);
  process.exitCode = 1;
});
