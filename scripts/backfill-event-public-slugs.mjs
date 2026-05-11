import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const write = process.argv.includes("--write");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(1, Math.min(20_000, Number(limitArg?.split("=")[1] || 5000)));
const MAX_PUBLIC_SLUG_LENGTH = 96;
const RESERVED = new Set([
  "appointments",
  "baby-showers",
  "birthdays",
  "cheerleading",
  "dance-ballet",
  "football",
  "football-season",
  "gender-reveal",
  "general",
  "gymnastics",
  "new",
  "soccer",
  "special-events",
  "sport-events",
  "weddings",
  "workshops",
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function first(...values) {
  for (const value of values) {
    const out = text(value);
    if (out) return out;
  }
  return "";
}

function normalizeSlug(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const trimmed =
    slug.length <= MAX_PUBLIC_SLUG_LENGTH
      ? slug
      : slug.slice(0, MAX_PUBLIC_SLUG_LENGTH).replace(/-+$/g, "");
  return trimmed || "event";
}

function routableSlug(value) {
  const slug = normalizeSlug(value);
  return RESERVED.has(slug) ? `${slug}-event` : slug;
}

function includesText(haystack, needle) {
  const left = normalizeSlug(haystack);
  const right = normalizeSlug(needle);
  return Boolean(right && left.includes(right));
}

function looksLikeStreetAddress(value) {
  return (
    /\b\d{1,6}\s+\w+/.test(value) &&
    /\b(st|street|rd|road|ave|avenue|blvd|drive|dr|lane|ln|way)\b/i.test(value)
  );
}

function buildBaseSlug(row) {
  const data = record(row.data);
  const event = record(data.event);
  const fieldsGuess = record(data.fieldsGuess);
  const studioCard = record(data.studioCard);
  const studioDetails = record(studioCard.eventDetails);
  const invitationData = record(studioCard.invitationData);
  const invitationDetails = record(invitationData.eventDetails);
  const publicEvent = record(data.publicEvent);
  const title = first(
    row.title,
    data.title,
    data.eventTitle,
    event.title,
    fieldsGuess.title,
    studioDetails.eventTitle,
    invitationDetails.eventTitle,
    publicEvent.title,
  );
  const venue = first(
    data.venueName,
    data.venue,
    data.locationName,
    event.venueName,
    event.venue,
    fieldsGuess.venueName,
    fieldsGuess.venue,
    studioDetails.venueName,
    invitationDetails.venueName,
    publicEvent.venueName,
    publicEvent.venue,
  );
  const location = first(
    data.location,
    event.location,
    fieldsGuess.location,
    studioDetails.location,
    invitationDetails.location,
    publicEvent.locationLine,
  );
  const venueText = venue || (location && !looksLikeStreetAddress(location) ? location : "");
  if (title && venueText && !includesText(title, venueText)) {
    return routableSlug(`${title} at ${venueText}`);
  }
  return routableSlug(title || venueText || "event");
}

function appendSuffix(base, suffixNumber) {
  const suffix = `-${suffixNumber}`;
  const trimmedBase = base
    .slice(0, Math.max(1, MAX_PUBLIC_SLUG_LENGTH - suffix.length))
    .replace(/-+$/g, "");
  return routableSlug(`${trimmedBase || "event"}${suffix}`);
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL or POSTGRES_URL.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

try {
  await pool.query(`alter table event_history add column if not exists public_slug text`);
  await pool.query(`
    create unique index if not exists idx_event_history_public_slug_unique
    on event_history (lower(public_slug))
    where public_slug is not null and public_slug <> ''
  `);
  await pool.query(`
    create table if not exists event_public_slug_aliases (
      alias text primary key,
      event_id uuid not null references event_history(id) on delete cascade,
      created_at timestamptz(6) default now()
    )
  `);

  const rows = (
    await pool.query(
      `select id, title, data, public_slug
       from event_history
       where public_slug is null or public_slug = '' or data->>'publicSlug' is null
       order by created_at desc nulls last, id desc
       limit $1`,
      [limit],
    )
  ).rows;

  let changed = 0;
  for (const row of rows) {
    const base = routableSlug(
      text(row.public_slug) || text(row.data?.publicSlug) || buildBaseSlug(row),
    );
    let slug = base;
    for (let suffix = 2; suffix <= 100; suffix += 1) {
      const taken = (
        await pool.query(
          `select exists (
             select 1 from event_history where lower(public_slug) = lower($1) and id <> $2::uuid
             union all
             select 1 from event_public_slug_aliases where lower(alias) = lower($1) and event_id <> $2::uuid
           ) as taken`,
          [slug, row.id],
        )
      ).rows[0]?.taken;
      if (!taken) break;
      slug = appendSuffix(base, suffix);
    }

    changed += 1;
    console.log(`${write ? "update" : "would update"} ${row.id} -> ${slug}`);
    if (!write) continue;
    await pool.query(
      `update event_history
       set public_slug = $2,
           data = jsonb_set(coalesce(data, '{}'::jsonb), '{publicSlug}', to_jsonb($2::text), true)
       where id = $1`,
      [row.id, slug],
    );
  }

  console.log(`${write ? "Updated" : "Would update"} ${changed} event public slugs.`);
} finally {
  await pool.end();
}
