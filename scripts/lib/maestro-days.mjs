import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DEFERRED_ACCOUNTS, selectScenarios } from "./maestro-core.mjs";

export const DAY_TASKS = [
  {
    day: 1,
    task: "Confirm Play installation, sign in and explore Profile/dashboard.",
    humanTask: "Confirm your closed-test opt-in and report any onboarding confusion.",
    humanSteps: [
      "Join the supplied closed-test link with your own Google account; save dated tester-screen evidence and confirm the track with the organizer.",
      "Install or update Envitefy through Google Play. Record your device, Android and app version, then sign in normally.",
      "Find the dashboard and Profile. Record what was unclear and the actual time of your session.",
    ],
  },
  {
    day: 2,
    task: "Review the existing uploaded flyer against saved title, date, times, timezone, location and website.",
    humanTask: "Compare the original with the saved result and describe any correction needed.",
    humanSteps: [
      "Use Upload file with a clearly named test flyer. If your test event already exists, reopen that upload instead of creating a duplicate.",
      "Compare the title, date, start/end times, timezone, location and website with the source. Save expected/observed values before correcting anything.",
      "Report any mismatch with the event link and evidence. Camera capture is unavailable in the emulator round.",
    ],
  },
  {
    day: 3,
    task: "Edit a test detail, explicitly save, close and reopen the same event.",
    humanTask: "Report whether saving and finding the event again were clear.",
    humanSteps: [
      "Open your saved test event, change a small description detail and choose the explicit Save action.",
      "Close and reopen the app. Find the same event in My Events and confirm the change persisted while its other facts stayed intact.",
      "If you cannot find Edit or Save, record the exact screen and stop that step. Submit actual feedback with your session time; do not fill future dates.",
    ],
  },
  {
    day: 4,
    task: "Save a private test draft, reopen it and inspect its guest preview.",
    humanTask: "Review wording, readability and any visible required-field guidance.",
    humanSteps: [
      "Use your existing Day 4 draft, or create one clearly named private test draft for this case.",
      "Save explicitly, reopen the same draft, and inspect its guest preview on your device.",
      "Record wording/layout problems and visible guidance. Do not publish the draft or send invitations during this step.",
    ],
  },
];

export function daySelection(value = "1,2,3") {
  const days = value.split(",").map(Number);
  if (
    !days.length ||
    days.some((day) => ![1, 2, 3, 4].includes(day)) ||
    new Set(days).size !== days.length
  )
    throw new Error("Use distinct days from 1,2,3,4.");
  return days.sort();
}

export function dayAccounts(value) {
  if (value === "") throw new Error("Account selection cannot be empty.");
  const scenarios = selectScenarios(value ? value.split(",") : undefined);
  if (scenarios.some((item) => DEFERRED_ACCOUNTS.has(item.account)))
    throw new Error("QA11 is deferred by the owner; Days 1–4 do not select it.");
  return scenarios.map((item) => item.account);
}

export async function existingActivity(root, account) {
  const candidates = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !new RegExp(`^activity-${account}-[0-9]+$`).test(entry.name))
      continue;
    try {
      const state = JSON.parse(await readFile(path.join(root, entry.name, "state.json"), "utf8"));
      const event = JSON.parse(
        await readFile(path.join(root, entry.name, "created-event.json"), "utf8"),
      );
      const alias = typeof state.account === "string" ? state.account : state.account?.id;
      const eventAlias =
        typeof event.account === "string"
          ? event.account
          : event.account?.id && event.account.id === event.event?.ownerId
            ? alias
            : null;
      if (
        alias === account &&
        eventAlias === account &&
        event.eventId &&
        event.checks?.ownerMatches === true
      )
        candidates.push({ runId: entry.name, state, event });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  if (candidates.length !== 1)
    throw new Error(
      account +
        ": expected one existing verified workshop run, found " +
        candidates.length +
        "; inspect history before any new upload.",
    );
  const activity = candidates[0];
  const bytes = await readFile(path.join(root, activity.runId, "snap-input.png"));
  activity.sourceDigest = createHash("sha256").update(bytes).digest("hex");
  return activity;
}

