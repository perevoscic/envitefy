import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { renderCaptionedFrameToFile } from "./caption-compositor.mjs";
import { resolveRunPaths } from "./campaign-run.mjs";
import { resolveRenderDimensions } from "./storyboard-generator.mjs";

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clampDuration(value) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 2;
  return Math.min(3.5, Math.max(1.2, numeric));
}

function toSrtTimestamp(seconds) {
  const wholeMs = Math.max(0, Math.round(seconds * 1000));
  const ms = `${wholeMs % 1000}`.padStart(3, "0");
  const totalSeconds = Math.floor(wholeMs / 1000);
  const secs = `${totalSeconds % 60}`.padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = `${totalMinutes % 60}`.padStart(2, "0");
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  return `${hours}:${mins}:${secs},${ms}`;
}

async function writeSrt(runPaths, frames) {
  let cursor = 0;
  const blocks = frames.map((frame, index) => {
    const duration = clampDuration(frame?.caption?.durationSec);
    const start = cursor;
    const end = cursor + duration;
    cursor = end;
    return [
      `${index + 1}`,
      `${toSrtTimestamp(start)} --> ${toSrtTimestamp(end)}`,
      clean(frame?.caption?.text),
      clean(frame?.caption?.voiceover),
    ]
      .filter(Boolean)
      .join("\n");
  });
  await fs.writeFile(runPaths.captionsPath, `${blocks.join("\n\n")}\n`, "utf8");
}

async function writeConcat(runPaths, frames) {
  const lines = [];
  for (const frame of frames) {
    const rel = frame.captionedImageFile || frame.imageFile;
    lines.push(`file '${path.join(runPaths.runDir, rel).replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${clampDuration(frame?.caption?.durationSec)}`);
  }
  if (frames.length > 0) {
    const last = frames[frames.length - 1];
    lines.push(`file '${path.join(runPaths.runDir, last.captionedImageFile || last.imageFile).replace(/'/g, "'\\''")}'`);
  }
  await fs.writeFile(runPaths.concatPath, `${lines.join("\n")}\n`, "utf8");
}

function runFfmpeg(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(clean(stderr) || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function composeCaptionedFramesForRun({
  projectRoot = process.cwd(),
  runId,
  runDir,
  onlyDirty = true,
}) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const framesManifest = await readJson(runPaths.framesPath, null);
  if (!framesManifest?.frames?.length) throw new Error("frames.json not found or empty.");
  const cameraFormat = clean(
    framesManifest?.renderSize?.cameraFormat || framesManifest?.sceneSpec?.cameraFormat || "vertical",
  );

  let changed = 0;
  for (const frame of framesManifest.frames) {
    if (clean(frame.status) !== "done") continue;
    const inputPath = path.join(runPaths.runDir, frame.imageFile);
    const outputPath = path.join(runPaths.runDir, frame.captionedImageFile);
    const needsRender =
      !onlyDirty ||
      frame?.caption?.dirty !== false ||
      frame?.caption?.status !== "done" ||
      !(await exists(outputPath));
    if (!needsRender) continue;
    await renderCaptionedFrameToFile({
      projectRoot,
      inputPath,
      outputPath,
      caption: frame.caption,
      cameraFormat,
    });
    frame.caption = {
      ...frame.caption,
      status: "done",
      dirty: false,
      updatedAt: new Date().toISOString(),
    };
    changed += 1;
  }

  await writeJson(runPaths.framesPath, framesManifest);
  return { runPaths, framesManifest, changed };
}

export async function assembleVideoForRun({ projectRoot = process.cwd(), runId, runDir }) {
  const runPaths = resolveRunPaths(projectRoot, { runId, runDir });
  const framesManifest = await readJson(runPaths.framesPath, null);
  const statusDoc = await readJson(runPaths.statusPath, null);
  if (!framesManifest?.frames?.length) throw new Error("frames.json not found or empty.");
  const renderSize = resolveRenderDimensions(
    framesManifest?.renderSize?.cameraFormat || framesManifest?.sceneSpec?.cameraFormat || "vertical",
  );

  const failedFrame = framesManifest.frames.find((frame) => clean(frame.status) !== "done");
  if (failedFrame) {
    throw new Error(`Frame ${failedFrame.frameNumber} is not ready for video render.`);
  }

  if (statusDoc?.stages?.video) {
    statusDoc.stages.video.status = "running";
    statusDoc.stages.video.updatedAt = new Date().toISOString();
    statusDoc.state = "rendering_video";
    statusDoc.currentStage = "video";
    statusDoc.message = "Rendering captioned video";
    await writeJson(runPaths.statusPath, statusDoc);
  }

  await composeCaptionedFramesForRun({ projectRoot, runDir: runPaths.runDir, onlyDirty: true });

  const refreshedFrames = await readJson(runPaths.framesPath, framesManifest);
  await writeSrt(runPaths, refreshedFrames.frames);
  await writeConcat(runPaths, refreshedFrames.frames);

  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    runPaths.concatPath,
    "-vf",
    `scale=${renderSize.width}:${renderSize.height},setsar=1,format=yuv420p`,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    runPaths.videoPath,
  ];

  try {
    await runFfmpeg(args, runPaths.runDir);
  } catch (error) {
    if (statusDoc?.stages?.video) {
      statusDoc.stages.video.status = "error";
      statusDoc.stages.video.error = error instanceof Error ? error.message : String(error);
      statusDoc.state = "error";
      statusDoc.error = statusDoc.stages.video.error;
      await writeJson(runPaths.statusPath, statusDoc);
    }
    throw error;
  }

  if (statusDoc?.stages?.video) {
    statusDoc.stages.video.status = "done";
    statusDoc.stages.video.updatedAt = new Date().toISOString();
    statusDoc.stages.video.error = null;
    statusDoc.state = "completed";
    statusDoc.currentStage = "video";
    statusDoc.message = "Video ready";
    statusDoc.error = null;
    await writeJson(runPaths.statusPath, statusDoc);
  }

  return {
    runPaths,
    videoPath: runPaths.videoPath,
  };
}
