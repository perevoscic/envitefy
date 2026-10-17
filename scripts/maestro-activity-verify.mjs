import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import { chromium, request } from "playwright";
import { writeActivitySummary } from "./lib/maestro-activity-report.mjs";
import { contained, ROOT, selectScenarios } from "./lib/maestro-core.mjs";
import { writeReports } from "./lib/maestro-report.mjs";

// Read-only companion evidence. Event creation and navigation are Maestro UI steps.
const runId = process.argv[2];
if (!/^activity-QA\d{2}-\d+$/.test(runId || "")) throw new Error("Invalid activity run.");
const dir = contained(path.join(ROOT, "output/maestro"), runId);
const state = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8"));
selectScenarios([state.account]);
const values = {
  ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")),
  ...process.env,
};
const expectedEmail = values[`MAESTRO_${state.account}_EMAIL`];
try {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 15000 });
  const page = browser
    .contexts()
    .flatMap((context) => context.pages())
    .find((candidate) => candidate.url().startsWith("https://envitefy.com/"));
  if (!page) throw new Error("No Envitefy session is available.");
  const sessionResponse = await page.request.get("https://envitefy.com/api/auth/session", {
    timeout: 15000,
  });
  if (!sessionResponse.ok())
    throw new Error(`Session check returned HTTP ${sessionResponse.status()}.`);
  const session = await sessionResponse.json();
  if (!expectedEmail || session.user?.email?.toLowerCase() !== expectedEmail.toLowerCase())
    throw new Error("Active Envitefy email does not match the selected tester.");
  const history = await page.request.get(
    "https://envitefy.com/api/history?view=full&time=all&limit=200&refresh=1",
    { timeout: 30000 },
  );
  if (!history.ok()) throw new Error(`History check returned HTTP ${history.status()}.`);
  const body = await history.json();
  const matches = (body.items || []).filter(
    (item) =>
      new RegExp(`\\b${state.account}\\b`).test(String(item.title)) &&
      /test\s*workshop/i.test(String(item.title)),
  );
  if (matches.length !== 1)
    throw new Error(
      `Expected one matching test event, found ${matches.length}. No creation is repeated.`,
    );
  const response = await page.request.get(
    `https://envitefy.com/api/history/${encodeURIComponent(matches[0].id)}`,
    { timeout: 30000 },
  );
  if (!response.ok()) throw new Error(`Saved event check returned HTTP ${response.status()}.`);
  const row = await response.json();
  if (!session.user.id || row.user_id !== session.user.id)
    throw new Error("Saved event owner does not match the selected tester.");
  if (typeof row.public_slug !== "string" || !/^[a-zA-Z0-9-]+$/.test(row.public_slug))
    throw new Error("The saved event has no verified public slug.");
  const details = Object.fromEntries(
    ["startISO", "endISO", "timezone", "createdVia"]
      .filter((key) => typeof row.data?.[key] === "string")
      .map((key) => [key, row.data[key]]),
  );
  const actualDatesAvailable =
    Number.isFinite(Date.parse(details.startISO)) && Number.isFinite(Date.parse(details.endISO));
  const timeMatchesInput = actualDatesAvailable
    ? Date.parse(details.startISO) === Date.parse(state.expected.start) &&
      Date.parse(details.endISO) === Date.parse(state.expected.end)
    : null;
  const url = `https://envitefy.com/event/${encodeURIComponent(row.public_slug)}`;
  const observedPageUrl = page.url().split("?")[0];
  const guest = await request.newContext(); // New context, no session cookies.
  const guestResponse = await guest.get(url, { timeout: 30000 });
  const html = await guestResponse.text();
  const event = {
    checkedAt: new Date().toISOString(),
    url,
    eventId: row.id,
    account: state.account,
    historyStatus: history.status(),
    event: {
      id: row.id,
      title: row.title,
      ownerId: row.user_id,
      createdAt: row.created_at,
      publicSlug: row.public_slug,
      details,
    },
    checks: {
      ownerMatches: true,
      timeMatchesInput,
      titleMatchesInput: row.title === `Envitefy ${state.account} Test Workshop`,
      reopenedEventRoute: observedPageUrl === url,
    },
    observedPageUrl,
    publicGuestCheck: {
      status: guestResponse.status(),
      finalUrl: guestResponse.url().split("?")[0],
      usedAuthentication: false,
      titleMatches: html.includes(row.title),
    },
  };
  await writeFile(path.join(dir, "created-event.json"), JSON.stringify(event, null, 2));
  await writeFile(path.join(dir, "saved-fields.json"), JSON.stringify(details, null, 2));
  if (timeMatchesInput === false) {
    const finding = {
      id: `SNAP-TIME-${state.account}-001`,
      status: "confirmed_observed_mismatch",
      account: state.account,
      eventId: row.id,
      input: "snap-input.png",
      expected: {
        start: state.expected.start,
        end: state.expected.end,
        timezone: state.expected.timezone,
      },
      actual: { start: details.startISO, end: details.endISO, timezone: details.timezone },
      differenceMinutes: (Date.parse(details.startISO) - Date.parse(state.expected.start)) / 60000,
      cause:
        "Saved times differ from the source flyer. Review captured OCR/history date fields to distinguish extraction from later conversion; this comparison alone does not prove the production root cause.",
      evidence: ["snap-input.png", "saved-fields.json", "created-event.json", "web-events.jsonl"],
    };
    let findings = [];
    try {
      findings = JSON.parse(await readFile(path.join(dir, "confirmed-findings.json"), "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (!findings.some((item) => item.id === finding.id)) findings.push(finding);
    await writeFile(path.join(dir, "confirmed-findings.json"), JSON.stringify(findings, null, 2));
  }
  if (!event.checks.titleMatchesInput) {
    let findings = [];
    try {
      findings = JSON.parse(await readFile(path.join(dir, "confirmed-findings.json"), "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const id = `SNAP-TITLE-${state.account}-001`;
    if (!findings.some((item) => item.id === id))
      findings.push({
        id,
        account: state.account,
        eventId: row.id,
        status: "confirmed_observed_mismatch",
        expected: { title: `Envitefy ${state.account} Test Workshop` },
        actual: { title: row.title },
        cause:
          "The saved event title differs from the typeset source flyer. The captured response/request fields determine whether the change appeared in OCR or later; unavailable intermediate values remain unconfirmed.",
        evidence: ["snap-input.png", "created-event.json", "web-events.jsonl"],
      });
    await writeFile(path.join(dir, "confirmed-findings.json"), JSON.stringify(findings, null, 2));
  }
  await writeReports(dir, state.results, {
    runId,
    platform: "android",
    account: state.account,
    limitations: [
      "Only the recorded UI assertions, saved ownership/date fields and anonymous guest response are verified.",
      "A source-flyer versus saved-time mismatch is confirmed separately from any explanation of the production internal cause.",
    ],
  });
  await writeActivitySummary(dir, state);
  const guestVerified =
    event.publicGuestCheck.status === 200 && event.publicGuestCheck.titleMatches;
  console.log(
    `${state.account}: saved owner matches; anonymous guest page ${event.publicGuestCheck.status}; title matches ${event.publicGuestCheck.titleMatches}; times match ${timeMatchesInput}. Evidence: ${dir}`,
  );
  if (!event.checks.reopenedEventRoute)
    console.error(
      "The saved/public event is verified, but the current browser route does not confirm reopening. Resume that navigation check.",
    );
  process.exit(guestVerified && event.checks.reopenedEventRoute ? 0 : 1);
} catch (error) {
  await writeFile(
    path.join(dir, "verification-incomplete.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        account: state.account,
        status: "incomplete_check",
        message: error.message,
        note: "Read-only verification failed; this alone does not establish an app defect.",
      },
      null,
      2,
    ),
  );
  console.error(`${state.account}: ${error.message}`);
  process.exit(1);
}
