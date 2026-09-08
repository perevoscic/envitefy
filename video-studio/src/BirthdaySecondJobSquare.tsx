import type { Caption } from "@remotion/captions";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import dadCaptions from "./birthday-second-job/captions.json";

const asset = (name: string) => staticFile(`projects/birthday-second-job/${name}`);
const childCaptions: Caption[] = [
  { text: "Actually, I want", startMs: 2000, endMs: 3250, timestampMs: null, confidence: null },
  { text: "a different theme.", startMs: 3250, endMs: 4800, timestampMs: null, confidence: null },
];
function Wordmark({ width = 360 }: { width?: number }) {
  return (
    <CanvasImage
      src={staticFile("brand/envitefy-com.png")}
      style={{ width, height: "auto", display: "block" }}
    />
  );
}
function SquareCaption({ captions, side = false }: { captions: Caption[]; side?: boolean }) {
  const frame = useCurrentFrame();
  const current = captions.find(
    (caption) => (frame * 1000) / 30 >= caption.startMs && (frame * 1000) / 30 < caption.endMs,
  );
  if (!current) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: side ? 650 : 60,
        right: side ? 48 : 60,
        top: side ? 474 : 868,
        padding: "25px 28px",
        borderRadius: 24,
        background: "#18171cee",
        color: "white",
        textAlign: side ? "left" : "center",
        fontSize: side ? 54 : 62,
        fontWeight: 800,
        letterSpacing: -1.5,
        lineHeight: 1.12,
      }}
    >
      {current.text}
    </div>
  );
}
function SquareChaos() {
  const frame = useCurrentFrame();
  const messages = [
    { at: 7, text: "What time?", top: 480, color: "#fff0bf" },
    { at: 38, text: "Where?", top: 608, color: "#e1d7ff" },
    { at: 69, text: "Can his sister come?", top: 736, color: "#def0d4" },
  ];
  return (
    <AbsoluteFill style={{ background: "#f5f0ff", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 610,
          height: 1084.444,
        }}
      >
        <Video
          src={asset("chaos-wide-prepared-v3.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {frame < 115 && (
        <>
          <div style={{ position: "absolute", left: 650, top: 115, width: 384, color: "#2b2438" }}>
            <div
              style={{
                fontSize: 44,
                fontWeight: 850,
                lineHeight: 1.1,
                letterSpacing: -1.8,
                whiteSpace: "nowrap",
              }}
            >
              Birthday party
              <br />
              planning before
            </div>
            <div style={{ marginTop: 27 }}>
              <Wordmark width={382} />
            </div>
          </div>
          {messages.map((message) => (
            <div
              key={message.at}
              style={{
                position: "absolute",
                left: 650,
                top: message.top,
                padding: "23px 20px",
                borderRadius: 22,
                background: message.color,
                color: "#27212d",
                fontSize: 35,
                fontWeight: 750,
                letterSpacing: -0.9,
                boxShadow: "0 8px 24px #39225514",
                opacity: interpolate(frame, [message.at, message.at + 3], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: `0 ${interpolate(frame, [message.at, message.at + 7], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px`,
              }}
            >
              {message.text}
            </div>
          ))}
        </>
      )}
      {frame >= 115 && frame < 232 && (
        <div style={{ position: "absolute", left: 650, top: 320 }}>
          <Wordmark width={380} />
        </div>
      )}
      <SquareCaption captions={dadCaptions} side />
      {frame >= 232 && (
        <div style={{ position: "absolute", left: 650, top: 372, width: 382, color: "#2b2438" }}>
          <Wordmark width={380} />
          <div
            style={{
              marginTop: 37,
              fontSize: 44,
              whiteSpace: "nowrap",
              fontWeight: 850,
              letterSpacing: -1.7,
              lineHeight: 1.09,
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
function SquareGuest({ offset, label }: { offset: number; label: string }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#e9e2d9" }}>
      <div style={{ position: "absolute", left: 0, top: -100, width: 1080, height: 1920 }}>
        <Video
          src={asset("guests.mp4")}
          trimBefore={offset}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 875,
          padding: 24,
          borderRadius: 24,
          background: "#21182ce8",
          color: "white",
          fontSize: 66,
          fontWeight: 850,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
function SquareDemo({ kind }: { kind: "rsvp" | "calendar" }) {
  const frame = useCurrentFrame();
  const rsvp = kind === "rsvp";
  const confirmed = frame >= (rsvp ? 48 : 83);
  return (
    <AbsoluteFill style={{ background: "#f5f0ff", color: "#261c36" }}>
      <CanvasImage
        src={staticFile("brand/apple-touch-icon-120.png")}
        style={{ position: "absolute", top: 126, left: 176, width: 116, height: 116 }}
      />
      <div style={{ position: "absolute", left: 52, top: 280 }}>
        <Wordmark width={364} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 429,
          left: 54,
          width: 350,
          fontSize: 66,
          fontWeight: 850,
          letterSpacing: -2.3,
          lineHeight: 1.04,
        }}
      >
        {rsvp ? (
          <>
            RSVP.
            <br />
            Done.
          </>
        ) : (
          <>
            Add to
            <br />
            Calendar.
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          top: 646,
          left: 54,
          width: 340,
          fontSize: 40,
          fontWeight: 800,
          lineHeight: 1.17,
          color: confirmed ? "#237243" : "#55466b",
        }}
      >
        {confirmed ? (
          rsvp ? (
            <>
              ✓ RSVP
              <br />
              confirmed
            </>
          ) : (
            <>
              ✓ Calendar
              <br />
              event saved
            </>
          )
        ) : rsvp ? (
          <>
            Tap to send
            <br />
            your reply.
          </>
        ) : (
          <>
            Tap your
            <br />
            calendar.
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 921,
          width: 348,
          fontSize: 25,
          fontWeight: 650,
          color: "#695d7b",
          lineHeight: 1.3,
        }}
      >
        Envitefy Live Card Demo
      </div>
      <div
        style={{
          position: "absolute",
          left: 436,
          top: 56,
          width: 592,
          height: 888,
          borderRadius: 34,
          overflow: "hidden",
          boxShadow: "0 20px 50px #40236435",
          background: "#10100f",
        }}
      >
        <Video
          src={asset(`demo-card-${kind}-v3.mp4`)}
          muted
          objectFit="contain"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </AbsoluteFill>
  );
}
function SquareProduct() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={30}>
        <SquareGuest offset={80} label="The guests?" />
      </Sequence>
      <Sequence from={30} durationInFrames={117}>
        <SquareDemo kind="rsvp" />
      </Sequence>
      <Sequence from={147} durationInFrames={24}>
        <SquareGuest offset={171} label="Already on it." />
      </Sequence>
      <Sequence from={171} durationInFrames={129}>
        <SquareDemo kind="calendar" />
      </Sequence>
    </AbsoluteFill>
  );
}
function SquarePayoff() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f7f2f5", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -340, width: 1080, height: 1920 }}>
        <Video
          src={asset("payoff-clean-v4-cfr.mp4")}
          muted
          durationInFrames={172}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg,transparent 66%,#0006 100%)" }} />
      {frame < 57 && (
        <div
          style={{
            position: "absolute",
            top: 870,
            left: 60,
            right: 60,
            color: "white",
            fontSize: 62,
            fontWeight: 850,
            textAlign: "center",
            textShadow: "0 3px 16px #000",
            opacity: interpolate(frame, [49, 57], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Finally. A minute to sit.
        </div>
      )}
      <SquareCaption captions={childCaptions} />
      {frame >= 162 && (
        <AbsoluteFill
          style={{
            background: "#f7f2f5",
            opacity: interpolate(frame, [162, 171], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <CanvasImage
            src={staticFile("brand/apple-touch-icon-120.png")}
            style={{ position: "absolute", left: 430, top: 130, width: 220, height: 220 }}
          />
          <div
            style={{
              position: "absolute",
              left: 60,
              right: 60,
              top: 425,
              color: "#281e32",
              textAlign: "center",
              fontSize: 89,
              fontWeight: 850,
              lineHeight: 1.06,
              letterSpacing: -3.5,
            }}
          >
            Less planning.
            <br />
            <span style={{ color: "#703aff" }}>More partying.</span>
          </div>
          <div style={{ position: "absolute", left: 165, top: 698 }}>
            <Wordmark width={750} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
export function BirthdaySecondJobSquare() {
  return (
    <AbsoluteFill style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={asset("final-mix-v4.wav")} />
      <Sequence durationInFrames={300} name="Birthday admin chaos — square">
        <SquareChaos />
      </Sequence>
      <Sequence from={300} durationInFrames={300} name="Guests and Live Card — square">
        <SquareProduct />
      </Sequence>
      <Sequence from={600} durationInFrames={300} name="The new theme — square">
        <SquarePayoff />
      </Sequence>
    </AbsoluteFill>
  );
}
