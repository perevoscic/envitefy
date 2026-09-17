// One-time, explicitly authorized cleanup. No upload folders or inferred paths are deleted.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { list, del, get } = require('@vercel/blob');
const sharp = require('sharp');
Object.assign(process.env, require('dotenv').parse(fs.readFileSync('.env')));
const directory = __dirname;
const read = name => JSON.parse(fs.readFileSync(path.join(directory, name)));
const write = (name, value) => fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const plan = read('replacement-plan.json');
const verification = read('backup-verification.json');
// Keep this outside the catch/save flow so a rerun cannot overwrite the existing receipt.
if (fs.existsSync(path.join(directory, 'deletion-receipt.json'))) {
  throw new Error('Cleanup already has a receipt. Inspect it; do not rerun deletion.');
}
const receipt = { startedAt: new Date().toISOString(), complete: false, scopeCount: 113, deleted: [], failures: [] };
const save = () => {
  write('deletion-receipt.json', receipt);
  fs.writeFileSync(path.join(verification.backupDirectory, 'deletion-receipt.json'), JSON.stringify(receipt, null, 2), { mode: 0o600 });
};
const token = process.env.BLOB_READ_WRITE_TOKEN;
async function inventory() {
  const blobs = [];
  let cursor;
  do {
    const page = await list({ token, limit: 1000, cursor, abortSignal: AbortSignal.timeout(30000) });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}
async function main() {
  assert.equal(plan.authorized, true);
  assert.equal(plan.replacements.length, 113);
  assert.equal(new Set(plan.replacements.map(e => e.oldPath)).size, 113);
  assert.equal(verification.complete, true);
  assert.equal(verification.entries.length, 113);
  assert.equal(verification.failures.length, 0);
  assert.equal(verification.inspection.transparencyCheckPassed, true);
  const verified = new Map(verification.entries.map(e => [e.oldPath, e]));
  for (const mapping of plan.replacements) {
    const entry = verified.get(mapping.oldPath);
    assert(entry && entry.automaticComparisonPassed && entry.sameDimensions);
    assert.match(mapping.oldPath, /^event-media\/upload-[a-f0-9-]+\/header\/source\/(studio-generated-image|event-card-edit)\.png$/);
    assert.equal(mapping.newPath, mapping.oldPath.split('/source/')[0] + '/display.webp');
    assert.equal(entry.newPath, mapping.newPath);
    assert.equal(new URL(mapping.oldUrl).hostname, 'jgkrbpqy79wxqgah.private.blob.vercel-storage.com');
    assert.equal(new URL(mapping.newUrl).hostname, 'jgkrbpqy79wxqgah.private.blob.vercel-storage.com');
    for (const [file, expectedSize, expectedHash] of [
      [entry.originalFile, entry.originalBytes, entry.originalSha256],
      [entry.displayFile, entry.displayBytes, entry.displaySha256],
    ]) {
      assert(path.resolve(file).startsWith(path.resolve(verification.backupDirectory) + path.sep));
      const bytes = fs.readFileSync(file);
      assert.equal(bytes.length, expectedSize);
      assert.equal(hash(bytes), expectedHash);
    }
  }
  // Recheck references within this execution immediately before touching storage.
  execFileSync(process.execPath, [path.join(directory, 'check-references.mjs')], { stdio: 'inherit', timeout: 180000 });
  const database = read('database-reference-check.json');
  const repository = read('repository-reference-check.json');
  assert(database.tablesChecked >= 67 && database.totalMatchingRows === 0);
  assert.equal(repository.matches.length, 0);
  const before = await inventory();
  write('inventory-immediately-before-deletion.json', before);
  const byPath = new Map(before.map(e => [e.pathname, e]));
  const retained = [];
  for (const mapping of plan.replacements) {
    const entry = verified.get(mapping.oldPath);
    const original = byPath.get(mapping.oldPath);
    const display = byPath.get(mapping.newPath);
    const thumb = byPath.get(mapping.newPath.replace('/display.webp', '/thumb.webp'));
    assert(original && display && thumb, 'Required original, display or thumbnail missing');
    assert.equal(original.url, mapping.oldUrl);
    assert.equal(display.url, mapping.newUrl);
    assert.equal(original.size, entry.originalBytes);
    assert.equal(original.etag, entry.originalEtag);
    assert.equal(original.etag, mapping.originalEtag);
    assert.equal(display.size, entry.displayBytes);
    assert.equal(display.etag, entry.displayEtag);
    assert.equal(display.etag, mapping.replacementEtag);
    retained.push(display, thumb);
  }
  receipt.preflight = { backupsRehashed: 226, referencesToUpdate: 0, databaseCheckedAt: database.checkedAt, repositoryCheckedAt: repository.checkedAt, replacementAndThumbnailCount: retained.length };
  receipt.before = { objects: before.length, bytes: before.reduce((s, e) => s + e.size, 0) };
  save();
  console.log('Preflight passed: 113 originals, 226 local backup hashes, 226 retained display/thumbnail objects.');
  for (const mapping of plan.replacements) {
    // ETag condition rejects changed source content; single exact path only.
    await del(mapping.oldPath, { token, ifMatch: mapping.originalEtag, abortSignal: AbortSignal.timeout(30000) });
    receipt.deleted.push({ oldPath: mapping.oldPath, retainedPath: mapping.newPath, bytes: mapping.originalBytes, deletedAt: new Date().toISOString() });
    save();
    if (receipt.deleted.length % 20 === 0) console.log('Deleted backed-up PNGs:', receipt.deleted.length, 'of 113');
  }
  const after = await inventory();
  write('inventory-after.json', after);
  const remaining = new Map(after.map(e => [e.pathname, e]));
  for (const mapping of plan.replacements) assert(!remaining.has(mapping.oldPath), 'Original still listed after deletion');
  for (const expected of retained) {
    const actual = remaining.get(expected.pathname);
    assert(actual, 'Retained asset is missing');
    assert.equal(actual.size, expected.size);
    assert.equal(actual.etag, expected.etag);
  }
  receipt.displayReadChecks = [];
  for (const index of [0, 56, 112]) {
    const entry = verification.entries[index];
    const result = await get(entry.newPath, { token, access: 'private', useCache: false, abortSignal: AbortSignal.timeout(30000) });
    assert(result && result.statusCode === 200 && result.stream);
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    assert.equal(hash(bytes), entry.displaySha256);
    await sharp(bytes, { failOn: 'warning' }).raw().toBuffer();
    receipt.displayReadChecks.push({ path: entry.newPath, originReadPassed: true, sha256Matched: true });
  }
  receipt.after = { objects: after.length, bytes: after.reduce((s, e) => s + e.size, 0) };
  receipt.deletedBytes = receipt.deleted.reduce((s, e) => s + e.bytes, 0);
  receipt.inventoryByteReduction = receipt.before.bytes - receipt.after.bytes;
  receipt.remainingScopedPngs = 0;
  receipt.retainedDisplays = 113;
  receipt.retainedThumbnails = 113;
  receipt.finishedAt = new Date().toISOString();
  receipt.complete = true;
  save();
  console.log(JSON.stringify({ complete: receipt.complete, deleted: receipt.deleted.length, deletedBytes: receipt.deletedBytes, before: receipt.before, after: receipt.after, retainedDisplays: 113, retainedThumbnails: 113 }, null, 2));
}
main().catch(error => {
  receipt.failures.push({ at: new Date().toISOString(), error: error.message });
  save();
  console.error('Cleanup stopped:', error.message);
  process.exitCode = 1;
});
