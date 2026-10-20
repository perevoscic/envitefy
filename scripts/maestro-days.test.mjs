import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  beginDay,
  classifyDraftGuestResponse,
  compareSource,
  dayAccounts,
  daySelection,
  dayStatus,
  editProposal,
  eventSnapshot,
  existingActivity,
  unfinishedDays,
  verifyDay4Draft,
  verifyPersistence,
} from "./lib/maestro-days.mjs";

test("Days 1–4 select eleven accounts and reject deferred QA11 and invalid days", () => {
  assert.equal(dayAccounts().length, 11);
  assert(!dayAccounts().includes("QA11"));
  assert(dayAccounts().includes("QA12"));
  assert.throws(() => dayAccounts("QA11"), /deferred/);
  assert.throws(() => dayAccounts("QA13"), /Unknown/);
  assert.throws(() => dayAccounts(""), /empty/);
  assert.deepEqual(daySelection("3,1"), [1, 3]);
  assert.deepEqual(daySelection("3,4"), [3, 4]);
  for (const value of ["", "0", "1,1", "5", "1,wat"]) assert.throws(() => daySelection(value));
});

test("anonymous draft checks require explicit denial and detect leaked wording even in script data", () => {
  const input = {
    status: 200,
    url: "https://envitefy.com/event/test-draft",
    title: "Private test title",
    description: "Private test note",
    html: "<h1>Event unavailable</h1><p>This event was deleted</p>",
  };
  assert.equal(classifyDraftGuestResponse(input).accessDenied, true);
  assert.equal(
    classifyDraftGuestResponse({ ...input, html: "<p>Loading</p>" }).accessDenied,
    false,
  );
  assert.equal(classifyDraftGuestResponse({ ...input, status: 500 }).accessDenied, false);
  assert.equal(
    classifyDraftGuestResponse({
      ...input,
      html: `${input.html}<script>Private test title</script>`,
    }).titleVisible,
    true,
  );
  assert.equal(
    classifyDraftGuestResponse({ ...input, html: `${input.html}<p>Private test note</p>` })
      .descriptionVisible,
    true,
  );
});

test("fact review compares instants and retains unknown fields without inventing results", () => {
  const expected = {
    start: "2026-10-30T13:00:00-05:00",
    end: "2026-10-30T14:00:00-05:00",
    timezone: "America/Chicago",
    location: "Online",
    website: "https://example.com/qa05",
  };
  const saved = {
    title: "Invitefy QA05 Test Workshop",
    start: "2026-10-30T23:00:00Z",
    end: "2026-10-31T00:00:00Z",
    timezone: "America/Chicago",
    location: "Online",
    website: null,
  };
  const comparison = compareSource("QA05", expected, saved);
  assert.deepEqual(comparison.mismatches, ["title", "start", "end"]);
  assert.deepEqual(comparison.unverified, ["website"]);
  assert.equal(comparison.causeStatus, "unconfirmed");
  assert.equal(
    compareSource("QA05", expected, { ...saved, start: "2026-10-30T18:00:00Z" }).fields.start
      .matches,
    true,
  );
});

test("Day 3 needs actual save and reopen evidence on the same event, owner, link and facts", () => {
  const baseline = {
    id: "one",
    ownerId: "owner",
    publicSlug: "qa12",
    title: "Workshop",
    description: "Original",
    start: "start",
    end: "end",
    timezone: "zone",
  };
  const proposal = editProposal("QA12", baseline);
  const saved = { ...baseline, description: proposal.description };
  const evidence = { saveUiPassed: true, reopenUiPassed: true, reopenedRoute: true };
  assert.equal(verifyPersistence(baseline, saved, proposal.description, evidence).verified, true);
  for (const key of Object.keys(evidence))
    assert.equal(
      verifyPersistence(baseline, saved, proposal.description, { ...evidence, [key]: false })
        .verified,
      false,
    );
  for (const key of [
    "id",
    "ownerId",
    "publicSlug",
    "title",
    "start",
    "end",
    "timezone",
    "location",
    "website",
    "createdVia",
  ])
    assert.equal(
      verifyPersistence(baseline, { ...saved, [key]: "changed" }, proposal.description, evidence)
        .verified,
      false,
    );
  assert.equal(editProposal("QA12", saved).description, proposal.description);
});

