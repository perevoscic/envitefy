import assert from "node:assert/strict";
import test from "node:test";
import { describeDatabaseError, isDatabaseUnavailableError } from "./database-errors.ts";

test("recognizes a direct database connection error", () => {
  assert.equal(
    isDatabaseUnavailableError(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" })),
    true,
  );
});

test("recognizes connection errors nested inside AggregateError", () => {
  const child = Object.assign(new Error("connect EACCES 127.0.0.1:5432"), { code: "EACCES" });
  const aggregate = new AggregateError([child]);

  assert.equal(isDatabaseUnavailableError(aggregate), true);
  assert.equal(describeDatabaseError(aggregate), "[EACCES] connect EACCES 127.0.0.1:5432");
});

test("recognizes connection errors nested through cause", () => {
  const child = Object.assign(new Error("temporary DNS failure"), { code: "EAI_AGAIN" });
  const wrapper = new Error("database lookup failed", { cause: child });

  assert.equal(isDatabaseUnavailableError(wrapper), true);
});

test("does not hide application or query errors", () => {
  assert.equal(isDatabaseUnavailableError(new Error("column does not exist")), false);
  assert.equal(isDatabaseUnavailableError({ code: "42703", message: "undefined column" }), false);
});
