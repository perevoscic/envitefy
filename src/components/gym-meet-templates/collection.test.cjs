const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const assert = require('node:assert/strict');
const test = require('node:test');
const crypto = require('node:crypto');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'lucide-react') {
    const file = path.join(process.cwd(), 'node_modules/lucide-react/dist/cjs/lucide-react.js');
    const mod = new Module(file, parent);
    mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod._compile(fs.readFileSync(file, 'utf8'), file);
    return mod.exports;
  }
  return originalLoad.call(this, request, parent, isMain);
};
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  return originalResolve.call(this, request.startsWith('@/') ? path.join(process.cwd(), 'src', request.slice(2)) : request, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
Module._extensions['.css'] = (mod) => { mod.exports = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) }); };
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { GYM_MEET_TEMPLATE_LIBRARY: designs, resolveGymMeetTemplateId } = require('./registry.ts');
const { normalizeGymMeetEventData } = require('./normalizeGymMeetEventData.ts');
const Renderer = require('./GymMeetTemplateRenderer.tsx').default;
const Preview = require('./GymnasticsPreview.tsx').default;
const noAction = () => {};
const escaped = value => value.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
const rsvpProps = {
  enabled: true, submitted: false, attending: 'yes', setAttending: noAction,
  rosterAthletes: [], selectedAthleteId: '', setSelectedAthleteId: noAction,
  nameInput: 'Taylor', setNameInput: noAction, guestEmailInput: '', setGuestEmailInput: noAction,
  guestPhoneInput: '', setGuestPhoneInput: noAction, isSignedIn: true,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: noAction, onReset: noAction,
};
function props(design, heroImage) {
  return {
    model: normalizeGymMeetEventData({ eventTitle: design.previewTitle, eventData: {
      pageTemplateId: design.id, date: '2028-09-21', time: '09:00', timezone: 'America/Chicago',
      venue: design.sampleVenue, hostGym: design.sampleHost, heroImage,
      details: design.sampleNote, rsvpEnabled: true,
    }, navItems: [], rosterAthletes: [], headerLocation: design.sampleLocation }),
    rsvpProps, isOwner: false, isReadOnly: true,
    onShare: noAction, onCalendar: noAction, onGoogleCalendar: noAction, onAppleCalendar: noAction, onOutlookCalendar: noAction,
  };
}
test('60 complete guest pages render unique artwork, titles, meet details, RSVP and calendar actions', () => {
  assert.equal(designs.length, 60);
  const hashes = new Set();
  for (const design of designs) {
    const html = renderToStaticMarkup(React.createElement(Renderer, props(design)));
    assert.equal((html.match(/<h1\b/g) || []).length, 1, design.id);
    for (const value of [design.artwork, design.previewTitle, design.sampleVenue, 'Send RSVP', 'Calendar', 'Share']) assert.ok(html.includes(escaped(value)), `${design.id}: ${value}`);
    const raw = fs.readFileSync(path.join(process.cwd(), 'public', design.artwork));
    assert.equal(raw.toString('ascii', 8, 12), 'WEBP');
    hashes.add(crypto.createHash('sha256').update(raw).digest('hex'));
  }
  assert.equal(hashes.size, 60);
  for (const field of ['id', 'name', 'previewTitle', 'sampleVenue', 'sampleNote', 'artwork']) assert.equal(new Set(designs.map(d => d[field])).size, 60, field);
});
test('custom uploads retain priority and submitted attendance is preserved', () => {
  for (const design of designs) {
    const p = props(design, '/uploads/user-meet.webp');
    p.rsvpProps = { ...rsvpProps, submitted: true };
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    assert.ok(html.includes('/uploads/user-meet.webp'), design.id);
    assert.ok(!html.includes(`src="${design.artwork}"`), design.id);
    assert.ok(html.includes('Attendance updated.'), design.id);
    assert.ok(!html.includes('Send RSVP'), design.id);
  }
});
test('every passive preview uses its own sample meet and the same scene as the guest page', () => {
  for (const design of designs) {
    const html = renderToStaticMarkup(React.createElement(Preview, { design }));
    assert.ok(html.includes(`data-design="${design.id}"`), design.id);
    assert.ok(html.includes(escaped(design.sampleVenue)), design.id);
    assert.ok(!html.includes('Send RSVP'), design.id);
  }
});
test('all 60 compositions have distinct geometry and framing, with local typefaces', () => {
  const css = fs.readFileSync(path.join(__dirname, 'gymnastics-collection.module.css'), 'utf8');
  const signatures = new Set();
  for (const d of designs) {
    const rules = css.split('\n').filter(line => line.startsWith(`.scene[data-design="${d.id}"]`)).join('\n');
    assert.ok(rules.includes('grid-column'), d.id);
    signatures.add(rules.replaceAll(d.id, 'DESIGN'));
  }
  assert.equal(signatures.size, 60);
  const fonts = fs.readFileSync(path.join(__dirname, 'collection-fonts.css'), 'utf8');
  for (const [, file] of fonts.matchAll(/url\("([^"]+)"\)/g)) assert.ok(fs.existsSync(path.join(process.cwd(), 'public', file)), file);
});
test('retired IDs safely use the replacement collection; football retains its independent collection', () => {
  assert.equal(resolveGymMeetTemplateId({ pageTemplateId: 'launchpad-editorial' }), 'airborne-atlas');
  assert.equal(resolveGymMeetTemplateId({ pageTemplateId: 'neon-runway' }), 'neon-runway');
  const football = require('../football-season-templates/registry.ts');
  assert.equal(football.GYM_MEET_TEMPLATE_LIBRARY.length, 37);
  assert.equal(football.getGymMeetTemplateMeta('launchpad-editorial').id, 'launchpad-editorial');
  assert.ok(designs.every(d => !football.isGymMeetTemplateId(d.id)));
});
