import type { Caption } from "@remotion/captions";
import { Audio, Video } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import captions from "./captions.json";
import discoveryTracking from "./discovery-tracking.json";
import openingTracking from "./opening-tracking-v3.json";

const A = "projects/mom-just-snap-it/";
const C = {
  ink: "#254d50",
  cream: "#fff8ed",
  coral: "#e88979",
  teal: "#438f8b",
  purple: "#7650d3",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SNAP_TIMELINE = [
  { id: "overload", from: 0, duration: 210 },
  { id: "discovery", from: 210, duration: 270 },
  { id: "digital", from: 480, duration: 300 },
  { id: "payoff", from: 780, duration: 150 },
  { id: "finish", from: 930, duration: 120 },
] as const;
type SceneId = (typeof SNAP_TIMELINE)[number]["id"];

function Film({
  file,
  style,
  position = "50% 50%",
  trim = 0,
}: {
  file: string;
  style: React.CSSProperties;
  position?: string;
  trim?: number;
}) {
  const frame = useCurrentFrame() + trim;
  const track = file === "discovery-edit.mp4" ? discoveryTracking[frame] : undefined;
  const videoWidth = Number(style.width);
  const videoHeight = Number(style.height);
  const mediaScale = Math.max(videoWidth / 1920, videoHeight / 1080);
  const [positionX, positionY] = position.split(" ").map((value) => parseFloat(value) / 100);
  const q = track?.quad;
  const opening = file === "opening-v3-final.mp4" ? openingTracking[frame] : undefined;
  return (
    <div style={{ position: "absolute", overflow: "hidden", ...style }}>
      <Video
        src={staticFile(A + file)}
        muted
        trimBefore={trim}
        objectFit="cover"
        style={{ width: "100%", height: "100%", objectPosition: position }}
      />
      {opening?.matrix && opening.opacity > 0 ? (
        <div
          style={{
            position: "absolute",
            width: 1920,
            height: 1080,
            left: (videoWidth - 1920 * mediaScale) * positionX,
            top: (videoHeight - 1080 * mediaScale) * positionY,
            transform: `scale(${mediaScale})`,
            transformOrigin: "0 0",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `path(evenodd, "${opening.clip}")`,
            }}
          >
            <svg
              aria-hidden="true"
              width="400"
              height="500"
              viewBox="0 0 400 500"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                overflow: "visible",
                transform: `matrix3d(${opening.matrix.join(",")})`,
                transformOrigin: "0 0",
              }}
              fill="#31565a"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
            >
              <text x="200" y="95" fontSize="62" fontWeight="700">
                Mia’s 8th
              </text>
              <text x="200" y="163" fontSize="64" fontWeight="700">
                Birthday
              </text>
              <text x="200" y="238" fontSize="36" fontWeight="700">
                SAT OCT 17, 2026
              </text>
              <text x="200" y="303" fontSize="46" fontWeight="700">
                2–4 PM
              </text>
              <text x="200" y="373" fontSize="40" fontWeight="700">
                MAPLE PARK
              </text>
              <text x="200" y="432" fontSize="29" fontWeight="600">
                820 W 7th Street
              </text>
              <text x="200" y="478" fontSize="28" fontWeight="600">
                Austin, TX
              </text>
            </svg>
          </div>
        </div>
      ) : null}
      {q && track.opacity > 0 ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 1920 1080"
          style={{
            position: "absolute",
            width: 1920 * mediaScale,
            height: 1080 * mediaScale,
            left: (videoWidth - 1920 * mediaScale) * positionX,
            top: (videoHeight - 1080 * mediaScale) * positionY,
            opacity: track.opacity,
            pointerEvents: "none",
          }}
        >
          <g
            transform={`matrix(${(q[1][0] - q[0][0]) / 400} ${(q[1][1] - q[0][1]) / 400} ${(q[3][0] - q[0][0]) / 340} ${(q[3][1] - q[0][1]) / 340} ${q[0][0]} ${q[0][1]})`}
            fill="#385558"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            <text x="200" y="93" fontSize="55" fontWeight="700">
              Mia’s 8th
            </text>
            <text x="200" y="151" fontSize="58" fontWeight="700">
              Birthday
            </text>
            <text x="200" y="221" fontSize="35" fontWeight="700">
              SAT OCT 17
            </text>
            <text x="200" y="268" fontSize="37" fontWeight="700">
              2–4 PM
            </text>
            <text x="200" y="316" fontSize="35" fontWeight="700">
              MAPLE PARK
            </text>
          </g>
        </svg>
      ) : null}
    </div>
  );
}
function Kicker({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 5,
        textTransform: "uppercase",
        color: C.teal,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Ring({ x, y, at, size = 80 }: { x: number; y: number; at: number; size?: number }) {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + 8, at + 20], [0, 1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        border: "5px solid #7650d3",
        borderRadius: "50%",
        background: "#a487ee44",
        opacity: v,
        scale: interpolate(f, [at, at + 20], [0.6, 1.5], clamp),
      }}
    />
  );
}
function Screenshot({
  name,
  crop = 0,
  scale = 1,
}: {
  name: string;
  crop?: number;
  scale?: number;
}) {
  return (
    <Img
      src={staticFile(`${A}ui-${name}.png`)}
      style={{
        position: "absolute",
        left: 0,
        top: -crop,
        width: "100%",
        height: "auto",
        scale,
        transformOrigin: "50% 0%",
      }}
    />
  );
}
function Phone({
  children,
  width,
  height,
  left,
  top,
  label,
}: {
  children: React.ReactNode;
  width: number;
  height: number;
  left: number;
  top: number;
  label?: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        borderRadius: 48,
        background: "#fff",
        boxShadow: "0 25px 65px #69442c24",
        border: "9px solid #28484b",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          color: C.ink,
          background: "#f7f5fa",
          borderBottom: "1px solid #e6e0e9",
        }}
      >
        envitefy.com
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 58,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "12px 14px",
            fontSize: 21,
            textAlign: "center",
            color: C.ink,
            background: "#fffdf5ef",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
}
function CalendarView({ saved }: { saved: boolean }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        height: "100%",
        padding: "25px 25px",
        color: C.ink,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 27,
          paddingBottom: 20,
          borderBottom: "2px solid #eee",
        }}
      >
        <span>{saved ? "Mom’s calendar" : "New event"}</span>
        <b
          style={{
            background: saved ? "#edf6ed" : C.purple,
            color: saved ? "#3f794a" : "white",
            padding: "13px 22px",
            borderRadius: 22,
          }}
        >
          {saved ? "✓ Saved" : "Add"}
        </b>
      </div>
      <div
        style={{
          fontSize: 45,
          fontWeight: 700,
          marginTop: 28,
          letterSpacing: -2,
        }}
      >
        {saved ? "October 2026" : "Mia’s 8th Birthday"}
      </div>
      {saved ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {[11, 12, 13, 14, 15, 16, 17].map((n) => (
            <div
              key={n}
              style={{
                width: 55,
                height: 55,
                display: "grid",
                placeItems: "center",
                borderRadius: "50%",
                background: n === 17 ? C.purple : "transparent",
                color: n === 17 ? "white" : C.ink,
                fontSize: 29,
              }}
            >
              {n}
            </div>
          ))}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 28,
          borderLeft: `7px solid ${C.purple}`,
          padding: "19px 20px",
          borderRadius: 16,
          background: "#f2eaf9",
          opacity: interpolate(frame, [117, 123], [0.5, 1], clamp),
        }}
      >
        {saved ? <b style={{ fontSize: 33, lineHeight: 1.2 }}>Mia’s 8th Birthday</b> : null}
        <div style={{ fontSize: 25, lineHeight: 1.4, marginTop: saved ? 15 : 0 }}>
          Saturday, October 17
          <br />
          <b>2:00–4:00 PM</b>
          <br />
          Maple Park
          <br />
          <span style={{ fontSize: 25 }}>
            820 W 7th Street
            <br />
            Austin, TX
          </span>
        </div>
      </div>
      <div style={{ marginTop: 20, fontSize: 23, color: C.teal }}>
        {saved ? "✓ Added to Mom’s calendar" : "Calendar: Mom’s calendar"}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 21,
          color: "#807986",
        }}
      >
        Calendar preview · confirm Add in your calendar
      </div>
    </div>
  );
}
function Extraction({ vertical }: { vertical: boolean }) {
  const f = useCurrentFrame();
  const rows = [
    { label: "Title", value: "Mia’s 8th Birthday" },
    { label: "Date", value: "Saturday, October 17" },
    { label: "Time", value: "2:00–4:00 PM" },
    { label: "Address", value: "820 W 7th Street, Austin" },
  ];
  return (
    <AbsoluteFill style={{ background: C.cream, padding: vertical ? 32 : 24 }}>
      <Img
        src={staticFile(`${A}flyer.webp`)}
        style={{
          position: "absolute",
          left: vertical ? 36 : 25,
          top: vertical ? 90 : 80,
          width: vertical ? 270 : 230,
          borderRadius: 16,
          boxShadow: "0 10px 25px #74513e24",
          rotate: "-4deg",
          opacity: interpolate(f, [66, 100], [1, 0.18], clamp),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          fontSize: vertical ? 32 : 29,
          textAlign: "center",
          fontWeight: 700,
          color: C.ink,
        }}
      >
        Paper becomes a digital event
      </div>
      {rows.map((r, i) => {
        const p = interpolate(f, [43 + i * 3, 50 + i * 3], [0, 1], clamp);
        return (
          <div
            key={r.label}
            style={{
              position: "absolute",
              left: interpolate(p, [0, 1], [vertical ? 100 : 70, 28]),
              top: interpolate(p, [0, 1], [135 + i * 62, 150 + i * (vertical ? 155 : 137)]),
              width: "calc(100% - 56px)",
              padding: vertical ? "19px 22px" : "16px 20px",
              background: "white",
              borderRadius: 20,
              border: `2px solid ${i % 2 ? "#d9e9e3" : "#f1dcd1"}`,
              opacity: p,
              boxShadow: "0 5px 18px #6040260b",
              scale: interpolate(p, [0, 1], [0.68, 1]),
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: C.teal,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontSize: vertical ? 34 : 29,
                fontWeight: 700,
                lineHeight: 1.25,
                marginTop: 8,
                color: C.ink,
              }}
            >
              {r.value}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
function ProductScene({ discovery = false }: { discovery?: boolean }) {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const v = width < 1500;
  const storyFile = discovery ? "discovery-edit.mp4" : "digital-v3-edit.mp4";
  const phoneW = v ? 790 : 630,
    phoneH = v ? 940 : 870,
    phoneL = v ? 145 : 1190,
    phoneT = v ? 695 : 112;
  const step = discovery
    ? "snap"
    : f < 42
      ? "camera"
      : f < 72
        ? "extract"
        : f < 96
          ? "review"
          : f < 117
            ? "choice"
            : f < 135
              ? "confirm"
              : f < 155
                ? "saved"
                : f < 187
                  ? "directions"
                  : f < 219
                    ? "rsvp"
                    : "share";
  const headlines: Record<string, string> = {
    snap: "Snap the invite.",
    camera: "One quick photo.",
    extract: "Paper becomes digital.",
    review: "Check the details.",
    choice: "Save to your calendar.",
    confirm: "Confirm. It’s in.",
    saved: "Ready for the day.",
    directions: "Directions.",
    rsvp: "RSVP.",
    share: "Share with Dad.",
  };
  const subtitle: Record<string, string> = {
    snap: "Open Envitefy Snap",
    camera: "Keep the whole invitation in view",
    extract: "Title · Date · Time · Address",
    review: "Review the saved invitation",
    choice: "Choose Google, Outlook or Apple",
    confirm: "Tap Add in your calendar",
    saved: "Mia’s party is on the calendar",
    directions: "Open the event’s location",
    rsvp: "Reply to the host on the invitation",
    share: "Copy the saved event link",
  };
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Film
        file={storyFile}
        style={
          v
            ? { left: 90, top: 180, width: 900, height: 506, borderRadius: 28 }
            : { left: 66, top: 180, width: 1050, height: 700, borderRadius: 34 }
        }
        position={v ? "50% 30%" : "49% 50%"}
      />
      {!discovery && f < 78 ? (
        <Film
          file="camera-final.mp4"
          style={
            v
              ? {
                  left: 90,
                  top: 180,
                  width: 900,
                  height: 506,
                  borderRadius: 28,
                }
              : {
                  left: 66,
                  top: 180,
                  width: 1050,
                  height: 700,
                  borderRadius: 34,
                }
          }
          position="50% 55%"
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: v ? 95 : 85,
          top: v ? 102 : 66,
          width: v ? 890 : 1060,
          padding: v ? "16px 22px" : 0,
          background: "transparent",
          borderRadius: 20,
        }}
      >
        <div
          style={{
            fontSize: v ? 45 : 53,
            lineHeight: 1.08,
            fontWeight: 750,
            letterSpacing: -1.5,
            color: C.ink,
            whiteSpace: "pre-line",
          }}
        >
          {headlines[step]}
        </div>
        {!v ? (
          <div style={{ fontSize: 27, marginTop: 14, color: "#648080" }}>{subtitle[step]}</div>
        ) : null}
      </div>
      <Phone
        width={phoneW}
        height={phoneH}
        left={phoneL}
        top={phoneT}
        label={step === "rsvp" ? "Uses the RSVP contact on the original invite" : undefined}
      >
        {step === "snap" ? (
          <>
            <Screenshot name="snap" />
            <Ring x={phoneW * 0.3} y={phoneH * 0.35} at={186} />
          </>
        ) : null}
        {step === "camera" ? (
          <div
            style={{
              height: "100%",
              background: "#32494c",
              padding: 40,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Img
              src={staticFile(`${A}flyer.webp`)}
              style={{ width: "93%", height: "auto", borderRadius: 15 }}
            />
            <div
              style={{
                position: "absolute",
                left: 36,
                right: 36,
                top: 25,
                fontSize: 24,
                color: "white",
                textAlign: "center",
              }}
            >
              Photo preview
            </div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 20,
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "5px solid white",
                background: "#ffffff55",
                translate: "-50% 0",
              }}
            />
            <AbsoluteFill
              style={{
                background: "white",
                opacity: interpolate(f, [33, 35, 39], [0, 0.9, 0], clamp),
              }}
            />
          </div>
        ) : null}
        {step === "extract" ? <Extraction vertical={v} /> : null}
        {step === "review" ? <Screenshot name="details" /> : null}
        {step === "choice" ? (
          <>
            <Screenshot name="calendar" crop={v ? 80 : 50} />
            <Ring x={phoneW * 0.5} y={phoneH * 0.7} at={116} />
          </>
        ) : null}
        {step === "confirm" || step === "saved" ? <CalendarView saved={step === "saved"} /> : null}
        {step === "directions" ? (
          <>
            <Screenshot name="directions" crop={v ? 180 : 0} />
            <Ring x={phoneW * 0.5} y={phoneW * 1.2 - (v ? 180 : 0)} at={163} />
          </>
        ) : null}
        {step === "rsvp" ? (
          <>
            <Screenshot name="rsvp" crop={v ? 355 : 240} />
            <Ring x={phoneW * 0.76} y={v ? 650 : 560} at={194} />
          </>
        ) : null}
        {step === "share" ? (
          <>
            <Screenshot name={f < 240 ? "share-before" : "share"} crop={v ? 350 : 145} />
            <Ring x={phoneW * 0.5} y={phoneH * 0.81} at={231} />
            <div
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                bottom: 90,
                padding: 22,
                borderRadius: 22,
                background: "#edf5ef",
                color: C.ink,
                fontSize: v ? 28 : 24,
                fontWeight: 700,
                opacity: interpolate(f, [253, 266], [0, 1], clamp),
              }}
            >
              For Dad → the same event link
            </div>
          </>
        ) : null}
      </Phone>
    </AbsoluteFill>
  );
}
function StoryScene({
  payoff = false,
  discovery = false,
}: {
  payoff?: boolean;
  discovery?: boolean;
}) {
  const { width } = useVideoConfig();
  const v = width < 1500;
  const file = payoff
    ? "payoff-v3-edit.mp4"
    : discovery
      ? "discovery-edit.mp4"
      : "opening-v3-final.mp4";
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Film
        file={file}
        style={
          v
            ? { left: 0, top: 405, width: 1080, height: 940 }
            : { left: 0, top: 0, width: 1920, height: 1080 }
        }
        position={payoff ? "46% 50%" : "45% 50%"}
      />
      {!v ? (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(0deg,rgba(23,37,35,.72),transparent 28%,transparent 83%,rgba(23,37,35,.22))",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: v ? 92 : 92,
          top: v ? 139 : 710,
          color: v ? C.ink : "white",
          width: v ? 890 : 1000,
        }}
      >
        <Kicker style={{ color: v ? C.teal : "#fff7e9", fontSize: v ? 27 : 25 }}>
          {payoff
            ? "A LITTLE LESS CLUTTER"
            : discovery
              ? "HER BRIGHT IDEA"
              : "AFTER SCHOOL. BEFORE THE CHAOS."}
        </Kicker>
        <div
          style={{
            fontSize: v ? 88 : 66,
            lineHeight: 0.98,
            fontWeight: 750,
            letterSpacing: -3,
            marginTop: 20,
            textShadow: v ? undefined : "0 4px 30px #17383755",
          }}
        >
          {payoff ? (
            <>
              Room for what
              <br />
              matters.
            </>
          ) : discovery ? (
            <>
              Mom has
              <br />
              backup.
            </>
          ) : (
            <>
              Mom,
              <br />
              just snap it!
            </>
          )}
        </div>
      </div>
      {v ? (
        <div
          style={{
            position: "absolute",
            left: 92,
            right: 92,
            top: 1440,
            height: 4,
            background: "linear-gradient(90deg,#e88979,#efd99b,#6fa8a0)",
            borderRadius: 9,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
function FinishScene() {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const v = width < 1500;
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Film
        file="payoff-v3-edit.mp4"
        trim={150}
        style={
          v
            ? { left: 0, top: 65, width: 1080, height: 850 }
            : { left: 0, top: 0, width: 1090, height: 1080 }
        }
        position="46% 44%"
      />
      <div
        style={{
          position: "absolute",
          left: v ? 90 : 1160,
          top: v ? 978 : 180,
          width: v ? 900 : 665,
          opacity: interpolate(f, [0, 14], [0, 1], clamp),
          translate: `0 ${interpolate(f, [0, 18], [20, 0], clamp)}px`,
        }}
      >
        <Img src={staticFile("brand/envitefy-com.png")} style={{ width: "100%", height: "auto" }} />
        <div
          style={{
            fontSize: v ? 67 : 62,
            color: C.ink,
            fontWeight: 700,
            lineHeight: 1.14,
            letterSpacing: -1.8,
            textAlign: v ? "center" : "left",
            marginTop: v ? 55 : 60,
          }}
        >
          Snapped. Saved.
          <br />
          Ready to celebrate.
        </div>
        <div
          style={{
            marginTop: v ? 58 : 60,
            padding: v ? "27px 34px" : "28px 32px",
            borderRadius: 28,
            border: "2px solid #e8d8c7",
            background: "#ffffffcf",
            display: "flex",
            alignItems: "center",
            gap: 23,
          }}
        >
          <Img
            src={staticFile(`${A}flyer.webp`)}
            style={{ width: v ? 126 : 99, height: "auto", borderRadius: 12 }}
          />
          <div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 700,
                letterSpacing: 2,
                color: C.teal,
              }}
            >
              SAVED INVITATION
            </div>
            <div
              style={{
                fontSize: v ? 36 : 33,
                fontWeight: 700,
                lineHeight: 1.2,
                color: C.ink,
                marginTop: 10,
              }}
            >
              Mia’s 8th Birthday
            </div>
            <div style={{ fontSize: v ? 28 : 26, color: "#627b79", marginTop: 10 }}>
              October 17 · 2–4 PM
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
export function SnapAnimeScene({ id }: { id: SceneId }) {
  const f = useCurrentFrame();
  if (id === "overload") return <StoryScene />;
  if (id === "discovery") return f < 102 ? <StoryScene discovery /> : <ProductScene discovery />;
  if (id === "digital") return <ProductScene />;
  if (id === "payoff") return <StoryScene payoff />;
  return <FinishScene />;
}
function Captions() {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const v = width < 1500;
  const caption = (captions as Caption[]).find(
    (c) => (f * 1000) / 30 >= c.startMs && (f * 1000) / 30 < c.endMs,
  );
  if (!caption) return null;
  const product = f >= 312 && f < 780;
  return (
    <div
      style={{
        position: "absolute",
        left: v ? 82 : product ? 82 : 240,
        right: v ? 82 : product ? 800 : 240,
        bottom: v ? (product ? 170 : 260) : 52,
        textAlign: "center",
        fontSize: v ? 49 : 43,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: "pre-line",
        color: C.ink,
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "18px 25px",
          borderRadius: 23,
          background: "#fffdf5f5",
          boxShadow: "0 6px 30px #273f3722",
        }}
      >
        {caption.text}
      </span>
    </div>
  );
}
export const SnapAnime: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: "Arial, sans-serif", background: C.cream }}>
    {SNAP_TIMELINE.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
        <SnapAnimeScene id={s.id} />
      </Sequence>
    ))}
    <Captions />
    <Audio src={staticFile(`${A}final-mix-v2.wav`)} />
  </AbsoluteFill>
);
