import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import sharp from "sharp";

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
        esModuleInterop: true,
      },
    }).outputText;
    const require = (name) => {
      if (name in mocks) return mocks[name];
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
const custom = load("src/lib/signup-custom-theme.ts");
const themes = load("src/lib/signup-themes.ts");
const utils = load("src/utils/signup.ts");
const theme = {
  version: 1,
  name: "Woodland helpers",
  description: "Watercolor foxes and sage paper.",
  composition: "botanical",
  board: "outline",
  motif: "sprig",
  reverse: false,
  fontPair: "friendly",
  colors: {
    page: "#F3F2EE",
    surface: "#FFFFFF",
    soft: "#E8ECF2",
    ink: "#222D40",
    accent: "#354B72",
    secondary: "#91A889",
  },
};

test("accepted themes cross the gallery transition once, in memory, with empty event details", () => {
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts");
  const { stageSignupTheme, takeSignupTheme } = load("src/lib/signup-theme-handoff.ts");
  const form = custom.applySignupCustomTheme(createEmptySignupTemplateForm(), theme);
  const token = stageSignupTheme(form);
  form.title = "Changed after staging";
  const accepted = takeSignupTheme(token);
  assert.equal(accepted.title, "");
  assert.deepEqual(accepted.sections, []);
  assert.deepEqual(accepted.responses, []);
  assert.equal(accepted.start, null);
  assert.equal(accepted.header.groupName, "");
  assert.deepEqual(accepted.appearance.customTheme, theme);
  assert.equal(takeSignupTheme(token), null);
  assert.equal(takeSignupTheme("missing-preview"), null);
});

test("unused theme handoffs expire instead of retaining generated media indefinitely", (t) => {
  const { stageSignupTheme, takeSignupTheme } = load("src/lib/signup-theme-handoff.ts");
  const now = Date.now();
  t.mock.method(Date, "now", () => now);
  const token = stageSignupTheme(utils.createDefaultSignupForm());
  Date.now.mock.mockImplementation(() => now + 11 * 60 * 1000);
  assert.equal(takeSignupTheme(token), null);
});

test("a custom theme survives serialization, sanitizing and public projection independently of catalog IDs", () => {
  const form = utils.createDefaultSignupForm();
  form.title = "Real event";
  form.responses = [{ id: "existing-response", slots: [], status: "confirmed" }];
  const next = custom.applySignupCustomTheme(form, theme, {
    name: "fox.webp",
    type: "image/webp",
    dataUrl: "/fox.webp",
  });
  assert.equal(next.sections, form.sections);
  assert.equal(next.responses, form.responses);
  assert.equal(next.settings, form.settings);
  const restored = utils.sanitizeSignupForm(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(restored.appearance.customTheme, theme);
  assert.equal(restored.header.backgroundImage.dataUrl, "/fox.webp");
  assert.equal(themes.resolveSignupDesign(restored.appearance).composition, "botanical");
  assert.equal(
    themes.resolveSignupThemeStyle(restored)["--signup-secondary"],
    theme.colors.secondary,
  );
  const { projectSignupForm } = load("src/lib/signup-projection.ts");
  assert.deepEqual(projectSignupForm(restored).appearance.customTheme, theme);
});

test("design refinements and Undo preserve newer event details, slots, settings and responses", () => {
  const form = themes.applySignupTheme(utils.createDefaultSignupForm(), "school-days");
  const snapshot = custom.captureSignupTheme(form);
  const next = custom.applySignupCustomTheme(form, theme);
  assert.equal(next.header.backgroundImage, form.header.backgroundImage);
  next.title = "Edited while generating";
  next.header.groupName = "New group";
  next.sections = [{ id: "new", title: "Added during generation", slots: [] }];
  const undone = custom.restoreSignupTheme(next, snapshot);
  assert.equal(undone.appearance, form.appearance);
  assert.equal(undone.title, next.title);
  assert.equal(undone.header.groupName, next.header.groupName);
  assert.equal(undone.sections, next.sections);
  assert.equal(undone.responses, next.responses);
});

test("new font pairs survive form saves, custom themes and guest projection", () => {
  const { GALLERY_FONT_PAIRS, LIBRARY_FONT_PAIRS } = load("src/lib/font-library.ts");
  const { projectSignupForm } = load("src/lib/signup-projection.ts");
  for (const pair of [...GALLERY_FONT_PAIRS, ...LIBRARY_FONT_PAIRS]) {
    const form = custom.applySignupCustomTheme(utils.createDefaultSignupForm(), { ...theme, fontPair: pair.id });
    const restored = utils.sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
    const guest = projectSignupForm(restored);
    assert.equal(guest.appearance.fontPair, pair.id);
    assert.equal(guest.appearance.customTheme.fontPair, pair.id);
    const style = themes.resolveSignupThemeStyle(guest);
    assert.equal(style["--signup-heading-font"], pair.heading);
    assert.equal(style["--signup-body-font"], pair.body);
    // Manual choices on standard gallery templates follow the same save path.
    const standard = themes.applySignupTheme(utils.createDefaultSignupForm(), "school-days");
    standard.appearance.fontPair = pair.id;
    assert.equal(utils.sanitizeSignupForm(JSON.parse(JSON.stringify(standard))).appearance.fontPair, pair.id);
  }
});

test("untrusted recipes cannot introduce CSS, markup or unknown layout variants", () => {
  for (const bad of [
    { version: 2 },
    { composition: "__proto__" },
    { board: "script" },
    { fontPair: "url(evil)" },
    { colors: { ...theme.colors, accent: "url(https://evil.test)" } },
  ]) {
    assert.equal(custom.normalizeSignupCustomTheme({ ...theme, ...bad }), null);
  }
  assert.equal(
    custom.normalizeSignupCustomTheme({ ...theme, html: "<script>bad()</script>" }).html,
    undefined,
  );
  const corrected = custom.normalizeSignupCustomTheme({
    ...theme,
    colors: { ...theme.colors, accent: "#FFFFFF", ink: "#EEEEEE" },
  });
  assert.ok(custom.signupColorContrast(corrected.colors.accent, "#FFFFFF") >= 4.5);
  assert.ok(custom.signupColorContrast(corrected.colors.ink, corrected.colors.surface) >= 4.5);
});

test("only explicit account saves upload WebP and retain the recipe in draft and public payloads", async () => {
  const webp = await sharp({ create: { width: 8, height: 8, channels: 4, background: "#335577" } })
    .webp()
    .toBuffer();
  const dataUrl = `data:image/webp;base64,${webp.toString("base64")}`;
  const form = custom.applySignupCustomTheme(utils.createDefaultSignupForm(), theme, {
    name: "theme.webp",
    type: "image/webp",
    dataUrl,
  });
  const draft = {
    version: 1,
    id: "test-draft",
    category: "signup-forms",
    templateId: "editorial--clean-clear",
    snapshot: { form },
    assets: {},
  };
  const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");
  const { saveTemplateDraftToAccount } = load("src/lib/template-draft-handoff.ts");
  const writes = [];
  const result = await saveTemplateDraftToAccount({
    draft,
    payload: buildTemplateDraftPayload(draft.snapshot, "signup-forms", "UTC"),
    category: "signup-forms",
    templateId: draft.templateId,
    status: "draft",
    authenticated: true,
    remoteMedia: {},
    request: async (url, options) => {
      writes.push(url);
      if (url === "/api/templates/media") {
        const file = options.body.get("file");
        assert.equal(file.type, "image/webp");
        assert.equal(Buffer.from(await file.arrayBuffer()).toString("ascii", 8, 12), "WEBP");
        return Response.json({ url: "/saved-theme.webp" });
      }
      const body = JSON.parse(options.body);
      assert.deepEqual(body.data.signupForm.appearance.customTheme, theme);
      assert.equal(body.data.signupForm.header.backgroundImage.dataUrl, "/saved-theme.webp");
      assert.equal(
        body.data.templateEditor.snapshot.form.header.backgroundImage.dataUrl,
        "/saved-theme.webp",
      );
      assert.equal(body.data.status, "draft");
      return Response.json({ id: "saved", data: body.data });
    },
  });
  assert.equal(result, "saved");
  assert.deepEqual(writes, ["/api/templates/media", "/api/history"]);
});

const providerLoad = loader({
  "@/lib/studio/openai": {
    generateInvitationImageWithOpenAi: async () => {
      throw new Error("Unexpected provider call");
    },
  },
});
const generation = providerLoad("src/lib/signup-theme-generation.ts");
test("generation validates prompt size, reference format and custom recipe before provider calls", () => {
  const valid = { prompt: "Woodland theme", currentTheme: null, generateArtwork: true };
  for (const patch of [
    { prompt: "" },
    { prompt: "x".repeat(custom.SIGNUP_CUSTOM_THEME_PROMPT_LIMIT + 1) },
    { generateArtwork: "false" },
    { currentTheme: { version: 2 } },
    { referenceImage: "http://127.0.0.1/private" },
    { referenceImage: "data:image/svg+xml;base64,PHN2Zz4=" },
  ]) {
    assert.throws(
      () => generation.parseSignupThemeRequest({ ...valid, ...patch }),
      generation.SignupThemeRequestError,
    );
  }
  assert.equal(generation.parseSignupThemeRequest(valid).prompt, valid.prompt);
});

test("refining without artwork invokes only the structured design model", async () => {
  let requested;
  generation.signupThemeGenerationDeps.client = () => ({
    chat: {
      completions: {
        create: async (input) => {
          requested = input;
          return {
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({ theme, artworkPrompt: "Foxes in a woodland." }),
                },
              },
            ],
          };
        },
      },
    },
  });
  const result = await generation.generateSignupTheme(
    { prompt: "Make it botanical", currentTheme: theme, generateArtwork: false },
    new AbortController().signal,
  );
  assert.deepEqual(result, { theme });
  assert.equal(requested.response_format.json_schema.strict, true);
  const profiles = load("src/lib/category-custom-design-profiles.ts");
  assert.ok(requested.messages[0].content.includes(profiles.categoryCustomDesignGuidance("signup-forms")));
  assert.ok(!JSON.stringify(requested).includes(profiles.getCategoryCustomDesignProfile("signup-forms").placeholder));
  assert.deepEqual(JSON.parse(requested.messages[1].content).currentTheme, theme);
});

