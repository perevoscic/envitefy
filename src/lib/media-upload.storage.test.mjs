import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import sharp from "sharp";
import ts from "typescript";

const require = createRequire(import.meta.url);
function harness() {
  const uploads = [];
  const source = readFileSync(new URL("./media-upload.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports, Buffer,
    console: { log() {} },
    require: (specifier) => specifier === "@vercel/blob" ? {
      put: async (pathname, bytes, options) => {
        uploads.push({ pathname, bytes, options });
        return { pathname, url: `https://assets.example.test/${pathname}` };
      },
    } : specifier === "./pdf-raster.ts" ? {
      rasterizePdfPageToPng: () => { throw new Error("Unexpected PDF in image test"); },
    } : require(specifier),
  });
  return { ...module.exports, uploads };
}
async function fixture(format, width = 160, height = 100) {
  return sharp({ create: { width, height, channels: 4, background: { r: 65, g: 120, b: 170, alpha: 0.4 } } })
    .toFormat(format).toBuffer();
}

test("PNG/JPEG attachments upload only two WebPs and return matching names, types, sizes and source URLs", async () => {
  for (const format of ["png", "jpeg"]) {
    const h = harness();
    const input = await fixture(format);
    const result = await h.processBufferUpload({ bytes: input, fileName: `invite.${format}`, mimeType: `image/${format}`, usage: "attachment", uploadToken: "upload-test" });
    assert.equal(h.uploads.length, 2);
    for (const item of h.uploads) {
      assert.match(item.pathname, /\.webp$/);
      assert.equal(item.options.contentType, "image/webp");
      assert.equal((await sharp(item.bytes).metadata()).format, "webp");
      await sharp(item.bytes, { failOn: "warning" }).raw().toBuffer();
    }
    assert.equal(result.stored.source.url, result.stored.display.url);
    assert.equal(result.stored.source.mimeType, "image/webp");
    assert.equal(result.eventMedia.attachment.name, "invite.webp");
    assert.equal(result.eventMedia.attachment.type, "image/webp");
    assert.equal(result.eventMedia.attachment.sizeBytes, h.uploads[0].bytes.length);
    assert.equal(result.eventMedia.attachment.originalName, `invite.${format}`);
    assert.equal(result.stored.source.width, 160);
    assert.equal(result.stored.source.height, 100);
    if (format === "png") assert.equal((await sharp(h.uploads[0].bytes).metadata()).hasAlpha, true);
  }
});

test("large images retain full-resolution WebP for source/download without a PNG copy", async () => {
  const h = harness();
  const result = await h.processBufferUpload({ bytes: await fixture("png", 3000, 800), fileName: "poster.png", usage: "header" });
  assert.equal(h.uploads.length, 3);
  assert.equal(result.stored.display.width, 2400);
  assert.equal(result.stored.source.width, 3000);
  assert.equal(result.stored.source.height, 800);
  assert.match(result.stored.source.url, /\/source\.webp$/);
  assert.ok(h.uploads.every(item => item.options.contentType === "image/webp"));
});

test("EXIF-rotated JPEGs preserve the visible orientation in the saved source metadata", async () => {
  const h = harness();
  const bytes = await sharp(await fixture("jpeg", 120, 80)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const result = await h.processBufferUpload({ bytes, fileName: "phone.JPG", usage: "attachment" });
  assert.equal(result.stored.source.width, 80);
  assert.equal(result.stored.source.height, 120);
  assert.equal(h.uploads.length, 2);
});

test("binary and email upload entry points also convert PNG/JPEG before storing", async () => {
  for (const access of ["Public", "Private"]) {
    const h = harness();
    const uploaded = await h[`upload${access}BinaryAsset`]({ bytes: await fixture("png"), pathname: "event-media/email/header/Image.PNG", contentType: "image/png" });
    assert.equal(h.uploads.length, 1);
    assert.equal(uploaded.pathname, "event-media/email/header/Image.webp");
    assert.equal(h.uploads[0].options.contentType, "image/webp");
    assert.equal(uploaded.sizeBytes, h.uploads[0].bytes.length);
  }
});

test("invalid images fail before any Blob writes; non-image binaries pass through", async () => {
  const h = harness();
  await assert.rejects(h.processBufferUpload({ bytes: Buffer.from("broken png"), fileName: "broken.png", usage: "header" }));
  assert.equal(h.uploads.length, 0);
  const bytes = Buffer.from("EVS1 encrypted original document");
  const result = await h.uploadPublicBinaryAsset({ bytes, pathname: "private-scan-originals/example.bin", contentType: "application/octet-stream" });
  assert.equal(result.pathname, "private-scan-originals/example.bin");
  assert.equal(h.uploads[0].bytes, bytes);
});

test("already-verified WebPs are reused without another lossy conversion", async () => {
  const h = harness();
  const bytes = await fixture("webp");
  const result = await h.processBufferUpload({ bytes, fileName: "invite.webp", mimeType: "image/webp", usage: "header" });
  assert.equal(h.uploads.length, 2);
  assert.deepEqual(h.uploads[0].bytes, bytes);
  assert.equal(result.stored.source.url, result.stored.display.url);
});

test("encoder failures stop uploads instead of falling back to storing PNG originals", async () => {
  const previous = process.env.IMAGE_FFMPEG_PATH;
  process.env.IMAGE_FFMPEG_PATH = "/nonexistent/envitefy-test-ffmpeg";
  try {
    const h = harness();
    await assert.rejects(h.uploadPublicBinaryAsset({ bytes: await fixture("png"), pathname: "event-media/test/header/original.png", contentType: "image/png" }));
    assert.equal(h.uploads.length, 0);
  } finally {
    if (previous === undefined) delete process.env.IMAGE_FFMPEG_PATH;
    else process.env.IMAGE_FFMPEG_PATH = previous;
  }
});
