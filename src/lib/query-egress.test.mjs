import assert from "node:assert/strict";
import test from "node:test";
import { recordQueryEgress, withQueryRoute } from "./query-egress.ts";

test("egress diagnostics count bytes without recording contents and keep concurrent routes separate", async () => {
  const original = console.info;
  const enabled = process.env.DB_EGRESS_METRICS;
  const logs = [];
  console.info = (...args) => logs.push(args);
  try {
    delete process.env.DB_EGRESS_METRICS;
    recordQueryEgress("disabled", [{ secret: "private" }]);
    assert.equal(logs.length, 0);
    process.env.DB_EGRESS_METRICS = "1";
    const rows = [{ secret: "private", text: "é" }];
    await Promise.all(
      ["/first", "/second"].map((route) =>
        withQueryRoute(route, async () => {
          await Promise.resolve();
          recordQueryEgress("history.cards", rows);
        }),
      ),
    );
    assert.deepEqual(logs.map((log) => log[1].route).sort(), ["/first", "/second"]);
    assert.equal(logs[0][1].estimatedBytes, Buffer.byteLength(JSON.stringify(rows[0])));
    assert.equal(logs[0][1].rows, 1);
    assert.ok(!JSON.stringify(logs).includes("private"));
    const cycle = {};
    cycle.self = cycle;
    assert.doesNotThrow(() => recordQueryEgress("cycle", [cycle]));
  } finally {
    console.info = original;
    if (enabled === undefined) delete process.env.DB_EGRESS_METRICS;
    else process.env.DB_EGRESS_METRICS = enabled;
  }
});
