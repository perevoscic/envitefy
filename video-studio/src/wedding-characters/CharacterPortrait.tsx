import { Video } from "@remotion/media";
import { AbsoluteFill, useCurrentFrame, staticFile } from "remotion";

export function CharacterPortrait({
  clip,
  character,
  dialogue = false,
}: {
  clip: string;
  character: "The Planner" | "The Dancer" | "The Crier";
  dialogue?: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Video
        src={staticFile(`projects/wedding-characters/${clip}.mp4`)}
        muted
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg,rgba(24,25,20,.28),transparent 23%,transparent 74%,rgba(24,25,20,.16))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 118,
          color: "#fffdf5",
          textShadow: "0 2px 14px #25281d55",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 5,
            fontWeight: 700,
            marginBottom: 13,
          }}
        >
          WEDDING GUEST FILES
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 78,
            fontStyle: "italic",
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {character}
        </div>
        <div
          style={{ width: 86, height: 3, background: "#fffdf5", marginTop: 24 }}
        />
      </div>
      {dialogue && frame >= 38 && frame < 101 ? (
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 90,
            bottom: 190,
            textAlign: "center",
            color: "#fff",
            fontSize: 47,
            fontWeight: 700,
            textShadow: "0 2px 12px #000b",
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#20251edb",
              padding: "17px 25px",
              borderRadius: 9,
            }}
          >
            Been ready since February.
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
