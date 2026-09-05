import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Brand } from "../Brand";

export function Updates() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="A link that stays current"
      style={{ background: "#ede6ff", color: "#251a3d" }}
    >
      <Brand />
      <Interactive.Div
        name="Sharing headline"
        style={{
          position: "absolute",
          top: 350,
          left: 95,
          right: 95,
          fontSize: 134,
          lineHeight: 1.03,
          letterSpacing: -5,
          fontWeight: 700,
          translate: interpolate(frame, [0, 22], ["0px 45px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        One link.
        <br />
        Still current.
      </Interactive.Div>
      <Interactive.Div
        name="Shared event link"
        style={{
          position: "absolute",
          top: 875,
          left: 95,
          right: 95,
          background: "#ffffff",
          borderRadius: 32,
          padding: "48px 45px",
          boxShadow: "0 20px 75px #4b287617",
          scale: interpolate(frame, [4, 25], [0.92, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            output: "perceptual-scale",
          }),
        }}
      >
        <div style={{ fontSize: 27, color: "#9a88ac", letterSpacing: 5, marginBottom: 23 }}>
          YOUR EVENT LINK
        </div>
        <div style={{ fontSize: 51, fontWeight: 600, color: "#6b3cff" }}>
          envitefy.com / your-event
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Updated details"
        style={{
          position: "absolute",
          top: 1160,
          left: 145,
          right: 145,
          background: "#6336ed",
          color: "#fff",
          borderRadius: 30,
          padding: "42px 45px",
          rotate: "-2deg",
          opacity: interpolate(frame, [30, 48], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [30, 54], ["0px 80px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, color: "#daccff", marginBottom: 18 }}>
          DETAILS UPDATED
        </div>
        <div style={{ fontSize: 52, fontWeight: 600 }}>New time? Same link.</div>
      </Interactive.Div>
      <Interactive.Div
        name="Sharing payoff"
        style={{
          position: "absolute",
          top: 1460,
          left: 95,
          right: 95,
          textAlign: "center",
          fontSize: 42,
          color: "#796589",
          opacity: interpolate(frame, [55, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        A place everyone can return to.
      </Interactive.Div>
    </AbsoluteFill>
  );
}
