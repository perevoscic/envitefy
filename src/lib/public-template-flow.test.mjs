import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const root = process.cwd();
function loadTs(relative, mocks = {}, cache = new Map()) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  const module = { exports: {} };
  cache.set(file, module);
  const source = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const resolve = (name) => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
    const base = name.startsWith("@/")
      ? path.join(root, "src", name.slice(2))
      : path.resolve(path.dirname(file), name);
    const resolved = [
      base,
      ...[".ts", ".tsx", ".mjs", ".js", ".json"].map((ext) => base + ext),
    ].find((candidate) => existsSync(candidate));
    if (!resolved) throw new Error(`Missing ${name} from ${file}`);
    return loadTs(resolved, mocks, cache);
  };
  new Function("require", "module", "exports", source)(resolve, module, module.exports);
  return module.exports;
}
const categories = loadTs("src/lib/template-categories.ts");
const catalog = loadTs("src/lib/public-template-catalog.ts");
const access = loadTs("src/lib/event-draft-access.ts");
const storage = loadTs("src/lib/template-draft-storage.ts");
const handoff = loadTs("src/lib/template-draft-handoff.ts");
const draftId = "8d608518-b721-4b15-940d-06e3418234e7";
function draft() {
  return {
    version: 1,
    id: draftId,
    category: "weddings",
    templateId: catalog.getPublicTemplates("weddings")[0].id,
    updatedAt: Date.now(),
    snapshot: {
      data: {
        partner1: "Casey",
        partner2: "Taylor",
        images: { hero: "blob:photo" },
        registry: [{ label: "Registry", url: "https://example.com/gifts" }],
      },
      activeView: "images",
    },
    assets: { "blob:photo": new Blob(["photo bytes"], { type: "image/png" }) },
    pendingSave: true,
  };
}
const json = (value, status = 200) => Response.json(value, { status });

test("all nine catalogs expose unique valid template/editor identities and existing artwork", () => {
  assert.equal(categories.TEMPLATE_CATEGORIES.length, 9);
  for (const category of categories.TEMPLATE_CATEGORIES) {
    const templates = catalog.getPublicTemplates(category.slug);
    assert.ok(templates.length > 0, category.slug);
    assert.equal(new Set(templates.map((item) => item.id)).size, templates.length, category.slug);
    for (const template of templates) {
      assert.ok(catalog.getPublicTemplate(category.slug, template.id));
      const href = categories.templateEditorHref(category.slug, template.id);
      assert.ok(categories.isPublicTemplatePath(href), href);
      assert.equal(categories.templateCategoryForPath(href).slug, category.slug);
      if (template.heroImage.startsWith("/"))
        assert.ok(existsSync(path.join(root, "public", template.heroImage)), template.heroImage);
    }
    assert.equal(catalog.getPublicTemplate(category.slug, "does-not-exist"), undefined);
  }
  assert.equal(categories.getTemplateCategory("sports").slug, "sport-events");
  assert.equal(categories.getTemplateCategory("football").slug, "sport-events");
  for (const value of [
    "/admin/templates",
    "/weddings/templates/a/customize/delete",
    "/weddings/templates/a",
    "/weddings/templates/a/../customize",
  ])
    assert.equal(categories.isPublicTemplatePath(value), false);
});

test("explicit drafts are owner-only; published and legacy records retain existing access", () => {
  for (const data of [
    { status: "draft" },
    { draftStatus: "draft" },
    { status: " DRAFT " },
    { status: "published", draftStatus: "draft" },
  ]) {
    assert.equal(access.canReadEventDraft(data, "owner"), false);
    assert.equal(access.canReadEventDraft(data, "owner", "another"), false);
    assert.equal(access.canReadEventDraft(data, "owner", "owner"), true);
    assert.equal(access.canReadEventDraft(data, null, "owner"), false);
  }
  for (const data of [{}, { status: "published" }, null])
    assert.equal(access.canReadEventDraft(data, "owner"), true);
  assert.equal(access.isClientDraftId(draftId), true);
  for (const value of ["../event", "https://example.com", null, "event-1"])
    assert.equal(access.isClientDraftId(value), false);
});

