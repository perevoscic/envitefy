import "dotenv/config";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { Pool } from "pg";
import {
  isAppOwnedBlobUrl,
  isSiteStaticAssetPath,
  listEventMediaEntries,
  setValueAtPath,
} from "../src/lib/event-media.ts";
import type { UploadResponse } from "../src/lib/upload-config.ts";
import { parseDataUrlBase64 } from "../src/utils/data-url.ts";
import { INLINE_MEDIA_AUDIT_SQL } from "./lib/event-inline-media-audit.ts";
import { inlineMediaPlan } from "./lib/event-media-migration.ts";
import { createPoolFromEnv } from "./lib/pg-from-env.mjs";

type EventRow = {
  id: string;
  user_id: string | null;
  title: string;
  data: any;
  created_at: string | null;
  data_signature: string;
};

type CandidateReport = {
  eventId: string;
  changed: boolean;
  migratedFields: string[];
  skippedFields: string[];
  unsupportedFields: string[];
};

function parseArgs(argv: string[]) {
  const excludeUserIds: string[] = [];
  let apply = false;
  let jsonReport = false;
  let limit = 200;
  let cursor: string | null = null;
  let reportPath: string | null = null;
  let backupDir: string | null = null;
  let privateMediaOrigin: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--report-path" || arg === "--backup-dir" || arg === "--private-media-origin") {
      const next = argv[++index];
      if (!next || next.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      if (arg === "--report-path") reportPath = next;
      else if (arg === "--backup-dir") backupDir = next;
      else privateMediaOrigin = new URL(next).origin;
      continue;
    }
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--dry-run") {
      apply = false;
      continue;
    }
    if (arg === "--json-report") {
      jsonReport = true;
      continue;
    }
    if (arg === "--limit") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --limit");
      limit = Math.max(1, Math.min(1000, Number.parseInt(next, 10) || 200));
      index += 1;
      continue;
    }
    if (arg === "--cursor") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --cursor");
      cursor = next;
      index += 1;
      continue;
    }
    if (arg === "--exclude-user-id") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --exclude-user-id");
      excludeUserIds.push(next);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: node --experimental-strip-types scripts/transport-event-media-to-blob.ts [--dry-run | --apply --backup-dir output/media-backups] [--private-media-origin https://envitefy.com] [--report-path output/media-audit.json] [--json-report] [--limit N] [--cursor <event-id>] [--exclude-user-id <uuid> ...]",
      );
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (argv.includes("--apply") && argv.includes("--dry-run"))
    throw new Error("Choose --apply or --dry-run");
  return {
    apply,
    jsonReport,
    limit,
    cursor,
    excludeUserIds: Array.from(new Set(excludeUserIds)),
    reportPath,
    backupDir,
    privateMediaOrigin,
  };
}

function sanitizeFileName(value: string): string {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "upload"
  );
}

function extensionForMimeType(mimeType: string | null | undefined): string {
  const normalized = String(mimeType || "")
    .trim()
    .toLowerCase();
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "application/pdf") return ".pdf";
  return ".jpg";
}

function cloneData<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function shouldSkipValue(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("data:") || value.startsWith("blob:")) return false;
  if (isSiteStaticAssetPath(value)) return true;
  if (isAppOwnedBlobUrl(value)) return true;
  if (/^https?:\/\//i.test(value)) return true;
  return true;
}

async function readCursorAnchor(pool: Pool, cursor: string | null) {
  if (!cursor) return null;
  const res = await pool.query<{ id: string; created_at: string | null }>(
    `select id, created_at
     from event_history
     where id = $1::uuid
     limit 1`,
    [cursor],
  );
  return res.rows[0] || null;
}

