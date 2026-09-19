#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  campaignStopReason,
  checkpointExecution,
  finishCaseExecution,
  newCampaignExecution,
  stopExecution,
} from "./lib/create-campaign-execution.mjs";
import { breadthFirstCampaignQueue, buildCampaignScenarios } from "./lib/create-campaign-scenarios.mjs";
import { MAX_CAMPAIGN_BUDGET_USD } from "./lib/create-campaign-budget.mjs";
import { selectCampaignQueue, syncManifestBudget } from "./lib/create-campaign-selection.mjs";
import { effectiveCampaignScenario, overrideCampaignEventDate, validateCampaignEventDate } from "./lib/create-campaign-date.mjs";
import {
  adjudicateCampaignCase,
  reviewOfflineFactCase,
} from "./lib/create-campaign-validation.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const match = argv.find((value) => value.startsWith(`--${name}=`));
  if (match) return match.slice(name.length + 3);
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")
    ? argv[index + 1]
    : fallback;
};
const mode =
  ["plan", "offline", "run", "resume", "report"].find(
    (value) => argv.includes(value) || argv.includes(`--${value}`),
  ) || "plan";
const runId = option("id", "2026-09-18");
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(runId)) throw new Error("Invalid campaign id");
const runDir = path.join(repoRoot, ".qa", "create-campaign", runId);
const manifestPath = path.join(runDir, "manifest.json");
const savedManifest = await readJson(manifestPath);
const budgetUsd = Number(option("budget-usd", String(savedManifest?.budgetUsd || 10)));
if (!Number.isFinite(budgetUsd) || budgetUsd <= 0 || budgetUsd > MAX_CAMPAIGN_BUDGET_USD)
  throw new Error(`Campaign budget must be >0 and <=${MAX_CAMPAIGN_BUDGET_USD} USD`);
const budgetIncreaseReason = option("budget-increase-reason", "").trim();
if (argv.includes("--allow-budget-increase") && (!budgetIncreaseReason || budgetIncreaseReason.length > 500))
  throw new Error("--allow-budget-increase requires --budget-increase-reason with 1 to 500 characters documenting the user's authorization");

