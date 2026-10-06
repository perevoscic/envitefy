const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const load = require("./lib/event-messages-test-loader.cjs");

function functionUnderTest(file, names, globals) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const selected = source.statements.filter(
    (node) => ts.isFunctionDeclaration(node) && names.includes(node.name?.text),
  );
  assert.equal(selected.length, names.length);
  const text = selected
    .map((node) => node.getText(source).replace(/^export /, ""))
    .join("\n")
    .replaceAll(
      'createRequire(import.meta.url)("./lib/event-messages-test-loader.cjs")',
      "loadModule",
    );
  const code = ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  return new Function(...Object.keys(globals), "require", `${code}\nreturn {${names.join(",")}};`)(
    ...Object.values(globals),
    require,
  );
}

test("slug matching downloads only the selected event after a metadata query", async () => {
  const fetched = [];
  const { getEventHistoryByUserAndSlug } = functionUnderTest(
    "src/lib/db.ts",
    ["getEventHistoryByUserAndSlug"],
    {
      ensureEventPublicSlugSchema: async () => {},
      query: async (sql) => {
        assert.doesNotMatch(sql, /\bdata\b/i);
        return {
          rows: [
            { id: "wrong", title: "Another title" },
            { id: "right", title: "Garden party" },
          ],
        };
      },
      slugifyTitleForQuery: (title) => title.toLowerCase().replaceAll(" ", "-"),
      getEventHistoryById: async (id) => {
        fetched.push(id);
        return { id, data: { complete: true } };
      },
    },
  );
  assert.equal((await getEventHistoryByUserAndSlug("owner", "garden-party")).id, "right");
  assert.deepEqual(fetched, ["right"]);
  assert.equal(await getEventHistoryByUserAndSlug("owner", "absent"), null);
  assert.deepEqual(fetched, ["right"]);
});

test("new nested embedded images are rejected before a database write", async () => {
  const { assertPersistableEventMedia } = load("src/lib/event-media.ts");
  const { prepareEventHistoryData, updateEventHistoryDataMerge } = functionUnderTest(
    "src/lib/db.ts",
    ["prepareEventHistoryData", "updateEventHistoryDataMerge"],
    {
      sanitizeJsonValueForPostgres: (data) => structuredClone(data),
      assertPersistableEventMedia,
      normalizeCanonicalStartFields: () => {},
      ensureEventPublicSlugSchema: async () => {},
      query: () => {
        throw new Error("Unexpected database write");
      },
    },
  );
  const nested = { builderDraft: { event: { gymLayoutImage: "data:image/png;base64,secret" } } };
  assert.throws(() => prepareEventHistoryData(nested), /Upload media before saving/);
  await assert.rejects(updateEventHistoryDataMerge("event", nested), /Upload media before saving/);
});

test("card pages bind cursors and return a bounded page without fetching event JSON", async () => {
  const ids = [
    "00000000-0000-4000-8000-000000000003",
    "00000000-0000-4000-8000-000000000002",
    "00000000-0000-4000-8000-000000000001",
  ];
  const created_at = "2026-10-06T12:00:00.123456Z";
  const calls = [];
  const api = load("src/lib/history-page.ts", {
    "@/lib/db": {
      buildDashboardCoverImageUrlSql: () => "'https://assets.test/thumb.webp'",
      buildOwnedHistoryOwnershipSql: () => "to_jsonb('owned'::text)",
      buildOwnedHistoryStudioVisibilitySql: () => "true",
      query: async (sql, args) => {
        calls.push({ sql, args });
        return { rows: ids.map((id) => ({ id, title: "Title", created_at, data: {} })) };
      },
    },
  });
  const page = await api.listHistoryCardPage("owner", 2, null);
  assert.equal(page.items.length, 2);
  assert.equal(calls[0].args[1], 3);
  const cursor = api.decodeHistoryCursor(page.nextCursor);
  assert.deepEqual(cursor, { id: ids[1], createdAt: created_at });
  await api.listHistoryCardPage("owner", 2, cursor);
  assert.deepEqual(calls[1].args.slice(2), [created_at, ids[1], true]);
  assert.match(calls[0].sql, /c\.revoked_at IS NULL/);
  assert.match(calls[0].sql, /s\.revoked_at IS NULL/);
  assert.match(calls[0].sql, /jsonb_build_object/);
  assert.doesNotMatch(calls[0].sql, /eh\.data\s+(?:AS\s+)?data\b/i);
  for (const bad of [
    "garbage",
    Buffer.from(JSON.stringify({ id: ids[0], createdAt: "invalid" })).toString("base64url"),
  ]) {
    assert.throws(() => api.decodeHistoryCursor(bad), /Invalid history cursor/);
  }
});

