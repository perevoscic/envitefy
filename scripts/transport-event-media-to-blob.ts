import "dotenv/config";

import { Pool } from "pg";

import {
  isAppOwnedBlobUrl,
  isSiteStaticAssetPath,
  listEventMediaEntries,
  setValueAtPath,
} from "../src/lib/event-media.ts";
import { processBufferUpload } from "../src/lib/media-upload.ts";
import { normalizeCanonicalStartFields } from "../src/lib/dashboard-data.ts";
import { parseDataUrlBase64 } from "../src/utils/data-url.ts";

type EventRow = {
  id: string;
  user_id: string | null;
  title: string;
  data: any;
  created_at: string | null;
};

type CandidateReport = {
  eventId: string;
  title: string;
  changed: boolean;
  migratedFields: string[];
  skippedFields: string[];
  unsupportedFields: string[];
};

function parseArgs(argv: string[]) {
  const excludeUserIds: string[] = [];
  let apply = false;
  let jsonReport = false;
  let limit = 200;
  let cursor: string | null = null;
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
    if (arg === "--limit") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --limit");
      limit = Math.max(1, Math.min(1000, Number.parseInt(next, 10) || 200));
      index += 1;
      continue;
    }
    if (arg === "--cursor") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --cursor");
      cursor = next;
      index += 1;
      continue;
    }
    if (arg === "--exclude-user-id") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --exclude-user-id");
      excludeUserIds.push(next);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node --experimental-strip-types scripts/transport-event-media-to-blob.ts [--dry-run] [--apply] [--json-report] [--limit N] [--cursor <event-id>] [--exclude-user-id <uuid> ...]",
      );
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    apply,
    jsonReport,
    limit,
    cursor,
    excludeUserIds: Array.from(new Set(excludeUserIds)),
  };
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "upload";
}

function extensionForMimeType(mimeType: string | null | undefined): string {
  const normalized = String(mimeType || "").trim().toLowerCase();
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "application/pdf") return ".pdf";
  return ".jpg";
}

function cloneData<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function shouldSkipValue(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("data:") || value.startsWith("blob:")) return false;
  if (isSiteStaticAssetPath(value)) return true;
  if (isAppOwnedBlobUrl(value)) return true;
  if (/^https?:\/\//i.test(value)) return true;
  return true;
}

async function readCursorAnchor(pool: Pool, cursor: string | null) {
  if (!cursor) return null;
  const res = await pool.query<{ id: string; created_at: string | null }>(
    `select id, created_at
     from event_history
     where id = $1::uuid
     limit 1`,
    [cursor],
  );
  return res.rows[0] || null;
}

async function migrateRow(row: EventRow): Promise<CandidateReport & { nextData: any | null }> {
  const nextData = cloneData(row.data || {});
  const entries = listEventMediaEntries(nextData);
  const migratedFields: string[] = [];
  const skippedFields: string[] = [];
  const unsupportedFields: string[] = [];
  const handledPaths = new Set<string>();

  const attachmentDataEntry = entries.find(
    (entry) => entry.fieldPath === "attachment.dataUrl" && entry.value.startsWith("data:"),
  );
  if (attachmentDataEntry) {
    const parsed = parseDataUrlBase64(attachmentDataEntry.value);
    if (!parsed) {
      unsupportedFields.push(attachmentDataEntry.fieldPath);
    } else {
      try {
        const upload = await processBufferUpload({
          bytes: Buffer.from(parsed.base64Payload, "base64"),
          fileName: `${sanitizeFileName(`${row.id}-${attachmentDataEntry.fieldPath}`)}${extensionForMimeType(parsed.mimeType)}`,
          mimeType: parsed.mimeType,
          usage: "attachment",
          eventId: row.id,
        });
        nextData.attachment = upload.eventMedia.attachment || nextData.attachment;
        if (
          typeof nextData.thumbnail !== "string" ||
          nextData.thumbnail.startsWith("data:") ||
          nextData.thumbnail.startsWith("blob:")
        ) {
          nextData.thumbnail = upload.eventMedia.thumbnail || nextData.thumbnail;
        }
        if (upload.eventMedia.thumbnailMeta) {
          nextData.thumbnailMeta = upload.eventMedia.thumbnailMeta;
        }
        migratedFields.push(attachmentDataEntry.fieldPath);
        handledPaths.add("attachment.dataUrl");
        handledPaths.add("attachment.previewImageUrl");
        handledPaths.add("attachment.thumbnailUrl");
      } catch (error) {
        unsupportedFields.push(`${attachmentDataEntry.fieldPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  for (const entry of entries) {
    if (handledPaths.has(entry.fieldPath)) continue;
    if (shouldSkipValue(entry.value)) {
      skippedFields.push(entry.fieldPath);
      continue;
    }
    if (entry.value.startsWith("blob:")) {
      unsupportedFields.push(`${entry.fieldPath}: browser-object-url`);
      continue;
    }
    const parsed = parseDataUrlBase64(entry.value);
    if (!parsed) {
      unsupportedFields.push(`${entry.fieldPath}: invalid-data-url`);
      continue;
    }
    try {
      const upload = await processBufferUpload({
        bytes: Buffer.from(parsed.base64Payload, "base64"),
        fileName: `${sanitizeFileName(`${row.id}-${entry.fieldPath}`)}${extensionForMimeType(parsed.mimeType)}`,
        mimeType: parsed.mimeType,
        usage: "header",
        eventId: row.id,
      });
      setValueAtPath(nextData, entry.pathSegments, upload.stored.display?.url || upload.eventMedia.thumbnail || entry.value);
      migratedFields.push(entry.fieldPath);
    } catch (error) {
      unsupportedFields.push(`${entry.fieldPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  normalizeCanonicalStartFields(nextData);

  return {
    eventId: row.id,
    title: row.title,
    changed: migratedFields.length > 0,
    migratedFields,
    skippedFields: Array.from(new Set(skippedFields)),
    unsupportedFields,
    nextData: migratedFields.length > 0 ? nextData : null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const cursorAnchor = await readCursorAnchor(pool, args.cursor);
    const rowsRes = await pool.query<EventRow>(
      `select id, user_id, title, data, created_at
       from event_history
       where (cardinality($1::uuid[]) = 0 or user_id is null or not (user_id = any($1::uuid[])))
         and (
           $2::timestamptz is null
           or created_at > $2::timestamptz
           or (created_at = $2::timestamptz and id > $3::uuid)
         )
       order by created_at asc nulls last, id asc
       limit $4`,
      [
        args.excludeUserIds,
        cursorAnchor?.created_at || null,
        cursorAnchor?.id || "00000000-0000-0000-0000-000000000000",
        args.limit,
      ],
    );

    const results: CandidateReport[] = [];
    for (const row of rowsRes.rows) {
      const migrated = await migrateRow(row);
      results.push(migrated);
      if (args.apply && migrated.changed && migrated.nextData) {
        await pool.query(`update event_history set data = $2::jsonb where id = $1::uuid`, [
          row.id,
          JSON.stringify(migrated.nextData),
        ]);
      }
    }

    const report = {
      mode: args.apply ? "apply" : "dry-run",
      scanned: rowsRes.rows.length,
      changed: results.filter((row) => row.changed).length,
      unsupported: results.filter((row) => row.unsupportedFields.length > 0).length,
      nextCursor: rowsRes.rows.length ? rowsRes.rows[rowsRes.rows.length - 1]?.id || null : null,
      results,
    };

    if (args.jsonReport) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report);
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("[transport-event-media-to-blob] failed", error);
  process.exitCode = 1;
});
