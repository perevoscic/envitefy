import { Video } from "@remotion/media";
import { AbsoluteFill, CanvasImage, interpolate, staticFile, useCurrentFrame } from "remotion";
import { DialogueCaption } from "./Caption";

const captions = [
  {
    text: "Actually, I want",
    startMs: 2000,
    endMs: 3250,
    timestampMs: null,
    confidence: null,
  },
  {
    text: "a different theme.",
    startMs: 3250,
    endMs: 4800,
    timestampMs: null,
    confidence: null,
  },
];
export function BirthdayPayoff() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f7f2f5" }}>
      <Video
        src={staticFile("projects/birthday-second-job/payoff-clean-v4-cfr.mp4")}
        muted
        durationInFrames={172}
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg,transparent 58%,#0008 100%)",
        }}
      />
      {frame < 57 && (
        <div
          style={{
            position: "absolute",
            left: 85,
            right: 125,
            top: 1430,
            color: "white",
            fontSize: 70,
            fontWeight: 850,
            textAlign: "center",
            textShadow: "0 3px 16px #000",
            opacity: interpolate(frame, [49, 57], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Finally. A minute to sit.
        </div>
      )}
      <DialogueCaption captions={captions} />
      {frame >= 162 && (
        <AbsoluteFill
          style={{
            background: "#f7f2f5",
            opacity: interpolate(frame, [162, 171], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}
      {frame >= 162 && (
        <AbsoluteFill
          style={{
            opacity: interpolate(frame, [162, 171], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <CanvasImage
            src={staticFile("brand/apple-touch-icon-120.png")}
            style={{
              position: "absolute",
              top: 380,
              left: 435,
              width: 210,
              height: 210,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 716,
              left: 85,
              right: 85,
              color: "#281e32",
              textAlign: "center",
              fontSize: 97,
              fontWeight: 850,
              lineHeight: 1.06,
              letterSpacing: -4,
            }}
          >
            Less planning.
            <br />
            <span style={{ color: "#703aff" }}>More partying.</span>
          </div>
          <CanvasImage
            src={staticFile("brand/envitefy-com.png")}
            style={{
              position: "absolute",
              top: 1090,
              left: 145,
              width: 790,
              height: "auto",
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
