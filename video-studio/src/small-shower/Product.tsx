import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { OffthreadVideo as Video } from "remotion";
import { Film, usePortrait, asset, cream, ink } from "./Shared";
type Kind =
  | "chat"
  | "card"
  | "details"
  | "share"
  | "rsvp"
  | "gift"
  | "calendar"
  | "directions";
const names: Record<Kind, string> = {
  chat: "Envitefy Concierge",
  card: "Your theme. Your details.\nOne live invitation.",
  details: "Your theme. Your details.\nOne live invitation.",
  share: "Your theme. Your details.\nOne live invitation.",
  rsvp: "RSVP in a tap.",
  gift: "Browse the Gift List.",
  calendar: "Add it to your calendar.",
  directions: "Directions, one tap away.",
};
const Screen = ({ kind }: { kind: Kind }) => {
  const f = useCurrentFrame(),
    v = usePortrait();
  const full = kind === "card" || kind === "share";
  const chat = kind === "chat";
  const w = v ? 920 : full ? 610 : 1050;
  const h = v ? 1000 : full ? 750 : chat ? 540 : 750;
  const startScale = full ? (v ? 1.58 : 1.2) : v ? 1.58 : 1.19;
  const closeScale =
    kind === "rsvp"
      ? v
        ? 2.15
        : 2.65
      : kind === "details"
        ? v
          ? 2.2
          : 1.97
        : v
          ? 2.55
          : 2.8;
  const zoom = chat
    ? 1
    : full
      ? 0
      : interpolate(f, [7, 18], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  const scale = chat
    ? v
      ? 2.14
      : 2.44
    : interpolate(zoom, [0, 1], [startScale, closeScale]);
  const targetY =
    kind === "rsvp"
      ? v
        ? 300
        : 410
      : kind === "details"
        ? 330
        : kind === "directions"
          ? 435
          : 420;
  const centerY = full ? 350 : interpolate(zoom, [0, 1], [350, targetY]);
  const top = chat ? (v ? -15 : -100) : h / 2 - centerY * scale;
  return (
    <div
      style={{
        position: "absolute",
        left: v ? 80 : full ? 260 : 90,
        top: v ? 670 : full ? 235 : chat ? 275 : 235,
        width: w,
        height: h,
        overflow: "hidden",
        borderRadius: 28,
        background: "#fbfaf6",
        boxShadow: "0 24px 65px #33432c1c",
      }}
    >
      <Video
        src={asset(`ui-${kind}.mp4`)}
        muted
        style={{
          position: "absolute",
          width: 430 * scale,
          height: 800 * scale,
          maxWidth: "none",
          left: w / 2 - 215 * scale,
          top,
        }}
      />
    </div>
  );
};
const Stage = ({
  kind,
  guest,
}: {
  kind: Kind;
  guest?: "rsvp" | "gift" | "logistics";
}) => {
  const v = usePortrait();
  return (
    <AbsoluteFill
      style={{ background: cream, color: ink, fontFamily: "Josefin Sans" }}
    >
      <div
        style={{
          position: "absolute",
          left: v ? 0 : 1220,
          top: v ? 215 : 0,
          width: v ? 1080 : 700,
          height: v ? 405 : 1080,
          overflow: "hidden",
        }}
      >
        <Film
          name={guest ? `edit-guest-${guest}` : "edit-create"}
          position={guest ? "75%" : "70%"}
          trimBefore={kind === "directions" ? 51 : 0}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: v ? 80 : 90,
          top: v ? 75 : 65,
          width: v ? 920 : 1050,
          fontFamily: kind === "chat" ? "Josefin Sans" : "Georgia",
          fontWeight: kind === "chat" ? 600 : 400,
          fontSize: v ? (kind === "chat" ? 62 : 58) : kind === "chat" ? 66 : 58,
          lineHeight: 1.1,
          whiteSpace: "pre-line",
        }}
      >
        {names[kind]}
      </div>
      <Screen kind={kind} />
      {kind === "share" ? (
        <div
          style={{
            position: "absolute",
            left: v ? 80 : 90,
            top: v ? 1740 : 995,
            width: v ? 920 : 1050,
            textAlign: "center",
            fontSize: v ? 33 : 36,
            fontWeight: 600,
          }}
        >
          Live link copied · ready to share
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
export const Product = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={24}>
        <Film name="edit-create" position="60%" />
      </Sequence>
      <Sequence from={24} durationInFrames={72}>
        <Stage kind="chat" />
      </Sequence>
      <Sequence from={96} durationInFrames={54}>
        <Stage kind="card" />
      </Sequence>
      <Sequence from={150} durationInFrames={54}>
        <Stage kind="details" />
      </Sequence>
      <Sequence from={204} durationInFrames={66}>
        <Stage kind="share" />
      </Sequence>
      <Sequence from={270} durationInFrames={66}>
        <Stage kind="rsvp" guest="rsvp" />
      </Sequence>
      <Sequence from={336} durationInFrames={48}>
        <Stage kind="gift" guest="gift" />
      </Sequence>
      <Sequence from={384} durationInFrames={51}>
        <Stage kind="calendar" guest="logistics" />
      </Sequence>
      <Sequence from={435} durationInFrames={45}>
        <Stage kind="directions" guest="logistics" />
      </Sequence>
    </AbsoluteFill>
  );
};
