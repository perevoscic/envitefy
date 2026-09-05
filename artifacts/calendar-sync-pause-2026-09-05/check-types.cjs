const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const trace = 'artifacts/calendar-sync-pause-2026-09-05';
const entries = JSON.parse(fs.readFileSync(`${trace}/files.json`, 'utf8'));
const snapshots = new Map(entries.map(({ file }) => [
  path.resolve(file).toLowerCase(),
  fs.readFileSync(`${trace}/before/${file}.snapshot`, 'utf8'),
]));
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
function check(baseline) {
  const options = { ...parsed.options, noEmit: true, incremental: false };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  if (baseline) host.readFile = file => snapshots.get(path.resolve(file).toLowerCase()) ?? read(file);
  const program = ts.createProgram(parsed.fileNames, options, host);
  return ts.getPreEmitDiagnostics(program).map(diagnostic => ({
    file: diagnostic.file ? path.relative(process.cwd(), diagnostic.file.fileName).replaceAll('\\', '/') : null,
    line: diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1 : null,
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  }));
}
const before = check(true);
fs.writeFileSync(`${trace}/types-before.json`, JSON.stringify(before, null, 2));
console.log(`Baseline: ${before.length} TypeScript diagnostics.`);
if (global.gc) global.gc();
const after = check(false);
fs.writeFileSync(`${trace}/types-after.json`, JSON.stringify(after, null, 2));
const key = item => JSON.stringify([item.file, item.code, item.message]);
const counts = new Map();
for (const item of before) counts.set(key(item), (counts.get(key(item)) || 0) + 1);
const added = [];
for (const item of after) {
  const count = counts.get(key(item)) || 0;
  if (count) counts.set(key(item), count - 1);
  else added.push(item);
}
const touched = new Set([...entries.map(entry => entry.file), 'src/config/calendar-sync.ts', 'src/lib/calendar-sync-pause.ts']);
const result = {
  beforeCount: before.length,
  afterCount: after.length,
  addedDiagnostics: added,
  touchedFileDiagnostics: after.filter(item => touched.has(item.file)),
};
fs.writeFileSync(`${trace}/types-comparison.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
process.exitCode = added.length ? 1 : 0;
