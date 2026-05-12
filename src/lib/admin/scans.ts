import { query } from "@/lib/db";
import {
  ADMIN_SCAN_SQL,
  daysAgo,
  humanizeCategory,
  tableExists,
  toIsoString,
  toNumber,
} from "./data-utils";

export type AdminScanData = {
  summary: {
    totalScans: number;
    scans7Days: number;
    scans30Days: number;
    uploads: number;
    snaps: number;
    shares: number;
    rsvps: number;
  };
  categories: Array<{ label: string; scans: number }>;
  recentScans: Array<{
    id: string;
    title: string;
    category: string;
    sourceType: string | null;
    createdVia: string | null;
    createdAt: string | null;
  }>;
};

export type AdminScanDataOptions = {
  includeCategories?: boolean;
  includeRecent?: boolean;
  includeEngagementCounts?: boolean;
};

export async function getAdminScanData(
  limit = 12,
  options: AdminScanDataOptions = {},
): Promise<AdminScanData> {
  const includeCategories = options.includeCategories ?? true;
  const includeRecent = options.includeRecent ?? true;
  const includeEngagementCounts = options.includeEngagementCounts ?? true;
  const rsvpsExist = includeEngagementCounts ? await tableExists("rsvp_responses") : false;
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

  const [summary, categories, recent, shares, rsvps] = await Promise.all([
    query<{
      total_scans: string;
      scans_7_days: string;
      scans_30_days: string;
      uploads: string;
      snaps: string;
    }>(
      `select
         count(*) filter (where ${ADMIN_SCAN_SQL})::text as total_scans,
         count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $1::timestamptz)::text as scans_7_days,
         count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $2::timestamptz)::text as scans_30_days,
         count(*) filter (where lower(coalesce(data->'sourceContext'->>'type', '')) in ('upload', 'ocr_text'))::text as uploads,
         count(*) filter (where lower(coalesce(data->'sourceContext'->>'type', '')) = 'snap')::text as snaps
       from event_history`,
      [daysAgo(7), daysAgo(30)],
    ),
    includeCategories
      ? query<{ category: string | null; scans: string }>(
          `select coalesce(nullif(data->>'category', ''), 'Uncategorized') as category,
                  count(*)::text as scans
           from event_history
           where ${ADMIN_SCAN_SQL}
           group by 1
           order by count(*) desc
           limit 8`,
        )
      : Promise.resolve({ rows: [] as Array<{ category: string | null; scans: string }> }),
    includeRecent
      ? query<{
          id: string;
          title: string | null;
          category: string | null;
          source_type: string | null;
          created_via: string | null;
          created_at: Date | string | null;
        }>(
          `select id::text,
                  title,
                  data->>'category' as category,
                  data->'sourceContext'->>'type' as source_type,
                  data->>'createdVia' as created_via,
                  created_at
           from event_history
           where ${ADMIN_SCAN_SQL}
           order by created_at desc nulls last, id desc
           limit $1`,
          [safeLimit],
        )
      : Promise.resolve({
          rows: [] as Array<{
            id: string;
            title: string | null;
            category: string | null;
            source_type: string | null;
            created_via: string | null;
            created_at: Date | string | null;
          }>,
        }),
    includeEngagementCounts
      ? query<{ n: string }>(`select count(*)::text as n from event_shares`)
      : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<ReturnType<typeof query<{ n: string }>>>),
    includeEngagementCounts && rsvpsExist
      ? query<{ n: string }>(`select count(*)::text as n from rsvp_responses`)
      : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<ReturnType<typeof query<{ n: string }>>>),
  ]);

  const row = summary.rows[0];

  return {
    summary: {
      totalScans: toNumber(row?.total_scans),
      scans7Days: toNumber(row?.scans_7_days),
      scans30Days: toNumber(row?.scans_30_days),
      uploads: toNumber(row?.uploads),
      snaps: toNumber(row?.snaps),
      shares: toNumber(shares.rows[0]?.n),
      rsvps: toNumber(rsvps.rows[0]?.n),
    },
    categories: categories.rows.map((entry) => ({
      label: humanizeCategory(entry.category),
      scans: toNumber(entry.scans),
    })),
    recentScans: recent.rows.map((entry) => ({
      id: entry.id,
      title: entry.title || "Untitled scan",
      category: humanizeCategory(entry.category),
      sourceType: entry.source_type || null,
      createdVia: entry.created_via || null,
      createdAt: toIsoString(entry.created_at),
    })),
  };
}