test("generated originals are converted and decoded as WebP before the in-memory response", async () => {
  const png = await sharp({
    create: { width: 16, height: 8, channels: 4, background: { r: 30, g: 80, b: 60, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
  generation.signupThemeGenerationDeps.render = async (prompt) => {
    assert.ok(prompt.includes(load("src/lib/category-custom-design-profiles.ts").categoryCustomDesignGuidance("signup-forms")));
    assert.ok(prompt.includes(JSON.stringify(theme.colors)), "approved palette takes priority");
    return { ok: true, imageDataUrl: `data:image/png;base64,${png.toString("base64")}` };
  };
  const result = await generation.generateSignupTheme(
    { prompt: "Woodland theme", currentTheme: null, generateArtwork: true },
    new AbortController().signal,
  );
  assert.equal(result.artwork.type, "image/webp");
  const bytes = Buffer.from(result.artwork.dataUrl.split(",")[1], "base64");
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 16);
  assert.equal(metadata.height, 8);
  assert.equal(metadata.hasAlpha, true);
});

test("authentication and malformed requests cannot reach the generation provider", async () => {
  let userId = null;
  let calls = 0;
  const routeLoad = loader({
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/signup-theme-generation": {
      ...generation,
      generateSignupTheme: async () => {
        calls++;
        return { theme };
      },
    },
  });
  const { POST } = routeLoad("src/app/api/signup-themes/generate/route.ts");
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "unit-test-placeholder";
  try {
    const request = (body) =>
      new Request("http://localhost/api/signup-themes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    assert.equal(
      (await POST(request({ prompt: "Woodland theme", generateArtwork: true }))).status,
      401,
    );
    userId = "test-user";
    assert.equal((await POST(request({ prompt: "" }))).status, 400);
    assert.equal(calls, 0);
    for (let index = 0; index < 6; index++)
      assert.equal(
        (await POST(request({ prompt: "Woodland theme", generateArtwork: false }))).status,
        200,
      );
    const limited = await POST(request({ prompt: "Woodland theme", generateArtwork: false }));
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get("Retry-After"));
    assert.equal(calls, 6);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});

const breakfastDetails = {
  title: "See you at the Pole - Breakfast",
  description:
    "We’re looking for volunteers to bring donuts or muffins. Please keep in mind we are a tree nut / peanut free school.",
  organizerName: "Kayra Ayala",
  start: "2026-09-23T07:00",
  end: null,
  timezone: "America/Chicago",
  venue: "Upper School Campus",
  location: "10745 US Hwy 98 W., Miramar Beach, FL 32550",
  safetyNotes: "Tree nut / peanut free school.",
  sections: [
    {
      title: "Breakfast contributions",
      description: null,
      purpose: "items",
      slots: [
        { label: "Donuts", capacity: null, notes: "Tree nut / peanut free" },
        { label: "Muffins", capacity: null, notes: "Tree nut / peanut free" },
      ],
    },
  ],
};

test("a pasted event brief retains facts and requested items without inventing capacities or bookings", () => {
  const brief = load("src/lib/signup-theme-brief.ts");
  const { createEmptySignupTemplateForm } = load("src/lib/signup-starters.ts");
  const details = brief.normalizeSignupThemeDetails({
    ...breakfastDetails,
    responses: [{ name: "Invented" }],
    settings: { collectEmail: false },
  });
  assert.equal(details.responses, undefined);
  assert.equal(details.settings, undefined);
  const form = brief.applySignupThemeDetails(createEmptySignupTemplateForm(), details);
  assert.equal(form.title, breakfastDetails.title);
  assert.equal(form.header.creatorName, "Kayra Ayala");
  assert.equal(form.start, "2026-09-23T07:00");
  assert.equal(form.end, null);
  assert.equal(form.timezone, "America/Chicago");
  assert.equal(form.venue, "Upper School Campus");
  assert.equal(form.locationMode, "in-person");
  assert.equal(form.location, breakfastDetails.location);
  assert.match(form.description, /tree nut \/ peanut free/);
  assert.deepEqual(
    form.sections[0].slots.map((slot) => [slot.label, slot.capacity]),
    [
      ["Donuts", null],
      ["Muffins", null],
    ],
  );
  assert.deepEqual(form.responses, []);
  assert.equal(
    brief.applySignupThemeDetails(form, details).sections[0].slots[0].id,
    form.sections[0].slots[0].id,
  );
  const saved = utils.sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
  assert.equal(saved.start, form.start);
  assert.equal(saved.safetyNotes, form.safetyNotes);
  assert.deepEqual(saved.sections[0].slots, form.sections[0].slots);
  for (const patch of [
    { start: "2026-02-30T07:00" },
    { start: "2026-09-23T25:00" },
    { timezone: "not-a-zone" },
    {
      sections: [{ ...breakfastDetails.sections[0], slots: [{ label: "Donuts", capacity: 1000 }] }],
    },
  ])
    assert.equal(brief.normalizeSignupThemeDetails({ ...breakfastDetails, ...patch }), null);
});

test("reference reuse returns the supplied pixels as WebP without invoking image generation", async (t) => {
  const original = await sharp({
    create: { width: 32, height: 20, channels: 3, background: "#C72639" },
  })
    .png()
    .toBuffer();
  let request;
  t.mock.method(generation.signupThemeGenerationDeps, "client", () => ({
    chat: {
      completions: {
        create: async (input) => {
          request = input;
          return {
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    theme,
                    artworkPrompt: "The supplied red, white and blue flag.",
                    details: breakfastDetails,
                  }),
                },
              },
            ],
          };
        },
      },
    },
  }));
  t.mock.method(generation.signupThemeGenerationDeps, "render", async () => {
    throw new Error("Must keep the actual reference");
  });
  const result = await generation.generateSignupTheme(
    {
      prompt: "See you at the Pole - Breakfast",
      currentTheme: null,
      generateArtwork: true,
      includeContent: true,
      referenceImage: `data:image/png;base64,${original.toString("base64")}`,
    },
    new AbortController().signal,
  );
  assert.equal(result.artworkSource, "reference");
  assert.equal(result.artwork.width, 32);
  assert.equal(result.artwork.height, 20);
  const decoded = sharp(Buffer.from(result.artwork.dataUrl.split(",")[1], "base64"));
  assert.equal((await decoded.metadata()).format, "webp");
  const pixels = await decoded.raw().toBuffer();
  assert.ok(
    Math.abs(pixels[0] - 199) < 5 && Math.abs(pixels[1] - 38) < 5 && Math.abs(pixels[2] - 57) < 5,
  );
  assert.equal(result.details.title, breakfastDetails.title);
  assert.equal(request.messages[1].content[1].image_url.detail, "high");
  assert.equal(
    request.response_format.json_schema.schema.properties.details.additionalProperties,
    false,
  );
  const designOnly = await generation.generateSignupTheme(
    {
      prompt: "Keep my event details",
      currentTheme: theme,
      generateArtwork: false,
      includeContent: false,
    },
    new AbortController().signal,
  );
  assert.equal(designOnly.details, undefined);
});

