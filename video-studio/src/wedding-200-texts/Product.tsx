import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
const asset = (name: string) =>
  staticFile(`projects/wedding-200-texts/${name}`);
function People({
  share = false,
  offset = 0,
}: {
  share?: boolean;
  offset?: number;
}) {
  return (
    <AbsoluteFill>
      <Video
        src={asset(share ? "share-edit.mp4" : "guests.mp4")}
        trimBefore={offset}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      {share ? (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 295,
            width: 430,
            padding: "16px 25px",
            borderRadius: 23,
            background: "#fffaf3ed",
          }}
        >
          <CanvasImage
            src={staticFile("brand/envitefy-com.png")}
            style={{ width: 380, height: "auto" }}
          />
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
function Phone({ kind }: { kind: "details" | "rsvp" | "calendar" }) {
  const frame = useCurrentFrame();
  const complete =
    frame >= (kind === "rsvp" ? 42 : kind === "calendar" ? 65 : 37);
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 100% 55%,#e9ded0,transparent 60%),#fff9ee",
        color: "#3c2830",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 112,
          left: 65,
          right: 125,
          textAlign: "center",
          fontSize: 61,
          lineHeight: 1.13,
          letterSpacing: -1.7,
          fontWeight: 850,
        }}
      >
        Wedding details. RSVPs.
        <br />
        Calendar reminders.
        <br />
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            color: "#7d354c",
          }}
        >
          All together.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 377,
          left: 140,
          width: 738,
          height: 1137,
          border: "11px solid #342c2b",
          borderRadius: 47,
          paddingTop: 25,
          background: "#342c2b",
          overflow: "hidden",
          boxShadow: "0 22px 55px #65453628",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 320,
            width: 77,
            height: 6,
            borderRadius: 8,
            background: "#837975",
          }}
        />
        <Video
          src={asset(`demo-${kind}.mp4`)}
          muted
          objectFit="contain"
          style={{ width: 716, height: 1074, borderRadius: 25 }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 290,
            width: 130,
            height: 6,
            borderRadius: 8,
            background: "#b2a7a2",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1550,
          left: 65,
          right: 125,
          textAlign: "center",
          fontSize: 49,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        {kind === "details"
          ? "One link. Every wedding detail."
          : kind === "rsvp"
            ? complete
              ? "✓ RSVP confirmed"
              : "RSVP on the spot."
            : complete
              ? "✓ Calendar file saved"
              : "Add it to your calendar."}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1636,
          left: 65,
          right: 125,
          textAlign: "center",
          fontSize: 28,
          color: "#85716e",
          fontWeight: 600,
        }}
      >
        Envitefy Live Card Demo
      </div>
    </AbsoluteFill>
  );
}
export function WeddingProduct() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={36}>
        <People share />
      </Sequence>
      <Sequence from={36} durationInFrames={78}>
        <Phone kind="details" />
      </Sequence>
      <Sequence from={114} durationInFrames={18}>
        <People offset={27} />
      </Sequence>
      <Sequence from={132} durationInFrames={99}>
        <Phone kind="rsvp" />
      </Sequence>
      <Sequence from={231} durationInFrames={18}>
        <People offset={105} />
      </Sequence>
      <Sequence from={249} durationInFrames={81}>
        <Phone kind="calendar" />
      </Sequence>
    </AbsoluteFill>
  );
}
