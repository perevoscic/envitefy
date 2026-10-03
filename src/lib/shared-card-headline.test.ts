import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { createLiveCardForm } from "./livecard-builder";
import {
  cardHeadlinePrompt,
  generateCardHeadline,
  headlineGenerationDeps,
  resolveHeadlineBackground,
} from "./shared-card-headline";

const design = {
  version: 1 as const,
  backgroundUrl: "/background.webp",
  font: "classic" as const,
  ink: "#522335",
  accent: "#876035",
  surface: "#fff4ec",
};

test("editing a saved title loads the relative background through the real reference resolver", async (t) => {
  const original = { ...headlineGenerationDeps };
  const previousOrigin = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://envitefy.com";
  t.after(() => {
    Object.assign(headlineGenerationDeps, original);
    if (previousOrigin === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousOrigin;
  });
  const webp = await sharp({
    create: { width: 100, height: 150, channels: 3, background: "#ddddee" },
  }).webp().toBuffer();
  const backgroundUrl = "/api/blob/event-media/saved-card/header/display.webp";
  t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.equal(url, `https://envitefy.com${backgroundUrl}`);
    return new Response(new Uint8Array(webp), { headers: { "content-type": "image/webp" } });
  });
  headlineGenerationDeps.generate = async (_prompt, references) => {
    assert.deepEqual(references, [{ mimeType: "image/webp", data: webp.toString("base64") }]);
    return { ok: true, imageDataUrl: `data:image/webp;base64,${webp.toString("base64")}`, warnings: [] };
  };
  headlineGenerationDeps.verify = async () => ({ status: "passed", issues: [] });
  headlineGenerationDeps.encode = async (buffer) => buffer;
  headlineGenerationDeps.compose = async (_background, layer) => ({ composite: layer, layer, layout: { left: 0, top: 0, width: 100, height: 150, canvasWidth: 100, canvasHeight: 150 } });
  const result = await generateCardHeadline({
    ...createLiveCardForm(), title: "Lizzy's Graduation! 2026", design: "Garden celebration",
  }, { ...design, backgroundUrl });
  assert.equal(result.title, "Lizzy's Graduation! 2026");
  assert.match(result.imageUrl, /^data:image\/webp;base64,/);
});

test("unsaved WebP backgrounds reach lettering directly without a fetch or upload", async () => {
  const webp = await sharp({
    create: { width: 100, height: 150, channels: 3, background: "#ddddee" },
  }).webp().toBuffer();
  const original = headlineGenerationDeps.references;
  headlineGenerationDeps.references = async () => {
    throw new Error("An unsaved background must never be fetched");
  };
  try {
    assert.deepEqual(await resolveHeadlineBackground(`data:image/webp;base64,${webp.toString("base64")}`), [
      { mimeType: "image/webp", data: webp.toString("base64") },
    ]);
    for (const invalid of [
      "data:image/webp;base64,bm90IGFuIGltYWdl",
      "data:image/webp;base64,%%%",
      `data:image/png;base64,${webp.toString("base64")}`,
      "data:image/svg+xml;base64,PHN2Zy8+",
      `data:image/webp;base64,${"A".repeat(16 * 1024 * 1024 + 4)}`,
    ]) assert.deepEqual(await resolveHeadlineBackground(invalid), []);
  } finally {
    headlineGenerationDeps.references = original;
  }
});

test("headline generation receives only approved title, opening line and visual direction", () => {
  const form = {
    ...createLiveCardForm(),
    title: "Livia is turning 10",
    headlineIntro: "Join us",
    design: "Lavender balloons and calligraphy",
    overview: "Only guests should read this",
    instructions: "Bring a jacket",
    hostEmail: "mia@example.com",
    date: "2026-09-26",
  };
  const prompt = cardHeadlinePrompt(form, design);
  assert.match(prompt, /Livia is turning 10/);
  assert.match(prompt, /Join us/);
  assert.doesNotMatch(prompt, /Only guests should|Bring a jacket|mia@example.com|2026-09-26/);
  assert.match(
    cardHeadlinePrompt({ ...form, headlineIntro: "" }, design),
    /No opening line was supplied. Omit it completely/,
  );
  assert.match(prompt, /This supplied line is REQUIRED/);
  assert.ok(prompt.includes('REQUIRED PRINTED TEXT BLOCKS: ["Join us","Livia is turning 10"]'));
});

