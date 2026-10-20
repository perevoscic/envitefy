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
const { saveTemplateDraftToAccount } = require('../../lib/template-draft-handoff.ts');
const {
  GYMNASTICS_TITLE_FONTS, normalizeGymnasticsTitleFont, gymnasticsTitleFontFamily,
} = require('../../lib/gymnastics-title-font.ts');
const noAction = () => {};

test('travel presentation omits source photos and retains place names, booking parameters and a compact attributed map', () => {
  const Content = require('./GymMeetDiscoveryContent.tsx').default;
  const url = 'https://booking.example.org/rooms?group=MEET&key=AbC#reserve';
  const model = { discovery: { sections: [{ id: 'hotels', label: 'Visit', hasContent: true, blocks: [
    { id: 'hotel-cards', type: 'card-grid', cards: [
      { key: 'one', label: 'River Hotel', imageUrl: 'https://cdn.example.org/river.webp', presentation: 'hotel', highlights: [{ label: 'Nightly rate', value: '$194' }], details: [{ label: 'Address', value: '100 River Road' }], action: { label: 'Book Hotel', url } },
      { key: 'two', label: 'No Photo Inn', presentation: 'hotel', body: 'Breakfast is included.', meta: 'Five minutes from the venue', action: { label: 'Book Hotel', url } },
    ] },
    { id: 'attraction-cards', type: 'card-grid', cards: [{ key: 'park', label: 'River Park', imageUrl: 'https://cdn.example.org/park.webp', body: 'Walk beside the river.', action: { label: 'Learn more', url: 'https://park.example.org/' } }] },
    { id: 'arrival', type: 'map', title: 'Arrival Map', address: '100 River Road' },
  ] }] } };
  const html = renderToStaticMarkup(React.createElement(Content, { model, variant: { sectionClass: 'panel', summaryCardClass: 'detailCard', secondaryButtonClass: 'button' } }));
  assert.ok(!html.includes('https://cdn.example.org/river.webp'));
  assert.ok(!html.includes('https://cdn.example.org/park.webp'));
  assert.ok(html.includes(escaped(url)));
  assert.ok(html.includes('River Hotel') && html.includes('No Photo Inn') && html.includes('100 River Road') && html.includes('$194'));
  assert.ok(html.includes('Breakfast is included.') && html.includes('Five minutes from the venue'));
  assert.ok(html.includes('River Park') && html.includes('Walk beside the river.'));
  assert.ok(html.includes('https://park.example.org/'));
  assert.equal((html.match(/data-place-card="true"/g) || []).length, 3);
  assert.ok(html.includes('width=600&amp;height=260'));
  assert.ok(html.includes('Directions'));
});
test('imported identity retains the template photo and source palette while original artwork is pending', () => {
  const { createImportedEventTheme } = require('../../lib/imported-event-theme.ts');
  const importedTheme = createImportedEventTheme({ title: 'Coastal Invitational', sport: 'gymnastics', city: 'Savannah', seed: 'coastal/2027', branding: { version: 1, origin: 'pdf', colors: ['#0c6478', '#e29327'] } });
  const eventData = JSON.parse(JSON.stringify({ title: 'Coastal Invitational', pageTemplateId: designs[0].id, importedTheme }));
  const model = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData, navItems: [], rosterAthletes: [] });
  const html = renderToStaticMarkup(React.createElement(Renderer, { ...props(designs[0]), model }));
  assert.ok(html.includes(`data-imported-theme="${importedTheme.id}"`));
  assert.ok(html.includes('--gym-accent:#0c6478'));
  assert.ok(html.includes(designs[0].artwork));
  assert.ok(!html.includes('data:image/svg+xml'));
});

