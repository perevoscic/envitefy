import { query } from "@/lib/db";
import { ADMIN_SCAN_SQL, daysAgo, toIsoString, toNumber } from "./data-utils";

export type AdminUsersSummary = {
  totalUsers: number;
  newUsers7Days: number;
};

export type AdminUserDebugLinkKind = "events" | "scans";

export type AdminUserDebugLink = {
  id: string;
  title: string | null;
  category: string | null;
  publicSlug: string | null;
  primaryOutput: string | null;
  createdVia: string | null;
  sourceType: string | null;
  createdAt: string | null;
};

export async function getAdminUsersSummary(): Promise<AdminUsersSummary> {
  const [total, new7] = await Promise.all([
    query<{ n: string }>(`select count(*)::text as n from users`),
    query<{ n: string }>(
      `select count(*)::text as n from users where created_at >= $1::timestamptz`,
      [daysAgo(7)],
    ),
  ]);

  return {
    totalUsers: toNumber(total.rows[0]?.n),
    newUsers7Days: toNumber(new7.rows[0]?.n),
  };
}

export async function getAdminUserDebugLinks(
  userId: string,
  kind: AdminUserDebugLinkKind,
  limit = 20,
): Promise<AdminUserDebugLink[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const scanFilter = kind === "scans" ? `and ${ADMIN_SCAN_SQL}` : "";

  const result = await query<{
    id: string;
    title: string | null;
    category: string | null;
    public_slug: string | null;
    primary_output: string | null;
    created_via: string | null;
    source_type: string | null;
    created_at: Date | string | null;
  }>(
    `
      select
        id::text,
        title,
        nullif(data->>'category', '') as category,
        coalesce(
          nullif(public_slug, ''),
          nullif(data->>'publicSlug', ''),
          nullif(data->>'public_slug', '')
        ) as public_slug,
        coalesce(
          nullif(data->>'primaryOutput', ''),
          nullif(data->>'productType', ''),
          nullif(data->>'publicRenderer', ''),
          nullif(data->'publicEvent'->>'primaryOutput', ''),
          nullif(data->'publicEvent'->>'renderer', '')
        ) as primary_output,
        nullif(data->>'createdVia', '') as created_via,
        nullif(data->'sourceContext'->>'type', '') as source_type,
        created_at
      from event_history
      where user_id = $1::uuid
      ${scanFilter}
      order by created_at desc nulls last, id desc
      limit $2
    `,
    [userId, safeLimit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title || null,
    category: row.category || null,
    publicSlug: row.public_slug || null,
    primaryOutput: row.primary_output || null,
    createdVia: row.created_via || null,
    sourceType: row.source_type || null,
    createdAt: toIsoString(row.created_at),
  }));
}
