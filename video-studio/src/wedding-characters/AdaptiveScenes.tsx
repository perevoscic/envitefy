import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const background =
  "radial-gradient(ellipse at 10% 10%,#e2e6d7,transparent 70%),#f8f4ec";

function Brand({
  left,
  top,
  width,
  captionSize = 32,
}: {
  left: number;
  top: number;
  width: number;
  captionSize?: number;
}) {
  return (
    <div
      style={{ position: "absolute", left, top, width, textAlign: "center" }}
    >
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{ width, height: "auto" }}
      />
      <div
        style={{
          fontSize: captionSize,
          fontWeight: 700,
          letterSpacing: -0.6,
          marginTop: 24,
        }}
      >
        weddings
      </div>
    </div>
  );
}

export function AdaptivePortrait({
  clip,
  title,
  eyebrow = "WEDDING GUEST FILES",
  dialogue = false,
}: {
  clip: string;
  title: string;
  eyebrow?: string;
  dialogue?: boolean;
}) {
  const { width } = useVideoConfig();
  const wide = width > 1080;
  const frame = useCurrentFrame();
  const panel = wide ? 1020 : 420;
  const margin = wide ? 130 : 52;
  const fullBody =
    ["dancer-dance", "dancer-payoff", "planner-payoff"].includes(clip) ||
    (wide && (clip === "crier-open-v3" || clip === "crier-tissue-v3"));
  return (
    <AbsoluteFill style={{ background, color: "#293426" }}>
      <div
        style={{
          position: "absolute",
          left: panel,
          top: 0,
          right: 0,
          bottom: 0,
          background: "#e7e5da",
          overflow: "hidden",
          borderLeft: "1px solid #a1ab9244",
        }}
      >
        <Video
          src={staticFile("projects/wedding-characters/" + clip + ".mp4")}
          muted
          objectFit={fullBody ? "contain" : "cover"}
          style={{
            width: "100%",
            height: "100%",
            objectPosition:
              clip === "dancer-open-v2-composite" ? "50% 30%" : "50% 50%",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: margin,
          top: wide ? 254 : 225,
          width: panel - margin * 2,
        }}
      >
        <div
          style={{
            fontSize: wide ? 25 : 18,
            fontWeight: 700,
            letterSpacing: eyebrow.startsWith("Every") ? 0.2 : 3,
            lineHeight: 1.5,
            marginBottom: wide ? 28 : 22,
            color: "#697658",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: wide ? 128 : title.startsWith("The") ? 78 : 65,
            letterSpacing: wide ? -3 : -2,
            lineHeight: 1.08,
          }}
        >
          {title.split(" ").map((word, i) => (
            <div key={word + "-" + i}>{word}</div>
          ))}
        </div>
        <div
          style={{
            width: wide ? 130 : 84,
            height: 2,
            background: "#849171",
            marginTop: 35,
          }}
        />
        {dialogue && frame >= 38 && frame < 101 ? (
          <div
            style={{
              fontSize: wide ? 46 : 35,
              fontWeight: 700,
              lineHeight: 1.3,
              marginTop: 42,
            }}
          >
            Been ready since February.
          </div>
        ) : null}
      </div>
      <Brand
        left={margin}
        top={820}
        width={wide ? 350 : 260}
        captionSize={wide ? 34 : 28}
      />
    </AbsoluteFill>
  );
}

export function AdaptiveDemo({
  kind,
}: {
  kind: "rsvp" | "calendar" | "quick-rsvp";
}) {
  const { width } = useVideoConfig();
  const wide = width > 1080;
  const frame = useCurrentFrame();
  const calendar = kind === "calendar",
    quick = kind === "quick-rsvp";
  const phoneWidth = wide ? 630 : 584;
  const phoneHeight = (phoneWidth * 1230) / 806;
  return (
    <AbsoluteFill style={{ background, color: "#293426" }}>
      <div
        style={{
          position: "absolute",
          left: wide ? 130 : 52,
          top: wide ? 282 : 250,
          width: wide ? 800 : 330,
        }}
      >
        <div
          style={{
            fontSize: wide ? 24 : 18,
            letterSpacing: 3,
            fontWeight: 700,
            color: "#697658",
            marginBottom: 30,
          }}
        >
          YOU’RE INVITED
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: wide ? 112 : 72,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {calendar ? (
            <>
              Add to
              <br />
              Calendar
            </>
          ) : (
            "RSVP"
          )}
        </div>
        <div
          style={{
            fontSize: wide ? 44 : 34,
            fontWeight: 700,
            lineHeight: 1.25,
            marginTop: 46,
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
            fontSize: wide ? 27 : 20,
            color: "#747c69",
            marginTop: 23,
            lineHeight: 1.35,
          }}
        >
          Envitefy Live Card Demo
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: wide ? 1130 : 440,
          top: (1080 - phoneHeight) / 2,
          width: phoneWidth,
          height: phoneHeight,
          border: "7px solid #30342d",
          borderRadius: 32,
          overflow: "hidden",
          background: "#fff",
          boxShadow: "0 18px 50px #29342622",
        }}
      >
        <Video
          src={staticFile(
            "projects/wedding-characters/demo-" +
              (calendar ? "calendar" : quick ? "quick-rsvp" : "rsvp") +
              ".mp4",
          )}
          muted
          objectFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <Brand
        left={wide ? 130 : 52}
        top={820}
        width={wide ? 350 : 260}
        captionSize={wide ? 34 : 28}
      />
    </AbsoluteFill>
  );
}

export function AdaptiveEndCard() {
  const { width } = useVideoConfig();
  const wide = width > 1080;
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, color: "#293426" }}>
      <div
        style={{
          position: "absolute",
          inset: wide ? 60 : 50,
          border: "1px solid #a1ab9259",
          borderRadius: wide ? 160 : 260,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: interpolate(frame, [0, 5], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <CanvasImage
          src={staticFile("brand/apple-touch-icon-120.png")}
          style={{
            position: "absolute",
            left: wide ? 1400 : 500,
            top: wide ? 272 : 105,
            width: wide ? 100 : 80,
            height: wide ? 100 : 80,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: wide ? 145 : 80,
            right: wide ? 910 : 80,
            top: wide ? 308 : 235,
            textAlign: wide ? "left" : "center",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: wide ? 65 : 53,
            letterSpacing: -1,
            color: "#62724e",
          }}
        >
          Bring yours together.
        </div>
        <div
          style={{
            position: "absolute",
            left: wide ? 145 : 80,
            right: wide ? 910 : 80,
            top: wide ? 450 : 360,
            textAlign: wide ? "left" : "center",
            fontFamily: "Georgia, serif",
            fontSize: wide ? 104 : 80,
            letterSpacing: -2.5,
            lineHeight: 1.1,
          }}
        >
          Create your own
          <br />
          wedding website.
        </div>
        <div
          style={{
            position: "absolute",
            left: wide ? 1045 : 440,
            top: wide ? 290 : 615,
            width: wide ? 1 : 200,
            height: wide ? 495 : 1,
            background: "#a1ab9277",
          }}
        />
        <Brand
          left={wide ? 1170 : 315}
          top={wide ? 465 : 694}
          width={wide ? 560 : 450}
          captionSize={wide ? 66 : 54}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
