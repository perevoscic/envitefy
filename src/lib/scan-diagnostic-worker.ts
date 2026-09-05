import sharp from "sharp";
import { query } from "@/lib/db";

type DiagnosticJob = {
  scan_id: string;
  image_bytes: Buffer;
  attempts: number;
  lease_token: string;
};

/** Durable jobs survive response completion, worker crashes and deploys. */
export async function processScanDiagnosticJobs(limit = 3) {
  const result = { completed: 0, failed: 0 };
  await query(`delete from scan_diagnostic_jobs where scan_id in (
    select scan_id from scan_diagnostic_jobs where expires_at <= now() limit 100
  )`);
  const batchSize = Number.isFinite(limit) ? Math.min(5, Math.max(0, Math.floor(limit))) : 3;
  for (let index = 0; index < batchSize; index += 1) {
    const claimed = await query<DiagnosticJob>(`update scan_diagnostic_jobs
      set attempts = attempts + 1, locked_until = now() + interval '2 minutes',
          lease_token = gen_random_uuid()
      where scan_id = (
        select scan_id from scan_diagnostic_jobs
        where available_at <= now() and expires_at > now() and attempts < 6
          and (locked_until is null or locked_until < now())
        order by available_at, scan_id for update skip locked limit 1
      ) returning scan_id::text, image_bytes, attempts, lease_token::text`);
    const job = claimed.rows[0];
    if (!job) break;
    try {
      const preview = await sharp(job.image_bytes)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72, progressive: true })
        .toBuffer();
      // Fence stale workers and commit the preview/removal in a single statement.
      const saved = await query<{ scan_id: string }>(`with saved as (
        update scan_attempts set preview_bytes = $3, preview_mime_type = 'image/jpeg',
          updated_at = now()
        where id = $1::uuid and exists (
          select 1 from scan_diagnostic_jobs where scan_id = $1::uuid
            and lease_token = $2::uuid and locked_until > now() and expires_at > now()
          for update
        ) returning id
      ) delete from scan_diagnostic_jobs where scan_id in (select id from saved)
        and lease_token = $2::uuid returning scan_id::text`,
      [job.scan_id, job.lease_token, preview]);
      result.completed += saved.rows.length;
    } catch {
      const retrySeconds = Math.min(900, 30 * 2 ** (job.attempts - 1));
      await query(`update scan_diagnostic_jobs
        set locked_until = null, lease_token = null,
          available_at = now() + ($3 * interval '1 second'),
          last_error = 'Preview processing failed'
        where scan_id = $1::uuid and lease_token = $2::uuid`,
      [job.scan_id, job.lease_token, retrySeconds]);
      result.failed += 1;
      console.warn("[scan-diagnostics] queued retry", { scanId: job.scan_id, attempts: job.attempts });
    }
  }
  return result;
}
