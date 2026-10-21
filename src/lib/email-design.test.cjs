const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { createEmailTemplate } = load("src/lib/email-template.ts");
const design = load("src/lib/email-design.ts");

test("new email chrome has dark branding, adaptive inbox body and immutable white asset URLs", () => {
  const html = createEmailTemplate({ title: "A & B", body: '<p>Saved details</p>', buttonText: "Open", buttonUrl: "https://envitefy.com/event/test?a=1&b=2" });
  assert.match(html, /data-email-design="adaptive-v1"/);
  assert.match(html, /content="light dark"/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /email-brand-band[^>]*bgcolor="#251F2D"/);
  assert.match(html, /email-content email-surface[^>]*bgcolor="#FFFFFF"/);
  assert.match(html, /\/email\/white-v1\/matte\/envitefy-wordmark-email\.png/);
  assert.equal((html.match(/class="social-icon-cell"/g) || []).length, 5);
  for (const name of ["instagram", "facebook", "youtube", "tiktok", "reddit"]) {
    assert.ok(html.includes(`/email/white-v1/matte/social-${name}.png`));
    assert.ok(fs.existsSync(`public/email/white-v1/matte/social-${name}.png`));
  }
  assert.match(html, /event\/test\?a=1&amp;b=2/);
  assert.match(html, /data-ogsc/);
  assert.equal(design.adaptiveEmailDocument(html), html, "preview/send decoration is idempotent");
});

