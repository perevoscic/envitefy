import { afterEach, expect, mock, test } from "bun:test";
let signedIn = true;
let allowed = true;
let visualCalls = 0;
let snapChecks = 0;
mock.module("next-auth", () => ({ getServerSession: async () => signedIn ? { user: { id: "text-owner" } } : null }));
mock.module("@/lib/auth", () => ({ authOptions: {}, resolveSessionUserId: async (session: { user?: { id?: string } } | null) => session?.user?.id || null }));
mock.module("@/lib/creation-access-server", () => ({ checkCreationAccess: async (_id: string, access: { product: string }) => { expect(access.product).toBe("snap"); snapChecks++; return allowed ? null : new Response(JSON.stringify({ error: "Snap access required" }), { status: 403 }); } }));
mock.module("@/lib/ocr/place-enrichment", () => ({ enrichOcrVenueAddress: async () => null }));
mock.module("@/lib/ocr/openai", () => ({
  OpenAiOcrError: class extends Error {},
  llmEventToRawText: () => "",
  ...Object.fromEntries(["llmExtractEventFromImage", "llmExtractGymnasticsScheduleFromImage", "llmExtractPracticeScheduleFromImage", "llmExtractVisibleTextFromImage", "llmRewriteBirthdayDescription", "llmRewriteSmartDescription", "llmRewriteWedding"].map(name => [name, async () => { visualCalls++; throw new Error("Unexpected media/provider call"); }])),
}));
const { handleOcrRequest } = await import("./pipeline");
afterEach(() => { signedIn = true; allowed = true; visualCalls = 0; snapChecks = 0; });
function request(text: string) { const form = new FormData(); form.set("text", text); return new Request("http://localhost/api/ocr?fast=1&skin=0", { method: "POST", body: form }); }

test("signed-in personal text uses the existing factual/private personalization path without media or artwork calls", async () => {
  const source = "City Dental Clinic\nDental appointment\nAppointment date: 10/25/2026\nTime: 10:30 am\nAddress: 123 Main Street, Chicago IL";
  const response = await handleOcrRequest(request(source));
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.ocrText).toBe(source);
  expect(body.ocrSource).toBe("provided-text");
  expect(body.fieldsGuess.scanPersonalization.medical).toBe(true);
  expect(body.fieldsGuess.start).toContain("2026-10-25T10:30");
  expect(body.scanArtworkTicket).toBeNull();
  expect(visualCalls).toBe(0);
  expect(snapChecks).toBe(1);
});

test("text intake denies anonymous or restricted accounts before processing and rejects oversized sources", async () => {
  signedIn = false;
  expect((await handleOcrRequest(request("Dental appointment October 25 at noon"))).status).toBe(401);
  expect(snapChecks).toBe(0);
  signedIn = true; allowed = false;
  expect((await handleOcrRequest(request("Dental appointment October 25 at noon"))).status).toBe(403);
  expect((await handleOcrRequest(request("x".repeat(120_001)))).status).toBe(400);
  expect(visualCalls).toBe(0);
});
