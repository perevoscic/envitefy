import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveCoverImageUrlFromEventData,
  validateUploadFileMeta,
} from "./upload-config.ts";

test("validateUploadFileMeta accepts webp attachments and enforces header rules", () => {
  const image = validateUploadFileMeta({
    fileName: "flyer.webp",
    mimeType: "image/webp",
    sizeBytes: 1024,
    usage: "attachment",
  });
  assert.equal(image.ok, true);

  const headerPdf = validateUploadFileMeta({
    fileName: "header.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    usage: "header",
  });
  assert.equal(headerPdf.ok, false);
  assert.equal(headerPdf.status, 415);
});

test("validateUploadFileMeta enforces image and pdf size limits", () => {
  const oversizeImage = validateUploadFileMeta({
    fileName: "photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 11 * 1024 * 1024,
    usage: "attachment",
  });
  assert.equal(oversizeImage.ok, false);
  assert.equal(oversizeImage.status, 413);

  const oversizePdf = validateUploadFileMeta({
    fileName: "packet.pdf",
    mimeType: "application/pdf",
    sizeBytes: 26 * 1024 * 1024,
    usage: "attachment",
  });
  assert.equal(oversizePdf.ok, false);
  assert.equal(oversizePdf.status, 413);
});

test("resolveCoverImageUrlFromEventData prefers pdf preview urls over pdf source urls", () => {
  const cover = resolveCoverImageUrlFromEventData({
    attachment: {
      type: "application/pdf",
      dataUrl: "https://blob.example.com/source.pdf",
      previewImageUrl: "https://blob.example.com/display.webp",
      thumbnailUrl: "https://blob.example.com/thumb.webp",
    },
  });

  assert.equal(cover, "https://blob.example.com/display.webp");
});
