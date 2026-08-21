import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("wedding headings inherit each theme's contrast color", () => {
  const globalStyles = readSource("src/app/globals.css");

  assert.match(
    globalStyles,
    /h1,\s*\n\s*h2,\s*\n\s*h3,\s*\n\s*h4,\s*\n\s*h5\s*\{[\s\S]*?color:\s*inherit;/,
    "global heading styles must not replace light text supplied by dark wedding themes",
  );
});

test("photographic wedding title cards stay at the image edges", () => {
  const floridaSource = readSource(
    "src/app/event/weddings/_renderers/florida-coastal-wedding.tsx",
  );
  const europeSource = readSource(
    "src/app/event/weddings/_renderers/europe-coastal-wedding.tsx",
  );
  const winterSource = readSource("src/app/event/weddings/_renderers/winter-wedding.tsx");

  assert.match(floridaSource, /h-\[55svh\][\s\S]*?md:max-w-\[36rem\]/);
  assert.match(europeSource, /h-\[55svh\][\s\S]*?md:max-w-\[35rem\]/);
  assert.match(winterSource, /h-\[58svh\][\s\S]*?md:max-w-\[26rem\]/);
});

test("library wedding keeps its title cover separate from the couple portrait", () => {
  const librarySource = readSource(
    "src/app/event/weddings/_renderers/library-wedding.tsx",
  );

  assert.match(
    librarySource,
    /data-library-cover[\s\S]*data-library-photo[\s\S]*src=\{heroImage\}/,
  );
  assert.doesNotMatch(
    librarySource,
    /<header[^>]*>[\s\S]*?<div className="absolute inset-0 z-0">[\s\S]*?src=\{heroImage\}/,
    "the library portrait must not sit behind its oversized title card",
  );
});

test("rustic boho collage uses its editable hero and reliable local detail photos", () => {
  const rusticSource = readSource(
    "src/app/event/weddings/_renderers/rustic-boho.tsx",
  );

  assert.match(rusticSource, /customHeroImage[\s\S]*theme\.decorations\?\.heroImage/);
  for (const asset of ["detail-bouquet.webp", "detail-hands.webp"]) {
    assert.match(rusticSource, new RegExp(asset.replace(".", "\\.")));
    assert.ok(
      fs.existsSync(path.join(repoRoot, "public", "templates", "weddings", "rustic-boho", asset)),
      `${asset} should exist as a local Rustic Boho asset`,
    );
  }
  assert.doesNotMatch(
    rusticSource,
    /images\.unsplash\.com/,
    "Rustic Boho must not depend on expiring external collage images",
  );
});

test("wedding customize preview renders each selected design's real layout", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");
  const rendererSource = readSource("src/components/weddings/WeddingRenderer.tsx");
  const previewSource = readSource("src/components/weddings/WeddingDesignPreview.tsx");
  const catalog = JSON.parse(readSource("templates/weddings/index.json"));

  assert.doesNotMatch(customizeSource, /renderMode="scanned-invite-preview"/);
  assert.match(customizeSource, /template=\{selectedTemplate\}/);
  assert.match(customizeSource, /event=\{previewEvent\}/);
  assert.match(previewSource, /<WeddingRenderer template=\{template\} event=\{previewEvent\}/);
  assert.match(previewSource, /layout: design\.layout/);
  assert.match(previewSource, /heroImage: design\.heroImage/);
  assert.doesNotMatch(
    previewSource,
    /switch\s*\(design\.layout\)/,
    "gallery thumbnails should render the real template instead of a parallel mockup",
  );

  const layouts = catalog.map((design) => design.layout);
  const heroImages = catalog.map((design) => design.heroImage);
  assert.equal(catalog.length, 40, "the wedding gallery should offer 40 designs");
  assert.equal(new Set(layouts).size, layouts.length, "every listed wedding design needs a unique layout");
  assert.equal(
    new Set(heroImages).size,
    heroImages.length,
    "every listed wedding design needs a unique hero image",
  );

  for (const design of catalog) {
    const config = JSON.parse(readSource(`templates/weddings/${design.id}/config.json`));
    assert.equal(config.id, design.id, `${design.id} catalog id should match its config`);
    assert.equal(config.layout, design.layout, `${design.id} should use its corresponding renderer layout`);
    assert.equal(
      config.theme.decorations.heroImage,
      design.heroImage,
      `${design.id} thumbnail and selected event should use the same hero image`,
    );
    if (design.heroImage.includes("/generated-heroes/")) {
      assert.match(design.heroImage, /\.webp$/);
      assert.ok(
        fs.existsSync(path.join(repoRoot, "public", design.heroImage.replace(/^\/+/, ""))),
        `${design.id} generated WebP hero should exist on disk`,
      );
    }
    assert.equal(config.theme.colors.primary, design.primaryColor);
    assert.equal(config.theme.colors.secondary, design.secondaryColor);
    assert.equal(config.theme.fonts.headline, design.headlineFont);
    assert.equal(config.theme.fonts.body, design.bodyFont);
    assert.match(
      rendererSource,
      new RegExp(`case ["']${design.layout}["']:`),
      `${design.id} should have a renderer case for ${design.layout}`,
    );
    assert.match(
      customizeSource,
      new RegExp(`["']${design.id}["']\\s*:`),
      `${design.id} should be selectable in Customize`,
    );
  }
});

