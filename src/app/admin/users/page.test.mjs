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

function createPage({ status = "authenticated", isAdmin = true, popupProps } = {}) {
  const states = [];
  const refs = [];
  const requests = [];
  let stateIndex = 0;
  let refIndex = 0;
  let effectIndex = 0;
  let effectDeps = [];
  const pendingEffects = new Map();
  const cleanups = [];
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  vm.runInNewContext(`${outputText}\nexports.BreakdownPopup = BreakdownPopup;`, {
    module,
    exports: module.exports,
    AbortController,
    Error,
    document: { addEventListener() {}, removeEventListener() {} },
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
        useRef(initial) {
          const index = refIndex++;
          if (!(index in refs)) refs[index] = { current: initial };
          return refs[index];
        },
        useEffect(effect, deps) {
          const index = effectIndex++;
          if (!effectDeps[index] || deps.some((dep, depIndex) => !Object.is(dep, effectDeps[index][depIndex]))) {
            effectDeps[index] = deps;
            pendingEffects.set(index, effect);
          }
        },
      };
      if (name === "@/components/admin/AdminAccessProvider") return {
        useAdminAccess: () => ({ status, email: "admin@example.test", isAdmin }),
      };
      if (name === "next/link") return { default: "a" };
      if (name === "@/utils/event-product-route") return {
        buildEventProductPath: ({ eventId, publicSlug }) => `/event/${publicSlug || eventId}`,
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  }, { filename: filename.pathname });

  return {
    requests,
    render(nextProps = popupProps) {
      popupProps = nextProps;
      stateIndex = 0;
      refIndex = 0;
      effectIndex = 0;
      const tree = popupProps ? module.exports.BreakdownPopup(popupProps) : module.exports.default();
      for (const [index, effect] of pendingEffects) {
        cleanups[index]?.();
        cleanups[index] = effect();
      }
      pendingEffects.clear();
      return tree;
    },
    restartEffects(index) {
      if (index === undefined) effectDeps = [];
      else effectDeps[index] = undefined;
    },
    unmount() { for (const cleanup of cleanups) cleanup?.(); },
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

function createPopup(kind, extraProps = {}) {
  return createPage({ popupProps: {
    label: kind === "scans" ? "Scans" : "Events",
    count: 1,
    breakdown: [],
    userId: "00000000-0000-0000-0000-000000000001",
    debugLinkKind: kind,
    ...extraProps,
  } });
}

function togglePopup(popup) {
  nodes(popup.render()).find((node) => node.type === "button").props.onClick();
  popup.render();
  // The loading state causes a render before the server responds.
  return popup.render();
}

function debugSuccess(kind, title = "Saved event") {
  return Response.json({
    [kind === "scans" ? "scanLinks" : "eventLinks"]: [
      { id: "event-1", title, publicSlug: "saved-event" },
    ],
    scanAttempts: kind === "scans" ? [
      { id: "attempt-1", title: "Unsaved scan", category: "General", status: "processed" },
    ] : [],
  });
}

for (const kind of ["events", "scans"]) {
  for (const variant of ["popover", "inline"]) {
    test(`${kind} ${variant} finishes loading after its loading-state render and caches success`, async () => {
      const popup = createPopup(kind, { variant });
      assert.match(text(togglePopup(popup)), /Loading dev URLs/);
      assert.equal(popup.requests.length, 1);
      assert.equal(popup.requests[0].signal.aborted, false);
      assert.match(popup.requests[0].url, new RegExp(`/debug-links\\?kind=${kind}$`));
      popup.requests[0].resolve(debugSuccess(kind));
      await setImmediate();
      const loaded = popup.render();
      assert.doesNotMatch(text(loaded), /Loading dev URLs/);
      assert.match(text(loaded), /Saved event/);
      assert.ok(nodes(loaded).some((node) => node.props?.href === "/event/saved-event"));
      if (kind === "scans") {
        assert.match(text(loaded), /Unsaved scan/);
        assert.ok(nodes(loaded).some((node) => node.props?.href === "/admin/scans/attempt-1"));
      }
      togglePopup(popup);
      assert.match(text(togglePopup(popup)), /Saved event/);
      assert.equal(popup.requests.length, 1);
      popup.unmount();
    });
  }
}

test("closing a pending popup cancels it and reopening starts a fresh request", async () => {
  const popup = createPopup("events");
  togglePopup(popup);
  const oldRequest = popup.requests[0];
  togglePopup(popup);
  assert.equal(oldRequest.signal.aborted, true);
  togglePopup(popup);
  assert.equal(popup.requests.length, 2);
  assert.equal(popup.requests[1].signal.aborted, false);
  popup.requests[1].resolve(debugSuccess("events", "Current event"));
  await setImmediate();
  // An already-resolving response must not overwrite the reopened popup or its cache.
  oldRequest.resolve(debugSuccess("events", "Stale event"));
  await setImmediate();
  assert.match(text(popup.render()), /Current event/);
  assert.doesNotMatch(text(popup.render()), /Stale event/);
  togglePopup(popup);
  assert.match(text(togglePopup(popup)), /Current event/);
  assert.equal(popup.requests.length, 2);
  popup.unmount();
});

test("restarting the request effect while loading does not strand the popup", async () => {
  const popup = createPopup("scans");
  togglePopup(popup);
  popup.restartEffects(2);
  popup.render();
  popup.render();
  assert.equal(popup.requests.length, 2);
  assert.equal(popup.requests[0].signal.aborted, true);
  popup.requests[1].resolve(debugSuccess("scans"));
  await setImmediate();
  assert.match(text(popup.render()), /Saved event/);
  popup.unmount();
});

test("a failed scan request offers Retry and does not claim scan records are missing", async () => {
  const popup = createPopup("scans");
  togglePopup(popup);
  popup.requests[0].resolve(Response.json({ error: "Database request timed out" }, { status: 500 }));
  await setImmediate();
  const failed = popup.render();
  assert.match(text(failed), /Database request timed out/);
  assert.doesNotMatch(text(failed), /Loading dev URLs|predates detailed attempt tracking/);
  const retry = nodes(failed).find((node) => node.type === "button" && text(node) === "Retry");
  assert.ok(retry);
  retry.props.onClick();
  popup.render();
  assert.doesNotMatch(text(popup.render()), /Database request timed out/);
  assert.equal(popup.requests.length, 2);
  popup.requests[1].resolve(debugSuccess("scans"));
  await setImmediate();
  assert.match(text(popup.render()), /Saved event/);
  popup.unmount();
});

test("successfully loaded empty scans explain why historical scans have no links", async () => {
  const popup = createPopup("scans");
  togglePopup(popup);
  popup.requests[0].resolve(Response.json({ scanLinks: [], scanAttempts: [] }));
  await setImmediate();
  assert.match(text(popup.render()), /predates detailed attempt tracking/);
  popup.unmount();
});

test("zero-count popups do not request debug links", () => {
  const popup = createPopup("events", { count: 0 });
  assert.match(text(togglePopup(popup)), /No events yet/);
  assert.equal(popup.requests.length, 0);
  popup.unmount();
});
