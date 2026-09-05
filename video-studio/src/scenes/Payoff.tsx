import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brand } from "../Brand";
import type { SceneVisualProps } from "../types";

export function Payoff({ heroImage }: SceneVisualProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill name="More being there" style={{ background: "#f8f5ee", color: "#251a3d" }}>
      <CanvasImage
        name="Original garden gathering"
        src={staticFile(heroImage)}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          scale: interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, #fffaf3f5 0%, #fffaf3cf 28%, #fffaf300 48%, #1e123700 65%, #1e1237c7 100%)",
        }}
      />
      <Brand />
      <Interactive.Div
        name="Final headline"
        style={{
          position: "absolute",
          top: 350,
          left: 95,
          right: 95,
          fontSize: 133,
          lineHeight: 1.03,
          letterSpacing: -5,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0, 24], ["0px 35px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Less chasing.
        <br />
        <span style={{ color: "#6b3cff" }}>
          More being
          <br />
          there.
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="Website call to action"
        style={{
          position: "absolute",
          top: 1430,
          left: 230,
          right: 230,
          padding: "28px 34px 20px",
          borderRadius: 28,
          background: "#ffffffed",
          color: "#6b3cff",
          textAlign: "center",
          fontSize: 55,
          fontWeight: 600,
          opacity: interpolate(frame, [40, 58], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        envitefy.com
      </Interactive.Div>
    </AbsoluteFill>
  );
}
