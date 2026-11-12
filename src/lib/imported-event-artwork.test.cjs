const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const { createImportedEventTheme } = loadTs("src/lib/imported-event-theme.ts");
const theme = createImportedEventTheme({
  title: "Coastal Open",
  sport: "volleyball",
  city: "Tampa",
  seed: "coastal.test/2027",
});
async function fixture() {
  const png = await require("sharp")({
    create: { width: 30, height: 20, channels: 3, background: "#2389ab" },
  })
    .png()
    .toBuffer();
  let saved = null;
  let generateCalls = 0;
  let uploadCalls = 0;
  const writes = [];
  const uploadPaths = [];
  const generatedReferences = [];
  const generatedPrompts = [];
  let referenceCalls = 0;
  const reference = { venue: "Bradenton Area Convention Center", sourceUrl: "https://venue.test/about", imageUrl: "https://venue.test/exterior.jpg", image: { mimeType: "image/png", data: png.toString("base64") } };
  const mod = loadTs("src/lib/imported-event-artwork.ts", {
    "@/lib/db": {
      query: async (sql, args) => {
        writes.push({ sql, args });
        if (sql.includes("RETURNING user_id")) {
          if (saved?.themeId === args[2] && !(args[3] && saved.status === "failed"))
            return { rows: [] };
          saved = JSON.parse(args[1]);
          return { rows: [{ user_id: "owner" }] };
        }
        if (sql.includes("->>'token' = $3") && saved?.token === args[2])
          saved = JSON.parse(args[1]);
        return { rows: [] };
      },
    },
    "@/lib/history-cache": { invalidateUserHistory: () => {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => {} },
    "@/lib/media-upload-image": {
      uploadPublicBinaryAsset: async ({ bytes, pathname }) => {
        uploadCalls++;
        uploadPaths.push(pathname);
        assert.equal((await require("sharp")(bytes).metadata()).format, "webp");
        return { url: "https://assets.test/event.webp" };
      },
    },
    "./imported-event-artwork-review": {
      reviewImportedSportsArtwork: async () => ({ status: "passed", issues: [] }),
    },
    "./gymnastics-venue-artwork": {
      prepareGymnasticsVenueReference: async () => { referenceCalls++; return reference; },
    },
    "@/lib/studio/openai": {
      generateInvitationImageWithOpenAi: async (_prompt, _references, _product, options) => {
        generateCalls++;
        generatedReferences.push(_references);
        generatedPrompts.push(_prompt);
        assert.equal(options.quality, "high");
        return { ok: true, imageDataUrl: `data:image/png;base64,${png.toString("base64")}` };
      },
    },
  });
  return { ...mod, read: () => saved, calls: () => generateCalls, uploads: () => uploadCalls, uploadPaths, writes, reference, referenceCalls: () => referenceCalls, generatedReferences, generatedPrompts };
}
test("concurrent workers and refreshes reuse one original image request and its stored result", async () => {
  const state = await fixture();
  await Promise.all([
    state.generateImportedEventArtwork("event", theme),
    state.generateImportedEventArtwork("event", theme),
  ]);
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.calls(), 1);
  assert.equal(state.read().status, "ready");
  assert.equal(state.read().imageUrl, "https://assets.test/event.webp");
  assert.equal(state.read().review.status, "passed");
  assert.equal(state.importedArtworkState(state.read()).token, undefined);
});

test("explicit replacements retain earlier assets even when a recovered theme identity is reused", async () => {
  const state = await fixture();
  await state.generateImportedEventArtwork("event", theme);
  await state.generateImportedEventArtwork("event", { ...theme, id: `${theme.id}-replacement` });
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.uploadPaths.length, 3);
  assert.notEqual(state.uploadPaths[0], state.uploadPaths[2]);
  assert.ok(state.uploadPaths.every((path) => path.endsWith(".webp")));
});

