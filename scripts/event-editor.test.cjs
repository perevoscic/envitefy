const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { createJiti } = require("jiti");
const jiti = createJiti(__filename, { alias: { "@": path.resolve("src") }, fsCache: false });
const { eventEditorContent, eventEditorActions, persistEventEditorPayload } = jiti(
  "../src/lib/event-editor.ts",
);
const { createEventHistoryClient } = jiti("../src/lib/event-history-client.ts");
const { saveTemplateDraftToAccount } = jiti("../src/lib/template-draft-handoff.ts");
const json = (row, status = 200) => new Response(JSON.stringify(row), { status });

test("view changes stay clean and saved pages expose only conditional Save changes", () => {
  const content = { data: { title: "Trip", sections: [{ title: "Parking", body: "North lot" }] } };
  assert.deepEqual(
    eventEditorContent({ ...content, activeView: "design", mobileMenuOpen: true }),
    content,
  );
  assert.deepEqual(eventEditorActions(true, false), {
    showDraft: false,
    showPrimary: false,
    primaryLabel: "Save changes",
  });
  assert.equal(eventEditorActions(true, true).showPrimary, true);
  assert.deepEqual(eventEditorActions(false, false), {
    showDraft: true,
    showPrimary: true,
    primaryLabel: "Publish",
  });
});

test("published saves update the same record with the original revision and guest activity", async (t) => {
  const calls = [];
  const existing = {
    id: "saved-event",
    revision: "v1",
    public_slug: "school-trip",
    data: { status: "published", numberOfGuests: 12, customMetadata: { keep: true } },
  };
  let read = 0;
  t.mock.method(global, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (options.method === "PATCH")
      return json({ ...existing, revision: "v3", data: JSON.parse(options.body).data });
    return json({ ...existing, revision: ++read === 1 ? "v1" : "v2" });
  });
  const client = createEventHistoryClient();
  await client.fetch("/api/history/saved-event");
  await client.fetch("/api/history/saved-event");
  assert.equal(
    client.read("/api/history/saved-event").revision,
    "v1",
    "background reads never advance the baseline",
  );
  const row = await persistEventEditorPayload({
    payload: { title: "Changed trip", data: { title: "Changed trip", numberOfGuests: 0 } },
    eventId: "saved-event",
    clientDraftId: "copy",
    existing: client.read("/api/history/saved-event"),
    historyFetch: client.fetch,
  });
  assert.equal(calls[2].url, "/api/history/saved-event");
  assert.equal(calls[2].options.headers.get("If-Match"), null);
  assert.equal(JSON.parse(calls[2].options.body).expectedRevision, "v1");
  assert.equal(row.data.status, "published");
  assert.equal(row.data.numberOfGuests, 12);
  assert.deepEqual(row.data.customMetadata, { keep: true });
  assert.equal(client.read("/api/history/saved-event").revision, "v3");
});

test("template publication saves the latest editor snapshot without losing RSVP counts", async () => {
  const writes = [];
  const snapshot = {
    data: { childName: "Olivia", date: "2026-11-03", images: { hero: "/saved-photo.jpg" } },
    activeView: "photos",
  };
  const draft = {
    version: 1,
    id: "draft-id",
    eventId: "same-event",
    eventRevision: "v1",
    category: "birthdays",
    templateId: "candy-dreams",
    snapshot,
    updatedAt: Date.now(),
    assets: {},
  };
  const id = await saveTemplateDraftToAccount({
    draft,
    category: "birthdays",
    templateId: "candy-dreams",
    status: "published",
    authenticated: true,
    remoteMedia: {},
    existing: { id: "same-event", data: { numberOfGuests: 7, status: "draft" } },
    payload: {
      title: "Olivia's birthday",
      data: { numberOfGuests: 0, hosts: [{ name: "Taylor" }] },
    },
    request: async (url, options) => {
      const body = JSON.parse(options.body);
      writes.push({ url, body, options });
      return json({ id: "same-event", revision: "v2", data: body.data });
    },
  });
  assert.equal(id, "same-event");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].url, "/api/history/same-event");
  assert.equal(writes[0].options.headers["If-Match"], undefined);
  assert.equal(writes[0].body.expectedRevision, "v1");
  assert.equal(writes[0].body.data.status, "published");
  assert.equal(writes[0].body.data.numberOfGuests, 7);
  assert.deepEqual(writes[0].body.data.templateEditor.snapshot, snapshot);
  assert.equal(draft.eventRevision, "v2");
});

test("a recovered create applies current edits to its existing identity", async () => {
  const calls = [];
  const row = await persistEventEditorPayload({
    payload: { title: "Latest title", data: { title: "Latest title" } },
    clientDraftId: "same-request",
    historyFetch: async (url, options) => {
      calls.push({ url, options });
      return calls.length === 1
        ? json({ id: "recovered-event", data: { status: "draft", title: "Earlier title" } })
        : json({ id: "recovered-event", data: JSON.parse(options.body).data });
    },
  });
  assert.equal(row.id, "recovered-event");
  assert.equal(calls[1].url, "/api/history/recovered-event");
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(row.data.title, "Latest title");
});

test("save failures surface the server conflict without recording a new baseline", async () => {
  await assert.rejects(
    persistEventEditorPayload({
      payload: { title: "Trip", data: {} },
      eventId: "saved",
      clientDraftId: "retry",
      historyFetch: async () =>
        json({ error: "Another co-host saved this event. Reload before saving." }, 409),
    }),
    /Another co-host saved/,
  );
});
