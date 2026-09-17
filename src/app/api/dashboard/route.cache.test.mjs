import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import {
  getDashboardRefreshInflight,
  getDashboardResponseCache,
  invalidateUserDashboard,
} from "../../../lib/dashboard-cache.ts";

test("a dashboard query finishing after deletion cannot restore rows or clear its replacement query", async () => {
  const source = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
  const refreshFunction = source.slice(
    source.indexOf("function getOrCreateRefresh("),
    source.indexOf("function withTiming("),
  );
  const compiled = ts.transpileModule(refreshFunction, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const cache = getDashboardResponseCache();
  const pending = getDashboardRefreshInflight();
  const completions = [];
  const refresh = new Function(
    "computeDashboardPayload",
    "dashboardResponseCache",
    "dashboardRefreshInflight",
    `${compiled}\nreturn getOrCreateRefresh;`,
  )(() => new Promise((resolve) => completions.push(resolve)), cache, pending);
  const oldRead = refresh("owner", "owner@example.com");
  assert.equal(refresh("owner", "owner@example.com"), oldRead);
  invalidateUserDashboard("owner");
  const newRead = refresh("owner", "owner@example.com");
  assert.notEqual(newRead, oldRead);
  completions[0]({ upcoming: [{ id: "deleted-event" }] });
  await oldRead;
  assert.equal(cache.has("owner"), false);
  assert.equal(pending.get("owner"), newRead);
  completions[1]({ upcoming: [{ id: "active-event" }] });
  await newRead;
  assert.deepEqual(cache.get("owner").payload.upcoming, [{ id: "active-event" }]);
  assert.equal(pending.has("owner"), false);
});
