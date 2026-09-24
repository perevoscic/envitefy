import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  function load(relative) {
    const file = path.resolve(relative);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const require = (name) => {
      if (name in mocks) return mocks[name];
      if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
      if (name.endsWith(".css")) return new Proxy({}, { get: (_, key) => String(key) });
      if (!name.startsWith(".") && !name.startsWith("@/")) return nativeRequire(name);
      const base = name.startsWith("@/")
        ? path.resolve("src", name.slice(2))
        : path.resolve(path.dirname(file), name);
      return load([base, `${base}.ts`, `${base}.tsx`].find(existsSync));
    };
    new Function("require", "module", "exports", code)(require, module, module.exports);
    return module.exports;
  }
  return load;
}

const load = loader();
const custom = load("src/lib/event-custom-design.ts");
const design = {
  version: 1,
  name: "Garden gathering",
  description: "Sage leaves and warm paper",
  layout: "split",
  font: "editorial",
  colors: { page: "#f3f5ee", surface: "#ffffff", ink: "#20332c", accent: "#345641" },
};
const example = (category = "general") => ({
  version: 1,
  category,
  design,
  artwork: "/templates/signup/photographic/clubs-and-groups/gardening-group.webp",
  details: {
    ...custom.emptyCustomEventDetails(),
    title: "Family garden day",
    date: "2026-10-10",
    time: "14:00",
    timezone: "America/Chicago",
    venue: "Our garden",
    description: "Bring a picnic. No peanuts.",
    sections: [{ title: "Schedule", body: "2:00 PM: Meet in the garden." }],
    registryLinks: [{ label: "Registry", url: "https://example.test/gifts" }],
  },
});

test("General Events and custom page editors use the signed-in category access path", () => {
  const { isEnabledTemplateEditorPath } = load("src/lib/template-categories.ts");
  for (const route of ["/event/general", "/event/general/customize", "/event/design/customize"]) {
    assert.equal(isEnabledTemplateEditorPath(route), true, route);
  }
  assert.equal(isEnabledTemplateEditorPath("/event/new"), false);
  assert.equal(isEnabledTemplateEditorPath("/event/unknown/customize"), false);
});

test("custom designs hand off once in memory, retain their category, and expire without a save", (t) => {
  const page = example("weddings"),
    now = Date.now();
  t.mock.method(Date, "now", () => now);
  const token = custom.stageCustomEventPage(page);
  page.details.title = "Later mutation";
  assert.equal(custom.takeCustomEventPage(token, "general"), null);
  assert.equal(custom.takeCustomEventPage(token, "weddings").details.title, "Family garden day");
  assert.equal(custom.takeCustomEventPage(token, "weddings"), null);
  const expired = custom.stageCustomEventPage(example());
  Date.now.mock.mockImplementation(() => now + 11 * 60 * 1000);
  assert.equal(custom.takeCustomEventPage(expired, "general"), null);
});

test("every category preserves the design and canonical event-local times through serialization", () => {
  const { resolveEditHref } = load("src/utils/event-edit-route.ts");
  for (const category of Object.keys(custom.CUSTOM_EVENT_CATEGORIES)) {
    const page = custom.normalizeCustomEventPage(JSON.parse(JSON.stringify(example(category))));
    assert.ok(page, category);
    const data = custom.customEventPageData(page);
    assert.equal(data.startAt, "2026-10-10T19:00:00.000Z");
    assert.equal(data.endAt, null);
    assert.equal(data.category, custom.CUSTOM_EVENT_CATEGORIES[category]);
    assert.equal(
      resolveEditHref("event-1", data, data.title),
      "/event/design/customize?edit=event-1",
    );
    assert.equal(
      resolveEditHref("event-1", { createdVia: data.createdVia }, data.title),
      "/event/design/customize?edit=event-1",
      "light dashboard rows reopen the right editor",
    );
  }
  const blank = custom.customEventPageData({
    ...example(),
    details: custom.emptyCustomEventDetails(),
  });
  assert.equal(blank.start, null);
  assert.equal(blank.end, null);
  assert.equal(blank.location, "");
});

