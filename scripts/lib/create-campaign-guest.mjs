import fs from "node:fs/promises";
import path from "node:path";

export function guestRequestDecision({ url, method, postData, baseUrl, eventId, guestEmail, submitted = false }) {
  const target = new URL(url);
  const base = new URL(baseUrl);
  if (target.origin !== base.origin) return { allow: false, reason: "external_request" };
  if (["GET", "HEAD"].includes(method)) return { allow: true };
  if (method !== "POST" || target.pathname !== `/api/events/${encodeURIComponent(eventId)}/rsvp` || submitted) return { allow: false, reason: "unapproved_mutation" };
  let body;
  try { body = JSON.parse(postData); } catch { return { allow: false, reason: "invalid_rsvp_body" }; }
  if (!body || body.email !== guestEmail || !guestEmail.endsWith("@create-campaign.example.test") || !["yes", "no", "maybe"].includes(body.response) || body.target) return { allow: false, reason: "non_synthetic_rsvp" };
  return { allow: true, rsvp: true };
}

export function inspectGuestDestination(href, baseUrl) {
  if (typeof href !== "string" || !href.trim()) return { kind: "invalid", valid: false };
  let url;
  let base;
  try { base = new URL(baseUrl); url = new URL(href, base); } catch { return { kind: "invalid", valid: false }; }
  if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) return { kind: "invalid", valid: false };
  if (url.origin === base.origin && url.pathname === "/api/ics") return { kind: "calendar", provider: "apple", valid: true, href: url.href };
  if (url.protocol !== "https:" || url.port) return { kind: "invalid", valid: false };
  const host = url.hostname.toLowerCase();
  let destinationKeys;
  if (["www.google.com", "maps.google.com"].includes(host)) {
    if (/^\/maps\/search\/?$/.test(url.pathname)) destinationKeys = ["query", "q"];
    else if (/^\/maps\/dir\/?$/.test(url.pathname)) destinationKeys = ["destination", "daddr"];
    else if (/^\/maps\/?$/.test(url.pathname) || (host === "maps.google.com" && url.pathname === "/")) destinationKeys = ["daddr", "q"];
  } else if (host === "maps.apple.com" && url.pathname === "/") destinationKeys = ["daddr", "q"];
  if (destinationKeys) {
    const destination = destinationKeys.map(key => url.searchParams.get(key) || "").find(value => value.trim()) || "";
    return { kind: "directions", valid: Boolean(destination.trim()), destination, href: url.href };
  }
  if (host === "calendar.google.com" || (host === "www.google.com" && url.pathname.startsWith("/calendar"))) return { kind: "calendar", provider: "google", valid: Boolean(url.searchParams.get("text") && url.searchParams.get("dates")), href: url.href };
  if (["outlook.live.com", "outlook.office.com"].includes(host)) return { kind: "calendar", provider: "microsoft", valid: Boolean(url.searchParams.get("subject") && url.searchParams.get("startdt")), href: url.href };
  return { kind: "other", valid: false, href: url.href };
}

/** Recheck captured URL structure only. Keep the original verdict and evidence
 * intact; this does not open providers or validate a downloaded calendar file.
 */
export function recheckCapturedGuestActions(actions, baseUrl) {
  return actions.map(action => ({
    ...structuredClone(action),
    recalculatedHandoffValidation: {
      ...inspectGuestDestination(action.href, baseUrl),
      verification: "captured_url_structure_only",
      externalNavigationTested: false,
    },
  }));
}

async function firstVisible(locator) {
  for (let index = 0; index < await locator.count(); index++) if (await locator.nth(index).isVisible()) return locator.nth(index);
  return null;
}

async function closeCardPanel(page) {
  const close = await firstVisible(page.getByRole("button", { name: /Close card details|Close card popup|Close calendar options|Close RSVP dialog/ }));
  if (close) await close.click();
}

/** Real anonymous UI actions, with external handoffs observed rather than followed.
 * The only permitted write is one synthetic RSVP to this attempt's local event.
 */
