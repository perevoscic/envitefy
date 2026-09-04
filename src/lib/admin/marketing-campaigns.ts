import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import {
  buildMarketingCopyDesk,
  storedPlatformPacksFromCopyDesk,
  type MarketingCopyDesk,
} from "./marketing-copy-desk.ts";

const MARKETING_BLOB_PREFIX = "admin-marketing-campaigns";
const SERVERLESS_WORKING_DIR = "envitefy-marketing";

type MarketingRunSummary = {
  runId: string;
  runDir: string;
  status: Record<string, unknown> | null;
  request: Record<string, unknown> | null;
  thumbnailUrl?: string | null;
};

type FrameFileRecord = {
  imageFile?: unknown;
  captionedImageFile?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isMarketingCampaignBlobStorageEnabled() {
  return Boolean(
    (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) &&
      process.env.BLOB_READ_WRITE_TOKEN?.trim(),
  );
}

export function resolveMarketingCampaignProjectRoot(projectRoot = process.cwd()) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), SERVERLESS_WORKING_DIR);
  }
  return projectRoot;
}

export function getMarketingRunsRoot(projectRoot = resolveMarketingCampaignProjectRoot()) {
  return path.join(projectRoot, "qa-artifacts", "storyboard-runs");
}

export function sanitizeRunId(raw: unknown) {
  const value = clean(raw);
  if (!/^\d{8}-\d{6}-[a-z0-9-]+$/.test(value)) {
    throw new Error("Invalid run id");
  }
  return value;
}

export function resolveRunDir(runId: string, projectRoot = resolveMarketingCampaignProjectRoot()) {
  return path.join(getMarketingRunsRoot(projectRoot), sanitizeRunId(runId));
}

