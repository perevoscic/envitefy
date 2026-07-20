import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  buildScenarioRowHtml,
  ensureDraftIncludesImageAssets,
  hasCompleteScenarioStillAssets,
  normalizeAdminEmailDraft,
  parseAdminEmailGenerationRequest,
  polishAdminEmailBodyHtml,
  sanitizeGeneratedEmailHtml,
} from "./email-generator.ts";
import {
  buildAdminEmailImageQaPrompt,
  normalizeAdminEmailImageQaResult,
} from "./email-image-qa.ts";
import { ADMIN_EMAIL_GENERATION_GUIDE } from "./email-generation-guide.ts";

const repoRoot = process.cwd();
const emailGeneratorSource = () =>
  fs.readFileSync(path.join(repoRoot, "src/lib/admin/email-generator.ts"), "utf8");
const emailScenariosSource = () =>
  fs.readFileSync(path.join(repoRoot, "src/lib/admin/email-scenarios.ts"), "utf8");

test("admin email generator defaults to gpt-5.6-sol", () => {
  const source = emailGeneratorSource();
  assert.match(source, /DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL = "gpt-5\.6-sol"/);
  assert.doesNotMatch(source, /OPENAI_CONCIERGE_CHAT_MODEL/);
});

test("admin email generator prompts distinguish individual vs broadcast audiences", () => {
  const source = emailGeneratorSource();
  assert.match(source, /buildAdminEmailSystemPromptFromGuide/);
  assert.match(source, /buildAdminEmailGuidePromptPayload/);
});

test("admin email generation guide is the source of truth for LLM rules", () => {
  const guideSource = fs.readFileSync(
    path.join(repoRoot, "src/lib/admin/email-generation-guide.ts"),
    "utf8",
  );
  assert.match(guideSource, /ADMIN_EMAIL_GENERATION_GUIDE/);
  assert.match(guideSource, /bodyHtmlOnly/);
  assert.match(guideSource, /serverInjected/);
  assert.match(guideSource, /bannedTextLinkLabels/);
  assert.match(guideSource, /Turn a flyer into a live event card/);
  assert.match(guideSource, /Do not put scenario rows/);
  assert.match(guideSource, /imageVisuals/);
  assert.match(guideSource, /never animated GIFs/);
  assert.match(emailGeneratorSource(), /email-generation-guide/);
});

test("admin email generator builds QA-checked still scenario photos without GIFs", () => {
  const source = emailGeneratorSource();
  const scenarios = emailScenariosSource();
  assert.match(source, /hasCompleteScenarioStillAssets/);
  assert.match(source, /isGifAssetUrl/);
  assert.doesNotMatch(source, /assembleAdminEmailSnapDemoGif/);
  assert.doesNotMatch(source, /generateSnapDemoGifAsset/);
  assert.doesNotMatch(scenarios, /ADMIN_EMAIL_SNAP_GIF_FRAMES/);
  assert.match(scenarios, /id: "snap"/);
  assert.match(scenarios, /stillScene:/);
  assert.match(scenarios, /Documentary-style photo/);
  assert.match(scenarios, /No logos/);
  assert.match(source, /Absolutely no logos or watermarks/);
  assert.match(source, /reasonsIndicateBrandLogo/);
});

test("admin email generation requests require a prompt and normalize audience mode", () => {
  assert.deepEqual(parseAdminEmailGenerationRequest({ prompt: "" }), {
    ok: false,
    error: "Prompt is required.",
  });

  const parsed = parseAdminEmailGenerationRequest({
    prompt: "Generate a launch email for parents.",
    audienceMode: "broadcast",
    currentSubject: " Existing subject ",
    currentImageAssets: [
      {
        role: "scenario",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
        altText: " Snap photo ",
        prompt: " Snap scene ",
        model: "gpt-image-2",
      },
      {
        role: "demo",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap-demo.gif",
        altText: "Legacy gif",
        prompt: "gif",
        model: "gpt-image-2",
      },
      { role: "hero", url: "javascript:alert('bad')" },
    ],
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.prompt, "Generate a launch email for parents.");
    assert.equal(parsed.value.audienceMode, "broadcast");
    assert.equal(parsed.value.currentSubject, "Existing subject");
    assert.deepEqual(parsed.value.currentImageAssets, [
      {
        role: "scenario",
        scenarioId: "snap",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
        altText: "Snap photo",
        prompt: "Snap scene",
        model: "gpt-image-2",
      },
    ]);
  }
});

test("legacy gif assets force regeneration and are stripped from html", () => {
  assert.equal(
    hasCompleteScenarioStillAssets([
      {
        role: "demo",
        scenarioId: "snap",
        url: "http://localhost:3000/api/blob/event-media/x/header/snap-demo.gif",
        altText: "gif",
        prompt: "gif",
        model: "gpt-image-2",
      },
    ]),
    false,
  );

  const polished = polishAdminEmailBodyHtml(`
    <img src="http://localhost:3000/api/blob/x/snap-demo.gif" alt="gif">
    <p>Keep me</p>
  `);
  assert.doesNotMatch(polished, /\.gif/i);
  assert.match(polished, /Keep me/);
});

test("generated email HTML is reduced to a safe fragment", () => {
  const html = sanitizeGeneratedEmailHtml(`
    <!doctype html>
    <html>
      <head><title>Bad wrapper</title></head>
      <body>
        <p onclick="alert('x')" style="margin:0;">Hi {{firstName}}</p>
        <script>alert("bad")</script>
        <a href="javascript:alert('bad')">Open</a>
        <img src="data:image/png;base64,bad" alt="bad">
        <img src="https://envitefy.com/email/good.webp" alt="good">
      </body>
    </html>
  `);

  assert.match(html, /Hi \{\{firstName\}\}/);
  assert.match(html, /https:\/\/envitefy\.com\/email\/good\.webp/);
  assert.doesNotMatch(html, /doctype|<html|<head|<body|<script/i);
  assert.doesNotMatch(html, /onclick|javascript:|base64/i);
});