test('a fresh unsaved import renders completed canonical artwork instead of its stale builder theme', () => {
  const { createImportedEventTheme } = require('../../lib/imported-event-theme.ts');
  const importedTheme = createImportedEventTheme({ title: 'Riverside Meet', sport: 'gymnastics', seed: 'riverside/2031' });
  const ready = { ...importedTheme, artworkUrl: '/api/blob/event-media/meet/verified.webp' };
  const eventData = JSON.parse(JSON.stringify({ title: 'Riverside Meet', createdVia: 'meet-discovery-v2',
    pageTemplateId: designs[0].id, importedTheme: ready,
    builderDraft: { event: { title: 'Riverside Meet', importedTheme }, venue: {} },
    publicArtifacts: { sections: {}, quickAccess: [] }, pipelineSummary: { discoveryId: 'import' },
  }));
  const model = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData, navItems: [], rosterAthletes: [] });
  assert.equal(model.importedTheme.artworkUrl, ready.artworkUrl);
  const html = renderToStaticMarkup(React.createElement(Renderer, { ...props(designs[0]), model }));
  assert.ok(html.includes('/media/event-media/meet/verified.webp'));
  assert.ok(!html.includes(`src="${ready.artworkUrl}"`));
  assert.ok(html.includes('alt="Original gymnastics event artwork"'));
  assert.ok(!html.includes('data:image/svg+xml'));
  const disabled = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData: { ...eventData, importedTheme: null }, navItems: [], rosterAthletes: [] });
  assert.equal(disabled.importedTheme, null);
});
test('football hero and imported theme controls render the shared sport design without provider calls', () => {
  const { createImportedEventTheme } = require('../../lib/imported-event-theme.ts');
  const Hero = require('../football-season-templates/FootballHero.tsx').default;
  const Controls = require('../event-create/ImportedThemeControls.tsx').default;
  const importedTheme = createImportedEventTheme({ title: 'Coastal Lions', sport: 'football', city: 'Tampa', seed: 'lions/2027' });
  const html = renderToStaticMarkup(React.createElement(Hero, { title: 'Coastal Lions', importedTheme }));
  assert.ok(!html.includes('data:image/svg+xml'));
  assert.ok(html.includes('Event Athletic'));
  const controls = renderToStaticMarkup(React.createElement(Controls, { value: importedTheme, onChange: noAction }));
  assert.ok(controls.includes('Redesign'));
  assert.ok(controls.includes('Use template style'));
  const original = renderToStaticMarkup(React.createElement(Hero, { title: 'Coastal Lions', importedTheme, heroSrc: '/uploads/original.webp' }));
  assert.ok(original.includes('/uploads/original.webp'));
  assert.ok(!original.includes('data:image/svg+xml'));
});
const escaped = value => value.replaceAll('&', '&amp;').replaceAll("'", '&#x27;');
const rsvpProps = {
  enabled: true, submitted: false, attending: 'yes', setAttending: noAction,
  rosterAthletes: [], selectedAthleteId: '', setSelectedAthleteId: noAction,
  nameInput: 'Taylor', setNameInput: noAction, guestEmailInput: '', setGuestEmailInput: noAction,
  guestPhoneInput: '', setGuestPhoneInput: noAction, isSignedIn: true,
  allowGuestAttendanceRsvp: false, submitting: false, onSubmit: noAction, onReset: noAction,
};

function websiteImportFixture() {
  return {
    version: 1, eventYear: 2027, sources: [],
    coverage: [
      { section: 'participatingClubs', status: 'collected', sourceUrls: ['https://meet.test/competing-teams'], reason: 'Collected from the event website.' },
      { section: 'schedule', status: 'unavailable', sourceUrls: ['https://meet.test/schedule'], reason: 'The official schedule is not yet published.' },
    ],
    participatingClubs: [{ name: 'Coastal Gym', location: 'Atlanta, GA', year: 2027, sourceUrl: 'https://meet.test/competing-teams' }],
    attractions: [{ name: 'City Aquarium', description: 'Explore the exhibits.', url: 'https://aquarium.test/tickets?offer=meet', sourceUrl: 'https://meet.test/plan-your-visit' }],
    schedule: { status: 'not_posted', notice: '2027 schedule not yet published.', links: [{ label: 'Official schedule', url: 'https://meet.test/schedule' }] },
  };
}

