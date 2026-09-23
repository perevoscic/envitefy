import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function load(file, imports) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      process: { env: {} },
      Buffer,
      URL,
      console,
      require: (name) => imports[name] || {},
    },
  );
  return module.exports;
}

function setup({ signedIn = true, admin = false, existing = {}, ownerId = "owner" } = {}) {
  const session = signedIn ? { user: { id: "owner", email: "host@example.com" } } : null;
  let checks = 0;
  let writes = 0;
  let row = { id: "card", user_id: ownerId, data: existing };
  const updateData = async (_id, data) => {
    writes += 1;
    row = { ...row, data: { ...row.data, ...data } };
    return row;
  };
  const imports = {
    "next/server": {
      NextResponse: { json: (body, options = {}) => ({ body, status: options.status || 200 }) },
    },
    "next-auth": { getServerSession: async () => session },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => session?.user.id || null },
    "@/lib/db": {
      getIsAdminByEmail: async () => {
        checks += 1;
        return admin;
      },
      getEventHistoryById: async () => row,
      insertEventHistory: async ({ userId, title, data }) => {
        writes += 1;
        row = { id: "card", user_id: userId, title, data };
        return row;
      },
      updateEventHistoryData: updateData,
      updateEventHistoryDataMerge: updateData,
      listShareRecipientUserIdsForEvent: async () => [],
    },
    "@/lib/event-media": { findTransientEventMedia: () => [] },
    "@/lib/ocr/scan-artwork": { prepareSavedScanArtwork: () => false },
    "@/lib/ocr/original-display-state": { prepareSavedScanDisplay: () => false },
    "@/lib/calendar-sync-background": { prepareScanCalendarSync: () => false },
    "@/lib/history-cache": { invalidateUserHistory: () => {} },
    "@/lib/dashboard-cache": { invalidateUserDashboard: () => {} },
    "@/lib/event-draft-access": { isClientDraftId: () => false },
    "@/utils/event-public-slug": {
      validateCustomEventPublicSlug: () => ({ error: "Reached ordinary validation" }),
    },
    "next/navigation": {
      redirect: (path) => {
        throw new Error(`redirect:${path}`);
      },
    },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "./LiveCardBuilder": { default: "LiveCardBuilder" },
  };
  imports["@/lib/admin/require-admin"] = load("src/lib/admin/require-admin.ts", imports);
  return { imports, checks: () => checks, writes: () => writes };
}

test("AI, artwork and location endpoints require sign-in and throttle authenticated requests", async () => {
  for (const signedIn of [false, true]) {
    const context = setup({ signedIn });
    const { builderApiAccess } = load("src/lib/livecard-api-access.ts", context.imports);
    const first = await builderApiAccess("assist");
    if (!signedIn) {
      assert.equal(first.status, 401);
      assert.equal((await builderApiAccess("location")).status, 401);
      assert.equal((await builderApiAccess("design")).status, 401);
    } else {
      assert.equal(first, null);
      for (let index = 1; index < 12; index++) assert.equal(await builderApiAccess("assist"), null);
      assert.equal((await builderApiAccess("assist")).status, 429);
      assert.equal(await builderApiAccess("location"), null, "location has an independent budget");
      for (let index = 0; index < 4; index++) assert.equal(await builderApiAccess("design"), null);
      assert.equal((await builderApiAccess("design")).status, 429);
    }
  }
});

