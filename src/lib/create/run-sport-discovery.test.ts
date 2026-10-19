import { afterEach, expect, test } from "bun:test";
import { cancelSportDiscovery, runSportDiscovery, sportDiscoveryBuilderHref, sportDiscoveryStageLabel } from "./run-sport-discovery";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("specialty editor links retain the exact selected sport style and existing gym/football parameters", () => {
  expect(sportDiscoveryBuilderHref("soccer", "season-1", "soccer--stadium")).toBe("/event/sport-events/customize?edit=season-1&new=1&sport=soccer&templateId=soccer--stadium&style=stadium");
  expect(sportDiscoveryBuilderHref("tennis", "season-1", "tennis--tournament")).toBe("/event/sport-events/customize?edit=season-1&new=1&sport=tennis&templateId=tennis--tournament&style=tournament");
  expect(sportDiscoveryBuilderHref("gymnastics", "meet-1", "neon-runway")).toBe("/event/gymnastics/customize?edit=meet-1&new=1&templateId=neon-runway");
  expect(sportDiscoveryBuilderHref("football", "season-1", "stadium-nights")).toBe("/event/football/customize?edit=season-1&new=1&templateId=stadium-nights");
  expect(new URL(sportDiscoveryBuilderHref("soccer", "season-1", "tennis--tournament"), "https://envitefy.com").searchParams.has("style")).toBe(false);
});

test("a recovered completed sport import opens its chosen style instead of the editor default", async () => {
  globalThis.fetch = (async (input) => String(input).endsWith("/run") ? json({ accepted: true }) : json({ builderReady: true, processingStage: "review_ready" })) as typeof fetch;
  const href = await runSportDiscovery({ sport: "soccer", existingEventId: "soccer-import-1", pageTemplateId: "soccer--tournament", signal: new AbortController().signal, onEventId: () => {}, onProgress: () => {} });
  expect(href).toBe("/event/sport-events/customize?edit=soccer-import-1&new=1&sport=soccer&templateId=soccer--tournament&style=tournament");
});

test("resumes recovered identity, persists it before starting, and avoids another intake", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input); calls.push(url);
    if (url.startsWith("/api/discovery/intake?")) return json({ eventId: "existing-event" });
    if (url.endsWith("/run")) { expect(calls).toContain("identity-persisted"); return json({ accepted: true }); }
    if (url.endsWith("/status")) return json({ builderReady: true, processingStage: "review_ready" });
    throw new Error("Unexpected new intake");
  }) as typeof fetch;
  const href = await runSportDiscovery({ sport: "gymnastics", clientIntakeId: "intake-recovery-1", signal: new AbortController().signal, onEventId: async () => { calls.push("identity-persisted"); }, onProgress: () => {} });
  expect(href).toContain("edit=existing-event");
  expect(calls.filter((call) => call === "/api/discovery/intake")).toHaveLength(0);
});

test("all selected photos, host notes and idempotency key go through specialty intake", async () => {
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (url === "/api/discovery/intake") {
      const form = init?.body as FormData;
      expect(form.getAll("file")).toHaveLength(2);
      expect(form.get("text")).toBe("Session 2 moves to noon.");
      expect(form.get("clientIntakeId")).toBe("intake-photos-1");
      return json({ eventId: "sports-1" });
    }
    if (url.includes("intake?")) return json({ eventId: null });
    if (url.endsWith("/run")) return json({ accepted: true });
    return json({ builderReady: true, processingStage: "review_ready" });
  }) as typeof fetch;
  await runSportDiscovery({ sport: "gymnastics", files: [new File(["one"], "one.jpg"), new File(["two"], "two.jpg")], text: "Session 2 moves to noon.", clientIntakeId: "intake-photos-1", signal: new AbortController().signal, onEventId: () => {}, onProgress: () => {} });
});

test("pasted sports details use the specialty intake without fetching a retained reference URL", async () => {
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (url === "/api/discovery/intake") {
      const body = JSON.parse(String(init?.body));
      expect(body.text).toBe("Gymnastics meet: session 1 October 25 at 9am at City Gym.");
      expect(body.url).toBeUndefined();
      expect(body.workflow).toBe("gymnastics");
      return json({ eventId: "pasted-sports-1" });
    }
    if (url.endsWith("/run")) return json({ accepted: true });
    return json({ builderReady: true, processingStage: "review_ready" });
  }) as typeof fetch;
  const href = await runSportDiscovery({ sport: "gymnastics", text: "Gymnastics meet: session 1 October 25 at 9am at City Gym.", signal: new AbortController().signal, onEventId: () => {}, onProgress: () => {} });
  expect(href).toContain("edit=pasted-sports-1");
  expect(sportDiscoveryStageLabel(8, "text")).toBe("Reading your event details…");
});

test("a failed status read retains the event and never sends cancellation", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (input) => {
    const url = String(input); calls.push(url);
    return url.endsWith("/run") ? json({ accepted: true }) : json({ error: "Sign in again" }, 401);
  }) as typeof fetch;
  await expect(runSportDiscovery({ sport: "football", existingEventId: "sports-1", signal: new AbortController().signal, onEventId: () => {}, onProgress: () => {} })).rejects.toThrow("Sign in again");
  expect(calls.some((url) => url.includes("cancel") || url === "/api/discovery/intake")).toBe(false);
});

test("explicit cancellation uses the persistent intake key even before an event ID exists", async () => {
  globalThis.fetch = (async (input, init) => {
    expect(String(input)).toBe("/api/discovery/intake?clientIntakeId=intake-pending-1");
    expect(init?.method).toBe("DELETE");
    return json({ accepted: true });
  }) as typeof fetch;
  await cancelSportDiscovery(null, "intake-pending-1");
});