test('website import sections survive explicit JSON reload and render in the guest page without changing the venue', () => {
  const eventData = JSON.parse(JSON.stringify({
    title: '2027 club meet', createdVia: 'meet-discovery-v2', pageTemplateId: designs[0].id,
    venue: 'Competition Center', address: '2000 Convention Center Concourse',
    discoverySource: { websiteImport: websiteImportFixture() },
  }));
  const model = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData, navItems: [], rosterAthletes: [] });
  assert.equal(model.venue, 'Competition Center');
  for (const [id, expected] of [
    ['participating-clubs', ['Search participating clubs', 'Coastal Gym', 'Atlanta, GA', 'https://meet.test/competing-teams']],
    ['attractions', ['City Aquarium', 'Explore the exhibits.', 'https://aquarium.test/tickets?offer=meet']],
    ['schedule-availability', ['2027 schedule not yet published.', 'https://meet.test/schedule']],
  ]) {
    assert.ok(model.discovery.sections.some(section => section.id === id), id);
    const html = renderToStaticMarkup(React.createElement(Renderer, { ...props(designs[0]), model: { ...model, discovery: { sections: model.discovery.sections.filter(section => section.id === id) } } }));
    for (const text of expected) assert.ok(html.includes(text), `${id}: ${text}`);
    assert.ok(!html.includes('Edit event'), `${id}: clean guest view`);
  }
});

test('website import coverage distinguishes not published from failed without claiming all sources succeeded', () => {
  const Coverage = require('../event-create/WebsiteImportCoverage.tsx').default;
  const website = websiteImportFixture();
  website.coverage.push({ section: 'hotels', status: 'failed', sourceUrls: ['https://meet.test/host-hotels'], reason: 'Fetch failed (503)' });
  const html = renderToStaticMarkup(React.createElement(Coverage, { value: website }));
  for (const text of ['1 collected', '1 not published', 'Not published', 'Could not load', 'Fetch failed (503)', 'https://meet.test/host-hotels']) assert.ok(html.includes(text), text);
  assert.equal(renderToStaticMarkup(React.createElement(Coverage, { value: null })), '');
});

test('website import pages share grouped tabs across every gymnastics design', () => {
  for (const design of designs) {
    const eventData = { title: 'Community club meet', createdVia: 'meet-discovery-v2', pageTemplateId: design.id,
      venue: 'Riverside Sports Centre', date: '2027-05-14',
      advancedSections: { logistics: { hotelInfo: 'River Hotel offers a $150 group rate. Reserve by April 20.', hotels: [{ name: 'River Hotel', bookingUrl: 'https://hotel.test/book?group=MEET#reserve' }] } },
      discoverySource: { websiteImport: websiteImportFixture() } };
    const model = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData, navItems: [], rosterAthletes: [] });
    const html = renderToStaticMarkup(React.createElement(Renderer, { ...props(design), model }));
    assert.ok(html.includes('role="tablist"'), design.id);
    for (const label of ['Overview', 'Schedule', 'Teams', 'Venue & Parking', 'Hotels', 'Explore'])
      assert.ok(html.includes(`aria-label="${escaped(label)}"`), `${design.id}: ${label}`);
    assert.ok(!html.includes('aria-label="Visit"'), `${design.id}: no combined Visit tab`);
    assert.ok(html.includes('role="tabpanel"'), design.id);
    assert.ok(html.includes('hidden="" style="display:none"'), `${design.id}: inactive content is hidden`);
    assert.ok(!html.includes('aria-label="All sections"'), `${design.id}: editing-only control stays private`);
  }
});

test('website import admission keeps daily and weekend prices separate for each audience', () => {
  const eventData = { title: 'Community club meet', createdVia: 'meet-discovery-v2',
    discoverySource: { websiteImport: websiteImportFixture(), parseResult: { admission: [
      { label: 'Adult daily admission', price: '$20 per day', note: 'Cash only.' },
      { label: 'Children ages 6–12 daily admission', price: '$15 per day', note: 'Cash only.' },
      { label: 'Adult weekend pass', price: '$30', note: 'Cash only.' },
      { label: 'Children ages 6–12 weekend pass', price: '$20', note: 'Cash only.' },
    ] } } };
  const model = normalizeGymMeetEventData({ eventTitle: eventData.title, eventData, navItems: [], rosterAthletes: [] });
  const cards = model.discovery.sections.find(section => section.id === 'admission').blocks.find(block => block.id === 'admission-cards').cards;
  assert.deepEqual(cards.map(({ label, value }) => ({ label, value })), [
    { label: 'Adults · Daily admission', value: 'Cash $20' },
    { label: 'Children (6-12) · Daily admission', value: 'Cash $15' },
    { label: 'Adults · Weekend pass', value: 'Cash $30' },
    { label: 'Children (6-12) · Weekend pass', value: 'Cash $20' },
  ]);
});

