const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = process.cwd();
const trace = 'artifacts/calendar-sync-pause-2026-09-05';
const updates = new Map();
function edit(file, change) {
  const original = updates.get(file) ?? fs.readFileSync(file, 'utf8');
  const next = change(original.replace(/\r\n/g, '\n'));
  if (next === original.replace(/\r\n/g, '\n')) throw new Error(`No change: ${file}`);
  updates.set(file, original.includes('\r\n') ? next.replace(/\n/g, '\r\n') : next);
}
function replace(source, from, to) {
  if (!source.includes(from)) throw new Error(`Missing anchor: ${from}`);
  return source.replace(from, to);
}
function addImport(source, names, module = '@/config/calendar-sync') {
  const statement = `import { ${names} } from "${module}";\n`;
  return source.startsWith('"use client";')
    ? replace(source, '"use client";\n', `"use client";\n\n${statement}`)
    : statement + source;
}

const providers = ['google', 'outlook'];
for (const provider of providers) {
  for (const suffix of [`events/${provider}`, `events/${provider}/bulk`, `${provider}/insert`]) {
    edit(`src/app/api/${suffix}/route.ts`, source => {
      source = addImport(source, 'getCalendarSyncPauseResponse', '@/lib/calendar-sync-pause');
      return source.replace(/(export async function POST\(request: (?:NextRequest|Request)\) \{\n)/,
        '$1  const pausedResponse = getCalendarSyncPauseResponse();\n  if (pausedResponse) return pausedResponse;\n\n');
    });
  }
  for (const action of ['auth', 'callback']) {
    edit(`src/app/api/${provider}/${action}/route.ts`, source => {
      source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
      return replace(source, 'export async function GET(request: Request) {\n',
        'export async function GET(request: Request) {\n  if (!CONNECTED_CALENDAR_SYNC_ENABLED) {\n    return NextResponse.redirect(new URL("/settings#calendars", request.url));\n  }\n\n');
    });
  }
}
edit('src/app/api/events/calendar/auto/route.ts', source => {
  source = addImport(source, 'getCalendarSyncPauseResponse', '@/lib/calendar-sync-pause');
  return replace(source, 'export async function POST(request: Request) {\n',
    'export async function POST(request: Request) {\n  const pausedResponse = getCalendarSyncPauseResponse();\n  if (pausedResponse) return pausedResponse;\n\n');
});

const creators = [
  'src/components/EventCreateForm.tsx',
  'src/components/EventCreateModal.tsx',
  'src/components/EventCreateWysiwyg.tsx',
  ...['Appointments', 'BabyShowers', 'Birthdays', 'GenderReveal', 'SportEvents']
    .map(name => `src/components/event-create/${name}Create.tsx`),
];
for (const file of creators) {
  edit(file, source => {
    source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
    for (const provider of ['google', 'microsoft']) {
      source = replace(source, `if (selectedCalendars.${provider})`,
        `if (CONNECTED_CALENDAR_SYNC_ENABLED && selectedCalendars.${provider})`);
      source = source.replaceAll(`Boolean(data?.${provider})`,
        `CONNECTED_CALENDAR_SYNC_ENABLED && Boolean(data?.${provider})`);
      source = source.replaceAll(`!!data?.${provider}`,
        `CONNECTED_CALENDAR_SYNC_ENABLED && !!data?.${provider}`);
    }
    return source;
  });
}
edit('src/components/Dashboard.tsx', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
  const start = source.indexOf('        try {\n          const calendarSyncResponse');
  const end = source.indexOf('\n\n        if (typeof window', start);
  if (start < 0 || end < 0) throw new Error('Missing dashboard sync block');
  const block = source.slice(start, end).split('\n').map(line => `  ${line}`).join('\n');
  return source.slice(0, start) + '        if (CONNECTED_CALENDAR_SYNC_ENABLED) {\n' + block + '\n        }' + source.slice(end);
});
edit('src/components/FirstScanCalendarPrompt.tsx', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
  source = replace(source, '    if (calendarSetupProvider || syncStatus',
    '    if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;\n    if (calendarSetupProvider || syncStatus');
  source = replace(source, '    if (!calendarSetupProvider || syncStartedRef.current) return;',
    '    if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;\n    if (!calendarSetupProvider || syncStartedRef.current) return;');
  return replace(source, '  const reconnectCopy =',
    '  if (!CONNECTED_CALENDAR_SYNC_ENABLED) return null;\n\n  const reconnectCopy =');
});
edit('src/app/settings/page.tsx', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED, CALENDAR_SYNC_PAUSED_MESSAGE');
  source = replace(source, '    (provider: ConnectedCalendarProvider) => {\n',
    '    (provider: ConnectedCalendarProvider) => {\n      if (!CONNECTED_CALENDAR_SYNC_ENABLED) return;\n');
  source = replace(source, '                  Connect Google or Outlook for background sync and choose your default calendar.',
    '                  {CONNECTED_CALENDAR_SYNC_ENABLED\n                    ? "Connect Google or Outlook for background sync and choose your default calendar."\n                    : CALENDAR_SYNC_PAUSED_MESSAGE}');
  source = replace(source, '                          disabled={disconnecting}\n                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9cdfa]',
    '                          disabled={disconnecting || !CONNECTED_CALENDAR_SYNC_ENABLED}\n                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9cdfa]');
  source = replace(source, '                          Reconnect\n',
    '                          {CONNECTED_CALENDAR_SYNC_ENABLED ? "Reconnect" : "Sync paused"}\n');
  source = replace(source, '                        onClick={() => handleCalendarConnect(item.key)}\n                        className=',
    '                        onClick={() => handleCalendarConnect(item.key)}\n                        disabled={!CONNECTED_CALENDAR_SYNC_ENABLED}\n                        className=');
  source = replace(source, '                        Connect {item.label}',
    '                        {CONNECTED_CALENDAR_SYNC_ENABLED ? `Connect ${item.label}` : "Sync paused"}');
  // Preserve existing connections and defaults, and keep Disconnect usable during the pause.
  source = replace(source, '            <div className="space-y-4 rounded-2xl border border-[#e5dcff] bg-white p-4 sm:p-5">\n              <p className="text-sm font-medium text-[#2f1d47]">Default calendar</p>',
    '            {CONNECTED_CALENDAR_SYNC_ENABLED && (\n            <div className="space-y-4 rounded-2xl border border-[#e5dcff] bg-white p-4 sm:p-5">\n              <p className="text-sm font-medium text-[#2f1d47]">Default calendar</p>');
  return replace(source, '            </div>\n          </section>\n\n          {/* Security */}',
    '            </div>\n            )}\n          </section>\n\n          {/* Security */}');
});
edit('src/lib/product-marketing-catalog.ts', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
  return replace(source,
    '            "Signed-in owners can connect or disconnect Google Calendar and Outlook background sync from Settings; Apple Calendar uses a one-event ICS handoff.",',
    '            ...(CONNECTED_CALENDAR_SYNC_ENABLED\n              ? ["Signed-in owners can connect or disconnect Google Calendar and Outlook background sync from Settings; Apple Calendar uses a one-event ICS handoff."]\n              : ["Guests can manually save events with calendar links or ICS downloads; these actions do not require a connected calendar account."]),');
});
edit('src/app/faq/page.tsx', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
  const original = '"Live pages can offer Google Calendar, Apple Calendar through an ICS handoff, and Outlook calendar actions. Signed-in owners can connect Google Calendar or Outlook to automatically sync newly scanned events; Apple Calendar uses a one-event ICS save."';
  return replace(source, original, 'CONNECTED_CALENDAR_SYNC_ENABLED\n        ? ' + original + '\n        : "Live pages can offer manual Google Calendar and Outlook links, plus Apple Calendar through an ICS download. Automatic Google and Outlook syncing is temporarily paused. Scanned, uploaded, and newly created events still save to Envitefy."');
});
edit('src/app/privacy/page.tsx', source => {
  source = addImport(source, 'CONNECTED_CALENDAR_SYNC_ENABLED');
  return replace(source, '    title: "6. Google user data and Limited Use",\n    body: [',
    '    title: "6. Google user data and Limited Use",\n    body: [\n      ...(!CONNECTED_CALENDAR_SYNC_ENABLED\n        ? ["Current availability: Google Calendar and Outlook connections and automatic syncing are temporarily paused. Envitefy does not request new calendar permissions or read or write connected calendar events during this pause. Google sign-in, manual calendar links, ICS downloads, and disconnecting existing connections remain available."]\n        : []),');
});