test("guests cannot trigger handoff uploads or history mutations", async () => {
  let requests = 0;
  await assert.rejects(
    handoff.saveTemplateDraftToAccount({
      draft: draft(),
      payload: { title: "Our wedding", data: {} },
      category: "weddings",
      templateId: "gilded-wedding",
      status: "draft",
      authenticated: false,
      remoteMedia: {},
      request: async () => {
        requests++;
        return json({});
      },
    }),
    /Sign in/,
  );
  assert.equal(requests, 0);
});

test("authentication saves a complete private draft with uploaded photos exactly once", async () => {
  const current = draft();
  const requests = [];
  const remoteMedia = {};
  const request = async (url, options) => {
    requests.push({ url, options });
    if (url === "/api/templates/media") {
      assert.equal(await options.body.get("file").text(), "photo bytes");
      return json({ url: "https://media.example/photo.webp" });
    }
    const body = JSON.parse(options.body);
    assert.equal(body.clientDraftId, current.id);
    assert.equal(body.data.ownership, "owned");
    assert.equal(body.data.status, "draft");
    assert.equal(body.data.templateEditor.snapshot.activeView, "images");
    assert.equal(body.data.templateEditor.snapshot.data.partner1, "Casey");
    assert.equal(
      body.data.templateEditor.snapshot.data.images.hero,
      "https://media.example/photo.webp",
    );
    assert.ok(!options.body.includes("blob:"));
    return json({ id: current.id, ...body });
  };
  const options = {
    draft: current,
    payload: { title: "Our wedding", data: current.snapshot.data },
    category: "weddings",
    templateId: current.templateId,
    status: "draft",
    authenticated: true,
    remoteMedia,
    request,
  };
  assert.equal(await handoff.saveTemplateDraftToAccount(options), current.id);
  await handoff.saveTemplateDraftToAccount(options);
  assert.deepEqual(
    requests.map(({ url, options }) => [url, options.method]),
    [
      ["/api/templates/media", "POST"],
      ["/api/history", "POST"],
      [`/api/history/${current.id}`, "PATCH"],
    ],
  );
  assert.equal(current.pendingSave, false);
  assert.equal(await current.assets["blob:photo"].text(), "photo bytes");
});

test("failed uploads retain browser photos and remain retryable", async () => {
  const current = draft();
  let historyCalls = 0;
  await assert.rejects(
    handoff.saveTemplateDraftToAccount({
      draft: current,
      payload: { title: "Wedding", data: current.snapshot.data },
      category: "weddings",
      templateId: current.templateId,
      status: "draft",
      authenticated: true,
      remoteMedia: {},
      request: async (url) => {
        if (url === "/api/history") historyCalls++;
        return json({ error: "Upload failed" }, 503);
      },
    }),
    /Upload failed/,
  );
  assert.equal(historyCalls, 0);
  assert.equal(current.eventId, undefined);
  assert.equal(current.pendingSave, true);
  assert.equal(await current.assets["blob:photo"].text(), "photo bytes");
});

test("lost create responses recover the same identity and apply newer edits via owned update", async () => {
  const current = draft();
  const remoteMedia = { "blob:photo": "https://media.example/photo.webp" };
  let saved;
  let posts = 0;
  let patches = 0;
  const request = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url === "/api/history") {
      posts++;
      if (!saved) {
        saved = { id: current.id, ...body };
        throw new Error("Network response lost");
      }
      return json(saved);
    }
    patches++;
    saved = { id: current.id, ...body };
    return json(saved);
  };
  const options = {
    draft: current,
    payload: { title: "Wedding", data: current.snapshot.data },
    category: "weddings",
    templateId: current.templateId,
    status: "draft",
    authenticated: true,
    remoteMedia,
    request,
  };
  await assert.rejects(handoff.saveTemplateDraftToAccount(options), /Network response lost/);
  assert.equal(current.pendingSave, true);
  current.snapshot.data.partner1 = "Casey edited";
  await handoff.saveTemplateDraftToAccount(options);
  assert.equal(posts, 2);
  assert.equal(patches, 1);
  assert.equal(saved.id, current.id);
  assert.equal(saved.data.templateEditor.snapshot.data.partner1, "Casey edited");
});