test('image appearance normalizes fit and position while discarding the old manual tint', () => {
  assert.deepEqual(normalizeHeroImageSettings(undefined), { positionY: 50, fit: 'cover' });
  assert.deepEqual(normalizeHeroImageSettings({ positionY: -30, fit: 'invalid', tint: 90 }), { positionY: 0, fit: 'cover' });
  assert.deepEqual(normalizeHeroImageSettings({ positionY: NaN, fit: 'contain', tint: '50' }), { positionY: 50, fit: 'contain' });
});

test('title font choices are limited to bundled collection fonts and preserve design defaults', () => {
  const css = fs.readFileSync(path.join(__dirname, 'collection-fonts.css'), 'utf8');
  for (const font of GYMNASTICS_TITLE_FONTS) {
    assert.equal(normalizeGymnasticsTitleFont(font.id), font.id);
    assert.equal(gymnasticsTitleFontFamily(font.id), font.fontFamily);
    const family = font.fontFamily.match(/^"([^"]+)"/)[1];
    assert.ok(css.includes(`font-family: "${family}"`), `${font.id}: collection font is loaded`);
  }
  for (const value of [undefined, null, '', 'unknown', '"Injected Font"', {}, 1]) {
    assert.equal(normalizeGymnasticsTitleFont(value), '');
    assert.equal(gymnasticsTitleFontFamily(value), undefined);
  }
  for (const design of designs) {
    const p = props(design);
    assert.equal(p.model.gymnasticsTitleFont, '', design.id);
    const native = renderToStaticMarkup(React.createElement(Renderer, p)).match(/<h1\b[^>]*>/)[0];
    assert.ok(!native.includes('font-family:'), `${design.id}: default retains the design font`);
  }
  for (const [selected, expected] of [['', ''], ['unknown', ''], ['orbitron', 'orbitron']]) {
    const model = normalizeGymMeetEventData({ eventTitle: 'Meet', navItems: [], rosterAthletes: [], eventData: {
      createdVia: 'meet-discovery-v2', gymnasticsTitleFont: selected, fontId: 'inter',
      builderDraft: { event: { gymnasticsTitleFont: 'anton' } },
    } });
    assert.equal(model.gymnasticsTitleFont, expected, 'the top-level selection overrides a stale discovery font');
  }
});

test('selected title fonts survive explicit account saves and reloads across all designs', async () => {
  for (const [index, design] of designs.entries()) {
    const font = GYMNASTICS_TITLE_FONTS[index % GYMNASTICS_TITLE_FONTS.length];
    const snapshot = { data: {
      title: 'Spring club meet', pageTemplateId: design.id,
      gymnasticsTitleFont: font.id, fontId: 'inter',
      createdVia: 'meet-discovery-v2',
      builderDraft: { event: { gymnasticsTitleFont: 'anton' } },
    } };
    const payload = buildTemplateDraftPayload(snapshot, 'gymnastics', 'America/Chicago');
    assert.equal(payload.data.gymnasticsTitleFont, font.id, `${design.id}: draft payload`);
    let saved;
    const draft = {
      version: 1, id: `font-${design.id}`, category: 'gymnastics', templateId: design.id,
      updatedAt: Date.now(), snapshot, assets: {}, eventId: `saved-${design.id}`, eventRevision: 'v1',
    };
    await saveTemplateDraftToAccount({
      draft, payload, category: 'gymnastics', templateId: design.id,
      status: 'published', authenticated: true, remoteMedia: {},
      request: async (url, options) => {
        assert.equal(url, `/api/history/saved-${design.id}`);
        assert.equal(options.method, 'PATCH');
        saved = JSON.parse(options.body);
        return Response.json({ id: draft.eventId, revision: 'v2', title: saved.title, data: saved.data });
      },
    });
    assert.equal(saved.data.gymnasticsTitleFont, font.id, `${design.id}: top-level account value`);
    assert.equal(saved.data.templateEditor.snapshot.data.gymnasticsTitleFont, font.id, `${design.id}: recovery snapshot`);
    const restored = JSON.parse(JSON.stringify(saved));
    const p = props(design);
    p.model = normalizeGymMeetEventData({ eventTitle: restored.title, eventData: restored.data, navItems: [], rosterAthletes: [] });
    assert.equal(p.model.gymnasticsTitleFont, font.id, `${design.id}: reloaded selection`);
    const heading = renderToStaticMarkup(React.createElement(Renderer, p)).match(/<h1\b[^>]*>/)[0];
    assert.ok(heading.includes(`font-family:${font.fontFamily.replaceAll('"', '&quot;')}`), `${design.id}: rendered font override`);
    const defaultSnapshot = { data: { ...restored.data, gymnasticsTitleFont: '' } };
    const defaults = JSON.parse(JSON.stringify(buildTemplateDraftPayload(defaultSnapshot, 'gymnastics', 'America/Chicago')));
    assert.equal(defaults.data.gymnasticsTitleFont, '', `${design.id}: explicit default survives saving`);
    p.model = normalizeGymMeetEventData({ eventTitle: defaults.title, eventData: defaults.data, navItems: [], rosterAthletes: [] });
    assert.equal(p.model.gymnasticsTitleFont, '', `${design.id}: saved default wins over stale V2 font`);
    const defaultHeading = renderToStaticMarkup(React.createElement(Renderer, p)).match(/<h1\b[^>]*>/)[0];
    assert.ok(!defaultHeading.includes('font-family:'), `${design.id}: resetting restores native typography`);
  }
});

