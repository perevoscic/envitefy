import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { buildProductCopyPrompt, buildProductArtworkPrompt } from "./product-prompts.ts";
import { productContract, resolveStudioProduct, defaultCreativePlan } from "./product-contract.ts";
import { normalizeLiveCardMetadata, parseStudioGenerateRequest } from "./types.ts";
import { composeFlyerExport, flyerTextBlocks } from "./flyer-export.ts";
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/"))
      return next(
        pathToFileURL(
          path.resolve("src", specifier.slice(2) + (/\.[a-z]+$/i.test(specifier) ? "" : ".ts")),
        ).href,
        context,
      );
    return next(specifier, context);
  },
});
const { generateStudioInvitation, studioGenerationDeps } = await import("./generate.ts");
const event = {
  title: "Elena's 30th Birthday",
  category: "Birthday",
  honoreeName: "Elena",
  date: "October 24, 2099",
  startTime: "4 PM",
  venueName: "Garden Hall",
  venueAddress: "123 Oak Street",
  timezone: "America/Chicago",
  rsvpEnabled: false,
  userIdea: "Botanical editorial, no balloons",
};
const copy = {
  title: event.title,
  description: "Celebrate Elena.",
  palette: { primary: "#202A36", secondary: "#B9CFC5", accent: "#BF8C5A" },
  themeStyle: "botanical",
  creativePlan: defaultCreativePlan(event, "live_card"),
  interactiveMetadata: { rsvpMessage: "", funFacts: [], ctaLabel: "View details", shareNote: "" },
  invitation: {
    title: event.title,
    subtitle: "",
    openingLine: "Celebrate Elena.",
    scheduleLine: "",
    locationLine: "",
    detailsLine: "",
    callToAction: "View details",
    socialCaption: "",
    hashtags: [],
  },
};
const image =
  "data:image/png;base64," +
  (
    await sharp({ create: { width: 1024, height: 1536, channels: 3, background: "#B9CFC5" } })
      .png()
      .toBuffer()
  ).toString("base64");