export async function runCampaignGuestJourney({ browser, publicUrl, baseUrl, eventId, caseDir, runDir, caseId, attemptId, expectedDraft }) {
  const base = new URL(baseUrl);
  if (base.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || new URL(publicUrl).origin !== base.origin) throw new Error("guest_isolation_required: Guest probes require the campaign loopback origin");
  const marker = JSON.parse(await fs.readFile(path.join(runDir, "runtime", ".campaign-runtime.json"), "utf8"));
  if (marker.kind !== "envitefy-create-campaign") throw new Error("guest_isolation_required: Missing campaign runtime marker");
  const guestKey = `guest-${caseId}-${attemptId}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 100);
  const guestEmail = `${guestKey}@create-campaign.example.test`;
  const result = { mode: "local_anonymous_ui", guestEmail, checks: {}, actions: [], evidence: [], blockedRequests: [], outboundHandoffs: [], findings: [] };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US", timezoneId: "America/Chicago", serviceWorkers: "block" });
  let submitted = false;
  await context.route("**/*", async route => {
    const request = route.request();
    const decision = guestRequestDecision({ url: request.url(), method: request.method(), postData: request.postData(), baseUrl, eventId, guestEmail, submitted });
    if (!decision.allow) { result.blockedRequests.push({ url: request.url(), method: request.method(), reason: decision.reason }); await route.abort("blockedbyclient"); return; }
    if (decision.rsvp) submitted = true;
    await route.continue();
  });
  await context.addInitScript(() => {
    window.__campaignOutbound = [];
    window.open = href => { window.__campaignOutbound.push({ href: String(href), mechanism: "window.open" }); return { closed: false }; };
    document.addEventListener("click", event => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === "/api/ics") {
        event.preventDefault();
        window.__campaignOutbound.push({ href: url.href, mechanism: "anchor" });
      }
    }, true);
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const evidence = async name => {
    const target = path.join(caseDir, `${name}.png`);
    await page.screenshot({ path: target, fullPage: true });
    result.evidence.push({ kind: "screenshot", path: path.relative(runDir, target).replaceAll("\\", "/"), exists: true, attemptId });
  };
  try {
    const response = await page.goto(publicUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    result.checks.anonymousGuestStatus = response?.status();
    result.checks.publicRoutePreserved = new URL(page.url()).pathname === new URL(publicUrl).pathname;
    const session = await (await context.request.get(`${baseUrl}/api/auth/session`)).json();
    result.checks.anonymousSession = !session.user;
    const consent = page.getByRole("button", { name: "Essential only", exact: true });
    await consent.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    if (await consent.isVisible()) { await consent.click(); await consent.waitFor({ state: "hidden" }); }
    await page.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
    await evidence("guest-mobile");
    result.text = await page.locator("body").innerText();
    result.controls = await page.locator("button, a").evaluateAll(elements => elements.map(element => ({ label: element.getAttribute("aria-label") || element.textContent?.trim(), href: element.getAttribute("href") })).filter(item => item.label));
    result.checks.noOwnerControls = !await firstVisible(page.getByRole("button", { name: /^(?:Edit in chat|Edit event|Publish|Delete event|Save draft)$/i }));
    result.checks.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    await page.setViewportSize({ width: 1280, height: 900 });
    await evidence("guest-desktop");
    await page.setViewportSize({ width: 390, height: 844 });

    const location = await firstVisible(page.getByRole("button", { name: /^(Location|Where|Directions)$/i }));
    if (location) await location.click();
    const directions = page.getByRole("button", { name: /Get directions/i });
    for (let index = 0; index < await directions.count(); index++) if (await directions.nth(index).isVisible()) await directions.nth(index).click();
    const directionLinks = page.getByRole("link", { name: /directions/i });
    for (let index = 0; index < await directionLinks.count(); index++) if (await directionLinks.nth(index).isVisible()) await directionLinks.nth(index).click();
    await closeCardPanel(page);

    for (const provider of ["Google Calendar", "Outlook Calendar", "Apple Calendar"]) {
      const calendar = await firstVisible(page.getByRole("button", { name: /^Add to calendar$/i }));
      if (!calendar) break;
      await calendar.click();
      const option = page.getByRole("button", { name: provider, exact: true });
      await option.waitFor({ state: "visible" });
      await option.click();
    }
    result.outboundHandoffs = await page.evaluate(() => window.__campaignOutbound);
    result.actions = result.outboundHandoffs.map(item => ({ ...item, ...inspectGuestDestination(item.href, baseUrl), verification: "destination_captured_no_external_navigation" }));
    for (const action of result.actions.filter(item => item.provider === "apple" && item.valid)) {
      const response = await context.request.get(action.href);
      const ics = await response.text();
      action.httpStatus = response.status();
      action.valid = response.ok() && /BEGIN:VCALENDAR/.test(ics) && /BEGIN:VEVENT/.test(ics) && /DTSTART/.test(ics);
      const target = path.join(caseDir, "guest-calendar.ics");
      await fs.writeFile(target, ics);
      result.evidence.push({ kind: "calendar", path: path.relative(runDir, target).replaceAll("\\", "/"), exists: true, attemptId });
    }
    result.checks.directions = !expectedDraft?.location || result.actions.some(item => item.kind === "directions" && item.valid);
    result.checks.calendar = !expectedDraft?.startISO || ["google", "microsoft", "apple"].every(provider => result.actions.some(item => item.provider === provider && item.valid));

    if (expectedDraft?.rsvpEnabled === true) {
      const rsvp = await firstVisible(page.getByRole("button", { name: /^RSVP(?: now)?$/i }));
      if (rsvp) await rsvp.click();
      const yes = await firstVisible(page.getByRole("button", { name: /^Yes(?:,? I.?m in)?$/i }));
      if (yes) await yes.click();
      const select = page.locator("select").filter({ has: page.locator('option[value="yes"]') });
      if (await select.first().isVisible().catch(() => false)) await select.first().selectOption("yes");
      const name = await firstVisible(page.getByPlaceholder("Name", { exact: true }));
      const firstName = await firstVisible(page.getByRole("textbox", { name: "First name", exact: true }));
      const lastName = await firstVisible(page.getByRole("textbox", { name: "Last name", exact: true }));
      const splitNameForm = Boolean(firstName && lastName);
      const email = await firstVisible(page.getByRole("textbox", { name: "Email", exact: true })) || await firstVisible(page.getByPlaceholder("Email", { exact: true }));
      const submit = await firstVisible(page.getByRole("button", { name: /^(Send RSVP|Confirm RSVP)$/i })) || (splitNameForm ? await firstVisible(page.getByRole("dialog", { name: "Introduce yourself", exact: true }).getByRole("button", { name: "Continue", exact: true })) : null);
      if ((!name && !splitNameForm) || !email || !submit) {
        result.checks.rsvp = false;
        result.findings.push({ kind: "infrastructure", cause: "harness_interaction", severity: "high", summary: "Guest probe did not recognize the enabled anonymous RSVP form", stage: "guest", verified: false });
      } else {
        if (splitNameForm) {
          await firstName.fill("Campaign");
          await lastName.fill("Synthetic Guest");
        } else await name.fill("Campaign Synthetic Guest");
        await email.fill(guestEmail);
        const guess = await firstVisible(page.getByRole("button", { name: /^Team Pink/ }));
        if (guess) await guess.click();
        const [response] = await Promise.all([
          page.waitForResponse(response => new URL(response.url()).pathname === `/api/events/${encodeURIComponent(eventId)}/rsvp` && response.request().method() === "POST", { timeout: 60_000 }),
          submit.click(),
        ]);
        const payload = await response.json().catch(() => null);
        const confirmation = page.getByText(/Thank you for RSVP-ing\.|RSVP Sent|^RSVP['’]d:\s*Yes$/).first();
        await confirmation.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
        result.checks.rsvp = response.ok() && payload?.ok === true && await confirmation.isVisible();
        result.rsvp = { status: response.status(), response: payload, form: splitNameForm ? "event_rsvp_prompt" : "single_name_rsvp", confirmationVisible: await confirmation.isVisible(), submitted: true, outgoingMail: "campaign_local_sink" };
        await evidence("guest-rsvp");
      }
    } else result.checks.rsvp = "not_requested";
    result.checks.requiredGuestActionsPassed = result.checks.anonymousGuestStatus >= 200 && result.checks.anonymousGuestStatus < 300 && result.checks.anonymousSession && result.checks.publicRoutePreserved && result.checks.noOwnerControls && result.checks.mobileOverflow === false && result.checks.directions && result.checks.calendar && result.checks.rsvp !== false;
    for (const check of ["publicRoutePreserved", "noOwnerControls", "directions", "calendar"]) if (result.checks[check] === false) result.findings.push({ kind: "product", severity: "high", summary: `Anonymous guest check failed: ${check}`, stage: "guest", verified: false });
  } catch (error) {
    result.failure = error.message;
    result.checks.requiredGuestActionsPassed = false;
    result.findings.push({ kind: "infrastructure", severity: "high", summary: `Guest probe could not finish: ${error.message}`, stage: "guest", cause: "harness_interaction", verified: false });
    await evidence("guest-stopped").catch(() => {});
  } finally {
    result.outboundHandoffs = await page.evaluate(() => window.__campaignOutbound || []).catch(() => result.outboundHandoffs);
    const target = path.join(caseDir, "guest-actions.json");
    await fs.writeFile(target, JSON.stringify(result, null, 2));
    result.evidence.push({ kind: "guest-actions", path: path.relative(runDir, target).replaceAll("\\", "/"), exists: true, attemptId });
    await context.close();
  }
  return result;
}
