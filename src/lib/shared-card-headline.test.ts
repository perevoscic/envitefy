import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { createLiveCardForm } from "./livecard-builder";
import { generateCardHeadline, headlineGenerationDeps, resolveHeadlineBackground } from "./shared-card-headline";
import { renderCardFontLettering, letteringContrast } from "./card-font-lettering";
import { CARD_TYPOGRAPHY, readSharedCardDesign } from "./shared-card-design";

const design = { version: 1 as const, backgroundUrl: "/background.webp", font: "classic" as const, ink: "#24482e", accent: "#ac7d22", surface: "#fff8ed" };
const background = (color = "#ddd3b7") => sharp({ create: { width: 1000, height: 1500, channels: 3, background: color } }).png().toBuffer();

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


test("local lettering uses exact approved wording and bundled typography without provider calls", async (t) => {
  const original = { ...headlineGenerationDeps };
  t.after(() => Object.assign(headlineGenerationDeps, original));
  const image = await background();
  const form = { ...createLiveCardForm(), title: "Comets Team Celebration", headlineIntro: "Read, relax, and connect", design: "Tropical botanical garden", overview: "private guest information" };
  headlineGenerationDeps.references = async () => [{ mimeType: "image/png", data: image.toString("base64") }];
  headlineGenerationDeps.verify = async () => { throw new Error("Font lettering does not call an AI checker"); };
  let calls = 0;
  headlineGenerationDeps.render = async (bytes, words, palette) => {
    calls++;
    assert.ok([form.title, "A new title"].includes(words.title));
    return renderCardFontLettering(bytes, words, palette);
  };
  const stages: string[] = [];
  const result = await generateCardHeadline(form, design, undefined, stage => { stages.push(stage); });
  assert.deepEqual(stages, ["lettering", "checking"]);
  assert.equal(calls, 1);
  assert.equal(result.renderer, "font-v1");
  assert.equal(result.title, form.title);
  assert.equal(result.intro, form.headlineIntro);
  assert.equal(result.validation?.status, "passed");
  assert.match(result.imageUrl, /^data:image\/webp;base64,/);
  assert.ok(result.layerUrl && result.layout);
  assert.equal(readSharedCardDesign({ ...design, headline: result })?.headline?.renderer, "font-v1");
  const verified = await generateCardHeadline(form, { ...design, headline: result }, undefined, undefined, true);
  assert.equal(verified.imageUrl, result.imageUrl);
  assert.equal(calls, 1, "same-image verification never renders again");
  const changed = await generateCardHeadline({ ...form, title: "A new title" }, { ...design, headline: result });
  assert.notEqual(changed.imageUrl, result.imageUrl);
  assert.equal(calls, 2, "explicit wording update reuses the background");
});

test("all eight artistic pairings fit at phone size with a contrasting outline", async () => {
  const image = await background("#263a2c");
  for (const typography of Object.keys(CARD_TYPOGRAPHY) as (keyof typeof CARD_TYPOGRAPHY)[]) {
    const form = { ...createLiveCardForm(), title: "Élodie & James Celebrate 2026", headlineIntro: "Join us in the garden" };
    const result = await renderCardFontLettering(image, form, { ...design, typography });
    assert.equal(result.typography.titleLines.join(" "), form.title);
    assert.equal(result.typography.introLines.join(" "), form.headlineIntro);
    assert.ok(result.typography.titleSize * .288 >= 24, typography);
    assert.ok(result.typography.introSize * .288 >= 16, typography);
    assert.ok(result.typography.contrast >= 4.5, typography);
    assert.ok(letteringContrast(result.typography.ink, result.typography.halo) >= 4.5);
    assert.ok(result.layout.top + result.layout.height <= 1200, "guest-control area stays clear");
    const { info, data } = await sharp(result.layer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let pixels = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] <= 8) continue;
      pixels++;
      assert.ok(x > 0 && x < info.width - 1 && y > 0 && y < info.height - 1, `${typography}: glyphs and halo are not clipped`);
    }
    assert.ok(pixels > 1000);
  }
});