test("design boundaries reject executable content, unsupported media, impossible dates, and invalid zones", () => {
  for (const patch of [
    { artwork: "javascript:alert(1)" },
    { artwork: "data:image/svg+xml;base64,YQ==" },
    { category: "unknown" },
    { design: { ...design, font: "url(evil)" } },
    { design: { ...design, colors: { ...design.colors, page: "url(evil)" } } },
    { details: { ...example().details, date: "2026-02-30" } },
    { details: { ...example().details, timezone: "Invalid/Zone" } },
    {
      details: {
        ...example().details,
        registryLinks: [{ label: "Gift", url: "javascript:alert(1)" }],
      },
    },
  ]) {
    assert.equal(custom.normalizeCustomEventPage({ ...example(), ...patch }), null);
  }
  const { colorContrast } = load("src/lib/color-contrast.ts");
  const fixed = custom.normalizeEventCustomDesign({
    ...design,
    colors: { page: "#111111", surface: "#222222", ink: "#111111", accent: "#ffffff" },
  });
  assert.ok(colorContrast(fixed.colors.ink, fixed.colors.page) >= 4.5);
  assert.ok(colorContrast(fixed.colors.accent, "#ffffff") >= 4.5);
});

test("font pairings survive event serialization and reach both guest text roles", () => {
  const { GALLERY_FONT_PAIRS, LIBRARY_FONT_PAIRS } = load("src/lib/font-library.ts");
  const Empty = () => null;
  const renderLoad = loader({
    "next/link": ({ children, ...props }) => React.createElement("a", props, children),
    "@/components/GuestRsvpModal": Empty,
    "@/components/event-templates/EventGuestActions": Empty,
    "@/components/branding/EnvitefyEventBranding": Empty,
  });
  const Content = renderLoad("src/components/events/custom/CustomEventPageContent.tsx").default;
  for (const pair of [...GALLERY_FONT_PAIRS, ...LIBRARY_FONT_PAIRS]) {
    const input = example();
    input.design.font = pair.id;
    const restored = custom.normalizeCustomEventPage(JSON.parse(JSON.stringify(input)));
    assert.equal(restored.design.font, pair.id);
    const markup = renderToStaticMarkup(React.createElement(Content, { page: restored }));
    assert.ok(markup.includes("--event-body-font:"), pair.id);
    assert.ok(markup.includes(pair.heading.split(",")[0].replace(/["']/g, "")), pair.id);
    assert.ok(markup.includes(pair.body.split(",")[0].replace(/["']/g, "")), pair.id);
  }
});

test("shared gallery callout is available in every supported category without a chat link", () => {
  const Empty = () => null;
  let status = "authenticated";
  const renderLoad = loader({
    "next/navigation": { useSearchParams: () => new URLSearchParams(), useRouter: () => ({}) },
    "next/dynamic": () => Empty,
    "next-auth/react": { useSession: () => ({ status }) },
  });
  const Launcher = renderLoad("src/components/events/EventCustomThemeLauncher.tsx").default;
  const Callout = renderLoad("src/components/events/CreateWithEnvitefyCallout.tsx").default;
  for (status of ["authenticated", "unauthenticated", "loading"]) {
    const entries = [
      ...Object.keys(custom.CUSTOM_EVENT_CATEGORIES).map((category) =>
        React.createElement(Launcher, { category }),
      ),
      React.createElement(Callout, { signup: true, onClick: () => {} }),
    ];
    for (const entry of entries) {
      const markup = renderToStaticMarkup(entry);
      assert.match(markup, /Create with Envitefy/);
      assert.doesNotMatch(markup, /\/chat/);
      assert.equal(/<button[^>]*disabled=""/.test(markup), status !== "authenticated");
      assert.equal(markup.includes("Sign in to generate"), status === "unauthenticated");
    }
  }
});

test("the shared guest renderer keeps all four layouts, facts, artwork, and safe links", () => {
  const Empty = () => null;
  const renderLoad = loader({
    "next/link": ({ children, ...props }) => React.createElement("a", props, children),
    "@/components/GuestRsvpModal": Empty,
    "@/components/event-templates/EventGuestActions": Empty,
    "@/components/branding/EnvitefyEventBranding": Empty,
  });
  const Page = renderLoad("src/components/events/custom/CustomEventPageContent.tsx").default;
  for (const layout of custom.EVENT_DESIGN_LAYOUTS) {
    const page = { ...example(), design: { ...design, layout } };
    const markup = renderToStaticMarkup(React.createElement(Page, { page }));
    assert.match(markup, new RegExp(`data-layout="${layout}"`));
    assert.ok(markup.includes(page.artwork));
    assert.match(markup, /Family garden day|No peanuts/);
    assert.match(markup, /2:00 PM/);
    assert.doesNotMatch(markup, /Host dashboard|Edit event page/);
  }
});

const generationLoad = loader({
  "@/lib/studio/openai": {
    generateInvitationImageWithOpenAi: async () => {
      throw new Error("Unexpected real image generation");
    },
  },
});
const generation = generationLoad("src/lib/event-theme-generation.ts");
test("automatic proofreading preserves logistics and rejects changed facts without generating artwork", async () => {
  const details = {
    ...example().details,
    title: "amc movie night",
    description: "join us at 2:00 PM. Email host@example.test for 4 seats.",
  };
  const before = structuredClone(details);
  const wording = custom.customEventWording(details);
  wording[0] = "AMC Movie Night";
  wording[1] = "Join us at 2:00 PM. Email host@example.test for 4 seats.";
  const polished = custom.applyCustomEventWording(details, wording);
  assert.equal(polished.title, "AMC Movie Night");
  for (const field of [
    "date",
    "time",
    "timezone",
    "venue",
    "location",
    "host",
    "rsvpEmail",
    "rsvpPhone",
    "registryLinks",
  ]) {
    assert.deepEqual(polished[field], before[field]);
  }
  for (const altered of [
    wording.slice(1),
    [wording[0], wording[1].replace("4 seats", "5 seats"), ...wording.slice(2)],
    [wording[0], wording[1].replace("PM", "AM"), ...wording.slice(2)],
    [
      wording[0],
      wording[1].replace("host@example.test", "other@example.test"),
      ...wording.slice(2),
    ],
  ])
    assert.throws(() => custom.applyCustomEventWording(details, altered));
  generation.eventThemeGenerationDeps.client = () => ({
    chat: {
      completions: {
        create: async () => ({
          choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ wording }) } }],
        }),
      },
    },
  });
  generation.eventThemeGenerationDeps.render = async () => {
    throw new Error("Proofreading must not regenerate artwork");
  };
  const result = await generation.prepareEventThemeWording(
    {
      category: "general",
      mode: "wording",
      prompt: "Prepare current wording.",
      currentDesign: design,
      currentDetails: details,
      referenceImageMode: "use",
    },
    new AbortController().signal,
  );
  assert.deepEqual(result.details, polished);
  assert.deepEqual(details, before);
});
test("generation validates category, reference mode, and bounded requests before provider work", () => {
  const valid = { category: "general", prompt: "A garden gathering" };
  for (const patch of [
    { category: "unknown" },
    { prompt: "" },
    { prompt: "x".repeat(12001) },
    { referenceImage: "http://localhost/private" },
    { referenceImageMode: "invalid" },
    { currentDesign: design },
    { currentDetails: {} },
  ]) {
    assert.throws(
      () => generation.parseEventThemeRequest({ ...valid, ...patch }),
      generation.EventThemeRequestError,
    );
  }
  assert.equal(generation.parseEventThemeRequest(valid).category, "general");
});

test("OpenAI design generation preserves category and supplied facts during visual refinement", async () => {
  let requested,
    renderCount = 0;
  const webp = await sharp({ create: { width: 12, height: 8, channels: 3, background: "green" } })
    .webp()
    .toBuffer();
  generation.eventThemeGenerationDeps.client = () => ({
    chat: {
      completions: {
        create: async (input) => {
          requested = input;
          return {
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    design,
                    details: {
                      ...example().details,
                      title: "Incorrect replacement",
                      date: "2029-01-01",
                    },
                    artworkPrompt: "Garden watercolor",
                  }),
                },
              },
            ],
          };
        },
      },
    },
  });
  generation.eventThemeGenerationDeps.render = async () => {
    renderCount++;
    return { ok: true, imageDataUrl: `data:image/webp;base64,${webp.toString("base64")}` };
  };
  for (const category of Object.keys(custom.CUSTOM_EVENT_CATEGORIES)) {
    const page = await generation.generateEventTheme(
      {
        category,
        prompt: "Change to a watercolor design",
        currentDesign: design,
        currentDetails: example().details,
        referenceImageMode: "inspire",
      },
      new AbortController().signal,
    );
    assert.equal(page.category, category);
    assert.deepEqual(page.details, example().details);
    assert.match(page.artwork, /^data:image\/webp/);
  }
  assert.equal(renderCount, Object.keys(custom.CUSTOM_EVENT_CATEGORIES).length);
  assert.equal(requested.response_format.json_schema.strict, true);
  assert.match(
    requested.messages[0].content,
    /On a design refinement keep currentDetails exactly unchanged/,
  );
});

