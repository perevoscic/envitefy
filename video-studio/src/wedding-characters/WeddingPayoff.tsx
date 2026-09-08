import { Video } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";

function Moment({ clip, label }: { clip: string; label: string }) {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile(`projects/wedding-characters/${clip}.mp4`)}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg,#10170e65,transparent 27%,transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 82,
          right: 82,
          color: "#fffdf3",
          textShadow: "0 2px 14px #1c231e66",
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 0.5,
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Every wedding has its characters.
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 78,
            fontStyle: "italic",
            letterSpacing: -2,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
}
export function WeddingPayoff() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={36} name="Perfectly dressed">
        <Moment clip="planner-payoff" label="Perfectly dressed." />
      </Sequence>
      <Sequence from={36} durationInFrames={42} name="Owning the dance floor">
        <Moment clip="dancer-payoff" label="Fully rehearsed." />
      </Sequence>
      <Sequence from={78} durationInFrames={36} name="Still crying">
        <Moment clip="crier-payoff" label="Still crying." />
      </Sequence>
    </AbsoluteFill>
  );
}
