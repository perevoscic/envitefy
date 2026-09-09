import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { clamp, Flash, Footage, Label, Phone, Sparkles, Title } from "./Shared";
export function JohnCreate() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage name="vertical-create.mp4" />
      <AbsoluteFill
        style={{
          background: "linear-gradient(#27135555,transparent 50%,#21133635)",
        }}
      />
      <Title size={66}>Envitefy Concierge</Title>
      {f >= 65 ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(145deg,#f7f3ff,#e6e9ff)",
            opacity: interpolate(f, [65, 78], [0, 1], clamp),
          }}
        />
      ) : null}
      {f >= 65 ? (
        <>
          <Title dark size={66}>
            Envitefy Concierge
          </Title>
          <div
            style={{
              position: "absolute",
              top: 275,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 38,
              fontWeight: 700,
              color: "#74648a",
            }}
          >
            Envitefy Live Card Demo
          </div>
          <Sequence from={65} durationInFrames={50}>
            <Phone
              name="vertical-demo-ideas.mp4"
              top={390}
              left={105}
              width={870}
              height={1100}
              cropY={0}
            />
            <Label dark top={1540}>
              His ideas. Your party details.
            </Label>
          </Sequence>
          <Sequence from={115} durationInFrames={45}>
            <Phone
              name="vertical-demo-preview.mp4"
              top={340}
              left={185}
              width={710}
              height={1320}
              cropY={25}
            />
            <Label dark top={1730}>
              A personalized birthday Live Card.
            </Label>
          </Sequence>
          <Sequence from={160}>
            <Phone
              name="vertical-demo-live.mp4"
              top={330}
              left={165}
              width={750}
              height={1280}
              cropY={50}
            />
            <Label dark top={1680}>
              Made to tap, share and celebrate.
            </Label>
          </Sequence>
          <Sparkles />
        </>
      ) : null}
      <Flash />
    </AbsoluteFill>
  );
}
