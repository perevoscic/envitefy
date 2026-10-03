const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./lib/event-messages-test-loader.cjs");

function route(generate) {
  return loadTs("src/app/api/livecard-builder/headline/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/livecard-api-access": { builderApiAccess: async () => null },
    "@/lib/livecard-builder": { readLiveCardForm: () => ({ title: "Graduation" }), validateLiveCard: () => ({}) },
    "@/lib/shared-card-design": { readSharedCardDesign: () => ({ backgroundUrl: "background" }) },
    "@/lib/shared-card-headline": { generateCardHeadline: generate },
    "@/lib/livecard-generation-failure": { liveCardGenerationErrorResponse: () => ({ error: "Lettering unavailable", code: "verification_unavailable" }) },
  });
}

function request(stream = true) {
  return new Request("https://envitefy.com/api/livecard-builder/headline", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: stream ? "application/x-ndjson" : "application/json" }, body: "{}",
  });
}

test("checking status precedes the finished headline, while JSON callers remain compatible", async () => {
  const headline = { title: "Graduation", imageUrl: "data:image/webp;base64,test" };
  const api = route(async (_form, _design, _signal, onStage) => { onStage?.("checking"); return headline; });
  const response = await api.POST(request());
  assert.match(response.headers.get("content-type"), /application\/x-ndjson/);
  assert.deepEqual((await response.text()).trim().split("\n").map(JSON.parse), [{ stage: "checking" }, { headline }]);
  assert.deepEqual(await (await api.POST(request(false))).json(), { headline });
});

test("failed verification streams a specific failure without a fabricated correction stage", async () => {
  const api = route(async () => { throw new Error("Unavailable"); });
  const response = await api.POST(request());
  assert.deepEqual((await response.text()).trim().split("\n").map(JSON.parse), [{ error: "Lettering unavailable", code: "verification_unavailable" }]);
});

test("cancelling the response aborts the pending image work and cannot start a repair", async () => {
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  let signal;
  let aborted;
  const stopped = new Promise((resolve) => { aborted = resolve; });
  const api = route(async (_form, _design, generationSignal, onRepair) => {
    signal = generationSignal;
    started();
    await new Promise((resolve) => generationSignal.addEventListener("abort", resolve, { once: true }));
    aborted();
    generationSignal.throwIfAborted();
    onRepair?.();
  });
  const response = await api.POST(request());
  await ready;
  await response.body.cancel();
  await stopped;
  assert.equal(signal.aborted, true);
});
