import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = new URL("../../", import.meta.url);

function harness({ databaseAdmin = true, sessionAdmin = false } = {}) {
  const h = {
    session: { user: { email: "admin@example.test", isAdmin: sessionAdmin } },
    status: "authenticated",
    databaseAdmin,
  };
  const cache = new Map();
  function load(relativePath) {
    if (cache.has(relativePath)) return cache.get(relativePath);
    const filename = new URL(relativePath, root);
    const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename.pathname,
    });
    const module = { exports: {} };
    vm.runInNewContext(outputText, {
      module,
      exports: module.exports,
      require(name) {
        if (name === "next-auth/react") return {
          useSession: () => ({ data: h.session, status: h.status }),
        };
        if (name === "next-auth") return { getServerSession: async () => h.session };
        if (name === "next/link") return { default: "a" };
        if (name === "@/lib/auth") return { authOptions: {} };
        if (name === "@/lib/db") return { getIsAdminByEmail: async () => h.databaseAdmin };
        if (name === "@/utils/event-product-route") return {};
        if (name === "@/components/admin/AdminAccessProvider") {
          return load("components/admin/AdminAccessProvider.tsx");
        }
        if (name === "@/lib/admin/require-admin") return load("lib/admin/require-admin.ts");
        return require(name);
      },
    }, { filename: filename.pathname });
    cache.set(relativePath, module.exports);
    return module.exports;
  }
  h.provider = load("components/admin/AdminAccessProvider.tsx");
  h.users = load("app/admin/users/page.tsx").default;
  h.layout = load("app/admin/layout.tsx").default;
  h.render = async () => renderToStaticMarkup(await h.layout({ children: createElement(h.users) }));
  return h;
}

test("a database-verified admin can open Users with a stale false session claim", async () => {
  const h = harness();
  const html = await h.render();
  assert.match(html, /Loading overview/);
  assert.doesNotMatch(html, /Forbidden|must sign in/);
});

test("a true session claim cannot override a database denial", async () => {
  const h = harness({ databaseAdmin: false, sessionAdmin: true });
  const html = await h.render();
  assert.match(html, /restricted to Envitefy admins/);
  assert.doesNotMatch(html, /Loading overview/);
});

test("the server layout rejects signed-out users before rendering its children", async () => {
  const h = harness();
  h.session = null;
  h.status = "unauthenticated";
  assert.match(await h.render(), /Sign in required/);
});

test("an account switch cannot reuse another account's server verification", async () => {
  const h = harness();
  const tree = await h.layout({ children: createElement(h.users) });
  h.session = { user: { email: "another@example.test", isAdmin: true } };
  assert.match(renderToStaticMarkup(tree), /Forbidden: Admins only/);
});

test("client pages deny access when rendered without server verification", () => {
  const h = harness({ sessionAdmin: true });
  assert.match(renderToStaticMarkup(createElement(h.users)), /Forbidden: Admins only/);
});

test("verification matches normalized emails but never admits missing or loading sessions", async () => {
  const h = harness();
  const tree = await h.layout({ children: createElement(h.users) });
  h.session.user.email = " ADMIN@EXAMPLE.TEST ";
  assert.match(renderToStaticMarkup(tree), /Loading overview/);
  h.status = "loading";
  assert.doesNotMatch(renderToStaticMarkup(tree), /Loading overview/);
  h.status = "unauthenticated";
  h.session = null;
  assert.match(renderToStaticMarkup(tree), /must sign in/);
});
