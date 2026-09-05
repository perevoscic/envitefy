import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { DialogueCaption } from "./Caption";
import captions from "./captions.json";

const messages = [
  { at: 7, text: "What time?", y: 730, x: 85, color: "#fff5d7" },
  { at: 38, text: "Where?", y: 895, x: 245, color: "#e3dcff" },
  { at: 69, text: "Can his sister come?", y: 1055, x: 95, color: "#e5f4de" },
];
export function BirthdayChaos() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#302d22", overflow: "hidden" }}>
      <Video
        src={staticFile("projects/birthday-second-job/chaos-wide-prepared-v3.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg,#0009 0%,transparent 35%,transparent 65%,#0004 100%)",
        }}
      />
      {frame < 115 && (
        <div
          style={{
            position: "absolute",
            top: 1260,
            left: 85,
            right: 125,
            background: "#fffffff5",
            padding: 28,
            borderRadius: 28,
          }}
        >
          <div
            style={{
              color: "#2b2438",
              fontSize: 76,
              fontWeight: 850,
              lineHeight: 1.05,
              letterSpacing: -2.8,
            }}
          >
            Birthday party
            <br />
            planning before
          </div>
          <CanvasImage
            src={staticFile("brand/envitefy-com.png")}
            style={{
              display: "block",
              width: 620,
              height: "auto",
              marginTop: 20,
            }}
          />
        </div>
      )}
      {frame < 115 &&
        messages.map((m) => (
          <div
            key={m.at}
            style={{
              position: "absolute",
              top: m.y,
              left: m.x,
              padding: "22px 29px",
              borderRadius: 25,
              background: m.color,
              color: "#24202e",
              fontSize: 57,
              fontWeight: 750,
              letterSpacing: -1.5,
              boxShadow: "0 10px 35px #0006",
              opacity: interpolate(frame, [m.at, m.at + 3], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              scale: interpolate(frame, [m.at, m.at + 8], [0.8, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1.4, 0.3, 1),
              }),
            }}
          >
            {m.text}
          </div>
        ))}
      <DialogueCaption captions={captions} />
      {frame >= 232 && (
        <div
          style={{
            position: "absolute",
            left: 85,
            right: 125,
            top: 1340,
            background: "#fffffff5",
            borderRadius: 30,
            padding: "25px 30px 32px",
            boxShadow: "0 20px 50px #0005",
            color: "#2b2438",
          }}
        >
          <CanvasImage
            src={staticFile("brand/envitefy-com.png")}
            style={{ width: 450, height: "auto", marginBottom: 16 }}
          />
          <div
            style={{
              fontSize: 61,
              fontWeight: 800,
              letterSpacing: -1.8,
              lineHeight: 1.06,
            }}
          >
            Birthday invites
            <br />
            just got easier.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}
