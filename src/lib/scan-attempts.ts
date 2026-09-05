import { query } from "@/lib/db";
import { scanCounterUpdates } from "@/lib/scan-counters";

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
  diagnosticImageBytes?: Buffer | null;
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

// Compatibility entry point for admin readers: verify availability without DDL.
export async function ensureScanAttemptsSchema(): Promise<void> {
  if (!scanAttemptsSchemaPromise) {
    scanAttemptsSchemaPromise = query('select id, expires_at from scan_attempts limit 0')
      .then(() => undefined)
      .catch((error) => {
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
  // One statement atomically records accounting and durable diagnostic work.
  const inserted = await query<{ user_id: string }>(
    `
      with inserted as (insert into scan_attempts (
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
      returning id, user_id
      ), counted as (
        update users set ${scanCounterUpdates(params.category).join(", ")}
        where id in (select user_id from inserted)
        returning id
      ), queued as (
        insert into scan_diagnostic_jobs(scan_id, image_bytes)
        select id, $14::bytea from inserted where $14::bytea is not null
        on conflict (scan_id) do nothing
        returning scan_id
      )
      select user_id::text from inserted
    `,
    [...values, params.diagnosticImageBytes || null],
  );

  const insertedUserId = inserted.rows[0]?.user_id;
  if (insertedUserId) {
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