test('hero fact values preserve canonical clears, missing-field fallbacks and latest discovery edits', () => {
  const normalize = (eventData, mapAddress) => normalizeGymMeetEventData({
    eventTitle: 'Meet', eventData, mapAddress, navItems: [], rosterAthletes: [],
  });
  const stale = {
    createdVia: 'meet-discovery-v2', date: '2026-03-06', time: '09:00',
    builderDraft: {
      event: { venue: 'Old arena', address: '100 Old Street', customFields: { meetDateRangeLabel: 'March 6-8, 2026' } },
      venue: { venue: 'Old arena', address: '100 Old Street' },
    },
    discoverySource: { parseResult: { address: '200 Parsed Street' } },
  };
  const latest = normalize({
    ...stale, venue: 'New arena', address: '300 New Street',
    customFields: { meetDateRangeLabel: 'March 7-9, 2027' },
  }, '400 Map Street');
  assert.equal(latest.authoredVenue, 'New arena');
  assert.equal(latest.venue, 'New arena');
  assert.equal(latest.authoredAddress, '300 New Street');
  assert.equal(latest.address, '300 New Street');
  assert.equal(latest.authoredDateLabel, 'March 7-9, 2027');
  assert.equal(latest.dateLabel, 'March 7-9, 2027');
  const cleared = normalize({ ...stale, venue: '', address: '', customFields: { meetDateRangeLabel: '' } }, '400 Map Street');
  assert.equal(cleared.authoredVenue, '');
  assert.equal(cleared.venue, '');
  assert.equal(cleared.authoredAddress, '');
  assert.equal(cleared.address, '');
  assert.equal(cleared.mapAddress, '');
  assert.equal(cleared.authoredDateLabel, '');
  assert.match(cleared.dateLabel, /Mar 6, 2026/, 'clearing Display Date restores the calendar date');
  const missing = normalize({ date: '2026-03-06', discoverySource: { parseResult: { address: '200 Parsed Street' } } }, '400 Map Street');
  assert.equal(missing.authoredAddress, undefined);
  assert.equal(missing.address, '200 Parsed Street');
  assert.equal(normalize({}, '400 Map Street').address, '400 Map Street');
  assert.equal(normalize({ extra: { meetDateRangeLabel: 'March 7-9, 2027' } }).authoredDateLabel, 'March 7-9, 2027', 'browser drafts retain the existing extra field');
  assert.equal(stale.builderDraft.venue.address, '100 Old Street', 'normalization does not mutate saved discovery snapshots');
  const p = props(designs[0]);
  p.model = normalize({ venue: 'Main Arena Main Arena', address: '333 Franklin St, 333 Franklin St' });
  assert.equal(p.model.authoredVenue, 'Main Arena Main Arena', 'editing retains the canonical input');
  assert.equal(p.model.venue, 'Main Arena');
  assert.equal(p.model.address, '333 Franklin St');
  const guestFacts = renderToStaticMarkup(React.createElement(Renderer, p)).match(/<dl class="facts">[\s\S]*?<\/dl>/)[0];
  assert.ok(!guestFacts.includes('Main Arena Main Arena'), 'guest facts retain duplicate-venue cleanup');
  assert.ok(!guestFacts.includes('333 Franklin St, 333 Franklin St'), 'guest facts retain duplicate-address cleanup');
  const editorFacts = renderToStaticMarkup(React.createElement(Renderer, { ...p, onPageTextChange: noAction }));
  for (const label of ['display date', 'venue', 'address']) {
    assert.ok(editorFacts.includes(`aria-label="Edit ${label}"`), `${label} has its own value editor`);
  }
  assert.ok(!guestFacts.includes('aria-label="Edit '), 'guests never receive fact editors');
});

