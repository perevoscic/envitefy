import { createHash } from "node:crypto";

export function narrationCacheKey(request) {
  return createHash("sha256").update(JSON.stringify(request)).digest("hex").slice(0, 24);
}

// ElevenLabs returns character timing; Remotion consumes words with leading spaces.
export function alignmentToCaptions(alignment) {
  const {
    characters,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  } = alignment ?? {};
  if (
    !Array.isArray(characters) ||
    !Array.isArray(starts) ||
    !Array.isArray(ends) ||
    characters.length !== starts.length ||
    characters.length !== ends.length
  ) {
    throw new Error("ElevenLabs did not return matching character timing arrays.");
  }
  const captions = [];
  let word = "";
  let start = 0;
  let end = 0;
  const flush = () => {
    if (!word) return;
    captions.push({
      text: `${captions.length ? " " : ""}${word}`,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      timestampMs: null,
      confidence: null,
    });
    word = "";
  };
  for (let index = 0; index < characters.length; index++) {
    if (
      typeof characters[index] !== "string" ||
      !Number.isFinite(starts[index]) ||
      !Number.isFinite(ends[index]) ||
      starts[index] < 0 ||
      ends[index] < starts[index]
    ) {
      throw new Error("Invalid ElevenLabs alignment value.");
    }
    if (/^\s+$/.test(characters[index])) {
      flush();
      continue;
    }
    if (!word) start = starts[index];
    word += characters[index];
    end = ends[index];
  }
  flush();
  if (!captions.length) throw new Error("Narration has no timed words.");
  return captions;
}

export function sceneTiming(audioDurationSeconds, fps, leadFrames = 5, tailFrames = 8) {
  if (
    !Number.isFinite(audioDurationSeconds) ||
    audioDurationSeconds <= 0 ||
    !Number.isInteger(fps) ||
    fps <= 0
  )
    throw new Error("Invalid audio duration or frame rate.");
  return {
    audioOffsetFrames: leadFrames,
    durationInFrames: Math.ceil(audioDurationSeconds * fps) + leadFrames + tailFrames,
  };
}

export function captionsToSrt(captions) {
  const timestamp = (value) => {
    const ms = Math.max(0, Math.round(value));
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
  };
  return captions
    .map(
      (caption, index) =>
        `${index + 1}\n${timestamp(caption.startMs)} --> ${timestamp(caption.endMs)}\n${caption.text.trim()}\n`,
    )
    .join("\n");
}
