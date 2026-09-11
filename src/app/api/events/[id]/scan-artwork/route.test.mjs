import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { resolveSavedScanPersonalization } from "../../../../../lib/ocr/personalization.ts";
import { normalizeScanArtwork } from "../../../../../lib/ocr/scan-artwork-state.ts";
import { resolveScanMediaPolicy } from "../../../../../lib/ocr/scan-media.ts";

function harness(userId, ownerId = "owner", status = "ready", title = "ENT appointment", data = {}) {
  const h = { mutations: [], jobs: [], calls: [] };
  const row = {
    id: "event",
    user_id: ownerId,
    title,
    data: {
      createdVia: "ocr",
      scanArtwork: status
        ? {
            version: 1,
            status,
            imageUrl: status === "ready" ? "https://example.com/background.webp" : undefined,
            heroImageUrl: status === "ready" ? "https://example.com/hero.webp" : undefined,
          }
        : undefined,
      ...data,
    },
  };
  const mocks = {
    "next-auth": { getServerSession: async () => ({}) },
    "next/server": { NextResponse: Response, after: (job) => h.jobs.push(job) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/lib/db": {
      getEventHistoryById: async () => row,
      query: async (...args) => {
        h.mutations.push(args);
        return { rows: [] };
      },
    },
    "@/lib/ocr/scan-artwork": { generateSavedScanArtwork: async (...args) => h.calls.push(args) },
    "@/lib/ocr/scan-artwork-state": { normalizeScanArtwork },
    "@/lib/ocr/personalization": { resolveSavedScanPersonalization },
    "@/lib/ocr/scan-media": { resolveScanMediaPolicy },
    "next/cache": { revalidatePath: () => {} },
    "@/lib/history-cache": { invalidateUserHistory: () => {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => {} },
  };
  const compiled = ts.transpileModule(
    readFileSync(new URL("./route.ts", import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: (name) => mocks[name] });
  return Object.assign(h, module.exports, {
    context: { params: Promise.resolve({ id: "event" }) },
  });
}

test("only the owner can inspect or retry artwork", async () => {
  for (const [user, expected] of [
    [null, 401],
    ["other", 404],
  ]) {
    const h = harness(user);
    assert.equal((await h.GET(null, h.context)).status, expected);
    assert.equal((await h.POST(null, h.context)).status, expected);
    assert.equal((await h.PATCH(null, h.context)).status, expected);
    assert.equal(h.jobs.length, 0);
    assert.equal(h.mutations.length, 0);
  }
});

test("flyer generation preserves the original and accepts a ready background without a hero", async () => {
  const h = harness("owner", "owner", null, "Wedding invitation", { scanSourceKind: "designed" });
  await h.POST(null, h.context);
  assert.equal(JSON.parse(h.mutations[0][1][2]), "original");
  assert.equal(h.jobs.length, 1);
  const ready = harness("owner", "owner", "ready", "Wedding invitation", {
    scanSourceKind: "designed",
    scanArtwork: { version: 1, status: "ready", imageUrl: "https://example.com/background.webp" },
  });
  const response = await ready.POST(null, ready.context);
  assert.equal((await response.json()).artwork.status, "ready");
  assert.equal(ready.jobs.length, 0);
  assert.equal(ready.mutations.length, 1);
  const request = new Request("https://envitefy.test/artwork", {
    method: "PATCH", body: JSON.stringify({ heroMode: "generated" }),
  });
  assert.equal((await ready.PATCH(request, ready.context)).status, 400);
});
test("status reads and already-ready artwork never regenerate", async () => {
  const h = harness("owner");
  const response = await h.GET(null, h.context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).artwork.status, "ready");
  await h.POST(null, h.context);
  assert.equal(h.jobs.length, 0);
  assert.equal(h.mutations.length, 1);
});
test("retry publishes pending state before starting background work", async () => {
  const h = harness("owner", "owner", "failed");
  const response = await h.POST(null, h.context);
  assert.equal((await response.json()).artwork.status, "pending");
  assert.equal(h.mutations.length, 2);
  assert.equal(h.calls.length, 0);
  await h.jobs[0]();
  assert.deepEqual(h.calls[0], ["event", "owner", true]);
});
test("existing scans initialize artwork only after the owner requests it", async () => {
  const h = harness("owner", "owner", null);
  await h.GET(null, h.context);
  assert.equal(h.mutations.length, 0);
  assert.equal(h.jobs.length, 0);
  assert.equal((await h.POST(null, h.context)).status, 202);
  assert.equal(h.mutations.length, 2);
  assert.equal(h.jobs.length, 1);
});

test("artwork selection preserves the source and rejects original medical heroes", async () => {
  const request = (heroMode) =>
    new Request("https://envitefy.test/artwork", {
      method: "PATCH",
      body: JSON.stringify({ heroMode }),
    });
  const medical = harness("owner");
  assert.equal((await medical.PATCH(request("original"), medical.context)).status, 400);
  assert.equal(medical.mutations.length, 0);
  const invitation = harness("owner", "owner", "ready", "Birthday party");
  assert.equal((await invitation.PATCH(request("original"), invitation.context)).status, 200);
  assert.match(invitation.mutations[0][0], /scanHeroMode/);
  assert.doesNotMatch(invitation.mutations[0][0], /attachment|DELETE/i);
  const missing = harness("owner", "owner", null, "Birthday party");
  assert.equal((await missing.PATCH(request("generated"), missing.context)).status, 409);
});
