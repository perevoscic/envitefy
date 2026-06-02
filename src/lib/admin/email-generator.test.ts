import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  ensureDraftIncludesImageAssets,
  normalizeAdminEmailDraft,
  parseAdminEmailGenerationRequest,
  sanitizeGeneratedEmailHtml,
} from "./email-generator.ts";

const repoRoot = process.cwd();
const emailGeneratorSource = () =>
  fs.readFileSync(path.join(repoRoot, "src/lib/admin/email-generator.ts"), "utf8");

test("admin email generator defaults to gpt-5.5", () => {
  const source = emailGeneratorSource();
  assert.match(source, /DEFAULT_ADMIN_EMAIL_GENERATOR_MODEL = "gpt-5\.5"/);
  assert.doesNotMatch(source, /OPENAI_CONCIERGE_CHAT_MODEL/);
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
        role: "hero",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/display.webp",
        altText: " Existing hero ",
        prompt: " Existing image prompt ",
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
        role: "hero",
        url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/display.webp",
        altText: "Existing hero",
        prompt: "Existing image prompt",
        model: "gpt-image-2",
      },
    ]);
  }
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

test("generated image assets are injected when the model omits them", () => {
  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml: "<p>{{greeting}}, create a live card.</p>",
    buttonText: "Create an event",
    buttonUrl: "https://envitefy.com/studio",
    notes: "",
  });

  assert.ok(draft);
  const withImage = ensureDraftIncludesImageAssets(draft, [
    {
      role: "hero",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/display.webp",
      altText: "Envitefy event planning preview",
      prompt: "Create a hero image",
      model: "gpt-image-2",
    },
  ]);

  assert.match(withImage.bodyHtml, /<img/);
  assert.match(withImage.bodyHtml, /display\.webp/);
  assert.equal(withImage.imageAssets.length, 1);
});

test("generated image injection removes unapproved image URLs", () => {
  const draft = normalizeAdminEmailDraft({
    subject: "Try live event cards",
    preheader: "Make RSVPs easier.",
    bodyHtml:
      '<p>{{greeting}}</p><img src="https://example.com/fake.webp" alt="fake"><img src="https://envitefy.com/api/blob/event-media/admin-email/demo/header/display.webp" alt="real">',
    buttonText: "",
    buttonUrl: "",
    notes: "",
  });

  assert.ok(draft);
  const withImage = ensureDraftIncludesImageAssets(draft, [
    {
      role: "hero",
      url: "https://envitefy.com/api/blob/event-media/admin-email/demo/header/display.webp",
      altText: "Envitefy event planning preview",
      prompt: "Create a hero image",
      model: "gpt-image-2",
    },
  ]);

  assert.doesNotMatch(withImage.bodyHtml, /example\.com/);
  assert.match(withImage.bodyHtml, /display\.webp/);
});