test("Use this image keeps its full dimensions and transparency and returns only verified WebP", async () => {
  const png = await sharp({
    create: { width: 16, height: 10, channels: 4, background: { r: 20, g: 60, b: 30, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
  generation.eventThemeGenerationDeps.render = async () => {
    throw new Error("Reference reuse must not generate artwork");
  };
  const page = await generation.generateEventTheme(
    {
      category: "general",
      prompt: "Use this garden picture",
      currentDesign: null,
      referenceImage: `data:image/png;base64,${png.toString("base64")}`,
      referenceImageMode: "use",
    },
    new AbortController().signal,
  );
  const bytes = Buffer.from(page.artwork.split(",")[1], "base64");
  const meta = await sharp(bytes).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 16);
  assert.equal(meta.height, 10);
  assert.equal(meta.hasAlpha, true);
  await sharp(bytes).raw().toBuffer();
});

test("saving is explicit, uploads verified artwork, and published-page drafts remain private", async (t) => {
  const calls = [],
    uploads = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    return { ok: true, json: async () => ({ id: "event-1", data: body.data }) };
  });
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent() {} };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  const { saveCustomEventPage } = loader({
    "@/utils/media-upload-client": {
      persistImageMediaValue: async (options) => {
        uploads.push(options);
        return "https://example.test/artwork.webp";
      },
    },
  })("src/lib/event-custom-save.ts");
  const first = await saveCustomEventPage({
    page: example(),
    status: "draft",
    clientDraftId: "draft-id",
  });
  assert.equal(calls[0].url, "/api/history");
  assert.equal(first.data.status, "draft");
  assert.equal(first.page.artwork, "https://example.test/artwork.webp");
  assert.equal(uploads[0].fileName, "event-page-artwork.webp");
  const published = await saveCustomEventPage({
    page: first.page,
    eventId: first.id,
    status: "published",
    clientDraftId: "draft-id",
    existing: first.data,
  });
  const changed = {
    ...published.page,
    details: { ...published.page.details, title: "Private new title" },
  };
  const draft = await saveCustomEventPage({
    page: changed,
    eventId: first.id,
    status: "draft",
    clientDraftId: "draft-id",
    existing: published.data,
  });
  assert.equal(draft.data.status, "published");
  assert.equal(draft.data.customEventPage.details.title, "Family garden day");
  assert.equal(draft.data.customEventPageDraft.details.title, "Private new title");
  const final = await saveCustomEventPage({
    page: draft.page,
    eventId: first.id,
    status: "published",
    clientDraftId: "draft-id",
    existing: draft.data,
  });
  assert.equal(final.data.customEventPage.details.title, "Private new title");
  assert.equal(final.data.customEventPageDraft, null);
  assert.ok(calls.slice(1).every((call) => call.url === "/api/history/event-1"));
  assert.match(readFileSync("src/lib/db.ts", "utf8"), /- 'customEventPageDraft'/);
});

