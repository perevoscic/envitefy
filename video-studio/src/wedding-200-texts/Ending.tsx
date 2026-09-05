import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { SpokenCaption } from "./Caption";
import captions from "./captions.json";
export function WeddingEnding() {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile("projects/wedding-200-texts/payoff-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg,transparent 60%,#0004)" }}
      />
      <SpokenCaption captions={captions.ending} />
    </AbsoluteFill>
  );
}
