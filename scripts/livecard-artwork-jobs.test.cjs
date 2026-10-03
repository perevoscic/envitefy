const { test } = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("./lib/event-messages-test-loader.cjs");

function harness(mode = "generate", initialState = "queued") {
  const row = { id: "job-1", owner_id: "owner", revision: "qa-revision", attempt: mode === "repair" ? 2 : 1, created_at: new Date().toISOString(), state: initialState, stage: "queued", form: { title: "Movie", headlineIntro: "You're invited" }, design: null, mode };
  let backgrounds = 0, lettering = 0, verification = 0;
  const query = async (sql, args) => {
    if (sql.startsWith("SELECT")) return { rows: args[1] === row.owner_id ? [{ ...row }] : [] };
    if (sql.includes("SET state='running'")) {
      if (row.state !== "queued" || args[1] !== row.owner_id) return { rows: [] };
      row.state = "running"; return { rows: [{ ...row }] };
    }
    if (sql.includes("SET stage=")) { if (row.state === "running") row.stage = args[2]; }
    else if (sql.includes("SET design=")) { if (row.state === "running") row.design = JSON.parse(args[2]); }
    else if (sql.includes("SET state='ready'")) { if (row.state === "running") { row.state = "ready"; row.design = JSON.parse(args[2]); } }
    else if (sql.includes("state=CASE")) { row.state = row.state === "cancel_requested" ? "stopped" : "failed"; row.error = args[2]; }
    return { rows: [] };
  };
  const api = loadTs("src/lib/livecard-artwork-jobs.ts", {
    "./db": { query },
    "./livecard-builder": { sharedCardDesignKey: () => "design" },
    "./shared-card-generation": { generateSharedCard: async (_form, signal, stage) => { await stage("generating"); signal.throwIfAborted(); backgrounds++; return { backgroundUrl: "original" }; } },
    "./shared-card-headline": { generateCardHeadline: async (_form, _design, signal, stage, verify) => { await stage(verify ? "checking" : "lettering"); signal.throwIfAborted(); if (verify) verification++; else lettering++; return { imageUrl: "candidate", validation: { status: "failed", issues: ["missing_copy"] } }; } },
  });
  return { api, row, counts: () => ({ backgrounds, lettering, verification }) };
}

test("durable claim prevents duplicate dispatch from reconnect and checker rejection", async () => {
  const h = harness();
  await Promise.all([h.api.runArtworkJob("owner", "job-1"), h.api.runArtworkJob("owner", "job-1")]);
  await h.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(h.counts(), { backgrounds: 1, lettering: 1, verification: 0 });
  assert.equal(h.row.state, "ready");
  assert.equal(h.row.design.headline.validation.status, "failed");
});

test("verification and explicit wording repair reuse the saved background", async () => {
  for (const mode of ["verify", "repair"]) {
    const h = harness(mode); h.row.design = { backgroundUrl: "original", headline: { imageUrl: "same" } };
    await h.api.runArtworkJob("owner", "job-1");
    assert.deepEqual(h.counts(), { backgrounds: 0, lettering: mode === "repair" ? 1 : 0, verification: mode === "verify" ? 1 : 0 });
  }
});

test("explicit background alternative reuses compatible lettering with zero new lettering requests", async () => {
  const h = harness("background");
  h.row.design = { backgroundUrl: "old", headline: { title: "Movie", intro: "You're invited", layerUrl: "layer", layout: { left: 12, top: 27, width: 40, height: 40, canvasWidth: 100, canvasHeight: 150 }, imageUrl: "selected" } };
  h.api.artworkJobDeps.references = async () => [{ data: Buffer.from("asset").toString("base64") }];
  h.api.artworkJobDeps.compose = async () => ({ composite: Buffer.from("new composite"), layout: { left: 12, top: 27, width: 40, height: 40, canvasWidth: 100, canvasHeight: 150 } });
  await h.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(h.counts(), { backgrounds: 1, lettering: 0, verification: 1 });
  assert.equal(h.row.state, "ready");
  const stale = harness("background"); stale.row.design = { backgroundUrl: "old", headline: { title: "Earlier words", intro: "", layerUrl: "layer" } };
  await stale.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(stale.counts(), { backgrounds: 0, lettering: 0, verification: 0 });
});

test("explicit cancellation of queued work dispatches no provider requests", async () => {
  const h = harness("generate", "cancel_requested");
  await h.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(h.counts(), { backgrounds: 0, lettering: 0, verification: 0 });
});

test("cancellation immediately before completion prevents the active-asset commit", async () => {
  const h = harness();
  h.api.artworkJobDeps.headline = async () => { h.row.state = "cancel_requested"; return { imageUrl: "late" }; };
  await h.api.runArtworkJob("owner", "job-1");
  assert.equal(h.row.state, "stopped");
  assert.equal(h.row.design.headline, undefined);
});

test("cancellation after background stops queued lettering and a running ambiguous job is not replayed", async () => {
  const h = harness();
  h.api.artworkJobDeps.background = async () => { h.row.state = "cancel_requested"; return { backgroundUrl: "late" }; };
  await h.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(h.counts(), { backgrounds: 0, lettering: 0, verification: 0 });
  assert.equal(h.row.state, "stopped");
  const ambiguous = harness("generate", "running");
  await ambiguous.api.runArtworkJob("owner", "job-1");
  assert.deepEqual(ambiguous.counts(), { backgrounds: 0, lettering: 0, verification: 0 });
});
