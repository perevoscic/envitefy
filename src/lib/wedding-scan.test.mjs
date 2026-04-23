import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.join(process.cwd(), "src/lib/wedding-scan.js")).href;
const weddingScan = await import(moduleUrl);

test("parseWeddingCoupleNames strips wedding shell text and returns both names", () => {
  const parsed = weddingScan.parseWeddingCoupleNames("Wedding Celebration of Ashley Anderson & Mike Beal");

  assert.deepEqual(parsed, {
    partner1: "Ashley Anderson",
    partner2: "Mike Beal",
    displayTitle: "Ashley Anderson & Mike Beal",
  });
});

test("buildWeddingScanFlyerColorsFromImageColors returns a complete softened palette", () => {
  const colors = weddingScan.buildWeddingScanFlyerColorsFromImageColors({
    headerLight: "linear-gradient(135deg, #f4e7db 0%, #e6d4be 100%)",
    headerDark: "linear-gradient(135deg, #7b6650 0%, #a48963 100%)",
    textLight: "#1f2937",
  });

  assert.equal(typeof colors.background, "string");
  assert.equal(typeof colors.primary, "string");
  assert.equal(typeof colors.secondary, "string");
  assert.equal(typeof colors.accent, "string");
  assert.equal(typeof colors.text, "string");
  assert.equal(typeof colors.themeColor, "string");
  assert.match(colors.background, /^#[0-9a-f]{6}$/);
  assert.match(colors.accent, /^#[0-9a-f]{6}$/);
});

test("normalizeWeddingFlyerColors falls back to the default palette when input is incomplete", () => {
  const colors = weddingScan.normalizeWeddingFlyerColors({ accent: "#c2a878" });

  assert.equal(colors.accent, "#c2a878");
  assert.equal(colors.background, weddingScan.DEFAULT_WEDDING_SCAN_FLYER_COLORS.background);
  assert.equal(colors.primary, weddingScan.DEFAULT_WEDDING_SCAN_FLYER_COLORS.primary);
  assert.equal(colors.text, weddingScan.DEFAULT_WEDDING_SCAN_FLYER_COLORS.text);
});

test("buildWeddingScanSchedule defaults to wedding starts and only adds reception when mentioned", () => {
  const defaultSchedule = weddingScan.buildWeddingScanSchedule({
    title: "Ashley & Mike Wedding",
    description: "Please join us on June 4th.",
    timeLabel: "4:00 PM",
  });

  assert.deepEqual(defaultSchedule, [{ time: "4:00 PM", title: "Wedding Starts" }]);

  const ceremonyAndReception = weddingScan.buildWeddingScanSchedule({
    description: "Wedding ceremony at 4:00 PM followed by reception.",
    timeLabel: "4:00 PM",
  });

  assert.deepEqual(ceremonyAndReception, [
    { time: "4:00 PM", title: "Wedding Ceremony" },
    { time: "Following", title: "Reception" },
  ]);
});
