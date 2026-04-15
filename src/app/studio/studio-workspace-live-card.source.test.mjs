import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio live-card builders carry poster-first surface rules and preserve refreshed invitation data locally", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(
    source,
    /export function buildStudioRequest\(\s*details: EventDetails,\s*mode: StudioGenerateMode,\s*surface: StudioGenerateSurface,/s,
  );
  assert.match(source, /return \{\s*mode,\s*surface,\s*event:/s);
  assert.match(source, /export function resolveStudioGenerationSurface\(/);
  assert.match(
    source,
    /return isPosterFirstLiveCardCategory\(details\.category\) \? "image" : "page";/,
  );
  assert.match(source, /case "Game Day":\s*return "sport events";/);
  assert.match(source, /eventYear: getStudioEventYear\(details\) \|\| null,/);
  assert.match(source, /export function refreshLiveCardInvitationData\(/);
  assert.match(source, /const title = clean\(previous\?\.title\) \|\| getDisplayTitle\(details\);/);
  assert.match(
    source,
    /const scheduleLine = clean\(previous\?\.scheduleLine\) \|\| buildDeterministicScheduleLine\(details\);/,
  );
  assert.match(
    source,
    /const locationLine = clean\(previous\?\.locationLine\) \|\| buildDeterministicLocationLine\(details\);/,
  );
  assert.match(
    source,
    /const heroTextMode =\s*previous\?\.heroTextMode === "overlay" \|\| previous\?\.heroTextMode === "image"/s,
  );
  assert.match(
    source,
    /isPosterFirstLiveCardCategory\(details\.category\)\s*\?\s*"image"\s*:\s*"overlay"/s,
  );
  assert.match(source, /title: liveCard\?\.title \|\| invitation\?\.title,/);
  assert.match(
    source,
    /subtitle:\s*invitation\?\.subtitle\s*\|\|\s*buildDescription\(details\)\s*\|\|\s*pickFirst\(details\.theme, details\.category\),/s,
  );
  assert.match(
    source,
    /callToAction:\s*liveCard\?\.interactiveMetadata\.ctaLabel\s*\|\|\s*invitation\?\.callToAction\s*\|\|/s,
  );
  assert.match(
    source,
    /socialCaption:\s*liveCard\?\.interactiveMetadata\.shareNote\s*\|\|\s*invitation\?\.socialCaption\s*\|\|/s,
  );
});

test("studio live-card sanitizer and publish payload preserve heroTextMode", () => {
  const sanitizeSource = readSource("src/app/studio/studio-workspace-sanitize.ts");
  const builderSource = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(
    sanitizeSource,
    /heroTextMode:\s*value\.heroTextMode === "overlay" \|\| value\.heroTextMode === "image"/,
  );
  assert.match(builderSource, /invitationData: item\.data \|\| undefined,/);
});

test("studio preview uses floating glass controls for poster-first live cards", () => {
  const workspaceSource = readSource("src/app/studio/StudioWorkspace.tsx");

  assert.match(workspaceSource, /const activePageUsesPosterControls =/);
  assert.match(workspaceSource, /activePageRecord\?\.data\?\.heroTextMode === "image"/);
  assert.match(workspaceSource, /isPosterFirstLiveCardCategory\(/);
  assert.match(
    workspaceSource,
    /activePageUsesPosterControls\s*\?\s*"border-white\/28 bg-white\/18/,
  );
  assert.match(
    workspaceSource,
    /activePageUsesPosterControls\s*\?\s*"pb-\[max\(0\.45rem,calc\(env\(safe-area-inset-bottom\)\+0\.2rem\)\)\]/,
  );
});
