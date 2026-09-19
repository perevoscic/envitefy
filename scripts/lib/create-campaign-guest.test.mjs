import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { chromium } from "playwright";
import { guestRequestDecision, inspectGuestDestination, runCampaignGuestJourney } from "./create-campaign-guest.mjs";

const baseUrl = "http://127.0.0.1:3107";
const eventId = "synthetic-event";
const guestEmail = "guest-fixture@create-campaign.example.test";
const request = { url: `${baseUrl}/api/events/${eventId}/rsvp`, method: "POST", postData: JSON.stringify({ email: guestEmail, name: "Synthetic Guest", response: "yes" }), baseUrl, eventId, guestEmail };

test("guest guard allows only one matching synthetic RSVP and local reads", () => {
  assert.deepEqual(guestRequestDecision(request), { allow: true, rsvp: true });
  assert.equal(guestRequestDecision({ ...request, submitted: true }).allow, false);
  assert.equal(guestRequestDecision({ ...request, url: `${baseUrl}/api/studio/generate` }).allow, false);
  assert.equal(guestRequestDecision({ ...request, url: "https://envitefy.com/api/events/synthetic-event/rsvp" }).allow, false);
  assert.equal(guestRequestDecision({ ...request, postData: JSON.stringify({ email: "person@example.com", response: "yes" }) }).allow, false);
  assert.equal(guestRequestDecision({ ...request, postData: JSON.stringify({ email: guestEmail, response: "yes", target: { email: "person@example.com" } }) }).allow, false);
  assert.deepEqual(guestRequestDecision({ ...request, url: `${baseUrl}/api/auth/session`, method: "GET" }), { allow: true });
});

test("map and calendar probes validate destinations without opening providers", () => {
  assert.equal(inspectGuestDestination("https://www.google.com/maps/dir/?api=1&destination=Maple%20Center", baseUrl).destination, "Maple Center");
  assert.equal(inspectGuestDestination("https://calendar.google.com/calendar/render?action=TEMPLATE&text=Test&dates=20261012T180000Z/20261012T190000Z", baseUrl).valid, true);
  assert.equal(inspectGuestDestination("https://outlook.live.com/calendar/0/deeplink/compose?subject=Test&startdt=2026-10-12T18%3A00%3A00Z", baseUrl).provider, "microsoft");
  assert.equal(inspectGuestDestination("/api/ics?title=Test", baseUrl).provider, "apple");
  assert.equal(inspectGuestDestination("https://calendar.google.com/calendar/render", baseUrl).valid, false);
  assert.equal(inspectGuestDestination("mailto:person@example.com", baseUrl).valid, false);
});

test("guest journey exercises the local fixture UI and archives attempt evidence", async () => {
  // This fixture tests harness mechanics only; it is not product/E2E evidence.
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-guest-harness-"));
  const caseDir = path.join(runDir, "cases", "fixture", "attempts", "attempt-1");
  await fs.mkdir(path.join(runDir, "runtime"), { recursive: true });
  await fs.mkdir(caseDir, { recursive: true });
  await fs.writeFile(path.join(runDir, "runtime", ".campaign-runtime.json"), JSON.stringify({ kind: "envitefy-create-campaign" }));
  const mutations = [];
  const html = `<!doctype html><html><body style="margin:0;max-width:100vw"><button onclick="this.remove()">Essential only</button>
    <button onclick="document.querySelector('#location').hidden=false">Location</button>
    <section id="location" hidden><button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=Maple%20Center')">Get Directions</button><button aria-label="Close card details" onclick="this.parentElement.hidden=true">Close</button></section>
    <button onclick="document.querySelector('#calendar').hidden=false">Add to calendar</button>
    <section id="calendar" hidden><button onclick="window.open('https://calendar.google.com/calendar/render?text=Test&dates=20261012T180000Z/20261012T190000Z');this.parentElement.hidden=true">Google Calendar</button><button onclick="window.open('https://outlook.live.com/calendar/0/deeplink/compose?subject=Test&startdt=2026-10-12T18:00:00Z');this.parentElement.hidden=true">Outlook Calendar</button><button onclick="window.open('/api/ics?title=Test');this.parentElement.hidden=true">Apple Calendar</button></section>
    <button onclick="document.querySelector('#rsvp').hidden=false">RSVP</button><section id="rsvp" hidden><button onclick="document.querySelector('#form').hidden=false">Yes</button><form id="form" hidden><input placeholder="Name"><input placeholder="Email" type="email"><button type="submit">Send RSVP</button></form></section>
    <script>document.querySelector('#form').addEventListener('submit',async event=>{event.preventDefault();const response=await fetch('/api/events/synthetic-event/rsvp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:document.querySelector('[placeholder=Name]').value,email:document.querySelector('[placeholder=Email]').value,response:'yes'})});if(response.ok)document.querySelector('#rsvp').innerHTML='<p>Thank you for RSVP-ing.</p>'});</script></body></html>`;
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/api/auth/session")) { res.setHeader("content-type", "application/json"); res.end("{}"); return; }
    if (req.url.startsWith("/api/ics")) { res.end("BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261012T180000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"); return; }
    if (req.method === "POST") { let body = ""; for await (const chunk of req) body += chunk; mutations.push({ url: req.url, body: JSON.parse(body) }); res.setHeader("content-type", "application/json"); res.end('{"ok":true}'); return; }
    res.setHeader("content-type", "text/html"); res.end(html);
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const localBase = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true });
    const result = await runCampaignGuestJourney({ browser, baseUrl: localBase, publicUrl: `${localBase}/card/synthetic-event`, eventId, caseDir, runDir, caseId: "fixture", attemptId: "attempt-1", expectedDraft: { location: "Maple Center", startISO: "2026-10-12T18:00:00Z", rsvpEnabled: true } });
    assert.equal(result.failure, undefined);
    assert.equal(result.checks.requiredGuestActionsPassed, true);
    assert.equal(result.actions.length, 4);
    assert.equal(mutations.length, 1);
    assert.equal(mutations[0].body.email, result.guestEmail);
    assert.equal(result.rsvp.confirmationVisible, true);
    assert.ok(result.evidence.every(item => item.attemptId === "attempt-1"));
    const archived = JSON.parse(await fs.readFile(path.join(caseDir, "guest-actions.json"), "utf8"));
    assert.equal(archived.checks.requiredGuestActionsPassed, true);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    const resolved = await fs.realpath(runDir);
    assert.equal(path.dirname(resolved).toLowerCase(), (await fs.realpath(os.tmpdir())).toLowerCase());
    assert.ok(path.basename(resolved).startsWith("envitefy-guest-harness-"));
    await fs.rm(resolved, { recursive: true });
  }
});

