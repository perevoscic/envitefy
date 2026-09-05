import assert from "node:assert/strict";
import test from "node:test";
import { requireStudioCron } from "./cron-auth.ts";
import { StudioRequestError } from "./validation.ts";

function request(authorization?: string) {
  return new Request("https://example.test/api/admin/marketing-studio/reconcile", {
    headers: authorization ? { authorization } : {},
  });
}

test("scheduled reconciliation fails closed when unconfigured or unauthenticated", () => {
  assert.throws(
    () => requireStudioCron(request(), {}),
    (error: Error) => error instanceof StudioRequestError && error.status === 503,
  );
  for (const value of [undefined, "Bearer wrong", "secret", "Basic secret"]) {
    assert.throws(
      () => requireStudioCron(request(value), { cronSecret: "secret" }),
      (error: Error) => error instanceof StudioRequestError && error.status === 401,
    );
  }
});

test("either configured scheduler secret works without an interactive admin session", () => {
  requireStudioCron(request("Bearer global-secret"), {
    cronSecret: "global-secret",
    studioSecret: "studio-secret",
  });
  requireStudioCron(request("Bearer studio-secret"), {
    cronSecret: "global-secret",
    studioSecret: "studio-secret",
  });
});
