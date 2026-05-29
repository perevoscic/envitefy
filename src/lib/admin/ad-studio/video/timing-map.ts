import type { VeoPromptPackage, VideoScript } from "@/lib/admin/ad-studio/types";

function parseStart(timestamp: string): number {
  const match = timestamp.match(/0:(\d{2})/);
  return match ? Number(match[1]) : 0;
}

export function buildTimingMap(script: VideoScript): VeoPromptPackage["timingMap"] {
  return script.scenes.map((scene) => {
    const startSecond = parseStart(scene.timestamp);
    return {
      sceneNumber: scene.sceneNumber,
      startSecond,
      endSecond: startSecond + scene.durationSeconds,
      overlayText: scene.onScreenText,
    };
  });
}
