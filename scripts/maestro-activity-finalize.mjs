import { appendFile, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { writeActivitySummary } from "./lib/maestro-activity-report.mjs";
import { contained, ROOT, runProcess, selectScenarios } from "./lib/maestro-core.mjs";
import { writeReports } from "./lib/maestro-report.mjs";

const runId = process.argv[2];
if (!/^activity-QA\d{2}-\d+$/.test(runId || "")) throw new Error("Invalid activity run.");
const root = path.join(ROOT, "output/maestro");
const dir = contained(root, runId);
const state = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8"));
selectScenarios([state.account]);
if (state.results.some((item) => item.status === "running"))
  throw new Error("Wait for the active stage to finish before finalizing.");
const event = JSON.parse(await readFile(path.join(dir, "created-event.json"), "utf8"));
if (
  event.checks?.ownerMatches !== true ||
  event.checks?.reopenedEventRoute !== true ||
  event.publicGuestCheck?.status !== 200 ||
  event.publicGuestCheck?.titleMatches !== true
)
  throw new Error(
    "Saved ownership, public guest access and the reopened event route must be verified.",
  );
for (const name of ["dashboard-persistence", "reopen-saved-event"])
  if (!state.results.some((item) => item.name === name && item.status === "passed"))
    throw new Error(`${name} has no passing UI checkpoint.`);
const events = (await readFile(path.join(dir, "web-events.jsonl"), "utf8"))
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const scanPassed = state.results.some(
  (item) => item.name === "scan-upload" && item.status === "passed",
);
const savedScanReviewed =
  state.results.some((item) => item.name === "review-snap-result" && item.status === "passed") &&
  state.results.some((item) => item.name === "scan-upload") &&
  events.some(
    (item) =>
      item.event === "response" &&
      item.method === "POST" &&
      item.url === "https://envitefy.com/api/history" &&
      item.status === 201,
  );
if (!scanPassed && !savedScanReviewed)
  throw new Error(
    "Snap creation has no passing scan checkpoint or reviewed UI result with its HTTP 201 evidence.",
  );
const ocr = events.findLast((item) => item.event === "ocr_response_dates");
const historyRequest = events.findLast((item) => item.event === "history_request_dates");
if (ocr && historyRequest) {
  const matchesKnownOffsetLoss =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(ocr.start || "") &&
    Date.parse(`${ocr.start}Z`) === Date.parse(state.expected.start) &&
    Date.parse(`${ocr.end}Z`) === Date.parse(state.expected.end) &&
    Date.parse(historyRequest.startISO) - Date.parse(state.expected.start) === 300 * 60000 &&
    Date.parse(historyRequest.endISO) - Date.parse(state.expected.end) === 300 * 60000 &&
    historyRequest.timezone === "America/Chicago";
  await writeFile(
    path.join(dir, "time-shift-analysis.json"),
    JSON.stringify(
      {
        input: state.expected,
        ocr,
        historyRequest,
        saved: event.event.details,
        conclusion:
          "Captured OCR and save-request date fields are compared with the source flyer and saved event. These client values do not expose the internal provider Date value.",
        candidateCodeCause: matchesKnownOffsetLoss
          ? "The observed values match the earlier local reproduction of toLocalNoZ serializing a UTC instant without an offset, followed by Chicago-local parsing in the dashboard. This is a source-backed explanation; the internal production Date value remains unobserved."
          : null,
        sourceReferences: ["src/lib/ocr/pipeline.ts:105", "src/components/Dashboard.tsx:851"],
      },
      null,
      2,
    ),
  );
  if (event.checks.timeMatchesInput === false) {
    const findings = JSON.parse(await readFile(path.join(dir, "confirmed-findings.json"), "utf8"));
    for (const finding of findings.filter((item) => item.id === `SNAP-TIME-${state.account}-001`)) {
      finding.cause = `Live OCR returned ${ocr.start} / ${ocr.end} with timezone ${JSON.stringify(ocr.timezone)}; the history request submitted ${historyRequest.startISO} / ${historyRequest.endISO} in ${historyRequest.timezone}. Saved times differ from the source flyer. See time-shift-analysis.json for the source-backed explanation and its limits.`;
      if (!finding.evidence.includes("time-shift-analysis.json"))
        finding.evidence.push("time-shift-analysis.json");
    }
    await writeFile(path.join(dir, "confirmed-findings.json"), JSON.stringify(findings, null, 2));
  }
  if (event.checks.titleMatchesInput === false) {
    const findings = JSON.parse(await readFile(path.join(dir, "confirmed-findings.json"), "utf8"));
    for (const finding of findings.filter(
      (item) => item.id === `SNAP-TITLE-${state.account}-001`,
    )) {
      finding.cause =
        typeof ocr.title === "string" && ocr.title
          ? `The OCR response title was ${JSON.stringify(ocr.title)}; the save request title was ${JSON.stringify(historyRequest.title)}; the saved title was ${JSON.stringify(event.event.title)}. These values locate the first captured change; the OCR/provider internal decisions are not exposed.`
          : `The save request already contained ${JSON.stringify(historyRequest.title)}, matching the saved title. This run did not capture the OCR response title, so extraction versus a later client transformation remains unconfirmed.`;
      if (!finding.evidence.includes("time-shift-analysis.json"))
        finding.evidence.push("time-shift-analysis.json");
    }
    await writeFile(path.join(dir, "confirmed-findings.json"), JSON.stringify(findings, null, 2));
  }
}
state.setupEvidence ||= [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (
    !entry.isDirectory() ||
    !entry.name.startsWith("google-setup-") ||
    Number(entry.name.split("-").at(-1)) < Date.parse(state.createdAt)
  )
    continue;
  try {
    const setup = JSON.parse(await readFile(path.join(root, entry.name, "status.json"), "utf8"));
    const reference = `../${entry.name}/status.json`;
    if (setup.account === state.account && !state.setupEvidence.includes(reference))
      state.setupEvidence.push(reference);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
state.resume = {
  action:
    "Snap creation, matching owner, public guest access, dashboard persistence and reopening verified. Preserve confirmed mismatches for reproduction.",
  envitefyUserVerified: true,
  eventVerified: true,
  timeMatchesInput: event.checks.timeMatchesInput,
};
await writeFile(path.join(dir, "state.json"), JSON.stringify(state, null, 2));
await appendFile(
  path.join(dir, "journal.jsonl"),
  `${JSON.stringify({
    at: new Date().toISOString(),
    event: "account_activity_verified",
    account: state.account,
    eventId: event.eventId,
    timeMatchesInput: event.checks.timeMatchesInput,
  })}\n`,
);
await writeReports(dir, state.results, {
  runId,
  platform: "android",
  account: state.account,
  limitations: [
    "Only the recorded assertions and companion checks are verified. Confirmed fact mismatches remain distinct from tool failures and unconfirmed production causes.",
  ],
});
await writeActivitySummary(dir, state);
await runProcess(process.execPath, [path.join(ROOT, "scripts/maestro-activity-status.mjs")], {
  timeoutMs: 10000,
});
console.log(`${state.account}: activity checkpoint and all reports saved in ${dir}`);
