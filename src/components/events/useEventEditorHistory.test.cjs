const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../../scripts/lib/event-messages-test-loader.cjs");

function harness(t) {
  const refs = [], listeners = new Map();
  let index = 0, mounted = false;
  const previous = globalThis.document;
  globalThis.document = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener() {},
  };
  t.after(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });
  const { useEventEditorHistory } = loadTs("src/components/events/useEventEditorHistory.ts", {
    react: {
      useRef(value) { const current = index++; return refs[current] ||= { current: value }; },
      useState: () => [0, () => {}],
      useEffect(effect) { if (!mounted) effect(); },
    },
  });
  return {
    render(snapshot, ready = true) {
      index = 0;
      const result = useEventEditorHistory(snapshot, ready);
      mounted = true;
      return result;
    },
    input(field) { listeners.get("input")({ type: "input", target: field }); },
    click() { listeners.get("pointerdown")({ type: "pointerdown" }); },
  };
}

test("undo groups typing, restores separate design edits and excludes hydration", t => {
  const editor = harness(t), field = {};
  editor.render({ title: "Loading", background: "white" }, false);
  const baseline = { title: "Saved meet", background: "cream" };
  assert.equal(editor.render(baseline).canUndo, false);
  editor.input(field);
  editor.render({ ...baseline, title: "S" });
  editor.input(field);
  const typed = { ...baseline, title: "Some new wording" };
  editor.render(typed);
  editor.click();
  const changed = { ...typed, background: "white" };
  const current = editor.render(changed);
  assert.deepEqual(current.undo(), typed);
  assert.deepEqual(editor.render(typed).undo(), baseline);
  assert.equal(editor.render(baseline).canUndo, false);
});

test("a completed save preserves newer in-flight edits and resets to the saved version", t => {
  const editor = harness(t);
  const opened = { title: "Opened meet", background: "cream" };
  editor.render(opened);
  editor.click();
  const saved = { ...opened, title: "Saved wording" };
  editor.render(saved);
  editor.click();
  const pending = { ...saved, background: "white" };
  editor.render(pending).markSaved(saved);
  assert.equal(editor.render(pending).canUndo, true);
  assert.deepEqual(editor.render(pending).reset(), saved);
  assert.equal(editor.render(saved).canUndo, false);
  editor.click();
  editor.render({ ...saved, title: "Another edit" });
  assert.deepEqual(editor.render({ ...saved, title: "Another edit" }).undo(), saved);
});
