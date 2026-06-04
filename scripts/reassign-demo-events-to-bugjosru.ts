import "dotenv/config";

import { Pool } from "pg";

const OLD_USER_ID = "f047e864-1de3-428d-a131-f2fab76d4ca4";
const OLD_EMAIL = "airizom@hotmail.com";
const NEW_USER_ID = "9bf78f15-2c85-4a0d-b62f-dca18d4f6f03";
const NEW_EMAIL = "bugjosru@gmail.com";
const OLD_WORKSPACE_ID = "035339ee-da11-414e-abea-8cf8d46fb709";
const TARGET_WORKSPACE_ID = "d6f9f542-87e1-488b-8cd0-7b1622d2f399";

const EVENT_HISTORY_IDS = [
  "242e734e-fb7f-4e68-a61b-5f459fbe17e5",
  "1fad3b7c-c977-4dac-95ab-4b0f8a56971e",
  "039e18b4-d8aa-4455-b45a-f2537549b1be",
  "198c25e1-dd7f-4ce5-be9b-67cc6c1af041",
  "ceb6090a-0131-455f-8003-c1992f95674c",
];

const EVENT_PAGE_IDS = [
  "1c40ab71-7919-4ab4-89d8-f213e80b373a",
  "72d3ba17-7d4d-458f-a2ae-80bd4f142c0e",
  "ce6e0ec7-06bd-40f7-8a47-7109113e57d3",
  "a9f2881c-6b2d-4d34-9a4d-b94242750db3",
  "e53a3a5e-aa84-46c4-9160-2c8e503cfc33",
];

const PROGRAM_IDS = [
  "84e764ff-c7b7-4f3a-bcb9-3e1a06d014fb",
  "a97fc3f7-fcd5-4313-aa45-d8aaa6d3cc3c",
  "65303321-29d7-439e-b573-632d84710eea",
  "0a182b48-57ea-45b8-8763-c30624d20b69",
  "93188d07-4c09-4827-a560-9a013aeed4ab",
];

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  return url;
}