test("lettering receives this event's category and palette without a fixed birthday treatment", () => {
  const form = { ...createLiveCardForm(), title: "Our celebration", headlineIntro: "Join us" };
  const wedding = cardHeadlinePrompt(
    { ...form, eventType: "Wedding", design: "Ivory and gold botanical wedding" },
    design,
  );
  const birthday = cardHeadlinePrompt(
    {
      ...form,
      eventType: "Birthday",
      design: "Navy and orange space birthday, bold futuristic lettering",
    },
    { ...design, ink: "#ffffff", accent: "#ff8800", surface: "#001144" },
  );
  assert.match(wedding, /Event category.*"Wedding"/);
  assert.match(wedding, /#876035/);
  assert.match(birthday, /Event category.*"Birthday"/);
  assert.match(birthday, /bold futuristic lettering/);
  assert.match(birthday, /#ff8800/);
  assert.doesNotMatch(birthday, /#876035|lilac balloon|sweeping playful script/);
  assert.match(birthday, /Do not impose a fixed font style, script treatment or color/);
});

test("generated lettering requires verification, preserves exact text, and returns only WebP in memory", async () => {
  const original = { ...headlineGenerationDeps };
  const image = await sharp({
    create: { width: 100, height: 150, channels: 3, background: "#dddddd" },
  })
    .png()
    .toBuffer();
  let status: "passed" | "failed" | "unavailable" = "passed";
  let calls = 0;
  const form = {
    ...createLiveCardForm(),
    title: "Livia is turning 10",
    headlineIntro: "You're invited",
    design: "Lavender balloons",
  };
  const design = {
    version: 1 as const,
    backgroundUrl: "/background.webp",
    font: "classic" as const,
    ink: "#522335",
    accent: "#876035",
    surface: "#fff4ec",
  };
  headlineGenerationDeps.references = async (urls) => {
    assert.deepEqual(urls, [design.backgroundUrl]);
    return [{ mimeType: "image/png", data: image.toString("base64") }];
  };
  headlineGenerationDeps.generate = async (prompt, references) => {
    assert.match(prompt, /Artwork palette/);
    assert.ok(prompt.includes(design.accent));
    assert.deepEqual(references, [{ mimeType: "image/png", data: image.toString("base64") }]);
    calls++;
    return {
      ok: true,
      imageDataUrl: `data:image/png;base64,${image.toString("base64")}`,
      warnings: [],
    };
  };
  headlineGenerationDeps.verify = async (_image, event, product) => {
    assert.equal(product, "live_card");
    assert.equal(event.title, form.title);
    assert.equal(event.category, form.eventType);
    assert.ok(event.userIdea?.includes(design.accent));
    assert.deepEqual(event.requiredArtworkLines, [form.headlineIntro]);
    return { status, issues: [] };
  };
  headlineGenerationDeps.encode = async (buffer) => sharp(buffer).webp().toBuffer();
  headlineGenerationDeps.compose = async (_background, layer) => ({ composite: await sharp(layer).webp().toBuffer(), layer, layout: { left: 0, top: 0, width: 100, height: 150, canvasWidth: 100, canvasHeight: 150 } });
  try {
    const result = await generateCardHeadline(form, design);
    assert.equal(result.title, form.title);
    assert.equal(result.intro, form.headlineIntro);
    assert.match(result.imageUrl, /^data:image\/webp;base64,/);
    const inMemoryResult = await generateCardHeadline(form, {
      ...design,
      backgroundUrl: `data:image/png;base64,${image.toString("base64")}`,
    });
    assert.equal(inMemoryResult.title, form.title, "the full lettering pipeline accepts unsaved artwork");
    for (const value of ["failed", "unavailable"] as const) {
      status = value;
      const candidate = await generateCardHeadline(form, design);
      assert.equal(candidate.validation?.status, value);
      assert.match(candidate.imageUrl, /^data:image\/webp;base64,/);
      const beforeVerification = calls;
      const verified = await generateCardHeadline(form, { ...design, headline: candidate }, undefined, undefined, true);
      assert.equal(calls, beforeVerification, "verification retry never dispatches image generation");
      assert.equal(verified.imageUrl, candidate.imageUrl, "verification uses the same image");
    }
    assert.equal(
      calls,
      4,
      "each explicit generation makes one request; concerns and outages never regenerate",
    );
  } finally {
    Object.assign(headlineGenerationDeps, original);
  }
});

test("checker rejection retains the candidate and never requests an automatic repair", async () => {
  const original = { ...headlineGenerationDeps };
  const image = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#dddddd" } }).png().toBuffer();
  const reference = { mimeType: "image/png", data: image.toString("base64") };
  const form = { ...createLiveCardForm(), title: "Home Sweet Home", headlineIntro: "You're invited", design: "An evening garden outside a welcoming home" };
  let generated = 0;
  let checked = 0;
  let encoded = 0;
  let repairs = 0;
  headlineGenerationDeps.references = async () => [reference];
  headlineGenerationDeps.generate = async (prompt, references) => {
    generated++;
    assert.deepEqual(references, [reference]);
    assert.match(prompt, /Home Sweet Home/);
    return { ok: true, imageDataUrl: `data:image/png;base64,${image.toString("base64")}`, warnings: [] };
  };
  headlineGenerationDeps.verify = async (_image, _event, _product, context) => {
    assert.equal(context?.letteringOnly, true);
    return ++checked === 1
    ? { status: "failed", issues: ["missing_copy"], repairInstructions: ["Restore the missing second Home"] }
    : { status: "passed", issues: [] };
  };
  headlineGenerationDeps.encode = async (buffer) => { encoded++; return sharp(buffer).webp().toBuffer(); };
  headlineGenerationDeps.compose = async (_background, layer) => ({ composite: await sharp(layer).webp().toBuffer(), layer, layout: { left: 0, top: 0, width: 100, height: 150, canvasWidth: 100, canvasHeight: 150 } });
  try {
    const result = await generateCardHeadline(form, design, undefined, (stage) => { if (stage === "lettering") repairs++; });
    assert.equal(result.title, form.title);
    assert.match(result.imageUrl, /^data:image\/webp;base64,/);
    assert.equal(generated, 1);
    assert.equal(checked, 1);
    assert.equal(encoded, 0);
    assert.equal(result.validation?.status, "failed");
    assert.equal(repairs, 1, "one truthful generation stage");
    for (const status of ["failed", "unavailable"] as const) {
      generated = checked = encoded = 0;
      headlineGenerationDeps.verify = async () => { checked++; return { status, issues: status === "failed" ? ["missing_copy"] : [] }; };
      const retained = await generateCardHeadline(form, design);
      assert.equal(retained.validation?.status, status);
      assert.equal(generated, 1);
      assert.equal(checked, 1);
    }
    generated = encoded = 0;
    const controller = new AbortController();
    headlineGenerationDeps.verify = async () => {
      controller.abort();
      return { status: "failed", issues: ["missing_copy"] };
    };
    await assert.rejects(generateCardHeadline(form, design, controller.signal), { name: "AbortError" });
    assert.equal(generated, 1, "cancelled preparations never start a repair");
    assert.equal(encoded, 0);
  } finally {
    Object.assign(headlineGenerationDeps, original);
  }
});
