import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
const compiled = ts.transpileModule(
  readFileSync(new URL("./EventDeleteModal.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;

function setup(sourcePage = "myEvents") {
  const calls = [];
  const state = [];
  let cursor = 0;
  const mocks = {
    react: {
      ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (next) => {
            state[index] = next;
          },
        ];
      },
      useEffect(callback) {
        callback();
      },
    },
    "react-dom": { createPortal: (element) => element },
    "next-auth/react": { useSession: () => ({ data: { user: { id: "owner" } } }) },
    "next/navigation": {
      useRouter: () => ({
        replace: (href) => calls.push(["replace", href]),
        refresh: () => calls.push(["refresh"]),
      }),
    },
    "@/app/sidebar-context": {
      useSidebar: () => ({
        eventContextSourcePage: sourcePage,
        clearEventContext: () => calls.push(["clear"]),
        setEventContextSourcePage: (page) => calls.push(["list", page]),
      }),
    },
    "@/app/event-cache-context": {
      emitEventCacheInvalidation: (detail) => calls.push(["invalidate", detail]),
    },
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (name) => mocks[name] || nativeRequire(name),
    module,
    module.exports,
  );
  const render = (props = {}) => {
    cursor = 0;
    return module.exports.default({ eventId: "test-event", eventTitle: "Test event", ...props });
  };
  const findButton = (node, text) => {
    if (!node || typeof node !== "object") return null;
    if (node.type === "button" && node.props.children === text) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = findButton(child, text);
      if (found) return found;
    }
    return null;
  };
  return { calls, render, findButton };
}

for (const { sourcePage, success, navigateAfterDelete } of [
  { sourcePage: "myEvents", success: true, navigateAfterDelete: true },
  { sourcePage: "schedules", success: true, navigateAfterDelete: true },
  { sourcePage: "invitedEvents", success: true, navigateAfterDelete: true },
  { sourcePage: "schedules", success: false, navigateAfterDelete: true },
  { sourcePage: "schedules", success: true, navigateAfterDelete: false },
]) {
  test(
    !success
      ? "failed deletion stays on the event and preserves Schedules"
      : navigateAfterDelete
        ? `successful deletion returns to ${sourcePage} without selecting another event`
        : "deletion without navigation preserves the current sidebar",
    async (t) => {
      const { calls, render, findButton } = setup(sourcePage);
      t.mock.method(globalThis, "fetch", async (url, options) => {
        calls.push(["request", url, options.method]);
        return { ok: success };
      });
      const originals = {
        window: globalThis.window,
        document: globalThis.document,
        alert: globalThis.alert,
      };
      globalThis.window = {
        dispatchEvent: (event) => calls.push(["event", event.type, event.detail]),
      };
      globalThis.document = { body: {} };
      globalThis.alert = () => calls.push(["alert"]);
      t.mock.method(console, "error", () => {});
      t.after(() => Object.assign(globalThis, originals));

      const props = { navigateAfterDelete };
      const closed = render(props);
      React.Children.toArray(closed.props.children)[0].props.onClick();
      const confirm = findButton(render(props), "Delete Event");
      assert.ok(confirm);
      await confirm.props.onClick();
      assert.deepEqual(calls[0], ["request", "/api/history/test-event", "DELETE"]);
      const destinations = calls.filter(([kind]) => kind === "replace");
      assert.deepEqual(destinations, success && navigateAfterDelete ? [["replace", "/"]] : []);
      if (success) {
        assert.ok(calls.some(([kind, value]) => kind === "event" && value === "history:deleted"));
        const sidebarEvents = calls.filter(
          ([kind, value]) => kind === "event" && value.startsWith("envitefy:sidebar:"),
        );
        assert.deepEqual(
          sidebarEvents,
          navigateAfterDelete
            ? [["event", "envitefy:sidebar:open-event-list", { page: sourcePage }]]
            : [],
        );
        assert.deepEqual(
          calls.filter(([kind]) => kind === "list"),
          navigateAfterDelete ? [["list", sourcePage]] : [],
        );
        assert.equal(calls.some(([kind]) => kind === "clear"), navigateAfterDelete);
        assert.ok(calls.some(([kind]) => kind === "invalidate"));
      } else {
        assert.deepEqual(
          calls.map(([kind]) => kind),
          ["request", "alert"],
        );
      }
    },
  );
}
