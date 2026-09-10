import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { resolveScanMediaPolicy } from "../../../../lib/ocr/scan-media.ts";

function harness(viewer, medical = true) {
  const h = { reads: 0 };
  const mocks = {
    "@vercel/blob": {
      get: async () => {
        h.reads++;
        return {
          statusCode: 200,
          stream: "image bytes",
          headers: new Headers({
            "cache-control": "public, max-age=31536000",
            "content-type": "image/webp",
          }),
        };
      },
    },
    "next-auth": { getServerSession: async () => ({}) },
    "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => viewer },
    "@/lib/db": {
      query: async () => ({
        rows: [
          {
            user_id: "owner",
            title: medical ? "ENT appointment" : "Birthday party",
            data: { createdVia: "ocr" },
          },
        ],
      }),
    },
    "@/lib/ocr/scan-media": { resolveScanMediaPolicy },
  };
  const source = ts.transpileModule(readFileSync(new URL("./route.ts", import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) => mocks[name],
    Response,
    Headers,
    console,
  });
  return Object.assign(h, module.exports, {
    context: {
      params: Promise.resolve({ path: ["event-media", "upload-id", "attachment", "display.webp"] }),
    },
  });
}

test("legacy medical source proxy blocks guests even with the exact old image URL", async () => {
  for (const viewer of [null, "other"]) {
    const h = harness(viewer);
    assert.equal((await h.GET(null, h.context)).status, 404);
    assert.equal(h.reads, 0);
  }
  const owner = harness("owner");
  const response = await owner.GET(null, owner.context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("designed invitations remain readable and ciphertext cannot use the public proxy", async () => {
  const invitation = harness(null, false);
  assert.equal((await invitation.GET(null, invitation.context)).status, 200);
  assert.equal(
    (
      await invitation.GET(null, {
        params: Promise.resolve({ path: ["private-scan-originals", "source.bin"] }),
      })
    ).status,
    404,
  );
  assert.equal(invitation.reads, 1);
});
