// Explicit one-request provider experiment. Never publishes or contacts guests.
const fs = require("node:fs/promises");
const path = require("node:path");
const OpenAI = require("openai");
require("dotenv").config({ quiet: true });
async function main() {
  const client = new OpenAI({ maxRetries: 0 });
  const out = path.resolve("output/livecard-partial-preview"); await fs.mkdir(out, { recursive: true });
  const evidence = { model: process.env.STUDIO_OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare", quality: "high", requests: 1, partials: [], usage: null };
  const started = Date.now();
  try {
    const { data: stream, request_id } = await client.post("/images/generations", { body: {
      model: evidence.model, quality: "high", size: "1024x1536", background: "opaque", output_format: "png", n: 1, stream: true, partial_images: 2,
      prompt: "Text-free cinematic outdoor movie night, navy twilight sky with stars, warmly illuminated movie screen, popcorn and lawn chairs, immersive layered scene. No lettering, words or interface controls.",
    }, stream: true, maxRetries: 0, timeout: 180000 }).withResponse();
    evidence.requestId = request_id;
    for await (const event of stream) {
      const value = event.data || event; const type = value.type || event.event;
      if (!value.b64_json) continue;
      const elapsedMs = Date.now() - started;
      if (type.endsWith("partial_image")) { evidence.partials.push(elapsedMs); await fs.writeFile(path.join(out, `partial-${evidence.partials.length}.png`), Buffer.from(value.b64_json, "base64")); }
      if (type.endsWith("completed")) { evidence.completedMs = elapsedMs; evidence.usage = value.usage; await fs.writeFile(path.join(out, "completed.png"), Buffer.from(value.b64_json, "base64")); }
    }
  } catch (error) { evidence.error = error.message; evidence.status = error.status; evidence.requestId ||= error.request_id; process.exitCode = 1; }
  evidence.totalMs = Date.now() - started;
  await fs.writeFile(path.join(out, "evidence.json"), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