test("Day 4 requires a private owned saved draft, matching preview and actual UI evidence", () => {
  const expected = {
    eventId: "draft-one",
    ownerId: "owner",
    title: "QA12 Day 4 Preview",
    description: "Private draft",
  };
  const row = {
    id: expected.eventId,
    user_id: expected.ownerId,
    title: expected.title,
    data: {
      status: "draft",
      manualEditor: {
        snapshot: { data: { title: expected.title, details: expected.description } },
      },
    },
  };
  const evidence = {
    saveUiPassed: true,
    previewUiPassed: true,
    previewTitle: true,
    previewDescription: true,
    editorMatchesDraft: true,
    anonymousDraftVisible: false,
  };
  assert.equal(verifyDay4Draft(row, expected, evidence).verified, true);
  assert.equal(verifyDay4Draft({ ...row, user_id: "other" }, expected, evidence).verified, false);
  assert.equal(
    verifyDay4Draft({ ...row, id: "published-workshop" }, expected, evidence).verified,
    false,
  );
  assert.equal(
    verifyDay4Draft({ ...row, data: { ...row.data, status: "published" } }, expected, evidence)
      .verified,
    false,
  );
  for (const key of [
    "saveUiPassed",
    "previewUiPassed",
    "previewTitle",
    "previewDescription",
    "editorMatchesDraft",
  ])
    assert.equal(verifyDay4Draft(row, expected, { ...evidence, [key]: false }).verified, false);
  assert.equal(
    verifyDay4Draft(row, expected, { ...evidence, anonymousDraftVisible: true }).verified,
    false,
  );
});

test("fact review reads the deployed scan's online location and URL from saved OCR facts", () => {
  const saved = eventSnapshot({
    title: "Envitefy QA12 Test Workshop",
    data: {
      startISO: "2026-10-30T18:00:00Z",
      endISO: "2026-10-30T19:00:00Z",
      timezone: "America/Chicago",
      ocrFacts: [
        { label: "Online event", value: "Online event" },
        { label: "Online event URL", value: "https://example.com/qa12" },
      ],
    },
  });
  const comparison = compareSource(
    "QA12",
    {
      start: saved.start,
      end: saved.end,
      timezone: saved.timezone,
      location: "Online",
      website: "https://example.com/qa12",
    },
    saved,
  );
  assert.deepEqual(comparison.mismatches, []);
  assert.deepEqual(comparison.unverified, []);
});

test("resuming Day 3 retains completed technical checks and confirmed Day 2 findings", () => {
  const state = {
    days: {
      1: { status: "technical_checks_passed" },
      2: { status: "confirmed_source_mismatch" },
      3: { status: "incomplete_verification" },
    },
  };
  assert.deepEqual(unfinishedDays(state), [3]);
  assert.equal(state.days[1].status, "technical_checks_passed");
  assert.equal(state.days[2].status, "confirmed_source_mismatch");
  beginDay(state, 2);
  state.days[2] = { status: "incomplete_verification" };
  assert.equal(dayStatus(state, 2), "confirmed_source_mismatch; latest retry incomplete");
  assert.equal(state.lastCompletedDays[2].status, "confirmed_source_mismatch");
});

test("existing uploads resume from one verified run; ambiguous runs stop instead of creating duplicates", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "envitefy-days-"));
  try {
    const add = async (stamp) => {
      const dir = path.join(root, `activity-QA01-${stamp}`);
      await mkdir(dir);
      await writeFile(path.join(dir, "state.json"), JSON.stringify({ account: "QA01" }));
      await writeFile(
        path.join(dir, "created-event.json"),
        JSON.stringify({
          account: { id: "owner" },
          event: { ownerId: "owner" },
          eventId: "event",
          checks: { ownerMatches: true },
        }),
      );
      await writeFile(path.join(dir, "snap-input.png"), "source fixture");
    };
    await assert.rejects(() => existingActivity(root, "QA01"), /found 0/);
    await add(1);
    assert.equal((await existingActivity(root, "QA01")).sourceDigest.length, 64);
    await add(2);
    await assert.rejects(() => existingActivity(root, "QA01"), /found 2/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
