import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { clamp, Film, ProductCrop, Sweep } from "./Shared";
export function WideCreate() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film name="wide-edit-create-v3.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg,transparent 42%,#17133540 60%,#1912358a)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1060,
          top: 78,
          fontSize: 61,
          fontWeight: 800,
          color: "white",
          lineHeight: 1.02,
        }}
      >
        Envitefy Concierge
      </div>
      <div
        style={{
          position: "absolute",
          left: 1065,
          top: 155,
          fontSize: 30,
          color: "#e6dcff",
          fontWeight: 600,
        }}
      >
        A birthday idea becomes a live invitation.
      </div>
      <Sequence durationInFrames={70}>
        <ProductCrop
          name="wide-ui-ideas.mp4"
          left={1040}
          top={250}
          width={790}
          height={590}
          cropY={0}
          sourceWidth={430}
        />
      </Sequence>
      <Sequence from={70} durationInFrames={140}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: interpolate(f, [70, 80], [0, 1], clamp),
          }}
        >
          <ProductCrop
            name="wide-ui-live.mp4"
            left={1303}
            top={223}
            width={494}
            height={741}
            cropX={16}
            cropY={55}
            sourceWidth={398}
          />
        </div>
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 87,
          color: "white",
          fontWeight: 700,
          fontSize: 31,
          padding: "17px 22px",
          borderRadius: 19,
          background: "#221d40db",
        }}
      >
        Bring their birthday ideas to life.
      </div>
      <Sweep />
    </AbsoluteFill>
  );
}
