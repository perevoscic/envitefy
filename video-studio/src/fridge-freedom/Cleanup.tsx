import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { asset } from "./Shared";
export function FridgeCleanup() {
  return (
    <AbsoluteFill>
      <Video
        objectFit="cover"
        src={asset("cleanup-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
    </AbsoluteFill>
  );
}
export function FridgePayoff() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Video
        objectFit="cover"
        src={asset("payoff-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,transparent 26%,#f9f2e640 43%,#f9f2e6f7 63%,#f9f2e6 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 490,
          right: 90,
          width: 345,
          height: 635,
          borderRadius: 34,
          border: "8px solid #2b2629",
          overflow: "hidden",
          boxShadow: "0 20px 55px #32281e50",
          opacity: interpolate(frame, [9, 19], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0 ${interpolate(frame, [9, 23], [28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
        }}
      >
        <Video
          objectFit="cover"
          src={asset("demo-calendar-saved.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 115,
          top: 1190,
          textAlign: "center",
          fontSize: 77,
          lineHeight: 1.12,
          fontWeight: 750,
          letterSpacing: -3,
          color: "#35352c",
        }}
      >
        Keep the memories.
        <br />
        <span style={{ color: "#69765e" }}>Lose the paper clutter.</span>
      </div>
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          width: 610,
          left: 220,
          top: 1465,
          height: "auto",
        }}
      />
    </AbsoluteFill>
  );
}
