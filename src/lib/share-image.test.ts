import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") }, fsCache: false });
const { resolveEventShareImage, toPublicShareMediaUrl } = jiti("./share-image.ts");
const { GYM_MEET_TEMPLATE_LIBRARY } = jiti("../components/gym-meet-templates/registry.ts");
const { createImportedEventTheme } = jiti("./imported-event-theme.ts");
const importedTheme = (artworkUrl: string) => ({
  ...createImportedEventTheme({ title: "Our event", sport: "gymnastics", seed: "share-preview" }),
  artworkUrl,
});

test("toPublicShareMediaUrl moves event blobs outside the robots-blocked API namespace", () => {
  assert.equal(
    toPublicShareMediaUrl("/api/blob/event-media/upload-123/attachment/thumb.webp"),
    "/media/event-media/upload-123/attachment/thumb.webp",
  );
  assert.equal(
    toPublicShareMediaUrl(
      "https://envitefy.com/api/events/event-123/thumbnail?variant=hero&v=abc",
    ),
    "/media/events/event-123/thumbnail?variant=hero&v=abc",
  );
});

test("resolveEventShareImage substitutes the uncropped lightweight variant of uploaded artwork", () => {
  assert.deepEqual(
    resolveEventShareImage({
      coverImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
      thumbnail: "/api/blob/event-media/upload-123/attachment/display.webp",
      attachment: {
        dataUrl: "/api/blob/event-media/upload-123/attachment/source/invite.jpg",
        previewImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
        thumbnailUrl: "/api/blob/event-media/upload-123/attachment/thumb.webp",
        thumbnailWidth: 560,
        thumbnailHeight: 784,
        thumbnailMimeType: "image/webp",
        thumbnailSizeBytes: 91478,
      },
    }),
    {
      url: "/media/event-media/upload-123/attachment/thumb.webp",
      width: 560,
      height: 784,
      type: "image/webp",
      sizeBytes: 91478,
    },
  );
});

test("resolveEventShareImage preserves an explicitly designed cover", () => {
  assert.deepEqual(
    resolveEventShareImage({
      coverImageUrl: "/studio/final-invitation.webp",
      attachment: {
        previewImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
        thumbnailUrl: "/api/blob/event-media/upload-123/attachment/thumb.webp",
      },
    }),
    {
      url: "/studio/final-invitation.webp",
      type: "image/webp",
    },
  );
});

test("resolveEventShareImage rejects inline data and malformed media URLs", () => {
  assert.equal(resolveEventShareImage({ coverImageUrl: "data:image/png;base64,abc" }), null);
  assert.equal(resolveEventShareImage({ coverImageUrl: "not-a-url" }), null);
});

test("gymnastics share previews use the artwork rendered by every selected template", () => {
  for (const template of GYM_MEET_TEMPLATE_LIBRARY) {
    assert.deepEqual(
      resolveEventShareImage({
        category: "sport_gymnastics_schedule",
        pageTemplateId: template.id,
        coverImageUrl: "/uploads/meet-packet.png",
        attachment: { thumbnailUrl: "/uploads/meet-packet.png" },
      }),
      { url: template.artwork, type: "image/webp" },
      template.id,
    );
  }
});

test("gymnastics share previews follow the renderer's default for retired designs", () => {
  for (const data of [
    { category: "gymnastics" },
    { category: "sport_gymnastics" },
    { templateId: "gymnastics-schedule", pageTemplateId: "retired-design" },
    { templateId: "gymnastics" },
  ]) {
    assert.equal(resolveEventShareImage(data)?.url, GYM_MEET_TEMPLATE_LIBRARY[0].artwork);
  }
  assert.equal(resolveEventShareImage({ category: "unrecognized", pageTemplateId: "airborne-atlas" }), null);
});

test("gymnastics previews prefer current uploaded or imported artwork over the template", () => {
  const event = {
    category: "gymnastics",
    pageTemplateId: "airborne-atlas",
    coverImageUrl: "/uploads/old-cover.png",
    importedTheme: importedTheme("/api/blob/event-media/imported/design.webp"),
  };
  assert.equal(resolveEventShareImage(event)?.url, "/media/event-media/imported/design.webp");
  assert.equal(
    resolveEventShareImage({ ...event, heroImage: GYM_MEET_TEMPLATE_LIBRARY[0].artwork })?.url,
    "/media/event-media/imported/design.webp",
  );
  assert.equal(
    resolveEventShareImage({ ...event, heroImage: "/uploads/host-selected.webp" })?.url,
    "/uploads/host-selected.webp",
  );
  assert.equal(
    resolveEventShareImage({ ...event, importedTheme: { ...event.importedTheme, enabled: false } })?.url,
    GYM_MEET_TEMPLATE_LIBRARY[0].artwork,
  );
});

