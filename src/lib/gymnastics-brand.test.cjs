const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { ENVITEFY_BRAND_ASSETS, isGymnasticsBrand } = load("src/lib/brand-assets.ts");
const { createEmailTemplate } = load("src/lib/email-template.ts");
const logo = ENVITEFY_BRAND_ASSETS.gymnastics.logo;

test("the approved gymnastics artwork retains its dimensions, transparency and exact prepared bytes", async () => {
  const bytes = fs.readFileSync(`public${logo}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), "57a6c12a4d46e1af5fc2797dab5c502b59736578d18129f29673011cd1d433d0");
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1057);
  assert.equal(metadata.height, 440);
  assert.equal(metadata.hasAlpha, true);
});

test("gymnastics categories, aliases and routes select the mark without treating every gym as gymnastics", () => {
  for (const value of ["Gymnastics", "sport-gymnastics-schedule", "sportGymnastics", "gym meet", "/gymnastics/templates/neon-runway", "/event/gymnastics/customize"])
    assert.equal(isGymnasticsBrand(value), true, value);
  for (const value of [undefined, "football", "/birthdays", "gym membership", "gymnastically"])
    assert.equal(isGymnasticsBrand(value), false, String(value));
});

test("gymnastics emails use the supplied mark for known categories and campaign copy, with one brand image", () => {
  for (const params of [
    { title: "Winter Classic", body: "<p>Warm-up begins at 9.</p>", brandCategory: "gymnastics" },
    { title: "Your gymnastics weekend", body: "<p>Meet details</p>" },
    { title: "One meet page", body: "<p>Gymnastics families, keep the weekend together.</p>" },
  ]) {
    const html = createEmailTemplate(params);
    assert.ok(html.includes(logo));
    assert.match(html, /data-email-brand="gymnastics"/);
    assert.match(html, /width="220" height="92" alt="Envitefy Gymnastics"/);
    assert.equal((html.match(/alt="Envitefy(?: logo| Gymnastics)?"/g) || []).length, 1);
    assert.doesNotMatch(html, /wordmark-v2/);
  }
  assert.ok(!createEmailTemplate({ title: "Football game", body: "<p>Kickoff is at 6.</p>" }).includes(logo));
  assert.ok(!createEmailTemplate({ title: "Gymnastics", body: "Saved campaign", emailDesignVersion: "legacy" }).includes(logo));
});

test("meet branding and category navigation render the real supplied image while general routes retain their wordmark", () => {
  const EventBranding = load("src/components/branding/EnvitefyEventBranding.tsx").default;
  const footer = renderToStaticMarkup(React.createElement(EventBranding, { category: "sport-gymnastics", inverse: true }));
  assert.ok(footer.includes(`src="${logo}"`));
  assert.ok(footer.includes('href="https://envitefy.com/gymnastics"'));
  assert.ok(!footer.includes("/_next/image"));
  for (const pathname of ["/gymnastics", "/gymnastics/templates", "/event/gymnastics/customize", "/football"]) {
    const RouteBrand = load("src/components/branding/EnvitefyRouteBrand.tsx", { "next/navigation": { usePathname: () => pathname } }).default;
    const html = renderToStaticMarkup(React.createElement(RouteBrand));
    assert.equal(html.includes(`src="${logo}"`), pathname !== "/football", pathname);
    if (pathname === "/football") assert.match(html, /Josefin Slab/);
  }
});

test("transactional event emails retain gymnastics branding when the meet title omits the sport", async () => {
  const messages = [];
  const email = load("src/lib/email.ts", {
    "@/lib/db": { getUserByEmail: async () => ({ first_name: "Sam", last_name: "Host" }) },
    "@/lib/mail-transport": { sendTransactionalEmail: async message => messages.push(message) },
  });
  const params = { eventCategory: "gymnastics", eventTitle: "Winter Classic", toEmail: "guest@example.test",
    ownerEmail: "host@example.test", ownerName: "Host", guestName: "Guest", guestEmail: "guest@example.test",
    eventUrl: "https://envitefy.com/event/winter-classic", dashboardUrl: "https://envitefy.com/event/winter-classic?tab=rsvps",
    acceptUrl: "https://envitefy.com/cohost-invite#fixture", response: "yes", subject: "Session update",
    body: "Warm-up starts at 9.", replyTo: "host@example.test" };
  for (const name of ["sendShareEventEmail", "sendCoHostInvitationEmail", "sendRsvpConfirmationEmail", "sendHostRsvpNotificationEmail", "sendEventUpdateEmail"])
    await email[name](params);
  assert.equal(messages.length, 5);
  for (const message of messages) {
    assert.equal(message.to, params.toEmail);
    assert.ok(message.html.includes(logo));
    assert.match(message.html, /Winter Classic/);
  }
});
