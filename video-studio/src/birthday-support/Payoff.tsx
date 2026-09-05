import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile } from "remotion";
import { Dialogue } from "./Caption";
import captions from "./payoff-captions.json";
export function SupportPayoff() {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile("projects/birthday-support/payoff-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg,transparent 58%,#0004 100%)",
        }}
      />
      <Dialogue captions={captions} />
    </AbsoluteFill>
  );
}
