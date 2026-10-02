const assert = require("node:assert/strict");
const { test } = require("node:test");
const loadTs = require("./lib/event-messages-test-loader.cjs");

function route(generate) {
  return loadTs("src/app/api/livecard-builder/design/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/livecard-api-access": { builderApiAccess: async () => null },
    "@/lib/livecard-builder": { readLiveCardForm: () => ({ title: "Science night" }), validateLiveCard: () => ({}) },
    "@/lib/shared-card-generation": { generateSharedCard: generate },
    "@/lib/livecard-generation-failure": { liveCardGenerationErrorResponse: () => ({ error: "Artwork unavailable", code: "generation_failed" }) },
  });
}
const request = (stream = true) => new Request("https://envitefy.com/api/livecard-builder/design", {
  method: "POST", headers: { "Content-Type": "application/json", Accept: stream ? "application/x-ndjson" : "application/json" }, body: '{"form":{}}',
});

test("design streams real stage boundaries and only returns a final design on completion", async () => {
  const design = { backgroundUrl: "data:image/webp;base64,test" };
  const api = route(async (_form, signal, stage) => {
    assert.equal(signal.aborted, false);
    for (const value of ["preparing", "generating", "checking", "encoding"]) stage?.(value);
    return design;
  });
  const response = await api.POST(request());
  assert.deepEqual((await response.text()).trim().split("\n").map(JSON.parse), [
    ...["preparing", "generating", "checking", "exporting"].map(stage => ({ type: "stage", stage })),
    { type: "complete", result: { design } },
  ]);
  assert.deepEqual(await (await api.POST(request(false))).json(), { design });
});

test("streamed design failure preserves its specific error code", async () => {
  const api = route(async () => { throw new Error("Provider failed"); });
  const response = await api.POST(request());
  assert.deepEqual((await response.text()).trim().split("\n").map(JSON.parse), [
    { type: "complete", result: { error: "Artwork unavailable", code: "generation_failed" } },
  ]);
});