test("local composition preserves background outside placement and never prints unapproved fields", async () => {
  const image = await background();
  const form = { ...createLiveCardForm(), title: "Home Sweet Home", headlineIntro: "", overview: "Do not print this" };
  const result = await renderCardFontLettering(image, form, design);
  const withoutPrivateField = await renderCardFontLettering(image, { ...form, overview: "Changed private field" } as typeof form, design);
  assert.ok(result.composite.equals(withoutPrivateField.composite));
  assert.deepEqual(result.typography.introLines, []);
  const before = await sharp(image).ensureAlpha().raw().toBuffer();
  const after = await sharp(result.composite).ensureAlpha().raw().toBuffer();
  const { left, top, width, height } = result.layout;
  for (let y = 0; y < 1500; y += 7) for (let x = 0; x < 1000; x += 7) {
    if (x >= left && x < left + width && y >= top && y < top + height) continue;
    const i = (y * 1000 + x) * 4;
    assert.deepEqual(before.subarray(i, i + 4), after.subarray(i, i + 4));
  }
  const { composeCardLettering } = await import("./card-lettering-composition");
  const reused = await composeCardLettering(image, result.layer, result.layout);
  assert.ok(reused.composite.length > 0, "font layers remain compatible with saved-layer composition");
});

test("unreasonably long copy is rejected instead of being silently shrunk on phones", async () => {
  const image = await background();
  await assert.rejects(renderCardFontLettering(image, { ...createLiveCardForm(), title: "An extremely long celebration title ".repeat(20), headlineIntro: "A very long opening line ".repeat(20) }, design), /Shorten.*readable on phones/);
});

test("cancelled and invalid backgrounds cannot commit local lettering", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(generateCardHeadline(createLiveCardForm(), design, controller.signal), { name: "AbortError" });
  await assert.rejects(generateCardHeadline({ ...createLiveCardForm(), title: "Event" }, { ...design, backgroundUrl: "data:image/png;base64,bm90IGFuIGltYWdl" }), (error: unknown) => (error as { code: string }).code === "invalid_artwork");
});

test("legacy same-image verification keeps its pixels and checker findings without generating", async (t) => {
  const original = { ...headlineGenerationDeps };
  t.after(() => Object.assign(headlineGenerationDeps, original));
  const image = await background();
  const imageUrl = `data:image/png;base64,${image.toString("base64")}`;
  const form = { ...createLiveCardForm(), title: "Legacy title" };
  headlineGenerationDeps.render = async () => { throw new Error("Must not render during verification"); };
  headlineGenerationDeps.verify = async () => ({ status: "failed", issues: ["unreadable_text"] });
  const result = await generateCardHeadline(form, { ...design, backgroundUrl: imageUrl, headline: { title: form.title, intro: "", imageUrl } }, undefined, undefined, true);
  assert.equal(result.imageUrl, imageUrl);
  assert.equal(result.validation?.status, "failed");
});

test("saved relative backgrounds resolve against the trusted app origin for font updates", async t => {
  const original = { ...headlineGenerationDeps };
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://envitefy.com";
  t.after(() => {
    Object.assign(headlineGenerationDeps, original);
    if (origin === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = origin;
  });
  const image = await background();
  const relative = "/api/blob/event-media/saved-card/header/display.webp";
  const webp = await sharp(image).webp().toBuffer();
  let fetched = 0;
  t.mock.method(globalThis, "fetch", async (url: string) => {
    fetched++;
    assert.equal(url, `https://envitefy.com${relative}`);
    return new Response(new Uint8Array(webp), { headers: { "content-type": "image/webp" } });
  });
  const result = await generateCardHeadline({ ...createLiveCardForm(), title: "Lizzy’s Graduation! 2026" }, { ...design, backgroundUrl: relative });
  assert.equal(result.title, "Lizzy’s Graduation! 2026");
  assert.equal(result.renderer, "font-v1");
  assert.equal(fetched, 1);
});
