import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SpokenCaption } from "./Caption";
import captions from "./captions.json";
export function WeddingOpening() {
  const frame = useCurrentFrame();
  const notes = [
    "Where’s the venue?",
    "What time is the ceremony?",
    "How do I RSVP?",
  ];
  return (
    <AbsoluteFill>
      <Video
        src={staticFile("projects/wedding-200-texts/chaos.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,#0003,transparent 36%,transparent 66%,#0004)",
        }}
      />
      {notes.map((text, i) => {
        const from = 2 + i * 17;
        return frame >= from && frame < 83 ? (
          <div
            key={text}
            style={{
              position: "absolute",
              left: 85,
              right: 145,
              top: 122 + i * 112,
              padding: "22px 24px",
              borderRadius: 24,
              background: "#fffaf5f2",
              color: "#332326",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.05,
              boxShadow: "0 8px 35px #0003",
              opacity: interpolate(
                frame,
                [from, from + 3, 75, 83],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              translate: `${interpolate(frame, [from, from + 5], [65, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px 0px`,
            }}
          >
            <span style={{ color: "#955462", marginRight: 15 }}>↳</span>
            {text}
          </div>
        ) : null;
      })}
      <SpokenCaption captions={captions.opening} />
    </AbsoluteFill>
  );
}
