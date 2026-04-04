#!/usr/bin/env node
/**
 * Recompress and optionally resize raster images under `public/`.
 *
 * Usage:
 *   node scripts/optimize-public-images.mjs [--dry-run] [--max=2560] [--root=public]
 *   node scripts/optimize-public-images.mjs --diff [--dry-run]   # only git-changed vs HEAD (+ untracked under public/)
 *   node scripts/optimize-public-images.mjs --staged [--dry-run] # only staged raster paths
 *   node scripts/optimize-public-images.mjs --diff --emit-webp    # same + rewrite sibling .webp from each .png (site often uses .webp)
 *   node scripts/optimize-public-images.mjs --signup-templates-webp [--diff|--staged] [--dry-run]
 *
 * Default pass (no --signup-templates-webp):
 *   - Skips: public/icons (generated), public/uploads (user content)
 *   - JPEG: mozjpeg, quality 82, progressive, strips metadata
 *   - PNG: zlib level 9, high effort (lossless repack)
 *   - WebP: quality 82
 *   - Resizes so the long edge is at most --max (only if larger than max)
 *   - Writes only when output is smaller or dimensions changed
 *   - --emit-webp: for each .png in the batch, also writes/overwrites same-name .webp (quality 85, after same resize rules).
 *     Use this when you replace foo.png but the app loads foo.webp — plain --diff does not update the .webp.
 *
 * --signup-templates-webp:
 *   - Converts opaque PNGs under public/templates/signup to WebP (quality 85)
 *   - Keeps PNG for files with alpha; recompresses those PNGs
 *   - Rewrites path suffixes in public/templates/signup/manifest.json and
 *     src/assets/signup-templates.ts when the PNG was replaced by WebP
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SKIP_DIR_NAMES = new Set(["icons", "uploads", "node_modules"]);
const RASTER_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/** @typedef {{ dryRun: boolean; maxEdge: number; root: string; signupTemplatesWebp: boolean; gitScope: "none" | "diff" | "staged"; emitWebp: boolean }} CliOpts */

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {CliOpts} */
  const out = {
    dryRun: false,
    maxEdge: 2560,
    root: "public",
    signupTemplatesWebp: false,
    gitScope: "none",
    emitWebp: false,
  };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--signup-templates-webp") out.signupTemplatesWebp = true;
    else if (a === "--emit-webp") out.emitWebp = true;
    else if (a === "--diff") out.gitScope = "diff";
    else if (a === "--staged") out.gitScope = "staged";
    else if (a.startsWith("--max=")) out.maxEdge = Number(a.slice(6)) || 2560;
    else if (a.startsWith("--root=")) out.root = a.slice(7);
  }
  return out;
}

/**
 * @param {"diff" | "staged"} scope
 * @returns {string[]} repo-relative paths with forward slashes on all platforms
 */
function gitChangedRelativePaths(scope) {
  const trackedArgs =
    scope === "staged"
      ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"]
      : ["diff", "--name-only", "HEAD", "--diff-filter=ACMR"];
  let tracked = "";
  try {
    tracked = execFileSync("git", trackedArgs, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const err = /** @type {NodeJS.ErrnoException & { status?: number }} */ (e);
    if (err.code === "ENOENT") {
      console.error("[optimize] git not found; install Git or run without --diff/--staged");
      process.exit(1);
    }
    throw e;
  }

  const lines = tracked
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  if (scope === "diff") {
    let untracked = "";
    try {
      untracked = execFileSync("git", ["ls-files", "-o", "--exclude-standard", "--", "public/"], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      /* ignore */
    }
    const u = untracked
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\\/g, "/"))
      .filter(Boolean);
    lines.push(...u);
  }

  return [...new Set(lines)];
}

/**
 * @param {string[]} repoRelForwardSlash
 * @param {string} rootAbs
 */
function filterRasterUnderRoot(repoRelForwardSlash, rootAbs) {
  const rootRel = path.relative(repoRoot, rootAbs).replace(/\\/g, "/");
  const rootPrefix = rootRel.endsWith("/") ? rootRel : `${rootRel}/`;
  /** @type {string[]} */
  const out = [];
  for (const rel of repoRelForwardSlash) {
    const norm = rel.replace(/\\/g, "/");
    if (!norm.startsWith(rootPrefix) && norm !== rootRel) continue;
    const segments = norm.split("/");
    if (segments.some((s) => SKIP_DIR_NAMES.has(s))) continue;
    const ext = path.extname(norm).toLowerCase();
    if (!RASTER_EXT.has(ext)) continue;
    const abs = path.join(repoRoot, ...norm.split("/"));
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    out.push(abs);
  }
  return [...new Set(out)];
}

/** @param {string} dir */
function walkRasterFiles(dir) {
  /** @type {string[]} */
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      files.push(...walkRasterFiles(full));
    } else {
      const ext = path.extname(ent.name).toLowerCase();
      if (RASTER_EXT.has(ext)) files.push(full);
    }
  }
  return files;
}

