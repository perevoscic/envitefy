import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as scheduleHelpers from "../lib/scan-schedule.ts";
import { buildScanEventPageHistoryPayload } from "../lib/scan-event-page.ts";
import { buildCalendarLinks } from "../utils/calendar-links.ts";

const require = createRequire(import.meta.url);
const module = { exports: {} };
const compiled = ts.transpileModule(fs.readFileSync("src/components/ScannedSchedule.tsx", "utf8"), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;
vm.runInNewContext(compiled, {
  module,
  exports: module.exports,
  require: (name) => {
    if (name === "@/lib/scan-schedule") return scheduleHelpers;
    if (name === "@/utils/calendar-links") return { buildCalendarLinks };
    if (name === "@/components/CalendarAction")
      return {
        default: ({ links }) => createElement("a", { href: links.google }, "Add to calendar"),
      };
    return require(name);
  },
});
const ScannedSchedule = module.exports.default;
const Provider = module.exports.ScannedScheduleProvider;

test("uploaded game rows render through the saved-page provider with their own calendar links", () => {
  const payload = buildScanEventPageHistoryPayload({
    source: "upload",
    ocr: {
      fieldsGuess: { title: "Panthers season", timezone: "America/Chicago" },
      events: [
        {
          title: "Panthers vs Cougars",
          start: "2026-09-18T19:00:00-05:00",
          end: "2026-09-18T21:00:00-05:00",
          location: "Home Field",
        },
        {
          title: "Panthers at Tigers",
          start: "2026-09-25T19:00:00-05:00",
          end: "2026-09-25T21:00:00-05:00",
          location: "Tiger Stadium",
        },
      ],
    },
  });
  const schedule = JSON.parse(JSON.stringify(payload.data.scanSchedule));
  const html = renderToStaticMarkup(
    createElement(Provider, { schedule }, createElement(ScannedSchedule)),
  );
  assert.equal((html.match(/<li\b/g) || []).length, 2);
  assert.match(html, /Panthers vs Cougars/);
  assert.match(html, /Panthers at Tigers/);
  assert.match(html, /Tiger Stadium/);
  assert.match(html, /7:00 PM/);
  assert.equal((html.match(/Add to calendar/g) || []).length, 2);
});

test("all 48 rows render, weekly practices show their group/day, and unknown dates create no calendar link", () => {
  const schedule = scheduleHelpers.normalizeScanSchedule({
    title: "Practice schedule",
    timeframe: "Fall 2026",
    timezone: "America/Chicago",
    items: Array.from({ length: 48 }, (_, index) => ({
      title: `Practice ${index + 1}`,
      type: "practice",
      group: "Team Blue",
      day: "MO",
      startTime: "16:30",
      endTime: "18:00",
    })),
  });
  const html = renderToStaticMarkup(createElement(ScannedSchedule, { schedule }));
  assert.equal((html.match(/<li\b/g) || []).length, 48);
  assert.match(html, /Practice 48/);
  assert.match(html, /Team Blue/);
  assert.match(html, /Every Monday/);
  assert.match(html, /4:30 PM–6:00 PM/);
  assert.doesNotMatch(html, /Add to calendar/);
});

test("quick scans enter review before any save, and public skins receive the saved schedule", () => {
  const dashboard = fs.readFileSync("src/components/Dashboard.tsx", "utf8");
  assert.match(
    dashboard,
    /if \(scannedParams\.ocrMeta\?\.scanSchedule\) \{[\s\S]*?setPendingSchedule\(scannedParams\);[\s\S]*?return;[\s\S]*?submitScannedEventRef\.current\(scannedParams\)/,
  );
  assert.match(dashboard, /onDrop=/);
  const page = fs.readFileSync("src/app/event/[id]/page.tsx", "utf8");
  assert.match(
    page,
    /ScannedScheduleProvider schedule=\{normalizeScanSchedule\(data.scanSchedule\)\}/,
  );
  assert.match(
    fs.readFileSync("src/components/ScannedInviteSkin.tsx", "utf8"),
    /<ScannedSchedule interactive=\{!previewMode\}/,
  );
});

test("owner Edit and Continue creating both resume saved schedules in the schedule editor", () => {
  const routeModule = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync("src/utils/event-edit-route.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, {
    module: routeModule,
    exports: routeModule.exports,
    URLSearchParams,
    require: (name) => {
      if (name === "@/lib/manual-event-progress") return { manualEventEditHref: () => null };
      if (name === "@/lib/template-categories")
        return { getTemplateCategory: () => null, templateEditorHref: () => "/template" };
      if (name === "./event-url") return { buildEventPath: () => "/event/fallback" };
      throw new Error("Unexpected import: " + name);
    },
  });
  for (const createdVia of ["ocr", "concierge"]) {
    const data = { createdVia, status: "draft", scanSchedule: { items: [{ title: "Practice" }] } };
    assert.equal(
      routeModule.exports.buildEditLink("saved schedule", data, "Practice"),
      "/event/schedule/customize?edit=saved%20schedule",
    );
    assert.equal(
      routeModule.exports.resolveEditHref("saved schedule", data, "Practice"),
      "/event/schedule/customize?edit=saved%20schedule",
    );
  }
});
