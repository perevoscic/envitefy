import assert from "node:assert/strict";
import test from "node:test";

import {
  DISCOVERY_INTAKE_URL_READ_TIMEOUT_MS,
  resolveDiscoveryBudget,
  resolveDiscoveryClientIngestTimeoutMs,
  resolveDiscoveryClientParseTimeoutMs,
} from "./discovery-budget.ts";

test("URL discovery budgets honor URL-specific env overrides without changing file defaults", () => {
  assert.equal(
    resolveDiscoveryBudget("core", "url", {
      DISCOVERY_URL_CORE_BUDGET_MS: "41000",
      DISCOVERY_CORE_BUDGET_MS: "25000",
    }),
    41_000,
  );
  assert.equal(resolveDiscoveryBudget("core", "file", {}), 25_000);
  assert.equal(resolveDiscoveryBudget("core", "url", {}), 35_000);
  assert.equal(resolveDiscoveryBudget("enrich", "url", {}), 60_000);
});

test("client URL ingest timeout outlasts intake's public page check", () => {
  assert.equal(DISCOVERY_INTAKE_URL_READ_TIMEOUT_MS, 20_000);
  assert.equal(resolveDiscoveryClientIngestTimeoutMs({}), 45_000);
  assert.ok(resolveDiscoveryClientIngestTimeoutMs({}) > DISCOVERY_INTAKE_URL_READ_TIMEOUT_MS);
  assert.equal(
    resolveDiscoveryClientIngestTimeoutMs({ DISCOVERY_INGEST_CLIENT_BUFFER_MS: "10000" }),
    30_000,
  );
});

test("client URL parse timeout tracks the combined URL crawl budgets plus buffer", () => {
  assert.equal(resolveDiscoveryClientParseTimeoutMs("file", {}), 300_000);
  assert.equal(resolveDiscoveryClientParseTimeoutMs("url", {}), 215_000);
  assert.equal(
    resolveDiscoveryClientParseTimeoutMs("url", { DISCOVERY_URL_PARSE_CLIENT_BUFFER_MS: "60000" }),
    155_000,
  );
});