/**
 * @param {Buffer} input
 * @param {string} absPath
 * @param {{ maxEdge: number }} opts
 */
async function pipelineForFormat(input, absPath, opts) {
  const ext = path.extname(absPath).toLowerCase();
  const meta = await sharp(input).metadata();

  let img = sharp(input).rotate();
  let resized = false;
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w > 0 && h > 0 && Math.max(w, h) > opts.maxEdge) {
    img = img.resize(opts.maxEdge, opts.maxEdge, { fit: "inside", withoutEnlargement: true });
    resized = true;
  }

  /** @type {Buffer} */
  let outBuf;
  if (ext === ".jpg" || ext === ".jpeg") {
    outBuf = await img.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
  } else if (ext === ".png") {
    outBuf = await img.png({ compressionLevel: 9, effort: 10 }).toBuffer();
  } else if (ext === ".webp") {
    outBuf = await img.webp({ quality: 82, effort: 6 }).toBuffer();
  } else {
    return null;
  }

  return { outBuf, resized };
}

/**
 * @param {string} absPath
 * @param {{ dryRun: boolean; maxEdge: number }} opts
 */
async function optimizeFileInPlace(absPath, opts) {
  const input = await fs.promises.readFile(absPath);
  const before = input.length;
  const result = await pipelineForFormat(input, absPath, opts);
  if (!result) return;
  const { outBuf, resized } = result;
  const after = outBuf.length;
  // Never replace with a larger file unless we actually resized (dimensions changed).
  const shouldWrite = resized || after < before;
  const rel = path.relative(repoRoot, absPath);
  if (opts.dryRun) {
    const pct = before ? (((before - after) / before) * 100).toFixed(1) : "0";
    console.log(`[dry-run] ${rel}  ${before} → ${after} B (${pct}% ${after < before ? "smaller" : "larger"})${resized ? " [resized]" : ""}`);
    return;
  }
  if (shouldWrite) {
    await fs.promises.writeFile(absPath, outBuf);
    console.log(`[ok] ${rel}  ${before} → ${after} B${resized ? " [resized]" : ""}`);
  }
}

/**
 * @param {string} pngAbs
 * @param {{ dryRun: boolean; maxEdge: number }} opts
 */
async function emitWebpFromPng(pngAbs, opts) {
  const input = await fs.promises.readFile(pngAbs);
  const meta = await sharp(input).metadata();
  let img = sharp(input).rotate();
  let resized = false;
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w > 0 && h > 0 && Math.max(w, h) > opts.maxEdge) {
    img = img.resize(opts.maxEdge, opts.maxEdge, { fit: "inside", withoutEnlargement: true });
    resized = true;
  }
  const outBuf = await img.webp({ quality: 85, effort: 6 }).toBuffer();
  const webpAbs = pngAbs.replace(/\.png$/i, ".webp");
  const relPng = path.relative(repoRoot, pngAbs);
  const relWebp = path.relative(repoRoot, webpAbs);
  if (opts.dryRun) {
    console.log(
      `[dry-run] [emit-webp] ${relPng} → ${path.basename(webpAbs)} (${outBuf.length} B)${resized ? " [resized]" : ""}`,
    );
    return;
  }
  await fs.promises.writeFile(webpAbs, outBuf);
  console.log(`[ok] [emit-webp] ${relPng} → ${relWebp} (${outBuf.length} B)${resized ? " [resized]" : ""}`);
}

async function runDefaultPass(opts) {
  const rootAbs = path.resolve(repoRoot, opts.root);
  if (!fs.existsSync(rootAbs)) {
    console.error(`[optimize] Root not found: ${rootAbs}`);
    process.exit(1);
  }
  /** @type {string[]} */
  let files;
  if (opts.gitScope === "diff" || opts.gitScope === "staged") {
    const changed = gitChangedRelativePaths(opts.gitScope);
    files = filterRasterUnderRoot(changed, rootAbs);
    console.log(
      `[optimize] ${opts.dryRun ? "Dry run — " : ""}git ${opts.gitScope}: ${files.length} raster file(s) under ${path.relative(repoRoot, rootAbs)}`,
    );
  } else {
    files = walkRasterFiles(rootAbs);
    console.log(`[optimize] ${opts.dryRun ? "Dry run — " : ""}${files.length} files under ${path.relative(repoRoot, rootAbs)}`);
  }

  if (files.length === 0 && opts.gitScope !== "none") {
    console.log("[optimize] No matching raster files in diff; nothing to do.");
    return;
  }

  for (const f of files) {
    try {
      await optimizeFileInPlace(f, opts);
      if (opts.emitWebp && f.toLowerCase().endsWith(".png")) {
        await emitWebpFromPng(f, opts);
      }
    } catch (e) {
      console.error(`[error] ${path.relative(repoRoot, f)}`, e);
      process.exitCode = 1;
    }
  }
}

