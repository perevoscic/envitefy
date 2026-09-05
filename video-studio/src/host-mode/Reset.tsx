import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";

export function Reset() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="The interruption"
      style={{
        background: "#dcf679",
        justifyContent: "center",
        alignItems: "center",
        color: "#1d1729",
      }}
    >
      <Interactive.Div
        name="Wait"
        style={{
          fontSize: 205,
          fontWeight: 900,
          letterSpacing: -12,
          rotate: "-5deg",
          scale: interpolate(frame, [0, 6, 14], [1.15, 1, 1], { extrapolateRight: "clamp" }),
        }}
      >
        pause.
      </Interactive.Div>
    </AbsoluteFill>
  );
}
