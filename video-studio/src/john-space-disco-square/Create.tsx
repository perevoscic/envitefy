import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Caption, Film, Heading, Paper, ProductCrop, Sweep } from "./Shared";
export function SquareCreate() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film
        name="wide-edit-create-v3.mp4"
        style={{ objectPosition: "12% 50%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#21113c80,transparent 35%,transparent 76%,#21113c60)",
        }}
      />
      {f >= 65 ? <Paper /> : null}
      <Heading dark={f >= 65}>Envitefy Concierge</Heading>
      {f < 65 ? (
        <Caption>Bring their birthday ideas to life.</Caption>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 175,
              textAlign: "center",
              fontSize: 30,
              fontWeight: 600,
              color: "#786488",
            }}
          >
            Envitefy Live Card Demo
          </div>
          <Sequence from={65} durationInFrames={50}>
            <ProductCrop
              name="square-ui-ideas.mp4"
              left={175}
              top={245}
              width={730}
              height={660}
            />
            <div
              style={{
                position: "absolute",
                left: 80,
                right: 80,
                top: 945,
                textAlign: "center",
                fontSize: 36,
                color: "#50366d",
                fontWeight: 700,
              }}
            >
              His ideas. Your party details.
            </div>
          </Sequence>
          <Sequence from={115} durationInFrames={95}>
            <ProductCrop
              name="wide-ui-live.mp4"
              left={315}
              top={235}
              width={450}
              height={675}
              cropX={16}
              cropY={55}
              sourceWidth={398}
            />
            <div
              style={{
                position: "absolute",
                left: 70,
                right: 70,
                top: 957,
                textAlign: "center",
                fontSize: 37,
                color: "#50366d",
                fontWeight: 700,
              }}
            >
              Made to tap, share and celebrate.
            </div>
          </Sequence>
        </>
      )}
      <Sweep />
    </AbsoluteFill>
  );
}
