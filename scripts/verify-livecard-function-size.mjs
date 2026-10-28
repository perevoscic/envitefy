import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const load = require("./lib/event-messages-test-loader.cjs");
const limitBytes = 250_000_000;
const normalize = (value) => value.split(path.sep).join("/");
const distDirArgument = process.argv.find((value) => value.startsWith("--dist-dir="));
const distDir = path.resolve(root, distDirArgument?.slice("--dist-dir=".length) || ".next");

process.chdir(root);
const { CARD_FONTS } = load("src/lib/shared-card-design.ts");
const requiredFonts = [...new Set(Object.values(CARD_FONTS).map((font) => `public${font.url}`))];
const ffmpegPackageFile = require.resolve("ffmpeg-static/package.json");
const ffmpegPackage = require(ffmpegPackageFile);
const ffmpegExecutable = `${ffmpegPackage["ffmpeg-static"]["executable-base-name"]}${process.platform === "win32" ? ".exe" : ""}`;
const requiredFfmpeg = normalize(path.relative(root, path.join(path.dirname(ffmpegPackageFile), ffmpegExecutable)));

async function readTrace(traceFile) {
  try {
    const trace = JSON.parse(await fs.readFile(traceFile, "utf8"));
    if (!Array.isArray(trace.files) || trace.files.some((file) => typeof file !== "string")) {
      throw new Error("trace.files must be an array of filenames");
    }
    return {
      path: normalize(path.relative(root, traceFile)),
      modifiedAt: (await fs.stat(traceFile)).mtime.toISOString(),
      filenames: trace.files.map((file) => path.resolve(path.dirname(traceFile), file)),
      errors: [],
    };
  } catch (error) {
    return { filenames: [], errors: [`Cannot read ${normalize(path.relative(root, traceFile))}: ${error.message}`] };
  }
}

async function measureFiles(filenames) {
  const files = [];
  const missingFiles = [];
  for (const filename of filenames) {
    const relative = normalize(path.relative(root, filename));
    try {
      const stat = await fs.stat(filename);
      if (!stat.isFile()) throw new Error("not a file");
      files.push({ path: relative, bytes: stat.size });
    } catch (error) {
      missingFiles.push({ path: relative, reason: error.code || error.message });
    }
  }
  return { files, missingFiles, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0) };
}

const sharedTraces = await Promise.all([
  path.join(distDir, "next-server.js.nft.json"),
  path.join(distDir, "next-minimal-server.js.nft.json"),
].map(readTrace));
// The synthetic .next/next-server.js entry does not exist. Count the actual
// runtime entries alongside both shared traces, then deduplicate all filenames.
const sharedEntries = [
  "node_modules/next/dist/server/next-server.js",
  "node_modules/next/dist/server/next.js",
  "node_modules/next/dist/compiled/next-server/server.runtime.prod.js",
];
const sharedFilenames = new Set([
  ...sharedTraces.flatMap((trace) => trace.filenames),
  ...sharedEntries.map((filename) => path.join(root, filename)),
]);
const sharedMeasurement = await measureFiles(sharedFilenames);
const sharedErrors = sharedTraces.flatMap((trace) => trace.errors);
if (sharedMeasurement.missingFiles.length) sharedErrors.push(`${sharedMeasurement.missingFiles.length} shared runtime file(s) are missing or unreadable.`);

