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
    "@/lib/studio/openai": {
      generateInvitationImageWithOpenAi: async (_prompt, _references, _product, options) => {
        generateCalls++;
        assert.equal(options.quality, "high");
        return { ok: true, imageDataUrl: `data:image/png;base64,${png.toString("base64")}` };
      },
    },
  });
  return { ...mod, read: () => saved, calls: () => generateCalls, uploads: () => uploadCalls, uploadPaths, writes };
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

test("sports briefs specify apparatus contact and never derive demographics from geography or titles", async () => {
  const state = await fixture();
  const gym = { ...theme, context: { ...theme.context, sport: "gymnastics", title: "Atlanta Invitational", city: "Atlanta" } };
  const prompt = state.importedArtworkPrompt(gym);
  assert.match(prompt, /both bare feet placed lengthwise/);
  assert.match(prompt, /complete feet, their contact with the beam/);
  assert.match(prompt, /Never infer or select an athlete's race/);
  assert.match(prompt, /no racial group is required or excluded/);
  assert.ok(!prompt.includes("Atlanta Invitational"));
  for (const sport of ["football", "soccer", "basketball", "swimming", "cycling", "running", "rowing"])
    assert.match(state.importedArtworkPrompt({ ...gym, context: { ...gym.context, sport } }), /ground|planted|equipment-centered/);
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
