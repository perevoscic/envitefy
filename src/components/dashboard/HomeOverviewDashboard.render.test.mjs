import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as dashboardData from "../../lib/dashboard-data.ts";
import * as thumbnailFocus from "../../lib/thumbnail-focus.ts";

const require = createRequire(import.meta.url);
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./HomeOverviewDashboard.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } },
);
const componentModule = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (name) => {
    if (name === "lucide-react") return new Proxy({}, { get: () => () => null });
    if (name === "@/lib/dashboard-data") return dashboardData;
    if (name === "@/lib/thumbnail-focus") return thumbnailFocus;
    if (name === "@/components/ui/flip-clock") return { FlipClock: () => null };
    if (name.startsWith("@/components/")) return { default: () => null };
    return require(name);
  },
  componentModule,
  componentModule.exports,
);
const HomeOverviewDashboard = componentModule.exports.default;
const emptyData = {
  nextEvent: null,
  upcoming: [],
  snapshot: { upcomingCount30Days: 0, upcomingCount7Days: 0, nextEventInDays: null },
  metricsEligibility: { weatherEligible: false, travelWindowEligible: false },
};
function render(props = {}) {
  return renderToStaticMarkup(React.createElement(HomeOverviewDashboard, {
    viewerName: "Ruslan", data: null, metrics: null, enrichMeta: null,
    metricsLoading: false, loading: false, error: null,
    onRetry: () => {}, onForceTravel: () => {}, ...props,
  }));
}

test("Home shows loading before the first request starts and while it is pending", () => {
  for (const loading of [false, true]) {
    const html = render({ loading });
    assert.match(html, /Loading your events/);
    assert.doesNotMatch(html, /Nothing is scheduled yet/);
  }
});

test("Home offers retry after a failed load without claiming the account is empty", () => {
  const html = render({ error: "Your events are taking longer to load. Please try again." });
  assert.match(html, /Your events couldn’t load/);
  assert.match(html, /Try again/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Nothing is scheduled yet/);
});

test("Home shows the empty state only after a successful empty response", () => {
  assert.match(render({ data: emptyData }), /Nothing is scheduled yet/);
});

test("Home keeps loaded events visible during a refresh failure and lists the rest after the spotlight", () => {
  const event = (id, startAt) => ({ id, title: id, startAt, ownership: "owned" });
  const nearest = event("Nearest wedding", "2030-09-25T12:00:00Z");
  const later = event("Later birthday", "2031-04-19T18:00:00Z");
  const html = render({
    data: { ...emptyData, nextEvent: nearest, upcoming: [nearest, later] },
    error: "Refresh failed", loading: true,
  });
  assert.ok(html.indexOf("Nearest wedding") < html.indexOf("Upcoming Events"));
  assert.ok(html.indexOf("Upcoming Events") < html.indexOf("Later birthday"));
  assert.doesNotMatch(html, /Nothing is scheduled yet|Your events couldn’t load/);
});