test("private media checks the current owner before reading encrypted Blob bytes", async () => {
  const id = "00000000-0000-4000-8000-000000000001";
  const assetId = "00000000-0000-4000-8000-000000000002";
  let user = null;
  let reads = 0;
  let queries = 0;
  const api = load("src/app/api/events/[id]/private-media/[assetId]/route.ts", {
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => user },
    "@/lib/query-egress": { withQueryRoute: (_route, work) => work() },
    "@/lib/db": {
      query: async (sql, args) => {
        queries++;
        assert.match(sql, /AND user_id=\$2/);
        assert.match(sql, /privateMedia/);
        assert.equal(args[2], assetId);
        return {
          rows:
            user === "owner"
              ? [
                  {
                    asset: {
                      dataUrl: "https://assets.test/encrypted.bin",
                      type: "image/webp",
                      storageKind: "encrypted-blob",
                    },
                  },
                ]
              : [],
        };
      },
    },
    "@/lib/ocr/private-original": {
      scanOriginalKeyId: () => "configured-key",
      readScanOriginalBytes: async () => {
        reads++;
        return Buffer.from("ciphertext");
      },
      decryptScanOriginal: (_bytes, owner) => {
        assert.equal(owner, "owner");
        return Buffer.from("image");
      },
    },
  });
  const get = () =>
    api.GET(new Request("https://envitefy.com"), { params: Promise.resolve({ id, assetId }) });
  assert.equal((await get()).status, 401);
  assert.equal(queries, 0);
  user = "other";
  assert.equal((await get()).status, 404);
  assert.equal(reads, 0);
  user = "owner";
  const response = await get();
  assert.equal(await response.text(), "image");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  user = "other";
  assert.equal((await get()).status, 404);
  assert.equal(reads, 1);
});

test("migration dry-run is read-only and never loads the upload pipeline", async () => {
  const statements = [];
  const logs = [];
  const { main } = functionUnderTest("scripts/transport-event-media-to-blob.ts", ["main"], {
    parseArgs: () => ({ apply: false }),
    process: {
      argv: [],
      env: { DATABASE_URL: "postgres://postgres.ycrswjpgoihaoigzkvxd:unused@db.test/db" },
    },
    createPoolFromEnv: () => ({
      options: {},
      connect: async () => ({
        query: async (sql) => {
          statements.push(sql);
          return { rows: sql === "AUDIT" ? [{ id: "one", bytes: 20 }] : [] };
        },
        release: () => {},
      }),
      end: async () => {},
    }),
    INLINE_MEDIA_AUDIT_SQL: "AUDIT",
    console: { log: (value) => logs.push(JSON.parse(value)) },
    loadModule: () => {
      throw new Error("Dry-run must never load upload dependencies");
    },
  });
  await main();
  assert.deepEqual(statements, [
    "BEGIN READ ONLY",
    "SET LOCAL statement_timeout=20000",
    "AUDIT",
    "ROLLBACK",
  ]);
  assert.equal(logs[0].records, 1);
  assert.equal(logs[0].embeddedBytes, 20);
});

test("public discovery persistence uploads copied nested images once and refuses private media", async () => {
  let uploads = 0;
  const { storePublicEventMedia } = load("src/lib/public-event-media-storage.ts", {
    "./ocr/scan-media": { resolveScanMediaPolicy: (data) => ({ medical: data.medical === true }) },
    "./media-upload": {
      processBufferUpload: async () => {
        uploads++;
        return { stored: { display: { url: "https://assets.test/layout.webp" } } };
      },
    },
  });
  const inline = "data:image/webp;base64,YWJj";
  const data = { builderDraft: { layout: inline, event: { layout: inline } } };
  const stored = await storePublicEventMedia(data, "event");
  assert.equal(uploads, 1);
  assert.equal(stored.builderDraft.layout, "https://assets.test/layout.webp");
  assert.equal(data.builderDraft.layout, inline);
  await assert.rejects(
    storePublicEventMedia({ ...data, medical: true }, "event"),
    /Private inline media/,
  );
  await assert.rejects(
    storePublicEventMedia({ ...data, accessControl: { requirePasscode: true } }, "event"),
    /Private inline media/,
  );
  assert.equal(uploads, 1);
});

