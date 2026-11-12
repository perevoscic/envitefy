const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const context = { title: "Tampa Bay Turners Invitational", sport: "gymnastics", city: "Palmetto, FL", venue: "Bradenton Area Convention Center", address: "One Haben Blvd., Palmetto, FL 34221", seed: "fixture" };

async function fixture() {
  const bytes = await require("sharp")({ create: { width: 600, height: 400, channels: 3, background: "#789abc" } }).png().toBuffer();
  const sourceUrl = "https://official.test/venue";
  const imageUrl = "https://cdn.official.test/exterior.png";
  const candidate = { identityConfirmed: true, venue: context.venue, sourceUrl, addressSourceUrl: sourceUrl, imageUrl };
  let html = `<h1>${context.venue}</h1><p>1 Haben Boulevard, Palmetto, FL 34221</p><img src="${imageUrl}" alt="Convention center exterior">`;
  let imageMime = "image/png";
  const reads = [];
  let researchCalls = 0;
  const cacheQueries = [];
  const mod = loadTs("src/lib/gymnastics-venue-artwork.ts", {
    "./create/read-source": { readPublicCreateUrl: async () => { throw Error("no real network in test"); } },
    "./db": { query: async (sql, args) => { cacheQueries.push({ sql, args }); return { rows: [] }; } },
  });
  const result = { status: "completed", output: [
    { type: "web_search_call", action: { sources: [{ url: sourceUrl }] } },
    { type: "message", content: [{ type: "output_text", text: JSON.stringify(candidate) }] },
  ] };
  mod.gymnasticsVenueArtworkDeps.research = async () => { researchCalls++; result.output[1].content[0].text = JSON.stringify(candidate); return result; };
  mod.gymnasticsVenueArtworkDeps.read = async (url, signal) => {
    reads.push(url); assert.ok(signal instanceof AbortSignal);
    return url === sourceUrl ? { bytes: Buffer.from(html), mimeType: "text/html", url } : { bytes, mimeType: imageMime, url };
  };
  return { ...mod, result, candidate, reads, sourceUrl, imageUrl, cacheQueries, researchCalls: () => researchCalls, setHtml: value => { html = value; }, setMime: value => { imageMime = value; } };
}

test("venue reference must be cited, identify the exact venue/city/address, and link a decodable image", async () => {
  const state = await fixture();
  const reference = await state.prepareGymnasticsVenueReference(context);
  assert.equal(reference.venue, context.venue);
  assert.equal(reference.sourceUrl, state.sourceUrl);
  assert.equal(reference.imageUrl, state.imageUrl);
  assert.deepEqual(state.reads, [state.sourceUrl, state.imageUrl]);
  assert.equal(reference.image.mimeType, "image/jpeg");
  assert.equal((await require("sharp")(Buffer.from(reference.image.data, "base64")).metadata()).width, 600);
});

test("ambiguous, uncited or non-HTTPS references never reach a source read", async () => {
  for (const defect of ["ambiguous", "uncited", "incomplete", "http", "credentials"]) {
    const state = await fixture();
    if (defect === "ambiguous") state.candidate.identityConfirmed = false;
    if (defect === "uncited") state.result.output[0].action.sources = [];
    if (defect === "incomplete") state.result.status = "incomplete";
    if (defect === "http") state.candidate.imageUrl = "http://official.test/exterior.png";
    if (defect === "credentials") state.candidate.imageUrl = "https://user:pass@official.test/exterior.png";
    assert.equal(await state.prepareGymnasticsVenueReference(context), null, defect);
    assert.deepEqual(state.reads, [], defect);
  }
});

