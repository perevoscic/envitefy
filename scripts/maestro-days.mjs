import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs, parseEnv } from "node:util";
import { chromium, request } from "playwright";
import { inspectAndroid } from "./lib/maestro-android.mjs";
import {
  contained,
  maestroCommand,
  ROOT,
  redact,
  runProcess,
  scrubArtifacts,
} from "./lib/maestro-core.mjs";
import {
  beginDay,
  classifyDraftGuestResponse,
  compareSource,
  DAY_TASKS,
  dayAccounts,
  daySelection,
  dayStatus,
  editProposal,
  eventSnapshot,
  existingActivity,
  unfinishedDays,
  verifyDay4Draft,
  verifyPersistence,
  writeDaysIndex,
} from "./lib/maestro-days.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";

const { values: options } = parseArgs({
  options: {
    help: { type: "boolean" },
    execute: { type: "boolean" },
    accounts: { type: "string" },
    days: { type: "string", default: "1,2,3" },
    resume: { type: "string" },
    "switch-account": { type: "boolean" },
  },
  strict: true,
  allowPositionals: false,
});
if (options.help) {
  console.log(
    "node scripts/maestro-days.mjs [--accounts QA01,QA12] [--days 1,2,3,4] [--execute] [--resume days-QA12-<timestamp>]",
  );
  console.log(
    "Default: prepare private manifests from existing evidence, without app actions. Execute uses the current account or normal existing-account login; it never signs out all Google sessions or provisions users.",
  );
  process.exit(0);
}
const accounts = dayAccounts(options.accounts);
const days = daySelection(options.days);
const execute = options.execute;
const resumeId = options.resume;
if (
  resumeId &&
  (accounts.length !== 1 || !new RegExp(`^days-${accounts[0]}-[0-9]+$`).test(resumeId))
)
  throw new Error("--resume must belong to one explicitly selected account.");
const root = path.join(ROOT, "output/maestro");
const output = path.join(root, "closed-test/days-1-3");
await mkdir(output, { recursive: true });
const json = async (file, value) => writeFile(file, JSON.stringify(value, null, 2));
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s],
  );
const manifests = [];
for (const account of accounts) {
  const activity = await existingActivity(root, account);
  const manifest = {
    account,
    preparedAt: new Date().toISOString(),
    sessionType: "maestro_automation",
    sourceRunId: activity.runId,
    eventId: activity.event.eventId,
    eventUrl: activity.event.url,
    sourceFile: `${activity.runId}/snap-input.png`,
    sourceDigest: activity.sourceDigest,
    previousEvidenceCheckedAt: activity.event.checkedAt,
    historicalFindings: activity.event.checks,
    days: DAY_TASKS.filter((task) => days.includes(task.day)).map((task) => ({
      ...task,
      status: "prepared",
    })),
    enrollment: { status: "unverified", humanParticipation: "unverified", qualifyingOptInAt: null },
    camera: "unavailable; Upload file only",
    note: "Prepared tasks and historical evidence are not new sessions or evidence of human participation.",
  };
  manifests.push(manifest);
  await json(path.join(output, `${account}-tasks.json`), manifest);
}
await json(path.join(output, "prepared.json"), {
  preparedAt: new Date().toISOString(),
  accounts: manifests,
});
if (!execute) {
  await writeDaysIndex(output);
  console.log(
    "Prepared Days 1–4 for " +
      accounts.join(", ") +
      ". No app actions or enrollment changes. " +
      output,
  );
  process.exit(0);
}

const values = {
  ...parseEnv(await readFile(path.join(ROOT, ".env.maestro.local"), "utf8")),
  ...process.env,
};
const serial = values.MAESTRO_ANDROID_SERIAL || "emulator-5556";
const adb =
  process.env.MAESTRO_ADB_BIN ||
  path.join(
    process.env.ANDROID_HOME ||
      path.join(process.env.USERPROFILE || "", "AppData/Local/Android/Sdk"),
    "platform-tools/adb.exe",
  );
