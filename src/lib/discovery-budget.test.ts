import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveDiscoveryBudget,
  resolveDiscoveryClientParseTimeoutMs,
} from "./discovery-budget.ts";

test("URL discovery budgets honor URL-specific env overrides without changing file defaults", () => {
  assert.equal(
    resolveDiscoveryBudget("core", "url", {
      DISCOVERY_URL_CORE_BUDGET_MS: "41000",
      DISCOVERY_CORE_BUDGET_MS: "25000",
    }),
    41_000
  );
  assert.equal(resolveDiscoveryBudget("core", "file", {}), 25_000);
  assert.equal(resolveDiscoveryBudget("core", "url", {}), 35_000);
  assert.equal(resolveDiscoveryBudget("enrich", "url", {}), 60_000);
});

test("client URL parse timeout tracks the combined URL crawl budgets plus buffer", () => {
  assert.equal(resolveDiscoveryClientParseTimeoutMs("file", {}), 45_000);
  assert.equal(resolveDiscoveryClientParseTimeoutMs("url", {}), 140_000);
});
