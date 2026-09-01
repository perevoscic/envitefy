import { ADMIN_USER_METRICS_CTE_SQL } from "@/lib/admin-user-metrics-sql";
import { query } from "@/lib/db";
import { ensureScanAttemptsSchema, type ScanAttemptStatus } from "@/lib/scan-attempts";
import {
  ADMIN_SCAN_SQL,
  daysAgo,
  humanizeCategory,
  tableExists,
  toIsoString,
  toNumber,
} from "./data-utils";

export type AdminScanAttemptSummary = {
  id: string;
  scanAttemptId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  eventId: string | null;
  status: ScanAttemptStatus;
  title: string;
  category: string;
  sourceType: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  ocrSource: string | null;
  hasPreview: boolean;
  createdAt: string | null;
  savedAt: string | null;
};

export type AdminScanAttemptDetail = AdminScanAttemptSummary & {
  ocrText: string | null;
  fieldsGuess: unknown;
  errorMessage: string | null;
  completedAt: string | null;
};

export type AdminScanData = {
  summary: {
    totalScans: number;
    scans7Days: number;
    scans30Days: number;
    savedScans: number;
    unsavedAttempts: number;
    trackedAttempts: number;
    attempts7Days: number;
    uploads: number;
    snaps: number;
    shares: number;
    rsvps: number;
  };
  categories: Array<{ label: string; scans: number }>;
  recentAttempts: AdminScanAttemptSummary[];
  recentScans: Array<{
    id: string;
    title: string;
    category: string;
    userEmail: string | null;
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

type ScanAttemptRow = {
  id: string;
  scan_attempt_id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  event_id: string | null;
  status: ScanAttemptStatus;
  title: string | null;
  category: string | null;
  source_type: string | null;
  file_name: string | null;
  file_size: string | number | null;
  mime_type: string | null;
  ocr_source: string | null;
  has_preview: boolean;
  created_at: Date | string | null;
  saved_at: Date | string | null;
};

function mapScanAttemptRow(row: ScanAttemptRow): AdminScanAttemptSummary {
  const userName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null;
  const fileSize = row.file_size === null ? null : toNumber(row.file_size);
  return {
    id: row.id,
    scanAttemptId: row.scan_attempt_id,
    userId: row.user_id,
    userEmail: row.email,
    userName,
    eventId: row.event_id || null,
    status: row.status,
    title: row.title || "Untitled scan attempt",
    category: humanizeCategory(row.category),
    sourceType: row.source_type || null,
    fileName: row.file_name || null,
    fileSize,
    mimeType: row.mime_type || null,
    ocrSource: row.ocr_source || null,
    hasPreview: Boolean(row.has_preview),
    createdAt: toIsoString(row.created_at),
    savedAt: toIsoString(row.saved_at),
  };
}

export async function getAdminScanData(
  limit = 12,
  options: AdminScanDataOptions = {},
): Promise<AdminScanData> {
  const includeCategories = options.includeCategories ?? true;
  const includeRecent = options.includeRecent ?? true;
  const includeEngagementCounts = options.includeEngagementCounts ?? true;
  const rsvpsExist = includeEngagementCounts ? await tableExists("rsvp_responses") : false;
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  await ensureScanAttemptsSchema();

  const [attemptTotals, savedSummary, trackedSummary, categories, recentAttempts, recent, shares, rsvps] =
    await Promise.all([
      query<{ total_attempts: string }>(`
        ${ADMIN_USER_METRICS_CTE_SQL}
        select coalesce(sum(scans_total), 0)::text as total_attempts
        from admin_users_with_metrics
      `),
      query<{
        saved_scans: string;
        scans_7_days: string;
        scans_30_days: string;
        uploads: string;
        snaps: string;
      }>(
        `select
           count(*) filter (where ${ADMIN_SCAN_SQL})::text as saved_scans,
           count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $1::timestamptz)::text as scans_7_days,
           count(*) filter (where ${ADMIN_SCAN_SQL} and created_at >= $2::timestamptz)::text as scans_30_days,
           count(*) filter (where lower(coalesce(data->'sourceContext'->>'type', '')) in ('upload', 'ocr_text'))::text as uploads,
           count(*) filter (where lower(coalesce(data->'sourceContext'->>'type', '')) = 'snap')::text as snaps
         from event_history`,
        [daysAgo(7), daysAgo(30)],
      ),
      query<{ tracked_attempts: string; attempts_7_days: string }>(
        `select
           count(*)::text as tracked_attempts,
           count(*) filter (where created_at >= $1::timestamptz)::text as attempts_7_days
         from scan_attempts`,
        [daysAgo(7)],
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
        ? query<ScanAttemptRow>(
            `select
               sa.id::text,
               sa.scan_attempt_id,
               sa.user_id::text,
               u.email,
               u.first_name,
               u.last_name,
               sa.event_id::text,
               sa.status,
               sa.title,
               sa.category,
               sa.source_type,
               sa.file_name,
               sa.file_size,
               sa.mime_type,
               sa.ocr_source,
               (sa.preview_bytes is not null) as has_preview,
               sa.created_at,
               sa.saved_at
             from scan_attempts sa
             join users u on u.id = sa.user_id
             order by sa.created_at desc, sa.id desc
             limit $1`,
            [safeLimit],
          )
        : Promise.resolve({ rows: [] as ScanAttemptRow[] }),
      includeRecent
        ? query<{
            id: string;
            title: string | null;
            category: string | null;
            email: string | null;
            source_type: string | null;
            created_via: string | null;
            created_at: Date | string | null;
          }>(
            `select eh.id::text,
                    eh.title,
                    eh.data->>'category' as category,
                    u.email,
                    eh.data->'sourceContext'->>'type' as source_type,
                    eh.data->>'createdVia' as created_via,
                    eh.created_at
             from event_history eh
             left join users u on u.id = eh.user_id
             where ${ADMIN_SCAN_SQL}
             order by eh.created_at desc nulls last, eh.id desc
             limit $1`,
            [safeLimit],
          )
        : Promise.resolve({
            rows: [] as Array<{
              id: string;
              title: string | null;
              category: string | null;
              email: string | null;
              source_type: string | null;
              created_via: string | null;
              created_at: Date | string | null;
            }>,
          }),
      includeEngagementCounts
        ? query<{ n: string }>(`select count(*)::text as n from event_shares`)
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
      includeEngagementCounts && rsvpsExist
        ? query<{ n: string }>(`select count(*)::text as n from rsvp_responses`)
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
    ]);

  const savedRow = savedSummary.rows[0];
  const totalAttempts = toNumber(attemptTotals.rows[0]?.total_attempts);
  const savedScans = toNumber(savedRow?.saved_scans);

  return {
    summary: {
      totalScans: totalAttempts,
      scans7Days: toNumber(savedRow?.scans_7_days),
      scans30Days: toNumber(savedRow?.scans_30_days),
      savedScans,
      unsavedAttempts: Math.max(0, totalAttempts - savedScans),
      trackedAttempts: toNumber(trackedSummary.rows[0]?.tracked_attempts),
      attempts7Days: toNumber(trackedSummary.rows[0]?.attempts_7_days),
      uploads: toNumber(savedRow?.uploads),
      snaps: toNumber(savedRow?.snaps),
      shares: toNumber(shares.rows[0]?.n),
      rsvps: toNumber(rsvps.rows[0]?.n),
    },
    categories: categories.rows.map((entry) => ({
      label: humanizeCategory(entry.category),
      scans: toNumber(entry.scans),
    })),
    recentAttempts: recentAttempts.rows.map(mapScanAttemptRow),
    recentScans: recent.rows.map((entry) => ({
      id: entry.id,
      title: entry.title || "Untitled scan",
      category: humanizeCategory(entry.category),
      userEmail: entry.email || null,
      sourceType: entry.source_type || null,
      createdVia: entry.created_via || null,
      createdAt: toIsoString(entry.created_at),
    })),
  };
}

export async function getAdminScanAttemptById(
  id: string,
): Promise<AdminScanAttemptDetail | null> {
  await ensureScanAttemptsSchema();
  const result = await query<ScanAttemptRow & {
    ocr_text: string | null;
    fields_guess: unknown;
    error_message: string | null;
    completed_at: Date | string | null;
  }>(
    `select
       sa.id::text,
       sa.scan_attempt_id,
       sa.user_id::text,
       u.email,
       u.first_name,
       u.last_name,
       sa.event_id::text,
       sa.status,
       sa.title,
       sa.category,
       sa.source_type,
       sa.file_name,
       sa.file_size,
       sa.mime_type,
       sa.ocr_source,
       sa.ocr_text,
       sa.fields_guess,
       sa.error_message,
       (sa.preview_bytes is not null) as has_preview,
       sa.created_at,
       sa.completed_at,
       sa.saved_at
     from scan_attempts sa
     join users u on u.id = sa.user_id
     where sa.id = $1::uuid
     limit 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...mapScanAttemptRow(row),
    ocrText: row.ocr_text || null,
    fieldsGuess: row.fields_guess ?? {},
    errorMessage: row.error_message || null,
    completedAt: toIsoString(row.completed_at),
  };
}

export async function getAdminScanAttemptPreview(
  id: string,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  await ensureScanAttemptsSchema();
  const result = await query<{ preview_bytes: Buffer | null; preview_mime_type: string | null }>(
    `select preview_bytes, preview_mime_type
     from scan_attempts
     where id = $1::uuid
     limit 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row?.preview_bytes) return null;
  return {
    bytes: row.preview_bytes,
    mimeType: row.preview_mime_type || "image/jpeg",
  };
}
