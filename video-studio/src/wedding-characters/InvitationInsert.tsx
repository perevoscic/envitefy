import { AdaptiveDemo } from "./AdaptiveScenes";
import { useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  staticFile,
  useCurrentFrame,
} from "remotion";

export function InvitationInsert({
  kind,
}: {
  kind: "rsvp" | "calendar" | "quick-rsvp";
}) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (width >= height) return <AdaptiveDemo kind={kind} />;
  const calendar = kind === "calendar";
  const quick = kind === "quick-rsvp";
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 100% 10%,#dce1ce,transparent 60%),#f8f4ec",
        color: "#293426",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 120,
          left: 82,
          right: 82,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontSize: 78,
          lineHeight: 1.1,
          letterSpacing: -2,
        }}
      >
        {calendar ? "Add to Calendar" : "RSVP"}
      </div>
      <div
        style={{
          position: "absolute",
          top: 279,
          left: 127,
          width: 826,
          height: 1250,
          border: "10px solid #30342d",
          borderRadius: 42,
          boxShadow: "0 22px 65px #29342627",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Video
          src={staticFile(
            `projects/wedding-characters/demo-${calendar ? "calendar" : quick ? "quick-rsvp" : "rsvp"}.mp4`,
          )}
          muted
          objectFit="cover"
          style={{ width: 806, height: 1230 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1580,
          left: 80,
          right: 80,
          textAlign: "center",
          fontSize: 39,
          fontWeight: 700,
        }}
      >
        {calendar
          ? "Add it to your calendar."
          : quick || frame >= 38
            ? "RSVP confirmed."
            : "Count me in."}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1650,
          left: 80,
          right: 80,
          textAlign: "center",
          fontSize: 25,
          color: "#747c69",
        }}
      >
        Envitefy Live Card Demo
      </div>
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          top: 1741,
          left: 395,
          width: 290,
          height: "auto",
        }}
      />
    </AbsoluteFill>
  );
}
