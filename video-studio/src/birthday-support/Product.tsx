import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CaptionBlock } from "./Caption";
const asset = (name: string) => staticFile(`projects/birthday-support/${name}`);
function HeadsetOff() {
  return (
    <AbsoluteFill>
      <Video
        src={asset("share-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg,#0006,transparent 40%)" }}
      />
      <CaptionBlock>
        One invitation.
        <br />
        Everyone in the loop.
      </CaptionBlock>
    </AbsoluteFill>
  );
}
function Guest({ offset }: { offset: number }) {
  return (
    <AbsoluteFill>
      <Video
        src={asset("guests.mp4")}
        muted
        trimBefore={offset}
        objectFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg,#0006,transparent 42%)" }}
      />
      <CaptionBlock>
        One invitation.
        <br />
        Everyone in the loop.
      </CaptionBlock>
    </AbsoluteFill>
  );
}
function Phone({ kind }: { kind: "details" | "rsvp" | "calendar" }) {
  const frame = useCurrentFrame();
  const complete =
    frame >= (kind === "rsvp" ? 51 : kind === "calendar" ? 61 : 39);
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 90% 70%,#e2d9ff,transparent 60%),linear-gradient(135deg,#fffaf0,#f7edff)",
        color: "#292033",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 102,
          left: 80,
          right: 145,
          fontSize: 65,
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 1.04,
          textAlign: "center",
        }}
      >
        One invitation.
        <br />
        Everyone in the loop.
      </div>
      <div
        style={{
          position: "absolute",
          top: 293,
          left: 145,
          width: 738,
          height: 1144,
          border: "12px solid #211b26",
          borderRadius: 48,
          paddingTop: 27,
          background: "#211b26",
          boxShadow: "0 25px 75px #4f226b3d",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 320,
            width: 80,
            height: 7,
            borderRadius: 8,
            background: "#554d5b",
          }}
        />
        <Video
          src={asset(`demo-${kind}.mp4`)}
          muted
          objectFit="contain"
          style={{
            width: 714,
            height: 1071,
            borderRadius: 27,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 290,
            width: 135,
            height: 6,
            borderRadius: 8,
            background: "#827888",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1484,
          left: 70,
          right: 145,
          fontSize: 61,
          fontWeight: 900,
          letterSpacing: -1.8,
          textAlign: "center",
          lineHeight: 1.08,
        }}
      >
        {kind === "details"
          ? "All the party details."
          : kind === "rsvp"
            ? "RSVP on the spot."
            : "Add to Calendar."}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1571,
          left: 70,
          right: 145,
          fontSize: 39,
          fontWeight: 750,
          textAlign: "center",
          color: complete ? "#29754d" : "#6c5b78",
        }}
      >
        {kind === "details"
          ? complete
            ? "One link, ready to share."
            : "Time. Place. Sorted."
          : kind === "rsvp"
            ? complete
              ? "✓ RSVP confirmed"
              : "Tap to send your reply."
            : complete
              ? "✓ Calendar file saved"
              : "Tap your calendar."}
      </div>
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          top: 1647,
          left: 344,
          width: 330,
          height: "auto",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 1740,
          left: 75,
          right: 145,
          textAlign: "center",
          fontSize: 25,
          color: "#7c6d85",
          fontWeight: 650,
        }}
      >
        Envitefy Live Card Demo
      </div>
    </AbsoluteFill>
  );
}
export function SupportProduct() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={60}>
        <HeadsetOff />
      </Sequence>
      <Sequence from={60} durationInFrames={66}>
        <Phone kind="details" />
      </Sequence>
      <Sequence from={126} durationInFrames={18}>
        <Guest offset={30} />
      </Sequence>
      <Sequence from={144} durationInFrames={90}>
        <Phone kind="rsvp" />
      </Sequence>
      <Sequence from={234} durationInFrames={18}>
        <Guest offset={120} />
      </Sequence>
      <Sequence from={252} durationInFrames={78}>
        <Phone kind="calendar" />
      </Sequence>
    </AbsoluteFill>
  );
}
