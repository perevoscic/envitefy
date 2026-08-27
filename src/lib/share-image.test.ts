import assert from "node:assert/strict";
import test from "node:test";
import { resolveEventShareImage, toPublicShareMediaUrl } from "./share-image.ts";

test("toPublicShareMediaUrl moves event blobs outside the robots-blocked API namespace", () => {
  assert.equal(
    toPublicShareMediaUrl("/api/blob/event-media/upload-123/attachment/thumb.webp"),
    "/media/event-media/upload-123/attachment/thumb.webp",
  );
  assert.equal(
    toPublicShareMediaUrl(
      "https://envitefy.com/api/events/event-123/thumbnail?variant=hero&v=abc",
    ),
    "/media/events/event-123/thumbnail?variant=hero&v=abc",
  );
});

test("resolveEventShareImage substitutes the uncropped lightweight variant of uploaded artwork", () => {
  assert.deepEqual(
    resolveEventShareImage({
      coverImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
      thumbnail: "/api/blob/event-media/upload-123/attachment/display.webp",
      attachment: {
        dataUrl: "/api/blob/event-media/upload-123/attachment/source/invite.jpg",
        previewImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
        thumbnailUrl: "/api/blob/event-media/upload-123/attachment/thumb.webp",
        thumbnailWidth: 560,
        thumbnailHeight: 784,
        thumbnailMimeType: "image/webp",
        thumbnailSizeBytes: 91478,
      },
    }),
    {
      url: "/media/event-media/upload-123/attachment/thumb.webp",
      width: 560,
      height: 784,
      type: "image/webp",
      sizeBytes: 91478,
    },
  );
});

test("resolveEventShareImage preserves an explicitly designed cover", () => {
  assert.deepEqual(
    resolveEventShareImage({
      coverImageUrl: "/studio/final-invitation.webp",
      attachment: {
        previewImageUrl: "/api/blob/event-media/upload-123/attachment/display.webp",
        thumbnailUrl: "/api/blob/event-media/upload-123/attachment/thumb.webp",
      },
    }),
    {
      url: "/studio/final-invitation.webp",
      type: "image/webp",
    },
  );
});

test("resolveEventShareImage rejects inline data and malformed media URLs", () => {
  assert.equal(resolveEventShareImage({ coverImageUrl: "data:image/png;base64,abc" }), null);
  assert.equal(resolveEventShareImage({ coverImageUrl: "not-a-url" }), null);
});
