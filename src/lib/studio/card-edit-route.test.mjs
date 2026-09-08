import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import sharp from "sharp";
import { parseDataUrlBase64 } from "../../utils/data-url.ts";
import { prepareCardEditPreviewImage, streamCardEditPreview } from "./card-edit-preview.ts";

// Run the real route with external auth, storage and generation boundaries replaced.
const source = fs.readFileSync("src/app/api/events/[id]/card/edit/route.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const originalDetails = {
  eventTitle: "Livia is turning 10",
  eventDate: "2026-09-26",
  startTime: "15:00",
  endTime: "12:00",
  venueName: "Amc grand Boulevard",
  location: "Amc grand Boulevard",
  theme: "Birthday party",
  rsvpContact: "host@example.test",
};
const fields = { theme: "Add forgotten island movie them to it" };

function loadRoute({ userId = "owner", ownerId = "owner", generate } = {}) {
  const calls = { generations: [], uploads: [], writes: [], invalidated: [] };
  const item = { url: "https://assets.example.test/original.webp", details: originalDetails, data: {}, positions: { title: { x: 50 } } };
  const modules = {
    "next/server": { NextResponse: Response },
    "next-auth": { getServerSession: async () => ({ user: { id: userId } }) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => userId },
    "@/app/studio/studio-workspace-builders": {
      buildDeterministicScheduleLine: (details) => `${details.eventDate} ${details.startTime}`,
      refreshLiveCardInvitationData: (details) => ({ title: details.eventTitle, theme: {}, eventDetails: details }),
      buildStudioRequest: (details, mode, surface, editPrompt, url, previousDetails) => ({ details, mode, surface, editPrompt, url, previousDetails }),
      buildStudioPublishPayload: (nextItem, imageUrl) => ({ title: nextItem.details.eventTitle, data: { createdVia: "studio", studioCard: { imageUrl, eventDetails: nextItem.details } } }),
    },
    "@/app/studio/studio-workspace-sanitize": {
      createStudioMediaItemFromHistoryRow: () => item,
      sanitizeEventDetails: (details) => details,
    },
    "@/lib/dashboard-cache": { invalidateUserDashboard: (id) => calls.invalidated.push(`dashboard:${id}`) },
    "@/lib/history-cache": { invalidateUserHistory: (id) => calls.invalidated.push(`history:${id}`) },
    "@/lib/db": {
      getEventHistoryById: async () => ({ id: "event-id", user_id: ownerId, data: { createdVia: "concierge", ownership: "owned" } }),
      listShareRecipientUserIdsForEvent: async () => ["recipient"],
      updateEventHistoryTitle: async (id, title) => calls.writes.push({ id, title }),
      updateEventHistoryDataMerge: async (id, data) => { calls.writes.push({ id, data }); return { id, data }; },
    },
    "@/lib/media-upload": { processBufferUpload: async (upload) => { calls.uploads.push(upload); return { stored: { display: { url: "https://assets.example.test/saved.webp" } } }; } },
    "@/lib/studio/generate": { generateStudioInvitation: async (request) => { calls.generations.push(request); return generate(request); } },
    "@/lib/studio/card-edit-preview": { prepareCardEditPreviewImage, streamCardEditPreview },
    "@/utils/data-url": { parseDataUrlBase64 },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    exports: module.exports,
    module,
    Buffer,
    console,
    require: (specifier) => {
      assert.ok(modules[specifier], `Unexpected external dependency: ${specifier}`);
      return modules[specifier];
    },
  });
  const post = (body) => module.exports.POST(new Request("https://envitefy.test/api/events/event-id/card/edit", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
  }), { params: Promise.resolve({ id: "event-id" }) });
  return { post, calls };
}

test("the screenshot's theme prompt previews existing artwork and saves only the selected result", async () => {
  const png = await sharp({ create: { width: 1024, height: 1536, channels: 3, background: "#6757ff" } }).png().toBuffer();
  const { post, calls } = loadRoute({ generate: async () => ({ ok: true, imageDataUrl: `data:image/png;base64,${png.toString("base64")}`, warnings: [] }) });
  const previewResponse = await post({ action: "preview", fields });
  const preview = await previewResponse.json();
  assert.equal(preview.ok, true);
  assert.equal(preview.action, "preview");
  assert.match(preview.imageDataUrl, /^data:image\/webp;base64,/);
  assert.equal(calls.generations.length, 1);
  assert.equal(calls.generations[0].mode, "image");
  assert.equal(calls.generations[0].url, "https://assets.example.test/original.webp");
  assert.match(calls.generations[0].editPrompt, /User requested card change: Add forgotten island movie them to it/);
  assert.equal(preview.details.eventTitle, originalDetails.eventTitle);
  assert.equal(preview.details.rsvpContact, originalDetails.rsvpContact);
  assert.equal(calls.uploads.length, 0);
  assert.equal(calls.writes.length, 0, "Preview must leave the live event untouched");

  const saved = await (await post({ action: "save", fields, imageDataUrl: preview.imageDataUrl })).json();
  assert.equal(saved.ok, true);
  assert.equal(saved.imageUrl, "https://assets.example.test/saved.webp");
  assert.equal(calls.generations.length, 1, "Save must use the selected preview, not regenerate");
  assert.equal(calls.uploads[0].mimeType, "image/webp");
  assert.deepEqual(calls.uploads[0].bytes, Buffer.from(preview.imageDataUrl.split(",")[1], "base64"));
  assert.equal(calls.writes[1].data.createdVia, "concierge");
  assert.equal(calls.writes[1].data.ownership, "owned");
  assert.deepEqual(calls.invalidated.sort(), ["dashboard:owner", "dashboard:recipient", "history:owner", "history:recipient"]);
});

test("failed theme generation returns a readable streamed error and never changes the event", async () => {
  const { post, calls } = loadRoute({ generate: async () => ({ ok: false, errors: { image: { message: "Image service busy. Please try again.", status: 503 } } }) });
  const response = await post({ action: "preview", fields });
  const payload = await response.json();
  assert.match(payload.error, /Image service busy/);
  assert.notEqual(payload.ok, true);
  assert.equal(calls.writes.length, 0);
  assert.equal(calls.uploads.length, 0);
});

test("authorization is checked before starting generation or opening a stream", async () => {
  for (const [userId, expectedStatus] of [[null, 401], ["someone-else", 403]]) {
    const { post, calls } = loadRoute({ userId });
    const response = await post({ action: "preview", fields });
    assert.equal(response.status, expectedStatus);
    assert.equal(calls.generations.length, 0);
    assert.equal(calls.writes.length, 0);
  }
});
