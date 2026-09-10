import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as personal from "./personalization.ts";
import * as ticket from "./scan-artwork-ticket.ts";
import * as media from "./scan-media.ts";

const require = createRequire(import.meta.url);
const profile = personal.buildScanPersonalization({
  title: "ENT appointment",
  personAge: 7,
  personName: "Maya",
});
const priorSecret = process.env.NEXTAUTH_SECRET;
process.env.NEXTAUTH_SECRET = "test-only-scan-artwork-signing-secret";
test.after(() => {
  if (priorSecret === undefined) delete process.env.NEXTAUTH_SECRET;
  else process.env.NEXTAUTH_SECRET = priorSecret;
});
function load(file, mocks, extra = {}) {
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: (name) => mocks[name] || require(name),
    Buffer,
    AbortController,
    AbortSignal,
    console,
    ...extra,
  });
  return module.exports;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function harness() {
  const rendering = deferred();
  const h = { rendered: [], reads: [], published: [], row: null, clock: Date.now() };
  class Clock extends Date {
    static now() {
      return h.clock;
    }
  }
  const early = load(
    "./scan-artwork-early.ts",
    {
      "@/lib/db": {
        query: async (sql, args) => {
          h.reads.push({ sql, args });
          return { rows: h.row ? [h.row] : [] };
        },
      },
      "./personalization": personal,
      "./scan-artwork-ticket": ticket,
      "./scan-media": media,
      "./scan-artwork": {
        finishClaimedScanArtwork: async (...args) => {
          h.published.push(args);
        },
      },
      "./scan-artwork-render": {
        ScanArtworkRenderError: Error,
        renderScanArtwork: (...args) => {
          h.rendered.push(args);
          return rendering.promise;
        },
      },
      "node:timers/promises": {
        setTimeout: async (ms) => {
          h.clock += ms;
        },
      },
    },
    { Date: Clock },
  );
  const saved = load("./scan-artwork.ts", {
    "next/cache": {},
    "@/lib/db": {},
    "@/lib/dashboard-cache": {},
    "@/lib/history-cache": {},
    "@/lib/media-upload": {},
    "./personalization": personal,
    "./scan-media": media,
    "./scan-artwork-ticket": ticket,
    "./scan-artwork-render": {},
  });
  return Object.assign(h, early, saved, {
    start: (overrides = {}) =>
      early.startEarlyScanArtwork({
        userId: "owner",
        scanAttemptId: "scan-1",
        title: "ENT appointment",
        sourceKind: "paperwork",
        profile,
        ...overrides,
      }),
    complete: () =>
      rendering.resolve({
        background: Buffer.from("webp-background"),
        hero: Buffer.from("webp-hero"),
      }),
    fail: () => rendering.reject(new Error("provider failure")),
    save: (work, changes = {}) => {
      const data = {
        createdVia: "ocr",
        title: "ENT appointment",
        scanSourceKind: "paperwork",
        scanPersonalization: profile,
        ...changes,
      };
      saved.prepareSavedScanArtwork(data);
      const eventId = saved.adoptEarlyScanArtwork(data, "owner", work.ticket);
      h.row = {
        artwork: data.scanArtwork,
        profile: data.scanPersonalization,
        hero_mode: data.scanHeroMode,
      };
      return { eventId, data };
    },
  });
}

test("starts before remaining scan work; a save on another worker adopts the same images", async () => {
  const h = harness();
  const work = h.start();
  assert.ok(work);
  assert.equal(
    h.rendered.length,
    1,
    "generation starts synchronously, without awaiting OCR's remaining work",
  );
  assert.equal(h.rendered[0][0].personFirstName, null);
  assert.equal(h.reads.length, 0);
  assert.equal(h.published.length, 0, "no generated asset is stored before save");
  const { eventId } = h.save(work);
  assert.ok(eventId, "save uses signed ticket, not another worker's memory");
  h.complete();
  await work.done;
  assert.equal(h.published.length, 1);
  assert.equal(h.published[0][0], eventId);
  assert.equal(h.published[0][1], "owner");
  assert.equal(h.published[0][3].hero.toString(), "webp-hero");
  assert.equal(h.rendered.length, 1, "save never launches a second pair");
  assert.deepEqual(Array.from(h.reads[0].args), [eventId, "owner"]);
});

test("a repeated scan joins the running pair; speculative work is bounded", async () => {
  const h = harness();
  const work = h.start();
  assert.equal(h.start(), work);
  assert.equal(h.start({ scanAttemptId: "scan-2" }), null);
  const rest = ["owner2", "owner3", "owner4"].map((userId) => h.start({ userId }));
  assert.equal(h.start({ userId: "owner5" }), null);
  for (const job of [work, ...rest]) job.cancel();
  h.complete();
  await Promise.all([work, ...rest].map((job) => job.done));
  assert.equal(h.published.length, 0);
});