test("gymnastics previews retain the public media URL for legacy inline heroes", () => {
  assert.equal(
    resolveEventShareImage({
      category: "gymnastics",
      coverImageUrl: "/api/events/event-123/thumbnail?variant=hero&v=abc",
    })?.url,
    "/media/events/event-123/thumbnail?variant=hero&v=abc",
  );
});

test("discovery share previews use saved builder artwork and preserve explicit theme choices", () => {
  const event = {
    createdVia: "meet-discovery-v2",
    category: "gymnastics",
    pageTemplateId: "airborne-atlas",
    builderDraft: {
      event: {
        pageTemplateId: "neon-runway",
        importedTheme: importedTheme("/api/blob/event-media/imported/old-design.webp"),
      },
    },
    importedTheme: null,
  };
  assert.equal(
    resolveEventShareImage(event)?.url,
    GYM_MEET_TEMPLATE_LIBRARY.find((template) => template.id === "neon-runway")?.artwork,
  );
  assert.equal(
    resolveEventShareImage({
      ...event,
      builderDraft: { event: { ...event.builderDraft.event, heroImage: "/uploads/current-hero.webp" } },
    })?.url,
    "/uploads/current-hero.webp",
  );
});

test("share previews read custom Event Page artwork and nested hero images", () => {
  assert.equal(
    resolveEventShareImage({
      coverImageUrl: "/uploads/previous-cover.png",
      customEventPage: { artwork: "/api/blob/event-media/custom/artwork.webp" },
    })?.url,
    "/media/event-media/custom/artwork.webp",
  );
  assert.equal(
    resolveEventShareImage({ images: { hero: "/uploads/event-hero.jpg" } })?.url,
    "/uploads/event-hero.jpg",
  );
  assert.equal(
    resolveEventShareImage({ importedTheme: importedTheme("/api/blob/event-media/imported/event-design.webp") })?.url,
    "/media/event-media/imported/event-design.webp",
  );
  assert.equal(
    resolveEventShareImage({ importedTheme: { ...importedTheme("/uploads/event-design.webp"), enabled: false } }),
    null,
  );
});

test("Live Cards retain finished card artwork when an Event Page design is also saved", () => {
  const data = {
    category: "gymnastics",
    pageTemplateId: "airborne-atlas",
    customEventPage: { artwork: "/uploads/event-page.webp" },
    studioCard: { imageUrl: "/uploads/finished-card.webp" },
  };
  assert.equal(resolveEventShareImage(data)?.url, "/uploads/finished-card.webp");
  assert.equal(
    resolveEventShareImage({ ...data, coverImageUrl: "/uploads/card-cover.webp" })?.url,
    "/uploads/card-cover.webp",
  );
});

test("every public category and template shares its selected artwork ahead of stale covers", () => {
  const { getPublicTemplates } = jiti("./public-template-catalog.ts");
  for (const category of ["birthdays", "anniversaries", "weddings", "baby-showers",
    "bridal-showers", "gender-reveal", "gymnastics", "sport-events", "signup-forms"]) {
    const designs = getPublicTemplates(category);
    assert.ok(designs.length, category);
    for (const design of designs) {
      const image = resolveEventShareImage({
        category,
        templateId: design.id,
        variationId: design.id,
        pageTemplateId: design.id,
        templateEditor: { category, templateId: design.id },
        coverImageUrl: "/uploads/old-cover.png",
        ...(category === "signup-forms" ? { signupForm: { appearance: { designId: design.id } } } : {}),
      });
      assert.equal(image?.url, design.heroImage, `${category}/${design.id}`);
    }
  }
});

test("all football, general event and seasonal designs share their rendered artwork", () => {
  const { FOOTBALL_DESIGNS } = jiti("../components/football-season-templates/footballDesigns.ts");
  const { GENERAL_EVENT_DESIGNS } = jiti("./general-event-designs.ts");
  const { SIGNUP_DESIGNS } = jiti("./signup-designs.ts");
  for (const [id, design] of Object.entries(FOOTBALL_DESIGNS) as Array<[string, { hero: string }]>) {
    assert.equal(resolveEventShareImage({ category: "sport_football_season", pageTemplateId: id })?.url, design.hero, id);
  }
  for (const design of GENERAL_EVENT_DESIGNS) {
    assert.equal(resolveEventShareImage({ category: "general_event", themeId: design.id })?.url, design.artwork, design.id);
  }
  for (const design of SIGNUP_DESIGNS) {
    assert.equal(resolveEventShareImage({
      category: "Smart sign-up", signupForm: { appearance: { designId: design.id } },
    })?.url, design.artwork, design.id);
  }
});

