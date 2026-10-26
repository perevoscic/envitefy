const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

function editorHarness() {
  const refs = [];
  const states = [];
  const effects = [];
  let refIndex = 0;
  let stateIndex = 0;
  let effectIndex = 0;
  let authenticated = false;
  let title = "Guest's event";
  let failure = "";
  let publisher;
  let builds = 0;
  const requests = [];
  const publications = [];
  const destinations = [];
  const registerPublisher = (publish) => { publisher = publish; return () => { if (publisher === publish) publisher = null; }; };
  const historyClient = { read: () => null };
  const hooks = {
    useRef(value) { const index = refIndex++; refs[index] ||= { current: value }; return refs[index]; },
    useState(value) { const index = stateIndex++; if (!(index in states)) states[index] = typeof value === "function" ? value() : value; return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }]; },
    useEffect(effect, dependencies) { const index = effectIndex++; const previous = effects[index]; if (!previous || dependencies.some((value, entry) => value !== previous[entry])) { effects[index] = dependencies; effect(); } },
  };
  const template = () => ({
    authenticated, initial: {}, category: "birthdays", published: false,
    record() {}, registerPublisher,
    requestSave: async () => { requests.push("save"); },
    requestPublish: async (mode) => { requests.push(mode); },
    persist: async (payload, status, options) => { publications.push({ payload, status, options }); return "published-event"; },
  });
  const { useEventPageEditor } = loadTs("src/components/events/useEventPageEditor.ts", {
    react: hooks,
    "next/navigation": { useRouter: () => ({ push: (href) => destinations.push(href) }), useSearchParams: () => new URLSearchParams() },
    "next-auth/react": { getSession: async () => ({ user: { id: "host" } }) },
    "@/components/templates/TemplateEditorContext": { useTemplateEditor: template },
    "@/components/UnsavedProgressProvider": { useEventProgress: () => ({ dirty: true, markSaved() {}, allowNavigation: (run) => run(), requestLeave() {} }) },
    "@/lib/event-page-composition": { normalizeEventPageComposition: () => undefined },
    "@/lib/create/editor-handoff": { creationNativePayload: (payload) => payload },
    "@/lib/template-draft-handoff": { saveTemplateDraftToAccount: () => { throw new Error("Native publishing must not use the generic draft builder."); } },
  });
  function render(ready = true) {
    refIndex = stateIndex = effectIndex = 0;
    // biome-ignore lint/correctness/useHookAtTopLevel: This harness injects synchronous hook state for a native lifecycle test.
    return useEventPageEditor({ snapshot: { data: { title } }, category: "Birthdays", ready, historyClient,
      buildPayload: async () => { builds++; if (failure) throw new Error(failure); return { title, data: { title, nativeValidation: true } }; },
    });
  }
  return { render, requests, publications, destinations, builds: () => builds, publish: () => publisher(), registered: () => Boolean(publisher),
    authenticate(nextTitle) { authenticated = true; if (nextTitle) title = nextTitle; },
    fail(message) { failure = message; },
  };
}

test("guest publish choices preserve native publishing until authentication and use the latest native builder", async (t) => {
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent() {} };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  const fixture = editorHarness();
  const guest = fixture.render();
  await guest.publishWithAccount("login");
  assert.deepEqual(fixture.requests, ["login"]);
  assert.equal(fixture.builds(), 0, "native builders can upload media and must never run before authentication");
  assert.deepEqual(fixture.publications, []);
  fixture.authenticate("Latest retained wording");
  fixture.render();
  await fixture.publish();
  assert.equal(fixture.builds(), 1);
  assert.equal(fixture.publications.length, 1);
  assert.equal(fixture.publications[0].status, "published");
  assert.equal(fixture.publications[0].payload.title, "Latest retained wording");
  assert.equal(fixture.publications[0].payload.data.nativeValidation, true);
  assert.equal(fixture.publications[0].options.snapshot.data.title, "Latest retained wording");
  assert.equal(fixture.destinations.length, 1);
});

test("native validation failure after authentication retains editing and performs no publication", async () => {
  const fixture = editorHarness();
  const guest = fixture.render();
  await guest.saveChanges();
  assert.deepEqual(fixture.requests, ["signup"]);
  fixture.authenticate();
  fixture.fail("Choose a valid end time before publishing.");
  fixture.render();
  await assert.rejects(fixture.publish(), /Choose a valid end time/);
  assert.deepEqual(fixture.publications, []);
  assert.deepEqual(fixture.destinations, []);
  const retained = fixture.render();
  assert.match(retained.error, /Choose a valid end time/);
});

test("draft saves retain their draft-only authentication intent", async () => {
  const fixture = editorHarness();
  await fixture.render().saveDraft();
  assert.deepEqual(fixture.requests, ["save"]);
  assert.equal(fixture.builds(), 0);
});

test("authentication return waits for the native editor's own readiness before registering publication", () => {
  const fixture = editorHarness();
  fixture.authenticate();
  const opening = fixture.render(false);
  assert.equal(opening.ready, false);
  assert.equal(fixture.registered(), false, "the provider must retain its pending intent while the native editor hydrates");
  fixture.render(true);
  assert.equal(fixture.registered(), true);
  assert.deepEqual(fixture.publications, []);
});

test("the shared action area retains signed-in controls and keeps the same guest controls and account-gated handlers", () => {
  const { EventEditorActions } = loadTs("src/components/events/EventEditorWorkspace.tsx", {
    "lucide-react": new Proxy({}, { get: () => () => null }),
  });
  const editor = { ready: true, busy: false, dirty: true, published: false, authenticated: true,
    saveDraft: async () => {}, saveChanges: async () => {}, publishWithAccount: async () => {}, cancel() {} };
  const signedIn = renderToStaticMarkup(React.createElement(EventEditorActions, { editor }));
  assert.match(signedIn, />Save draft</);
  assert.match(signedIn, />Publish</);
  assert.doesNotMatch(signedIn, /Create an account|Sign in &amp; publish/);
  const guest = renderToStaticMarkup(React.createElement(EventEditorActions, { editor: { ...editor, authenticated: false } }));
  assert.match(guest, />Save draft</);
  assert.match(guest, />Publish</);
  assert.doesNotMatch(guest, /Create an account|Sign in &amp; publish|Save and continue/);
});
