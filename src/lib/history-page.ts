import {
  buildDashboardCoverImageUrlSql,
  buildOwnedHistoryOwnershipSql,
  buildOwnedHistoryStudioVisibilitySql,
  query,
} from "@/lib/db";

type Cursor = { createdAt: string | null; id: string };
type CardRow = {
  id: string;
  title: string;
  public_slug: string | null;
  created_at: string | null;
  data: Record<string, unknown>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function decodeHistoryCursor(value: string | null): Cursor | null {
  if (!value) return null;
  try {
    if (value.length > 256) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, "base64url").toString());
    if (
      !uuid.test(cursor.id) ||
      (cursor.createdAt !== null &&
        (typeof cursor.createdAt !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T/.test(cursor.createdAt) ||
          !Number.isFinite(Date.parse(cursor.createdAt))))
    )
      throw new Error();
    return { id: cursor.id, createdAt: cursor.createdAt };
  } catch {
    throw new Error("Invalid history cursor");
  }
}

/** One bounded page of card fields. Authorization and heavy-field exclusion happen in SQL. */
export async function listHistoryCardPage(userId: string, limit: number, cursor: Cursor | null) {
  const pageSize = Math.max(1, Math.min(200, Math.floor(limit) || 40));
  const data = "coalesce(eh.data, '{}'::jsonb)";
  const rows = (
    await query<CardRow>(
      `
    SELECT eh.id, eh.title, eh.public_slug,
      to_char(eh.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at,
      jsonb_build_object(
        'start', coalesce(nullif(eh.data->>'startAt',''), nullif(eh.data->>'startISO',''), eh.data->>'start'),
        'end', coalesce(nullif(eh.data->>'endAt',''), nullif(eh.data->>'endISO',''), eh.data->>'end'),
        'timezone', coalesce(nullif(eh.data->>'timezone',''), eh.data->>'tz'),
        'category', eh.data->'category', 'status', eh.data->'status',
        'thumbnail', ${buildDashboardCoverImageUrlSql(data, "eh.id")},
        'ownership', CASE WHEN eh.user_id=$1 THEN ${buildOwnedHistoryOwnershipSql(data)} WHEN member.allowed THEN to_jsonb('owned'::text) ELSE to_jsonb('invited'::text) END,
        'collaborationRole', CASE WHEN member.allowed AND eh.user_id IS DISTINCT FROM $1 THEN 'cohost' ELSE NULL END
      ) AS data
    FROM event_history eh
    CROSS JOIN LATERAL (SELECT EXISTS (
      SELECT 1 FROM event_collaborators c WHERE c.event_id=eh.id AND c.user_id=$1 AND c.revoked_at IS NULL
        AND coalesce(eh.data->'attachment', 'null'::jsonb)='null'::jsonb
        AND coalesce(eh.data->>'invitedFromScan', 'false')='false'
        AND coalesce(eh.data->>'ownership', '')<>'invited'
        AND coalesce(eh.data->>'createdVia', '') !~* '(ocr|scan|upload|snap)'
    ) AS allowed) member
    WHERE ((eh.user_id=$1 AND ${buildOwnedHistoryStudioVisibilitySql(data)}) OR member.allowed OR (
      lower(trim(coalesce(eh.data->>'status',''))) <> 'draft'
      AND lower(trim(coalesce(eh.data->>'draftStatus',''))) <> 'draft'
      AND EXISTS (SELECT 1 FROM event_shares s WHERE s.event_id=eh.id AND s.recipient_user_id=$1
        AND s.status IN ('pending','accepted') AND s.revoked_at IS NULL)
    )) AND (NOT $5::boolean OR
      ($3::timestamptz IS NULL AND eh.created_at IS NULL AND eh.id<$4::uuid) OR
      ($3::timestamptz IS NOT NULL AND (eh.created_at<$3::timestamptz OR eh.created_at IS NULL OR
        (eh.created_at=$3::timestamptz AND eh.id<$4::uuid))))
    ORDER BY eh.created_at DESC NULLS LAST, eh.id DESC LIMIT $2
  `,
      [
        userId,
        pageSize + 1,
        cursor?.createdAt || null,
        cursor?.id || "00000000-0000-0000-0000-000000000000",
        Boolean(cursor),
      ],
    )
  ).rows;
  const items = rows.slice(0, pageSize);
  const last = items.at(-1);
  const nextCursor =
    rows.length > pageSize && last
      ? Buffer.from(JSON.stringify({ createdAt: last.created_at, id: last.id })).toString(
          "base64url",
        )
      : null;
  return { items, nextCursor };
}
