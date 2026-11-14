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

test("all sports retain generated artwork across template styling, disabled themes and explicit replacements", () => {
  for (const sport of ["gymnastics", "football", "soccer", "volleyball", "swimming", "dance", "track"]) {
    const theme = { ...themes.createImportedEventTheme({ ...fixture, sport }), artworkUrl: "https://assets.test/original.webp" };
    for (const flags of [{ enabled: false }, { enabled: true, preserveTemplateStyle: true }, { enabled: true }]) {
      const selected = { ...theme, ...flags };
      assert.equal(design.importedArtworkSrc(selected, "/template.webp", "/template.webp"), theme.artworkUrl, sport);
      assert.equal(design.importedArtworkSrc(selected, "/templates/hero-images/sports.webp"), theme.artworkUrl, `${sport}: stored catalog fallback`);
      assert.equal(design.importedArtworkSrc(selected, "/uploaded.webp", "/template.webp"), "/uploaded.webp", sport);
      const restored = themes.readImportedEventTheme(JSON.parse(JSON.stringify(selected)));
      assert.equal(design.importedArtworkSrc(restored, "/template.webp", "/template.webp"), theme.artworkUrl, `${sport}: reload`);
    }
  }
});

test("sports and football accent recipes retain generated surfaces, fonts, ink and media after reload", () => {
  for (const sport of ["football", "volleyball", "soccer", "swimming", "track"]) {
    const original = { ...themes.createImportedEventTheme({ ...fixture, sport }), artworkUrl: "https://assets.test/retained.webp" };
    const baseline = design.importedThemeStyle(original);
    for (let index = 0; index < 6; index++) {
      const selected = themes.readImportedEventTheme(JSON.parse(JSON.stringify({ ...original,
        templateColorCombination: { templateId: original.id, index },
      })));
      const style = design.importedThemeStyle(selected);
      for (const key of ["backgroundColor", "backgroundImage", "color", "--event-paper", "--event-surface", "--event-ink", "--event-font", "--event-source-accent", "--ft-accent", "--ft-paper", "--ft-ground", "--ft-font"])
        assert.equal(style[key], baseline[key], `${sport}/${index}: ${key}`);
      assert.deepEqual(selected.colors, original.colors);
      assert.equal(selected.enabled, original.enabled);
      assert.equal(selected.preserveTemplateStyle, original.preserveTemplateStyle);
      assert.equal(selected.artworkUrl, original.artworkUrl);
    }
    const template = { ...original, preserveTemplateStyle: true };
    assert.equal(design.importedThemeStyle(template), undefined);
    assert.equal(design.importedSportsTheme(template), null);
    const chrome = { pageClass: "original", font: "original" };
    assert.equal(design.importedFootballChrome(chrome, template), chrome);
  }
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
    "@/components/gym-meet-templates/registry": loadTs("src/components/gym-meet-templates/registry.ts"),
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

test("six theme color combinations preserve artwork identity and remain readable after saves", () => {
  const original = { ...themes.createImportedEventTheme(fixture), artworkUrl: "https://assets.test/retained.webp" };
  const options = themes.importedEventThemeColorCombinations(original);
  assert.equal(options.length, 6);
  assert.equal(new Set(options.map(option => JSON.stringify(option.colors))).size, 6);
  assert.deepEqual(options[0].colors, original.colors);
  for (const { colors } of options) {
    const selected = { ...original, colors, enabled: true, preserveTemplateStyle: undefined };
    const restored = themes.readImportedEventTheme(JSON.parse(JSON.stringify(selected)));
    assert.ok(restored);
    assert.equal(restored.id, original.id);
    assert.equal(restored.revision, original.revision);
    assert.equal(restored.artworkUrl, original.artworkUrl);
    assert.equal(restored.font, original.font);
    assert.equal(restored.shape, original.shape);
    assert.deepEqual(restored.colors, colors);
    assert.ok(colorContrast(colors.ink, colors.page) >= 4.5);
    assert.ok(colorContrast(colors.ink, colors.surface) >= 4.5);
    assert.ok(colorContrast(colors.accent, colors.onAccent) >= 4.5);
  }
});

test("each gymnastics template has six related readable accent combinations without surface changes", () => {
  const { GYM_MEET_TEMPLATE_LIBRARY } = loadTs("src/components/gym-meet-templates/registry.ts");
  const paletteSignatures = new Set();
  for (const template of GYM_MEET_TEMPLATE_LIBRARY) {
    const choices = themes.templateAccentColorCombinations(template);
    assert.equal(choices.length, 6, template.id);
    assert.equal(new Set(choices.map(choice => choice.heading)).size, 6, `${template.id}: six distinct title colors`);
    for (const choice of choices) assert.ok(colorContrast(choice.inverseHeading, template.foreground) >= 4.5, `${template.id}: inverse heading`);
    assert.equal(new Set(choices.map(({ button, heading, link }) => `${button}/${heading}/${link}`)).size, 6, template.id);
    paletteSignatures.add(JSON.stringify(choices));
    for (const choice of choices) {
      for (const color of [choice.button, choice.heading, choice.link]) assert.ok(colorContrast(color, template.background) >= 4.5, `${template.id}: ${choice.name}`);
      assert.ok(colorContrast(choice.button, choice.onButton) >= 4.5);
      const original = { ...themes.createImportedEventTheme(fixture), artworkUrl: "https://assets.test/retained.webp" };
      const restored = themes.readImportedEventTheme(JSON.parse(JSON.stringify({ ...original,
        preserveTemplateStyle: true, templateColorCombination: { templateId: template.id, index: choice.index },
      })));
      assert.deepEqual(restored.colors, original.colors, "source colors remain intact");
      assert.equal(restored.id, original.id);
      assert.equal(restored.artworkUrl, original.artworkUrl);
      assert.deepEqual(restored.templateColorCombination, { templateId: template.id, index: choice.index });
    }
  }
  assert.equal(paletteSignatures.size, GYM_MEET_TEMPLATE_LIBRARY.length, "each template has its own combinations");
  for (const index of [-1, 6, 1.5, "2", null]) {
    const original = themes.createImportedEventTheme(fixture);
    assert.equal(themes.readImportedEventTheme({ ...original, templateColorCombination: { templateId: "airborne-atlas", index } }).templateColorCombination, undefined);
  }
});

// Measure visible separation in OKLab, rather than accepting six nearly identical hex strings.
function perceptualColor(hex) {
  const [r, g, b] = [1, 3, 5].map(offset => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

test("accent alternatives have visible separation on light, dark and neutral event palettes", () => {
  const { GYM_MEET_TEMPLATE_LIBRARY } = loadTs("src/components/gym-meet-templates/registry.ts");
  const palettes = [
    { id: "dark-ink-accent", background: "#f6fbfc", foreground: "#142431", accent: "#142431" },
    { id: "rose-navy", background: "#111b3a", foreground: "#fff8fc", accent: "#ff78b7" },
    { id: "light-neutral", background: "#ffffff", foreground: "#222222", accent: "#777777" },
    { id: "dark-neutral", background: "#181818", foreground: "#eeeeee", accent: "#999999" },
    ...GYM_MEET_TEMPLATE_LIBRARY,
  ];
  for (const palette of palettes) {
    const before = JSON.stringify(palette);
    const choices = themes.templateAccentColorCombinations(palette);
    assert.deepEqual(choices, themes.templateAccentColorCombinations(palette), "reopening does not shuffle choices");
    assert.equal(JSON.stringify(palette), before, "the authored palette is unchanged");
    assert.equal(choices[0].heading, palette.foreground, "Original keeps native title color");
    const labs = choices.map(choice => perceptualColor(choice.heading));
    const accentLab = perceptualColor(palette.accent);
    const neutral = Math.hypot(accentLab[1], accentLab[2]) < 0.015;
    for (let first = 0; first < labs.length; first++) {
      for (let second = first + 1; second < labs.length; second++) {
        const distance = Math.hypot(...labs[first].map((value, index) => value - labs[second][index]));
        const minimum = neutral ? 0.018 : palette.id === "dark-ink-accent" ? 0.055 : 0.04;
        assert.ok(distance >= minimum, `${palette.id}: ${choices[first].name}/${choices[second].name} distance ${distance}`);
      }
      for (const role of ["button", "heading", "link"]) {
        assert.ok(colorContrast(choices[first][role], palette.background) >= 4.5, `${palette.id}/${first}/${role}`);
      }
      assert.ok(colorContrast(choices[first].button, choices[first].onButton) >= 4.5);
      if (neutral && first) assert.ok(Math.hypot(labs[first][1], labs[first][2]) < 0.04, "neutral themes stay restrained");
    }
  }
});

test("contrast correction keeps a dark source accent's hue instead of replacing it with body ink", () => {
  const theme = { ...themes.createImportedEventTheme(fixture), colors: {
    page: "#111b3a", surface: "#202b49", ink: "#fff8fc", accent: "#090a27", secondary: "#b787ff", onAccent: "#ffffff",
  } };
  const palette = themes.importedEventAccentPalette({ id: "template", name: "Template", background: "#ffffff", foreground: "#142431", accent: "#127c94" }, theme);
  assert.equal(palette.accent, theme.colors.accent);
  const choices = themes.templateAccentColorCombinations(palette);
  const source = perceptualColor(theme.colors.accent), vivid = perceptualColor(choices[1].heading);
  const sourceHue = Math.atan2(source[2], source[1]), vividHue = Math.atan2(vivid[2], vivid[1]);
  assert.ok(Math.cos(sourceHue - vividHue) > 0.998, "lightness correction retains the source hue");
  assert.ok(colorContrast(choices[1].heading, palette.background) >= 4.5);
  assert.deepEqual(themes.importedEventAccentPalette(palette, { ...theme, preserveTemplateStyle: true }), palette);
});
