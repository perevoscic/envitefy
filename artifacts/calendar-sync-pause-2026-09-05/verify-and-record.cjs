const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');
const trace = 'artifacts/calendar-sync-pause-2026-09-05';
const manifest = JSON.parse(fs.readFileSync(`${trace}/files.json`, 'utf8'));
const newFiles = ['src/config/calendar-sync.ts', 'src/lib/calendar-sync-pause.ts', 'src/lib/calendar-sync-pause.test.mjs'];
const files = [...manifest.map(entry => entry.file), ...newFiles];
const mode = process.argv[2];
if (mode === 'lint') {
  const result = spawnSync(process.execPath, ['node_modules/@biomejs/biome/bin/biome', 'lint', ...files, '--reporter=json'], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
  fs.writeFileSync(`${trace}/biome-after.json`, result.stdout);
  fs.writeFileSync(`${trace}/biome-after.stderr.log`, result.stderr);
  const before = JSON.parse(fs.readFileSync(`${trace}/biome-before.json`, 'utf8'));
  const after = JSON.parse(result.stdout);
  const key = item => JSON.stringify([item.category, item.severity, item.description, item.location?.path]);
  const counts = new Map();
  for (const item of before.diagnostics) counts.set(key(item), (counts.get(key(item)) || 0) + 1);
  const added = [];
  for (const item of after.diagnostics) {
    const count = counts.get(key(item)) || 0;
    if (count > 0) counts.set(key(item), count - 1);
    else added.push(item);
  }
  const summary = { beforeSummary: before.summary, afterSummary: after.summary, addedDiagnostics: added };
  fs.writeFileSync(`${trace}/biome-comparison.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
} else if (mode === 'vscode') {
  const result = spawnSync(process.execPath, ['scripts/vscode-lint.mjs', ...files.filter(file => /\.tsx?$/.test(file))], { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
  fs.writeFileSync(`${trace}/vscode-lint.log`, result.stdout + result.stderr);
  console.log(JSON.stringify({ exitCode: result.status, output: (result.stdout + result.stderr).slice(-7000) }));
} else if (mode === 'record') {
  let patch = '';
  for (const entry of manifest) {
    const before = `${trace}/before/${entry.file}.snapshot`;
    const result = spawnSync('git', ['diff', '--no-index', '--no-ext-diff', '--no-color', '--', before, entry.file], { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
    if (![0, 1].includes(result.status)) throw new Error(result.stderr);
    patch += result.stdout.replaceAll(`a/${before}`, `a/${entry.file}`);
    entry.afterSha256 = crypto.createHash('sha256').update(fs.readFileSync(entry.file)).digest('hex');
  }
  for (const file of newFiles) {
    const source = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const lines = source.trimEnd().split('\n');
    patch += `diff --git a/${file} b/${file}\nnew file mode 100644\n--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${lines.length} @@\n`;
    patch += lines.map(line => '+' + line).join('\n') + '\n';
  }
  fs.writeFileSync(`${trace}/pause-only.patch`, patch);
  fs.writeFileSync(`${trace}/files.json`, JSON.stringify(manifest, null, 2) + '\n');
  const check = spawnSync('git', ['apply', '--reverse', '--check', `${trace}/pause-only.patch`], { encoding: 'utf8' });
  if (check.status !== 0) throw new Error(check.stderr);
  console.log(`Verified reverse application of the isolated pause patch for ${files.length} files.`);
} else throw new Error('Use lint, vscode, or record');
