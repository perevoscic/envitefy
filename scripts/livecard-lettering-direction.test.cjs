const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const load = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const { generateSharedCard, sharedCardGenerationDeps: deps } = load("src/lib/shared-card-generation.ts", {}, cache);
const { renderCardFontLettering, letteringContrast } = load("src/lib/card-font-lettering.ts", {}, cache);
const { generateCardHeadline, headlineGenerationDeps } = load("src/lib/shared-card-headline.ts", {}, cache);
const { readSharedCardDesign, cardFontRoles } = load("src/lib/shared-card-design.ts", {}, cache);
const { createLiveCardForm } = load("src/lib/livecard-builder.ts", {}, cache);
const style = { version: 1, titleFont: "classic", introFont: "cormorant", direction: "Softly burnished copper, warm ivory, intimate candlelit elegance", artworkDirection: "Candlelit velvet lounge, quiet upper area, warm reflections", texturePrompt: "Subtly brushed copper with warm candlelight reflections", preferredTop: 240, ornament: false };
const design = { version: 1, font: "modern", typography: "cinematic", ink: "#fff8ed", accent: "#e8c289", surface: "#17212b", backgroundUrl: "/background.webp", letteringStyle: style };
const form = { ...createLiveCardForm(), eventType: "General event", title: "Élodie’s Winter Evening", headlineIntro: "Mission: celebrate!", design: "Cozy winter gathering, candlelight, velvet, vintage European elegance; huge BIRTHDAY PARTY lettering with James Jones signature" };
const image = (color, width = 1000, height = 1500) => sharp({ create: { width, height, channels: 3, background: color } }).webp({ lossless: true }).toBuffer();

test("Describe the look coordinates background and individual fonts/material; saved material is reused", async t => {
  const original = { ...deps };
  t.after(() => Object.assign(deps, original));
  const background = await image("#17212b", 100, 150);
  const texture = await image("#bc8b55", 100, 150);
  let plannerInput;
  const requests = [];
  deps.createClient = () => ({ chat: { completions: { create: async input => {
    plannerInput = input;
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(design) } }] };
  } } } });
  deps.references = async () => [];
  deps.verify = async () => ({ status: "passed", issues: [] });
  deps.encode = async bytes => bytes;
  deps.generateImage = async (prompt, references, product, options) => {
    requests.push({ prompt, references, options });
    return { ok: true, imageDataUrl: `data:image/webp;base64,${(requests.length === 1 ? background : texture).toString("base64")}` };
  };
  const context = { jobId: "test", revision: "r1", attempt: 1 };
  const result = await generateSharedCard(form, undefined, undefined, context);
  assert.equal(JSON.parse(plannerInput.messages[1].content).design, form.design);
  assert.equal(requests.length, 2);
  assert.match(requests[0].prompt, /Candlelit velvet lounge/);
  assert.doesNotMatch(requests[0].prompt, /Softly burnished copper/);
  assert.doesNotMatch(requests[0].prompt, /vintage European elegance/);
  assert.match(requests[0].prompt, /Absolutely NO text/);
  assert.doesNotMatch(requests[0].prompt, /BIRTHDAY PARTY|James Jones/);
  assert.match(plannerInput.messages[0].content, /Never include title or opening-line words/);
  assert.match(requests[1].prompt, /Subtly brushed copper/);
  assert.match(requests[1].prompt, /Absolutely no text/);
  assert.equal(requests[1].references[0].data, background.toString("base64"));
  assert.notEqual(requests[0].options.requestContext.revision, requests[1].options.requestContext.revision);
  assert.equal(result.letteringStyle.textureUrl, `data:image/webp;base64,${texture.toString("base64")}`);
  const saved = readSharedCardDesign(JSON.parse(JSON.stringify(result)));
  assert.deepEqual(saved.letteringStyle, result.letteringStyle);
  assert.equal(cardFontRoles(saved).title.family, "EnvitefyCardClassic", "individual font overrides categorical fallback");
  requests.length = 0;
  await generateSharedCard(form, undefined, undefined, context, { ...saved.letteringStyle, artworkDirection: "Stale scene with BIRTHDAY PARTY letters", direction: "James Jones signature" });
  assert.match(requests[0].prompt, /Candlelit velvet lounge/);
  assert.doesNotMatch(requests[0].prompt, /BIRTHDAY PARTY|James Jones|Stale scene/);
  assert.equal(requests.length, 1, "background alternatives reuse material");
  requests.length = 0;
  await generateSharedCard(form, undefined, undefined, context, null);
  assert.equal(requests.length, 1, "legacy background alternatives do not create new material");
  requests.length = 0;
  await assert.rejects(generateSharedCard(form, undefined, undefined, context, undefined,
    async () => { throw new Error("Access revoked"); }), /Access revoked/);
  assert.equal(requests.length, 1, "access recheck stops the paid material request");
  requests.length = 0;
  deps.createClient = () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ ...design, letteringStyle: { ...style, texturePrompt: "" } }) } }] }) } } });
  const clean = await generateSharedCard(form);
  assert.equal(requests.length, 1, "clean directions need no material request");
  assert.equal(clean.letteringStyle.textureUrl, undefined);
});

