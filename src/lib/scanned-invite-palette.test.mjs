import test from "node:test";
import assert from "node:assert/strict";
import {
  ensureReadableTextColor,
  normalizeScannedInvitePalette,
} from "./scanned-invite-palette.js";

test("normalizeScannedInvitePalette keeps vivid flyer colors intact", () => {
  const palette = normalizeScannedInvitePalette({
    background: "#cde9fb",
    primary: "#f31a8f",
    secondary: "#14a8ef",
    accent: "#ffa126",
    text: "#111827",
  });

  assert.equal(palette.background, "#cde9fb");
  assert.equal(palette.primary, "#f31a8f");
  assert.equal(palette.secondary, "#14a8ef");
  assert.equal(palette.accent, "#ffa126");
});

test("normalizeScannedInvitePalette does not wash a light background toward white", () => {
  const palette = normalizeScannedInvitePalette({
    background: "#d6ebee",
    primary: "#ef2f92",
    secondary: "#1ba3e4",
    accent: "#ff9a1f",
    text: "#101010",
  });

  assert.equal(palette.background, "#d6ebee");
  assert.equal(palette.text, "#101010");
});

test("ensureReadableTextColor only changes text when contrast is insufficient", () => {
  assert.equal(ensureReadableTextColor("#101820", "#ffffff"), "#ffffff");
  assert.equal(ensureReadableTextColor("#f9d3e6", "#f7d8ef"), "#101010");
});
