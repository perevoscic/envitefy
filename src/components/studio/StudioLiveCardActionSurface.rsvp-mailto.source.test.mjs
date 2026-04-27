import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio live-card RSVP email actions use current-context mailto launch", () => {
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const rsvpPanelMatch = surfaceSource.match(
    /\{props\.activeTab === "rsvp" \? \([\s\S]*?\{props\.activeTab === "details" \? \(/,
  );
  assert.ok(rsvpPanelMatch, "RSVP panel source should be discoverable");
  const rsvpPanelSource = rsvpPanelMatch[0];
  const mailtoBranchStart = rsvpPanelSource.indexOf("if (isRsvpMailtoHref(href))");
  const mailtoBranchEnd = rsvpPanelSource.indexOf("<a", mailtoBranchStart);

  assert.match(
    surfaceSource,
    /import \{ isRsvpMailtoHref, openRsvpMailtoHref \} from "@\/utils\/rsvp-mailto";/,
  );
  assert.ok(mailtoBranchStart >= 0, "RSVP panel should branch for mailto hrefs");
  assert.ok(mailtoBranchEnd > mailtoBranchStart, "SMS anchor fallback should follow mailto branch");
  assert.match(rsvpPanelSource, /onClick=\{\(\) => openRsvpMailtoHref\(href\)\}/);
  assert.doesNotMatch(rsvpPanelSource.slice(mailtoBranchStart, mailtoBranchEnd), /<a\b/);
  assert.doesNotMatch(rsvpPanelSource, /window\.open/);
  assert.doesNotMatch(rsvpPanelSource, /target="_blank"/);
});
