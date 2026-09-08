import { Video } from "@remotion/media";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { asset } from "./Shared";
export function FridgeOpening() {
  const frame = useCurrentFrame();
  const caption =
    frame >= 34 && frame < 63
      ? "Can I go?"
      : frame >= 165
        ? "There has to be a better way."
        : null;
  return (
    <AbsoluteFill>
      <Video
        objectFit="cover"
        src={asset("opening.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 95,
            right: 130,
            bottom: 230,
            textAlign: "center",
            color: "white",
            fontSize: 64,
            fontWeight: 750,
            lineHeight: 1.13,
            textShadow: "0 3px 8px #000,0 1px 25px #0008",
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
