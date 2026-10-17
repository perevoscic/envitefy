import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyFailure, fingerprint, redact } from "./maestro-core.mjs";

export async function artifactFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (entry.isSymbolicLink()) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await artifactFiles(file)));
    else files.push(file);
  }
  return files;
}

export async function inspectFailure(dir) {
  const files = await artifactFiles(dir);
  for (const file of files.filter((file) => /commands.*\.json$/i.test(file))) {
    try {
      const commands = JSON.parse(await readFile(file, "utf8"));
      const failed = Array.isArray(commands)
        ? commands.filter((item) => ["FAILED", "ERROR"].includes(item.metadata?.status))
        : [];
      const item = failed.at(-1);
      if (!item) continue;
      const command = item.metadata?.evaluatedCommand || item.command || {};
      const [type, detail] = Object.entries(command)[0] || [];
      const error = item.metadata?.error || {};
      return {
        failedStep: `${type || "Unknown step"}: ${JSON.stringify(detail || {}).slice(0, 800)}`,
        message:
          error.message ||
          error.localizedMessage ||
          item.metadata?.errorMessage ||
          "Maestro reported a failed assertion or action.",
        waitTimedOut: Boolean(detail?.timeout),
        waitTimeoutMs: detail?.timeout ? Number(detail.timeout) : undefined,
      };
    } catch {
      /* Unreadable/partial command JSON remains evidence, not a defect. */
    }
  }
  return {};
}

