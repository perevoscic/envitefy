import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const write = process.argv.includes("--write");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(1, Math.min(5000, Number(limitArg?.split("=")[1] || 500)));

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function classify(row) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  const combined = [
    row.title,
    data.title,
    data.description,
    data.thingsToDo,
    data.hostName,
    data.category,
  ]
    .map(text)
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (/\b(i got|i received|was invited|invitation i received|someone sent me)\b/.test(combined)) {
    return {
      detectedSourceIntent: "received_invite",
      confidence: "high",
      reason: "received_invite_phrase",
    };
  }

  if (
    /\b(make|create|edit|promote|publish|design|turn this into|build)\b/.test(combined) ||
    /\b(schedule|open house|appointment|public notice|meet packet|menu|school flyer|sports flyer|meet packet)\b/.test(
      combined,
    )
  ) {
    return {
      detectedSourceIntent: "authoring_source",
      confidence: "high",
      reason: "authoring_or_reference_material",
    };
  }

  return {
    detectedSourceIntent: "unknown",
    confidence: "low",
    reason: "ambiguous_legacy_row",
  };
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or POSTGRES_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

try {
  const res = await pool.query(
    `select id, title, data
     from event_history
     where data ? 'sourceContext' = false
       and (
         lower(coalesce(data->>'createdVia', '')) like 'ocr%'
         or lower(coalesce(data->>'createdVia', '')) like '%upload%'
         or lower(coalesce(data->>'createdVia', '')) like '%snap%'
         or lower(coalesce(data->>'invitedFromScan', '')) = 'true'
       )
     order by created_at desc
     limit $1`,
    [limit],
  );

  const summary = { scanned: res.rows.length, updated: 0, skippedAmbiguous: 0 };
  for (const row of res.rows) {
    const result = classify(row);
    if (result.detectedSourceIntent === "unknown") {
      summary.skippedAmbiguous += 1;
      continue;
    }
    summary.updated += 1;
    if (!write) continue;

    const data = row.data && typeof row.data === "object" ? row.data : {};
    const sourceContext = {
      type: "upload",
      detectedSourceIntent: result.detectedSourceIntent,
      confidence: result.confidence,
      signals: [{ code: result.reason, label: result.reason.replace(/_/g, " ") }],
      requiresUserConfirmation: false,
      originalCategory: text(data.category) || null,
      hasUsableContext: true,
      ambiguity: "none",
    };
    await pool.query(
      `update event_history
       set data = data || $2::jsonb
       where id = $1`,
      [
        row.id,
        JSON.stringify({
          sourceContext,
          ownership: result.detectedSourceIntent === "received_invite" ? "invited" : "owned",
          invitedFromScan: result.detectedSourceIntent === "received_invite",
        }),
      ],
    );
  }

  console.log(JSON.stringify({ mode: write ? "write" : "dry-run", ...summary }, null, 2));
} finally {
  await pool.end();
}