export function buildRunAssetUrl(runId: string, file: string) {
  return `/api/admin/marketing-campaigns/${encodeURIComponent(runId)}/asset?file=${encodeURIComponent(file)}`;
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function fileExists(filePath: string) {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

export async function resolveRunThumbnailUrl(runId: string, runDir: string) {
  try {
    const frames = await readJsonFile<{ frames?: FrameFileRecord[] } | null>(
      path.join(runDir, "frames.json"),
      null,
    );
    const records = Array.isArray(frames?.frames) ? frames.frames : [];
    for (const frame of records) {
      const candidates = [clean(frame.captionedImageFile), clean(frame.imageFile)].filter(Boolean);
      for (const file of candidates) {
        if (await fileExists(path.join(runDir, file))) {
          return buildRunAssetUrl(runId, file);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

function runBlobPrefix(runId: string) {
  return `${MARKETING_BLOB_PREFIX}/${sanitizeRunId(runId)}/`;
}

function runBlobPath(runId: string, file: string) {
  const normalized = file.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) {
    throw new Error("Invalid run artifact path");
  }
  return `${runBlobPrefix(runId)}${normalized}`;
}

function contentTypeForArtifact(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".srt" || ext === ".txt" || ext === ".log") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

async function readBlobBytes(pathname: string): Promise<Buffer | null> {
  if (!isMarketingCampaignBlobStorageEnabled()) return null;
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

async function readBlobJson<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const bytes = await readBlobBytes(pathname);
    return bytes ? (JSON.parse(bytes.toString("utf8")) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function collectRunFiles(root: string, current = root): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) return collectRunFiles(root, absolutePath);
      return entry.isFile() ? [path.relative(root, absolutePath)] : [];
    }),
  );
  return nested.flat();
}

async function persistMarketingRunFiles(runDir: string, files: string[]) {
  const runId = sanitizeRunId(path.basename(runDir));
  const batchSize = 6;
  for (let index = 0; index < files.length; index += batchSize) {
    await Promise.all(
      files.slice(index, index + batchSize).map(async (file) => {
        const bytes = await fs.readFile(path.join(runDir, file));
        await put(runBlobPath(runId, file), bytes, {
          access: "private",
          allowOverwrite: true,
          addRandomSuffix: false,
          contentType: contentTypeForArtifact(file),
        });
      }),
    );
  }
}

export async function persistMarketingRun(runDir: string) {
  if (!isMarketingCampaignBlobStorageEnabled()) return;
  await persistMarketingRunFiles(runDir, await collectRunFiles(runDir));
}

export async function persistMarketingRunStatus(runDir: string) {
  if (!isMarketingCampaignBlobStorageEnabled()) return;
  await persistMarketingRunFiles(runDir, ["request.json", "status.json"]);
}

export async function hydrateMarketingRun(runId: string) {
  const safeRunId = sanitizeRunId(runId);
  const runDir = resolveRunDir(safeRunId);
  if (!isMarketingCampaignBlobStorageEnabled()) return runDir;

  const prefix = runBlobPrefix(safeRunId);
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    await Promise.all(
      page.blobs.map(async (blob) => {
        const relativePath = blob.pathname.slice(prefix.length);
        if (!relativePath) return;
        const bytes = await readBlobBytes(blob.pathname);
        if (!bytes) return;
        const destination = resolveRunAssetPath(safeRunId, relativePath);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, bytes);
      }),
    );
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return runDir;
}

export async function readMarketingRunAsset(runId: string, file: string) {
  const absolutePath = resolveRunAssetPath(runId, file);
  try {
    return {
      bytes: await fs.readFile(absolutePath),
      contentType: contentTypeForArtifact(file),
    };
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  const bytes = await readBlobBytes(runBlobPath(runId, file));
  return bytes ? { bytes, contentType: contentTypeForArtifact(file) } : null;
}

async function listBlobMarketingRuns(): Promise<MarketingRunSummary[]> {
  if (!isMarketingCampaignBlobStorageEnabled()) return [];
  const prefix = `${MARKETING_BLOB_PREFIX}/`;
  const result = await list({ prefix, mode: "folded", limit: 1000 });
  const runIds = result.folders
    .map((folder) => folder.slice(prefix.length).replace(/\/$/, ""))
    .filter((runId) => /^\d{8}-\d{6}-[a-z0-9-]+$/.test(runId))
    .sort((a, b) => b.localeCompare(a));

  return Promise.all(
    runIds.map(async (runId) => {
      const [status, request] = await Promise.all([
        readBlobJson<Record<string, unknown> | null>(
          runBlobPath(runId, "status.json"),
          null,
        ),
        readBlobJson<Record<string, unknown> | null>(
          runBlobPath(runId, "request.json"),
          null,
        ),
      ]);
      const runDir = resolveRunDir(runId);
      return {
        runId,
        runDir,
        status,
        request,
        thumbnailUrl: await resolveRunThumbnailUrl(runId, runDir),
      };
    }),
  );
}

export async function listMarketingRuns(
  projectRoot = resolveMarketingCampaignProjectRoot(),
) {
  const root = getMarketingRunsRoot(projectRoot);
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const localSummaries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const runId = entry.name;
        const runDir = path.join(root, runId);
        const status = await readJsonFile<Record<string, unknown> | null>(
          path.join(runDir, "status.json"),
          null,
        );
        const request = await readJsonFile<Record<string, unknown> | null>(
          path.join(runDir, "request.json"),
          null,
        );
        const thumbnailUrl = await resolveRunThumbnailUrl(runId, runDir);
        return {
          runId,
          runDir,
          status,
          request,
          thumbnailUrl,
        };
      }),
  );
  const blobSummaries = await listBlobMarketingRuns();
  const summaries = new Map<string, MarketingRunSummary>();
  for (const entry of blobSummaries) summaries.set(entry.runId, entry);
  for (const entry of localSummaries) summaries.set(entry.runId, entry);

  return Array.from(summaries.values()).sort((a, b) => b.runId.localeCompare(a.runId));
}