const results = [];
for (const manifest of manifests) {
  const account = manifest.account;
  const email = values[`MAESTRO_${account}_EMAIL`];
  const password = values[`MAESTRO_${account}_PASSWORD`];
  if (!email || !password) throw new Error(`${account}: supplied account variables are missing.`);
  const runId = resumeId || `days-${account}-${Date.now()}`;
  const dir = contained(output, runId);
  await mkdir(dir, { recursive: true });
  let state;
  try {
    state = await readJson(path.join(dir, "session.json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  state ||= {
    runId,
    account,
    sessionType: "maestro_automation",
    startedAt: new Date().toISOString(),
    eventId: manifest.eventId,
    sourceRunId: manifest.sourceRunId,
    uiHierarchy: "Maestro Android WebView DevTools hierarchy",
    enrollmentStatus: "unverified",
    days: {},
    attempts: [],
  };
  if (
    state.account !== account ||
    state.eventId !== manifest.eventId ||
    state.sourceRunId !== manifest.sourceRunId
  )
    throw new Error("Resume checkpoint does not match the account and saved event.");
  delete state.interruption;
  const save = () => json(path.join(dir, "session.json"), state);
  const journal = (event) =>
    appendFileSync(
      path.join(dir, "journal.jsonl"),
      `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`,
    );
  let release;
  let browser;
  let currentDay;
  await save();
  try {
    release = await acquireAndroidUiLock(serial, { runId, account, kind: "days-1-3" });
    state.device = await inspectAndroid({
      androidAppId: "com.envitefy.app",
      androidSerial: serial,
    });
    const forward = await runProcess(
      adb,
      ["-s", serial, "forward", "tcp:9223", "localabstract:chrome_devtools_remote"],
      { timeoutMs: 15000 },
    );
    if (forward.exitCode !== 0) throw new Error("Chrome diagnostic forwarding failed.");
    browser = await chromium.connectOverCDP("http://127.0.0.1:9223", { timeout: 15000 });
    const appPage = () =>
      browser
        .contexts()
        .flatMap((context) => context.pages())
        .reverse()
        .find((page) => page.url().startsWith("https://envitefy.com/"));
    const session = async () => {
      const page = appPage();
      if (!page) return null;
      const response = await page.request.get("https://envitefy.com/api/auth/session", {
        timeout: 15000,
      });
      if (!response.ok()) throw new Error(`Session check HTTP ${response.status()}`);
      return response.json();
    };
    const checkIdentity = async () => {
      const user = (await session())?.user;
      if (!user?.id || user.email?.toLowerCase() !== email.toLowerCase())
        throw new Error(
          "The active Envitefy account does not match " +
            account +
            "; no event edit or upload is attempted.",
        );
      return user.id;
    };
    const readEvent = async () => {
      const ownerId = await checkIdentity();
      const response = await appPage().request.get(
        `https://envitefy.com/api/history/${encodeURIComponent(manifest.eventId)}`,
        { timeout: 30000 },
      );
      if (!response.ok()) throw new Error(`Saved-event check HTTP ${response.status()}`);
      const row = await response.json();
      if (row.id !== manifest.eventId || row.user_id !== ownerId)
        throw new Error("Saved-event identity/owner mismatch; stop before editing.");
      return eventSnapshot(row);
    };
    const cleanUrl = (url) => {
      try {
        const parsed = new URL(url);
        return parsed.origin + parsed.pathname;
      } catch {
        return "[URL unavailable]";
      }
    };
    const attach = (page) => {
      page.on("pageerror", (error) => {
        if (page.url().startsWith("https://envitefy.com/"))
          journal({
            event: "page_error",
            url: cleanUrl(page.url()),
            message: redact(error.message, [password]),
          });
      });
      page.on("response", (response) => {
        if (response.url().startsWith("https://envitefy.com/api/"))
          journal({
            event: "response",
            url: cleanUrl(response.url()),
            method: response.request().method(),
            status: response.status(),
          });
      });
      page.on("requestfailed", (request) => {
        if (request.url().startsWith("https://envitefy.com/"))
          journal({
            event: "request_failed",
            url: cleanUrl(request.url()),
            message: request.failure()?.errorText,
          });
      });
    };
    for (const context of browser.contexts()) {
      context.pages().forEach(attach);
      context.on("page", attach);
    }
    const ui = async (flow, extra = {}) => {
      const attempt = `${String(state.attempts.length + 1).padStart(2, "0")}-${flow}-${Date.now()}`;
      const target = path.join(dir, attempt);
      await mkdir(target);
      const source = await readFile(path.join(ROOT, `.maestro/android/days/${flow}.yaml`));
      await writeFile(path.join(target, "flow.yaml"), source);
      let helperDigest;
      if (flow === "00-switch-account") {
        const helper = await readFile(
          path.join(ROOT, ".maestro/android/days/00-existing-signin.yaml"),
        );
        await writeFile(path.join(target, "00-existing-signin.yaml"), helper);
        helperDigest = createHash("sha256").update(helper).digest("hex");
      }
      const entry = {
        flow,
        artifactDir: attempt,
        startedAt: new Date().toISOString(),
        status: "running",
        sourceDigest: createHash("sha256").update(source).digest("hex"),
        ...(helperDigest ? { helperDigest } : {}),
      };
      state.attempts.push(entry);
      await save();
      journal({ event: "ui_started", flow, attempt });
      const command = await maestroCommand();
      const result = await runProcess(
        command.binary,
        [
          "--device",
          serial,
          "test",
          "--no-ansi",
          "--format",
          "JUNIT",
          "--output",
          path.join(target, "junit.xml"),
          "--test-output-dir",
          target,
          "--debug-output",
          target,
          path.join(target, "flow.yaml"),
        ],
        {
          env: {
            ...command.env,
            MAESTRO_ACCOUNT: account,
            MAESTRO_EMAIL_PATTERN: email.replace(/[$.*+?^{}()|[\]\\]/g, "\\$&"),
            MAESTRO_SAVED_EVENT_URL: manifest.eventUrl,
            ...extra,
          },
          timeoutMs: 240000,
          secrets: [password],
          onOutput: (chunk) => appendFileSync(path.join(target, "console.log"), chunk),
        },
      );
      Object.assign(entry, {
        endedAt: new Date().toISOString(),
        status: result.exitCode === 0 ? "passed" : "incomplete_verification",
        timedOut: result.timedOut,
      });
      await save();
      journal({ event: "ui_finished", flow, attempt, status: entry.status });
      if (result.exitCode !== 0) {
        try {
          const observed = await appPage()?.evaluate(() => ({
            route: location.pathname,
            headings: [...document.querySelectorAll("h1,h2")].map((element) => element.textContent),
            controls: [...document.querySelectorAll("button,a,input,textarea")]
              .filter((element) => element.getClientRects().length)
              .map((element) => ({
                tag: element.tagName,
                label: (element.getAttribute("aria-label") || element.textContent || "").slice(
                  0,
                  160,
                ),
              })),
          }));
          await json(path.join(target, "observed-controls.json"), {
            checkedAt: new Date().toISOString(),
            ...observed,
          });
        } catch (diagnosticError) {
          journal({
            event: "control_diagnostic_unavailable",
            flow,
            message: diagnosticError.message,
          });
        }
        const error = new Error(
          flow +
            (result.timedOut
              ? " exceeded 240000ms"
              : " did not complete; inspect console, hierarchy and screenshots") +
            "; this alone does not establish an app defect.",
        );
        error.classification = "incomplete_verification";
        throw error;
      }
      return entry;
    };
    const beforeSession = await session();
    if (
      beforeSession?.user?.email &&
      beforeSession.user.email.toLowerCase() !== email.toLowerCase()
    )
      if (options["switch-account"]) {
        await ui("00-switch-account");
        await checkIdentity();
      } else {
        throw new Error(
          "Another Envitefy account is signed in. Select " +
            account +
            " through normal existing-account login before resuming; no broad Google sign-out is performed.",
        );
      }
    if (!beforeSession?.user?.email && options["switch-account"]) {
      await ui("00-existing-signin");
      await checkIdentity();
    }
    for (const day of days) {
      currentDay = day;
      beginDay(state, day);
      await save();
      if (day === 1) {
        await ui("01-signin-explore");
        await checkIdentity();
        state.days[day] = {
          status: "technical_checks_passed",
          checkedAt: new Date().toISOString(),
          enrollment: "unverified",
          humanFeedback: "not_collected",
          note: "Play installation and account UI verified; closed-track enrollment/continuity require separate evidence.",
        };
      }
      if (day === 2) {
        await checkIdentity();
        await ui("02-review-upload");
        const saved = await readEvent();
        const activity = await existingActivity(root, account);
        const comparison = compareSource(account, activity.state.expected, saved);
        const original = await appPage().request.get(
          `https://envitefy.com/api/events/${encodeURIComponent(manifest.eventId)}/original`,
          { timeout: 30000 },
        );
        const originalCheck = {
          status: original.status(),
          contentType: original.headers()["content-type"],
          bytes: original.ok() ? (await original.body()).length : null,
        };
        originalCheck.passed =
          originalCheck.status === 200 &&
          /^(image\/|application\/pdf)/i.test(originalCheck.contentType || "") &&
          originalCheck.bytes > 100;
        const evidenceFile = `day-2-fact-comparison-${Date.now()}.json`;
        await json(path.join(dir, evidenceFile), {
          checkedAt: new Date().toISOString(),
          source: manifest.sourceFile,
          sourceDigest: manifest.sourceDigest,
          upload: {
            action: "reused_existing_upload",
            sourceRunId: manifest.sourceRunId,
            originalUploadAt: activity.event.event.createdAt,
          },
          saved,
          comparison,
          originalCheck,
        });
        state.days[day] = {
          status: comparison.mismatches.length
            ? "confirmed_source_mismatch"
            : comparison.unverified.length
              ? "incomplete_verification"
              : "verified",
          checkedAt: new Date().toISOString(),
          mismatches: comparison.mismatches,
          unverified: comparison.unverified,
          originalDocumentVerified: originalCheck.passed,
          originalCheck,
          evidence: evidenceFile,
          note: "No additional upload or new event was created.",
        };
      }
      if (day === 3) {
        const current = await readEvent();
        let baseline;
        try {
          baseline = await readJson(path.join(dir, "day-3-baseline.json"));
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          baseline = current;
          await writeFile(
            path.join(dir, "day-3-baseline.json"),
            JSON.stringify(baseline, null, 2),
            { flag: "wx" },
          );
        }
        const proposal = editProposal(account, baseline);
        if (
          current.description !== baseline.description &&
          current.description !== proposal.description
        )
          throw new Error(
            "The event description changed outside this checkpoint; review it before editing.",
          );
        let saveUiPassed = state.attempts.some(
          (item) => item.flow === "03-save-details" && item.status === "passed",
        );
        if (!saveUiPassed) {
          if (current.description === proposal.description)
            throw new Error(
              "The marker exists without this run's passing Save evidence; inspect prior attempts before repeating a write.",
            );
          await ui("03-open-editor");
          await checkIdentity();
          // Read-only inspection gates the write; it never changes a DOM field.
          const editor = await appPage().evaluate(() => ({
            description: [...document.querySelectorAll("input,textarea")].some((element) => {
              if (element.disabled || element.readOnly || !element.getClientRects().length)
                return false;
              const labels = [...(element.labels || [])]
                .map((label) => label.textContent)
                .join(" ");
              return /description/i.test(`${labels} ${element.getAttribute("aria-label")}`);
            }),
            save: [...document.querySelectorAll("button")].some((button) =>
              /^(save changes|save event|save)$/i.test(button.textContent.trim()),
            ),
            route: location.pathname,
            headings: [...document.querySelectorAll("h1,h2")].map((element) => element.textContent),
          }));
          await json(path.join(dir, "day-3-editor-controls.json"), editor);
          if (!editor.description || !editor.save) {
            const error = new Error(
              "The observed editor exposes no editable Description field and Save control. Day 3 save/reopen is unverified; inspect day-3-editor-controls.json and the screenshot.",
            );
            error.classification = "incomplete_verification";
            throw error;
          }
          await ui("03-save-details", { MAESTRO_DAY3_DESCRIPTION: proposal.description });
          saveUiPassed = true;
        }
        await ui("03-reopen");
        const after = await readEvent();
        const observed = new URL(appPage().url());
        const expected = new URL(manifest.eventUrl);
        const verified = verifyPersistence(baseline, after, proposal.description, {
          saveUiPassed,
          reopenUiPassed: true,
          reopenedRoute:
            observed.origin + observed.pathname === expected.origin + expected.pathname,
        });
        await json(path.join(dir, "day-3-persistence.json"), {
          checkedAt: new Date().toISOString(),
          baseline,
          after,
          ...verified,
        });
        state.days[day] = {
          status: verified.verified ? "verified" : "incomplete_verification",
          evidence: "day-3-persistence.json",
          checks: verified.checks,
        };
      }
      if (day === 4) {
        const ownerId = await checkIdentity();
        const title = `Envitefy ${account} Day 4 Preview`;
        const description = `Private ${account} draft for wording and guest preview testing. No guests will be invited.`;
        const findDraft = async () => {
          await checkIdentity();
          const response = await appPage().request.get(
            "https://envitefy.com/api/history?view=full&time=all&limit=200&refresh=1",
            { timeout: 30000 },
          );
          if (!response.ok()) throw new Error(`Day 4 history check HTTP ${response.status()}`);
          const history = await response.json();
          if (!Array.isArray(history.items) || history.diagnostics?.degradedReason)
            throw new Error("Day 4 history is unavailable or degraded; no new draft is created.");
          const matches = history.items.filter((item) => item.title === title);
          if (matches.length > 1)
            throw new Error("Multiple Day 4 drafts match; inspect them before any write.");
          if (!matches.length) {
            if (state.day4EventId)
              throw new Error(
                "The saved Day 4 draft is missing from history; no replacement is created.",
              );
            return null;
          }
          const detail = await appPage().request.get(
            `https://envitefy.com/api/history/${encodeURIComponent(matches[0].id)}`,
            { timeout: 30000 },
          );
          if (!detail.ok()) throw new Error(`Day 4 draft check HTTP ${detail.status()}`);
          const row = await detail.json();
          if (row.user_id !== ownerId || row.data?.status !== "draft")
            throw new Error(
              "The matching Day 4 record is not an owned private draft; it is not changed.",
            );
          if (state.day4EventId && row.id !== state.day4EventId)
            throw new Error("Day 4 identity changed; stop before editing.");
          return row;
        };
        const existing = await findDraft();
        if (existing && existing.data?.manualEditor?.snapshot?.data?.details !== description)
          throw new Error(
            "Existing Day 4 draft wording differs; inspect it before changing the draft.",
          );
        let editorUrl =
          "https://envitefy.com/event/general/customize?templateId=coffee-conversation";
        if (existing) {
          state.day4EventId = existing.id;
          editorUrl += `&edit=${encodeURIComponent(existing.id)}`;
        }
        state.day4 = {
          ...state.day4,
          title,
          description,
          editorUrl,
          status: "editing",
          startedAt: new Date().toISOString(),
        };
        await save();
        const flowEnv = {
          MAESTRO_DAY4_NEW: existing ? "false" : "true",
          MAESTRO_DAY4_EDITOR_URL: editorUrl,
          MAESTRO_DAY4_TITLE: title,
          MAESTRO_DAY4_DESCRIPTION: description,
        };
        await ui("04-open-draft", flowEnv);
        await checkIdentity();
        await ui("04-save-draft", flowEnv);
        const saved = await findDraft();
        if (!saved)
          throw new Error("Save completed in the UI but no matching Day 4 draft was found.");
        state.day4EventId = saved.id;
        state.day4.status = "saved";
        state.day4.savedAt = new Date().toISOString();
        state.day4.editorUrl = `https://envitefy.com/event/general/customize?templateId=coffee-conversation&edit=${encodeURIComponent(saved.id)}`;
        await save();
        await ui("04-preview-draft", { ...flowEnv, MAESTRO_DAY4_EDITOR_URL: state.day4.editorUrl });
        const after = await findDraft();
        const preview = await appPage().evaluate(
          ({ title, description }) => ({
            titlePresent: document.body.innerText.includes(title),
            descriptionPresent: document.body.innerText.includes(description),
            editorId: new URL(location.href).searchParams.get("edit"),
            route: location.pathname,
            viewportWidth: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            mobileEditing: document
              .querySelector("[data-event-page-editor]")
              ?.getAttribute("data-mobile-editing"),
            invalidFields: document.querySelectorAll('[aria-invalid="true"]').length,
          }),
          { title, description },
        );
        const guest = await request.newContext();
        let guestCheck;
        try {
          const url = `https://envitefy.com/event/${encodeURIComponent(after.public_slug || after.id)}`;
          const response = await guest.get(url, { timeout: 30000 });
          guestCheck = classifyDraftGuestResponse({
            url: response.url(),
            status: response.status(),
            html: await response.text(),
            title,
            description,
          });
        } finally {
          await guest.dispose();
        }
        const result = verifyDay4Draft(
          after,
          { eventId: saved.id, ownerId, title, description },
          {
            saveUiPassed: true,
            previewUiPassed: true,
            previewTitle: preview.titlePresent,
            previewDescription: preview.descriptionPresent,
            editorMatchesDraft: preview.editorId === saved.id,
            anonymousDraftVisible:
              guestCheck.titleVisible || guestCheck.descriptionVisible
                ? true
                : guestCheck.accessDenied
                  ? false
                  : null,
          },
        );
        const evidenceFile = `day-4-draft-preview-${Date.now()}.json`;
        await json(path.join(dir, evidenceFile), {
          checkedAt: new Date().toISOString(),
          eventId: saved.id,
          expected: { eventId: saved.id, ownerId, title, description, status: "draft" },
          actual: {
            eventId: after.id,
            ownerId: after.user_id,
            title: after.title,
            description: after.data?.manualEditor?.snapshot?.data?.details ?? null,
            status: after.data.status,
          },
          ownerMatches: after.user_id === ownerId,
          title: after.title,
          status: after.data.status,
          preview,
          guestCheck,
          ...result,
          limitations: [
            "Publication validation is not exercised by saving a private draft.",
            "Screenshots support visual review; no automatic usability score is claimed.",
          ],
        });
        state.day4.status = result.verified ? "verified" : "incomplete_verification";
        state.days[day] = {
          status: state.day4.status,
          checkedAt: new Date().toISOString(),
          eventId: saved.id,
          evidence: evidenceFile,
          checks: result.checks,
        };
      }
      journal({ event: "day_finished", day, result: state.days[day] });
      if (
        ["technical_checks_passed", "verified", "confirmed_source_mismatch"].includes(
          state.days[day].status,
        )
      ) {
        state.lastCompletedDays[day] = state.days[day];
      }
      await save();
    }
  } catch (error) {
    state.interruption = {
      checkedAt: new Date().toISOString(),
      day: currentDay || null,
      classification: error.classification || "tool_or_access_failure",
      message: redact(error.message, [password]),
      causeStatus: "unconfirmed",
    };
    if (currentDay)
      state.days[currentDay] = {
        ...state.days[currentDay],
        status: "incomplete_verification",
        interruption: state.interruption,
      };
    journal({ event: "interrupted", ...state.interruption });
    console.error(`${account}: ${state.interruption.message}`);
  } finally {
    const errors = await runProcess(
      adb,
      [
        "-s",
        serial,
        "logcat",
        "-d",
        "-t",
        "300",
        "-v",
        "threadtime",
        "-s",
        "AndroidRuntime:E",
        "chromium:E",
      ],
      { timeoutMs: 10000, secrets: [password] },
    );
    await writeFile(
      path.join(dir, "android-errors.log"),
      redact(errors.output, [password]).replace(/https?:\/\/[^\s"<>]+/g, (url) => {
        try {
          const u = new URL(url);
          return u.origin + u.pathname;
        } catch {
          return "[URL omitted]";
        }
      }),
    );
    state.androidErrorCapture = {
      status: errors.exitCode === 0 ? "captured" : "unavailable",
      timedOut: errors.timedOut,
      scope: "Bounded device log; may include earlier sessions.",
    };
    state.endedAt = new Date().toISOString();
    state.pendingInterruption =
      Object.values(state.days).find(
        (day) => day.status === "incomplete_verification" && day.interruption,
      )?.interruption || null;
    const remainingDays = unfinishedDays(state);
    state.resumeCommand =
      "node scripts/maestro-days.mjs --execute --accounts " +
      account +
      " --days " +
      (remainingDays.length ? remainingDays : days).join(",") +
      " --resume " +
      runId;
    await save();
    await scrubArtifacts(dir, [password]);
    const rows = [1, 2, 3, 4]
      .map((day) => `<tr><td>${day}</td><td>${escapeHtml(dayStatus(state, day))}</td></tr>`)
      .join("");
    await writeFile(
      path.join(dir, "report.html"),
      '<!doctype html><meta charset="utf-8"><title>Days 1–4 ' +
        account +
        "</title><style>body{font:16px system-ui;max-width:960px;margin:40px auto;padding:0 20px}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}table{border-collapse:collapse}</style><h1>" +
        account +
        " — Days 1–4</h1><p>Automated engineering session. Human enrollment and feedback remain separate.</p><table><tr><th>Day</th><th>Observed result</th></tr>" +
        rows +
        "</table><p>" +
        escapeHtml(state.pendingInterruption?.message || state.interruption?.message || "") +
        '</p><p><a href="session.json">Session and resume checkpoint</a> · <a href="journal.jsonl">Journal</a> · <a href="android-errors.log">Android errors</a></p>',
    );
    release?.();
    results.push({
      account,
      runId,
      days: state.days,
      interruption: state.pendingInterruption || state.interruption || null,
      report: `${runId}/report.html`,
    });
    console.log(`${account} report: ${path.join(dir, "report.html")}`);
  }
}
await json(path.join(output, "latest-execution.json"), {
  generatedAt: new Date().toISOString(),
  sessionType: "maestro_automation",
  results,
});
await writeDaysIndex(output);
// Disconnect diagnostic clients by exiting; never close the Android user's Chrome session.
process.exit(results.some((result) => result.interruption) ? 1 : 0);
