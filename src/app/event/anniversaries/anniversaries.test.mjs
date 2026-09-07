import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SessionProvider } from "next-auth/react";
import BirthdayRenderer from "@/components/birthdays/BirthdayRenderer";
import { birthdayTemplateCatalog } from "@/components/event-create/BirthdayTemplateGallery";
import { ANNIVERSARY_COLLECTION_DESIGNS } from "@/data/anniversary-template-data";
import { resolveBirthdayHeroAsset, resolveBirthdayTemplateHero } from "@/lib/birthday-hero-asset";
import { migrateAnniversaryTemplateKeys, TEMPLATE_DEFINITIONS } from "@/config/feature-visibility";
import { findActiveCreateEventItem, getTemplateLinks } from "@/config/navigation-config";
import { ANNIVERSARY_DESIGN_CATALOG, BIRTHDAY_DESIGN_BY_ID, BIRTHDAY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import { buildEditLink, resolveEditHref } from "@/utils/event-edit-route";

test("the anniversary collection includes 30 designs while preserving the original 10 IDs and artwork", () => {
  assert.equal(ANNIVERSARY_DESIGN_CATALOG.length, 30);
  assert.equal(BIRTHDAY_DESIGN_CATALOG.length, 94);
  assert.ok(BIRTHDAY_DESIGN_CATALOG.every((design) => design.occasion === "Birthday"));
  for (const design of ANNIVERSARY_DESIGN_CATALOG) {
    assert.equal(design.occasion, "Anniversary");
    assert.ok(!BIRTHDAY_DESIGN_CATALOG.some((birthday) => birthday.id === design.id));
    assert.equal(BIRTHDAY_DESIGN_BY_ID.get(design.id), design);
    assert.ok(existsSync(`public${design.heroImage}`), design.heroImage);
  }
  assert.equal(BIRTHDAY_DESIGN_BY_ID.size, 124);
});

test("Anniversaries follows Weddings in navigation and remains active in its editor", () => {
  const links = getTemplateLinks();
  const weddingIndex = links.findIndex((link) => link.key === "weddings");
  assert.equal(links[weddingIndex + 1]?.key, "anniversaries");
  assert.equal(TEMPLATE_DEFINITIONS.find((item) => item.key === "anniversaries")?.href, "/event/anniversaries");
  assert.equal(findActiveCreateEventItem("/event/anniversaries/customize?templateId=paper-atelier-first-anniversary", links)?.key, "anniversaries");
});

test("older birthday preferences gain anniversaries while current explicit preferences remain respected", () => {
  assert.deepEqual(migrateAnniversaryTemplateKeys(["birthdays", "weddings"], 2), ["birthdays", "weddings", "anniversaries"]);
  assert.deepEqual(migrateAnniversaryTemplateKeys(["birthdays", "weddings"], 3), ["birthdays", "weddings"]);
  assert.deepEqual(migrateAnniversaryTemplateKeys(["gymnastics"], 2), ["gymnastics"]);
  assert.deepEqual(migrateAnniversaryTemplateKeys(["birthdays", "anniversaries"], 2), ["birthdays", "anniversaries"]);
});

test("new and legacy anniversary invitations reopen in the new editor with their selected design", () => {
  for (const design of ANNIVERSARY_DESIGN_CATALOG) {
    for (const category of ["Anniversaries", "Birthdays"]) {
      const event = { category, templateId: design.id, variationId: design.id, createdVia: "birthday-renderer" };
      for (const resolve of [buildEditLink, resolveEditHref]) {
        const href = new URL(resolve("event & id", event, "Our wedding anniversary"), "https://envitefy.com");
        assert.equal(href.pathname, "/event/anniversaries/customize");
        assert.equal(href.searchParams.get("templateId"), design.id);
        assert.equal(href.searchParams.get("variationId"), design.id);
        assert.equal(href.searchParams.get("edit"), "event & id");
      }
    }
  }
});

test("the moved invitation renders anniversary wording and branding, including the singular first year", () => {
  const design = ANNIVERSARY_DESIGN_CATALOG[0];
  const html = renderToStaticMarkup(createElement(BirthdayRenderer, {
    template: design,
    event: { birthdayName: "Alex & Jordan", age: 1, story: "Celebrate our story.", rsvpEnabled: false },
  }));
  assert.match(html, /1 year together/);
  assert.match(html, /Created with Envitefy Anniversaries/);
  assert.doesNotMatch(html, /1 years together|Created with Envitefy Birthdays/);
});

test("all 20 new anniversary designs have distinct artwork, editor definitions, and complete guest pages", () => {
  assert.equal(ANNIVERSARY_COLLECTION_DESIGNS.length, 20);
  const artworks = new Set();
  const fonts = JSON.parse(readFileSync("public/fonts/birthday/sources.json", "utf8"));
  for (const added of ANNIVERSARY_COLLECTION_DESIGNS) {
    const design = BIRTHDAY_DESIGN_BY_ID.get(added.id);
    const definition = birthdayTemplateCatalog.find((item) => item.id === added.id);
    assert.ok(definition, added.id);
    assert.equal(resolveBirthdayTemplateHero(definition.heroImageName), design.heroImage);
    assert.ok(fonts.some((font) => font.font === design.headlineFont), design.headlineFont);
    artworks.add(readFileSync(`public${design.heroImage}`).toString("base64"));
    const event = {
      birthdayName: "Alex & Jordan", age: added.milestone || 25,
      date: "2026-11-07T18:00:00", end: "2026-11-07T21:00:00",
      location: "The Garden Pavilion", story: "Our story continues.",
      party: { parking: "Use the north entrance." },
      gallery: [design.heroImage], rsvpEnabled: true,
    };
    const render = (heroImageUrl) => renderToStaticMarkup(createElement(SessionProvider, { session: null }, createElement(BirthdayRenderer, {
      template: design, event, heroImageUrl, eventId: "anniversary-test", onRsvpClick: () => {},
    })));
    const html = render();
    for (const marker of [`data-birthday-scene="${design.id}"`, `data-birthday-art-body="${design.id}"`, "Use the north entrance.", "Add to calendar", "Share invitation", "Get directions", "RSVP to celebrate", "Created with Envitefy Anniversaries"]) {
      assert.ok(html.includes(marker), `${design.id}: ${marker}`);
    }
    assert.equal((html.match(/<h1\b/g) || []).length, 1, design.id);
    assert.doesNotMatch(html, /is turning|birthday celebration/i);
    assert.ok(render("/uploads/our-anniversary.jpg").includes("/uploads/our-anniversary.jpg"), design.id);
  }
  assert.equal(artworks.size, 20);
});

test("anniversary artwork resolves across save and theme changes while preserving uploaded photos", () => {
  const [first, second] = ANNIVERSARY_COLLECTION_DESIGNS;
  assert.equal(resolveBirthdayTemplateHero(first.heroImage), first.heroImage);
  assert.equal(resolveBirthdayTemplateHero("rainbow-bash.webp"), "/templates/birthdays/rainbow-bash.webp");
  assert.equal(resolveBirthdayHeroAsset({ savedHero: first.heroImage, catalogHero: second.heroImage }), second.heroImage);
  assert.equal(resolveBirthdayHeroAsset({ customHero: "/uploads/our-photo.jpg", catalogHero: second.heroImage }), "/uploads/our-photo.jpg");
});