test("generated drafts require subject and body and keep only http CTA urls", () => {
  assert.equal(
    normalizeAdminEmailDraft({
      subject: "",
      bodyHtml: "<p>Missing subject</p>",
      buttonUrl: "https://envitefy.com",
    }),
    null,
  );

  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml: "<p>{{greeting}}, create a live card.</p>",
    buttonText: "Create an event",
    buttonUrl: "javascript:alert('bad')",
    notes: "Assumed birthday parents.",
  });

  assert.deepEqual(draft, {
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml: "<p>{{greeting}}, create a live card.</p>",
    buttonText: "Create an event",
    buttonUrl: "",
    notes: "Assumed birthday parents.",
    imageAssets: [],
  });
});

test("scenario rows and assets are injected when the model omits them", () => {
  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml:
      '<p>{{greeting}}</p><h1>Back to school</h1><p>Plan parties easily.</p><p><a href="https://envitefy.com/snap">Turn a flyer into a live event card</a></p>',
    buttonText: "Create an event",
    buttonUrl: "https://envitefy.com/studio",
    notes: "",
  });

  assert.ok(draft);
  const withImage = ensureDraftIncludesImageAssets(draft, [
    {
      role: "scenario",
      scenarioId: "snap",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/snap.png",
      altText: "Parents: snap a birthday flyer",
      prompt: "snap scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "concierge",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/concierge/display.webp",
      altText: "Birthday coming up? Ask Concierge",
      prompt: "concierge scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "teachers",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/teachers/display.webp",
      altText: "Teachers: class parties made simpler",
      prompt: "teachers scene",
      model: "gpt-image-2",
    },
    {
      role: "scenario",
      scenarioId: "share",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/share/display.webp",
      altText: "Share one link with every family",
      prompt: "share scene",
      model: "gpt-image-2",
    },
  ]);

  assert.match(withImage.bodyHtml, /snap\.png/);
  assert.match(withImage.bodyHtml, /concierge\/display\.webp/);
  assert.match(withImage.bodyHtml, /teachers\/display\.webp/);
  assert.match(withImage.bodyHtml, /share\/display\.webp/);
  assert.match(withImage.bodyHtml, /https:\/\/envitefy\.com\/snap/);
  assert.match(withImage.bodyHtml, /https:\/\/envitefy\.com\/chat/);
  assert.match(withImage.bodyHtml, /Try Snap/);
  assert.match(withImage.bodyHtml, /Open Concierge/);
  assert.doesNotMatch(withImage.bodyHtml, /Turn a flyer into a live event card/i);
  assert.doesNotMatch(withImage.bodyHtml, /\.gif/i);
  assert.equal(withImage.buttonText, "");
  assert.equal(withImage.buttonUrl, "");
  assert.equal(withImage.imageAssets.length, 4);
});

test("polish removes flyer text links and duplicate purple buttons", () => {
  const polished = polishAdminEmailBodyHtml(`
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com/snap" style="background-color:#7F67D3; color:#FFFFFF;">Try Snap</a>
    </div>
    <a href="https://envitefy.com/snap">Turn a flyer into a live event card</a>
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com" style="background-color:#7F67D3; color:#FFFFFF;">Create an event</a>
    </div>
    <div style="text-align:center; margin:0;">
      <a href="https://envitefy.com" style="background-color:#7F67D3; color:#FFFFFF;">Create an event</a>
    </div>
  `);

  assert.match(polished, /Try Snap/);
  assert.doesNotMatch(polished, /Turn a flyer into a live event card/i);
  assert.equal((polished.match(/Create an event/g) || []).length, 1);
});

test("scenario row helper renders title body image and CTA", () => {
  const html = buildScenarioRowHtml({
    title: "Parents: snap a birthday flyer",
    body: "Point the camera at the invite.",
    ctaLabel: "Try Snap",
    ctaUrl: "https://envitefy.com/snap",
    image: {
      role: "scenario",
      scenarioId: "snap",
      url: "https://envitefy.com/snap.png",
      altText: "Snap photo",
      prompt: "scene",
      model: "gpt-image-2",
    },
  });

  assert.match(html, /Parents: snap a birthday flyer/);
  assert.match(html, /Try Snap/);
  assert.match(html, /https:\/\/envitefy\.com\/snap/);
  assert.match(html, /snap\.png/);
});

test("image QA rejects high AI-ish scores and keeps guide reject traits", () => {
  const rejected = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.8,
    reasons: ["glowing overlays"],
  });
  assert.ok(rejected);
  assert.equal(rejected.pass, false);
  assert.equal(rejected.aiIshScore, 0.8);

  const mild = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.5,
    reasons: ["phone screen shows paper detail"],
  });
  assert.ok(mild);
  assert.equal(mild.pass, true);

  const logo = normalizeAdminEmailImageQaResult({
    pass: true,
    aiIshScore: 0.2,
    hasBrandLogoOverlay: true,
    reasons: [],
  });
  assert.ok(logo);
  assert.equal(logo.pass, false);
  assert.match(logo.reasons.join(" "), /logo|watermark/i);

  const prompt = buildAdminEmailImageQaPrompt(ADMIN_EMAIL_GENERATION_GUIDE.imageVisuals);
  assert.match(prompt, /glowing overlays|floating icons|stock-photo/i);
  assert.match(prompt, /phones|printed invitation/i);
  assert.match(prompt, /HARD FAIL if any brand logo/i);
  assert.match(prompt, /Do NOT fail solely/i);
});