test("abandoned scans expire in memory without creating a row or uploading artwork", async () => {
  const h = harness();
  const work = h.start();
  h.complete();
  await work.done;
  assert.equal(h.published.length, 0);
  assert.ok(h.clock >= Date.now() + ticket.EARLY_ARTWORK_LIFETIME_MS - 1000);
  assert.ok(h.reads.length <= 61);
  assert.ok(h.reads.every(({ sql }) => sql.startsWith("SELECT ")));
  const next = h.start({ scanAttemptId: "scan-2" });
  assert.ok(next, "expired work releases its slot");
  next.cancel();
  await next.done;
});

test("failure is isolated from the scan and the saved event receives a retryable state", async () => {
  const h = harness();
  const work = h.start();
  h.save(work);
  h.fail();
  await work.done;
  assert.equal(h.published.length, 1);
  assert.equal(h.published[0][3], null);
});

test("a replaced claim or changed brief cannot be overwritten by late artwork", async () => {
  for (const change of ["token", "brief"]) {
    const h = harness();
    const work = h.start();
    h.save(work);
    if (change === "token") h.row.artwork.token = "replacement";
    else h.row.profile = { ...profile, age: 19 };
    h.complete();
    await work.done;
    if (change === "token") assert.equal(h.published.length, 0);
    else assert.equal(h.published[0][3], null, "reject artwork for an outdated age/subject");
  }
});

test("anonymous, designed invitations, and ambiguous scans wait for the normal save path", () => {
  const h = harness();
  assert.equal(h.start({ userId: null }), null);
  assert.equal(
    h.start({
      title: "Birthday party",
      sourceKind: "designed",
      profile: personal.buildScanPersonalization({ title: "Birthday party" }),
    }),
    null,
  );
  assert.equal(
    h.start({ title: "Event", profile: personal.buildScanPersonalization({ title: "Event" }) }),
    null,
  );
  assert.equal(h.rendered.length, 0);
});

test("tickets reject forgery, wrong owners, expiry, and changed briefs; names are not in the brief", () => {
  const signed = ticket.createScanArtworkTicket("owner", profile);
  assert.ok(ticket.verifyScanArtworkTicket(signed.ticket, "owner", profile));
  assert.equal(ticket.verifyScanArtworkTicket(`${signed.ticket}x`, "owner", profile), null);
  assert.equal(ticket.verifyScanArtworkTicket(signed.ticket, "other-owner", profile), null);
  assert.equal(
    ticket.verifyScanArtworkTicket(signed.ticket, "owner", { ...profile, age: 18 }),
    null,
  );
  assert.ok(
    ticket.verifyScanArtworkTicket(signed.ticket, "owner", {
      ...profile,
      personFirstName: "Other",
    }),
  );
  assert.doesNotMatch(
    Buffer.from(signed.ticket.split(".")[0], "base64url").toString(),
    /Maya|ENT|appointment/,
  );
  const now = Date.now;
  try {
    Date.now = () => signed.claim.expiresAt + 1;
    assert.equal(ticket.verifyScanArtworkTicket(signed.ticket, "owner", profile), null);
  } finally {
    Date.now = now;
  }
});

