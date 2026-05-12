import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("admin landing preview is gated, noindexed, and outcome-led", () => {
  const source = readSource("src/app/admin/landing-preview/page.tsx");

  assert.match(source, /requireAdminSession/);
  assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(source, /Noindex route\. Production \/landing is unchanged\./);
  assert.match(source, /One polished event link from idea to RSVP/);
  assert.match(source, /A more professional landing page: light, direct, and product-led/);
  assert.match(source, /Start with Concierge/);
  assert.match(source, /Upload an invite or PDF/);
  assert.match(source, /Intent chooser/);
  assert.match(source, /Pick the closest starting point/);
  assert.match(source, /warm surface, sage action, lavender accents, charcoal text/);
  assert.match(source, /#7457a6/);
  assert.match(source, /#f1ecfb/);
  assert.match(source, /#cdbdeb/);
  assert.match(source, /Birthday party/);
  assert.match(source, /Upload flyer\/PDF/);
  assert.match(source, /Something else/);
  assert.match(source, /PhoneConciergePreview/);
  assert.match(source, /variant="signup"/);
  assert.match(source, /Message Concierge/);
  assert.match(source, /Spring carnival/);
  assert.match(source, /Ask about sign-ups/);
  assert.match(source, /Phone-first preview/);
  assert.match(source, /LandingLiveCardShowcase/);
  assert.match(source, /Live card gallery/);
  assert.match(source, /A polished card guests want to open/);
  assert.match(source, /Invite/);
  assert.match(source, /Event page/);
  assert.match(source, /Sign-up/);
  assert.match(source, /The front door is a conversation/);
  assert.match(source, /A link with real utility after the invite is sent/);
  assert.doesNotMatch(source, /One Studio/);
  assert.doesNotMatch(source, /Open Studio/);
  assert.doesNotMatch(source, /Try Snap Upload/);
  assert.doesNotMatch(source, /Start with Gymnastics/);
  assert.doesNotMatch(source, /ENVITEFY \/ STUDIO \/ SNAP \/ MEET/);
  assert.doesNotMatch(source, /Envitefy Studio/);
  assert.doesNotMatch(source, /bg-\[#2a1712\]/);
  assert.doesNotMatch(source, /blur-3xl/);
});
