import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";
import { connectScanDatabase } from "../scripts/scan-diagnostics-db.mjs";

// Run the existing saved-event service outside Next, preserving its atomic claim
// and upload path. Only Next's process-local cache notifications are stubbed.
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith("@/")) candidate = path.join(process.cwd(), "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))
      candidate = fileURLToPath(new URL(specifier, context.parentURL));
    if (candidate && !path.extname(candidate) && existsSync(`${candidate}.ts`))
      return nextResolve(pathToFileURL(`${candidate}.ts`).href, context);
    return nextResolve(specifier, context);
  },
});

const eventId = process.argv[2];
if (!/^[0-9a-f-]{36}$/i.test(eventId || "")) throw new Error("Provide the saved event ID");
const db = await connectScanDatabase();
try {
  const row = (await db.query("select user_id from event_history where id=$1", [eventId])).rows[0];
  if (!row?.user_id) throw new Error("Saved event owner not found");
  const provider = await import("../src/lib/studio/openai.ts");
  const media = await import("../src/lib/media-upload.ts");
  const encoder = await import("../src/lib/ocr/artwork-webp.ts");
  const outputDir = path.join("artifacts", "scan-artwork-recovery", eventId);
  mkdirSync(outputDir, { recursive: true });
  const verified = new Map();
  const adapters = {
    "next/cache": { revalidatePath() {} },
    "@/lib/db": { query: (sql, args) => db.query(sql, args) },
    "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
    "@/lib/history-cache": { invalidateUserHistory() {} },
    "@/lib/media-upload": {
      async uploadPublicBinaryAsset(params) {
        try { return await media.uploadPublicBinaryAsset(params); }
        catch (error) { console.error("Upload failure", error.message); throw error; }
      },
    },
    "@/lib/studio/openai": {
      async generateInvitationImageWithOpenAi(...args) {
        const started = Date.now();
        const stage = args[3]?.size ? "hero" : "background";
        const outputPath = path.join(outputDir, `${stage}.webp`);
        const originalPath = path.join(outputDir, `${stage}-original.png`);
        if (process.argv.includes("--reuse") && existsSync(outputPath)) {
          const bytes = readFileSync(outputPath);
          verified.set(bytes.toString("base64"), bytes);
          return { ok: true, imageDataUrl: `data:image/webp;base64,${bytes.toString("base64")}`, warnings: [] };
        }
        const result = process.argv.includes("--reuse") && existsSync(originalPath)
          ? { ok: true, imageDataUrl: `data:image/png;base64,${readFileSync(originalPath).toString("base64")}`, warnings: [] }
          : await provider.generateInvitationImageWithOpenAi(...args);
        console.log(JSON.stringify({ stage, ms: Date.now() - started, ok: result.ok, ...(!result.ok ? { error: result.error } : {}) }));
        if (result.ok) {
          try {
            const original = Buffer.from(result.imageDataUrl.split(",")[1], "base64");
            writeFileSync(originalPath, original);
            console.log(JSON.stringify({ stage, originalBytes: original.length, signature: original.subarray(0,16).toString("hex"), metadata: await sharp(original).metadata() }));
            const webp = await encoder.encodeScanArtworkWebp(original);
            verified.set(original.toString("base64"), webp);
            writeFileSync(outputPath, webp);
            writeFileSync(path.join(outputDir, `${stage}-prompt.txt`), args[0]);
            unlinkSync(originalPath);
            console.log(JSON.stringify({ stage, verifiedWebp: outputPath, bytes: webp.length }));
          } catch (error) { console.error("Conversion failure", error.message); throw error; }
        }
        return result;
      },
    },
    "./artwork-webp": { encodeScanArtworkWebp: async (bytes) => verified.get(bytes.toString("base64")) || encoder.encodeScanArtworkWebp(bytes) },
    "./personalization": await import("../src/lib/ocr/personalization.ts"),
    "./scan-media": await import("../src/lib/ocr/scan-media.ts"),
  };
  const { outputText } = ts.transpileModule(readFileSync("src/lib/ocr/scan-artwork.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const module = { exports: {} };
  const require = createRequire(import.meta.url);
  vm.runInNewContext(outputText, { module, exports: module.exports, require: (name) => adapters[name] || require(name), Buffer, AbortSignal, console });
  await module.exports.generateSavedScanArtwork(eventId, row.user_id, true);
  const state = (await db.query("select data->'scanArtwork' as artwork from event_history where id=$1", [eventId])).rows[0];
  console.log(JSON.stringify(state, null, 2));
} finally {
  await db.end();
}