test("medical migration verifies the deployed encryption key before uploading", async () => {
  const { inlineMediaPlan } = load("scripts/lib/event-media-migration.ts");
  let uploads = 0;
  const { migrateRow } = functionUnderTest(
    "scripts/transport-event-media-to-blob.ts",
    ["migrateRow"],
    {
      inlineMediaPlan,
      randomUUID: () => "asset-id",
      fetch: async () =>
        new Response(null, {
          status: 401,
          headers: { "X-Event-Media-Version": "1", "X-Event-Media-Key-Id": "different-key" },
        }),
      loadModule: (module) => {
        if (module.endsWith("scan-media.ts"))
          return { resolveScanMediaPolicy: () => ({ medical: true }) };
        if (module.endsWith("event-draft-access.ts")) return { isEventDraft: () => false };
        if (module.endsWith("private-original.ts")) return { scanOriginalKeyId: () => "local-key" };
        uploads++;
        throw new Error("Upload should not run");
      },
    },
  );
  await assert.rejects(
    migrateRow(
      {
        id: "event",
        user_id: "owner",
        title: "Medical",
        data: { thumbnail: "data:image/webp;base64,YWJj" },
      },
      "https://envitefy.com",
    ),
    /encryption keys differ/,
  );
  assert.equal(uploads, 0);
});

test("migration refuses a concurrent edit instead of replacing the changed event", async () => {
  const row = {
    id: "event",
    user_id: "owner",
    data_signature: "old",
    data: { thumbnail: "inline" },
  };
  const { main } = functionUnderTest("scripts/transport-event-media-to-blob.ts", ["main"], {
    parseArgs: () => ({
      apply: true,
      backupDir: "output/media-backups",
      excludeUserIds: [],
      limit: 200,
    }),
    process: {
      argv: [],
      env: { DATABASE_URL: "postgres://postgres.ycrswjpgoihaoigzkvxd:unused@db.test/db" },
    },
    path,
    fs: { mkdir: async () => {}, writeFile: async () => {} },
    loadModule: () => ({
      encryptScanOriginal: (bytes) => bytes,
      decryptScanOriginal: (bytes) => bytes,
    }),
    createPoolFromEnv: () => ({
      options: {},
      query: async (sql, args) => {
        if (/^select id, user_id/.test(sql.trim())) return { rows: [row] };
        assert.match(sql, /and md5\(data::text\) = \$3/);
        assert.equal(args[2], "old");
        return { rows: [], rowCount: 0 };
      },
      end: async () => {},
    }),
    readCursorAnchor: async () => null,
    migrateRow: async () => ({
      eventId: "event",
      changed: true,
      nextData: { thumbnail: "https://assets.test/image.webp" },
      unsupportedFields: [],
    }),
  });
  await assert.rejects(main(), /Event changed during migration; original retained/);
});

