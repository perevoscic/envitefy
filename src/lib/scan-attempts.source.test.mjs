import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("completed OCR attempts persist private troubleshooting diagnostics once", () => {
  const attempts = readSource("src/lib/scan-attempts.ts");
  const pipeline = readSource("src/lib/ocr/pipeline.ts");
  const legacyIngest = readSource("src/app/api/ingest/route.ts");

  assert.match(attempts, /create table if not exists scan_attempts/);
  assert.match(attempts, /idx_scan_attempts_user_attempt_unique/);
  assert.match(attempts, /preview_bytes bytea/);
  assert.match(attempts, /on conflict \(user_id, scan_attempt_id\) do nothing/);
  assert.match(attempts, /await incrementUserScanCounters\(\{ userId: insertedUserId/);
  assert.match(pipeline, /await recordCompletedScanAttempt\(\{/);
  assert.match(pipeline, /\.jpeg\(\{ quality: 72, progressive: true \}\)/);
  assert.match(pipeline, /ocrText: raw/);
  assert.doesNotMatch(pipeline, /incrementUserScanCounters/);
  assert.match(legacyIngest, /await recordCompletedScanAttempt\(\{/);
  assert.doesNotMatch(legacyIngest, /incrementUserScanCounters/);
});

test("saved events link back to their originating scan attempt", () => {
  const historyRoute = readSource("src/app/api/history/route.ts");
  const directScanRoute = readSource("src/app/api/scan/event-page/route.ts");
  const attempts = readSource("src/lib/scan-attempts.ts");

  assert.match(historyRoute, /await markScanAttemptSaved\(\{/);
  assert.match(directScanRoute, /scanAttemptId = normalizeScanAttemptId\(ocr\.payload\.scanAttemptId\)/);
  assert.match(directScanRoute, /await markScanAttemptSaved\(\{/);
  assert.match(attempts, /set event_id = \$2::uuid/);
  assert.match(attempts, /status = 'saved'/);
});

test("scan previews and diagnostic pages remain admin protected", () => {
  const previewRoute = readSource("src/app/api/admin/scan-attempts/[id]/preview/route.ts");
  const detailPage = readSource("src/app/admin/scans/[id]/page.tsx");
  const scansPage = readSource("src/app/admin/scans/page.tsx");

  assert.match(previewRoute, /await requireAdminSession\(\)/);
  assert.match(previewRoute, /Cache-Control": "private, no-store, max-age=0"/);
  assert.match(previewRoute, /X-Robots-Tag": "noindex, nofollow, noarchive"/);
  assert.match(detailPage, /Private diagnostic content/);
  assert.match(detailPage, /Extracted Text/);
  assert.match(detailPage, /Extracted Fields/);
  assert.match(scansPage, /Recent Scan Attempts/);
  assert.match(scansPage, /Detailed tracking begins with this release/);
});