test("all signed-in accounts can open and resume the guided builder", async () => {
  for (const options of [{ signedIn: false }, { admin: false }, { admin: true }]) {
    const context = setup(options);
    const page = load("src/app/livacards-invites/page.tsx", context.imports).default;
    if (options.signedIn !== false) {
      const result = await page({ searchParams: Promise.resolve({ edit: "saved" }) });
      assert.equal(result.props.initialEventId, "saved");
      assert.equal(context.checks(), 0);
    } else {
      await assert.rejects(page({ searchParams: Promise.resolve({}) }), /redirect:\//);
    }
  }
});

test("history POST lets all signed-in accounts explicitly save or publish guided cards", async () => {
  for (const marker of [{ createdVia: "livecard-builder" }, { liveCardBuilder: { version: 1 } }]) {
    for (const admin of [false, true]) {
      for (const status of ["draft", "published"]) {
        const context = setup({ admin });
        const { POST } = load("src/app/api/history/route.ts", context.imports);
        const result = await POST({ json: async () => ({ data: { ...marker, status } }) });
        assert.equal(result.status, 201);
        assert.equal(result.body.user_id, "owner");
        assert.equal(result.body.data.status, status);
        assert.equal(context.writes(), 1);
        assert.equal(context.checks(), 0);
      }
    }
  }
});

test("history PATCH lets every owner update their guided cards", async () => {
  for (const [existing, data] of [
    [{}, { createdVia: "livecard-builder" }],
    [{ createdVia: "livecard-builder" }, { createdVia: "studio" }],
    [{ liveCardBuilder: { version: 1 } }, {}],
  ]) {
    for (const admin of [false, true]) {
      const context = setup({ admin, existing });
      const { PATCH } = load("src/app/api/history/[id]/route.ts", context.imports);
      const result = await PATCH(
        { json: async () => ({ data: { ...data, status: "published" } }) },
        { params: Promise.resolve({ id: "card" }) },
      );
      assert.equal(result.status, 200);
      assert.equal(result.body.data.status, "published");
      assert.equal(context.writes(), 1);
      assert.equal(context.checks(), 0);
    }
  }
});

test("guided saves still require authentication and updates still require ownership", async () => {
  const data = { createdVia: "livecard-builder", status: "published" };
  const signedOut = setup({ signedIn: false });
  const { POST } = load("src/app/api/history/route.ts", signedOut.imports);
  assert.equal((await POST({ json: async () => ({ data }) })).status, 401);
  assert.equal(signedOut.writes(), 0);

  for (const options of [
    { signedIn: false, expected: 401 },
    { ownerId: "another-owner", expected: 403 },
    { ownerId: "another-owner", admin: true, expected: 403 },
  ]) {
    const context = setup({ ...options, existing: data });
    const { GET, PATCH } = load("src/app/api/history/[id]/route.ts", context.imports);
    const request = { url: "https://envitefy.com/api/history/card", json: async () => ({ data }) };
    const params = { params: Promise.resolve({ id: "card" }) };
    assert.equal((await GET(request, params)).status, options.expected);
    assert.equal((await PATCH(request, params)).status, options.expected);
    assert.equal(context.writes(), 0);
  }
});

test("title lettering requires sign-in, validates input and never persists generated artwork", async () => {
  const context = setup();
  let denied = { status: 401 };
  let generated = 0;
  context.imports["@/lib/livecard-api-access"] = { builderApiAccess: async (scope) => { assert.equal(scope, "design"); return denied; } };
  context.imports["@/lib/livecard-builder"] = { readLiveCardForm: (value) => value, validateLiveCard: () => ({}) };
  context.imports["@/lib/shared-card-design"] = { readSharedCardDesign: (value) => value };
  context.imports["@/lib/shared-card-headline"] = { generateCardHeadline: async () => { generated++; return { title: "Livia is turning 10", intro: "", imageUrl: "data:image/webp;base64,test" }; } };
  const { POST } = load("src/app/api/livecard-builder/headline/route.ts", context.imports);
  const request = (body, site = "same-origin") => ({ json: async () => body, headers: { get: () => site } });
  const valid = { form: { title: "Livia is turning 10" }, design: { backgroundUrl: "/background.webp" } };
  assert.equal((await POST(request(valid))).status, 401);
  denied = null;
  assert.equal((await POST(request(valid, "cross-site"))).status, 403);
  assert.equal((await POST(request({ ...valid, form: { title: " " } }))).status, 400);
  assert.equal(generated, 0);
  const response = await POST(request(valid));
  assert.equal(response.status, 200);
  assert.equal(response.body.headline.title, valid.form.title);
  assert.equal(generated, 1);
  assert.equal(context.writes(), 0);
});

test("selected venue IDs use the shared fallback resolver, including earlier ID-only requests", async () => {
  const context = setup();
  const lookups = [];
  context.imports["@/lib/livecard-api-access"] = { builderApiAccess: async () => null };
  context.imports["@/lib/livecard-location-server"] = {
    searchBuilderLocation: async (input) => { lookups.push(input); return { location: null, candidates: [], message: "" }; },
  };
  const { POST } = load("src/app/api/livecard-builder/location/route.ts", context.imports);
  const response = await POST({ json: async () => ({ placeId: "selected-branch", date: "2026-09-26" }) });
  assert.equal(response.status, 200);
  assert.equal(lookups.length, 1);
  assert.equal(lookups[0].placeId, "selected-branch");
});

test("ordinary event saves retain validation and guided navigation no longer requires admin", async () => {
  const context = setup();
  const { POST } = load("src/app/api/history/route.ts", context.imports);
  const result = await POST({
    json: async () => ({ data: { createdVia: "studio" }, clientDraftId: "invalid" }),
  });
  assert.equal(result.status, 400);
  assert.equal(context.checks(), 0);
  const sidebar = fs.readFileSync("src/app/left-sidebar.tsx", "utf8");
  assert.match(sidebar, /<SidebarLink link=\{\{ label: "Live Card"/);
  assert.doesNotMatch(sidebar, /\{isAdmin && <SidebarLink link=\{\{ label: "Live Card"/);
  assert.doesNotMatch(sidebar, /label: "Envitefy Create"/);
});