test("nested migration deduplicates verified uploads and retains input on verification failure", async () => {
  const sharp = require("sharp");
  const bytes = await sharp({ create: { width: 2, height: 3, channels: 3, background: "red" } })
    .webp()
    .toBuffer();
  const inline = `data:image/webp;base64,${bytes.toString("base64")}`;
  let uploads = 0;
  let corrupt = false;
  const media = load("src/lib/event-media.ts");
  const { inlineMediaPlan } = load("scripts/lib/event-media-migration.ts");
  const { parseDataUrlBase64 } = load("src/utils/data-url.ts");
  const globals = {
    ...media,
    inlineMediaPlan,
    parseDataUrlBase64,
    randomUUID: require("node:crypto").randomUUID,
    loadModule: (module) => {
      if (module.endsWith("scan-media.ts")) return { resolveScanMediaPolicy: () => null };
      if (module.endsWith("event-draft-access.ts")) return { isEventDraft: () => false };
      if (module.endsWith("private-original.ts"))
        return { readScanOriginalBytes: async () => (corrupt ? Buffer.from("broken") : bytes) };
      return {
        processBufferUpload: async () => {
          uploads++;
          return {
            stored: {
              display: {
                url: "https://assets.test/verified.webp",
                mimeType: "image/webp",
                width: 2,
                height: 3,
                sizeBytes: bytes.length,
              },
            },
            eventMedia: {},
          };
        },
      };
    },
  };
  const { migrateRow } = functionUnderTest(
    "scripts/transport-event-media-to-blob.ts",
    ["migrateRow", "cloneData", "shouldSkipValue", "sanitizeFileName", "extensionForMimeType"],
    globals,
  );
  const row = {
    id: "event",
    user_id: "owner",
    title: "Title",
    data: { builderDraft: { layout: inline, event: { layout: inline } } },
  };
  const migrated = await migrateRow(row, null);
  assert.equal(uploads, 1);
  assert.equal(migrated.unsupportedFields.length, 0);
  assert.equal(media.findTransientEventMedia(migrated.nextData).length, 0);
  assert.equal(row.data.builderDraft.layout, inline);
  corrupt = true;
  const failed = await migrateRow(row, null);
  assert.ok(failed.unsupportedFields.length > 0);
  assert.equal(row.data.builderDraft.layout, inline);
});

test("attachment migration preserves exact original bytes and filename beside a verified public WebP", async () => {
  const sharp = require("sharp");
  const image = sharp({ create: { width: 2, height: 3, channels: 3, background: "red" } });
  const original = await image.clone().png().toBuffer();
  const display = await image.clone().webp().toBuffer();
  const media = load("src/lib/event-media.ts");
  const { inlineMediaPlan } = load("scripts/lib/event-media-migration.ts");
  const { parseDataUrlBase64 } = load("src/utils/data-url.ts");
  let uploadedOriginal;
  let uploadedName;
  const { migrateRow } = functionUnderTest("scripts/transport-event-media-to-blob.ts", ["migrateRow", "cloneData", "shouldSkipValue", "sanitizeFileName", "extensionForMimeType"], {
    ...media, inlineMediaPlan, parseDataUrlBase64, randomUUID: require("node:crypto").randomUUID,
    fetch: async () => new Response(null, { status: 401, headers: { "X-Event-Media-Version": "1", "X-Event-Media-Key-Id": "same-key" } }),
    loadModule: module => {
      if (module.endsWith("scan-media.ts")) return { resolveScanMediaPolicy: () => null };
      if (module.endsWith("event-draft-access.ts")) return { isEventDraft: () => false };
      if (module.endsWith("private-original.ts")) return {
        scanOriginalKeyId: () => "same-key",
        processPrivateScanUpload: async (file, owner) => {
          assert.equal(owner, "owner"); uploadedOriginal = Buffer.from(await file.arrayBuffer()); uploadedName = file.name;
          return { eventMedia: { attachment: { name: file.name, type: file.type, dataUrl: "https://assets.test/encrypted.bin", storageKind: "encrypted-blob" } } };
        },
        readScanOriginalBytes: async url => url.endsWith("encrypted.bin") ? Buffer.from("ciphertext") : display,
        decryptScanOriginal: (_bytes, owner) => { assert.equal(owner, "owner"); return uploadedOriginal; },
      };
      return { processBufferUpload: async params => {
        assert.equal(params.usage, "header");
        return { stored: { display: { url: "https://assets.test/display.webp", mimeType: "image/webp", width: 2, height: 3, sizeBytes: display.length } }, eventMedia: {} };
      } };
    },
  });
  const result = await migrateRow({ id: "event", user_id: "owner", title: "Flyer", data: { attachment: { name: "original-test.png", type: "image/png", dataUrl: `data:image/png;base64,${original.toString("base64")}` } } }, "https://envitefy.com");
  assert.deepEqual(uploadedOriginal, original); assert.equal(uploadedName, "original-test.png");
  assert.equal(result.unsupportedFields.length, 0);
  assert.equal(result.nextData.attachment.storageKind, "encrypted-blob");
  assert.equal(result.nextData.attachment.type, "image/png");
  assert.equal(result.nextData.thumbnail, "https://assets.test/display.webp");
  assert.equal(media.findTransientEventMedia(result.nextData).length, 0);
});
