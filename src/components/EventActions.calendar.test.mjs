import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as calendarLinks from "../utils/calendar-links.ts";

const require = createRequire(import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("./EventActions.tsx", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, {
  exports, URL, console,
  require: name => {
    if (name === "react") return { useMemo: fn => fn(), useEffect() {} };
    if (name === "next-auth/react") return { useSession: () => ({ data: null }) };
    if (name === "@/components/CalendarAction") return { default: "CalendarAction" };
    if (name === "@/utils/calendar-links") return calendarLinks;
    if (name === "@/lib/mappers") return { combineVenueAndLocation: (a, b) => [a, b].filter(Boolean).join(", ") };
    if (name === "@/utils/contact") return { findFirstEmail: () => null };
    if (name === "@/utils/phone") return { extractFirstPhoneNumber: () => null };
    if (name === "@/utils/native-share" || name === "@/utils/event-tracking-client") return {};
    return require(name);
  },
});
function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...elements(tree.props?.children)];
}

test("shared event actions keep start-only events available and preserve supplied ends", () => {
  for (const end of [null, "2026-09-26T23:00:00Z"]) {
    const tree = exports.default({ shareUrl: "https://envitefy.com/event/example", event: {
      title: "Movie night", start: "2026-09-26T21:00:00Z", end, timezone: "America/Chicago",
    } });
    const action = elements(tree).find(node => node.type === "CalendarAction");
    assert.ok(action, "Add to calendar remains available without an end time");
    const query = new URL(action.props.links.outlook).searchParams;
    assert.equal(query.get("startdt"), "2026-09-26T21:00:00.000Z");
    assert.equal(query.get("enddt"), end ? "2026-09-26T23:00:00.000Z" : null);
  }
});
