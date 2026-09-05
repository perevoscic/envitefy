import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STUDIO_SETTINGS } from "./types.ts";
import {
  MAX_STUDIO_UPLOAD_BYTES,
  parseStudioConversationPatch,
  parseStudioReferenceIds,
  parseStudioSettings,
  parseStudioTurn,
  requireStudioId,
  validateStudioUpload,
} from "./validation.ts";

const requestId = "10000000-0000-4000-8000-000000000001";

test("Reddit is a first-class platform and generation inputs use concrete settings", () => {
  const input = parseStudioTurn({
    clientRequestId: requestId,
    text: "  A warm image about easier party planning  ",
    settings: { ...DEFAULT_STUDIO_SETTINGS, platform: "reddit" },
    referenceAssetIds: [],
  });
  assert.equal(input.text, "A warm image about easier party planning");
  assert.equal(input.settings.platform, "reddit");
  assert.equal(input.parentVersionId, null);
  assert.equal(input.settings.output, "image");
});

test("selected production prompts survive save/generate without rewriting whitespace", () => {
  const override = `  Keep this exact prompt.\n\n${"a".repeat(9_000)}  `;
  const input = parseStudioTurn({
    clientRequestId: requestId,
    text: "Use this",
    settings: DEFAULT_STUDIO_SETTINGS,
    promptOverride: override,
  });
  assert.equal(input.promptOverride, override);
  assert.throws(() => parseStudioTurn({ ...input, promptOverride: "a".repeat(16_001) }), /16000/);
});

test("video format validation prevents unsupported square provider requests", () => {
  assert.throws(
    () => parseStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, output: "video" }),
    /portrait or landscape/,
  );
  assert.equal(
    parseStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, output: "video", format: "horizontal" })
      .format,
    "horizontal",
  );
  assert.throws(
    () => parseStudioSettings({ ...DEFAULT_STUDIO_SETTINGS, platform: "unknown" }),
    /Choose Instagram/,
  );
});

test("reference IDs are validated and deduplicated before durable requests", () => {
  assert.deepEqual(parseStudioReferenceIds([requestId, requestId]), [requestId]);
  assert.throws(() => parseStudioReferenceIds(["../../another-account.png"]), /Invalid reference/);
  const ids = Array.from(
    { length: 9 },
    (_, index) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  );
  assert.throws(() => parseStudioReferenceIds(ids), /up to 8/);
  assert.throws(() => requireStudioId("'; drop table users; --"), /Invalid ID/);
});

test("draft saves preserve in-progress whitespace and cannot select foreign-shaped IDs", () => {
  assert.deepEqual(
    parseStudioConversationPatch({ draft: "  Work in progress\n", ignored: "never saved" }),
    { draft: "  Work in progress\n" },
  );
  assert.throws(
    () => parseStudioConversationPatch({ selectedVersionId: "not-an-id" }),
    /Invalid version/,
  );
  assert.throws(() => parseStudioConversationPatch({ title: "  " }), /cannot be empty/);
});

test("reference uploads reject MIME spoofing, unsupported files, and excessive payloads", () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  validateStudioUpload(png, "image/png");
  validateStudioUpload(Buffer.from([255, 216, 255, 0]), "image/jpeg");
  validateStudioUpload(Buffer.from("RIFF0000WEBPdata"), "image/webp");
  assert.throws(() => validateStudioUpload(png, "image/jpeg"), /valid JPG/);
  assert.throws(() => validateStudioUpload(Buffer.from("<svg/>"), "image/svg+xml"), /valid JPG/);
  assert.throws(() => validateStudioUpload(Buffer.alloc(0), "image/png"), /25 MB/);
  assert.throws(
    () => validateStudioUpload(Buffer.alloc(MAX_STUDIO_UPLOAD_BYTES + 1), "image/png"),
    /25 MB/,
  );
});
