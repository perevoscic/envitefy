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

function setup({ signedIn = true, admin = false, existing = {} } = {}) {
  const session = signedIn ? { user: { id: "owner", email: "host@example.com" } } : null;
  let checks = 0;
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
      getEventHistoryById: async () => ({ id: "card", user_id: "owner", data: existing }),
    },
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
  return { imports, checks: () => checks };
}

test("only admins can open the guided builder directly", async () => {
  for (const options of [{ signedIn: false }, { admin: false }, { admin: true }]) {
    const context = setup(options);
    const page = load("src/app/livacards-invites/page.tsx", context.imports).default;
    if (options.admin) {
      const result = await page({ searchParams: Promise.resolve({ edit: "saved" }) });
      assert.equal(result.props.initialEventId, "saved");
      assert.equal(context.checks(), 1);
    } else {
      await assert.rejects(page({ searchParams: Promise.resolve({}) }), /redirect:\//);
    }
  }
});

test("history POST rejects non-admin guided drafts before saving", async () => {
  for (const data of [{ createdVia: "livecard-builder" }, { liveCardBuilder: { version: 1 } }]) {
    for (const admin of [false, true]) {
      const context = setup({ admin });
      const { POST } = load("src/app/api/history/route.ts", context.imports);
      const result = await POST({ json: async () => ({ data, clientDraftId: "invalid" }) });
      assert.equal(result.status, admin ? 400 : 403);
      assert.equal(context.checks(), 1);
    }
  }
});

test("history PATCH checks incoming and existing guided cards, including attempts to remove the marker", async () => {
  for (const [existing, data] of [
    [{}, { createdVia: "livecard-builder" }],
    [{ createdVia: "livecard-builder" }, { createdVia: "studio" }],
    [{ liveCardBuilder: { version: 1 } }, {}],
  ]) {
    for (const admin of [false, true]) {
      const context = setup({ admin, existing });
      const { PATCH } = load("src/app/api/history/[id]/route.ts", context.imports);
      const result = await PATCH(
        { json: async () => ({ data, publicSlug: "validation" }) },
        { params: Promise.resolve({ id: "card" }) },
      );
      assert.equal(result.status, admin ? 400 : 403);
      assert.equal(context.checks(), 1);
    }
  }
});

test("ordinary event saves retain their existing access and guided navigation is admin-only", async () => {
  const context = setup();
  const { POST } = load("src/app/api/history/route.ts", context.imports);
  const result = await POST({
    json: async () => ({ data: { createdVia: "studio" }, clientDraftId: "invalid" }),
  });
  assert.equal(result.status, 400);
  assert.equal(context.checks(), 0);
  const sidebar = fs.readFileSync("src/app/left-sidebar.tsx", "utf8");
  assert.match(sidebar, /\{isAdmin && <SidebarLink link=\{\{ label: "Live Card \/ Invite"/);
});