export async function readMarketingRunDetail(
  runId: string,
  projectRoot = resolveMarketingCampaignProjectRoot(),
) {
  const safeRunId = sanitizeRunId(runId);
  if (projectRoot === resolveMarketingCampaignProjectRoot()) {
    await hydrateMarketingRun(safeRunId);
  }
  const runDir = resolveRunDir(safeRunId, projectRoot);
  const [
    request,
    status,
    brief,
    persona,
    critique,
    sceneSpec,
    framePlan,
    socialCopy,
    creativeQa,
    frames,
  ] = await Promise.all([
    readJsonFile<any>(path.join(runDir, "request.json"), null),
    readJsonFile<any>(path.join(runDir, "status.json"), null),
    readJsonFile<any>(path.join(runDir, "brief.json"), null),
    readJsonFile<any>(path.join(runDir, "persona.json"), null),
    readJsonFile<any>(path.join(runDir, "critique.json"), null),
    readJsonFile<any>(path.join(runDir, "scene-spec.json"), null),
    readJsonFile<any>(path.join(runDir, "frame-plan.json"), null),
    readJsonFile<any>(path.join(runDir, "social-copy.json"), null),
    readJsonFile<any>(path.join(runDir, "creative-qa.json"), null),
    readJsonFile<any>(path.join(runDir, "frames.json"), null),
  ]);

  const copyDesk = buildMarketingCopyDesk({
    request,
    brief,
    socialCopy,
    frames,
  });

  const videoPath = path.join(runDir, "video.mp4");
  const videoExists = await fs
    .access(videoPath)
    .then(() => true)
    .catch(() => false);

  const normalizedFrames = Array.isArray(frames?.frames)
    ? await Promise.all(
        frames.frames.map(async (frame: any) => {
          const imagePath = frame?.imageFile ? path.join(runDir, frame.imageFile) : "";
          const captionedImagePath = frame?.captionedImageFile
            ? path.join(runDir, frame.captionedImageFile)
            : "";
          const [hasImage, hasCaptionedImage] = await Promise.all([
            imagePath ? fileExists(imagePath) : false,
            captionedImagePath ? fileExists(captionedImagePath) : false,
          ]);
          return {
            ...frame,
            imageUrl: hasImage ? buildRunAssetUrl(safeRunId, frame.imageFile) : null,
            captionedImageUrl: hasCaptionedImage ? buildRunAssetUrl(safeRunId, frame.captionedImageFile) : null,
          };
        }),
      )
    : [];

  return {
    runId: safeRunId,
    runDir,
    request,
    status,
    brief,
    persona,
    critique,
    sceneSpec,
    framePlan,
    socialCopy,
    copyDesk,
    creativeQa,
    frames: frames
      ? {
          ...frames,
          frames: normalizedFrames,
        }
      : null,
    videoUrl: videoExists ? buildRunAssetUrl(safeRunId, "video.mp4") : null,
    captionsUrl: buildRunAssetUrl(safeRunId, "captions.srt"),
  };
}

export function resolveRunAssetPath(
  runId: string,
  file: string,
  projectRoot = resolveMarketingCampaignProjectRoot(),
) {
  const runDir = resolveRunDir(runId, projectRoot);
  const requested = clean(file);
  if (!requested) throw new Error("Missing file path");
  const absolutePath = path.resolve(runDir, requested);
  const normalizedRunDir = `${runDir}${path.sep}`;
  if (absolutePath === runDir || !absolutePath.startsWith(normalizedRunDir)) {
    throw new Error("Invalid file path");
  }
  return absolutePath;
}

export async function syncMarketingCopyDeskForRun(runDir: string): Promise<MarketingCopyDesk> {
  const [request, brief, socialCopy, frames] = await Promise.all([
    readJsonFile<Record<string, unknown> | null>(path.join(runDir, "request.json"), null),
    readJsonFile<Record<string, unknown> | null>(path.join(runDir, "brief.json"), null),
    readJsonFile<Record<string, unknown> | null>(path.join(runDir, "social-copy.json"), null),
    readJsonFile<Record<string, unknown> | null>(path.join(runDir, "frames.json"), null),
  ]);

  const copyDesk = buildMarketingCopyDesk({
    request,
    brief,
    socialCopy,
    frames,
    preferStoredPacks: false,
  });

  if (!copyDesk.available) return copyDesk;

  const nextSocialCopy = {
    ...(socialCopy && typeof socialCopy === "object" ? socialCopy : {}),
    platformPacks: storedPlatformPacksFromCopyDesk(copyDesk),
  };
  await fs.writeFile(
    path.join(runDir, "social-copy.json"),
    `${JSON.stringify(nextSocialCopy, null, 2)}\n`,
    "utf8",
  );
  return copyDesk;
}