test("wedding creation starts with the design gallery and preserves the selected design", () => {
  const galleryPageSource = readSource("src/app/event/weddings/page.tsx");
  const gallerySource = readSource("src/components/weddings/WeddingDesignGallery.tsx");
  const previewSource = readSource("src/components/weddings/WeddingDesignPreview.tsx");
  const metadataSource = readSource("src/lib/wedding-designs.ts");
  const catalog = JSON.parse(readSource("templates/weddings/index.json"));

  assert.match(galleryPageSource, /<WeddingDesignGallery\s*\/>/);
  assert.match(gallerySource, /params\.set\("templateId", templateId\)/);
  assert.match(gallerySource, /label="Style"/);
  assert.match(gallerySource, /label="Color"/);
  assert.match(gallerySource, /label="Season"/);
  assert.match(
    gallerySource,
    /<article key=\{design\.id\}[\s\S]*?<Link[\s\S]*?<\/Link>[\s\S]*?<WeddingDesignPreview/,
    "the card link must be a sibling of the rendered template so template links are never nested",
  );
  assert.match(previewSource, /aria-hidden="true"[\s\S]*?inert/);

  for (const design of catalog) {
    assert.match(
      metadataSource,
      new RegExp(`["']${design.id}["']\\s*:`),
      `${design.id} should have gallery metadata`,
    );
  }

  const previewNameEntries = [
    ...metadataSource.matchAll(/^\s+"([^"]+)": "([^"]+ & [^"]+)",$/gm),
  ];
  const previewNames = previewNameEntries.map((entry) => entry[2]);
  assert.equal(previewNames.length, catalog.length, "every design should have preview couple names");
  assert.equal(new Set(previewNames).size, previewNames.length, "preview couple names should be unique");
  assert.ok(!previewNames.includes("Ava & Mason"), "gallery previews should not default to Ava & Mason");
});

test("wedding details do not offer a second design selection step", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");
  const mainMenuSource = customizeSource.slice(
    customizeSource.indexOf("const renderMainMenu"),
    customizeSource.indexOf("const renderHeadlineEditor"),
  );

  assert.doesNotMatch(mainMenuSource, /title="Design"/);
});

test("new wedding drafts use the selected template image until the user uploads one", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");

  assert.match(customizeSource, /hero: null as string \| null/);
  assert.match(customizeSource, /gallery: \[\] as Array/);
  assert.match(customizeSource, /fallbackHeroImage[\s\S]*selectedTemplate/);
  assert.match(customizeSource, /customHeroImage: data\.images\?\.hero \|\| undefined/);
});

test("wedding image editor identifies and previews the current template hero", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");

  assert.match(customizeSource, /const currentHeroImage = data\.images\.hero \|\| fallbackHeroImage/);
  assert.match(customizeSource, /src=\{currentHeroImage\}/);
  assert.match(customizeSource, /Main \/ top image/);
  assert.match(customizeSource, /Template image/);
  assert.match(customizeSource, /Custom replacement/);
  assert.match(customizeSource, /Replace template image/);
  assert.match(customizeSource, /Restore template image/);
});