const manifestPath = `${trace}/files.json`;
if (fs.existsSync(manifestPath)) throw new Error('Pause already applied; do not overwrite original snapshots');
const manifest = [];
for (const [file, next] of updates) {
  const before = fs.readFileSync(file);
  const snapshot = `${trace}/before/${file}.snapshot`;
  fs.mkdirSync(path.dirname(snapshot), { recursive: true });
  fs.writeFileSync(snapshot, before);
  manifest.push({ file, beforeSha256: crypto.createHash('sha256').update(before).digest('hex') });
}
fs.writeFileSync(`${trace}/initial-git-status.txt`, spawnSync('git', ['status', '--short'], { encoding: 'utf8' }).stdout);
fs.writeFileSync(`${trace}/initial-head.txt`, spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
const baseline = spawnSync(process.execPath, ['node_modules/@biomejs/biome/bin/biome', 'lint', ...updates.keys(), '--reporter=json'], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
fs.writeFileSync(`${trace}/biome-before.json`, baseline.stdout);
fs.writeFileSync(`${trace}/biome-before.stderr.log`, baseline.stderr);
for (const [file, next] of updates) fs.writeFileSync(file, next);
console.log(`Paused calendar integration in ${updates.size} files. Original working-tree snapshots saved to ${trace}/before.`);