test("custom dark palettes remain dark and source artwork fit survives explicit saves", () => {
  const dark = custom.normalizeSignupCustomTheme({
    ...theme,
    colors: {
      page: "#1E2853",
      surface: "#24305F",
      soft: "#293765",
      ink: "#FFFFFF",
      accent: "#BB2537",
      secondary: "#F3F4F9",
    },
  });
  assert.ok(dark);
  const form = custom.applySignupCustomTheme(utils.createDefaultSignupForm(), dark);
  form.appearance.imageFilterEnabled = false;
  form.appearance.imageFit = "contain";
  const saved = utils.sanitizeSignupForm(JSON.parse(JSON.stringify(form)));
  assert.equal(saved.appearance.imageFilterEnabled, false);
  assert.equal(saved.appearance.imageFit, "contain");
  const style = themes.resolveSignupThemeStyle(saved);
  assert.equal(style["--signup-page"], "#1E2853");
  assert.ok(custom.signupColorContrast(style["--signup-text"], style["--signup-surface"]) >= 4.5);
  assert.ok(
    custom.signupColorContrast(style["--signup-accent-text"], style["--signup-page"]) >= 4.5,
  );
  // Ink is white on dark themes. Selected controls must invert their labels with it.
  for (const palette of ["original", "soft", "ink"]) {
    saved.appearance.palette = palette;
    const tokens = themes.resolveSignupThemeStyle(saved);
    assert.ok(
      custom.signupColorContrast(tokens["--signup-accent"], tokens["--signup-on-accent"]) >= 4.5,
      `${palette}: selected controls and primary actions must remain readable`,
    );
    if (palette === "ink") {
      assert.equal(tokens["--signup-accent"], "#FFFFFF");
      assert.equal(tokens["--signup-on-accent"], "#000000");
    }
  }
});
