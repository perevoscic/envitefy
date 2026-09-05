import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Brand } from "../Brand";

export function Create() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      name="Create from an idea or invitation"
      style={{ background: "#6336ed", color: "white" }}
    >
      <div
        style={{
          position: "absolute",
          width: 950,
          height: 950,
          border: "1px solid #ffffff24",
          borderRadius: "50%",
          top: 700,
          left: 380,
        }}
      />
      <Brand light />
      <Interactive.Div
        name="Creation headline"
        style={{
          position: "absolute",
          top: 355,
          left: 95,
          right: 95,
          fontSize: 128,
          lineHeight: 1.04,
          letterSpacing: -5,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0, 24], ["0px 45px", "0px 0px"], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Start with
        <br />
        what you have.
      </Interactive.Div>
      <Interactive.Div
        name="Idea prompt"
        style={{
          position: "absolute",
          left: 95,
          right: 95,
          top: 790,
          padding: "46px 48px",
          background: "#ffffff17",
          border: "2px solid #ffffff3d",
          borderRadius: 32,
          opacity: interpolate(frame, [14, 28], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 27, letterSpacing: 5, marginBottom: 24, color: "#ded4ff" }}>
          AN IDEA
        </div>
        <div style={{ fontSize: 49, lineHeight: 1.25 }}>
          “A garden party with
          <br />
          our favorite people.”
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="Invitation input"
        style={{
          position: "absolute",
          left: 150,
          right: 150,
          top: 1160,
          padding: "46px 48px",
          background: "#f8f5ee",
          borderRadius: 24,
          color: "#35254c",
          boxShadow: "0 35px 80px #2b0f8066",
          rotate: interpolate(frame, [25, 65], ["6deg", "-3deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [25, 60], ["0px 140px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          opacity: interpolate(frame, [25, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 27, letterSpacing: 5, color: "#927d9d", marginBottom: 26 }}>
          AN INVITATION
        </div>
        <div style={{ fontFamily: "Josefin Slab", fontSize: 76, fontWeight: 700 }}>
          Let’s get together.
        </div>
        <div style={{ fontSize: 33, marginTop: 25, color: "#927d9d" }}>SATURDAY · THE GARDEN</div>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