async function convertSignupTemplates(opts) {
  const signupDir = path.join(repoRoot, "public", "templates", "signup");
  if (!fs.existsSync(signupDir)) {
    console.error("[signup-webp] Directory missing:", signupDir);
    process.exit(1);
  }

  let pngFiles = walkRasterFiles(signupDir).filter((f) => f.toLowerCase().endsWith(".png"));
  if (opts.gitScope === "diff" || opts.gitScope === "staged") {
    const changed = new Set(
      gitChangedRelativePaths(opts.gitScope).map((r) =>
        path.resolve(repoRoot, ...r.replace(/\\/g, "/").split("/").filter(Boolean)),
      ),
    );
    pngFiles = pngFiles.filter((f) => changed.has(path.resolve(f)));
    console.log(
      `[signup-webp] ${opts.dryRun ? "Dry run — " : ""}git ${opts.gitScope}: ${pngFiles.length} PNG file(s)`,
    );
  } else {
    console.log(`[signup-webp] ${opts.dryRun ? "Dry run — " : ""}${pngFiles.length} PNG files`);
  }

  if (pngFiles.length === 0 && opts.gitScope !== "none") {
    console.log("[signup-webp] No matching PNGs in diff; skipping manifest rewrite.");
    return;
  }

  for (const absPath of pngFiles) {
    const rel = path.relative(repoRoot, absPath);
    const input = await fs.promises.readFile(absPath);
    const before = input.length;
    const meta = await sharp(input).metadata();
    const webpPath = absPath.replace(/\.png$/i, ".webp");

    try {
      if (meta.hasAlpha) {
        const outBuf = await sharp(input).rotate().png({ compressionLevel: 9, effort: 10 }).toBuffer();
        if (opts.dryRun) {
          console.log(`[dry-run] keep PNG (alpha) ${rel} ${before} → ${outBuf.length} B`);
        } else if (outBuf.length < before) {
          await fs.promises.writeFile(absPath, outBuf);
          console.log(`[ok] PNG (alpha) ${rel} ${before} → ${outBuf.length} B`);
        }
        continue;
      }

      const outBuf = await sharp(input).rotate().webp({ quality: 85, effort: 6 }).toBuffer();
      if (opts.dryRun) {
        console.log(`[dry-run] ${rel} → ${path.basename(webpPath)} ${before} → ${outBuf.length} B`);
      } else {
        await fs.promises.writeFile(webpPath, outBuf);
        await fs.promises.unlink(absPath);
        console.log(`[ok] ${rel} → ${path.basename(webpPath)} ${before} → ${outBuf.length} B`);
      }
    } catch (e) {
      console.error(`[error] ${rel}`, e);
      process.exitCode = 1;
    }
  }

  if (opts.dryRun) return;

  rewriteManifestPathsToMatchDisk();
}

function rewriteManifestPathsToMatchDisk() {
  const manifestJson = path.join(repoRoot, "public", "templates", "signup", "manifest.json");
  const manifestTs = path.join(repoRoot, "src", "assets", "signup-templates.ts");

  const patchJson = (text) => {
    const data = JSON.parse(text);
    for (const key of Object.keys(data)) {
      const list = data[key];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (!item?.path || typeof item.path !== "string") continue;
        if (!item.path.endsWith(".png")) continue;
        const relFromPublic = item.path.replace(/^\//, "");
        const pngAbs = path.join(repoRoot, "public", relFromPublic);
        const webpAbs = pngAbs.replace(/\.png$/i, ".webp");
        if (!fs.existsSync(pngAbs) && fs.existsSync(webpAbs)) {
          item.path = item.path.replace(/\.png$/i, ".webp");
        }
      }
    }
    return `${JSON.stringify(data, null, 2)}\n`;
  };

  const patchTs = (text) => {
    return text.replace(/"(\/templates\/signup\/[^"]+\.png)"/g, (full, p) => {
      const relFromPublic = p.slice(1);
      const pngAbs = path.join(repoRoot, "public", relFromPublic);
      const webpAbs = pngAbs.replace(/\.png$/i, ".webp");
      if (!fs.existsSync(pngAbs) && fs.existsSync(webpAbs)) {
        return `"${p.replace(/\.png$/i, ".webp")}"`;
      }
      return full;
    });
  };

  if (fs.existsSync(manifestJson)) {
    const next = patchJson(fs.readFileSync(manifestJson, "utf8"));
    fs.writeFileSync(manifestJson, next);
    console.log("[signup-webp] Updated", path.relative(repoRoot, manifestJson));
  }
  if (fs.existsSync(manifestTs)) {
    const next = patchTs(fs.readFileSync(manifestTs, "utf8"));
    fs.writeFileSync(manifestTs, next);
    console.log("[signup-webp] Updated", path.relative(repoRoot, manifestTs));
  }
}

const opts = parseArgs(process.argv.slice(2));

if (opts.signupTemplatesWebp) {
  await convertSignupTemplates(opts);
} else {
  await runDefaultPass(opts);
}
