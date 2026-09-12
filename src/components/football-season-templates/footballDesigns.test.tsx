import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveFootballSeasonTemplateChrome } from "@/app/event/football-season/customize/footballSeasonTemplateTheme";
import FootballHero from "./FootballHero";
import { FOOTBALL_DESIGNS, getFootballDesign, resolveFootballHero } from "./footballDesigns";
import { GYM_MEET_TEMPLATE_LIBRARY, resolveGymMeetTemplateId } from "./registry";

test("every football design has distinct verified artwork and its own theme", () => {
  assert.equal(GYM_MEET_TEMPLATE_LIBRARY.length, 60);
  assert.equal(Object.keys(FOOTBALL_DESIGNS).length, 60);
  const hashes = new Set<string>();
  const palettes = new Set<string>();
  for (const template of GYM_MEET_TEMPLATE_LIBRARY) {
    assert.equal(resolveGymMeetTemplateId({ pageTemplateId: template.id }), template.id);
    const design = getFootballDesign(template.id);
    const chrome = resolveFootballSeasonTemplateChrome(template.id);
    assert.equal(chrome.id, template.id);
    assert.equal(design.name, template.name);
    const bytes = fs.readFileSync(`public${design.hero}`);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
    palettes.add(chrome.pageClass);
    const html = renderToStaticMarkup(
      <FootballHero templateId={template.id} title="Panthers Football" />,
    );
    assert.ok(html.includes(design.hero.replaceAll("/", "%2F")) || html.includes(design.hero));
    assert.ok(html.includes(`data-football-hero-layout="${design.layout}"`));
    assert.ok(html.includes("Panthers Football"));
  }
  assert.equal(hashes.size, 60);
  assert.equal(palettes.size, 60);
});

test("artwork follows the selected design while custom uploads survive switching", () => {
  const oldDefault = "/templates/hero-images/football-hero.jpeg";
  const newDefault = getFootballDesign("launchpad-editorial").hero;
  const selected = getFootballDesign("pop-art").hero;
  assert.equal(resolveFootballHero("pop-art", oldDefault), selected);
  assert.equal(resolveFootballHero("pop-art", newDefault), selected);
  assert.equal(resolveFootballHero("pop-art", ""), selected);
  for (const custom of [
    "/uploads/our-team.webp",
    "https://example.com/team.jpg",
    "blob:our-team-photo",
  ]) {
    assert.equal(resolveFootballHero("pop-art", custom), custom);
  }
  assert.equal(resolveFootballHero("retired-design"), newDefault);
});

test("all theme text and accent colors meet normal-text contrast on their surfaces", () => {
  const luminance = (hex: string) => {
    const values = [1, 3, 5]
      .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
      .map((channel) =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
      );
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const [id, design] of Object.entries(FOOTBALL_DESIGNS)) {
    const surfaces = [design.headerClass, design.pageClass].map(
      (value) => value.match(/bg-\[(#[0-9a-f]{6})\]/)?.[1],
    );
    for (const surface of surfaces) {
      assert.ok(surface);
      for (const color of [design.ink, design.accent]) {
        const pair = [luminance(surface), luminance(color)].sort((a, b) => a - b);
        const contrast = (pair[1] + 0.05) / (pair[0] + 0.05);
        assert.ok(contrast >= 4.5, `${id}: ${color} on ${surface} = ${contrast.toFixed(2)}`);
      }
    }
  }
});
