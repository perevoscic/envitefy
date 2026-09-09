import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption, Film, Sweep } from "./Shared";
export function WideHook() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film name="wide-edit-hook-v3.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg,#160e3865,transparent 60%),linear-gradient(0deg,#160e3860,transparent 35%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 58,
          fontSize: 58,
          lineHeight: 1.03,
          fontWeight: 800,
          color: "white",
          letterSpacing: -2,
          textShadow: "0 4px 20px #160b4080",
        }}
      >
        Their birthday. Their imagination.
      </div>
      <div
        style={{
          position: "absolute",
          left: 98,
          top: 147,
          fontSize: 29,
          opacity: f < 30 ? 1 : 0,
          fontWeight: 700,
          color: "#fff0ba",
        }}
      >
        Meet John. Turning 10.
      </div>
      <Caption>
        {f < 46
          ? "My birthday needs dinosaurs…"
          : f < 82
            ? "…in space…"
            : f < 119
              ? "…with a DISCO!"
              : "One very serious dance move."}
      </Caption>
      <Sweep />
    </AbsoluteFill>
  );
}