export function eventSnapshot(row) {
  return {
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    publicSlug: row.public_slug,
    description: row.data?.description || "",
    start: row.data?.startISO || null,
    end: row.data?.endISO || null,
    timezone: row.data?.timezone || null,
    location: row.data?.location || null,
    website: row.data?.url || row.data?.website || null,
    createdVia: row.data?.createdVia || null,
    ocrFacts: Array.isArray(row.data?.ocrFacts)
      ? row.data.ocrFacts
          .filter((fact) => /^(online event|online event url)$/i.test(fact?.label || ""))
          .map((fact) => ({ label: fact.label, value: fact.value }))
      : [],
  };
}

export function compareSource(account, expected, saved) {
  const compareDate = (actual, target) =>
    Number.isFinite(Date.parse(actual)) && Number.isFinite(Date.parse(target))
      ? Date.parse(actual) === Date.parse(target)
      : null;
  const fact = (label) => saved.ocrFacts?.find((item) => item.label.toLowerCase() === label)?.value;
  const location =
    (typeof saved.location === "string" ? saved.location : saved.location?.name) ||
    fact("online event");
  const fields = {
    title: { expected: `Envitefy ${account} Test Workshop`, actual: saved.title },
    start: { expected: expected.start, actual: saved.start },
    end: { expected: expected.end, actual: saved.end },
    timezone: { expected: expected.timezone, actual: saved.timezone },
    location: { expected: expected.location, actual: location || null },
    website: {
      expected: expected.website,
      actual: saved.website || fact("online event url") || null,
    },
  };
  for (const [key, field] of Object.entries(fields))
    field.matches = ["start", "end"].includes(key)
      ? compareDate(field.actual, field.expected)
      : field.actual == null
        ? null
        : field.actual === field.expected;
  if (
    /^online(?: event)?$/i.test(fields.location.actual || "") &&
    /^online(?: event)?$/i.test(fields.location.expected || "")
  )
    fields.location.matches = true;
  return {
    fields,
    mismatches: Object.keys(fields).filter((key) => fields[key].matches === false),
    unverified: Object.keys(fields).filter((key) => fields[key].matches === null),
    causeStatus: "unconfirmed",
    note: "Saved/source comparisons do not establish where a transformation occurred.",
  };
}

export function editProposal(account, baseline) {
  const marker = `[Envitefy ${account} Day 3 persistence check]`;
  return {
    marker,
    description: baseline.description.includes(marker)
      ? baseline.description
      : baseline.description + (baseline.description ? "\n\n" : "") + marker,
  };
}

export function verifyPersistence(baseline, saved, expectedDescription, evidence) {
  const checks = {
    sameEvent: saved.id === baseline.id,
    sameOwner: saved.ownerId === baseline.ownerId,
    samePublicLink: saved.publicSlug === baseline.publicSlug,
    descriptionSaved: saved.description === expectedDescription,
    titlePreserved: saved.title === baseline.title,
    datesPreserved: ["start", "end", "timezone"].every((key) => saved[key] === baseline[key]),
    locationPreserved: JSON.stringify(saved.location) === JSON.stringify(baseline.location),
    websitePreserved: saved.website === baseline.website,
    formatPreserved: saved.createdVia === baseline.createdVia,
    saveUiPassed: evidence.saveUiPassed === true,
    reopenUiPassed: evidence.reopenUiPassed === true,
    reopenedRoute: evidence.reopenedRoute === true,
  };
  return { checks, verified: Object.values(checks).every(Boolean) };
}

export function verifyDay4Draft(row, expected, evidence) {
  const fields = row.data?.manualEditor?.snapshot?.data || {};
  const checks = {
    sameDraft: row.id === expected.eventId,
    ownerMatches: row.user_id === expected.ownerId,
    stillDraft: row.data?.status === "draft",
    titleSaved: row.title === expected.title && fields.title === expected.title,
    descriptionSaved: fields.details === expected.description,
    explicitSave: evidence.saveUiPassed === true,
    reopenedPreview: evidence.previewUiPassed === true,
    previewTitle: evidence.previewTitle === true,
    previewDescription: evidence.previewDescription === true,
    editorMatchesDraft: evidence.editorMatchesDraft === true,
    guestAccessPrivate: evidence.anonymousDraftVisible === false,
  };
  return { checks, verified: Object.values(checks).every(Boolean) };
}

