import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("feature visibility preserves unrelated JSON metadata and exposes sport setup", () => {
  const db = readSource("src/lib/db.ts");
  const api = readSource("src/app/api/user/feature-visibility/route.ts");

  assert.match(db, /coalesce\(feature_visibility, '\{\}'::jsonb\) \|\| \$2::jsonb/);
  assert.match(db, /getSportPreferenceSuggestionByEmail/);
  assert.match(db, /primary_signup_source\) === "gymnastics"/);
  assert.match(api, /sportPreferences: normalizeSportPreferences/);
  assert.match(api, /sportPreferenceSuggestion/);
  assert.match(api, /\[sports-preferences\] updated/);
});

test("the shared setup gate prioritizes a valid URL sport and never auto-enables disabled sports", () => {
  const gate = readSource("src/components/event-create/SportCreationGate.tsx");
  assert.match(gate, /explicitSport\s*\? \{ sport: explicitSport, source: "url" as const \}/);
  assert.match(gate, /preferences\.enabledSports\.includes\(explicitSport\)/);
  assert.match(gate, /is not enabled for this account/);
  assert.match(gate, /href="\/settings#your-sports"/);
});
