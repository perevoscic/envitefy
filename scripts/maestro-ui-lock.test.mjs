import assert from "node:assert/strict";
import test from "node:test";
import { classifyFailure } from "./lib/maestro-core.mjs";
import { acquireAndroidUiLock } from "./lib/maestro-ui-lock.mjs";

test("only one UI runner can reserve an Android device; release permits the next run", async () => {
  const serial = `lock-test-${process.pid}-${Date.now()}`;
  const release = await acquireAndroidUiLock(serial, { account: "QA01" });
  try {
    await assert.rejects(
      acquireAndroidUiLock(serial, { account: "QA02" }),
      /reserved by another run/,
    );
  } finally {
    release();
  }
  const releaseNext = await acquireAndroidUiLock(serial, { account: "QA02" });
  releaseNext();
});

test("a dead Maestro device server is a tool failure, not evidence of an app defect", () => {
  assert.equal(
    classifyFailure({
      output: "maestro.android.DeviceServerDiedException: StatusRuntimeException: UNAVAILABLE",
    }),
    "environment_or_test_failure",
  );
});
