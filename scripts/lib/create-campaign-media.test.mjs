import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { resolveCampaignSourceImage } from "../../src/lib/campaign-media.ts";

test("campaign source adapter resolves owned image bytes only in the explicitly enabled development runtime", async () => {
  const previous = { mode: process.env.NODE_ENV, root: process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR };
  const base = path.resolve(".qa/create-campaign");
  await mkdir(base, { recursive: true });
  const root = await realpath(await mkdtemp(path.join(base, "media-adapter-test-")));
  await mkdir(path.join(root, "blobs"));
  const bytes = await readFile("public/favicon.ico").catch(() => Buffer.from("fixture"));
  await writeFile(path.join(root, "blobs", "image.webp"), bytes);
  await writeFile(
    path.join(root, ".campaign-runtime.json"),
    JSON.stringify({ kind: "envitefy-create-campaign", runtimeDir: root }),
  );
  try {
    process.env.NODE_ENV = "development";
    process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR = root;
    assert.deepEqual(await resolveCampaignSourceImage("/__campaign-media/image.webp"), {
      mimeType: "image/webp",
      data: bytes.toString("base64"),
    });
    for (const url of [
      "/__campaign-media/../.campaign-runtime.json",
      "/__campaign-media/%2e%2e%2f.campaign-runtime.json",
      "/__campaign-media/%5c..%5coutside.webp",
      "/__campaign-media/missing.webp",
      "/unrelated/image.webp",
    ])
      assert.equal(await resolveCampaignSourceImage(url), null);
    process.env.NODE_ENV = "production";
    assert.equal(await resolveCampaignSourceImage("/__campaign-media/image.webp"), null);
    process.env.NODE_ENV = "development";
    await writeFile(path.join(root, ".campaign-runtime.json"), JSON.stringify({ kind: "wrong" }));
    assert.equal(await resolveCampaignSourceImage("/__campaign-media/image.webp"), null);
  } finally {
    if (previous.mode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.mode;
    if (previous.root === undefined) delete process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR;
    else process.env.ENVITEFY_CAMPAIGN_RUNTIME_DIR = previous.root;
  }
});
