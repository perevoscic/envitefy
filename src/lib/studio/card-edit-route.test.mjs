import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import sharp from "sharp";
import { parseDataUrlBase64 } from "../../utils/data-url.ts";
import { prepareCardEditPreviewImage, streamCardEditPreview } from "./card-edit-preview.ts";
import * as cardRegistry from "./card-registry.ts";

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

function loadRoute({ userId = "owner", ownerId = "owner", generate, existingData = { createdVia: "concierge", ownership: "owned" }, details = originalDetails } = {}) {
  const calls = { generations: [], uploads: [], writes: [], invalidated: [] };
  const item = { url: "https://assets.example.test/original.webp", details, data: existingData.studioCard?.invitationData || {}, positions: { title: { x: 50 } } };
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
      getEventHistoryById: async () => ({ id: "event-id", user_id: ownerId, data: existingData }),
      listShareRecipientUserIdsForEvent: async () => ["recipient"],
      updateEventHistoryTitle: async (id, title) => calls.writes.push({ id, title }),
      updateEventHistoryDataMerge: async (id, data) => { calls.writes.push({ id, data }); return { id, data }; },
    },
    "@/lib/media-upload": { processBufferUpload: async (upload) => { calls.uploads.push(upload); return { stored: { display: { url: "https://assets.example.test/saved.webp" } } }; } },
    "@/lib/studio/generate": { generateStudioInvitation: async (request) => { calls.generations.push(request); return generate(request); } },
    "@/lib/studio/card-edit-preview": { prepareCardEditPreviewImage, streamCardEditPreview },
    "@/lib/studio/card-registry": cardRegistry,
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

const registryEvent = {
  title: "Ava and James wedding",
  status: "draft",
  timezone: "America/Chicago",
  startISO: "2026-10-10T16:30:00-05:00",
  createdVia: "concierge",
  ownership: "owned",
  rsvpEnabled: false,
  registryLink: "https://example.com/old-registry",
  registries: [
    { label: "Registry", url: "https://example.com/old-registry" },
    { label: "Wedding Website", url: "https://example.com/wedding" },
  ],
  conciergeDraft: { creationSessionId: "session-1", registryLink: "https://example.com/old-registry", giftRegistryLink: "https://example.com/old-registry" },
  studioCard: {
    imageUrl: "https://assets.example.test/original.webp",
    positions: { registry: { x: 12, y: 7 } },
    invitationData: {
      title: "Ava & James",
      heroTextMode: "image",
      eventDetails: { ...originalDetails, registryLink: "https://example.com/old-registry", rsvpEnabled: false, eventId: "event-id" },
    },
  },
};

test("registry edits preview and save the guest link without generating, uploading or republishing artwork", async () => {
  const details = registryEvent.studioCard.invitationData.eventDetails;
  const { post, calls } = loadRoute({ existingData: registryEvent, details });
  const fields = { registryLink: "example.com/new-registry" };
  const preview = await (await post({ action: "preview", fields })).json();
  assert.equal(preview.ok, true);
  assert.equal(preview.imageDataUrl, registryEvent.studioCard.imageUrl);
  assert.equal(preview.invitationData.eventDetails.registryLink, "https://example.com/new-registry");
  assert.equal(calls.writes.length, 0);

  const saved = await (await post({ action: "save", fields })).json();
  assert.equal(saved.ok, true);
  assert.equal(saved.imageUrl, registryEvent.studioCard.imageUrl);
  assert.equal(saved.invitationData.heroTextMode, "image");
  assert.equal(saved.invitationData.eventDetails.rsvpEnabled, false);
  assert.equal(saved.invitationData.eventDetails.eventId, "event-id");
  assert.equal(calls.generations.length, 0);
  assert.equal(calls.uploads.length, 0);
  assert.equal(calls.writes.length, 1);
  const patch = calls.writes[0].data;
  for (const key of ["title", "status", "timezone", "startISO", "createdVia", "ownership", "rsvpEnabled"]) {
    assert.equal(Object.hasOwn(patch, key), false, `${key} must remain unchanged`);
  }
  assert.equal(patch.conciergeDraft.registryLink, "https://example.com/new-registry");
  assert.equal(patch.conciergeDraft.giftRegistryLink, "https://example.com/new-registry");
  assert.deepEqual(patch.studioCard.positions, registryEvent.studioCard.positions);
  assert.deepEqual(patch.registries, [
    { label: "Registry", url: "https://example.com/new-registry" },
    { label: "Wedding Website", url: "https://example.com/wedding" },
  ]);
  assert.deepEqual(calls.invalidated.sort(), ["dashboard:owner", "dashboard:recipient", "history:owner", "history:recipient"]);
});

test("clearing the registry removes its button and saved aliases without removing other links", async () => {
  const { post, calls } = loadRoute({ existingData: registryEvent, details: registryEvent.studioCard.invitationData.eventDetails });
  const result = await (await post({ action: "save", fields: { registryLink: "" } })).json();
  assert.equal(result.ok, true);
  assert.equal(result.invitationData.eventDetails.registryLink, "");
  const patch = calls.writes[0].data;
  assert.equal(patch.registryLink, "");
  assert.equal(patch.giftRegistryLink, "");
  assert.equal(patch.conciergeDraft.registryLink, null);
  assert.equal(cardRegistry.readCardRegistryLink({ ...registryEvent, ...patch }), "");
  assert.deepEqual(patch.registries, [{ label: "Wedding Website", url: "https://example.com/wedding" }]);
  assert.equal(calls.uploads.length, 0);
});

test("invalid registry links and non-owner saves are rejected before any writes", async () => {
  for (const registryLink of ["javascript:alert(1)", "http://example.com/registry", "https://user:secret@example.com", "not a URL", false]) {
    const { post, calls } = loadRoute();
    const response = await post({ action: "save", fields: { registryLink } });
    assert.equal(response.status, 400);
    assert.equal(calls.writes.length, 0);
    assert.equal(calls.generations.length, 0);
  }
  for (const [userId, status] of [[null, 401], ["other", 403]]) {
    const { post, calls } = loadRoute({ userId });
    assert.equal((await post({ action: "save", fields: { registryLink: "https://example.com/registry" } })).status, status);
    assert.equal(calls.writes.length, 0);
  }
});
