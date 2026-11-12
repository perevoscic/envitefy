const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");
const themes = loadTs("src/lib/imported-event-theme.ts");
const design = loadTs("src/lib/imported-event-design.ts");
const branding = loadTs("src/lib/source-branding-server.ts");
const { colorContrast } = loadTs("src/lib/color-contrast.ts");
const source = {
  version: 1,
  origin: "website",
  colors: ["#0097c0", "#edbd27"],
  font: "Inter, sans-serif",
  sourceUrl: "https://organizer.test/overview",
};
const fixture = {
  title: "Regional Championships",
  sport: "gymnastics",
  city: "Atlanta",
  seed: "organizer.test/2027",
  branding: source,
};
test("generated artwork survives local blob and HTTPS storage while invalid image URLs are rejected", () => {
  const theme = themes.createImportedEventTheme(fixture);
  for (const artworkUrl of ["/api/blob/event-media/event/theme.webp", "/media/event-media/event/theme.webp", "https://assets.test/theme.webp"]) {
    const saved = themes.readImportedEventTheme({ ...theme, artworkUrl });
    assert.equal(saved.artworkUrl, artworkUrl);
    assert.equal(design.importedArtworkSrc(saved), artworkUrl.replace(/^\/api\/blob\/event-media\//, "/media/event-media/"));
  }
  for (const artworkUrl of ["//outside.test/image", "javascript:alert(1)", "/api/blob/../../private", "/api/blob/%2e%2e/private"])
    assert.equal(themes.readImportedEventTheme({ ...theme, artworkUrl }).artworkUrl, undefined);
});

test("generated artwork uses public storage delivery without changing the saved URL or uploaded hero", () => {
  const artworkUrl = "/api/blob/event-media/meet/theme-original.webp";
  const theme = { ...themes.createImportedEventTheme(fixture), artworkUrl };
  assert.equal(design.importedArtworkSrc(theme, "/templates/default.webp", "/templates/default.webp"), "/media/event-media/meet/theme-original.webp");
  assert.equal(theme.artworkUrl, artworkUrl);
  assert.equal(design.importedArtworkSrc(theme, "/uploads/host.webp", "/templates/default.webp"), "/uploads/host.webp");
  assert.equal(themes.importedArtworkDisplayUrl("/api/blob/profile-media/avatar.webp"), "/api/blob/profile-media/avatar.webp");
  assert.equal(themes.importedArtworkDisplayUrl("/media/event-media/../source.webp"), undefined);
});

test("source branding and confirmed geography create stable event-specific identity", () => {
  const theme = themes.createImportedEventTheme(fixture);
  assert.deepEqual(theme, themes.createImportedEventTheme(fixture));
  assert.equal(theme.colors.accent, source.colors[0]);
  assert.equal(theme.context.city, "Atlanta");
  assert.equal(theme.motif, "gymnastics");
  assert.notEqual(theme.id, themes.createImportedEventTheme({ ...fixture, city: "Boston" }).id);
  assert.deepEqual(themes.readImportedEventTheme(JSON.parse(JSON.stringify(theme))), theme);
});
test("dark source identity stays dark instead of becoming a pale category theme", () => {
  const theme = themes.createImportedEventTheme({
    ...fixture,
    branding: {
      ...source,
      colors: ["#111a3a", "#ff4ba8", "#82ead2"],
      font: "Anton, sans-serif",
      tone: "dark",
    },
  });
  assert.equal(theme.colors.page, "#111a3a");
  assert.equal(theme.colors.accent, "#ff4ba8");
  assert.equal(theme.font, "athletic");
  assert.ok(colorContrast(theme.colors.ink, theme.colors.page) >= 4.5);
  assert.ok(themes.readImportedEventTheme(theme));
});
test("sports profiles work across organizers and sports without inventing a city", () => {
  for (const [sport, motif] of [
    ["gymnastics", "gymnastics"],
    ["football", "field"],
    ["soccer", "field"],
    ["volleyball", "court"],
    ["swimming", "water"],
    ["running", "track"],
    ["cheerleading", "ribbon"],
  ]) {
    const theme = themes.createImportedEventTheme({
      title: "Open",
      sport,
      seed: `other-organizer/${sport}`,
    });
    assert.equal(theme.motif, motif);
    assert.equal(theme.context.city, "");
    assert.ok(themes.readImportedEventTheme(theme));
    if (sport === "gymnastics") assert.equal(design.importedArtworkSrc(theme), undefined);
    else assert.match(design.importedArtworkSrc(theme), /^data:image\/svg\+xml/);
  }
});
test("every palette keeps readable body and button text, including light source colors", () => {
  for (let index = 0; index < 4096; index++) {
    const color = `#${index.toString(16).padStart(3, "0")}`;
    const theme = themes.createImportedEventTheme({
      ...fixture,
      branding: { ...source, colors: [color] },
    });
    assert.ok(themes.readImportedEventTheme(theme), color);
    assert.ok(colorContrast(theme.colors.ink, theme.colors.page) >= 4.5);
    assert.ok(colorContrast(theme.colors.onAccent, theme.colors.accent) >= 4.5);
  }
});
test("redesign is explicit, changes identity and retains source colors and event facts", () => {
  const first = themes.createImportedEventTheme({
    ...fixture,
    hostNotes: "palette: #b51e4d, #1e6bb5",
  });
  const next = themes.redesignImportedEventTheme(first);
  assert.notEqual(next.id, first.id);
  assert.equal(next.revision, 1);
  assert.deepEqual(next.context, first.context);
  assert.equal(next.colors.accent, first.colors.accent);
  assert.equal(next.colors.secondary, first.colors.secondary);
});
test("pipeline refresh preserves disabled themes, explicit opt-outs, saved designs and source facts", () => {
  for (const workflow of ["gymnastics", "football", "sports"]) {
    const input = {
      workflow,
      activityProfile: workflow === "sports" ? "volleyball" : null,
      sourceUrl: "https://other.test/open",
      mappedData: { title: "Open", city: "Chicago", teams: ["Club A"], schedule: "not_posted" },
      branding: source,
    };
    const generated = themes.attachImportedEventTheme({ ...input, currentData: {} });
    assert.equal(generated.importedTheme.colors.accent, source.colors[0]);
    assert.deepEqual(generated.teams, ["Club A"]);
    assert.equal(generated.schedule, "not_posted");
    const host = { ...generated.importedTheme, enabled: false };
    assert.equal(
      themes.attachImportedEventTheme({ ...input, currentData: { importedTheme: host } })
        .importedTheme,
      host,
    );
    assert.equal(
      themes.attachImportedEventTheme({ ...input, currentData: { importedTheme: null } })
        .importedTheme,
      null,
    );
    const selected = themes.attachImportedEventTheme({ ...input, currentData: { templateEditor: true } }).importedTheme;
    if (workflow === "gymnastics") {
      assert.equal(selected.preserveTemplateStyle, true);
      assert.equal(design.importedThemeStyle(selected), undefined);
    } else assert.equal(selected, undefined);
  }
});

test("gymnastics template imports prepare original artwork without replacing their chosen layout, palette or upload", () => {
  const mappedData = { title: "Turners Invitational", venue: "Bradenton Area Convention Center", city: "Palmetto", date: "2027-01-15", pageTemplateId: "moonbeam-balance", heroImage: "/uploads/host.webp" };
  const result = themes.attachImportedEventTheme({ workflow: "gymnastics", currentData: { templateEditor: true, importedTheme: null }, mappedData });
  assert.equal(result.importedTheme.preserveTemplateStyle, true);
  assert.equal(design.importedThemeStyle(result.importedTheme), undefined);
  assert.equal(result.pageTemplateId, mappedData.pageTemplateId);
  assert.equal(result.heroImage, mappedData.heroImage);
  const ready = { ...result.importedTheme, artworkUrl: "https://assets.test/this-meet.webp" };
  assert.equal(design.importedArtworkSrc(ready, undefined, "/templates/default.webp"), ready.artworkUrl);
  assert.equal(design.importedArtworkSrc(ready, mappedData.heroImage, "/templates/default.webp"), mappedData.heroImage);
  assert.equal(themes.readImportedEventTheme(ready).preserveTemplateStyle, true);
});
test("the shared map stage carries URL/PDF branding into every sports builder", async () => {
  const { runDiscoveryMapStage } = loadTs("src/lib/discovery/map.ts", {
    "@/components/gym-meet-templates/registry": {
      DEFAULT_GYM_MEET_TEMPLATE_ID: "classic",
      DEFAULT_NEW_GYM_MEET_TEMPLATE_ID: "airborne-atlas",
    },
    "@/lib/db": { getEventHistoryById: async () => ({ data: {} }) },
    "@/lib/discovery/cancel": { throwIfDiscoveryCancelled: () => {} },
    "@/lib/sport-event-presets": {
      getSportEventPreset: () => ({ key: "volleyball", themeIds: ["volleyball--stadium"] }),
    },
    "@/lib/sports-discovery": {
      getDiscoveryAdapter: () => ({
        map: async () => ({
          title: "Regional Open",
          city: "Denver",
          advancedSections: { schedule: { status: "not_posted" } },
        }),
      }),
    },
  });
  for (const workflow of ["gymnastics", "football", "sports"])
    for (const origin of ["website", "pdf"]) {
      const result = await runDiscoveryMapStage({
        workflow,
        eventId: "fixture",
        source: {
          type: origin === "pdf" ? "file" : "url",
          url: origin === "website" ? "https://other.test/open" : null,
          activityProfile: workflow === "sports" ? "volleyball" : null,
        },
        document: {
          extractionMeta: {
            sourceBranding: { ...source, origin },
            extractedText: "Confirmed event details",
          },
        },
        debug: { coreParseResult: {} },
        pipeline: { reviewFlags: [] },
      });
      assert.equal(result.builderDraft.event.importedTheme.colors.accent, "#0097c0");
      assert.equal(result.builderDraft.event.importedTheme.context.city, "Denver");
      assert.equal(result.builderDraft.event.importedTheme.branding.origin, origin);
      assert.equal(result.builderDraft.event.advancedSections.schedule.status, "not_posted");
    }
});
test("untrusted source values cannot become executable CSS or SVG", () => {
  const theme = themes.createImportedEventTheme({
    ...fixture,
    city: '<script>alert("bad")</script>',
    branding: {
      ...source,
      colors: ["url(https://bad.test)", "#f00; color: red"],
      font: "</style><script>bad</script>",
    },
  });
  assert.equal(theme.colors.accent, "#127c94");
  const svg = decodeURIComponent(design.importedArtworkSrc({ ...theme, motif: "field" }).split(",")[1]);
  assert.ok(!svg.includes("<script>"));
  assert.ok(!JSON.stringify(design.importedThemeStyle(theme)).includes("<script>"));
  assert.equal(
    themes.readImportedEventTheme({ ...theme, colors: { ...theme.colors, page: "url(bad)" } }),
    null,
  );
});
test("custom and uploaded artwork stays intact while template artwork can adopt event art", () => {
  const theme = themes.createImportedEventTheme(fixture);
  assert.equal(
    design.importedArtworkSrc(theme, "/uploads/original.png", "/templates/default.webp"),
    "/uploads/original.png",
  );
  assert.equal(
    design.importedArtworkSrc(theme, "/templates/default.webp", "/templates/default.webp"),
    undefined,
  );
  assert.equal(
    design.importedArtworkSrc({ ...theme, enabled: false }, "/uploads/original.png"),
    "/uploads/original.png",
  );
});
test("gymnastics artwork survives redesign and template styling while explicit uploads still win", () => {
  const artworkUrl = "https://assets.test/venue-original.webp";
  const original = { ...themes.createImportedEventTheme(fixture), artworkUrl };
  const next = themes.redesignImportedEventTheme(original);
  assert.notEqual(next.id, original.id);
  assert.equal(next.artworkUrl, artworkUrl);
  for (const theme of [original, next, { ...original, enabled: false }, { ...next, preserveTemplateStyle: true }]) {
    for (const template of ["/templates/old.webp", "/templates/new.webp"])
      assert.equal(design.importedArtworkSrc(theme, "", template), artworkUrl);
    assert.equal(design.importedArtworkSrc(theme, "/uploads/new.webp", "/templates/new.webp"), "/uploads/new.webp");
  }
});
test("artwork locality comes from an explicit city or printed US address, never a meet title", () => {
  for (const [address, expected] of [
    ["One Haben Blvd., Palmetto, FL, 34221", "Palmetto, FL"],
    ["333 S Franklin St, Tampa, FL 33602", "Tampa, FL"],
    ["100 Arena Dr\nAtlanta, GA 30303, USA", "Atlanta, GA"],
    ["100 Arena Dr", ""], ["Tampa Bay Turners Invitational", ""],
    ["100 Arena Dr, Unknown, ZZ 12345", ""],
  ]) assert.equal(themes.importedArtworkCity("", address), expected, address);
  assert.equal(themes.importedArtworkCity("Palmetto", "333 S Franklin St, Tampa, FL 33602"), "Palmetto");
  const result = themes.attachImportedEventTheme({ currentData: {}, workflow: "gymnastics", mappedData: {
    title: "Tampa Bay Turners Invitational", address: "One Haben Blvd., Palmetto, FL, 34221",
  } });
  assert.equal(result.city, "Palmetto, FL");
  assert.equal(result.importedTheme.context.city, "Palmetto, FL");
});
test("website branding reads inline styles and prioritizes two brand stylesheets through guarded reads", async () => {
  const reads = [];
  const result = await branding.brandingFromWebsite(
    '<link rel="stylesheet" href="/brand.css"><link rel="stylesheet" href="https://cdn.test/component.css"><link rel="stylesheet" href="https://cdn.test/custom.css"><style>.primary{color:#1ae}</style>',
    "https://organizer.test/overview",
    undefined,
    async (url) => {
      reads.push(url);
      return {
        mimeType: "text/css",
        bytes: Buffer.from(
          ".navigation{background-color:rgb(0,151,192)} h1{font-family:Oswald,sans-serif}",
        ),
      };
    },
  );
  assert.deepEqual(reads, ["https://organizer.test/brand.css", "https://cdn.test/custom.css"]);
  assert.ok(result.colors.includes("#11aaee"));
  assert.ok(result.colors.includes("#0097c0"));
  assert.match(result.font, /Oswald/);
});
test("unavailable stylesheet does not fail an otherwise readable source", async () => {
  const result = await branding.brandingFromWebsite(
    '<link rel="stylesheet" href="/missing.css"><style>.brand{color:#064b9e}</style>',
    "https://other.test",
    undefined,
    async () => {
      throw Error("unavailable");
    },
  );
  assert.deepEqual(result.colors, ["#064b9e"]);
});
test("PDF and image colors are sampled from existing page rasters without OCR or image generation", async () => {
  const sharp = require("sharp");
  const bytes = await sharp({
    create: { width: 60, height: 60, channels: 3, background: "#20a060" },
  })
    .png()
    .toBuffer();
  for (const origin of ["pdf", "image"]) {
    const result = await branding.brandingFromImages(
      [`data:image/png;base64,${bytes.toString("base64")}`],
      origin,
    );
    assert.equal(result.origin, origin);
    assert.deepEqual(result.colors, ["#20a060"]);
  }
});
test("labeled public brand images provide a bounded palette fallback when CSS is unavailable", async () => {
  const sharp = require("sharp");
  const bytes = await sharp({
    create: { width: 40, height: 40, channels: 3, background: "#20a060" },
  })
    .png()
    .toBuffer();
  const calls = [];
  const result = await branding.brandingFromWebsite(
    '<link rel="stylesheet" href="/brand.css"><img class="header-logo" src="/brand.png"><img class="body-photo" src="/unrelated.jpg">',
    "https://other.test",
    undefined,
    async (url) => {
      calls.push(url);
      if (url.endsWith(".css")) throw Error("blocked");
      return { mimeType: "image/png", bytes };
    },
  );
  assert.deepEqual(result.colors, ["#20a060"]);
  assert.equal(result.origin, "website");
  assert.deepEqual(calls, ["https://other.test/brand.css", "https://other.test/brand.png"]);
});
test("grayscale documents do not invent a colorful source palette", async () => {
  const bytes = await require("sharp")({ create: { width: 30, height: 30, channels: 3, background: "#888888" } }).greyscale().png().toBuffer();
  const result = await branding.brandingFromImages([`data:image/png;base64,${bytes.toString("base64")}`], "pdf");
  assert.deepEqual(result.colors, []);
});