test("hero/background generation and conversion overlap", async () => {
  const background = deferred(),
    hero = deferred();
  const calls = [],
    converted = [];
  const render = load("./scan-artwork-render.ts", {
    "./personalization": personal,
    "@/lib/studio/openai": {
      generateInvitationImageWithOpenAi: (_prompt, _refs, _product, options) => {
        calls.push(options);
        return options.size ? hero.promise : background.promise;
      },
    },
    "./artwork-webp": {
      encodeScanArtworkWebp: async (bytes) => {
        converted.push(bytes.toString());
        return bytes;
      },
    },
  });
  const work = render.renderScanArtwork(profile, "variation");
  assert.equal(calls.length, 2);
  background.resolve({ ok: true, imageDataUrl: "data:image/png;base64,YmFja2dyb3VuZA==" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(converted, ["background"], "conversion starts before the hero finishes");
  hero.resolve({ ok: true, imageDataUrl: "data:image/png;base64,aGVybw==" });
  const images = await work;
  assert.equal(images.hero.toString(), "hero");
});

test("history saves immediately with the signed reservation while artwork is still running", async () => {
  const h = harness();
  const work = h.start();
  const jobs = [],
    inserts = [];
  const invalidate = () => {};
  const route = load(
    "../../app/api/history/route.ts",
    {
      "@/lib/signup-mutations": {},
      "@/lib/event-draft-access": {},
      "next/server": { NextResponse: Response, after: (job) => jobs.push(job) },
      "next-auth": { getServerSession: async () => ({ user: { id: "owner" } }) },
      "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "owner" },
      "@/lib/ocr/scan-artwork": h,
      "@/lib/ocr/original-display-state": { prepareSavedScanDisplay: () => false },
      "@/lib/calendar-sync-background": { prepareScanCalendarSync: () => false },
      "@/lib/absolute-url": {},
      "@/lib/event-access": {},
      "@/lib/history-view": {},
      "@/lib/event-media": { findTransientEventMedia: () => [] },
      "@/lib/dashboard-cache": { invalidateUserDashboard: invalidate },
      "@/lib/history-cache": { invalidateUserHistory: invalidate },
      "@/lib/scan-attempts": { markScanAttemptSaved: async () => {} },
      "@/lib/db": {
        insertEventHistory: async (params) => {
          inserts.push(params);
          h.row = {
            artwork: params.data.scanArtwork,
            profile: params.data.scanPersonalization,
            hero_mode: params.data.scanHeroMode,
          };
          return {
            id: params.clientDraftId,
            user_id: params.userId,
            data: params.data,
            title: params.title,
          };
        },
      },
    },
    { process: { env: {} }, console: { log() {}, error() {} } },
  );
  const response = await route.POST(
    new Request("https://envitefy.test/api/history", {
      method: "POST",
      body: JSON.stringify({
        title: "ENT appointment",
        scanArtworkTicket: work.ticket,
        data: { createdVia: "ocr", scanSourceKind: "paperwork", scanPersonalization: profile },
      }),
    }),
  );
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.id, ticket.verifyScanArtworkTicket(work.ticket, "owner", profile).eventId);
  assert.equal(saved.data.scanArtwork.status, "generating");
  assert.equal(inserts.length, 1);
  assert.equal(jobs.length, 1);
  assert.equal(h.published.length, 0, "response arrives while generation is unresolved");
  h.complete();
  await work.done;
  assert.equal(h.published[0][0], saved.id);
});

test("direct scan save carries the ticket and overlaps location enrichment with source upload", async () => {
  const h = harness();
  const work = h.start();
  const place = deferred(),
    upload = deferred(),
    branchesStarted = deferred();
  const started = [],
    inserts = [],
    jobs = [];
  const data = {
    createdVia: "scan-event-page",
    scanPersonalization: profile,
    scanSourceKind: "paperwork",
  };
  const route = load(
    "../../app/api/scan/event-page/route.ts",
    {
      "next/server": { NextResponse: Response, after: (job) => jobs.push(job) },
      "next-auth": { getServerSession: async () => ({ user: { id: "owner" } }) },
      "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => "owner" },
      "@/lib/ocr/scan-artwork": h,
      "@/lib/ocr/original-display-state": { prepareSavedScanDisplay: () => false },
      "@/lib/ocr/personalization": personal,
      "@/lib/ocr/field-normalization": { normalizeOcrLocationFields: (value) => value },
      "@/lib/ocr/pipeline": {
        handleOcrRequest: async () =>
          Response.json({
            fieldsGuess: { title: "ENT appointment", scanPersonalization: profile },
            category: "Medical Appointments",
            scanArtworkTicket: work.ticket,
          }),
      },
      "@/lib/ocr/place-enrichment": {
        enrichOcrVenueAddress: () => {
          started.push("location");
          return place.promise;
        },
      },
      "@/lib/ocr/private-original": {
        processPrivateScanUpload: () => {
          started.push("private-original");
          branchesStarted.resolve();
          return upload.promise;
        },
      },
      "@/lib/media-upload": {
        processPublicUpload: () => {
          throw new Error("medical originals must stay private");
        },
      },
      "@/lib/scan-event-page": {
        buildScanEventPageHistoryPayload: () => ({
          data,
          title: "ENT appointment",
          ownership: "owned",
        }),
      },
      "@/lib/scan-attempts": {},
      "@/utils/event-url": { buildEventPath: (id) => `/event/${id}` },
      "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
      "@/lib/history-cache": { invalidateUserHistory() {} },
      "@/lib/db": {
        insertEventHistory: async (params) => {
          inserts.push(params);
          h.row = {
            artwork: params.data.scanArtwork,
            profile: params.data.scanPersonalization,
            hero_mode: params.data.scanHeroMode,
          };
          return {
            id: params.clientDraftId,
            user_id: params.userId,
            data: params.data,
            title: params.title,
          };
        },
      },
    },
    { Request, FormData, File, URL },
  );
  const form = new FormData();
  form.set("file", new File(["fixture"], "appointment.webp", { type: "image/webp" }));
  const saving = route.POST(
    new Request("https://envitefy.test/api/scan/event-page", { method: "POST", body: form }),
  );
  await Promise.race([
    branchesStarted.promise,
    saving.then(async (response) => {
      throw new Error(`Save returned before both branches started: ${response.status}`);
    }),
  ]);
  assert.deepEqual(started, ["location", "private-original"]);
  assert.equal(inserts.length, 0);
  place.resolve(null);
  upload.resolve({ eventMedia: {} });
  const response = await saving;
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(
    saved.eventId,
    ticket.verifyScanArtworkTicket(work.ticket, "owner", profile).eventId,
  );
  assert.equal(h.published.length, 0);
  h.complete();
  await work.done;
  assert.equal(h.published[0][0], saved.eventId);
});