test("material stays inside exact glyphs, keeps phone minimums and leaves the scene unchanged", async () => {
  const bg = await image("#17212b");
  const material = await sharp({ create: { width: 100, height: 150, channels: 3, background: "#bc8b55" } })
    .composite([{ input: await image("#fff1ad", 100, 70), top: 0, left: 0 }]).png().toBuffer();
  const plain = await renderCardFontLettering(bg, form, design);
  const effect = await renderCardFontLettering(bg, form, design, material);
  assert.deepEqual(effect.layout, plain.layout);
  assert.equal(effect.typography.titleLines.join(" "), form.title);
  assert.equal(effect.typography.introLines.join(" "), form.headlineIntro);
  assert.ok(effect.typography.titleSize * .288 >= 24);
  assert.ok(effect.typography.introSize * .288 >= 16);
  assert.ok(effect.layout.top + effect.layout.height <= 1200);
  const a = await sharp(plain.layer).ensureAlpha().raw().toBuffer();
  const b = await sharp(effect.layer).ensureAlpha().raw().toBuffer();
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    assert.equal(a[i + 3], b[i + 3], "material never changes glyph mask");
    if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]) continue;
    changed++;
    const ink = [1, 3, 5].map(offset => parseInt(effect.typography.ink.slice(offset, offset + 2), 16));
    // Exclude anti-aliased glyph edges blended into the opaque halo.
    if (b[i + 3] === 255 && ink.every((channel, c) => a[i + c] === channel)) {
      const hex = `#${[b[i], b[i + 1], b[i + 2]].map(v => v.toString(16).padStart(2, "0")).join("")}`;
      assert.ok(letteringContrast(hex, effect.typography.halo) >= 4.5);
    }
  }
  assert.ok(changed > 1000, "visible material applied");
  const before = await sharp(bg).extract({ left: 0, top: 1200, width: 1000, height: 300 }).raw().toBuffer();
  const after = await sharp(effect.composite).extract({ left: 0, top: 1200, width: 1000, height: 300 }).raw().toBuffer();
  assert.ok(before.equals(after));
});

test("wording edits reuse saved material without generation, and verification preserves legacy pixels", async t => {
  const original = { ...headlineGenerationDeps };
  t.after(() => Object.assign(headlineGenerationDeps, original));
  const bg = await image("#17212b");
  const texture = await image("#bc8b55");
  const current = { ...design, backgroundUrl: `data:image/webp;base64,${bg.toString("base64")}`, letteringStyle: { ...style, textureUrl: `data:image/webp;base64,${texture.toString("base64")}` } };
  headlineGenerationDeps.references = async () => { throw new Error("No remote fetch needed"); };
  const first = await generateCardHeadline(form, current);
  const changed = await generateCardHeadline({ ...form, title: "A New Evening" }, { ...current, headline: first });
  assert.equal(changed.title, "A New Evening");
  assert.equal(changed.renderer, "font-v1");
  assert.notEqual(changed.imageUrl, first.imageUrl);
  const roundtrip = readSharedCardDesign({ ...current, headline: changed });
  assert.equal(roundtrip.letteringStyle.textureUrl, current.letteringStyle.textureUrl);
  const legacy = { ...first, renderer: undefined };
  headlineGenerationDeps.verify = async () => ({ status: "passed", issues: [] });
  const verified = await generateCardHeadline(form, { ...current, headline: legacy }, undefined, undefined, true);
  assert.equal(verified.imageUrl, legacy.imageUrl);
  assert.equal(verified.renderer, undefined);
});

test("invalid directions are discarded and cancelled jobs do not buy material", async t => {
  assert.equal(readSharedCardDesign({ ...design, letteringStyle: { ...style, titleFont: "made-up" } }).letteringStyle, undefined);
  assert.equal(readSharedCardDesign({ ...design, letteringStyle: { ...style, preferredTop: -100 } }).letteringStyle, undefined);
  assert.equal(readSharedCardDesign({ ...design, letteringStyle: { ...style, texturePrompt: "x".repeat(1601) } }).letteringStyle, undefined);
  assert.equal(readSharedCardDesign({ ...design, letteringStyle: { ...style, textureUrl: "javascript:bad" } }).letteringStyle.textureUrl, undefined);
  const original = { ...deps };
  t.after(() => Object.assign(deps, original));
  deps.createClient = () => ({ chat: { completions: { create: async () => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(design) } }] }) } } });
  deps.references = async () => [];
  const controller = new AbortController();
  let calls = 0;
  deps.generateImage = async () => { calls++; controller.abort(); return { ok: true, imageDataUrl: "unused" }; };
  await assert.rejects(generateSharedCard(form, controller.signal));
  assert.equal(calls, 1);
});