export function classifyDraftGuestResponse({ status, url, html, title, description }) {
  const finalUrl = new URL(url);
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const titleVisible = html.includes(title);
  const descriptionVisible = html.includes(description);
  const unavailableNotice =
    status === 200 && /Event unavailable/i.test(text) && /This event was deleted/i.test(text);
  const accessDenied =
    [401, 403, 404].includes(status) ||
    (finalUrl.origin === "https://envitefy.com" &&
      /^\/(?:login|signin|sign-in)(?:\/|$)/.test(finalUrl.pathname)) ||
    unavailableNotice;
  return {
    url: finalUrl.origin + finalUrl.pathname,
    status,
    usedAuthentication: false,
    titleVisible,
    descriptionVisible,
    accessDenied,
    unavailableNotice,
    denialMessage: unavailableNotice ? "Event unavailable — This event was deleted" : null,
  };
}

export function unfinishedDays(state) {
  return [1, 2, 3, ...(state.days[4] ? [4] : [])].filter(
    (day) => !state.days[day] || state.days[day].status === "incomplete_verification",
  );
}

export function beginDay(state, day) {
  state.lastCompletedDays ||= {};
  state.dayHistory ||= [];
  const previous = state.days[day];
  if (previous) {
    state.dayHistory.push({ day, ...previous });
    if (
      ["technical_checks_passed", "verified", "confirmed_source_mismatch"].includes(previous.status)
    )
      state.lastCompletedDays[day] = previous;
  }
  state.days[day] = { status: "running", startedAt: new Date().toISOString() };
}

export function dayStatus(state, day) {
  const latest = state.days[day]?.status;
  const completed = state.lastCompletedDays?.[day]?.status;
  return latest === "incomplete_verification" && completed
    ? `${completed}; latest retry incomplete`
    : latest || "prepared; not executed";
}

export async function writeDaysIndex(root) {
  const sessions = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^days-QA\d{2}-\d+$/.test(entry.name)) continue;
    try {
      sessions.push(
        JSON.parse(await readFile(path.join(root, entry.name, "session.json"), "utf8")),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const rows = dayAccounts().map((account) => {
    const session = sessions
      .filter((item) => item.account === account)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
    return {
      account,
      runId: session?.runId || null,
      enrollment: "unverified",
      days: Object.fromEntries(
        [1, 2, 3, 4].map((day) => [
          day,
          session ? dayStatus(session, day) : "prepared; not executed",
        ]),
      ),
      interruption: session?.pendingInterruption || session?.interruption || null,
    };
  });
  const escapeStatusHtml = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s],
    );
  const body = rows
    .map(
      (row) =>
        '<tr><th><a href="' +
        (row.runId ? `${row.runId}/report.html` : `${row.account}-tasks.json`) +
        '">' +
        row.account +
        "</a></th>" +
        [1, 2, 3, 4].map((day) => `<td>${escapeStatusHtml(row.days[day])}</td>`).join("") +
        "<td>Unverified</td></tr>",
    )
    .join("");
  const humanGuide = DAY_TASKS.map(
    (task) =>
      "<h3>Day " +
      task.day +
      "</h3><ol>" +
      task.humanSteps.map((step) => `<li>${escapeStatusHtml(step)}</li>`).join("") +
      "</ol>",
  ).join("");
  await writeFile(
    path.join(root, "index.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sessionType: "maestro_automation",
        deferredAccounts: ["QA11"],
        accounts: rows,
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(root, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Envitefy Days 1–4</title><style>body{font:16px system-ui;max-width:1100px;margin:36px auto;padding:0 20px}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}table{border-collapse:collapse}a{color:#5b21b6}</style><h1>Envitefy — Days 1–4</h1><p>Automated engineering evidence. Prepared tasks have not run. Human participation, feedback and closed-test continuity require separate evidence. QA11 is deferred.</p><table><tr><th>Account</th><th>Day 1</th><th>Day 2</th><th>Day 3</th><th>Day 4</th><th>Enrollment</th></tr>${body}</table><h2>Human tester checklist</h2><p>Use your own Google account and record actual sessions separately. Return for these tasks on the intended testing days; this guide does not schedule activity.</p>${humanGuide}<p><a href="../session-template.json">Session template</a> · <a href="../feedback-template.json">Feedback template</a></p><p><a href="index.json">Detailed status</a> · <a href="../enrollment-register.json">Enrollment register</a></p>`,
  );
}