test("a physically invalid image is rejected before upload/application without a second generation", async () => {
  const state = await fixture();
  state.importedArtworkDeps.review = async () => ({
    status: "failed",
    issues: [{ code: "unsupported_pose", detail: "The supporting foot floats beside the beam." }],
  });
  await state.generateImportedEventArtwork("event", theme, { applyToImport: true });
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.calls(), 1);
  assert.equal(state.uploads(), 0);
  assert.equal(state.read().status, "failed");
  assert.equal(state.read().review.issues[0].code, "unsupported_pose");
  assert.match(state.read().error, /did not pass/);
  assert.ok(!state.writes.some((write) => write.sql.includes("{importedTheme,artworkUrl}")));
});

test("checker unavailability is reported separately from a confirmed image defect", async () => {
  const state = await fixture();
  state.importedArtworkDeps.review = async () => ({ status: "unavailable", issues: [] });
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.read().review.status, "unavailable");
  assert.match(state.read().error, /realism could not be checked/);
  assert.equal(state.uploads(), 0);
  assert.equal(state.calls(), 1);
});

test("gymnastics briefs feature the actual venue with subtle accessories and motion lines, without a gymnast", async () => {
  const state = await fixture();
  const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", title: "Turners Invitational", city: "Palmetto, FL" } };
  const prompt = state.importedArtworkPrompt(gym, state.reference);
  assert.match(prompt, /actual meet venue the dominant subject/);
  assert.match(prompt, /85 percent/);
  assert.match(prompt, /leather gymnastics grips and a chalk bag/);
  assert.match(prompt, /two delicate sweeping graphic motion lines/);
  assert.match(prompt, /No gymnast, athlete, person/);
  assert.match(prompt, /Bradenton Area Convention Center/);
  assert.match(prompt, /central 55 percent/);
  assert.doesNotMatch(prompt, /one anonymous|split leap|arabesque|Piedmont Park|Plant Hall/);
  assert.match(prompt, /context only, never words to print/);
  for (const sport of ["football", "soccer", "basketball", "swimming", "cycling", "running", "rowing"])
    assert.match(state.importedArtworkPrompt({ ...gym, context: { ...gym.context, sport } }), /ground|planted|equipment-centered/);
});
test("gymnastics passes the verified venue reference to its single image request and reviewer", async () => {
  const state = await fixture();
  let reviewedReference;
  state.importedArtworkDeps.review = async (_image, _sport, _city, reference) => {
    reviewedReference = reference;
    return { status: "passed", issues: [] };
  };
  const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", city: "Palmetto, FL" } };
  await Promise.all([state.generateImportedEventArtwork("event", gym), state.generateImportedEventArtwork("event", gym)]);
  await state.generateImportedEventArtwork("event", gym);
  assert.equal(state.referenceCalls(), 1);
  assert.deepEqual(state.generatedReferences, [[state.reference.image]]);
  assert.equal(reviewedReference, state.reference);
  assert.equal(state.calls(), 1);
  assert.equal(state.read().status, "ready");
  assert.equal(state.read().venueReference.sourceUrl, state.reference.sourceUrl);
  assert.equal(JSON.stringify(state.read()).includes(state.reference.image.data), false, "reference bytes are not stored in history");
});

test("missing venue reference and town stop before image generation and need explicit retry", async () => {
  const state = await fixture();
  const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", city: "" } };
  state.importedArtworkDeps.venueReference = async () => null;
  await state.generateImportedEventArtwork("event", gym);
  await state.generateImportedEventArtwork("event", gym);
  assert.equal(state.calls(), 0);
  assert.equal(state.uploads(), 0);
  assert.equal(state.read().status, "failed");
  assert.match(state.read().error, /No new image was generated/);
  state.importedArtworkDeps.venueReference = async () => state.reference;
  await state.generateImportedEventArtwork("event", gym, { retry: true });
  assert.equal(state.calls(), 1);
  assert.equal(state.read().status, "ready");
});

