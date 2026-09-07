import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const filename = new URL("./page.tsx", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
  fileName: filename.pathname,
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function createPage({ status = "authenticated", isAdmin = true } = {}) {
  const states = [];
  const requests = [];
  let stateIndex = 0;
  let effectDeps;
  let pendingEffect;
  let cleanup;
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    AbortController,
    Error,
    fetch(url, options) {
      const request = { url, ...options, ...deferred() };
      requests.push(request);
      return request.promise;
    },
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useState(initial) {
          const index = stateIndex++;
          if (!(index in states)) states[index] = initial;
          return [states[index], (value) => {
            states[index] = typeof value === "function" ? value(states[index]) : value;
          }];
        },
        useEffect(effect, deps) {
          if (!effectDeps || deps.some((dep, index) => !Object.is(dep, effectDeps[index]))) {
            effectDeps = deps;
            pendingEffect = effect;
          }
        },
      };
      if (name === "next-auth/react") return {
        // Session refreshes return a new object even when the account is unchanged.
        useSession: () => ({ status, data: { user: { email: "admin@example.test", isAdmin } } }),
      };
      if (name === "next/link") return { default: "a" };
      if (name === "@/utils/event-product-route") return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  }, { filename: filename.pathname });

  return {
    requests,
    render() {
      stateIndex = 0;
      const tree = module.exports.default();
      if (pendingEffect) {
        cleanup?.();
        cleanup = pendingEffect();
        pendingEffect = null;
      }
      return tree;
    },
    restartEffects() { effectDeps = undefined; },
    unmount() { cleanup?.(); },
  };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function text(tree) {
  if (typeof tree === "string") return tree;
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  return tree && typeof tree === "object" ? text(tree.props?.children) : "";
}

const success = () => Response.json({ overview: {
  totalUsers: 64, totalScans: 93, totalEvents: 273, totalShares: 10,
  eventsByCategory: {}, scansByCategory: {},
} });

test("overview failure stops loading and Retry recovers without a stale banner", async () => {
  const page = createPage();
  page.render();
  page.requests[0].resolve(new Response(null, { status: 500 }));
  await setImmediate();
  const failed = page.render();
  assert.match(text(failed), /Could not load platform overview \(500\)/);
  assert.doesNotMatch(text(failed), /Loading overview/);
  const retry = nodes(failed).find((node) => node.type === "button" && text(node) === "Retry overview");
  assert.ok(retry);
  retry.props.onClick();
  page.render();
  assert.equal(page.requests[0].signal.aborted, true);
  assert.equal(page.requests[1].url, "/api/admin/stats");
  page.requests[1].resolve(success());
  await setImmediate();
  const recovered = page.render();
  assert.equal(nodes(recovered).some((node) => node.props?.role === "alert"), false);
  assert.equal(nodes(recovered).find((node) => node.props?.label === "Total Users").props.value, 64);
  assert.equal(page.requests.length, 2);
  page.unmount();
});

test("effect cleanup ignores an older failure after a newer overview succeeds", async () => {
  const page = createPage();
  page.render();
  const oldRequest = page.requests[0];
  // Remount the effect as React Strict Mode does while the first request is in flight.
  page.restartEffects();
  page.render();
  page.requests[1].resolve(success());
  await setImmediate();
  oldRequest.reject(new Error("Old request failed"));
  await setImmediate();
  assert.equal(oldRequest.signal.aborted, true);
  const recovered = page.render();
  assert.equal(nodes(recovered).some((node) => node.props?.role === "alert"), false);
  assert.equal(nodes(recovered).find((node) => node.props?.label === "Total Users").props.value, 64);
  page.unmount();
});

test("equivalent session refreshes do not refetch the overview", async () => {
  const page = createPage();
  page.render();
  page.requests[0].resolve(success());
  await setImmediate();
  page.render();
  page.render();
  assert.equal(page.requests.length, 1);
  page.unmount();
});

test("overview failures retain the server error for admin troubleshooting", async () => {
  const page = createPage();
  page.render();
  page.requests[0].resolve(Response.json({ error: "Database request timed out" }, { status: 500 }));
  await setImmediate();
  assert.match(text(page.render()), /Database request timed out/);
  page.unmount();
});

for (const access of [{ status: "unauthenticated" }, { isAdmin: false }]) {
  test(`overview requires an authenticated admin: ${JSON.stringify(access)}`, () => {
    const page = createPage(access);
    page.render();
    assert.equal(page.requests.length, 0);
  });
}
