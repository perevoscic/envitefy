import assert from "node:assert/strict";
import test from "node:test";
import { inspectGuestDestination, recheckCapturedGuestActions } from "./create-campaign-guest.mjs";

const baseUrl = "http://127.0.0.1:3107";
const destination = "Maple Community Center, Room B, 100 Example Lane, Austin, TX";
const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

test("Google Maps search handoff preserves the actual corrected address", () => {
  assert.deepEqual(inspectGuestDestination(searchUrl, baseUrl), {
    kind: "directions", valid: true, destination, href: searchUrl,
  });
  const target = new URL(searchUrl);
  assert.equal(target.searchParams.get("api"), "1");
  assert.equal(target.searchParams.get("query"), destination);
  assert.equal(target.searchParams.has("destination"), false);
});

test("supported directions providers and route-specific parameters remain valid", () => {
  for (const href of [
    "https://www.google.com/maps/dir/?api=1&destination=Maple%20Center",
    "https://maps.google.com/maps/dir/?daddr=Maple%20Center",
    "https://www.google.com/maps?q=Maple%20Center",
    "https://maps.google.com/?q=Maple%20Center",
    "https://maps.apple.com/?q=Maple%20Center",
    "https://maps.apple.com/?daddr=Maple%20Center",
  ]) {
    assert.equal(inspectGuestDestination(href, baseUrl).valid, true, href);
    assert.equal(inspectGuestDestination(href, baseUrl).destination, "Maple Center", href);
  }
});

test("empty, unsafe, and unsupported map targets cannot pass the handoff check", () => {
  for (const href of [
    "", " ", null,
    "https://www.google.com/maps/search/?api=1",
    "https://www.google.com/maps/search/?query=%20%20",
    "https://www.google.com/maps/search/?destination=Maple",
    "https://www.google.com/maps/dir/?query=Maple",
    "https://www.google.com/search?maps=true&query=Maple",
    "https://maps.google.com/unsupported?q=Maple",
    "https://maps.apple.com/unsupported?q=Maple",
    "https://www.google.com.example.test/maps/search/?query=Maple",
    "https://example.test/?next=https://www.google.com/maps/search/?query=Maple",
    "https://person:secret@www.google.com/maps/search/?query=Maple",
    "https://www.google.com:8443/maps/search/?query=Maple",
    "http://www.google.com/maps/search/?query=Maple",
    "ftp://www.google.com/maps/search/?query=Maple",
    "javascript:alert(1)", "data:text/plain,Maple", "file:///maps?q=Maple",
  ]) assert.equal(inspectGuestDestination(href, baseUrl).valid, false, String(href));
});

test("calendar checks still support provider handoffs and same-origin local ICS", () => {
  assert.equal(inspectGuestDestination("https://calendar.google.com/calendar/render?text=Test&dates=20261012T180000Z/20261012T190000Z", baseUrl).valid, true);
  assert.equal(inspectGuestDestination("https://outlook.live.com/calendar/0/deeplink/compose?subject=Test&startdt=2026-10-12T18%3A00%3A00Z", baseUrl).valid, true);
  assert.equal(inspectGuestDestination("/api/ics?title=Test", baseUrl).provider, "apple");
  assert.equal(inspectGuestDestination("http://example.test/api/ics?title=Test", baseUrl).valid, false);
  assert.equal(inspectGuestDestination(searchUrl, "not a base URL").valid, false);
});

test("rechecking captures annotates URL-only validation without rewriting raw evidence", () => {
  const original = [{ href: searchUrl, mechanism: "window.open", kind: "directions", valid: false, destination: "", verification: "destination_captured_no_external_navigation", evidence: { externalNavigation: false } }];
  const raw = JSON.stringify(original);
  const rechecked = recheckCapturedGuestActions(original, baseUrl);
  assert.equal(JSON.stringify(original), raw);
  assert.equal(rechecked[0].valid, false, "original recorded verdict is preserved");
  assert.equal(rechecked[0].destination, "");
  assert.equal(rechecked[0].recalculatedHandoffValidation.valid, true);
  assert.equal(rechecked[0].recalculatedHandoffValidation.destination, destination);
  assert.equal(rechecked[0].recalculatedHandoffValidation.verification, "captured_url_structure_only");
  assert.equal(rechecked[0].recalculatedHandoffValidation.externalNavigationTested, false);
  assert.notEqual(rechecked[0].evidence, original[0].evidence);
  assert.deepEqual(recheckCapturedGuestActions([], baseUrl), []);
});