test("an unavailable venue uses the confirmed host town in one image request, without fabricating the venue", async () => {
  for (const lookup of [async () => null, async () => { throw Error("venue source unavailable"); }]) {
    const state = await fixture();
    state.importedArtworkDeps.venueReference = lookup;
    let reviewedMode;
    state.importedArtworkDeps.review = async (_image, _sport, city, reference, mode) => {
      assert.equal(city, "Palmetto, FL");
      assert.equal(reference, undefined);
      reviewedMode = mode;
      return { status: "passed", issues: [] };
    };
    const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", title: "Tampa Bay Turners Invitational", city: "Palmetto, FL", venue: "Bradenton Area Convention Center" } };
    await state.generateImportedEventArtwork("event", gym);
    await state.generateImportedEventArtwork("event", gym);
    assert.equal(state.calls(), 1);
    assert.equal(state.read().status, "ready");
    assert.equal(state.read().composition, "town");
    assert.equal(state.read().venueReference, undefined);
    assert.equal(state.importedArtworkState(state.read()).composition, "town");
    assert.equal(reviewedMode, "town");
    assert.deepEqual(state.generatedReferences, [undefined]);
    const prompt = state.generatedPrompts[0];
    assert.match(prompt, /Palmetto, FL/);
    assert.match(prompt, /Gymnastics host-town illustration/);
    assert.match(prompt, /No usable venue exterior reference is available/);
    assert.match(prompt, /do not invent or depict that venue/);
    assert.match(prompt, /No gymnast, athlete, person/);
    assert.match(prompt, /grips and a chalk bag/);
    assert.doesNotMatch(prompt, /The attached image is a verified exterior reference|Piedmont Park|Plant Hall/);
  }
});

test("town fallback reads a printed address locality, never the meet name", async () => {
  const state = await fixture();
  state.importedArtworkDeps.venueReference = async () => null;
  const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", city: "", title: "Tampa Bay Turners Invitational", address: "One Haben Blvd., Palmetto, FL, 34221" } };
  await state.generateImportedEventArtwork("event", gym);
  assert.equal(state.read().composition, "town");
  assert.match(state.generatedPrompts[0], /"city":"Palmetto, FL"/);
  assert.doesNotMatch(state.generatedPrompts[0], /Tampa destination/);
});
test("a gymnastics design with retained artwork cannot create a job without explicit replacement", async () => {
  const state = await fixture();
  const gym = { ...theme, id: "new-layout-same-image", context: { ...theme.context, sport: "gymnastics" }, motif: "gymnastics", artworkUrl: "https://assets.test/retained.webp" };
  await state.generateImportedEventArtwork("event", gym, { applyToImport: true });
  assert.equal(state.writes.length, 0);
  assert.equal(state.calls(), 0);
  assert.equal(state.referenceCalls(), 0);
  await state.generateImportedEventArtwork("event", gym, { replace: true });
  assert.equal(state.calls(), 1);
  assert.equal(state.referenceCalls(), 1);
});

test("gymnastics never substitutes city landmarks and variations change lighting without adding people", async () => {
  const state = await fixture();
  const prompts = Array.from({ length: 12 }, (_, i) => state.importedArtworkPrompt({
    ...theme, id: `meet-edition-${i}`, context: { ...theme.context, sport: "gymnastics" },
  }));
  for (const light of ["late-afternoon", "morning", "blue-hour"])
    assert.ok(prompts.some((prompt) => prompt.includes(light)), light);
  assert.equal(prompts[0], state.importedArtworkPrompt({ ...theme, id: "meet-edition-0", context: { ...theme.context, sport: "gymnastics" } }));
  const beam = state.importedArtworkPrompt({ ...theme, context: { ...theme.context, sport: "balance beam" } });
  assert.match(beam, /No gymnast, athlete, person/);
  for (const city of ["Tampa", "Atlanta", "Palmetto, FL", ""]) {
    const prompt = state.importedArtworkPrompt({ ...theme, context: { ...theme.context, sport: "gymnastics", title: "Tampa Bay Turners Invitational", city } });
    assert.doesNotMatch(prompt, /Plant Hall|Piedmont Park|Hillsborough River/);
    assert.match(prompt, /Never substitute a better-known nearby city/);
  }
  assert.equal(state.referenceCalls(), 0);
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.referenceCalls(), 0, "other sports do not research architecture");
});

