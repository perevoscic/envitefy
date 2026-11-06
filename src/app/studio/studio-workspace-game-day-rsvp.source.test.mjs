import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
import { createRequire } from "node:module";

const loadTs = createRequire(import.meta.url)("../../../scripts/lib/event-messages-test-loader.cjs");
const { supportsStudioCategoryRsvp } = loadTs("src/app/studio/studio-workspace-field-config.ts", {
  // The UI catalog's storage key is unrelated to the actual RSVP policy.
  "./studio-constants": { STUDIO_LIBRARY_STORAGE_KEY: "offline-studio-library" },
});

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio field config makes Game Day a no-RSVP compact form with sports-first fields", () => {
  const source = readSource("src/app/studio/studio-workspace-field-config.ts");

  assert.match(source, /export function supportsStudioCategoryRsvp\(/);
  assert.match(source, /return category !== "Game Day";/);
  assert.match(source, /"Game Day": \{/);
  assert.match(
    source,
    /primaryFields: pickCategoryFields\("Game Day", \["eventTitle", "sportType", "teamName"\]\),/,
  );
  assert.match(source, /secondaryFields: pickCategoryFields\("Game Day", \["opponentName"\]\),/);
  assert.match(source, /supportsRsvp: false,/);
  assert.match(source, /"Tap for details and game info\."/);
  assert.match(source, /"Check the live card for game details and arrival info\."/);
});

test("studio builders preserve Game Day RSVP opt-in while retaining compact form defaults", () => {
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const sanitizeSource = readSource("src/app/studio/studio-workspace-sanitize.ts");

  assert.match(
    workspaceSource,
    /supportsStudioCategoryRsvp\(details\.category\) && !clean\(details\.rsvpContact\)/,
  );
  assert.match(
    builderSource,
    /if \(!\(details\.rsvpEnabled \?\? supportsStudioCategoryRsvp\(details\.category\)\)\) return undefined;/,
  );
  assert.match(builderSource, /resolveStudioCallToAction\(/);
  assert.match(builderSource, /resolveStudioRsvpMessage\(/);
  assert.match(
    builderSource,
    /rsvpBy: categorySupportsRsvp \? clean\(details\.rsvpDeadline\) \|\| null : null,/,
  );
  assert.match(
    builderSource,
    /rsvpContact: categorySupportsRsvp \? clean\(details\.rsvpContact\) \|\| null : null,/,
  );
  // Guided cards can explicitly enable or disable RSVP; legacy cards keep category defaults.
  const ast = ts.createSourceFile("surface.tsx", surfaceSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let rsvpExpression;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "categorySupportsRsvp") rsvpExpression = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(ast);
  assert.ok(rsvpExpression, "the surface must resolve the saved RSVP state");
  const resolveRsvp = new Function("details", "supportsStudioCategoryRsvp", "readString", `return ${rsvpExpression.getText(ast)};`);
  for (const category of ["Game Day", "Birthday"]) for (const enabled of [undefined, false, true]) for (const visible of [undefined, false, true]) {
    const details = { category, rsvpEnabled: enabled, actionVisibility: { rsvp: visible } };
    assert.equal(resolveRsvp(details, supportsStudioCategoryRsvp, value => typeof value === "string" ? value.trim() : ""),
      enabled !== false && (visible ?? category !== "Game Day"), `${category}, enabled=${enabled}, visible=${visible}`);
  }
  // Saved disabled state wins over stale generated actions; enabled cards keep
  // explicit action choices and legacy cards retain their category defaults.
  assert.match(
    surfaceSource,
    /const categorySupportsRsvp\s*=\s*details\?\.rsvpEnabled !== false &&\s*\(details\?\.actionVisibility\?\.rsvp\s*\?\?\s*supportsStudioCategoryRsvp\(readString\(details\?\.category\)\)\)/,
  );
  assert.match(surfaceSource, /resolveLiveCardOverlayActions/);
  assert.match(surfaceSource, /rsvpEnabled:\s*categorySupportsRsvp/);
  assert.match(surfaceSource, /visible: overlayActionKeys.includes\("rsvp"\)/);
  assert.match(surfaceSource, /visible: overlayActionKeys.includes\("calendar"\)/);
  assert.match(
    sanitizeSource,
    /callToAction: resolveStudioCallToAction\(\s*fallbackDetails,\s*readString\(value\.callToAction\),\s*fallbackDetails\.calloutText,\s*\)/s,
  );
});

test("guest surface RSVP policy preserves Game Day opt-in and makes saved disable authoritative", () => {
  const surface = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const expression = surface.match(/const categorySupportsRsvp\s*=\s*([^;]+);/)?.[1];
  assert.ok(expression, "exercise the guest surface's actual RSVP expression");
  for (const [details, expected] of [
    [{ category: "Game Day" }, false],
    [{ category: "Game Day", rsvpEnabled: true, actionVisibility: { rsvp: true } }, true],
    [{ category: "Game Day", rsvpEnabled: false, actionVisibility: { rsvp: true } }, false],
    [{ category: "Wedding" }, true],
    [{ category: "Wedding", actionVisibility: { rsvp: false } }, false],
    [{ category: "Wedding", rsvpEnabled: false, actionVisibility: { rsvp: true } }, false],
  ]) {
    assert.equal(vm.runInNewContext(expression, {
      details, supportsStudioCategoryRsvp,
      readString: (value) => typeof value === "string" ? value.trim() : "",
    }), expected, JSON.stringify(details));
  }
});
