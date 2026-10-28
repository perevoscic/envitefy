const assert = require("node:assert/strict");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("../../scripts/lib/event-messages-test-loader.cjs");
const { readEventRsvpContact } = load("src/lib/event-rsvp-contact.ts");
const Contact = load("src/components/events/EventRsvpContactDetails.tsx").default;

test("reply contacts hydrate known saved fields without guessing an account or guest identity", () => {
  assert.deepEqual(readEventRsvpContact({ hostName: "Host", email: "account@test.com" }), { rsvpName: "", rsvpEmail: "", rsvpPhone: "" });
  assert.deepEqual(readEventRsvpContact({ rsvpContact: { name: " Sam ", email: "sam@test.com", phone: "+1 555 222 3333" } }), { rsvpName: "Sam", rsvpEmail: "sam@test.com", rsvpPhone: "+1 555 222 3333" });
  assert.deepEqual(readEventRsvpContact({ rsvpName: "", rsvpEmail: "", rsvpPhone: "", rsvpContact: { name: "Old name", email: "old@test.com", phone: "123456789" } }), { rsvpName: "", rsvpEmail: "", rsvpPhone: "" });
});
test("guest contact details expose safe email and telephone replies and respect disabled RSVP", () => {
  const value = { rsvpName: "Sam & Alex", rsvpEmail: "sam@test.com", rsvpPhone: "+1 (555) 222-3333" };
  const html = renderToStaticMarkup(React.createElement(Contact, { value }));
  assert.match(html, /Sam &amp; Alex/);
  assert.match(html, /mailto:sam%40test.com/);
  assert.match(html, /tel:\+15552223333/);
  assert.equal(renderToStaticMarkup(React.createElement(Contact, { value: { ...value, rsvpEnabled: false } })), "");
  assert.equal(renderToStaticMarkup(React.createElement(Contact, { value: {} })), "");
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(Contact, { value: { rsvpEmail: "javascript:alert(1)", rsvpPhone: "javascript:alert(1)" } })), /href=/);
});

test("explicit publishing and template drafts retain reply contacts and explicit clears", () => {
  const { creationNativePayload } = load("src/lib/create/editor-handoff.ts");
  const { buildTemplateDraftPayload } = load("src/lib/template-draft-payload.ts");
  const contacts = { rsvpName: "Sam Rivera", rsvpEmail: "sam@test.com", rsvpPhone: "+1 555 222 3333" };
  const previous = { title: "Original event", data: { ...contacts, venue: "Original venue", rsvpEnabled: true } };
  for (const value of [contacts, { rsvpName: "", rsvpEmail: "", rsvpPhone: "" }]) {
    const published = creationNativePayload(previous, { data: value });
    assert.deepEqual(readEventRsvpContact(published.data), value);
    assert.equal(published.data.venue, "Original venue");
    assert.equal(published.data.rsvpEnabled, true);
    const draft = buildTemplateDraftPayload({ data: { childName: "Maya", ...value } }, "birthdays", "America/Chicago");
    assert.deepEqual(readEventRsvpContact(draft.data), value);
  }
});

test("custom Event Pages retain contact details and deadline while RSVP is off", () => {
  const { emptyCustomEventDetails, normalizeCustomEventDetails } = load("src/lib/event-custom-design.ts");
  const expected = { rsvpName: "Sam Rivera", rsvpEmail: "sam@test.com", rsvpPhone: "+1 555 222 3333", rsvpDeadline: "2027-04-05" };
  const disabled = normalizeCustomEventDetails({ ...emptyCustomEventDetails(), ...expected, rsvpEnabled: false });
  assert.ok(disabled);
  for (const [key, value] of Object.entries(expected)) assert.equal(disabled[key], value);
  const enabled = normalizeCustomEventDetails({ ...disabled, rsvpEnabled: true });
  for (const [key, value] of Object.entries(expected)) assert.equal(enabled[key], value);
});
