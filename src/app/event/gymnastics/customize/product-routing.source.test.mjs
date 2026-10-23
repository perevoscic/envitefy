import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { ownerEventEditorReturnHref } from "../../../../lib/event-preview-viewport.ts";

test("gymnastics saves persist an event-page product route", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/app/event/gymnastics/customize/page.tsx"),
    "utf8",
  );

  assert.match(source, /primaryOutput:\s*"event_page"/);
  assert.match(source, /requestedOutputs:\s*\["event_page"\]/);
});

// Execute the actual Cancel handler so a separate hardcoded destination cannot drift again.
const sourcePath = "src/components/events/useEventPageEditor.ts";
const sourceFile = ts.createSourceFile(sourcePath, fs.readFileSync(sourcePath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let cancelExpression;
function findCancel(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(sourceFile) === "cancel") {
    cancelExpression = node.initializer.getText(sourceFile);
  }
  ts.forEachChild(node, findCancel);
}
findCancel(sourceFile);
assert.ok(cancelExpression, "the editor must expose its Cancel action");
const cancelCode = ts.transpileModule(`const cancel = ${cancelExpression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

function cancelHarness(query, embedded = false, {
  published = true,
  unifiedCreationEnabled = true,
  cancelHref,
} = {}) {
  const navigations = [];
  const resets = [];
  const pending = [];
  const savedEventId = "489b1f69-9e4d-49ea-bdf7-d5f5174e9fdf";
  const context = {
    editEventId: savedEventId,
    isNewDraft: false,
    didExplicitSave: false,
    isEmbed: embedded,
    search: new URLSearchParams(query + (embedded ? "&embed=1" : "")),
    cancelHref,
    published,
    UNIFIED_CREATION_ENABLED: unifiedCreationEnabled,
    id: { current: savedEventId },
    loaded: null,
    progress: { requestLeave: navigate => embedded ? pending.push(navigate) : navigate() },
    ownerEventEditorReturnHref,
    buildEventPath(id, title, params) {
      assert.equal(id, savedEventId);
      assert.equal(title, undefined, "unsaved title edits must not choose the return URL");
      assert.deepEqual(params, { tab: "event" });
      return `/event/${id}?tab=event`;
    },
    router: { push: (href) => navigations.push(href) },
    window: { location: { origin: "https://envitefy.test" }, parent: { postMessage: (...args) => resets.push(args), location: { assign: (href) => navigations.push(href) } } },
    fetch() { throw new Error("Cancel must not delete or save this existing event"); },
  };
  return { navigations, resets, pending, context, cancel: new Function(...Object.keys(context), `${cancelCode}\nreturn cancel;`)(...Object.values(context)) };
}

test("Cancel returns a saved event to its original public URL and owner controls", () => {
  const editor = cancelHarness("editor=menu&returnTo=%2Fevent%2Ffright-invite%3Ftab%3Ddesign%23schedule");
  editor.cancel();
  assert.deepEqual(editor.navigations, ["/event/fright-invite?tab=event#schedule"]);
});

test("Cancel from older editor links falls back to the saved event, never the gymnastics landing page", () => {
  const editor = cancelHarness("edit=489b1f69-9e4d-49ea-bdf7-d5f5174e9fdf");
  editor.cancel();
  assert.deepEqual(editor.navigations, ["/event/489b1f69-9e4d-49ea-bdf7-d5f5174e9fdf?tab=event"]);
});

test("embedded Cancel waits for unsaved-change resolution and retains the event if parent navigation fails", () => {
  const editor = cancelHarness("editor=menu&returnTo=%2Fevent%2Ffright-invite", true);
  editor.context.window.parent.location.assign = () => { throw new Error("parent navigation unavailable"); };
  editor.cancel();
  assert.deepEqual(editor.navigations, []);
  assert.deepEqual(editor.resets, []);
  assert.equal(editor.pending.length, 1);
  editor.pending[0]();
  assert.deepEqual(editor.navigations, ["/event/fright-invite?tab=event"]);
  assert.deepEqual(editor.resets, [[{ type: "envitefy:discovery-preview-reset", eventId: "489b1f69-9e4d-49ea-bdf7-d5f5174e9fdf" }, "https://envitefy.test"]]);
});

test("draft Cancel returns to Create even with a stale owner return address or explicit public cancelHref", () => {
  for (const cancelHref of [undefined, "/event/event-draft?tab=event"]) {
    const editor = cancelHarness("editor=menu&returnTo=%2Fevent%2Fevent-draft%3Ftab%3Devent", false, {
      published: false,
      cancelHref,
    });
    editor.cancel();
    assert.deepEqual(editor.navigations, ["/create"]);
    assert.deepEqual(editor.resets, []);
  }
});

test("draft Cancel retains the legacy creation destination when unified creation is disabled", () => {
  const editor = cancelHarness("editor=menu&returnTo=%2Fevent%2Fevent-draft", false, {
    published: false,
    unifiedCreationEnabled: false,
    cancelHref: "/event/event-draft?tab=event",
  });
  editor.cancel();
  assert.deepEqual(editor.navigations, ["/"]);
});

test("embedded draft Cancel waits for unsaved-change resolution before resetting and exiting to Create", () => {
  const editor = cancelHarness("editor=menu&returnTo=%2Fevent%2Fevent-draft", true, {
    published: false,
    cancelHref: "/event/event-draft?tab=event",
  });
  editor.cancel();
  assert.deepEqual(editor.navigations, []);
  assert.deepEqual(editor.resets, []);
  assert.equal(editor.pending.length, 1);
  editor.pending[0]();
  assert.deepEqual(editor.navigations, ["/create"]);
  assert.deepEqual(editor.resets, [[{ type: "envitefy:discovery-preview-reset", eventId: "489b1f69-9e4d-49ea-bdf7-d5f5174e9fdf" }, "https://envitefy.test"]]);
});
