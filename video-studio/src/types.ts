import type { Caption } from "@remotion/captions";

export type NarratedScene = {
  id: string;
  narration: string;
  durationInFrames: number;
  durationSeconds: number;
  audioOffsetFrames: number;
  audioFile: string;
  captions: Caption[];
};

export type VideoManifest = {
  id: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  heroImage: string;
  voiceId: string;
  voiceName: string;
  scenes: NarratedScene[];
};

export type VideoProps = { projectId: string; manifest?: VideoManifest };
export type SceneVisualProps = { heroImage: string };
