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
const { normalizeHeroImageSettings } = require('../../lib/hero-image-settings.ts');
const { buildTemplateDraftPayload } = require('../../lib/template-draft-payload.ts');
const noAction = () => {};
const escaped = value => value.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
const rsvpProps = {
  enabled: true, submitted: false, attending: 'yes', setAttending: noAction,
  rosterAthletes: [], selectedAthleteId: '', setSelectedAthleteId: noAction,
  nameInput: 'Taylor', setNameInput: noAction, guestEmailInput: '', setGuestEmailInput: noAction,
  guestPhoneInput: '', setGuestPhoneInput: noAction, isSignedIn: true,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: noAction, onReset: noAction,
};

test('image appearance normalizes fit and position while discarding the old manual tint', () => {
  assert.deepEqual(normalizeHeroImageSettings(undefined), { positionY: 50, fit: 'cover' });
  assert.deepEqual(normalizeHeroImageSettings({ positionY: -30, fit: 'invalid', tint: 90 }), { positionY: 0, fit: 'cover' });
  assert.deepEqual(normalizeHeroImageSettings({ positionY: NaN, fit: 'contain', tint: '50' }), { positionY: 50, fit: 'contain' });
});

test('explicit draft snapshots retain image adjustments through public rendering for all designs', () => {
  for (const design of designs) {
    const appearance = { positionY: 15, fit: 'contain' };
    const payload = buildTemplateDraftPayload({ data: {
      title: 'Uploaded invitation', pageTemplateId: design.id,
      heroImage: '/uploads/original-invitation.webp', heroImageSettings: appearance,
    } }, 'gymnastics', 'America/Chicago');
    const restored = JSON.parse(JSON.stringify(payload));
    const p = props(design);
    p.model = normalizeGymMeetEventData({ eventTitle: restored.title, eventData: restored.data, navItems: [], rosterAthletes: [] });
    assert.deepEqual(p.model.heroImageSettings, appearance, design.id);
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    assert.ok(html.includes('src="/uploads/original-invitation.webp"'), design.id);
    assert.ok(html.includes('object-fit:contain;height:auto;object-position:50% 50%'), design.id);
    assert.ok(html.includes(`flood-color="${design.accent}" flood-opacity="0.55"`), design.id);
    assert.ok(html.includes('template-hero-image'), design.id);
    const filterOff = JSON.parse(JSON.stringify(buildTemplateDraftPayload({ data: {
      ...restored.data, heroImageFilterEnabled: false,
    } }, 'gymnastics', 'America/Chicago')));
    p.model = normalizeGymMeetEventData({ eventTitle: filterOff.title, eventData: filterOff.data, navItems: [], rosterAthletes: [] });
    assert.deepEqual(p.model.heroImageSettings, appearance, design.id);
    assert.equal(p.model.heroImageFilterEnabled, false, design.id);
    const unfiltered = renderToStaticMarkup(React.createElement(Renderer, p));
    assert.ok(unfiltered.includes('--template-image-filter:opacity(1)'), design.id);
    assert.ok(unfiltered.includes('src="/uploads/original-invitation.webp"'), design.id);
    assert.ok(unfiltered.includes('object-fit:contain;height:auto;object-position:50% 50%'), design.id);
    const original = renderToStaticMarkup(React.createElement(Renderer, props(design)));
    assert.ok(original.includes(`flood-color="${design.accent}"`), `${design.id}: tint is automatic`);
  }
});
function props(design, heroImage) {
  return {
    model: normalizeGymMeetEventData({ eventTitle: design.previewTitle, eventData: {
      pageTemplateId: design.id, date: '2028-09-21', time: '09:00', timezone: 'America/Chicago',
      venue: design.sampleVenue, hostGym: design.sampleHost, heroImage,
      details: design.sampleNote, rsvpEnabled: true,
    }, navItems: [], rosterAthletes: [], headerLocation: design.sampleLocation }),
    rsvpProps, isOwner: false, isReadOnly: true,
    onShare: noAction, onGoogleCalendar: noAction, onAppleCalendar: noAction, onOutlookCalendar: noAction,
  };
}
test('60 complete guest pages render unique artwork, titles, meet details, RSVP and calendar actions', () => {
  assert.equal(designs.length, 60);
  const hashes = new Set();
  for (const design of designs) {
    const html = renderToStaticMarkup(React.createElement(Renderer, props(design)));
    assert.equal((html.match(/<h1\b/g) || []).length, 1, design.id);
    assert.ok(html.includes(`data-gym-body="${design.bodyStyle}"`), `${design.id}: editor theme registration surface`);
    for (const value of [design.artwork, design.previewTitle, design.sampleVenue, 'Send RSVP', 'Add to calendar', 'Share']) assert.ok(html.includes(escaped(value)), `${design.id}: ${value}`);
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
  const { FOOTBALL_DESIGNS } = require('../football-season-templates/footballDesigns.ts');
  assert.equal(football.GYM_MEET_TEMPLATE_LIBRARY.length, Object.keys(FOOTBALL_DESIGNS).length);
  assert.equal(football.getGymMeetTemplateMeta('launchpad-editorial').id, 'launchpad-editorial');
  assert.ok(designs.every(d => !football.isGymMeetTemplateId(d.id)));
});

test('every design has a distinct structural layout and panel silhouette, independent of colors and artwork', () => {
  const { GYMNASTICS_PRESENTATIONS } = require('./gymnasticsPresentations.ts');
  assert.deepEqual(Object.keys(GYMNASTICS_PRESENTATIONS).sort(), designs.map(d => d.id).sort());
  const structures = new Set();
  for (const design of designs) {
    const profile = GYMNASTICS_PRESENTATIONS[design.id];
    const signature = `${profile.layout}/${profile.surface}`;
    assert.ok(!structures.has(signature), `${design.id} repeats ${signature}`);
    structures.add(signature);
  }
});

test('all full-page designs retain every supplied section and block and provide working local section links', () => {
  const { orderGymnasticsSections, GYMNASTICS_PRESENTATIONS } = require('./gymnasticsPresentations.ts');
  const sections = [
    { id: 'schedule', label: 'Session schedule', kind: 'schedule', priority: 0, hasContent: true, blocks: [{ id: 'sessions', type: 'text', text: 'Warm-up starts at 8:30 AM.' }] },
    { id: 'overview', label: 'Meet details', kind: 'meet_overview', priority: 1, hasContent: true, blocks: [{ id: 'details', type: 'text', text: 'All Xcel divisions are welcome.' }] },
    { id: 'custom', label: 'Host information', kind: 'custom-host-section', priority: 2, hasContent: true, blocks: [{ id: 'host', type: 'text', text: 'Bring your signed participation form.' }] },
    { id: 'hidden', label: 'Disabled section', kind: 'results', priority: 3, hasContent: false, blocks: [{ id: 'hidden-text', type: 'text', text: 'This section is disabled.' }] },
  ];
  for (const design of designs) {
    const p = props(design);
    p.model.discovery.sections = sections;
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    for (const section of sections.slice(0, 3)) {
      assert.equal(html.split(section.blocks[0].text).length - 1, 1, `${design.id}: ${section.id}`);
    }
    assert.ok(!html.includes('This section is disabled.'), design.id);
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${target}"`), `${design.id}: ${target}`);
    const ordered = orderGymnasticsSections(sections, GYMNASTICS_PRESENTATIONS[design.id].flow);
    assert.equal(ordered[0].id, 'overview');
    assert.equal(sections[0].id, 'schedule', 'presentation must not mutate saved model order');
    assert.equal(ordered.length, sections.length);
  }
});

test('sparse and empty meets render without placeholder sections or empty RSVP sidebars', () => {
  for (const design of designs) {
    const p = props(design);
    p.model.discovery.sections = [];
    p.rsvpProps = { ...rsvpProps, enabled: false };
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    assert.ok(!html.includes('Inside the meet'), design.id);
    assert.ok(!html.includes('Send RSVP'), design.id);
    assert.ok(html.includes('data-has-attendance="false"'), design.id);
    assert.ok(html.includes(design.previewTitle), design.id);
  }
});

test('custom page wording survives explicit saves, design changes and clean guest rendering', () => {
  const wording = { mastheadLeft: 'Our club championship', mastheadRight: '', invitation: 'Come cheer with us', meetDay: 'Competition day', rsvpTitle: 'Join our team', 'section:meet-details:label': 'Before you arrive' };
  for (const design of designs) {
    const payload = buildTemplateDraftPayload({ data: {
      title: 'Spring club meet', createdVia: 'simple-template', pageTemplateId: design.id,
      details: 'Bring a water bottle.\nDoors open at 8 AM.', gymnasticsPageText: wording,
    } }, 'gymnastics', 'America/Chicago');
    const restored = JSON.parse(JSON.stringify(payload));
    const p = props(design);
    p.model = normalizeGymMeetEventData({ eventTitle: restored.title, eventData: restored.data, navItems: [], rosterAthletes: [] });
    assert.deepEqual(p.model.gymnasticsPageText, wording);
    assert.equal(p.model.detailsText, restored.data.details);
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    for (const value of ['Our club championship', 'Come cheer with us', 'Before you arrive', 'Join our team', 'Bring a water bottle.']) assert.ok(html.includes(value), `${design.id}: ${value}`);
    assert.ok(!html.includes('A day to remember'), design.id);
    assert.ok(!html.includes('aria-label="Edit '), `${design.id}: guest controls`);
    const editor = renderToStaticMarkup(React.createElement(Renderer, { ...p, onPageTextChange: noAction }));
    assert.ok(editor.includes('aria-label="Edit event title"'));
    assert.ok(editor.includes('aria-label="Edit event description"'));
    assert.ok(editor.includes('aria-label="Edit meet details section heading"'));
  }
});

test('page wording rejects invalid keys and top-level resets override stale discovery snapshots', () => {
  const { normalizeGymnasticsPageText } = require('../../lib/gymnastics-page-text.ts');
  assert.deepEqual(normalizeGymnasticsPageText({ tagline: '', invitation: 42, eventTitle: 'stale', eventDetails: 'stale', constructor: 'bad', 'block:overview:title': 'Welcome' }), { tagline: '', 'block:overview:title': 'Welcome' });
  assert.deepEqual(normalizeGymnasticsPageText(null), {});
  assert.deepEqual(normalizeGymnasticsPageText([]), {});
  assert.equal(normalizeGymnasticsPageText({ invitation: 'x'.repeat(500) }).invitation.length, 240);
  const model = normalizeGymMeetEventData({ eventTitle: 'Meet', navItems: [], rosterAthletes: [], eventData: {
    createdVia: 'meet-discovery-v2', gymnasticsPageText: {},
    builderDraft: { event: { gymnasticsPageText: { tagline: 'Old wording' } } },
  } });
  assert.deepEqual(model.gymnasticsPageText, {});
});

test('section, block, card and paragraph overrides render without changing section destinations', () => {
  const p = props(designs[0]);
  p.model.gymnasticsPageText = {
    programIndex: 'Plan your day', 'section:overview:label': 'The essentials',
    'block:info:title': 'Ready for the meet', 'block:info:text': 'Pack your bag',
    'card:cards-arrival-0:label': 'Arrival notes', 'card:cards-arrival-0:body': 'Use the east entrance',
    'line:notes-0:text': 'Cheer loudly',
  };
  p.model.discovery.sections = [
    { id: 'overview', label: 'Overview', kind: 'meet_overview', blocks: [
      { id: 'info', type: 'text', title: 'Information', text: 'Old body' },
      { id: 'cards', type: 'card-grid', cards: [{ key: 'arrival', label: 'Arrival', body: 'Old entrance' }] },
      { id: 'notes', type: 'line-list', lines: [{ text: 'Old note' }] },
    ] },
    { id: 'schedule', label: 'Schedule', kind: 'schedule', blocks: [{ id: 'schedule-copy', type: 'text', text: 'Session times' }] },
  ];
  const html = renderToStaticMarkup(React.createElement(Renderer, p));
  for (const text of Object.values(p.model.gymnasticsPageText)) assert.ok(html.includes(text), text);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${target}"`));
  assert.ok(!html.includes('Old body'));
  assert.ok(!html.includes('Old entrance'));
  assert.ok(!html.includes('Old note'));
});

test('navigation, link captions and RSVP wording survive saves with valid guest controls', () => {
  const wording = {
    'section:overview:label': 'Plan your visit', 'action:registration:label': 'Register your athlete',
    rsvpName: 'Family name', rsvpNameHint: 'Type your name here', rsvpGoing: 'Count us in',
    rsvpGoingHelp: 'We will be cheering.', rsvpNotGoing: 'We cannot make it',
    rsvpSubmit: 'Confirm attendance', rsvpConfirmation: 'Thank you for letting us know.',
    rsvpAgain: 'Add another athlete',
  };
  const saved = JSON.parse(JSON.stringify(buildTemplateDraftPayload({data:{gymnasticsPageText:wording}}, 'gymnastics', 'America/Chicago')));
  const { normalizeGymnasticsPageText } = require('../../lib/gymnastics-page-text.ts');
  assert.deepEqual(normalizeGymnasticsPageText(saved.data.gymnasticsPageText), wording);
  const p = props(designs[0]);
  p.model.gymnasticsPageText = saved.data.gymnasticsPageText;
  p.model.discovery.sections = [
    { id:'overview', label:'Overview', kind:'meet_overview', blocks:[{id:'registration', type:'cta', title:'Join the meet', action:{url:'https://example.com/register', label:'Register'}}] },
    { id:'schedule', label:'Schedule', kind:'schedule', blocks:[{id:'schedule-info',type:'text',text:'Meet times'}] },
  ];
  const guest = renderToStaticMarkup(React.createElement(Renderer, p));
  for (const text of ['Plan your visit','Register your athlete','Family name','Type your name here','Count us in','We will be cheering.','Confirm attendance']) assert.ok(guest.includes(text), text);
  assert.ok(guest.includes('href="https://example.com/register"'));
  assert.ok(!guest.includes('aria-label="Edit '));
  const editor = renderToStaticMarkup(React.createElement(Renderer, {...p,onPageTextChange:noAction}));
  for (const label of ['Edit overview navigation label','Edit register button caption','Edit rsvp name placeholder','Edit rsvp button caption']) assert.ok(editor.includes(`aria-label="${label}"`), label);
  for (const match of editor.matchAll(/<(a|button|label)\b[^>]*>[\s\S]*?<\/\1>/g)) assert.ok(!/<(?:button|input|select)\b/.test(match[0].replace(/^<[^>]+>/, '')), 'editing controls must be siblings of interactive elements');
  const confirmed = renderToStaticMarkup(React.createElement(Renderer,{...p,rsvpProps:{...rsvpProps,submitted:true}}));
  assert.ok(confirmed.includes(wording.rsvpConfirmation));
  assert.ok(confirmed.includes(wording.rsvpAgain));
});
