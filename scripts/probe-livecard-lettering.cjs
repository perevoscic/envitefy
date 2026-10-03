// Explicit opt-in provider experiment; never called by a builder, review or publish.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
require("dotenv").config({ quiet: true });

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error("Supply a background file explicitly.");
  const out = path.resolve("output/lettering-probe");
  await fs.mkdir(out, { recursive: true });
  const bytes = await fs.readFile(source);
  const model = process.env.STUDIO_OPENAI_IMAGE_EDIT_MODEL || "gpt-image-2.5-flare";
  const quality = process.argv[3] || "high";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 });
  const startedAt = Date.now();
  try {
    const response = await client.images.edit({
      model, quality, size: "1024x1536", background: "transparent", output_format: "png", n: 1,
      image: await toFile(bytes, "background.webp", { type: "image/webp" }),
      prompt: 'Create ONLY an isolated coordinated lettering asset on a genuinely transparent canvas. The reference is style context only: do not reproduce its scenery or background. Exact title: "Movie Under the Stars". Required opening line: "You’re invited". Render both completely, opening above title, inside x=12–88%, y=18–48%, all other pixels transparent. Use expressive cinema-themed lettering and colors that read clearly on the reference. No white rectangle, panel, scene, other words, or controls.',
    }, { timeout: 180000, maxRetries: 0 });
    const image = Buffer.from(response.data?.[0]?.b64_json || "", "base64");
    await fs.writeFile(path.join(out, `layer-${quality}.png`), image);
    const { data, info } = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent++;
    const background = await sharp(bytes).resize(1024, 1536, { fit: "fill" }).png().toBuffer();
    await sharp(background).composite([{ input: image }]).png().toFile(path.join(out, `composed-${quality}.png`));
    const evidence = { model, quality, requests: 1, elapsedMs: Date.now() - startedAt, requestId: response._request_id, usage: response.usage, width: info.width, height: info.height, transparentFraction: transparent / (info.width * info.height) };
    await fs.writeFile(path.join(out, `evidence-${quality}.json`), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
  } catch (error) {
    const evidence = { model, quality, requests: 1, elapsedMs: Date.now() - startedAt, status: error.status, requestId: error.request_id, error: error.message };
    await fs.writeFile(path.join(out, `evidence-${quality}.json`), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
    process.exitCode = 1;
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
