import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ACTIVE_SCENARIOS, DEFERRED_ACCOUNTS, DISABLED_ACCOUNTS, ROOT } from "./lib/maestro-core.mjs";

const root = path.join(ROOT, "output/maestro");
const optional = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fallback;
  }
};
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character],
  );
const runs = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^activity-QA\d{2}-\d+$/.test(entry.name)) continue;
  const state = await optional(path.join(root, entry.name, "state.json"), null);
  if (state?.kind === "envitefy-android-activity") runs.push(state);
}
const accounts = [];
const issues = new Map();
for (const scenario of ACTIVE_SCENARIOS) {
  const state = runs
    .filter((run) => run.account === scenario.account)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (!state) {
    accounts.push({
      account: scenario.account,
      status: DEFERRED_ACCOUNTS.has(scenario.account) ? "Deferred by owner; not started" : "Not started",
    });
    continue;
  }
  const dir = path.join(root, state.runId);
  const event = await optional(path.join(dir, "created-event.json"), null);
  const verification = await optional(path.join(dir, "verification-required.json"), null);
  const findings = await optional(path.join(dir, "confirmed-findings.json"), []);
  for (const finding of findings.filter((item) => item.status === "confirmed_observed_mismatch")) {
    const isTime =
      finding.id?.startsWith("SNAP-TIME-") && Number.isFinite(finding.differenceMinutes);
    const isTitle = finding.id?.startsWith("SNAP-TITLE-");
    const normalizeTitle = (value) => String(value || "").replace(/QA\d{2}/g, "QA");
    const id = isTime
      ? `SNAP-TIME-${finding.differenceMinutes}-${finding.actual?.timezone}`
      : isTitle
        ? `SNAP-TITLE:${normalizeTitle(finding.expected?.title)}:${normalizeTitle(finding.actual?.title)}`
        : finding.id;
    const issue = issues.get(id) || {
      id,
      status: "confirmed_observed_mismatch",
      title: isTime
        ? `Saved Snap times differ by ${finding.differenceMinutes} minutes`
        : isTitle
          ? "Saved Snap title differs from the source"
          : finding.id,
      note: "Grouped by the observed mismatch. Causes and their uncertainty are retained per account.",
      occurrences: [],
    };
    issue.occurrences.push({
      account: state.account,
      runId: state.runId,
      eventId: finding.eventId,
      findingId: finding.id,
      expected: finding.expected,
      actual: finding.actual,
      cause: finding.cause,
      evidence: (finding.evidence || []).map((file) => `${state.runId}/${file}`),
    });
    issues.set(id, issue);
  }
  const publicVerified =
    event?.checks?.ownerMatches === true &&
    event?.publicGuestCheck?.status === 200 &&
    event?.publicGuestCheck?.titleMatches === true;
  const reopenedRouteVerified = event?.checks?.reopenedEventRoute === true;
  const verified = publicVerified && reopenedRouteVerified;
  accounts.push({
    account: scenario.account,
    runId: state.runId,
    status: verified
      ? "Snap event created; public guest access and reopening verified"
      : publicVerified
        ? "Snap event and public access verified; reopening route check pending"
        : verification?.status === "owner_input_required"
          ? `Google owner action required: ${verification.requirement}`
          : "Setup/activity incomplete; no event verified",
    lastStep: state.results.at(-1)?.name,
    lastStepResult: state.results.at(-1)?.status,
    eventUrl: event?.url,
    publicVerified,
    reopenedRouteVerified,
    confirmedFindings: findings.filter((item) => item.status === "confirmed_observed_mismatch")
      .length,
    resume: state.resume?.action,
  });
}
const report = {
  generatedAt: new Date().toISOString(),
  target: "Google Play Android com.envitefy.app 1.0.3 (5)",
  excludedAccount: DISABLED_ACCOUNTS.size === 1 ? [...DISABLED_ACCOUNTS][0] : null,
  excludedAccounts: [...DISABLED_ACCOUNTS],
  deferredAccounts: [...DEFERRED_ACCOUNTS],
  cameraTesting: await optional(path.join(root, "camera-testing-unavailable.json"), null),
  accounts,
  confirmedIssuePatterns: issues.size,
};
await writeFile(
  path.join(root, "confirmed-issues.json"),
  JSON.stringify({ generatedAt: report.generatedAt, issues: [...issues.values()] }, null, 2),
);
const issueHtml = [...issues.values()]
  .map(
    (issue) =>
      `<article><h2>${escapeHtml(issue.title)}</h2><p>${escapeHtml(issue.note)}</p>${issue.occurrences.map((item) => `<h3>${escapeHtml(item.account)}</h3><p>${escapeHtml(item.cause)}</p><p>Expected</p><pre>${escapeHtml(JSON.stringify(item.expected, null, 2))}</pre><p>Observed</p><pre>${escapeHtml(JSON.stringify(item.actual, null, 2))}</pre><p><a href="${escapeHtml(item.runId)}/activity-summary.html">Account evidence and logs</a></p>`).join("")}</article>`,
  )
  .join("");
await writeFile(
  path.join(root, "confirmed-issues.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Confirmed Envitefy test findings</title><style>body{font:16px system-ui;max-width:1100px;margin:32px auto;padding:0 20px}article{padding:20px;background:#f4f0ff;margin:20px 0}pre{white-space:pre-wrap}</style><h1>Confirmed observed issues</h1><p>${escapeHtml(report.generatedAt)} · ${issues.size} distinct mismatch patterns</p>${issueHtml || "<p>None recorded.</p>"}`,
);
await writeFile(path.join(root, "activity-index.json"), JSON.stringify(report, null, 2));
const rows = accounts
  .map(
    (item) =>
      `<tr><td>${escapeHtml(item.account)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.lastStep || "")} ${escapeHtml(item.lastStepResult || "")}</td><td>${item.confirmedFindings ?? 0}</td><td>${item.runId ? `<a href="${escapeHtml(item.runId)}/activity-summary.html">Run report</a>` : ""}</td></tr>`,
  )
  .join("");
const cameraNote = report.cameraTesting
  ? '<p><strong>Camera capture: unavailable for this testing.</strong> Runs use Upload file with prepared PNGs. Camera behavior remains unverified. <a href="camera-testing-unavailable.json">Recorded owner constraint</a></p>'
  : "";
await writeFile(
  path.join(root, "activity-index.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Envitefy Android testing</title><style>body{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 20px;color:#211c2b}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:10px;text-align:left;vertical-align:top}</style><h1>Envitefy Android account activity</h1><p>${escapeHtml(report.generatedAt)} · ${escapeHtml(report.target)} · ${accounts.length} configured accounts${report.excludedAccounts.length ? ` · Excluded: ${escapeHtml(report.excludedAccounts.join(", "))}` : ""}</p>${cameraNote}<p>Each completed account needs real Snap creation, matching ownership, anonymous guest-page verification and an observed reopened event route. Setup steps and the separate specialized business suite are not counted as completed account activity.</p><p><a href="confirmed-issues.html">${issues.size} confirmed mismatch patterns across accounts</a> · <a href="confirmed-issues.json">Issue data</a></p><table><tr><th>Account</th><th>Verified activity</th><th>Last Maestro stage</th><th>Confirmed findings</th><th>Evidence</th></tr>${rows}</table><p>Per-account reports retain screenshots, logs, failed attempts and causes. Unknown causes remain unconfirmed.</p></html>`,
);
console.log(`Account status: ${path.join(root, "activity-index.html")}`);
