import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio live-card builders carry surface and refresh overlay invitation data locally", () => {
  const source = readSource("src/app/studio/studio-workspace-builders.ts");

  assert.match(
    source,
    /export function buildStudioRequest\(\s*details: EventDetails,\s*mode: StudioGenerateMode,\s*surface: StudioGenerateSurface,/s,
  );
  assert.match(source, /return \{\s*mode,\s*surface,\s*event:/s);
  assert.match(source, /export function refreshLiveCardInvitationData\(/);
  assert.match(source, /const title = getDisplayTitle\(details\) \|\| clean\(previous\?\.title\);/);
  assert.match(source, /const scheduleLine =\s*`\$\{formatDate\(details\.eventDate\)\}\$\{details\.startTime \? ` at \$\{details\.startTime\}` : ""\}` \|\|/s);
  assert.match(source, /const locationLine =\s*pickFirst\(details\.venueName, details\.location, "Location TBD"\) \|\|/s);
  assert.match(source, /heroTextMode: "overlay",/);
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
