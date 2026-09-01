import { incrementUserScanCounters, query } from "@/lib/db";

const MAX_SCAN_ATTEMPT_ID_LENGTH = 120;
const MAX_OCR_TEXT_LENGTH = 100_000;

export type ScanAttemptStatus = "processed" | "saved" | "failed";

export type RecordCompletedScanAttemptParams = {
  scanAttemptId: string;
  email: string;
  title?: string | null;
  category?: string | null;
  sourceType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  ocrSource?: string | null;
  ocrText?: string | null;
  fieldsGuess?: object | null;
  previewBytes?: Buffer | null;
  previewMimeType?: string | null;
};

let scanAttemptsSchemaPromise: Promise<void> | null = null;

function trimText(value: string | null | undefined, maxLength: number): string | null {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function normalizeFieldsGuess(value: object | null | undefined): object {
  if (!value) return {};
  try {
    return JSON.parse(JSON.stringify(value)) as object;
  } catch {
    return {};
  }
}

export async function ensureScanAttemptsSchema(): Promise<void> {
  if (!scanAttemptsSchemaPromise) {
    scanAttemptsSchemaPromise = (async () => {
      await query(`
        create table if not exists scan_attempts (
          id uuid primary key default gen_random_uuid(),
          scan_attempt_id varchar(120) not null,
          user_id uuid not null references users(id) on delete cascade,
          event_id uuid references event_history(id) on delete set null,
          status varchar(24) not null default 'processed',
          title varchar(300),
          category varchar(160),
          source_type varchar(32),
          file_name varchar(512),
          file_size bigint,
          mime_type varchar(160),
          ocr_source varchar(80),
          ocr_text text,
          fields_guess jsonb not null default '{}'::jsonb,
          preview_bytes bytea,
          preview_mime_type varchar(80),
          error_message text,
          created_at timestamptz(6) not null default now(),
          expires_at timestamptz(6) not null default (now() + interval '30 days'),
          completed_at timestamptz(6),
          saved_at timestamptz(6),
          updated_at timestamptz(6) not null default now()
        )
      `);
      await query(`
        alter table scan_attempts
        add column if not exists expires_at timestamptz(6) default (now() + interval '30 days')
      `);
      await query(`
        update scan_attempts
        set expires_at = created_at + interval '30 days'
        where expires_at is null
      `);
      await query(`
        create unique index if not exists idx_scan_attempts_user_attempt_unique
        on scan_attempts(user_id, scan_attempt_id)
      `);
      await query(`
        create index if not exists idx_scan_attempts_user_created_at
        on scan_attempts(user_id, created_at desc)
      `);
      await query(`
        create index if not exists idx_scan_attempts_status_created_at
        on scan_attempts(status, created_at desc)
      `);
      await query(`
        create index if not exists idx_scan_attempts_event_id
        on scan_attempts(event_id)
        where event_id is not null
      `);
      await query(`
        create index if not exists idx_scan_attempts_expires_at
        on scan_attempts(expires_at)
        where expires_at is not null
      `);
    })().catch((error) => {
      scanAttemptsSchemaPromise = null;
      throw error;
    });
  }

  await scanAttemptsSchemaPromise;
}

export async function recordCompletedScanAttempt(
  params: RecordCompletedScanAttemptParams,
): Promise<void> {
  const scanAttemptId = trimText(params.scanAttemptId, MAX_SCAN_ATTEMPT_ID_LENGTH);
  const email = trimText(params.email, 320)?.toLowerCase();
  if (!scanAttemptId || !email) return;

  await ensureScanAttemptsSchema();
  const values = [
    scanAttemptId,
    email,
    trimText(params.title, 300),
    trimText(params.category, 160),
    trimText(params.sourceType, 32),
    trimText(params.fileName, 512),
    Number.isFinite(params.fileSize) ? Math.max(0, Math.floor(params.fileSize || 0)) : null,
    trimText(params.mimeType, 160),
    trimText(params.ocrSource, 80),
    trimText(params.ocrText, MAX_OCR_TEXT_LENGTH),
    JSON.stringify(normalizeFieldsGuess(params.fieldsGuess)),
    params.previewBytes || null,
    trimText(params.previewMimeType, 80),
  ];
  const inserted = await query<{ user_id: string }>(
    `
      insert into scan_attempts (
        scan_attempt_id,
        user_id,
        status,
        title,
        category,
        source_type,
        file_name,
        file_size,
        mime_type,
        ocr_source,
        ocr_text,
        fields_guess,
        preview_bytes,
        preview_mime_type,
        completed_at,
        updated_at
      )
      select
        $1,
        users.id,
        'processed',
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::jsonb,
        $12,
        $13,
        now(),
        now()
      from users
      where lower(users.email) = $2
      on conflict (user_id, scan_attempt_id) do nothing
      returning user_id::text
    `,
    values,
  );

  const insertedUserId = inserted.rows[0]?.user_id;
  if (insertedUserId) {
    await incrementUserScanCounters({ userId: insertedUserId, category: params.category });
    return;
  }

  await query(
    `
      update scan_attempts
      set title = coalesce($3, title),
          category = coalesce($4, category),
          source_type = coalesce($5, source_type),
          file_name = coalesce($6, file_name),
          file_size = coalesce($7, file_size),
          mime_type = coalesce($8, mime_type),
          ocr_source = coalesce($9, ocr_source),
          ocr_text = coalesce($10, ocr_text),
          fields_guess = case when $11::jsonb = '{}'::jsonb then fields_guess else $11::jsonb end,
          preview_bytes = coalesce($12, preview_bytes),
          preview_mime_type = coalesce($13, preview_mime_type),
          completed_at = coalesce(completed_at, now()),
          updated_at = now()
      where scan_attempt_id = $1
        and user_id = (select id from users where lower(email) = $2)
    `,
    values,
  );
}

export async function markScanAttemptSaved(params: {
  scanAttemptId: string;
  userId: string | null;
  eventId: string;
}): Promise<void> {
  const scanAttemptId = trimText(params.scanAttemptId, MAX_SCAN_ATTEMPT_ID_LENGTH);
  if (!scanAttemptId || !params.userId) return;

  await ensureScanAttemptsSchema();
  await query(
    `
      update scan_attempts
      set event_id = $2::uuid,
          status = 'saved',
          saved_at = now(),
          updated_at = now()
      where scan_attempt_id = $1
        and user_id = $3::uuid
    `,
    [scanAttemptId, params.eventId, params.userId],
  );
}