test("people and venue defects are rejected without an automatic second image request", async () => {
  for (const code of ["unexpected_person", "missing_venue", "venue_mismatch"]) {
    const state = await fixture();
    state.importedArtworkDeps.review = async () => ({ status: "failed", issues: [{ code, detail: "Visible brief mismatch." }] });
    const gym = { ...theme, context: { ...theme.context, sport: "gymnastics" } };
    await state.generateImportedEventArtwork("event", gym, { applyToImport: true });
    await state.generateImportedEventArtwork("event", gym);
    assert.equal(state.calls(), 1);
    assert.equal(state.uploads(), 0);
    assert.match(state.read().error, /venue illustration brief/);
  }
});
test("image failures stay separate from event facts and require an explicit retry", async () => {
  const state = await fixture();
  state.importedArtworkDeps.generate = async () => ({
    ok: false,
    error: { message: "unavailable" },
  });
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(state.read().status, "failed");
  let retried = 0;
  state.importedArtworkDeps.generate = async () => {
    retried++;
    return { ok: false, error: {} };
  };
  await state.generateImportedEventArtwork("event", theme);
  assert.equal(retried, 0);
  await state.generateImportedEventArtwork("event", theme, { retry: true });
  assert.equal(retried, 1);
});
test("automatic image application is restricted to an untouched private import with the same theme", async () => {
  const state = await fixture();
  await state.generateImportedEventArtwork("event", theme, { applyToImport: true });
  const apply = state.writes.find((write) => write.sql.includes("{importedTheme,artworkUrl}"));
  assert.ok(apply);
  assert.match(apply.sql, /NOT \(data \? 'templateEditor' OR data \? 'manualEditor'\)/);
  assert.match(apply.sql, /<> 'published'/);
  assert.equal(apply.args[2], theme.id);
  assert.equal(apply.args[3], "https://assets.test/event.webp");
});
test("the image brief includes verified context and prevents lettering and invented venues", async () => {
  const state = await fixture();
  const prompt = state.importedArtworkPrompt(theme);
  for (const text of [
    "volleyball",
    "Tampa",
    theme.colors.accent,
    "Absolutely no text",
    "do not invent a named venue",
    "never a pictogram",
  ])
    assert.ok(prompt.includes(text), text);
  await state.generateImportedEventArtwork("event", { ...theme, enabled: false });
  assert.equal(state.calls(), 0);
});

test("different meet editions and locations produce different briefs with their own verified venue and date", async () => {
  const state = await fixture();
  const first = createImportedEventTheme({ title: "Tampa Bay Turners Invitational 2027", sport: "gymnastics", city: "Palmetto, FL", venue: "Bradenton Area Convention Center", address: "1 Haben Blvd, Palmetto, FL 34221", date: "January 15–17, 2027", seed: "meet-one" });
  const second = createImportedEventTheme({ ...first.context, title: "Coastal Invitational 2028", city: "Sarasota, FL", date: "January 21–23, 2028", seed: "meet-two" });
  const prompt = state.importedArtworkPrompt(first);
  for (const value of [first.context.title, first.context.city, first.context.venue, first.context.address, first.context.date]) assert.ok(prompt.includes(value));
  assert.notEqual(prompt, state.importedArtworkPrompt(second));
  assert.notEqual(first.id, second.id);
  assert.deepEqual(require("../../scripts/lib/event-messages-test-loader.cjs")("src/lib/imported-event-theme.ts").readImportedEventTheme(first).context, first.context);
});
