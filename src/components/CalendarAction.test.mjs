import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as calendarPreference from "../lib/calendar-preference.ts";

const require = createRequire(import.meta.url);
const script = ts.transpileModule(
  readFileSync(new URL("./CalendarAction.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
const links = {
  google: "https://calendar.google.com/example",
  outlook: "https://outlook.live.com/example",
  appleInline: "/api/ics?start=2026-09-26&disposition=inline",
};

function harness({ provider = null, native = true, onShowChooser, onChoose } = {}) {
  const slots = [];
  const launches = [];
  let cursor = 0;
  const exports = {};
  vm.runInNewContext(script, {
    exports,
    document: { activeElement: null },
    HTMLElement: class {},
    require: (name) => {
      if (name === "react")
        return {
          useRef: (value) => {
            const index = cursor++;
            slots[index] ??= { current: value };
            return slots[index];
          },
          useState: (value) => {
            const index = cursor++;
            if (!(index in slots)) slots[index] = value;
            return [
              slots[index],
              (next) => {
                slots[index] = next;
              },
            ];
          },
        };
      if (name === "@/hooks/useCalendarPreference")
        return { useCalendarPreference: () => ({ provider, canRemember: () => false }) };
      if (name === "@/utils/calendar-open")
        return {
          openCalendarProvider: (_links, selected) => {
            launches.push(selected);
            return selected === "microsoft" && native;
          },
        };
      if (name === "@/lib/calendar-preference") return calendarPreference;
      if (name === "@/lib/scanned-invite-palette") return {};
      if (name === "lucide-react") return { Calendar: "svg", CalendarPlus: "svg", X: "svg" };
      if (name === "@radix-ui/react-dialog")
        return Object.fromEntries(
          ["Root", "Portal", "Overlay", "Content", "Title", "Description", "Close"].map((key) => [
            key,
            `Dialog.${key}`,
          ]),
        );
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    return exports.useCalendarAction({ links, onShowChooser, onChoose });
  };
  return { render, launches };
}

function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...elements(tree.props?.children)];
}

test("native Outlook attempt keeps recovery links available without claiming the event was saved", () => {
  const api = harness();
  assert.equal(api.render().select("microsoft"), true);
  const result = api.render();
  assert.equal(result.isOpen, true);
  const anchors = elements(result.fallbackOptions).filter((node) => node.type === "a");
  assert.equal(anchors.length, 2);
  assert.equal(anchors[0].props.href, links.outlook);
  assert.match(anchors[1].props.href, /disposition=attachment/);
  assert.equal(api.launches.length, 1);
  assert.equal(result.select("microsoft"), true, "double taps keep the fallback visible");
  assert.equal(api.launches.length, 1);
});

test("a saved native default still exposes fallback controls in the embedded card chooser", () => {
  let shown = 0;
  const api = harness({ provider: "microsoft", onShowChooser: () => shown++ });
  api.render().open();
  assert.equal(shown, 1);
  assert.ok(api.render().fallbackOptions);
  assert.equal(api.render().isOpen, false, "the embedded card owns the chooser");
});

test("web provider flows close normally and do not show native recovery", () => {
  const web = harness({ native: false });
  assert.equal(web.render().select("microsoft"), false);
  assert.equal(web.render().fallbackOptions, null);
  assert.equal(web.render().isOpen, false);
});

test("legacy callbacks cannot bypass the standard native handoff", () => {
  const callback = harness({ onChoose: () => assert.fail("must not bypass shared launcher") });
  assert.equal(callback.render().select("microsoft"), true);
  assert.deepEqual(callback.launches, ["microsoft"]);
  assert.ok(callback.render().fallbackOptions);
});