test("the 20 expanded wedding designs use signature page compositions instead of shared color swaps", () => {
  const rendererSource = readSource("src/components/weddings/WeddingRenderer.tsx");
  const signatureSource = readSource(
    "src/app/event/weddings/_renderers/signature-wedding-layouts.tsx",
  );
  const layouts = [
    ["split-hero", "An evening in celebration"],
    ["floral-frame", "Together with their families"],
    ["two-column", "At golden hour"],
    ["crest-header", "The honour of your presence is requested"],
    ["botanical-borders", "Within the garden walls"],
    ["soft-pastel-hero", "A soft beginning"],
    ["arched-hero", "Under the same moon"],
    ["parchment-hero", "Once upon a forever"],
    ["full-width-luxury", "Champagne · Candlelight · Forever"],
    ["starry-hero", "The universe conspired"],
    ["centered-minimal-hero", "Pearl Tide"],
    ["split-texture-banner", "Harvested with love"],
    ["crest-centered-ribbon", "A new family crest"],
    ["deep-overlay-hero", "Nocturne No. 01"],
    ["cascading-floral-top", "Love, in full cascade"],
    ["airy-horizontal-hero", "A celebration by the sea"],
    ["marble-slab-hero", "Carved into forever"],
    ["botanical-arch-border", "Beneath the willow"],
    ["silver-gradient-hero", "A winter gala"],
    ["warm-leaf-header", "An autumn waltz"],
  ];

  assert.doesNotMatch(
    signatureSource,
    /ContentSections/,
    "expanded designs should not fall back to the generic wedding section stack",
  );
  assert.equal(
    rendererSource.match(/<SignatureWeddingLayout layout=\{layout\}/g)?.length,
    layouts.length,
    "all expanded designs should use their signature renderer",
  );

  for (const [layout, signature] of layouts) {
    assert.match(signatureSource, new RegExp(`case ["']${layout}["']:`));
    assert.match(signatureSource, new RegExp(signature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("wedding customize provides a return path to the design gallery", () => {
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");

  assert.match(customizeSource, /All wedding designs/);
  assert.match(customizeSource, /router\.push\(designGalleryHref\)/);
  assert.match(customizeSource, /return `\/event\/weddings\$\{query/);
  assert.match(
    customizeSource,
    /data-wedding-preview[\s\S]*pointer-events-auto relative isolate z-0[\s\S]*contain: "paint"/,
    "the real customize preview must stay contained while allowing its navigation links to work",
  );
});

test("California wedding navigation points to real preview sections", () => {
  const californiaSource = readSource(
    "src/app/event/weddings/_renderers/california-coastal-wedding.tsx",
  );
  const customizeSource = readSource("src/app/event/weddings/customize/page.tsx");

  assert.match(customizeSource, /overflow-y-auto scrollbar-hide scroll-smooth/);
  for (const sectionId of ["vibe", "location", "rsvp"]) {
    assert.match(californiaSource, new RegExp(`href="#${sectionId}"`));
    assert.match(californiaSource, new RegExp(`id="${sectionId}"`));
  }
});

test("all 40 wedding designs load CTAs with real destinations", () => {
  const dedicatedRenderers = [
    "gilded-wedding",
    "modern-editorial",
    "rustic-boho",
    "cinematic-wedding",
    "celestial-wedding",
    "ethereal-classic",
    "museum-wedding",
    "ethereal-wedding",
    "noir-luxury",
    "retro-70s",
    "newspaper-wedding",
    "bauhaus-wedding",
    "europe-coastal-wedding",
    "florida-coastal-wedding",
    "california-coastal-wedding",
    "winter-wedding",
    "industrial-wedding",
    "library-wedding",
    "garden-wedding",
    "skyline-wedding",
  ];
  const rendererSources = dedicatedRenderers.map((renderer) => ({
    renderer,
    source: readSource(`src/app/event/weddings/_renderers/${renderer}.tsx`),
  }));

  for (const { renderer, source } of rendererSources) {
    assert.doesNotMatch(source, /href=(?:"#"|'#'|\{[^}]*\|\|\s*["']#["'][^}]*\})/, `${renderer} must not render an empty CTA`);
    for (const match of source.matchAll(/href=["']#([^"']+)["']/g)) {
      const target = match[1];
      assert.match(
        source,
        new RegExp(`id=["']${target}["']`),
        `${renderer} CTA #${target} needs a rendered target`,
      );
    }
  }

  const rsvpTargetRenderers = [
    "gilded-wedding",
    "celestial-wedding",
    "museum-wedding",
    "noir-luxury",
    "newspaper-wedding",
    "bauhaus-wedding",
    "library-wedding",
    "garden-wedding",
    "skyline-wedding",
    "rustic-boho",
  ];
  for (const renderer of rsvpTargetRenderers) {
    const source = rendererSources.find((entry) => entry.renderer === renderer)?.source || "";
    assert.match(source, /id="rsvp"/, `${renderer} needs a local RSVP destination`);
  }

  const signatureSource = readSource(
    "src/app/event/weddings/_renderers/signature-wedding-layouts.tsx",
  );
  assert.match(signatureSource, /id=\{event\.rsvpEnabled \? "rsvp" : undefined\}/);
  assert.doesNotMatch(signatureSource, /href=(?:"#"|'#')/);

  const contentSectionsSource = readSource(
    "src/app/event/weddings/_renderers/content-sections.tsx",
  );
  assert.match(contentSectionsSource, /buildWeddingLocationHref/);
  assert.match(contentSectionsSource, /<section id="rsvp"/);
  assert.doesNotMatch(contentSectionsSource, /href=\{event\.rsvpLink\}/);
});