test.afterEach(() => mock.restoreAll());
function stub() {
  mock.method(studioGenerationDeps, "resolveStudioProvider", () => "openai");
  mock.method(studioGenerationDeps, "normalizeStudioTheme", async () => ({
    riskLevel: "safe",
    originalTheme: null,
    normalizedTheme: null,
    visualMotifs: [],
    paletteHints: [],
  }));
  mock.method(studioGenerationDeps, "applyStudioThemeNormalization", (request) => request);
  mock.method(studioGenerationDeps, "resolveStudioReferenceImages", async () => []);
  mock.method(studioGenerationDeps, "generateStudioLiveCardWithOpenAi", async () => ({
    ok: true,
    liveCard: structuredClone(copy),
    warnings: [],
  }));
  mock.method(studioGenerationDeps, "generateInvitationImageWithOpenAi", async () => ({
    ok: true,
    imageDataUrl: image,
    warnings: [],
  }));
}
test("product routes remain distinct with backwards compatible page/image defaults", () => {
  assert.equal(resolveStudioProduct(undefined, "image"), "digital_flyer");
  assert.equal(resolveStudioProduct(undefined, "page"), "live_card");
  for (const product of ["event_page", "live_card", "digital_flyer", "printable_flyer"])
    assert.equal(parseStudioGenerateRequest({ event, product }).value.product, product);
  assert.equal(productContract("printable_flyer").width, 1500);
  assert.equal(productContract("printable_flyer").height, 2100);
  assert.equal(productContract("printable_flyer").dpi, 300);
});
test("Astra plans and writes once with fact/private/output/wording boundaries", () => {
  const prompt = buildProductCopyPrompt(event, undefined, "event_page");
  for (const name of [
    "PUBLIC_FACTS",
    "PRIVATE_DIRECTION",
    "OUTPUT_CONTRACT",
    "APPROVED_WORDING",
    "creativePlan",
    "0–4",
  ])
    assert.ok(prompt.includes(name));
  assert.ok(prompt.length < 8500);
  assert.ok(normalizeLiveCardMetadata(copy), "empty optional fields should be accepted");
});
test("artwork contract selects exactly one composition and correct text policy", () => {
  const flyer = buildProductArtworkPrompt(event, undefined, copy, "digital_flyer", 0);
  assert.match(flyer, /No visible words/);
  assert.doesNotMatch(flyer, /bottom 30% free/);
  const live = buildProductArtworkPrompt(event, undefined, copy, "live_card", 0);
  assert.match(live, /complete visible-text whitelist/);
  assert.match(live, /bottom 30%/);
  const property = { ...event, propertyImageUrls: ["one", "two"] };
  const collage = buildProductArtworkPrompt(property, undefined, null, "live_card", 2);
  assert.match(collage, /refined secondary property insets/);
  assert.doesNotMatch(collage, /no collage/);
});
test("standalone flyer typesets exact facts, multiple stops and print density", async () => {
  const details = {
    ...event,
    additionalLocations: [{ label: "Reception", venue: "Rose Room", address: "9 Elm Street" }],
  };
  const blocks = flyerTextBlocks(details, copy).join("\n");
  for (const fact of [
    event.title,
    event.date,
    event.startTime,
    event.venueAddress,
    "Rose Room",
    "9 Elm Street",
  ])
    assert.ok(blocks.includes(fact));
  assert.doesNotMatch(blocks, /RSVP/);
  const png = await composeFlyerExport(image, details, copy, "printable_flyer");
  const meta = await sharp(Buffer.from(png.split(",")[1], "base64")).metadata();
  assert.equal(meta.width, 1500);
  assert.equal(meta.height, 2100);
  assert.equal(meta.density, 300);
});
test("flyer rejects overflow rather than truncating approved wording", async () => {
  await assert.rejects(
    composeFlyerExport(
      image,
      { ...event, approvedWording: "All supplied details must remain. ".repeat(300) },
      copy,
      "digital_flyer",
    ),
    /more wording than fits legibly/,
  );
});
test("one targeted repair is verified, then the complete flyer is returned", async () => {
  stub();
  let checks = 0;
  let repairs = 0;
  mock.method(studioGenerationDeps, "verifyStudioArtwork", async () =>
    ++checks === 1
      ? { status: "failed", issues: ["unexpected_text"] }
      : { status: "passed", issues: [] },
  );
  mock.method(studioGenerationDeps, "editInvitationImageWithOpenAi", async (prompt) => {
    repairs++;
    assert.match(prompt, /unexpected_text/);
    return { ok: true, imageDataUrl: image, warnings: [] };
  });
  const result = await generateStudioInvitation({ event, mode: "both", product: "digital_flyer" });
  assert.equal(result.ok, true);
  assert.equal(result.qualityCheck, "passed");
  assert.equal(repairs, 1);
  assert.equal(checks, 2);
  assert.notEqual(result.imageDataUrl, image);
});
test("repeated image failure cannot return success from the text-only half", async () => {
  stub();
  let repairs = 0;
  mock.method(studioGenerationDeps, "verifyStudioArtwork", async () => ({
    status: "failed",
    issues: ["incorrect_title"],
  }));
  mock.method(studioGenerationDeps, "editInvitationImageWithOpenAi", async () => {
    repairs++;
    return { ok: true, imageDataUrl: image, warnings: [] };
  });
  const result = await generateStudioInvitation({ event, mode: "both", product: "live_card" });
  assert.equal(result.ok, false);
  assert.equal(result.imageDataUrl, null);
  assert.equal(result.errors.image.code, "image_quality_failed");
  assert.equal(repairs, 1);
});
test("unavailable quality check is reported honestly without claiming a passed image", async () => {
  stub();
  mock.method(studioGenerationDeps, "verifyStudioArtwork", async () => ({
    status: "unavailable",
    issues: [],
  }));
  const result = await generateStudioInvitation({ event, mode: "both", product: "live_card" });
  assert.equal(result.ok, true);
  assert.equal(result.qualityCheck, "unavailable");
  assert.ok(result.warnings.some((item) => item.includes("verification was unavailable")));
});
