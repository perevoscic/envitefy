import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, readdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { put } from "@vercel/blob";
import { buildCampaignEnv, containedPath, requireLoopbackUrl, startCampaignStorage, startCampaignWebProxy } from "./create-campaign-environment.mjs";

test("campaign requires explicit local service boundaries", () => {
  assert.throws(() => requireLoopbackUrl("https://api.example.com/v1"), /loopback/);
  assert.throws(() => requireLoopbackUrl("http://user:pass@127.0.0.1:3107"), /loopback/);
  assert.throws(() => containedPath("C:/campaign", "../outside"), /inside/);
  assert.equal(requireLoopbackUrl("http://127.0.0.1:4318/v1").port, "4318");
});

test("campaign clears production credentials and preserves image quality settings", () => {
  const env = buildCampaignEnv({ sourceEnv: { DATABASE_URL: "postgresql://remote/production", GOOGLE_CLIENT_SECRET: "do-not-inherit", OPENAI_API_KEY: "real-key", SMTP_PASS: "real-password", BLOB_READ_WRITE_TOKEN: "real-token", STUDIO_OPENAI_IMAGE_QUALITY: "high", STUDIO_OPENAI_IMAGE_MODEL: "configured-model" },
    databaseUrl: "postgresql://envitefy_campaign:test@127.0.0.1:55439/envitefy_create_campaign", baseUrl: "http://127.0.0.1:3107", openaiBaseUrl: "http://127.0.0.1:4318/v1", gatewayToken: "local-token", runtimeDir: "/campaign/runtime", blobApiUrl: "http://127.0.0.1:4317", blobToken: "local-blob", authSecret: "ephemeral", appPort: 3108 });
  assert.equal(env.GOOGLE_CLIENT_SECRET, "");
  assert.equal(env.SMTP_PASS, "");
  assert.equal(env.OPENAI_API_KEY, "local-token");
  assert.equal(env.BLOB_READ_WRITE_TOKEN, "local-blob");
  assert.equal(env.STUDIO_OPENAI_IMAGE_QUALITY, "high");
  assert.equal(env.STUDIO_OPENAI_IMAGE_MODEL, "configured-model");
  assert.equal(env.STUDIO_PROVIDER, "openai");
  assert.equal(env.PORT, "3108");
});

test("real Blob SDK uploads only to owned disk storage and proxy serves the exact bytes", async () => {
  const runtimeDir = await mkdtemp(path.join(os.tmpdir(), "envitefy-campaign-"));
  const token = "vercel_blob_rw_campaign_testtoken";
  const previous = Object.fromEntries(["BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_API_URL", "VERCEL_BLOB_RETRIES"].map(key => [key, process.env[key]]));
  let storage; let proxy;
  try {
    storage = await startCampaignStorage({ runtimeDir, token, baseUrl: "http://127.0.0.1:3998", port: 0 });
    process.env.BLOB_READ_WRITE_TOKEN = token;
    process.env.VERCEL_BLOB_API_URL = storage.url;
    process.env.VERCEL_BLOB_RETRIES = "0";
    const bytes = Buffer.from("campaign-local-storage-smoke");
    const result = await put("event-media/test/fixture.webp", bytes, { access: "public", contentType: "image/webp", addRandomSuffix: false });
    assert.equal(result.url, "http://127.0.0.1:3998/__campaign-media/event-media/test/fixture.webp");
    assert.deepEqual(await readFile(path.join(storage.blobRoot, "event-media/test/fixture.webp")), bytes);
    proxy = await startCampaignWebProxy({ port: 3998, appPort: 3999, blobRoot: storage.blobRoot });
    const response = await fetch(result.url);
    assert.equal(response.headers.get("content-type"), "image/webp");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    const optimized = await fetch(`http://127.0.0.1:3998/_next/image?url=${encodeURIComponent("/__campaign-media/event-media/test/fixture.webp")}&w=640&q=75`);
    assert.equal(optimized.status, 200);
    assert.equal(optimized.headers.get("content-type"), "image/webp");
    assert.deepEqual(Buffer.from(await optimized.arrayBuffer()), bytes);
    const denied = await fetch(`${storage.url}/?pathname=../outside`, { method: "PUT", headers: { authorization: `Bearer ${token}` }, body: bytes });
    assert.equal(denied.status, 400);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await proxy?.stop(); await storage?.stop();
    await rm(runtimeDir, { recursive: true, force: true });
  }
});

test("mail capture requires owned dev runtime and writes composed message without SMTP", async () => {
  const campaignRoot = path.resolve(".qa/create-campaign");
  await mkdir(campaignRoot, { recursive: true });
  const runDir = await mkdtemp(path.join(campaignRoot, "capture-test-"));
  const runtimeDir = path.join(runDir, "runtime");
  const mailDir = path.join(runtimeDir, "mail");
  await mkdir(mailDir, { recursive: true });
  await writeFile(path.join(runtimeDir, ".campaign-runtime.json"), JSON.stringify({ kind: "envitefy-create-campaign", runtimeDir }));
  const keys = ["NODE_ENV", "ENVITEFY_CAMPAIGN_RUNTIME_DIR", "ENVITEFY_CAMPAIGN_MAIL_DIR", "SMTP_HOST"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  const { sendTransactionalEmail } = await import("../../src/lib/mail-transport.ts");
  try {
    Object.assign(process.env, { NODE_ENV: "development", ENVITEFY_CAMPAIGN_RUNTIME_DIR: runtimeDir, ENVITEFY_CAMPAIGN_MAIL_DIR: mailDir, SMTP_HOST: "must-never-connect.example.test" });
    const message = { from: "Envitefy <no-reply@envitefy.com>", to: "mom@create-campaign.example.test", subject: "Fixture confirmation", text: "Saved role: helper", html: "<p>Saved role: helper</p>" };
    await sendTransactionalEmail(message);
    const files = await readdir(mailDir);
    assert.equal(files.length, 1);
    const email = await readFile(path.join(mailDir, files[0]), "utf8");
    assert.match(email, /Subject: Fixture confirmation/);
    assert.match(email, /Saved role: helper/);
    process.env.NODE_ENV = "production";
    await assert.rejects(sendTransactionalEmail(message), /cannot run in production/);
    process.env.NODE_ENV = "development";
    process.env.ENVITEFY_CAMPAIGN_MAIL_DIR = runDir;
    await assert.rejects(sendTransactionalEmail(message), /owned runtime/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(runDir, { recursive: true, force: true });
  }
});