async function inspectRoute(name) {
  const route = `/api/livecard-builder/${name}`;
  const traceFile = path.join(distDir, "server", "app", route.slice(1), "route.js.nft.json");
  const trace = await readTrace(traceFile);
  if (trace.errors.length) return { route, passed: false, errors: trace.errors };
  const entryFile = traceFile.slice(0, -".nft.json".length);
  const routeFilenames = new Set([entryFile, ...trace.filenames]);
  const routeMeasurement = await measureFiles(routeFilenames);
  const { files, missingFiles, totalBytes } = await measureFiles(new Set([...routeFilenames, ...sharedFilenames]));
  const tracedPaths = new Set(files.map((file) => file.path));
  const publicFiles = files.filter((file) => file.path.startsWith("public/"));
  const qaFiles = files.filter((file) => /^(?:\.qa|qa-artifacts)\//.test(file.path));
  const unexpectedPublicFiles = publicFiles.filter((file) => !file.path.startsWith("public/fonts/"));
  const missingRequiredAssets = requiredFonts.filter((font) => !tracedPaths.has(font));
  if (!tracedPaths.has(requiredFfmpeg)) missingRequiredAssets.push(requiredFfmpeg);
  const canvasNativeFiles = files.filter((file) => /^node_modules\/@napi-rs\/canvas[^/]*\/.*\.node$/.test(file.path));
  if (!canvasNativeFiles.length) missingRequiredAssets.push("@napi-rs/canvas native .node runtime");
  const groups = new Map();
  for (const file of files) {
    const parts = file.path.split("/");
    const length = parts[0] === "node_modules" ? (parts[1]?.startsWith("@") ? 3 : 2) : 2;
    const group = parts.slice(0, length).join("/");
    groups.set(group, (groups.get(group) || 0) + file.bytes);
  }
  const errors = [...sharedErrors];
  if (totalBytes >= limitBytes) errors.push(`Route plus shared runtime is ${totalBytes} bytes; must stay below ${limitBytes} bytes.`);
  if (missingFiles.length) errors.push(`${missingFiles.length} traced file(s) are missing or unreadable.`);
  if (missingRequiredAssets.length) errors.push(`${missingRequiredAssets.length} required font/native asset(s) are absent from the trace.`);
  if (unexpectedPublicFiles.length) errors.push(`${unexpectedPublicFiles.length} unrelated public asset(s) leaked into the trace.`);
  if (qaFiles.length) errors.push(`${qaFiles.length} QA artifact(s) leaked into the trace.`);
  return {
    route,
    traceModifiedAt: trace.modifiedAt,
    passed: errors.length === 0,
    routeOnlyUniqueFiles: routeMeasurement.files.length,
    routeOnlyBytes: routeMeasurement.totalBytes,
    routeOnlyMB: Number((routeMeasurement.totalBytes / 1_000_000).toFixed(2)),
    additionalSharedRuntimeBytes: totalBytes - routeMeasurement.totalBytes,
    uniqueFiles: files.length,
    totalBytes,
    totalMB: Number((totalBytes / 1_000_000).toFixed(2)),
    publicFiles: publicFiles.length,
    publicBytes: publicFiles.reduce((sum, file) => sum + file.bytes, 0),
    qaFiles: qaFiles.length,
    canvasNativeFiles: canvasNativeFiles.map((file) => file.path),
    ffmpegBinary: requiredFfmpeg,
    largestGroups: [...groups].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, bytes]) => ({ name, bytes })),
    missingFiles,
    missingRequiredAssets,
    unexpectedPublicFiles: unexpectedPublicFiles.map((file) => file.path),
    errors,
  };
}

const routes = await Promise.all(["design", "jobs", "headline"].map(inspectRoute));
const report = {
  scope: `Local ${process.platform}/${process.arch} production build: each route trace and entry, unioned with both shared Next.js runtime traces and actual runtime entries. Final Vercel/Linux packaging is not measured.`,
  limitBytes,
  limit: "Conservative 250 MB decimal budget",
  platform: process.platform,
  arch: process.arch,
  distDir,
  passed: sharedErrors.length === 0 && routes.every((route) => route.passed),
  sharedRuntime: {
    passed: sharedErrors.length === 0,
    traces: sharedTraces.map(({ path, modifiedAt, errors }) => ({ path, modifiedAt, errors })),
    entries: sharedEntries,
    uniqueFiles: sharedMeasurement.files.length,
    totalBytes: sharedMeasurement.totalBytes,
    totalMB: Number((sharedMeasurement.totalBytes / 1_000_000).toFixed(2)),
    missingFiles: sharedMeasurement.missingFiles,
    errors: sharedErrors,
  },
  routes,
};
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
