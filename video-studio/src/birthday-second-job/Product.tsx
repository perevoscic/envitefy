import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
function Guest({ offset, label }: { offset: number; label: string }) {
  return (
    <AbsoluteFill>
      <Video
        src={staticFile("projects/birthday-second-job/guests.mp4")}
        muted
        trimBefore={offset}
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          left: 85,
          right: 145,
          top: 1400,
          fontSize: 72,
          fontWeight: 850,
          color: "white",
          textAlign: "center",
          padding: 28,
          background: "#21182ce8",
          borderRadius: 26,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
function Demo({ kind }: { kind: "rsvp" | "calendar" }) {
  const frame = useCurrentFrame(),
    rsvp = kind === "rsvp";
  const confirmed = frame >= (rsvp ? 48 : 83);
  return (
    <AbsoluteFill style={{ background: "#f5f0ff", color: "#261c36" }}>
      <CanvasImage
        src={staticFile("brand/apple-touch-icon-120.png")}
        style={{
          position: "absolute",
          top: 85,
          left: 482,
          width: 96,
          height: 96,
        }}
      />
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          top: 199,
          left: 300,
          width: 460,
          height: "auto",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 158,
          top: 340,
          width: 744,
          height: 1116,
          borderRadius: 42,
          overflow: "hidden",
          boxShadow: "0 24px 65px #40236435",
          background: "#10100f",
        }}
      >
        <Video
          src={staticFile(
            `projects/birthday-second-job/demo-card-${kind}-v3.mp4`,
          )}
          muted
          objectFit="contain"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1500,
          left: 85,
          right: 105,
          fontSize: 77,
          fontWeight: 850,
          letterSpacing: -2.8,
          lineHeight: 1.04,
          textAlign: "center",
        }}
      >
        {rsvp ? "RSVP. Done." : "Add to Calendar."}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1612,
          left: 85,
          right: 105,
          fontSize: 47,
          fontWeight: 800,
          lineHeight: 1.14,
          textAlign: "center",
          color: confirmed ? "#237243" : "#55466b",
        }}
      >
        {confirmed
          ? rsvp
            ? "✓ RSVP confirmed"
            : "✓ Calendar event saved"
          : rsvp
            ? "Tap to send your reply."
            : "Tap your calendar."}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1740,
          left: 85,
          right: 105,
          fontSize: 27,
          fontWeight: 650,
          textAlign: "center",
          color: "#695d7b",
        }}
      >
        Envitefy Live Card Demo
      </div>
    </AbsoluteFill>
  );
}
export function BirthdayProduct() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={30}>
        <Guest offset={80} label="The guests?" />
      </Sequence>
      <Sequence from={30} durationInFrames={117}>
        <Demo kind="rsvp" />
      </Sequence>
      <Sequence from={147} durationInFrames={24}>
        <Guest offset={171} label="Already on it." />
      </Sequence>
      <Sequence from={171} durationInFrames={129}>
        <Demo kind="calendar" />
      </Sequence>
    </AbsoluteFill>
  );
}