test('hero fact edits survive explicit saves across all designs without moving calendar dates', () => {
  for (const design of designs) {
    const source = {
      title: 'Spring club meet', pageTemplateId: design.id, createdVia: 'meet-discovery-v2',
      date: '2026-03-06', time: '09:00', timezone: 'America/New_York',
      venue: 'Tampa Convention Center, Hall B', address: '333 S Franklin St, Tampa, FL 33602',
      customFields: { meetDateRangeLabel: 'March 7-9, 2027' },
      builderDraft: {
        event: { date: '2026-03-06', time: '09:00', customFields: { meetDateRangeLabel: 'March 6-8, 2026' } },
        venue: { venue: 'Old arena', address: '100 Old Street' },
      },
    };
    const before = JSON.parse(JSON.stringify(source));
    const restored = JSON.parse(JSON.stringify(buildTemplateDraftPayload({ data: source }, 'gymnastics', source.timezone)));
    assert.equal(restored.data.date, '2026-03-06', design.id);
    assert.equal(restored.data.time, '09:00', design.id);
    assert.equal(restored.data.startISO, '2026-03-06T14:00:00.000Z', `${design.id}: Display Date does not change calendar dates`);
    const p = props(design);
    p.model = normalizeGymMeetEventData({ eventTitle: restored.title, eventData: restored.data, navItems: [], rosterAthletes: [] });
    assert.equal(p.model.authoredDateLabel, source.customFields.meetDateRangeLabel, design.id);
    assert.equal(p.model.authoredVenue, source.venue, design.id);
    assert.equal(p.model.authoredAddress, source.address, design.id);
    const html = renderToStaticMarkup(React.createElement(Renderer, p));
    for (const value of [source.customFields.meetDateRangeLabel, source.venue, source.address]) assert.ok(html.includes(value), `${design.id}: ${value}`);
    assert.deepEqual(source, before, `${design.id}: rendering retains explicit calendar values`);
  }
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
    assert.ok(!html.includes('<filter') && !html.includes('template-image-filter'), `${design.id}: original artwork colors`);
    assert.ok(html.includes('template-hero-image'), design.id);
    const filterOff = JSON.parse(JSON.stringify(buildTemplateDraftPayload({ data: {
      ...restored.data, heroImageFilterEnabled: false,
    } }, 'gymnastics', 'America/Chicago')));
    p.model = normalizeGymMeetEventData({ eventTitle: filterOff.title, eventData: filterOff.data, navItems: [], rosterAthletes: [] });
    assert.deepEqual(p.model.heroImageSettings, appearance, design.id);
    assert.equal(p.model.heroImageFilterEnabled, false, design.id);
    const unfiltered = renderToStaticMarkup(React.createElement(Renderer, p));
    assert.ok(!unfiltered.includes('template-image-filter'), design.id);
    assert.ok(unfiltered.includes('src="/uploads/original-invitation.webp"'), design.id);
    assert.ok(unfiltered.includes('object-fit:contain;height:auto;object-position:50% 50%'), design.id);
    const original = renderToStaticMarkup(React.createElement(Renderer, props(design)));
    assert.ok(!original.includes('<filter') && !original.includes('template-image-filter'), `${design.id}: original template colors`);
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
    onShare: noAction,
    calendarLinks: { google: "https://calendar.google.com/example", outlook: "https://outlook.live.com/example", appleInline: "/api/ics?start=2026-10-23" },
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
