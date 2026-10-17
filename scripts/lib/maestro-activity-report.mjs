import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { redact } from "./maestro-core.mjs";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const optionalJson = async (file, fallback) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fallback;
  }
};

export async function writeActivitySummary(dir, state, secrets = []) {
  const findings = await optionalJson(path.join(dir, "confirmed-findings.json"), []);
  const event = await optionalJson(path.join(dir, "created-event.json"), null);
  const report = JSON.parse(
    redact(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        runId: state.runId,
        account: state.account,
        results: state.results,
        event,
        confirmedFindings: findings.filter((item) => item.status === "confirmed_observed_mismatch"),
      }),
      secrets,
    ),
  );
  report.summary = {
    passedSteps: report.results.filter((item) => item.status === "passed").length,
    failedOrIncompleteSteps: report.results.filter((item) => item.status !== "passed").length,
    confirmedAppFindings: report.confirmedFindings.length,
  };
  await writeFile(path.join(dir, "activity-summary.json"), JSON.stringify(report, null, 2));
  const rows = report.results
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.classification || "")}</td><td>${escapeHtml(item.cause || item.message || "Assertions passed for this step.")}</td><td><a href="${escapeHtml(item.artifactDir)}/console.log">Console</a> · <a href="${escapeHtml(item.artifactDir)}/junit.xml">JUnit</a></td></tr>`,
    )
    .join("");
  const findingsHtml = report.confirmedFindings
    .map(
      (item) =>
        `<article><h3>${escapeHtml(item.id)}</h3><p>Expected</p><pre>${escapeHtml(JSON.stringify(item.expected, null, 2))}</pre><p>Observed</p><pre>${escapeHtml(JSON.stringify(item.actual, null, 2))}</pre><p>Cause: ${escapeHtml(item.cause)}</p></article>`,
    )
    .join("");
  const url = report.event?.url;
  const eventHtml = url?.startsWith("https://envitefy.com/event/")
    ? `<p>Created event: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`
    : "";
  await writeFile(
    path.join(dir, "activity-summary.html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Envitefy account activity</title><style>body{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 20px;color:#211c2b}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:10px;text-align:left;vertical-align:top}pre{white-space:pre-wrap}article{padding:16px;background:#f4f0ff;margin:20px 0}</style><h1>${escapeHtml(report.account)} activity run</h1><p>${escapeHtml(report.runId)}</p><p>${report.summary.passedSteps} passed UI steps · ${report.summary.failedOrIncompleteSteps} failed/incomplete attempts · ${report.summary.confirmedAppFindings} confirmed app findings</p>${eventHtml}<h2>Confirmed findings from evidence review</h2>${findingsHtml || "<p>None recorded.</p>"}<h2>All attempts and explanations</h2><table><tr><th>Step</th><th>Result</th><th>Classification</th><th>What happened and why</th><th>Evidence</th></tr>${rows}</table><p>Passing UI steps do not prove that extracted event facts are correct. Unknown causes remain unconfirmed.</p><h2>Run evidence</h2><p><a href="journal.jsonl">Checkpoint journal</a> · <a href="web-events.jsonl">Chrome console and network log</a> · <a href="created-event.json">Saved event and guest checks</a> · <a href="saved-fields.json">Saved date fields</a> · <a href="confirmed-findings.json">Confirmed findings</a> · <a href="time-shift-analysis.json">Time conversion analysis</a> · <a href="snap-input.png">Input flyer</a></p></html>`,
  );
  return report;
}
