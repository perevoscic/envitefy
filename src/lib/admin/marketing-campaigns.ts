import fs from "node:fs/promises";
import path from "node:path";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getMarketingRunsRoot(projectRoot = process.cwd()) {
  return path.join(projectRoot, "qa-artifacts", "storyboard-runs");
}

export function sanitizeRunId(raw: unknown) {
  const value = clean(raw);
  if (!/^\d{8}-\d{6}-[a-z0-9-]+$/.test(value)) {
    throw new Error("Invalid run id");
  }
  return value;
}

export function resolveRunDir(runId: string, projectRoot = process.cwd()) {
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

export async function listMarketingRuns(projectRoot = process.cwd()) {
  const root = getMarketingRunsRoot(projectRoot);
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
  const summaries = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const runId = entry.name;
        const runDir = path.join(root, runId);
        const status = await readJsonFile<any>(path.join(runDir, "status.json"), null);
        const request = await readJsonFile<any>(path.join(runDir, "request.json"), null);
        return {
          runId,
          runDir,
          status,
          request,
        };
      }),
  );

  return summaries.sort((a, b) => b.runId.localeCompare(a.runId));
}

export async function readMarketingRunDetail(runId: string, projectRoot = process.cwd()) {
  const safeRunId = sanitizeRunId(runId);
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

  const videoPath = path.join(runDir, "video.mp4");
  const videoExists = await fs
    .access(videoPath)
    .then(() => true)
    .catch(() => false);

  const normalizedFrames = Array.isArray(frames?.frames)
    ? frames.frames.map((frame: any) => ({
        ...frame,
        imageUrl: frame?.imageFile ? buildRunAssetUrl(safeRunId, frame.imageFile) : null,
        captionedImageUrl: frame?.captionedImageFile
          ? buildRunAssetUrl(safeRunId, frame.captionedImageFile)
          : null,
      }))
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

export function resolveRunAssetPath(runId: string, file: string, projectRoot = process.cwd()) {
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
