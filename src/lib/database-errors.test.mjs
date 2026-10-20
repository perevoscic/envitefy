import assert from "node:assert/strict";
import test from "node:test";
import {
  describeDatabaseError,
  isDatabaseCapacityError,
  isDatabaseUnavailableError,
  normalizeDatabaseError,
} from "./database-errors.ts";

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
  const normalized = normalizeDatabaseError(aggregate);
  assert.equal(normalized.message, "[EACCES] connect EACCES 127.0.0.1:5432");
  assert.equal(normalized.code, "EACCES");
});

test("empty AggregateError connect failures keep a usable message", () => {
  const aggregate = new AggregateError([]);
  assert.equal(isDatabaseUnavailableError(aggregate), true);
  const normalized = normalizeDatabaseError(aggregate);
  assert.equal(normalized.message, "Database connection unavailable");
  assert.notEqual(normalized.message, "");
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

test("Supavisor session exhaustion is temporary database capacity failure", () => {
  const error = Object.assign(new Error("(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15"), { code: "XX000" });
  for (const failure of [error, new Error("Connection failed", { cause: error }), new AggregateError([error])]) {
    assert.equal(isDatabaseUnavailableError(failure), true);
    assert.equal(isDatabaseCapacityError(failure), true);
  }
  assert.equal(isDatabaseCapacityError({ code: "53300", message: "remaining connection slots are reserved" }), true);
  assert.equal(isDatabaseCapacityError({ code: "XX000", message: "unrelated internal query error" }), false);
  assert.equal(isDatabaseUnavailableError({ code: "XX000", message: "unrelated internal query error" }), false);
  assert.equal(isDatabaseCapacityError(new Error("connect ECONNRESET")), false);
});
