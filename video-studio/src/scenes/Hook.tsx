import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Brand } from "../Brand";

export function Hook() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill name="Scattered details" style={{ background: "#f8f5ee", color: "#251a3d" }}>
      <Brand />
      <Interactive.Div
        name="Opening headline"
        style={{
          position: "absolute",
          top: 380,
          left: 95,
          right: 95,
          fontSize: 144,
          fontWeight: 700,
          lineHeight: 1.02,
          letterSpacing: -6,
          translate: interpolate(frame, [0, 22], ["0px 55px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        Great plans.
        <br />
        <span style={{ color: "#6b3cff" }}>Lost in scroll.</span>
      </Interactive.Div>
      <Interactive.Div
        name="Invitation fragment"
        style={{
          position: "absolute",
          top: 875,
          left: 135,
          width: 790,
          height: 380,
          padding: 56,
          background: "#ebe3ff",
          borderRadius: 30,
          rotate: interpolate(frame, [0, 125], ["-5deg", "-2deg"], { extrapolateRight: "clamp" }),
          translate: interpolate(frame, [10, 32], ["0px 120px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          boxShadow: "0 24px 64px #251a3d12",
        }}
      >
        <div style={{ fontSize: 29, letterSpacing: 6, color: "#7659ab" }}>YOU’RE INVITED</div>
        <div style={{ marginTop: 30, fontSize: 72, lineHeight: 1.1, fontWeight: 600 }}>
          The garden
          <br />
          gathering
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Missing time message"
        style={{
          position: "absolute",
          top: 1180,
          left: 225,
          width: 700,
          background: "white",
          padding: "44px 46px",
          borderRadius: 30,
          fontSize: 48,
          boxShadow: "0 20px 60px #251a3d14",
          rotate: "3deg",
          opacity: interpolate(frame, [32, 46], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [32, 55], ["0px 75px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        “What time was it?”
      </Interactive.Div>
      <Interactive.Div
        name="Missing address message"
        style={{
          position: "absolute",
          top: 1360,
          left: 105,
          width: 730,
          background: "#ffd9bd",
          padding: "42px 46px",
          borderRadius: 30,
          fontSize: 48,
          rotate: "-2deg",
          opacity: interpolate(frame, [53, 68], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [53, 78], ["0px 65px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        “Can you send the address?”
      </Interactive.Div>
    </AbsoluteFill>
  );
}
