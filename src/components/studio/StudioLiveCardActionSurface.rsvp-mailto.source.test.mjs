import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relPath) {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

test("studio live-card RSVP email actions use current-context mailto launch", () => {
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const rsvpPanelMatch = surfaceSource.match(
    /<div className="space-y-3">\s*\{props\.activeTab === "rsvp" \? \([\s\S]*?\{props\.activeTab === "logo" && openHouseAgentCard \? \(/,
  );
  assert.ok(rsvpPanelMatch, "RSVP panel source should be discoverable");
  const rsvpPanelSource = rsvpPanelMatch[0];
  const mailtoBranchStart = rsvpPanelSource.indexOf("if (isRsvpMailtoHref(href))");
  const mailtoBranchEnd = rsvpPanelSource.indexOf("<a", mailtoBranchStart);
  const responseChoicesStart = rsvpPanelSource.indexOf("LIVE_CARD_RSVP_CHOICES.map");
  const responseChoicesSource = rsvpPanelSource.slice(responseChoicesStart);

  assert.match(
    surfaceSource,
    /import \{ isRsvpMailtoHref, openRsvpMailtoHref \} from "@\/utils\/rsvp-mailto";/,
  );
  assert.ok(mailtoBranchStart >= 0, "RSVP panel should branch for mailto hrefs");
  assert.ok(mailtoBranchEnd > mailtoBranchStart, "SMS anchor fallback should follow mailto branch");
  assert.match(rsvpPanelSource, /onClick=\{\(\) => openRsvpMailtoHref\(href\)\}/);
  assert.doesNotMatch(rsvpPanelSource.slice(mailtoBranchStart, mailtoBranchEnd), /<a\b/);
  assert.doesNotMatch(responseChoicesSource, /window\.open/);
  assert.doesNotMatch(responseChoicesSource, /target="_blank"/);
});

test("studio open house uses realtor contact tile instead of RSVP choices", () => {
  const surfaceSource = readSource("src/components/studio/StudioLiveCardActionSurface.tsx");
  const rsvpPanelMatch = surfaceSource.match(
    /<div className="space-y-3">\s*\{props\.activeTab === "rsvp" \? \([\s\S]*?\{props\.activeTab === "logo" && openHouseAgentCard \? \(/,
  );
  assert.ok(rsvpPanelMatch, "RSVP panel source should be discoverable");
  const rsvpPanelSource = rsvpPanelMatch[0];
  const agentBranchStart = rsvpPanelSource.indexOf("openHouseAgentCard ? (");
  const rsvpChoicesStart = rsvpPanelSource.indexOf("LIVE_CARD_RSVP_CHOICES.map");

  assert.match(surfaceSource, /function isOpenHouseLiveCard/);
  assert.match(surfaceSource, /function getOpenHouseRealtorImageUrl/);
  assert.match(surfaceSource, /function getOpenHouseRealtorLogoUrl/);
  assert.match(surfaceSource, /const agentImageUrl = getOpenHouseRealtorImageUrl\(details\);/);
  assert.match(surfaceSource, /const agentLogoUrl = getOpenHouseRealtorLogoUrl\(details\);/);
  assert.match(surfaceSource, /agentImageUrl,/);
  assert.match(surfaceSource, /openHouseAgentCard && posterFirstHeroCard/);
  assert.match(surfaceSource, /h-\[32%\] bg-gradient-to-t from-black\/62/);
  assert.match(surfaceSource, /label: openHouseAgentCard \? "Property" : "Overview"/);
  assert.match(surfaceSource, /icon: openHouseAgentCard \? House : ClipboardList/);
  assert.match(surfaceSource, /label: openHouseAgentCard \? "Realtor" : "RSVP"/);
  assert.match(surfaceSource, /icon: openHouseAgentCard \? UserRound : MessageSquare/);
  assert.match(surfaceSource, /key: "logo" as const/);
  assert.match(surfaceSource, /label: "Logo"/);
  assert.match(surfaceSource, /icon: ImageIcon/);
  assert.match(
    surfaceSource,
    /\?\s*\[detailsButtonConfig, rsvpButtonConfig, logoButtonConfig\]\s*:\s*\[rsvpButtonConfig, detailsButtonConfig\]/s,
  );
  assert.match(
    surfaceSource,
    /props\.activeTab === "rsvp" \? \(openHouseAgentCard \? "Realtor" : "RSVP"\) : null/,
  );
  assert.match(
    surfaceSource,
    /props\.activeTab === "details"\s*\?\s*openHouseAgentCard\s*\?\s*"Property"\s*:\s*"Overview"\s*:\s*null/s,
  );
  assert.ok(agentBranchStart >= 0, "Open House should render an Agent branch");
  assert.ok(rsvpChoicesStart > agentBranchStart, "RSVP choices should stay in the fallback branch");
  assert.match(rsvpPanelSource, /src=\{agentImageUrl\}/);
  assert.match(rsvpPanelSource, /className="h-full w-full object-contain object-top"/);
  assert.match(rsvpPanelSource, /<AgentDetailRow label="Title" value=\{agentTitle\} \/>/);
  assert.match(rsvpPanelSource, /<AgentDetailRow label="Brokerage" value=\{agentBrokerage\} \/>/);
  assert.match(rsvpPanelSource, /<AgentDetailRow label="License" value=\{agentLicense\} \/>/);
  assert.match(rsvpPanelSource, />\s*Contact\s*</);
  assert.match(rsvpPanelSource, />\s*View Listing\s*</);
  assert.match(surfaceSource, /props\.activeTab === "logo" && openHouseAgentCard/);
  assert.match(surfaceSource, /src=\{agentLogoUrl\}/);
  assert.match(
    surfaceSource,
    /<AgentDetailRow label="Realtor Company" value=\{agentBrokerage\} \/>/,
  );
});
