const test = require("node:test");
const assert = require("node:assert/strict");
const sharp = require("sharp");
const load = require("./lib/event-messages-test-loader.cjs");
const cache = new Map();
const { createLiveCardForm, validateLiveCard } = load("src/lib/livecard-builder.ts", {}, cache);
const { cardEventTextSource, hasGeneratedCardHeadlineForForm, readSharedCardDesign, sharedCardContent } = load("src/lib/shared-card-design.ts", {}, cache);
const { generateCardHeadline, headlineGenerationDeps } = load("src/lib/shared-card-headline.ts", {}, cache);
const { generateSharedCard, sharedCardGenerationDeps: deps } = load("src/lib/shared-card-generation.ts", {}, cache);
const form = { ...createLiveCardForm("America/Chicago"), title: "Élodie & Søren’s Evening", headlineIntro: "Join us", design: "Candlelit editorial garden", date: "2027-11-15", startTime: "18:30", endTime: "20:00", locations: [{ id: "primary", venue: "The Garden Room", address: "123 Test Lane", resolution: "manual", timezone: "America/Chicago" }] };
const design = { version: 1, backgroundUrl: "/background.webp", font: "classic", typography: "editorial", ink: "#fff8ed", accent: "#e8c289", surface: "#17212b", letteringStyle: { version: 1, titleFont: "classic", introFont: "cormorant", direction: "Warm candlelit elegance", artworkDirection: "Quiet dark garden", texturePrompt: "", preferredTop: 180, ornament: false, includeEventDetails: true } };

test("generation requires main info and ignores unfinished optional guest settings", () => {
  assert.deepEqual(Object.keys(validateLiveCard(createLiveCardForm(), "generate")), ["title", "design", "date", "startTime", "locations"]);
  assert.deepEqual(validateLiveCard({ ...form, rsvpEnabled: true, hostPhone: "", hostName: "", registryEnabled: true, registryUrl: "" }, "generate"), {});
  assert.ok(validateLiveCard({ ...form, startTime: "", date: "2027-02-30" }, "generate").startTime);
  assert.ok(validateLiveCard({ ...form, endTime: "17:00" }, "generate").endTime);
});

test("Live Card artwork prints only approved title/opening; facts stay behind buttons and in invitation downloads", async t => {
  const original = { ...headlineGenerationDeps };
  t.after(() => Object.assign(headlineGenerationDeps, original));
  const bg = await sharp({ create: { width: 1000, height: 1500, channels: 3, background: "#17212b" } }).webp().toBuffer();
  const current = { ...design, backgroundUrl: `data:image/webp;base64,${bg.toString("base64")}` };
  headlineGenerationDeps.references = async () => { throw new Error("No asset fetch"); };
  const first = await generateCardHeadline(form, current);
  assert.equal(first.detailLines, undefined, "date, time and location never enter Live Card lettering");
  const saved = readSharedCardDesign(JSON.parse(JSON.stringify({ ...current, headline: first })));
  assert.deepEqual(saved.headline.detailLines, first.detailLines);
  assert.equal(hasGeneratedCardHeadlineForForm(form, saved), true);
  const optional = { ...form, overview: "Do not print", instructions: "Do not print", registryUrl: "https://example.com/gifts", hostPhone: "3125550100", rsvpEnabled: true };
  assert.equal(hasGeneratedCardHeadlineForForm(optional, saved), true);
  const next = { ...form, date: "2027-11-16", locations: [{ ...form.locations[0], venue: "The New Room" }] };
  assert.equal(hasGeneratedCardHeadlineForForm(next, saved), true, "event fact edits do not invalidate title-only artwork");
  const changed = await generateCardHeadline(next, saved);
  assert.equal(changed.detailLines, undefined);
  assert.equal(changed.imageUrl, first.imageUrl, "fact changes leave composed Live Card pixels identical");
  const contaminated = { ...saved, headline: { ...first, detailLines: ["An incorrectly printed date"] } };
  assert.equal(hasGeneratedCardHeadlineForForm(form, contaminated), false, "previous detail-bearing layers cannot be reused");
  const repaired = await generateCardHeadline(form, contaminated);
  assert.equal(repaired.detailLines, undefined);
  assert.equal(repaired.imageUrl, first.imageUrl);
  assert.equal(saved.backgroundUrl, current.backgroundUrl);
  const content = sharedCardContent({ ...cardEventTextSource(form), sharedDesign: saved });
  assert.ok(content.paragraphs.join(" ").includes("November 15, 2027"), "standalone invitation downloads retain event details");
  assert.ok(content.paragraphs.join(" ").includes("The Garden Room"));
});

test("oversized main wording fails before paid artwork and the planner receives only confirmed facts", async t => {
  const original = { ...deps };
  t.after(() => Object.assign(deps, original));
  let planned, images = 0;
  deps.createClient = () => ({ chat: { completions: { create: async input => {
    planned = JSON.parse(input.messages[1].content);
    return { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(design) } }] };
  } } } });
  deps.generateImage = async () => { images++; throw new Error("Should not buy artwork"); };
  await assert.rejects(generateSharedCard({ ...form, title: "Too many exact words ".repeat(100) }), /Shorten/);
  assert.equal(images, 0);
  assert.equal(planned.confirmedWording.mainDetails, undefined, "facts are excluded from lettering direction");
  assert.equal(planned.confirmedWording.openingLine, form.headlineIntro);
  await assert.rejects(generateSharedCard({ ...form, title: "Zoë & 李明 — مرحباً 2027 🎉" }), /cannot display some of these characters/);
  assert.equal(images, 0, "unsupported glyphs fail before paid artwork instead of becoming boxes");
});

test("the durable job API rejects incomplete main info before creating a job", async () => {
  let jobs = 0;
  const api = load("src/app/api/livecard-builder/jobs/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) }, after: () => {} },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "owner" },
    "@/lib/livecard-api-access": { builderApiAccess: async () => null },
    "@/lib/creation-access": { liveCardCreationCategories: () => ["general"] },
    "@/lib/creation-access-server": { checkCreationAccess: async () => null },
    "@/lib/db": { getEventHistoryById: async () => null },
    "@/lib/event-collaboration": { getEventPermissions: async () => ({ canEdit: true }) },
    "@/lib/livecard-artwork-jobs": { createArtworkJob: async () => { jobs++; return { id: "job", state: "queued" }; }, runArtworkJob: async () => {}, readArtworkJobForAccess: async () => null, cancelArtworkJob: async () => null },
  });
  const request = value => new Request("https://envitefy.com/api/livecard-builder/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
  const missing = await api.POST(request({ form: { ...form, date: "" }, key: "original" }));
  assert.equal(missing.status, 400); assert.equal(jobs, 0);
  assert.equal((await api.POST(request({ form, key: "complete" }))).status, 202); assert.equal(jobs, 1);
  assert.equal((await api.POST(request(null))).status, 400);
});