export async function updateFindingRegistry(root, report) {
  const file = path.join(root, "findings.json");
  let registry = { version: 1, findings: [] };
  try {
    registry = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (registry.version !== 1 || !Array.isArray(registry.findings))
    throw new Error("Unsupported finding registry; existing data was preserved.");
  for (const finding of report.findings) {
    let item = registry.findings.find((item) => item.id === finding.id);
    if (!item) {
      item = {
        ...finding,
        firstSeen: report.generatedAt,
        lastSeen: report.generatedAt,
        occurrences: [],
      };
      registry.findings.push(item);
    }
    item.lastSeen = report.generatedAt;
    for (const occurrence of finding.occurrences) {
      if (
        !item.occurrences.some(
          (existing) =>
            existing.runId === report.runId &&
            existing.account === occurrence.account &&
            existing.scenario === occurrence.scenario,
        )
      ) {
        item.occurrences.push({ ...occurrence, runId: report.runId, commit: report.commit });
      }
    }
  }
  registry.updatedAt = new Date().toISOString();
  await writeFile(file, JSON.stringify(registry, null, 2));
  return registry;
}

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
const relative = (root, file) => path.relative(root, file).split(path.sep).join("/");

export async function writeReports(runDir, results, metadata = {}, secrets = []) {
  const bugs = new Map();
  for (const result of results.filter(
    (item) => item.status !== "passed" && item.status !== "skipped",
  )) {
    const id = fingerprint(result);
    const bug = bugs.get(id) || {
      id: `F-${id}`,
      classification: result.classification || classifyFailure(result),
      severity: "untriaged",
      status: "needs_review",
      title: `${result.name}: ${result.message || "verification failed"}`,
      expected: result.expected || "All assertions in the scenario pass.",
      actual: result.message || "The test did not complete successfully.",
      steps: [result.file, result.failedStep].filter(Boolean),
      occurrences: [],
    };
    bug.occurrences.push({
      account: result.account,
      scenario: result.scenario,
      artifactDir: result.artifactDir,
      failedStep: result.failedStep,
      startedAt: result.startedAt,
    });
    bugs.set(id, bug);
  }
  let confirmed = [];
  try {
    confirmed = JSON.parse(await readFile(path.join(runDir, "confirmed-findings.json"), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (const finding of confirmed.filter((item) => item.status === "confirmed_observed_mismatch")) {
    bugs.set(`confirmed:${finding.id}`, {
      ...finding,
      classification: "confirmed_app_defect",
      severity: "untriaged",
      title: finding.title || finding.id,
      expected: JSON.stringify(finding.expected),
      actual: JSON.stringify(finding.actual),
      steps: finding.evidence || [],
      occurrences: [
        {
          account: finding.account,
          scenario: finding.id,
          eventId: finding.eventId,
          artifactDir: ".",
        },
      ],
    });
  }
  const report = {
    ...metadata,
    generatedAt: new Date().toISOString(),
    summary: {
      passed: results.filter((item) => item.status === "passed").length,
      failed: results.filter((item) => item.status === "failed").length,
      skipped: results.filter((item) => item.status === "skipped").length,
      findings: bugs.size,
      confirmedDefects: [...bugs.values()].filter(
        (item) => item.classification === "confirmed_app_defect",
      ).length,
    },
    results,
    findings: [...bugs.values()],
  };
  const safe = (value) => redact(value, secrets);
  await writeFile(path.join(runDir, "bugs.json"), safe(JSON.stringify(report, null, 2)));
  const md = [
    `# Envitefy Maestro run`,
    "",
    `Run: ${metadata.runId || path.basename(runDir)}`,
    "",
    `Passed: ${report.summary.passed} · Failed/incomplete: ${report.summary.failed} · Skipped: ${report.summary.skipped}`,
    "",
    `Confirmed app defects from evidence review: ${report.summary.confirmedDefects}. Other findings require triage; a test failure or timeout alone does not confirm an app defect.`,
    "",
    "| Account | Scenario | Result | Classification | Evidence |",
    "| --- | --- | --- | --- | --- |",
    ...results.map(
      (item) =>
        `| ${item.account || "setup"} | ${item.name} | ${item.status} | ${item.classification || "—"} | [artifacts](${item.artifactDir || "."}) |`,
    ),
    "",
    ...[...bugs.values()].flatMap((item) => [
      `## ${item.id}: ${item.title}`,
      "",
      `Classification: ${item.classification}. Severity: ${item.severity}.`,
      "",
      `Expected: ${item.expected}`,
      "",
      `Observed: ${item.actual}`,
      "",
      ...(item.cause ? [`Cause: ${item.cause}`, ""] : []),
      ...item.steps.map((step) => `- ${step}`),
      "",
    ]),
    "## Coverage limits",
    "",
    ...(metadata.limitations || []).map((item) => `- ${item}`),
    "",
  ];
  await writeFile(path.join(runDir, "bugs.md"), safe(md.join("\n")));
  const rows = await Promise.all(
    results.map(async (item) => {
      const images = (await artifactFiles(path.join(runDir, item.artifactDir || "missing")))
        .filter((file) => /\.png$/i.test(file))
        .slice(-3);
      return `<tr><td>${escapeHtml(item.account)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.classification || "")}</td><td>${escapeHtml(item.message || "")}<br>${images.map((file) => `<a href="${escapeHtml(relative(runDir, file))}"><img alt="Test evidence" src="${escapeHtml(relative(runDir, file))}" width="180"></a>`).join(" ")}<br><a href="${escapeHtml(item.artifactDir || ".")}/console.log">Console log</a></td></tr>`;
    }),
  );
  await writeFile(
    path.join(runDir, "report.html"),
    safe(
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>Envitefy Maestro report</title><style>body{font:16px system-ui;max-width:1400px;margin:32px auto;padding:0 20px;color:#211c2b}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:12px;text-align:left;vertical-align:top}img{max-height:180px;object-fit:contain}pre{white-space:pre-wrap}</style><h1>Envitefy Maestro report</h1><p>${escapeHtml(report.summary.passed)} passed · ${escapeHtml(report.summary.failed)} failed/incomplete · ${escapeHtml(report.summary.skipped)} skipped · ${escapeHtml(report.summary.confirmedDefects)} confirmed app defects from evidence review.</p>${report.summary.confirmedDefects ? '<p><a href="activity-summary.html">Confirmed findings and causes</a> · <a href="confirmed-findings.json">Finding evidence</a></p>' : ""}<table><thead><tr><th>Account</th><th>Scenario</th><th>Result</th><th>Classification</th><th>Evidence</th></tr></thead><tbody>${rows.join("")}</tbody></table><h2>Coverage limits</h2><ul>${(metadata.limitations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></html>`,
    ),
  );
  return report;
}