test("save failures keep the editor state and incomplete publication never uploads", async (t) => {
  let uploads = 0;
  const { saveCustomEventPage } = loader({
    "@/utils/media-upload-client": {
      persistImageMediaValue: async () => {
        uploads++;
        return "https://example.test/art.webp";
      },
    },
  })("src/lib/event-custom-save.ts");
  await assert.rejects(
    saveCustomEventPage({
      page: { ...example(), details: custom.emptyCustomEventDetails() },
      status: "published",
      clientDraftId: "id",
    }),
    /title, date, and location/,
  );
  assert.equal(uploads, 0);
  t.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    json: async () => ({ error: "Please retry" }),
  }));
  const page = example(),
    before = structuredClone(page);
  await assert.rejects(
    saveCustomEventPage({ page, status: "draft", clientDraftId: "id" }),
    /Please retry/,
  );
  assert.deepEqual(page, before);
});

test("the generation endpoint requires auth, bounds media, throttles work, and never writes a draft", async (t) => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  t.after(() => {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  });
  let userId = null,
    calls = 0;
  const route = loader({
    "next/server": { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/event-theme-generation": {
      ...generation,
      generateEventTheme: async (input) => {
        calls++;
        return example(input.category);
      },
    },
  })("src/app/api/event-themes/generate/route.ts");
  const request = (body = { category: "general", prompt: "Garden celebration" }, headers = {}) =>
    new Request("http://localhost/api/event-themes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  assert.equal((await route.POST(request())).status, 401);
  userId = "test-host";
  assert.equal((await route.POST(request({}, { "sec-fetch-site": "cross-site" }))).status, 403);
  assert.equal(
    (await route.POST(request({ category: "unsupported", prompt: "Garden" }))).status,
    400,
  );
  assert.equal(
    (await route.POST(request({ category: "general", prompt: "x".repeat(3_000_001) }))).status,
    413,
  );
  assert.equal(calls, 0);
  for (let i = 0; i < 6; i++) {
    const response = await route.POST(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers["Cache-Control"], "no-store");
  }
  assert.equal((await route.POST(request())).status, 429);
  assert.equal(calls, 6);
  const source = readFileSync("src/app/api/event-themes/generate/route.ts", "utf8");
  assert.doesNotMatch(source, /insertEventHistory|writeTemplateDraft|\/api\/history/);
});