async function readJson(target, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(target, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}
async function writeJson(target, value) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, target);
}
async function initialize() {
  const existing = await readJson(manifestPath);
  if (existing) {
    if (budgetUsd !== existing.budgetUsd) {
      if (!argv.includes("--allow-budget-increase") || budgetUsd <= existing.budgetUsd)
        throw new Error("Changing the campaign budget requires an explicitly authorized increase");
      if (!["run", "resume"].includes(mode))
        throw new Error("Budget increases must be accepted by the durable ledger during run or resume");
      // Persist only after createBudgetGateway has accepted the same authorization.
    }
    return existing;
  }
  await fs.mkdir(path.join(runDir, "baseline"), { recursive: true });
  const git = (...args) =>
    execFileSync("git", args, { cwd: repoRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const diff = git("diff", "--binary", "HEAD");
  await fs.writeFile(path.join(runDir, "baseline", "working-tree.patch"), diff);
  const untracked = git("ls-files", "--others", "--exclude-standard")
    .split(/\r?\n/)
    .filter((name) => /^(src|scripts|\.github)\//.test(name));
  const hashes = {};
  for (const name of untracked) {
    const bytes = await fs.readFile(path.join(repoRoot, name));
    hashes[name] = createHash("sha256").update(bytes).digest("hex");
    const target = path.join(runDir, "baseline", "untracked", name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  const manifest = {
    version: 1,
    runId,
    createdAt: new Date().toISOString(),
    budgetUsd,
    budgetPolicy: {
      baseline: 6,
      retest: 3,
      contingency: 1,
      hardCeilingUsd: 10,
      unknownChargesRetainReservation: true,
    },
    snapshot: {
      commit: git("rev-parse", "HEAD").trim(),
      diffSha256: createHash("sha256").update(diff).digest("hex"),
      untrackedHashes: hashes,
    },
    environment: "isolated local",
    referenceDate: option("reference-date", "2026-09-18"),
    scenarios: buildCampaignScenarios({ referenceDate: option("reference-date", "2026-09-18") }),
    signupProbes: [
      "Teacher asks for parent volunteer roles",
      "Coach asks for concession shifts",
      "Mom asks for potluck contributions",
    ],
    baselineTests: { command: "npm run test:create-facts", status: "not_recorded" },
  };
  await writeJson(manifestPath, manifest);
  return manifest;
}

async function report(manifest) {
  const { renderCampaignReport } = await import("./lib/create-campaign-report.mjs");
  const { reconcileCampaignMapEvidence } = await import("./lib/create-campaign-reconciliation.mjs");
  const results = [];
  const effectiveScenarios = [];
  for (const scenario of manifest.scenarios) {
    const captured = await readJson(path.join(runDir, "cases", scenario.id, "result.json"));
    const persisted = captured ? null : await readJson(path.join(runDir, "effective-scenarios", `${scenario.id}.json`));
    effectiveScenarios.push(effectiveCampaignScenario(scenario, captured, persisted));
    const result = captured ? reconcileCampaignMapEvidence(captured) : null;
    if (result) {
      if (result.handoffReconciliation) {
        const evidencePath = `reconciliation/${scenario.id}--${result.attemptId}--maps.json`;
        await writeJson(path.join(runDir, evidencePath), { ...result.handoffReconciliation, sourceResultSha256: createHash("sha256").update(JSON.stringify(captured)).digest("hex"), actions: result.guestActions });
        result.evidence.push({ kind: "handoff-reconciliation", path: evidencePath, exists: true, attemptId: result.attemptId });
      }
      const review = await readJson(path.join(runDir, "reviews", `${scenario.id}.json`));
      if (review && (!review.resultFinishedAt || review.resultFinishedAt === result.finishedAt)) {
        result.findings = [...(result.findings || []), ...(review.findings || [])];
        result.qaResults = review.qaResults || result.qaResults;
        result.scores = review.partialScores || result.scores;
        result.reviewedAt = review.reviewedAt || null;
        result.reviewStatus = review.status || "partial_review";
        result.evidence = [...(result.evidence || []), {
          kind: "independent-review",
          path: `reviews/${scenario.id}.json`,
          caption: "Independent review, score reasons and evidence limitations",
          exists: true,
          attemptId: result.attemptId,
        }];
        // Preserve execution blockers. A completed independent review may propose
        // a quality verdict, which the report's full evidence gate rechecks.
        if (result.status === "unreviewed" && ["passed", "failed", "incomplete"].includes(review.caseStatus)) {
          result.status = review.caseStatus;
        }
      }
      results.push(result);
    }
  }
  const ledger = await readJson(path.join(runDir, "ledger.json"), {
    budgetUsd,
    spentUsd: 0,
    reservedUsd: 0,
    entries: [],
  });
  const audit = {
    offline: await readJson(path.join(runDir, "offline-fact-matrix.json")),
    baseline: await readJson(path.join(runDir, "baseline", "offline-fact-matrix.json")),
    review: await readJson(path.join(runDir, "campaign-review.json")),
    responsive: await readJson(path.join(runDir, "responsive-audit-latest.json")),
    execution: await readJson(path.join(runDir, "execution.json")),
    funding: await readJson(path.join(runDir, "additional-30", "authorization.json")),
  };
  if (audit.baseline?.results && audit.baseline.conversationPreservationPassed == null) {
    audit.baseline = {
      ...audit.baseline,
      appearancePreservationPassed: audit.baseline.results.filter((result) => result.passed).length,
      conversationPreservationPassed: audit.baseline.results.filter(
        (result) =>
          reviewOfflineFactCase(
            manifest.scenarios.find((scenario) => scenario.id === result.caseId),
            result,
          ).passed,
      ).length,
    };
  }
  for (const item of audit.responsive?.evidence || []) {
    const resolved = path.resolve(runDir, item.path);
    const relative = path.relative(runDir, resolved);
    item.exists = Boolean(
      relative &&
        !relative.startsWith("..") &&
        !path.isAbsolute(relative) &&
        (await fs
          .stat(resolved)
          .then((stat) => stat.isFile())
          .catch(() => false)),
    );
  }
  const output = renderCampaignReport({ ...manifest, scenarios: effectiveScenarios }, results, ledger, audit);
  await fs.writeFile(path.join(runDir, "report.md"), output.markdown);
  await fs.writeFile(path.join(runDir, "index.html"), output.html);
  console.log(
    JSON.stringify({
      runId,
      report: path.join(runDir, "index.html"),
      cases: manifest.scenarios.length,
      observed: results.length,
    }),
  );
}

async function offline(manifest) {
  // Deterministic checks have their own result artifact: never count as live passes.
  const { fallbackExtractConciergeDraft } = await import("../src/lib/concierge/fallback.ts");
  const factKeys = [
    "title",
    "honoreeName",
    "ageOrMilestone",
    "eventType",
    "dateText",
    "timeText",
    "startISO",
    "endISO",
    "timezone",
    "location",
    "venue",
    "additionalLocations",
    "rsvpEnabled",
    "rsvpName",
    "rsvpContact",
    "rsvpDeadline",
    "registryLink",
    "giftPreferenceNote",
    "previewCopy",
  ];
  const results = [];
  for (const scenario of manifest.scenarios) {
    let draft = null;
    const snapshots = [];
    for (const message of scenario.messages.filter(
      (turn) => !["generate", "style_edit"].includes(turn.kind),
    )) {
      draft = fallbackExtractConciergeDraft({
        message: message.text,
        draft,
        requestedOutputs: [scenario.output],
      });
      snapshots.push({ kind: message.kind, draft });
    }
    const before = Object.fromEntries(factKeys.map((key) => [key, draft[key]]));
    const edited = fallbackExtractConciergeDraft({
      message: scenario.messages.find((turn) => turn.kind === "style_edit").text,
      draft,
      requestedOutputs: [scenario.output],
    });
    const changedFacts = factKeys.filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(edited[key]),
    );
    const result = {
      caseId: scenario.id,
      mode: "deterministic_only",
      passed: changedFacts.length === 0,
      changedFacts,
      finalDraft: edited,
      snapshots,
    };
    results.push(result);
  }
  const reviews = results.map((result) =>
    reviewOfflineFactCase(
      manifest.scenarios.find((scenario) => scenario.id === result.caseId),
      result,
    ),
  );
  const audit = {
    checkedAt: new Date().toISOString(),
    count: results.length,
    appearancePreservationPassed: results.filter((result) => result.passed).length,
    conversationPreservationPassed: reviews.filter((result) => result.passed).length,
    reviews,
    results,
  };
  const existing = await readJson(path.join(runDir, "offline-fact-matrix.json"));
  if (existing) {
    const baselinePath = path.join(runDir, "baseline", "offline-fact-matrix.json");
    if (!(await readJson(baselinePath))) await writeJson(baselinePath, existing);
  }
  await writeJson(path.join(runDir, "offline-fact-matrix.json"), audit);
  console.log(
    JSON.stringify({
      mode: "deterministic_only",
      count: results.length,
      appearancePreservationPassed: audit.appearancePreservationPassed,
      conversationPreservationPassed: audit.conversationPreservationPassed,
      failures: reviews
        .filter((result) => !result.passed)
        .map((result) => ({
          id: result.caseId,
          findings: result.findings.map((finding) => finding.title),
        })),
    }),
  );
}

async function waitForServer(url, processHandle) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null)
      throw new Error(`Local server exited (${processHandle.exitCode})`);
    try {
      const response = await fetch(`${url}/api/auth/csrf`, { signal: AbortSignal.timeout(15000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Isolated local server did not become ready");
}

async function run(manifest) {
  const selectedId = option("case", null);
  const selectedIds = option("cases", "").split(",").map(id => id.trim()).filter(Boolean);
  const all = argv.includes("--all");
  const conversationOnly = argv.includes("--conversation-only");
  const queueStrategy = argv.includes("--breadth-first") ? "family_breadth_first" : "manifest_order";
  const orderedScenarios = queueStrategy === "family_breadth_first"
    ? breadthFirstCampaignQueue(manifest.scenarios) : manifest.scenarios;
  const attemptedCaseIds = [];
  if (argv.includes("--untested-only")) {
    for (const scenario of orderedScenarios) {
      if (await readJson(path.join(runDir, "cases", scenario.id, "result.json")))
        attemptedCaseIds.push(scenario.id);
    }
  }
  const selection = selectCampaignQueue({
    scenarios: orderedScenarios,
    selectedId,
    selectedIds,
    all,
    startAt: option("start-at", null),
    untestedOnly: argv.includes("--untested-only"),
    attemptedCaseIds,
  });
  const cases = [];
  const explicitEventDate = option("event-date", null);
  const datePolicyPath = path.join(runDir, "event-date-policy.json");
  let datePolicy = await readJson(datePolicyPath);
  if (explicitEventDate) {
    validateCampaignEventDate(explicitEventDate);
    datePolicy = {
      eventDate: explicitEventDate,
      authorizedAt: new Date().toISOString(),
      reason: `User requested ${explicitEventDate} as the event date for all future tests in this campaign`,
      scope: "Future attempts only; previous attempts and frozen manifest remain unchanged",
    };
    await writeJson(datePolicyPath, datePolicy);
  }
  if (datePolicy) validateCampaignEventDate(datePolicy.eventDate);
  for (const scenario of selection.cases) {
    const existing = await readJson(path.join(runDir, "cases", scenario.id, "result.json"));
    const skipsExisting = mode === "resume" && existing &&
      (["passed", "unreviewed"].includes(existing.status) ||
        (conversationOnly && existing.transcript?.some((turn) => turn.kind === "correction" && turn.role === "assistant")));
    if (skipsExisting) {
      cases.push(effectiveCampaignScenario(scenario, existing));
      continue;
    }
    const persistedPath = path.join(runDir, "effective-scenarios", `${scenario.id}.json`);
    if (datePolicy) {
      const effective = overrideCampaignEventDate(scenario, datePolicy.eventDate, datePolicy);
      await writeJson(persistedPath, effective);
      cases.push(effective);
    } else {
      cases.push(effectiveCampaignScenario(scenario, null, await readJson(persistedPath)));
    }
  }
  Object.freeze(cases);
  if (!cases.length) throw new Error("No matching unattempted campaign case or selected queue is empty");
  const queueSelectedAt = new Date().toISOString();
  const { prepareCampaignEnvironment, readCampaignSourceEnv } = await import(
    "./lib/create-campaign-environment.mjs"
  );
  const sourceEnv = await readCampaignSourceEnv(repoRoot);
  const apiKey = sourceEnv.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI credentials are not available; no paid requests attempted");
  const { createBudgetGateway } = await import("./lib/create-campaign-budget.mjs");
  const { runBrowserCase } = await import("./lib/create-campaign-browser.mjs");
  const phase = option("phase", "baseline");
  if (!["baseline", "retest", "contingency"].includes(phase))
    throw new Error("Invalid campaign phase");
  const budgetPolicy = option("budget-policy", "strict");
  if (!["strict", "metered"].includes(budgetPolicy))
    throw new Error("Invalid campaign budget policy");
  const gateway = await createBudgetGateway({
    ledgerPath: path.join(runDir, "budget-journal.jsonl"),
    budgetUsd,
    apiKey,
    phase,
    standardTier: true,
    budgetPolicy,
    allowPolicyTransition: argv.includes("--allow-budget-policy-transition"),
    allowBudgetIncrease: argv.includes("--allow-budget-increase"),
    budgetIncreaseReason: argv.includes("--allow-budget-increase") ? budgetIncreaseReason : undefined,
  });
  let environment;
  let server;
  let serverLog;
  let execution;
  const runStartedAt = Date.now();
  const shouldStop = async () => {
    const request = await fs.stat(path.join(runDir, "runtime", "stop-campaign")).catch(() => null);
    return Boolean(request && request.mtimeMs >= runStartedAt);
  };
  const executionPath = path.join(runDir, "execution.json");
  try {
    Object.assign(manifest, syncManifestBudget(manifest, gateway.snapshot()));
    await writeJson(manifestPath, manifest);
    await writeJson(path.join(runDir, "ledger.json"), gateway.snapshot());
    if (!argv.includes("--responsive-audit") && !argv.includes("--serve-only")) {
      const previousExecution = await readJson(executionPath);
      let previousExecutionPath = null;
      if (previousExecution) {
        previousExecutionPath = `executions/${previousExecution.executionId || Date.now()}.json`;
        await writeJson(path.join(runDir, previousExecutionPath), previousExecution);
      }
      execution = newCampaignExecution({
        caseIds: cases.map((scenario) => scenario.id),
        scope: conversationOnly ? "conversation_only" : "complete_journey",
        budgetPolicy,
        ledger: gateway.snapshot(),
        previousExecution: previousExecutionPath,
      });
      execution.queueStrategy = queueStrategy;
      execution.selection = {
        selectedAt: queueSelectedAt,
        untestedOnly: selection.untestedOnly,
        skippedAttemptedCaseIds: selection.skippedAttemptedCaseIds,
        eventDatePolicy: datePolicy,
      };
      execution.currentLimitations = [
        "These are synthetic persona simulations, not interviews with real customers.",
        "Journey completion and independent quality review are separate; unreviewed output is not a pass.",
        "Guest calendar and directions checks verify handoff URLs and local calendar files, not completion in external providers.",
      ];
      await writeJson(executionPath, execution);
    }
    environment = await prepareCampaignEnvironment({
      runDir,
      repoRoot,
      openaiBaseUrl: gateway.url,
      gatewayToken: gateway.clientApiKey,
    });
    // The application sees only the local gateway token. Only the gateway holds the real key.
    const env = {
      ...environment.env,
      OPENAI_BASE_URL: gateway.url,
      OPENAI_API_KEY: gateway.clientApiKey,
    };
    const modelConfig = Object.fromEntries(
      Object.entries(env).filter(([key]) => /MODEL|QUALITY|STUDIO_PROVIDER/.test(key)),
    );
    await writeJson(path.join(runDir, "runtime-config.json"), {
      baseUrl: environment.baseUrl,
      modelOverrides: modelConfig,
      gateway: gateway.url,
      budgetPolicy,
      serviceTier: "default (Standard); model and image quality preserved",
      authentication: "regular test users through credentials API",
    });
    serverLog = await fs.open(path.join(runDir, "server.log"), "a");
    server = spawn(process.execPath, ["scripts/dev-single.js", "--hostname", "127.0.0.1"], {
      cwd: repoRoot,
      env,
      stdio: ["ignore", serverLog.fd, serverLog.fd],
      windowsHide: true,
    });
    console.log(JSON.stringify({ event: "server_starting", baseUrl: environment.baseUrl }));
    await waitForServer(environment.baseUrl, server);
    if (argv.includes("--serve-only")) {
      const stopFile = path.join(runDir, "runtime", "stop-serving");
      const started = Date.now();
      console.log(
        JSON.stringify({
          event: "diagnostic_server_ready",
          baseUrl: environment.baseUrl,
          stopFile,
        }),
      );
      while (Date.now() - started < 600_000) {
        const requested = await fs.stat(stopFile).catch(() => null);
        if (requested && requested.mtimeMs >= started) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return;
    }
    if (argv.includes("--responsive-audit")) {
      const { runResponsiveAudit } = await import("./lib/create-campaign-responsive.mjs");
      const account = environment.accounts.find((item) => item.persona === "mom");
      const audit = await runResponsiveAudit({ baseUrl: environment.baseUrl, account, runDir });
      console.log(JSON.stringify({ event: "responsive_audit_finished", audit }));
      return;
    }
    let infrastructureFailures = 0;
    for (const scenario of cases) {
      if (await shouldStop()) {
        execution = stopExecution(
          execution,
          {
            kind: "infrastructure",
            code: "harness_maintenance",
            message:
              "Stopped at a case boundary to repair test infrastructure; paid-request records are preserved.",
          },
          gateway.snapshot(),
        );
        await writeJson(executionPath, execution);
        break;
      }
      const target = path.join(runDir, "cases", scenario.id, "result.json");
      const existing = await readJson(target);
      if (
        mode === "resume" &&
        existing &&
        (["passed", "unreviewed"].includes(existing.status) ||
          (conversationOnly &&
            existing.transcript?.some(
              (turn) => turn.kind === "correction" && turn.role === "assistant",
            )))
      ) {
        execution = finishCaseExecution(execution, existing, gateway.snapshot());
        await writeJson(executionPath, execution);
        continue;
      }
      if (existing) {
        const archiveStamp = Date.now();
        const archive = path.join(
          runDir,
          "cases",
          scenario.id,
          `result-before-${archiveStamp}.json`,
        );
        await writeJson(archive, existing);
        const previousReview = await readJson(path.join(runDir, "reviews", `${scenario.id}.json`));
        if (previousReview)
          await writeJson(
            path.join(runDir, "reviews", `${scenario.id}-before-${archiveStamp}.json`),
            previousReview,
          );
      }
      console.log(
        JSON.stringify({ event: "case_start", id: scenario.id, persona: scenario.persona, phase }),
      );
      const account =
        environment.accounts[scenario.persona] ||
        environment.accounts.find?.((item) => item.persona === scenario.persona);
      if (!account) throw new Error(`Missing isolated account for ${scenario.persona}`);
      const ledgerBefore = gateway.snapshot();
      let currentContext = { caseId: scenario.id, turnId: "authentication" };
      const observed = await runBrowserCase({
        scenario,
        baseUrl: environment.baseUrl,
        account,
        runDir,
        setContext: (context) => {
          currentContext = context;
          gateway.setContext({ ...context, phase });
        },
        databaseCounts: environment.databaseCounts,
        shouldStop,
        onProgress: async (result) => {
          execution = checkpointExecution(execution, result, gateway.snapshot(), currentContext);
          await writeJson(executionPath, execution);
        },
        headless: !argv.includes("--headed"),
        conversationOnly,
      });
      const result = adjudicateCampaignCase(observed, {
        ledgerBefore,
        ledgerAfter: gateway.snapshot(),
      });
      const currentDiff = execFileSync("git", ["diff", "--binary", "HEAD"], {
        cwd: repoRoot,
        maxBuffer: 16 * 1024 * 1024,
      });
      result.sourceSnapshot = {
        commit: execFileSync("git", ["rev-parse", "HEAD"], {
          cwd: repoRoot,
          encoding: "utf8",
        }).trim(),
        diffSha256: createHash("sha256").update(currentDiff).digest("hex"),
      };
      await writeJson(target, result);
      if (result.attemptId)
        await writeJson(
          path.join(
            runDir,
            "cases",
            scenario.id,
            "attempts",
            result.attemptId,
            "adjudicated-result.json",
          ),
          result,
        );
      const balance = gateway.snapshot();
      await writeJson(path.join(runDir, "ledger.json"), balance);
      console.log(
        JSON.stringify({
          event: "case_finished",
          id: scenario.id,
          status: result.status,
          stage: result.stage,
          failure: result.failure,
          spentUsd: balance.spentUsd,
          reservedUsd: balance.reservedUsd,
        }),
      );
      // The reduced conversation pass can collect the completed replies despite
      // an already documented premium-extraction block. Incomplete conversations
      // and generation runs retain the two-failure circuit breaker.
      const completedConversation = conversationOnly && result.stage === "conversation_review";
      const monetaryStop = campaignStopReason(result, { before: ledgerBefore, after: balance });
      if (
        monetaryStop &&
        !(
          completedConversation &&
          budgetPolicy === "strict" &&
          monetaryStop.kind === "campaign_budget"
        )
      ) {
        execution = stopExecution(execution, monetaryStop, balance);
        await writeJson(executionPath, execution);
        await report(manifest);
        console.log(JSON.stringify({ event: "campaign_stopped", ...execution }));
        break;
      }
      execution = finishCaseExecution(execution, result, balance);
      if (result.executionClassification === "infrastructure") infrastructureFailures++;
      else infrastructureFailures = 0;
      if (infrastructureFailures >= 2)
        execution = stopExecution(
          execution,
          {
            kind: "infrastructure",
            code: "repeated_infrastructure_failure",
            message:
              result.failure || "Two consecutive infrastructure failures prevented full testing.",
          },
          balance,
        );
      await writeJson(executionPath, execution);
      await report(manifest);
      if (execution.status === "stopped") break;
    }
    if (execution.status === "running") {
      execution = {
        ...execution,
        status: "completed",
        stoppedAt: new Date().toISOString(),
        stopReason: {
          kind: "completed",
          code: "selected_queue_attempted",
          message:
            "The selected queue was attempted. Individual case reviews determine passes; batch completion is not a quality verdict.",
        },
      };
      await writeJson(executionPath, execution);
    }
  } catch (error) {
    if (execution) {
      execution = stopExecution(
        execution,
        { kind: "infrastructure", code: error.code || "runner_error", message: error.message },
        gateway.snapshot(),
      );
      await writeJson(executionPath, execution);
    }
    throw error;
  } finally {
    const cleanupErrors = [];
    if (server && server.exitCode === null) {
      // Terminate only this known process tree; leave the user's other dev server intact.
      try {
        if (process.platform === "win32")
          execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
        else server.kill("SIGTERM");
      } catch (error) {
        cleanupErrors.push(`Server cleanup: ${error.message}`);
      }
    }
    for (const cleanup of [
      () => serverLog?.close(),
      () => environment?.shutdown(),
      () => writeJson(path.join(runDir, "ledger.json"), gateway.snapshot()),
      () => gateway.close(),
    ]) {
      try {
        await cleanup();
      } catch (error) {
        cleanupErrors.push(error.message);
      }
    }
    if (cleanupErrors.length) {
      await writeJson(path.join(runDir, "cleanup-errors.json"), cleanupErrors);
      console.error(JSON.stringify({ cleanupErrors }));
    }
    await report(manifest);
  }
}

const manifest = await initialize();
if (mode === "offline") await offline(manifest);
else if (mode === "run" || mode === "resume") await run(manifest);
await report(manifest);