async function migrateRow(
  row: EventRow,
  privateMediaOrigin: string | null,
): Promise<CandidateReport & { nextData: any | null }> {
  if (inlineMediaPlan(row.data).some((entry) => !entry.supported)) {
    return {
      eventId: row.id,
      changed: false,
      migratedFields: [],
      skippedFields: [],
      unsupportedFields: ["unsupported-media"],
      nextData: null,
    };
  }
  const load = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
  const { resolveScanMediaPolicy } = load("src/lib/ocr/scan-media.ts");
  const { isEventDraft } = load("src/lib/event-draft-access.ts");
  const medical = Boolean(resolveScanMediaPolicy(row.data, row.title)?.medical);
  const encryptedOriginal = inlineMediaPlan(row.data).some(
    (entry) => entry.fieldPath === "attachment.dataUrl",
  );
  if (isEventDraft(row.data) || row.data?.accessControl?.requirePasscode) {
    return {
      eventId: row.id,
      changed: false,
      migratedFields: [],
      skippedFields: [],
      unsupportedFields: ["restricted-record: private-media migration required"],
      nextData: null,
    };
  }
  if ((medical || encryptedOriginal) && (!row.user_id || !privateMediaOrigin))
    throw new Error(
      "Original/private media requires an owner and --private-media-origin after deployment",
    );
  if (medical || encryptedOriginal) {
    const { scanOriginalKeyId } = load("src/lib/ocr/private-original.ts");
    const response = await fetch(
      `${privateMediaOrigin}/api/events/${row.id}/private-media/${randomUUID()}`,
      { redirect: "error", signal: AbortSignal.timeout(15000) },
    );
    if (response.status !== 401 || response.headers.get("X-Event-Media-Version") !== "1")
      throw new Error("Deploy private-media delivery before migrating originals/private images");
    if (response.headers.get("X-Event-Media-Key-Id") !== scanOriginalKeyId())
      throw new Error("Local and deployed private-media encryption keys differ; original retained");
  }
  const { processBufferUpload } = load("src/lib/media-upload.ts");
  const { processPrivateScanUpload, readScanOriginalBytes, decryptScanOriginal } = load(
    "src/lib/ocr/private-original.ts",
  );
  const sharp = (await import("sharp")).default;
  const verifyUpload = async (upload: UploadResponse) => {
    for (const asset of [upload.stored.display, upload.stored.thumb, upload.stored.source]) {
      if (!asset) continue;
      const bytes = await readScanOriginalBytes(asset.url);
      if (asset.mimeType === "application/pdf") {
        if (bytes.length !== asset.sizeBytes || bytes.subarray(0, 5).toString() !== "%PDF-")
          throw new Error("Stored PDF verification failed");
        continue;
      }
      const meta = await sharp(bytes).metadata();
      if (
        bytes.length !== asset.sizeBytes ||
        meta.format !== "webp" ||
        meta.width !== asset.width ||
        meta.height !== asset.height
      )
        throw new Error("Stored image verification failed");
      await sharp(bytes).raw().toBuffer();
    }
  };
  const nextData = cloneData(row.data || {});
  const entries = listEventMediaEntries(nextData);
  const migratedFields: string[] = [];
  const skippedFields: string[] = [];
  const unsupportedFields: string[] = [];
  const handledPaths = new Set<string>();

  const attachmentDataEntry = entries.find(
    (entry) => entry.fieldPath === "attachment.dataUrl" && entry.value.startsWith("data:"),
  );
  if (attachmentDataEntry) {
    const parsed = parseDataUrlBase64(attachmentDataEntry.value);
    if (!parsed) {
      unsupportedFields.push(attachmentDataEntry.fieldPath);
    } else {
      try {
        const originalBytes = Buffer.from(parsed.base64Payload, "base64");
        const upload = await processPrivateScanUpload(
          new File([originalBytes], nextData.attachment?.name || "original", {
            type: parsed.mimeType,
          }),
          row.user_id,
        );
        const original = upload.eventMedia.attachment;
        if (
          !original ||
          !decryptScanOriginal(await readScanOriginalBytes(original.dataUrl), row.user_id).equals(
            originalBytes,
          )
        )
          throw new Error("Original verification failed");
        nextData.attachment = { ...nextData.attachment, ...original };
        if (!medical) {
          let displayBytes = originalBytes;
          let displayMimeType = parsed.mimeType;
          if (parsed.mimeType === "application/pdf") {
            const { rasterizePdfPageToPng } = load("src/lib/pdf-raster.ts");
            displayBytes = await rasterizePdfPageToPng(originalBytes, 0);
            if (!displayBytes) throw new Error("Original PDF preview unavailable");
            displayMimeType = "image/png";
          }
          const display = await processBufferUpload({
            bytes: displayBytes,
            fileName: `${row.id}-original${extensionForMimeType(displayMimeType)}`,
            mimeType: displayMimeType,
            usage: "header",
            eventId: `${row.id}-${randomUUID()}`,
          });
          await verifyUpload(display);
          nextData.attachment.previewImageUrl = display.stored.display?.url;
          nextData.attachment.thumbnailUrl = display.stored.thumb?.url;
          if (!nextData.thumbnail) nextData.thumbnail = display.stored.display?.url;
        }
        migratedFields.push(attachmentDataEntry.fieldPath);
        handledPaths.add("attachment.dataUrl");
      } catch (error) {
        unsupportedFields.push(
          `${attachmentDataEntry.fieldPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const replacements = new Map<string, string>();
  for (const entry of entries) {
    if (handledPaths.has(entry.fieldPath)) continue;
    if (shouldSkipValue(entry.value)) {
      skippedFields.push(entry.fieldPath);
      continue;
    }
    if (entry.value.startsWith("blob:")) {
      unsupportedFields.push(`${entry.fieldPath}: browser-object-url`);
      continue;
    }
    const parsed = parseDataUrlBase64(entry.value);
    if (!parsed) {
      unsupportedFields.push(`${entry.fieldPath}: invalid-data-url`);
      continue;
    }
    try {
      const existing = replacements.get(entry.value);
      if (existing) {
        setValueAtPath(nextData, entry.pathSegments, existing);
        migratedFields.push(entry.fieldPath);
        continue;
      }
      if (medical) {
        const bytes = Buffer.from(parsed.base64Payload, "base64");
        const upload = await processPrivateScanUpload(
          new File([bytes], "private-image", { type: parsed.mimeType }),
          row.user_id,
        );
        const asset = upload.eventMedia.attachment;
        if (
          !asset ||
          !decryptScanOriginal(await readScanOriginalBytes(asset.dataUrl), row.user_id).equals(
            bytes,
          )
        )
          throw new Error("Private image verification failed");
        const assetId = randomUUID();
        nextData.privateMedia = { ...nextData.privateMedia, [assetId]: asset };
        const url = `/api/events/${row.id}/private-media/${assetId}`;
        replacements.set(entry.value, url);
        setValueAtPath(nextData, entry.pathSegments, url);
        migratedFields.push(entry.fieldPath);
        continue;
      }
      const upload = await processBufferUpload({
        bytes: Buffer.from(parsed.base64Payload, "base64"),
        fileName: `${sanitizeFileName(`${row.id}-${entry.fieldPath}`)}${extensionForMimeType(parsed.mimeType)}`,
        mimeType: parsed.mimeType,
        usage: parsed.mimeType === "application/pdf" ? "attachment" : "header",
        eventId: `${row.id}-${randomUUID()}`,
      });
      await verifyUpload(upload);
      const url =
        parsed.mimeType === "application/pdf"
          ? upload.eventMedia.attachment?.dataUrl
          : upload.stored.display?.url || upload.eventMedia.thumbnail;
      if (!url) throw new Error("Upload did not return a display URL");
      if (
        parsed.mimeType === "application/pdf" &&
        !(await readScanOriginalBytes(url)).equals(Buffer.from(parsed.base64Payload, "base64"))
      )
        throw new Error("Original verification failed");
      replacements.set(entry.value, url);
      setValueAtPath(nextData, entry.pathSegments, url);
      migratedFields.push(entry.fieldPath);
    } catch (error) {
      unsupportedFields.push(
        `${entry.fieldPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (!unsupportedFields.length && inlineMediaPlan(nextData).length)
    unsupportedFields.push("Transient media remains; original retained");

  return {
    eventId: row.id,
    changed: migratedFields.length > 0,
    migratedFields,
    skippedFields: Array.from(new Set(skippedFields)),
    unsupportedFields,
    nextData: migratedFields.length > 0 ? nextData : null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (
    args.reportPath &&
    !path.resolve(args.reportPath).startsWith(path.resolve("output") + path.sep)
  )
    throw new Error("Reports must stay in output");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const pool = createPoolFromEnv();
  pool.options.connectionTimeoutMillis = 5000;
  const target = new URL(process.env.DATABASE_URL!);
  if (!`${target.hostname}/${target.username}`.includes("ycrswjpgoihaoigzkvxd"))
    throw new Error("Database is not the audited Envitefy project");
  try {
    if (!args.apply) {
      const client = await pool.connect();
      let fields: Array<{ id: string; bytes: number }>;
      try {
        await client.query("BEGIN READ ONLY");
        await client.query("SET LOCAL statement_timeout=20000");
        fields = (await client.query(INLINE_MEDIA_AUDIT_SQL)).rows;
      } finally {
        try {
          await client.query("ROLLBACK");
        } finally {
          client.release();
        }
      }
      const report = {
        mode: "dry-run",
        auditedAt: new Date().toISOString(),
        records: new Set(fields.map((row) => row.id)).size,
        fields,
        embeddedBytes: fields.reduce((sum, row) => sum + row.bytes, 0),
      };
      if (args.reportPath) {
        const reportPath = path.resolve(args.reportPath);
        if (!reportPath.startsWith(path.resolve("output") + path.sep))
          throw new Error("Reports must stay in output");
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      }
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    if (!args.backupDir) throw new Error("Apply requires --backup-dir output/media-backups");
    const backupDir = path.resolve(args.backupDir);
    if (!backupDir.startsWith(path.resolve("output") + path.sep))
      throw new Error("Backups must stay in output");
    await fs.mkdir(backupDir, { recursive: true });
    const load = createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs");
    const { encryptScanOriginal, decryptScanOriginal } = load("src/lib/ocr/private-original.ts");
    const cursorAnchor = await readCursorAnchor(pool, args.cursor);
    const rowsRes = await pool.query<EventRow>(
      `select id, user_id, title, data, created_at, md5(data::text) as data_signature
       from event_history
       where (cardinality($1::uuid[]) = 0 or user_id is null or not (user_id = any($1::uuid[])))
         and data::text ~* 'data:image/|data:application/pdf|blob:'
         and (
           $2::timestamptz is null
           or created_at > $2::timestamptz
           or (created_at = $2::timestamptz and id > $3::uuid)
         )
       order by created_at asc nulls last, id asc
       limit $4`,
      [
        args.excludeUserIds,
        cursorAnchor?.created_at || null,
        cursorAnchor?.id || "00000000-0000-0000-0000-000000000000",
        args.limit,
      ],
    );

    const results: CandidateReport[] = [];
    for (const row of rowsRes.rows) {
      const backup = path.join(backupDir, `${row.id}-${row.data_signature}.bin`);
      const bytes = Buffer.from(JSON.stringify(row.data));
      const encrypted = encryptScanOriginal(bytes, row.user_id || row.id);
      if (!decryptScanOriginal(encrypted, row.user_id || row.id).equals(bytes))
        throw new Error("Backup encryption verification failed");
      try {
        await fs.writeFile(backup, encrypted, { flag: "wx" });
      } catch (error) {
        if (
          (error as NodeJS.ErrnoException).code !== "EEXIST" ||
          !decryptScanOriginal(await fs.readFile(backup), row.user_id || row.id).equals(bytes)
        )
          throw error;
      }
      const migrated = await migrateRow(row, args.privateMediaOrigin);
      const { nextData: _nextData, ...metadata } = migrated;
      results.push(metadata);
      if (
        args.apply &&
        migrated.changed &&
        migrated.nextData &&
        !migrated.unsupportedFields.length
      ) {
        const updated = await pool.query(
          `update event_history set data = $2::jsonb where id = $1::uuid and md5(data::text) = $3 returning id`,
          [row.id, JSON.stringify(migrated.nextData), row.data_signature],
        );
        if (!updated.rowCount) throw new Error("Event changed during migration; original retained");
      }
    }
    const remaining = (await pool.query(INLINE_MEDIA_AUDIT_SQL)).rows;
    for (const result of results.filter((row) => row.changed && !row.unsupportedFields.length)) {
      if (remaining.some((row) => row.id === result.eventId))
        throw new Error("Post-migration audit found transient media");
    }

    const report = {
      mode: args.apply ? "apply" : "dry-run",
      scanned: rowsRes.rows.length,
      changed: results.filter((row) => row.changed && !row.unsupportedFields.length).length,
      unsupported: results.filter((row) => row.unsupportedFields.length > 0).length,
      nextCursor: rowsRes.rows.length ? rowsRes.rows[rowsRes.rows.length - 1]?.id || null : null,
      results,
      remainingRecords: new Set(remaining.map((row) => row.id)).size,
    };
    if (args.reportPath) {
      const reportPath = path.resolve(args.reportPath);
      if (!reportPath.startsWith(path.resolve("output") + path.sep))
        throw new Error("Reports must stay in output");
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    }

    if (args.jsonReport) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report);
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(
    "[transport-event-media-to-blob] failed",
    error instanceof Error ? error.message : "Migration failed",
  );
  process.exitCode = 1;
});