const eventCategories = ["Birthdays", "Anniversaries", "Weddings", "Baby Showers", "Bridal Showers",
  "Gender Reveal", "sport_gymnastics_schedule", "sport_football_season", "sport_event", "sport_soccer",
  "sport_cheerleading", "sport_dance_ballet", "general_event", "workshops", "appointments", "special-events"];

test("host artwork replaces stale covers and category defaults for every event category", () => {
  for (const category of eventCategories) {
    assert.equal(resolveEventShareImage({
      category, heroImage: "/uploads/our-event.webp", coverImageUrl: "/uploads/old-cover.png",
    })?.url, "/uploads/our-event.webp", category);
    assert.equal(resolveEventShareImage({
      category, customEventPage: { artwork: "/uploads/custom-event.webp" },
      heroImage: "/uploads/previous-hero.webp",
    })?.url, "/uploads/custom-event.webp", category);
  }
});

test("legacy inline event heroes use the public media route across categories", () => {
  for (const category of eventCategories) {
    assert.equal(resolveEventShareImage(
      { category, coverImageUrl: "/uploads/stale-thumbnail.png" },
      { eventId: "saved-event", media: { heroImageInline: true, heroImageSig: "saved-revision" } },
    )?.url, "/media/events/saved-event/thumbnail?variant=hero&v=saved-revision", category);
  }
});

test("sign-up previews share gallery artwork, saved header images and inline headers", () => {
  const data = {
    category: "Smart sign-up", coverImageUrl: "/uploads/stale-cover.png",
    signupForm: { header: {
      images: [{ dataUrl: "/uploads/signup-gallery.webp" }],
      backgroundImage: { dataUrl: "/uploads/signup-background.webp" },
    } },
  };
  assert.equal(resolveEventShareImage(data)?.url, "/uploads/signup-gallery.webp");
  assert.equal(resolveEventShareImage({ ...data, signupForm: { header: {
    ...data.signupForm.header, images: [],
  } } })?.url, "/uploads/signup-background.webp");
  assert.equal(resolveEventShareImage({ ...data, signupForm: {} }, {
    eventId: "signup", media: { signupHeaderInline: true, signupHeaderSig: "header-version" },
  })?.url, "/media/events/signup/thumbnail?variant=signup-header&v=header-version");
});

test("dynamic Event Pages share the hero media from their saved blueprint", () => {
  const blueprint = { sections: [{ type: "hero", media: [{ url: "/uploads/blueprint-hero.webp" }] }] };
  assert.equal(resolveEventShareImage({ eventPageBlueprint: blueprint })?.url, "/uploads/blueprint-hero.webp");
  assert.equal(resolveEventShareImage({ heroImage: "/uploads/older-hero.webp" }, {
    pageBlueprint: blueprint,
  })?.url, "/uploads/blueprint-hero.webp");
});

test("scanned invites retain their artwork and private medical sources remain private", () => {
  for (const category of ["Birthdays", "Weddings", "Baby Showers", "Gender Reveal", "football", "general_event"]) {
    assert.equal(resolveEventShareImage({
      category, createdVia: "ocr", thumbnail: "/uploads/original-invitation.webp",
    })?.url, "/uploads/original-invitation.webp", category);
  }
  const medical = {
    title: "ENT appointment", category: "Medical Appointments", createdVia: "ocr",
    coverImageUrl: "/uploads/private-document.webp",
    attachment: { thumbnailUrl: "/uploads/private-document.webp" },
  };
  assert.equal(resolveEventShareImage(medical), null);
  assert.equal(resolveEventShareImage({ ...medical, scanArtwork: {
    version: 1, status: "ready", imageUrl: "/uploads/appointment-artwork.webp",
  } })?.url, "/uploads/appointment-artwork.webp");
});

test("event previews never reuse the marketing banner as saved artwork", () => {
  assert.equal(resolveEventShareImage({ coverImageUrl: "/og-default.jpg" }), null);
  assert.equal(resolveEventShareImage({
    coverImageUrl: "https://envitefy.com/og-default.jpg", thumbnail: "/uploads/event.webp",
  })?.url, "/uploads/event.webp");
});
