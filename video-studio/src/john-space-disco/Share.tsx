import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { clamp, Footage, Label, Phone, Title, URL } from "./Shared";
function Action({ name, label }: { name: string; label: string }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(f, [0, 6], [0.3, 1], clamp),
        translate: `0 ${interpolate(f, [0, 9], [75, 0], clamp)}px`,
      }}
    >
      <Phone
        name={name}
        top={820}
        left={95}
        width={890}
        height={690}
        cropY={270}
      />
      <Label top={1540} dark>
        {label}
      </Label>
    </AbsoluteFill>
  );
}
export function JohnShare() {
  return (
    <AbsoluteFill style={{ background: "#ddd6fb" }}>
      <Footage name="vertical-guests.mp4" />
      <div
        style={{
          position: "absolute",
          inset: "490px 0 0",
          background:
            "linear-gradient(transparent,#eae4ffa6 14%,#eae4ffe6 65%,#eae4fff5)",
        }}
      />
      <Title top={550} size={70} dark>
        One link.
        <br />
        All the party details.
      </Title>
      <Sequence durationInFrames={62}>
        <Action name="vertical-demo-rsvp.mp4" label="RSVP on the spot." />
      </Sequence>
      <Sequence from={62} durationInFrames={43}>
        <Action name="vertical-demo-gift.mp4" label="View the Gift List." />
      </Sequence>
      <Sequence from={105} durationInFrames={52}>
        <Action
          name="vertical-demo-directions.mp4"
          label="Directions, one tap away."
        />
      </Sequence>
      <Sequence from={157} durationInFrames={53}>
        <Action
          name="vertical-demo-calendar.mp4"
          label="Add it to your calendar."
        />
      </Sequence>
      <URL />
    </AbsoluteFill>
  );
}
