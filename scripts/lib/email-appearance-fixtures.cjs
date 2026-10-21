const load = require("./event-messages-test-loader.cjs");

/** Compose actual email functions with an in-memory transport; this helper cannot send mail. */
module.exports = async function emailAppearanceFixtures() {
  const messages = [];
  const stubs = {
    "@/lib/db": { getUserByEmail: async () => ({ first_name: "Sam", last_name: "Host" }) },
    "@/lib/mail-transport": { sendTransactionalEmail: async message => messages.push(message) },
  };
  const email = load("src/lib/email.ts", stubs);
  const form = { title: "Outdoor movie night", timezone: "America/Chicago", sections: [{ id: "snacks", title: "Snacks", slots: [{ id: "popcorn", label: "Popcorn", startTime: "19:00", endTime: "20:00" }] }], header: { backgroundColor: "#FAEEDB", textColor1: "#4E3322", textColor2: "#4E3322", groupName: "Movie club" } };
  const base = {
    toEmail: "guest@example.test", userName: "Guest", guestName: "Guest", guestEmail: "reply@example.test", hostName: "Host", ownerName: "Host", ownerEmail: "host@example.test",
    eventTitle: "Outdoor movie night", eventUrl: "https://envitefy.com/event/movie-night", dashboardUrl: "https://envitefy.com/?event=movie-night",
    resetUrl: "https://envitefy.com/reset?token=fixture", acceptUrl: "https://envitefy.com/cohost-invite#fixture", manageUrl: "https://envitefy.com/signup/manage#token=fixture",
    dateLabel: "Saturday, October 24, 2026 · 7:00 PM", locationLabel: "School lawn, 123 Main Street", response: "yes", eventImageUrl: "https://envitefy.com/email/features-oct26/live-card.webp",
    calendarLinks: [{ label: "Google Calendar", url: "https://calendar.google.com/calendar/event?action=TEMPLATE" }, { label: "Apple Calendar", url: "https://envitefy.com/api/ics?event=movie-night" }],
    subject: "Event update", body: "We will start at 7:00 PM.\nBring a blanket!", replyTo: "host@example.test", form,
    activity: { kind: "promoted", name: "Guest", status: "confirmed", selections: ["Snacks: Popcorn ×2"], previousSelections: [], changes: [], answers: [] },
    links: [{ name: "Guest", url: "https://envitefy.com/signup/manage#fixture-one" }, { name: "Family", url: "https://envitefy.com/signup/manage#fixture-two" }],
  };
  const fixtures = [];
  for (const name of Object.keys(email).filter(name => /^send.*Email$/.test(name))) {
    await email[name]({ ...base, ...(name === "sendSignupConfirmationEmail" ? { response: { status: "waitlisted", slots: [{ sectionId: "snacks", slotId: "popcorn", quantity: 2 }] } } : {}) });
    fixtures.push({ name, html: messages.at(-1).html });
  }
  fixtures.push({ name: "new-account", html: load("src/lib/new-account-notification.ts", stubs).buildNewAccountNotification({ email: base.toEmail, method: "email" }).html });
  const { createEmailTemplate } = load("src/lib/email-template.ts");
  fixtures.push({ name: "contact", html: createEmailTemplate({ title: "Contact", body: '<div style="font-family:Arial;color:#111827;"><p>Name: Guest</p><p>Email: guest@example.test</p><p>Contact message</p><hr style="border:0;border-top:1px solid #e5e7eb"/><p style="font-size:12px;color:#6b7280">This email is coming from Envitefy Contact Form.</p></div>' }) });
  fixtures.push({ name: "standard-marketing", html: createEmailTemplate({ title: "Campaign", body: '<h1>Every event, one link</h1><p>Your next event starts here.</p>', buttonText: "Open Envitefy", buttonUrl: "https://envitefy.com", unsubscribeUrl: "https://envitefy.com/unsubscribe?token=fixture", postalAddress: "123 Fixture Lane" }) });
  for (const [file, name] of [["magazine-1", "renderMagazineEmail"], ["features-oct26", "renderFeaturesEmail"]]) fixtures.push({ name: file, html: load(`src/lib/email-templates/${file}.ts`)[name]({ baseUrl: "https://envitefy.com" }) });
  const generator = load("src/lib/admin/email-generator.ts", { "../media-upload-image.ts": {} });
  fixtures.push({ name: "generated-marketing", html: createEmailTemplate({ title: "Generated campaign", body: generator.buildScenarioRowHtml({ title: "Create your next event", body: "Keep the event details together and share one guest link.", ctaLabel: "Create with Envitefy", ctaUrl: "https://envitefy.com/live-cards" }) }) });
  return fixtures;
};
