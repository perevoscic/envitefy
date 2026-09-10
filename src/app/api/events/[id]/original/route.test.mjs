import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import sharp from "sharp";
import ts from "typescript";
import { canReadEventDraft } from "../../../../../lib/event-draft-access.ts";
import * as displayState from "../../../../../lib/ocr/original-display-state.ts";
import { resolveScanMediaPolicy } from "../../../../../lib/ocr/scan-media.ts";

function harness(
  userId,
  {
    medical = true,
    encrypted = true,
    draftDenied = false,
    passcode = false,
    sourceBytes = Buffer.from("exact original"),
    type = "image/png",
    pdfPage = null,
    displayBytes = Buffer.from("smaller webp"),
    displayFails = false,
  } = {},
) {
  const h = {
    viewerId: userId,
    reads: 0,
    eventReads: 0,
    sessionReads: 0,
    decrypts: 0,
    pdfPages: [],
    deferred: [],
    generated: 0,
    sources: [],
  };
  const row = {
    id: "event",
    user_id: "owner",
    title: medical ? "ENT appointment" : "Birthday party",
    data: {
      createdVia: "ocr",
      status: draftDenied ? "draft" : "published",
      accessControl: { requirePasscode: passcode },
      attachment: {
        name: "original.png",
        type,
        storageKind: encrypted ? "encrypted-blob" : "blob",
        dataUrl: "https://test.public.blob.vercel-storage.com/original",
      },
    },
  };
  h.row = row;
  const mocks = {
    "next/server": { after: (job) => h.deferred.push(job) },
    "@/lib/ocr/original-display-state": displayState,
    "@/lib/ocr/original-display": { generateSavedScanDisplay: async () => h.generated++ },
    sharp: { default: sharp },
    "@/lib/pdf-raster": {
      rasterizePdfPageToPng: async (bytes, page) => {
        assert.deepEqual(bytes, sourceBytes);
        h.pdfPages.push(page);
        return pdfPage;
      },
    },
    "next-auth": {
      getServerSession: async () => {
        h.sessionReads++;
        return {};
      },
    },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => h.viewerId },
    "@/lib/db": {
      getEventHistoryById: async () => {
        h.eventReads++;
        return h.row;
      },
      resolveEventHistoryIdentityBySlugOrId: async () => ({ id: row.id }),
      getEventHistoryMediaDataUrlById: async () => {
        h.reads++;
        return "source";
      },
    },
    "@/lib/event-draft-access-server": {
      guardDraftRequest: async () =>
        draftDenied ? new Response("Not found", { status: 404 }) : null,
    },
    "@/lib/event-draft-access": { canReadEventDraft },
    "@/lib/ocr/scan-media": { resolveScanMediaPolicy },
    "@/lib/ocr/private-original": {
      readScanOriginalBytes: async (url) => {
        h.reads++;
        h.sources.push(url);
        if (url.endsWith("display.bin")) {
          if (displayFails) throw new Error("Storage unavailable");
          return displayBytes;
        }
        return sourceBytes;
      },
      decryptScanOriginal: (bytes, owner) => {
        assert.equal(owner, "owner");
        h.decrypts++;
        return bytes;
      },
    },
    "@/lib/media-response": { buildMediaResponse: () => new Response("image") },
  };
  function load(path) {
    const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      require: (name) => mocks[name],
      Response,
      URL,
      Uint8Array,
      console,
    });
    return module.exports.GET;
  }
  return Object.assign(h, {
    original: load("./route.ts"),
    thumbnail: load("../thumbnail/route.ts"),
    context: { params: Promise.resolve({ id: "event" }) },
  });
}

test("anonymous users and nonowners cannot read medical originals through any thumbnail variant", async () => {
  for (const user of [null, "guest"]) {
    const h = harness(user);
    assert.equal(
      (await h.original(new Request("https://envitefy.test/original"), h.context)).status,
      404,
    );
    assert.equal(
      (await h.original(new Request("https://envitefy.test/original?preview=1"), h.context)).status,
      404,
    );
    for (const variant of ["", "attachment", "thumbnail", "hero", "profile", "signup-header"]) {
      assert.equal(
        (
          await h.thumbnail(
            { nextUrl: new URL(`https://envitefy.test/thumbnail?variant=${variant}`) },
            h.context,
          )
        ).status,
        404,
      );
    }
    assert.equal(h.reads, 0);
    assert.equal(h.decrypts, 0);
  }
});