function memoryIndexedDb(rows = [], failure = false) {
  const records = new Map(rows.map((row) => [row.id, structuredClone(row)]));
  return {
    records,
    open() {
      const request = {};
      queueMicrotask(() => {
        if (failure) {
          request.error = new Error("Quota exceeded");
          request.onerror();
          return;
        }
        request.result = {
          close() {},
          transaction() {
            const tx = {};
            const pending = new Map(records);
            const complete = () =>
              setTimeout(() => {
                records.clear();
                for (const [key, value] of pending) records.set(key, value);
                tx.oncomplete?.();
              }, 0);
            tx.objectStore = () => ({
              put(value) {
                pending.set(value.id, structuredClone(value));
                complete();
              },
              delete(id) {
                pending.delete(id);
                complete();
              },
              getAll() {
                const query = {};
                queueMicrotask(() => {
                  query.result = structuredClone([...pending.values()]);
                  query.onsuccess();
                  complete();
                });
                return query;
              },
            });
            return tx;
          },
        };
        request.onsuccess();
      });
      return request;
    },
  };
}

test("IndexedDB roundtrip retains photos, section, identity and latest category draft; expiry is seven days", async () => {
  const original = globalThis.indexedDB;
  try {
    const db = memoryIndexedDb();
    globalThis.indexedDB = db;
    const current = draft();
    await storage.writeTemplateDraft(current);
    const restored = await storage.readTemplateDraft("weddings");
    assert.equal(restored.id, current.id);
    assert.deepEqual(restored.snapshot, current.snapshot);
    assert.equal(await restored.assets["blob:photo"].text(), "photo bytes");
    assert.equal(await storage.readTemplateDraft("birthdays"), null);
    current.updatedAt = Date.now() - storage.TEMPLATE_DRAFT_MAX_AGE - 1;
    await storage.writeTemplateDraft(current);
    assert.equal(await storage.readTemplateDraft("weddings", current.id), null);
    assert.equal(db.records.size, 0);
  } finally {
    globalThis.indexedDB = original;
  }
});

test("storage errors are surfaced, never reported as successful retention", async () => {
  const original = globalThis.indexedDB;
  try {
    globalThis.indexedDB = memoryIndexedDb([], true);
    await assert.rejects(storage.writeTemplateDraft(draft()), /Quota/);
    await assert.rejects(storage.readTemplateDraft("weddings"), /Quota/);
  } finally {
    globalThis.indexedDB = original;
  }
});

test("photo remapping changes nested media only, preserves other event content", () => {
  const source = draft().snapshot;
  const replaced = storage.replaceDraftMedia(source, { "blob:photo": "blob:restored" });
  assert.equal(replaced.data.images.hero, "blob:restored");
  assert.equal(source.data.images.hero, "blob:photo");
  assert.deepEqual(replaced.data.registry, source.data.registry);
});

test("history POST requires authentication and returns same-owner retries without replacing data", async () => {
  let userId = null;
  let inserts = 0;
  let saved = null;
  const route = loadTs("src/app/api/history/route.ts", {
    "next/server": {
      NextResponse: { json: (body, options) => json(body, options?.status || 200) },
    },
    "next-auth": { getServerSession: async () => (userId ? { user: { id: userId } } : null) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": {
      getEventHistoryById: async () => saved,
      insertEventHistory: async (params) => {
        inserts++;
        saved = {
          id: params.clientDraftId,
          user_id: params.userId,
          title: params.title,
          data: params.data,
        };
        return saved;
      },
    },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/event-access": {},
    "@/lib/event-media": { findTransientEventMedia: () => [] },
    "@/lib/history-view": {},
    "@/lib/scan-attempts": {},
  });
  const request = (title = "Original") =>
    new Request("https://envitefy.test/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientDraftId: draftId, title, data: { status: "draft" } }),
    });
  assert.equal((await route.POST(request())).status, 401);
  userId = "owner";
  assert.ok((await route.POST(request())).ok);
  const retry = await route.POST(request("Changed"));
  assert.equal((await retry.json()).title, "Original");
  assert.equal(inserts, 1);
  userId = "another";
  assert.equal((await route.POST(request())).status, 403);
  assert.equal(inserts, 1);
});