async function main() {
  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    ssl:
      process.env.NODE_ENV === "production" ||
      /supabase|pooler|neon|render|railway|amazonaws|azure|gcp/i.test(process.env.DATABASE_URL || "")
        ? { rejectUnauthorized: false }
        : undefined,
  });
  const client = await pool.connect();
  const reassignedAt = new Date().toISOString();
  const metadataPatch = {
    demo: true,
    demoOwnerId: NEW_USER_ID,
    demoOwnerEmail: NEW_EMAIL,
    reassignedFromUserId: OLD_USER_ID,
    reassignedFromEmail: OLD_EMAIL,
    reassignedAt,
  };
  let currentStep = "connect";
  async function run<T = any>(step: string, text: string, params: any[] = []) {
    currentStep = step;
    console.log(`reassign step: ${step}`);
    return client.query<T>(text, params);
  }

  try {
    await run("begin", "begin");

    const targetUser = await run("target user", "select id from users where id = $1 and lower(email) = lower($2)", [
      NEW_USER_ID,
      NEW_EMAIL,
    ]);
    if (targetUser.rowCount !== 1) throw new Error(`Target user not found: ${NEW_EMAIL}`);

    const targetWorkspace = await run(
      "target workspace",
      "select id from workspaces where id = $1 and owner_user_id = $2",
      [TARGET_WORKSPACE_ID, NEW_USER_ID],
    );
    if (targetWorkspace.rowCount !== 1) {
      throw new Error(`Target workspace not found for ${NEW_EMAIL}: ${TARGET_WORKSPACE_ID}`);
    }

    const demos = await run(
      "demo guard",
      `select id, title
       from event_history
       where id = any($1::uuid[])
         and user_id = $2
         and (title like 'Demo:%' or title like 'Demo Import:%')`,
      [EVENT_HISTORY_IDS, OLD_USER_ID],
    );
    if (demos.rowCount !== EVENT_HISTORY_IDS.length) {
      throw new Error(`Expected ${EVENT_HISTORY_IDS.length} old-owner demos, found ${demos.rowCount}.`);
    }

    await run(
      "event_history",
      `update event_history
       set user_id = $2,
         data = jsonb_set(
           coalesce(data, '{}'::jsonb),
           '{metadata_json}',
           coalesce(data->'metadata_json', '{}'::jsonb) || $3::jsonb,
           true
         ) || $4::jsonb
       where id = any($1::uuid[])`,
      [
        EVENT_HISTORY_IDS,
        NEW_USER_ID,
        JSON.stringify(metadataPatch),
        JSON.stringify({
          demoOwnerId: NEW_USER_ID,
          demoOwnerEmail: NEW_EMAIL,
        }),
      ],
    );

    await run(
      "event_pages",
      `update event_pages
       set owner_user_id = $3,
         workspace_id = $4,
         metadata_json = metadata_json || $5::jsonb
       where id = any($1::uuid[])
         and legacy_event_history_id = any($2::uuid[])`,
      [EVENT_PAGE_IDS, EVENT_HISTORY_IDS, NEW_USER_ID, TARGET_WORKSPACE_ID, JSON.stringify(metadataPatch)],
    );

    await run(
      "programs",
      `update programs
       set owner_user_id = $3,
         workspace_id = $4,
         metadata_json = metadata_json || $5::jsonb
       where id = any($1::uuid[])
         and owner_user_id = $2`,
      [PROGRAM_IDS, OLD_USER_ID, NEW_USER_ID, TARGET_WORKSPACE_ID, JSON.stringify(metadataPatch)],
    );

    await run(
      "event_occurrences",
      `update event_occurrences
       set owner_user_id = $3,
         workspace_id = $4
       where program_id = any($1::uuid[])
         and owner_user_id = $2`,
      [PROGRAM_IDS, OLD_USER_ID, NEW_USER_ID, TARGET_WORKSPACE_ID],
    );

    await run(
      "event_series",
      `update event_series
       set owner_user_id = $3,
         workspace_id = $4
       where program_id = any($1::uuid[])
         and owner_user_id = $2`,
      [PROGRAM_IDS, OLD_USER_ID, NEW_USER_ID, TARGET_WORKSPACE_ID],
    );

    for (const table of ["smart_forms", "volunteer_boards", "payment_requests", "reminders", "checklist_items"]) {
      await run(
        table,
        `update ${table}
         set workspace_id = $2,
           created_by_user_id = case when created_by_user_id = $3 then $4 else created_by_user_id end
         where program_id = any($1::uuid[])`,
        [PROGRAM_IDS, TARGET_WORKSPACE_ID, OLD_USER_ID, NEW_USER_ID],
      );
    }

    await run(
      "source_documents",
      `update source_documents
       set workspace_id = $2,
         uploaded_by_user_id = case when uploaded_by_user_id = $3 then $4 else uploaded_by_user_id end,
         parsed_json = coalesce(parsed_json, '{}'::jsonb) || $5::jsonb
       where parsed_json->>'eventHistoryId' = any($1::text[])`,
      [
        EVENT_HISTORY_IDS,
        TARGET_WORKSPACE_ID,
        OLD_USER_ID,
        NEW_USER_ID,
        JSON.stringify({
          demoOwnerId: NEW_USER_ID,
          demoOwnerEmail: NEW_EMAIL,
          reassignedFromUserId: OLD_USER_ID,
          reassignedAt,
        }),
      ],
    );

    await run(
      "resource_assignments",
      `update resource_assignments
       set assigned_by_user_id = case when assigned_by_user_id = $2 then $3 else assigned_by_user_id end
       where occurrence_id in (select id from event_occurrences where program_id = any($1::uuid[]))`,
      [PROGRAM_IDS, OLD_USER_ID, NEW_USER_ID],
    );

    await run(
      "venues",
      `update venues
       set workspace_id = $2
       where workspace_id = $1
         and id in (select distinct venue_id from resources where workspace_id = $1 and venue_id is not null)`,
      [OLD_WORKSPACE_ID, TARGET_WORKSPACE_ID],
    );

    await run(
      "resources",
      `update resources
       set workspace_id = $4,
         attributes_json = attributes_json || $5::jsonb
       where workspace_id = $1
         and (
           attributes_json->>'eventHistoryId' = any($2::text[])
           or attributes_json->>'programId' = any($3::text[])
           or id in (
             select ra.resource_id
             from resource_assignments ra
             join event_occurrences eo on eo.id = ra.occurrence_id
             where eo.program_id = any($6::uuid[])
           )
         )`,
      [
        OLD_WORKSPACE_ID,
        EVENT_HISTORY_IDS,
        PROGRAM_IDS,
        TARGET_WORKSPACE_ID,
        JSON.stringify({
          demoOwnerId: NEW_USER_ID,
          demoOwnerEmail: NEW_EMAIL,
          reassignedFromUserId: OLD_USER_ID,
          reassignedAt,
        }),
        PROGRAM_IDS,
      ],
    );

    await run(
      "families",
      `update families
       set workspace_id = $2,
         primary_guardian_user_id = case when primary_guardian_user_id = $3 then $4 else primary_guardian_user_id end
       where workspace_id = $1
         and id in (
           select distinct family_id
           from participants
           where workspace_id = $1 and family_id is not null
         )`,
      [OLD_WORKSPACE_ID, TARGET_WORKSPACE_ID, OLD_USER_ID, NEW_USER_ID],
    );

    await run(
      "participants",
      `update participants
       set workspace_id = $2,
         user_id = case when user_id = $3 then $4 else user_id end
       where workspace_id = $1
         and id in (
           select participant_id
           from program_participants
           where program_id = any($5::uuid[])
         )`,
      [OLD_WORKSPACE_ID, TARGET_WORKSPACE_ID, OLD_USER_ID, NEW_USER_ID, PROGRAM_IDS],
    );

    await run(
      "program_participants",
      `update program_participants
       set workspace_id = $2
       where program_id = any($1::uuid[])`,
      [PROGRAM_IDS, TARGET_WORKSPACE_ID],
    );

    await run(
      "concierge_sessions",
      `update concierge_sessions
       set workspace_id = $4,
         user_id = $3,
         raw_output_json = coalesce(raw_output_json, '{}'::jsonb) || $5::jsonb
       where user_id = $2
         and ((raw_output_json->'applyResult'->>'eventHistoryId') = any($1::text[]))`,
      [
        EVENT_HISTORY_IDS,
        OLD_USER_ID,
        NEW_USER_ID,
        TARGET_WORKSPACE_ID,
        JSON.stringify({
          demoOwnerId: NEW_USER_ID,
          demoOwnerEmail: NEW_EMAIL,
          reassignedFromUserId: OLD_USER_ID,
          reassignedAt,
        }),
      ],
    );

    await run(
      "audit_logs",
      `update audit_logs
       set workspace_id = $4,
         actor_user_id = case when actor_user_id = $2 then $3 else actor_user_id end,
         after_json = coalesce(after_json, '{}'::jsonb) || $5::jsonb
       where exists (
           select 1
           from unnest($1::uuid[]) as program_id(id)
           where entity_id = program_id.id::text
         )
         or exists (
           select 1
           from unnest($6::uuid[]) as event_id(id)
           where after_json->>'eventHistoryId' = event_id.id::text
         )`,
      [
        PROGRAM_IDS,
        OLD_USER_ID,
        NEW_USER_ID,
        TARGET_WORKSPACE_ID,
        JSON.stringify({
          demoOwnerId: NEW_USER_ID,
          demoOwnerEmail: NEW_EMAIL,
          reassignedFromUserId: OLD_USER_ID,
          reassignedAt,
        }),
        EVENT_HISTORY_IDS,
      ],
    );

    await run(
      "membership upsert",
      `insert into memberships (workspace_id, user_id, role, status, invited_by_user_id, accepted_at)
       values ($1, $2, 'program_manager', 'active', $2, now())
       on conflict do nothing`,
      [TARGET_WORKSPACE_ID, NEW_USER_ID],
    );

    await run("commit", "commit");

    const verification = await run(
      "verification",
      `select eh.id, eh.title, eh.user_id, u.email, ep.owner_user_id as page_owner,
         ep.workspace_id, p.owner_user_id as program_owner, p.workspace_id as program_workspace
       from event_history eh
       join users u on u.id = eh.user_id
       join event_pages ep on ep.legacy_event_history_id = eh.id
       join programs p on p.id = ep.program_id
       where eh.id = any($1::uuid[])
       order by eh.created_at asc`,
      [EVENT_HISTORY_IDS],
    );
    console.log(JSON.stringify({ reassignedAt, verification: verification.rows }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    console.error(`reassign failed at step: ${currentStep}`);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