test("photo and PDF thumbnails stay private, contain the complete page, and preserve downloads", async () => {
  const png = await sharp({
    create: { width: 900, height: 1600, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  for (const type of ["image/png", "application/pdf"]) {
    const sourceBytes = type === "image/png" ? png : Buffer.from("exact PDF bytes");
    const h = harness("owner", { type, sourceBytes, pdfPage: png });
    const response = await h.original(
      new Request("https://envitefy.test/original?preview=1"),
      h.context,
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 450);
    assert.equal(metadata.height, 800);
    assert.deepEqual(h.pdfPages, type === "application/pdf" ? [0] : []);
    const download = await h.original(
      new Request("https://envitefy.test/original?preview=1&download=1"),
      h.context,
    );
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), sourceBytes);
    assert.match(download.headers.get("content-disposition"), /^attachment/);
  }
});

test("owner View and Download return exact bytes with private caching and correct disposition", async () => {
  const h = harness("owner");
  for (const download of [false, true]) {
    const response = await h.original(
      new Request(`https://envitefy.test/original${download ? "?download=1" : ""}`),
      h.context,
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "exact original");
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.match(response.headers.get("content-disposition"), download ? /^attachment/ : /^inline/);
  }
  assert.equal(h.decrypts, 2);
  assert.equal(h.eventReads, 2, "each request reads the event only once");
  assert.equal(h.sessionReads, 2, "each request resolves the session only once");
});

test("draft owners can still view their exact original", async () => {
  const h = harness("owner", { draftDenied: true });
  const response = await h.original(new Request("https://envitefy.test/original"), h.context);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "exact original");
  assert.equal(h.eventReads, 1);
});

test("previously loaded originals still require current ownership and an existing event", async () => {
  const h = harness("owner");
  const request = new Request("https://envitefy.test/original");
  assert.equal((await h.original(request, h.context)).status, 200);
  for (const viewer of ["guest", null]) {
    h.viewerId = viewer;
    assert.equal((await h.original(request, h.context)).status, 404);
  }
  h.viewerId = "owner";
  h.row = null;
  assert.equal((await h.original(request, h.context)).status, 404);
  assert.equal(h.reads, 1, "unauthorized requests must not reach the cached storage reader");
  assert.equal(h.eventReads, 4, "cached media must not bypass a fresh event lookup");
});

test("original access preserves nonmedical invitations and respects draft/passcode restrictions", async () => {
  const request = new Request("https://envitefy.test/original");
  const invitation = harness(null, { medical: false, encrypted: false });
  assert.equal((await invitation.original(request, invitation.context)).status, 200);
  for (const options of [
    { medical: false, encrypted: true },
    { medical: false, encrypted: false, draftDenied: true },
    { medical: false, encrypted: false, passcode: true },
  ]) {
    const denied = harness(null, options);
    assert.equal((await denied.original(request, denied.context)).status, 404);
    assert.equal(denied.reads, 0);
  }
});

function readyCopy(h) {
  h.row.data.attachment.displayCopy = {
    version: 1,
    status: "ready",
    sourceUrl: h.row.data.attachment.dataUrl,
    dataUrl: "https://test.public.blob.vercel-storage.com/display.bin",
    type: "image/webp",
    storageKind: "encrypted-blob",
  };
}

test("WebP viewing reads only the encrypted derivative, while downloads still return exact originals", async () => {
  const h = harness("owner");
  readyCopy(h);
  const view = await h.original(new Request("https://envitefy.test/original?display=1"), h.context);
  assert.equal(view.headers.get("content-type"), "image/webp");
  assert.equal(view.headers.get("x-document-variant"), "display");
  assert.equal(view.headers.get("cache-control"), "private, no-store");
  assert.equal(await view.text(), "smaller webp");
  assert.equal(h.sources.length, 1);
  assert.match(h.sources[0], /display.bin$/);
  const download = await h.original(
    new Request("https://envitefy.test/original?display=1&download=1"),
    h.context,
  );
  assert.equal(await download.text(), "exact original");
  assert.match(download.headers.get("content-disposition"), /^attachment/);
  for (const user of [null, "guest"]) {
    h.viewerId = user;
    assert.equal(
      (await h.original(new Request("https://envitefy.test/original?display=1"), h.context)).status,
      404,
    );
  }
  assert.equal(h.reads, 2);
});

test("missing and stale display copies defer conversion and immediately fall back to the source", async () => {
  for (const stale of [false, true]) {
    const h = harness("owner");
    if (stale) {
      readyCopy(h);
      h.row.data.attachment.displayCopy.sourceUrl = "old upload";
    }
    const response = await h.original(
      new Request("https://envitefy.test/original?display=1"),
      h.context,
    );
    assert.equal(await response.text(), "exact original");
    assert.equal(response.headers.get("x-document-variant"), "original");
    assert.equal(h.generated, 0, "conversion must not run in the response path");
    assert.equal(h.deferred.length, 1);
    await h.deferred[0]();
    assert.equal(h.generated, 1);
  }
});

test("derivative storage failure falls back to the original and PDFs are never queued for image conversion", async () => {
  const h = harness("owner", { displayFails: true });
  readyCopy(h);
  assert.equal(
    await (
      await h.original(new Request("https://envitefy.test/original?display=1"), h.context)
    ).text(),
    "exact original",
  );
  const pdf = harness("owner", { type: "application/pdf" });
  assert.equal(
    await (
      await pdf.original(new Request("https://envitefy.test/original?display=1"), pdf.context)
    ).text(),
    "exact original",
  );
  assert.equal(pdf.deferred.length, 0);
});
