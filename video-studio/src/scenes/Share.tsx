import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Brand } from "../Brand";
import type { SceneVisualProps } from "../types";

export function Share({ heroImage }: SceneVisualProps) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill name="One live event page" style={{ background: "#f8f5ee", color: "#251a3d" }}>
      <Brand />
      <Interactive.Div
        name="Event page headline"
        style={{
          position: "absolute",
          top: 330,
          left: 95,
          right: 95,
          fontSize: 128,
          lineHeight: 1.03,
          letterSpacing: -5,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        One page.
        <br />
        <span style={{ color: "#6b3cff" }}>Every detail.</span>
      </Interactive.Div>
      <Interactive.Div
        name="Illustrative event card"
        style={{
          position: "absolute",
          top: 690,
          left: 160,
          right: 160,
          height: 835,
          borderRadius: 38,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 25px 90px #26124522",
          scale: interpolate(frame, [0, 28], [0.9, 1], {
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
          translate: interpolate(frame, [0, 28], ["0px 70px", "0px 0px"], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <CanvasImage
          src={staticFile(heroImage)}
          style={{ width: "100%", height: 330, objectFit: "cover", objectPosition: "center 64%" }}
        />
        <div style={{ padding: "36px 45px" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "#9986b1" }}>EXAMPLE EVENT</div>
          <div style={{ fontSize: 65, fontWeight: 600, lineHeight: 1.08, marginTop: 21 }}>
            The garden gathering
          </div>
          <div style={{ fontSize: 34, color: "#746a81", marginTop: 20 }}>
            Saturday · 5:00 PM
            <br />
            The courtyard
          </div>
          <div style={{ marginTop: 30, display: "flex", gap: 16 }}>
            <div
              style={{
                padding: "22px 35px 17px",
                borderRadius: 19,
                background: "#6b3cff",
                color: "white",
                fontSize: 34,
                fontWeight: 600,
              }}
            >
              RSVP
            </div>
            <div
              style={{
                padding: "22px 25px 17px",
                borderRadius: 19,
                background: "#f0eaff",
                color: "#6b3cff",
                fontSize: 34,
              }}
            >
              Directions
            </div>
            <div
              style={{
                padding: "22px 23px 17px",
                borderRadius: 19,
                background: "#f0eaff",
                color: "#6b3cff",
                fontSize: 34,
              }}
            >
              Calendar
            </div>
          </div>
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