test("explicit legacy rendering preserves old white surfaces, old assets and CTA", () => {
  const html = createEmailTemplate({ title: "Saved campaign", body: '<p style="color:#111827">Existing content</p>', emailDesignVersion: "legacy", buttonText: "Open", buttonUrl: "https://envitefy.com" });
  assert.match(html, /color-scheme" content="light only"/);
  assert.match(html, /\/email\/envitefy-wordmark-email.png/);
  assert.doesNotMatch(html, /white-v1|adaptive-v1/);
  assert.match(html, /background-color:#7F67D3/);
});

test("adaptive body marks native details, errors/success and links while preserving authored colors", () => {
  const artwork = '<!-- email-authored:start --><div style="background:#F9FAFB;color:#111827">Host design</div><!-- email-authored:end -->';
  const html = design.adaptiveEmailBody('<div style="background:#F9FAFB;border:1px solid #E5E7EB"><p style="color:#737373">Date</p></div><div style="background:#F0FDF4"><p style="color:#065F46">Success</p></div><a href="https://envitefy.com">Open</a>' + artwork);
  assert.match(html, /email-detail/);
  assert.match(html, /email-muted/);
  assert.match(html, /email-success-text/);
  assert.match(html, /email-link/);
  assert.ok(html.endsWith(artwork));
});

function emailFixture() {
  const messages = [];
  const stubs = {
    "@/lib/db": { getUserByEmail: async () => ({ first_name: "Sam", last_name: "Host" }) },
    "@/lib/mail-transport": { sendTransactionalEmail: async message => messages.push(message) },
  };
  return { messages, email: load("src/lib/email.ts", stubs), stubs };
}

test("every transactional email family uses adaptive chrome without changing recipients and private links", async () => {
  const { messages, email, stubs } = emailFixture();
  const toEmail = "guest@example.test";
  const form = { title: "Picnic", timezone: "America/Chicago", sections: [{ id: "food", title: "Food", slots: [{ id: "cake", label: "Cake", startTime: "12:00", endTime: "13:00" }] }], header: { backgroundColor: "#F9FAFB", textColor1: "#111827", textColor2: "#111827", groupName: "Host's group" } };
  const response = { status: "waitlisted", slots: [{ sectionId: "food", slotId: "cake", quantity: 2 }] };
  await email.sendPasswordResetEmail({ toEmail, resetUrl: "https://envitefy.com/reset?token=private-reset" });
  await email.sendPasswordChangeConfirmationEmail({ toEmail, userName: "Guest" });
  await email.sendShareEventEmail({ toEmail, ownerEmail: "host@example.test", eventTitle: "Picnic", eventUrl: "https://envitefy.com/event/picnic" });
  await email.sendCoHostInvitationEmail({ toEmail, ownerName: "Host", eventTitle: "Picnic", acceptUrl: "https://envitefy.com/cohost-invite#private" });
  await email.sendCoHostInvitationEmail({ toEmail, ownerName: "Host", eventTitle: "Picnic", acceptUrl: "https://envitefy.com/cohost-invite#signup", isSignupForm: true });
  await email.sendRsvpConfirmationEmail({ toEmail, eventTitle: "Picnic", eventUrl: "https://envitefy.com/event/picnic", response: "yes", eventImageUrl: "https://envitefy.com/art.webp", calendarLinks: [{ label: "Google Calendar", url: "https://calendar.google.com/event?a=1&b=2" }] });
  await email.sendHostRsvpNotificationEmail({ toEmail, guestName: "Guest", guestEmail: "reply@example.test", response: "maybe", eventTitle: "Picnic", dashboardUrl: "https://envitefy.com/?event=picnic" });
  await email.sendEventUpdateEmail({ toEmail, subject: "New time", body: "At 3pm\nBring cake", eventTitle: "Picnic", eventUrl: "https://envitefy.com/event/picnic", replyTo: "host@example.test" });
  await email.sendSignupConfirmationEmail({ toEmail, eventTitle: "Picnic", form, response, manageUrl: "https://envitefy.com/signup/manage#token=private-manage", eventUrl: "https://envitefy.com/smart-signup-form/picnic" });
  await email.sendSignupHostAlertEmail({ toEmail, eventTitle: "Picnic", dashboardUrl: "https://envitefy.com/?signup=picnic", activity: { kind: "promoted", name: "Guest", status: "confirmed", selections: ["Food: Cake ×2"], previousSelections: [], changes: [], answers: [] } });
  await email.sendSignupRecoveryEmail({ toEmail, eventTitle: "Picnic", links: [{ name: "Guest", url: "https://envitefy.com/signup/manage#private-recover" }] });
  assert.equal(messages.length, 11);
  for (const message of messages) {
    assert.equal(message.to, toEmail);
    assert.match(message.html, /data-email-design="adaptive-v1"/);
    assert.match(message.html, /white-v1\/matte/);
    assert.equal((message.html.match(/class="social-icon-cell"/g) || []).length, 5);
    assert.match(message.html, /Envitefy Team/);
  }
  assert.match(messages[8].html, /#token=private-manage/);
  assert.match(messages[8].text, /Food: Cake ×2/);
  assert.match(messages[8].html, /<!-- email-authored:start -->\s*<div data-email-authored="true" style="border:1px solid #E5E7EB/);
  assert.equal(messages[6].replyTo, "reply@example.test");
  assert.equal(messages[7].replyTo, "host@example.test");
  assert.equal(messages[8].from, "Envitefy Sign-up Forms <signup-forms@envitefy.com>");
  const notice = load("src/lib/new-account-notification.ts", stubs).buildNewAccountNotification({ email: toEmail, method: "email" });
  assert.match(notice.html, /data-email-design="adaptive-v1"/);
});

test("all built-in marketing full documents have adaptive chrome and keep original image sources", () => {
  for (const [filename, name] of [["magazine-1", "renderMagazineEmail"], ["features-oct26", "renderFeaturesEmail"]]) {
    const render = load(`src/lib/email-templates/${filename}.ts`)[name];
    const adaptive = render({ baseUrl: "https://envitefy.com" });
    const legacy = render({ baseUrl: "https://envitefy.com", emailDesignVersion: "legacy" });
    assert.match(adaptive, /data-email-design="adaptive-v1"/);
    assert.match(adaptive, /white-v1\/matte\/envitefy-wordmark-email/);
    assert.match(adaptive, /email-footer-band/);
    assert.equal((adaptive.match(/white-v1\/matte\/social-/g) || []).length, 5);
    const artwork = html => [...html.matchAll(/src="([^"]+\.(?:webp|jpg))"/g)].map(m => m[1]);
    assert.deepEqual(artwork(adaptive), artwork(legacy));
    assert.doesNotMatch(adaptive, /localhost|light only/);
  }
});

test("new contact email and admin composers use the shared rendering and versioned handoffs", () => {
  const contact = fs.readFileSync("src/app/api/contact/route.ts", "utf8");
  assert.match(contact, /html: createEmailTemplate\(\{ title, body: html \}\)/);
  for (const filename of ["src/app/admin/emails/editor/page.tsx", "src/components/admin/EmailCampaignsClient.tsx"]) {
    const source = fs.readFileSync(filename, "utf8");
    assert.match(source, /persistedEmailDesignVersion/);
    assert.match(source, /emailDesignVersion/);
    assert.match(source, /EmailPreviewFrame/);
  }
  const editor = fs.readFileSync("src/app/admin/emails/editor/page.tsx", "utf8");
  assert.match(editor, /const payload = \{\s*emailDesignVersion,/);
});
