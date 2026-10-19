import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadSnapshotWriter(dependencies, functionName = "persistDiscoveryEventSnapshot") {
  const source = fs.readFileSync(new URL("./persist.ts", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("persist.ts", source, ts.ScriptTarget.Latest, true);
  const declaration = parsed.statements.find(node => node.name?.text === functionName);
  assert.ok(declaration);
  const compiled = ts.transpileModule(`${declaration.getText(parsed)}\nreturn ${functionName};`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function("exports", ...Object.keys(dependencies), compiled)({}, ...Object.values(dependencies));
}

function fixture() {
  let row = {
    id: "event-1", user_id: "owner-1", title: "Extracted meet",
    data: { title: "Extracted meet", venue: "Extracted venue", pageTemplateId: "airborne-atlas", status: "draft", draftStatus: "draft" },
  };
  let beforeMedia = async () => {};
  const writes = [];
  const persist = loadSnapshotWriter({
    getEventHistoryById: async () => structuredClone(row),
    safeString: value => typeof value === "string" ? value.trim() : "",
    resolveGymDiscoveryTemplateSelection: (current, requested) => current || requested || "airborne-atlas",
    resolveFootballDiscoveryTemplateSelection: () => null,
    buildDiscoveryPipelineSummary: ({ pipeline }) => ({ processingStage: pipeline.processingStage }),
    prepareEventHistoryData: value => value,
    storePublicEventMedia: async value => { await beforeMedia(); return value; },
    query: async (sql, [_id, serialized, expected, title]) => {
      // Model the database compare-and-set: another explicit save can change the
      // row while background media preparation is in flight.
      assert.match(sql, /WHERE id=\$1 AND data=\$3::jsonb/);
      writes.push({ expected: JSON.parse(expected), proposed: JSON.parse(serialized) });
      if (JSON.stringify(row.data) !== expected) return { rows: [] };
      row = { ...row, title, data: JSON.parse(serialized) };
      return { rows: [structuredClone(row)] };
    },
    invalidateUserHistory: () => {}, invalidateUserDashboard: () => {},
  });
  const snapshot = {
    workflow: "gymnastics", eventId: row.id, title: "Late extracted title", discoveryId: "discovery-1",
    builderDraft: { event: { title: "Late extracted title" }, venue: { venue: "Late extracted venue" } },
    publicArtifacts: { sections: {} }, pipeline: { processingStage: "review_ready" }, status: "review_ready",
    eventDataPatch: { details: "Late generated description" },
  };
  return { persist, snapshot, writes, read: () => row, save: value => { row = value; }, blockMedia: callback => { beforeMedia = callback; } };
}

test("an explicit host save while background completion is preparing media wins atomically", async () => {
  const state = fixture();
  let entered;
  const mediaEntered = new Promise(resolve => { entered = resolve; });
  let release;
  const mediaGate = new Promise(resolve => { release = resolve; });
  state.blockMedia(async () => { entered(); await mediaGate; });
  const background = state.persist(state.snapshot);
  await mediaEntered;
  const saved = {
    ...state.read(), title: "Host's approved title",
    data: {
      ...state.read().data, title: "Host's approved title", venue: "Host's venue", details: "Host's description",
      pageTemplateId: "neon-runway", passcodeRequired: true, passcode: "host-choice",
      manualEditor: { snapshot: { data: { title: "Host's approved title" } } }, status: "published", draftStatus: "published",
    },
  };
  state.save(structuredClone(saved));
  release();
  assert.equal(await background, null, "stale worker snapshot must fail its compare-and-set");
  assert.deepEqual(state.read(), saved, "the complete explicitly saved row stays intact");
  assert.equal(state.writes.length, 1);
  assert.equal(state.writes[0].proposed.title, "Late extracted title", "the test actually races an obsolete worker snapshot");
});

test("a host save already present before background completion retains authored data and publication", async () => {
  const state = fixture();
  const saved = {
    ...state.read(), title: "Saved title",
    data: {
      ...state.read().data, title: "Saved title", venue: "Saved venue", details: "Saved wording",
      templateEditor: { version: 1, values: { title: "Saved title" } }, status: "published", draftStatus: "published",
    },
  };
  state.save(structuredClone(saved));
  state.blockMedia(async () => { throw new Error("Existing host save must not prepare replacement media"); });
  const result = await state.persist(state.snapshot);
  assert.equal(result.title, saved.title);
  assert.deepEqual(result.data, { ...saved.data, pipelineSummary: { processingStage: "review_ready" } });
});

test("gymnastics snapshots persist inclusive date-only ranges and clear stale inferred clocks/zones", async () => {
  const state = fixture();
  state.save({ ...state.read(), data: { ...state.read().data, startISO: "2026-03-06T00:00:00Z", startAt: "2026-03-06T00:00:00Z", endISO: "2026-03-08T00:00:00Z", endAt: "2026-03-08T00:00:00Z", time: "00:00", endTime: "18:00", endDate: "2026-03-07", timezone: "America/Chicago" } });
  await state.persist({ ...state.snapshot, timezone: null, startISO: "2026-03-06", endISO: "2026-03-09", builderDraft: { event: { date: "2026-03-06", time: "", endDate: "2026-03-08", endTime: "", allDay: true, gymnasticsDateVersion: 1, timezone: null } } });
  const data = state.read().data;
  assert.equal(data.timezone, null);
  assert.equal(data.time, "");
  assert.equal(data.endTime, "");
  assert.equal(data.endDate, "2026-03-08");
  assert.equal(data.startISO, "2026-03-06");
  assert.equal(data.endISO, "2026-03-09");
  assert.equal(data.allDay, true);
  assert.equal(data.gymnasticsDateVersion, 1);
  await state.persist({ ...state.snapshot, timezone: null, startISO: null, endISO: null, builderDraft: { event: { time: "08:00", endDate: "", endTime: "", allDay: false, timezone: null } } });
  assert.equal(state.read().data.startISO, null);
  assert.equal(state.read().data.endISO, null);
  assert.equal(state.read().data.endDate, "");
});

test("a gymnastics discovery shell starts without an assumed timezone", () => {
  const shell = loadSnapshotWriter({
    resolveGymDiscoveryTemplateSelection: () => "airborne-atlas",
    buildEmptyGymBuilderDraft: () => ({}), buildEmptyGymPublicArtifacts: () => ({}),
    buildDiscoveryPipelineSummary: () => ({}),
  }, "buildDiscoveryShellEventData")({ workflow: "gymnastics", title: "Meet", discoveryId: "discovery-1", pipeline: {} });
  assert.equal(shell.timezone, null);
});