test("wrong cities, branches and unlinked assets stop before image retrieval", async () => {
  for (const body of [
    "<h1>Another Convention Center</h1><p>1 Haben Blvd, Palmetto</p>",
    `<h1>${context.venue}</h1><p>1 Haben Blvd, Atlanta</p>`,
    `<h1>${context.venue}</h1><p>99 Other Road, Palmetto</p>`,
    `<h1>${context.venue}</h1><p>1 Haben Blvd, Palmetto</p>`,
  ]) {
    const state = await fixture(); state.setHtml(body);
    assert.equal(await state.prepareGymnasticsVenueReference(context), null);
    assert.ok(state.reads.every(url => url === state.sourceUrl));
  }
});

test("a cited official address page can corroborate an architect's exterior gallery", async () => {
  const state = await fixture();
  const addressUrl = "https://county.test/venue-address";
  state.candidate.addressSourceUrl = addressUrl;
  state.result.output[0].action.sources.push({ url: addressUrl });
  const read = state.gymnasticsVenueArtworkDeps.read;
  state.setHtml(`<h1>${context.venue}</h1><p>Palmetto, Florida</p><img src="${state.imageUrl}">`);
  state.gymnasticsVenueArtworkDeps.read = async (url, signal) => url === addressUrl
    ? { bytes: Buffer.from(`<p>${context.venue}, 1 Haben Blvd, Palmetto, FL 34221</p>`), mimeType: "text/html", url }
    : read(url, signal);
  const reference = await state.prepareGymnasticsVenueReference(context);
  assert.equal(reference.imageUrl, state.imageUrl);
  assert.equal(reference.addressSourceUrl, addressUrl);
});

test("unsupported files and source outages never become venue references", async () => {
  const state = await fixture(); state.setMime("image/svg+xml");
  assert.equal(await state.prepareGymnasticsVenueReference(context), null);
  state.gymnasticsVenueArtworkDeps.read = async () => { throw Error("private network or source unavailable"); };
  assert.equal(await state.prepareGymnasticsVenueReference(context), null);
  assert.equal(await state.prepareGymnasticsVenueReference({ ...context, venue: "", address: "" }), null);
  assert.equal(state.researchCalls(), 2, "missing location evidence does not start research");
});

test("an owner's verified reference is re-read and reused without another web lookup", async () => {
  const state = await fixture();
  let requestedOwner;
  state.gymnasticsVenueArtworkDeps.cached = async (_context, ownerId) => {
    requestedOwner = ownerId;
    return [{ context: { ...context, address: "1 Haben Boulevard, Palmetto, FL 34221" }, reference: state.candidate }];
  };
  assert.equal((await state.prepareGymnasticsVenueReference(context, "owner")).imageUrl, state.imageUrl);
  assert.equal(requestedOwner, "owner");
  assert.equal(state.researchCalls(), 0);
  assert.deepEqual(state.reads, [state.sourceUrl, state.imageUrl]);
});

test("cache reads are owner-scoped and mismatched branches are never reused", async () => {
  const state = await fixture();
  await state.prepareGymnasticsVenueReference(context, "owner-1");
  assert.equal(state.cacheQueries.length, 1);
  assert.match(state.cacheQueries[0].sql, /user_id = \$1/);
  assert.match(state.cacheQueries[0].sql, /status' = 'ready'/);
  assert.deepEqual(state.cacheQueries[0].args, ["owner-1", context.venue, context.city]);
  state.gymnasticsVenueArtworkDeps.cached = async () => [{ context: { ...context, address: "99 Other Rd, Palmetto, FL" }, reference: state.candidate }];
  state.result.status = "incomplete";
  state.reads.length = 0;
  assert.equal(await state.prepareGymnasticsVenueReference(context, "owner-1"), null);
  assert.deepEqual(state.reads, []);
});

test("stale cached references fall back to fresh research instead of bypassing verification", async () => {
  const state = await fixture();
  state.gymnasticsVenueArtworkDeps.cached = async () => [{ context, reference: { ...state.candidate, imageUrl: "https://official.test/unlinked.png" } }];
  const reference = await state.prepareGymnasticsVenueReference(context, "owner");
  assert.equal(reference.imageUrl, state.imageUrl);
  assert.equal(state.researchCalls(), 1);
});