test("EventRsvpPrompt fixtures use split names, direct/contact submit labels, and inline confirmation", async () => {
  // Mirrors the published event-page form contract, not product E2E evidence.
  const runDir = await fs.mkdtemp(path.join(os.tmpdir(), "envitefy-guest-harness-"));
  await fs.mkdir(path.join(runDir, "runtime"));
  await fs.writeFile(path.join(runDir, "runtime", ".campaign-runtime.json"), JSON.stringify({ kind: "envitefy-create-campaign" }));
  const mutations = [];
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/api/auth/session")) { res.setHeader("content-type", "application/json"); res.end("{}"); return; }
    if (req.method === "POST") { let body = ""; for await (const chunk of req) body += chunk; mutations.push({ url: req.url, body: JSON.parse(body) }); res.setHeader("content-type", "application/json"); res.end('{"ok":true}'); return; }
    const contact = req.url.includes("contact");
    res.setHeader("content-type", "text/html");
    res.end(`<!doctype html><html><body style="margin:0;max-width:100vw"><button onclick="this.remove()">Essential only</button><section id="event-rsvp"><button onclick="document.querySelector('[role=dialog]').hidden=false">Yes</button></section><div role="dialog" aria-labelledby="rsvp-introduce-title" hidden><h3 id="rsvp-introduce-title">Introduce yourself</h3><form><label>First name<input required name="first"></label><label>Last name<input required name="last"></label><label>Email<input required type="email" name="email" placeholder="you@example.com"></label><button type="submit">${contact ? "Continue" : "Send RSVP"}</button></form></div><script>document.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const fields=Object.fromEntries(new FormData(event.target));const response=await fetch('/api/events/synthetic-event/rsvp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:fields.first+' '+fields.last,email:fields.email,response:'yes'})});if(response.ok){document.querySelector('[role=dialog]').remove();document.querySelector('#event-rsvp').textContent="RSVP'd: Yes";${contact ? `const a=document.createElement('a');a.href='mailto:host@example.test?subject=RSVP';document.body.append(a);a.click();a.remove();` : ""}}});</script></body></html>`);
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const localBase = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true });
    for (const mode of ["direct", "contact"]) {
      const caseDir = path.join(runDir, "cases", mode, "attempts", "attempt-1");
      await fs.mkdir(caseDir, { recursive: true });
      const result = await runCampaignGuestJourney({ browser, baseUrl: localBase, publicUrl: `${localBase}/event/${mode}`, eventId, caseDir, runDir, caseId: mode, attemptId: "attempt-1", expectedDraft: { rsvpEnabled: true } });
      assert.equal(result.failure, undefined);
      assert.equal(result.checks.requiredGuestActionsPassed, true);
      assert.equal(result.rsvp.form, "event_rsvp_prompt");
      assert.equal(result.rsvp.confirmationVisible, true);
      assert.equal(mutations.at(-1).body.name, "Campaign Synthetic Guest");
      assert.equal(mutations.at(-1).body.email, result.guestEmail);
      assert.equal(result.blockedRequests.length, 0);
      if (mode === "contact") assert.ok(result.outboundHandoffs.some(item => item.href.startsWith("mailto:")));
    }
    assert.equal(mutations.length, 2, "one local synthetic RSVP per fresh guest journey");
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    const resolved = await fs.realpath(runDir);
    assert.equal(path.dirname(resolved).toLowerCase(), (await fs.realpath(os.tmpdir())).toLowerCase());
    assert.ok(path.basename(resolved).startsWith("envitefy-guest-harness-"));
    await fs.rm(resolved, { recursive: true });
  }
});
