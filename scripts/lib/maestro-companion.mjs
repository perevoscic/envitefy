import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { authenticatedRequest } from "./maestro-environment.mjs";

// These are real server/API checks, kept separate from Maestro's UI evidence.
// A successful hidden-button assertion alone never proves authorization.
export async function companionChecks(environment, scenario, account, artifactDir, uiPassed) {
  const checks = [];
  const context = await authenticatedRequest(environment.baseUrl, account);
  const check = async (name, fn) => {
    try {
      await fn();
      checks.push({ name, status: "passed" });
    } catch (error) {
      checks.push({ name, status: "failed", message: error.message });
    }
  };
  const original = async (api) => api.get(`/api/events/${account.eventId}/original`);
  try {
    const id = scenario.id.slice(0, 2);
    if (id === "05")
      await check("The owner can retrieve the existing original document", async () => {
        const response = await original(context);
        assert.equal(response.status(), 200, "Owner original must exist before testing denial.");
        assert.match(response.headers()["content-type"], /^(?:image\/|application\/pdf)/);
        assert.ok((await response.body()).length > 100);
      });
    if (["02", "03"].includes(id) && uiPassed)
      await check("Saved wording and publication persist on the original event", async () => {
        const response = await context.get(`/api/history/${account.eventId}`);
        assert.equal(response.status(), 200);
        const row = await response.json();
        assert.equal(row.id, account.eventId);
        assert.equal(row.data.status, "published");
        assert.equal(
          row.data.liveCardBuilder.form.overview,
          id === "02" ? "QA02 saved guest message" : "QA03 changed guest message",
        );
      });
    if (id === "07" && uiPassed)
      await check("Participant cancellation remains in the owner audit record", async () => {
        const owner = await authenticatedRequest(environment.baseUrl, environment.accounts[5]);
        try {
          const data = await (await owner.get(`/api/history/${account.eventId}/signup`)).json();
          const response = data.signupForm.responses.find(
            (item) => item.userId === account.id || item.email === account.email,
          );
          assert.ok(response, "The cancelled response must remain in owner data.");
          assert.equal(response.status, "cancelled");
          assert.equal(response.note, "QA07 updated note");
        } finally {
          await owner.dispose();
        }
      });
    if (id === "08" && uiPassed)
      await check(
        "Cancelling the occupied reservation promotes the waiting participant",
        async () => {
          const owner = await authenticatedRequest(environment.baseUrl, environment.accounts[5]);
          try {
            const before = await (
              await context.get(`/api/history/${account.eventId}/signup`)
            ).json();
            const waiting = before.signupForm.responses.find(
              (item) => item.id === before.myResponseId,
            );
            assert.equal(waiting?.status, "waitlisted");
            const cancellation = await owner.post(`/api/history/${account.eventId}/signup`, {
              headers: { origin: environment.baseUrl },
              data: {
                action: "cancel",
                signupId: account.occupiedResponseId || "seed-reservation",
              },
            });
            assert.equal(cancellation.status(), 200, await cancellation.text());
            const after = await (
              await context.get(`/api/history/${account.eventId}/signup`)
            ).json();
            assert.equal(
              after.signupForm.responses.find((item) => item.id === after.myResponseId)?.status,
              "confirmed",
            );
          } finally {
            await owner.dispose();
          }
        },
      );
    if (["09", "10"].includes(id) && uiPassed) {
      await check("Accepted co-host has editing access but cannot manage access", async () => {
        const response = await context.get(`/api/history/${account.eventId}`);
        assert.equal(response.status(), 200);
        const row = await response.json();
        assert.equal(row.permissions?.canEdit, true);
        assert.equal(row.permissions?.canManageCollaborators, false);
        assert.equal(
          (await context.get(`/api/events/${account.eventId}/collaborators`)).status(),
          403,
        );
      });
      if (id === "09")
        await check("Revoking a co-host immediately removes private editing access", async () => {
          assert.ok(
            account.id,
            "The authenticated co-host session must supply a user ID before revocation.",
          );
          const owner = await authenticatedRequest(environment.baseUrl, environment.accounts[1]);
          try {
            const response = await owner.delete(
              `/api/events/${account.eventId}/collaborators?personId=${account.id}`,
            );
            assert.equal(response.status(), 200);
            const denied = await context.get(`/api/history/${account.eventId}`);
            assert.ok(
              [403, 404].includes(denied.status()),
              `Expected 403/404 after revocation; got ${denied.status()}.`,
            );
          } finally {
            await owner.dispose();
          }
        });
    }
    if (id === "12") {
      await check("An existing medical original denies the unrelated account", async () => {
        const owner = await authenticatedRequest(environment.baseUrl, environment.accounts[4]);
        try {
          assert.equal((await original(owner)).status(), 200, "Positive owner control must pass.");
        } finally {
          await owner.dispose();
        }
        assert.equal((await original(context)).status(), 404);
      });
      await check("Private history and host data are denied by the server", async () => {
        for (const eventId of [
          account.eventId,
          environment.accounts[1].eventId,
          environment.accounts[5].eventId,
        ]) {
          const response = await context.get(`/api/history/${eventId}`);
          assert.ok(
            [403, 404].includes(response.status()),
            `Unrelated private history returned ${response.status()}.`,
          );
        }
        const signup = await (
          await context.get(`/api/history/${environment.accounts[5].eventId}/signup`)
        ).json();
        assert.ok(
          !signup.signupForm?.responses?.some((item) => item.email && item.email !== account.email),
          "Guest projection leaked another participant contact.",
        );
      });
    }
  } finally {
    await context.dispose();
  }
  await writeFile(path.join(artifactDir, "api-checks.json"), JSON.stringify(checks, null, 2));
  return checks;
}
