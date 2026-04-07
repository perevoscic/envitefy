import assert from "node:assert/strict";
import test from "node:test";

import {
  collectAppOwnedBlobUrls,
  findInlineEventMedia,
  findTransientEventMedia,
  setValueAtPath,
} from "./event-media.ts";

test("findTransientEventMedia inspects nested fields and gallery items", () => {
  const data = {
    thumbnail: "data:image/png;base64,abc",
    customHeroImage: "blob:http://localhost/123",
    signupForm: {
      header: {
        images: [
          {
            dataUrl: "data:image/webp;base64,signup",
          },
        ],
      },
    },
    gallery: [
      { url: "https://example.public.blob.vercel-storage.com/event-media/1/header/display.webp" },
      { preview: "data:image/jpeg;base64,def" },
    ],
  };

  const issues = findTransientEventMedia(data).map((issue) => issue.fieldPath);
  assert.deepEqual(issues, [
    "thumbnail",
    "customHeroImage",
    "gallery[1].preview",
    "signupForm.header.images[0].dataUrl",
  ]);

  const blobUrls = collectAppOwnedBlobUrls(data);
  assert.deepEqual(blobUrls, [
    "https://example.public.blob.vercel-storage.com/event-media/1/header/display.webp",
  ]);
});

test("findInlineEventMedia reports inline paths and setValueAtPath updates them", () => {
  const data: any = {
    images: {
      hero: "data:image/webp;base64,xyz",
    },
  };

  const issues = findInlineEventMedia(data);
  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.fieldPath, "images.hero");
  assert.equal(issues[0]?.mimeType, "image/webp");

  setValueAtPath(data, ["images", "hero"], "https://blob.example.com/event-media/hero.webp");
  assert.equal(data.images.hero, "https://blob.example.com/event-media/hero.webp");
});

test("findTransientEventMedia and collectAppOwnedBlobUrls include sponsor logos", () => {
  const data = {
    sponsors: [
      { logo: "blob:http://localhost/sponsor-logo" },
      { logo: "https://example.public.blob.vercel-storage.com/event-media/1/header/display.webp" },
    ],
  };

  const issues = findTransientEventMedia(data).map((issue) => issue.fieldPath);
  assert.deepEqual(issues, ["sponsors[0].logo"]);

  const blobUrls = collectAppOwnedBlobUrls(data);
  assert.deepEqual(blobUrls, [
    "https://example.public.blob.vercel-storage.com/event-media/1/header/display.webp",
  ]);
});

test("collectAppOwnedBlobUrls normalizes app blob proxy urls to blob pathnames", () => {
  const data = {
    attachment: {
      dataUrl: "https://envitefy.com/api/blob/event-media/upload-123/attachment/source.pdf",
      previewImageUrl:
        "https://envitefy.com/api/blob/event-media/upload-123/attachment/display.webp",
    },
  };

  const blobUrls = collectAppOwnedBlobUrls(data);
  assert.deepEqual(blobUrls, [
    "event-media/upload-123/attachment/source.pdf",
    "event-media/upload-123/attachment/display.webp",
  ]);
});
