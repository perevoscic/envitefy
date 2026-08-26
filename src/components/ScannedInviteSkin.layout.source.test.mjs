import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

test("scanned invite skin uses full-width prose Good to Know tiles", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src/components/ScannedInviteSkin.tsx"),
    "utf8",
  );

  assert.match(source, /label="Good to Know"/);
  assert.match(source, /fullWidth/);
  assert.match(source, /tone="prose"/);
  assert.match(source, /md:col-span-2/);
  assert.match(source, /text-base font-semibold leading-relaxed md:text-lg/);
  assert.match(source, /tone="compact"/);
  assert.match(source, /label="Parking"/);
  assert.match(source, /looksLikeParkingOrDirectionsNote/);
  assert.doesNotMatch(source, /buildParkingDirectionsQuery/);
  assert.match(source, /Landmark/);
  assert.match(source, /icon=\{<Landmark/);
  assert.match(source, /icon=\{<MapPin/);
  assert.match(source, /icon=\{<Car/);
  assert.doesNotMatch(source, /label="Venue"[\s\S]{0,120}MapPin[\s\S]{0,80}label="Where"/);
});

test("scanned invite actions share the category row", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "src/components/ScannedInviteSkin.tsx"),
    "utf8",
  );

  assert.match(
    source,
    /<header className="space-y-4 pt-2 md:pt-8">[\s\S]*?className="flex min-w-0 items-center justify-between gap-3"[\s\S]*?\{displayCategoryLabel\}[\s\S]*?\{actions \? \(/,
  );
  assert.match(source, /className="relative z-20 flex shrink-0 items-center justify-end"/);
  assert.doesNotMatch(source, /EVENT_SKIN_ACTIONS_CLASS/);
});
