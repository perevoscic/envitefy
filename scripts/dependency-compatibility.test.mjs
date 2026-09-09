import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import nodemailer from "nodemailer";
import sharp from "sharp";

const require = createRequire(import.meta.url);

test("updated mailer composes the SMTP message fields used by the app without sending mail", async () => {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const info = await transport.sendMail({
    from: "Envitefy <no-reply@example.com>",
    to: "guest@example.com",
    replyTo: "host@example.com",
    subject: "Your event details",
    text: "The event starts at 6 PM.",
    html: "<p>The event starts at 6 PM.</p>",
  });
  const message = info.message.toString();
  assert.deepEqual(info.envelope.to, ["guest@example.com"]);
  assert.match(message, /Reply-To: host@example\.com/);
  assert.match(message, /Subject: Your event details/);
  assert.match(message, /multipart\/alternative/);
});

test("NextAuth still encrypts and reads session tokens", async () => {
  const { encode, decode } = require("next-auth/jwt");
  const secret = "dependency-test-secret-only";
  const token = await encode({ secret, token: { sub: "test-user", email: "guest@example.com" } });
  const decoded = await decode({ secret, token });
  assert.equal(decoded.sub, "test-user");
  assert.equal(decoded.email, "guest@example.com");
});

test("Next.js resolves the patched PostCSS API and produces a source map", async () => {
  const nextRequire = createRequire(require.resolve("next/package.json"));
  const postcss = nextRequire("postcss");
  const result = await postcss([
    {
      postcssPlugin: "dependency-check",
      Declaration: (decl) => {
        if (decl.prop === "color") decl.value = "blue";
      },
    },
  ]).process(".event { color: red }", {
    from: "event.css",
    to: "output.css",
    map: { inline: false },
  });
  assert.match(result.css, /color: blue/);
  assert.ok(result.map.toJSON().sources.includes("event.css"));
});

test("Prisma can load its config through the patched merge dependency", async () => {
  const { loadConfigFromFile } = require("@prisma/config");
  const directory = await mkdtemp(path.join(tmpdir(), "envitefy-prisma-config-"));
  try {
    await writeFile(
      path.join(directory, "prisma.config.mjs"),
      'export default { schema: "schema.prisma" };\n',
    );
    const result = await loadConfigFromFile({ configRoot: directory });
    assert.equal(result.error, undefined);
    assert.equal(result.config.schema, path.join(await realpath(directory), "schema.prisma"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Google clients retain their UUID API after the security override", () => {
  for (const parent of ["gaxios", "teeny-request"]) {
    const parentRequire = createRequire(require.resolve(parent));
    const { v4, validate } = parentRequire("uuid");
    assert.equal(validate(v4()), true);
  }
});

test("the patched PDF engine renders a real document into an image", async () => {
  const { rasterizePdfPageToPng } = await import("../src/lib/pdf-raster.ts");
  const pdf = await readFile(new URL("../docs/2026wgaspparentinfo.pdf", import.meta.url));
  const image = await rasterizePdfPageToPng(pdf, 0);
  assert.ok(image && image.length > 1000);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, "png");
  assert.ok(metadata.width > 500);
  assert.ok(metadata.height > 500);
});