test("incomplete drafts retain canonical dates, timezone, and signup fields", () => {
  const { buildTemplateDraftPayload } = loadTs("src/lib/template-draft-payload.ts");
  const empty = buildTemplateDraftPayload({}, "weddings", "America/Chicago");
  assert.equal(empty.data.startAt, null);
  assert.equal(empty.data.endAt, null);
  const scheduled = buildTemplateDraftPayload({ data: { date: "2028-09-21", time: "14:00", endTime: "16:00", timezone: "America/Chicago", hosts: [{ name: "Family" }] } }, "bridal-showers", "UTC");
  assert.equal(scheduled.data.startAt, "2028-09-21T19:00:00.000Z");
  assert.equal(scheduled.data.endAt, "2028-09-21T21:00:00.000Z");
  assert.equal(scheduled.data.startAt, scheduled.data.startISO);
  assert.equal(scheduled.data.tz, "America/Chicago");
  assert.deepEqual(scheduled.data.hosts, [{ name: "Family" }]);
  const signup = buildTemplateDraftPayload({ form: { title: "Field trip", start: "2028-09-21T09:00", sections: [{ title: "Drivers", slots: [] }] } }, "signup-forms", "America/Chicago");
  assert.equal(signup.data.start, "2028-09-21T14:00:00.000Z");
  assert.deepEqual(signup.data.signupForm.sections, [{ title: "Drivers", slots: [] }]);
});

test("history updates require ownership, with explicit legacy intake claiming preserved", async () => {
  let userId = null;
  let saved = { id: draftId, user_id: "owner", title: "Private event", data: { status: "draft" } };
  let mutations = 0;
  const route = loadTs("src/app/api/history/[id]/route.ts", {
    "next/headers": {},
    "next/server": { NextResponse: { json: (body, options) => json(body, options?.status || 200) } },
    "next-auth": { getServerSession: async () => userId ? { user: { id: userId } } : null },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": { getEventHistoryById: async () => saved, claimEventHistoryById: async () => (saved = { ...saved, user_id: userId }), updateEventHistoryDataMerge: async (id, data) => { mutations++; saved = { ...saved, data: { ...saved.data, ...data } }; return saved; }, listShareRecipientUserIdsForEvent: async () => [] },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/event-access": {},
    "@/lib/event-cleanup": { deleteEventHistoryWithCleanup: async () => { mutations++; return {}; } },
    "@/lib/event-media": { findTransientEventMedia: () => [] },
    "@/lib/discovery-public-redact": {},
  });
  const context = { params: Promise.resolve({ id: draftId }) };
  const request = (body = { data: { status: "published", draftStatus: "published" } }) => new Request("https://envitefy.test/api/history/" + draftId, { method: "PATCH", body: JSON.stringify(body) });
  assert.equal((await route.PATCH(request(), context)).status, 401);
  userId = "another";
  assert.equal((await route.PATCH(request(), context)).status, 403);
  assert.equal((await route.DELETE(request(), context)).status, 403);
  assert.equal(mutations, 0);
  userId = "owner";
  assert.equal((await route.PATCH(request(), context)).status, 200);
  assert.equal(saved.data.status, "published");
  saved.user_id = null;
  assert.equal((await route.PATCH(request(), context)).status, 403);
  assert.equal((await route.DELETE(request(), context)).status, 403);
  assert.equal((await route.PATCH(request({ claim: true }), context)).status, 200);
  assert.equal(saved.user_id, "owner");
});
