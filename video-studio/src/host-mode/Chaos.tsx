import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const messages = [
  { at: 12, text: "what time again?", x: 90, y: 1070, angle: -4, name: "MIA", color: "#d9ebff" },
  { at: 35, text: "send the address?", x: 170, y: 1240, angle: 4, name: "JOSH", color: "#eee4ff" },
  { at: 56, text: "wait... which day?", x: 85, y: 1390, angle: -3, name: "SAM", color: "#ffeac7" },
  { at: 74, text: "are we still on?", x: 210, y: 960, angle: 5, name: "ALEX", color: "#ddf4dd" },
  {
    at: 86,
    text: "resend the invite?",
    x: 130,
    y: 1155,
    angle: -5,
    name: "MIA, AGAIN",
    color: "#fff",
  },
  { at: 96, text: "???", x: 320, y: 1360, angle: 8, name: "THE GROUP CHAT", color: "#ffe2eb" },
];

export function Chaos() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const square = width === height;
  const squarePositions = [
    { x: 80, y: 665 },
    { x: 490, y: 725 },
    { x: 135, y: 840 },
    { x: 545, y: 610 },
    { x: 275, y: 760 },
    { x: 590, y: 875 },
  ];
  return (
    <AbsoluteFill name="You offered to host" style={{ background: "#181612", overflow: "hidden" }}>
      <Video
        src={staticFile("projects/host-mode/chaos.mp4")}
        muted
        trimBefore={2}
        playbackRate={1.5}
        objectFit="cover"
        style={{ position: "absolute", top: 0, width: "100%", height: square ? 1920 : "100%" }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, #0009 0%, transparent 40%, #0004 100%)" }}
      />
      <Interactive.Div
        name="TikTok hook"
        style={{
          position: "absolute",
          top: square ? 75 : 190,
          left: square ? 80 : 85,
          right: square ? 80 : 125,
          color: "white",
          fontSize: square ? 80 : 91,
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: -3,
          textShadow: "0 5px 25px #0009",
        }}
      >
        POV: you said
        <br />
        <span
          style={{ background: "#fff", color: "#191923", padding: "0 16px 5px", borderRadius: 12 }}
        >
          “I’ll host.”
        </span>
      </Interactive.Div>
      {messages.map((message, index) => (
        <Interactive.Div
          key={message.at}
          name={message.name}
          from={message.at}
          style={{
            position: "absolute",
            top: square ? squarePositions[index].y : message.y,
            left: square ? squarePositions[index].x : message.x,
            padding: square ? "16px 24px 19px" : "22px 32px 26px",
            borderRadius: 30,
            background: message.color,
            boxShadow: "0 14px 40px #0005",
            rotate: `${message.angle}deg`,
            scale: interpolate(frame, [message.at, message.at + 8], [0.75, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1.4, 0.3, 1),
            }),
            opacity: interpolate(frame, [message.at, message.at + 3], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              fontSize: square ? 20 : 24,
              letterSpacing: 2,
              fontWeight: 700,
              color: "#676273",
              marginBottom: 7,
            }}
          >
            {message.name}
          </div>
          <div
            style={{
              fontSize: square ? 39 : 49,
              letterSpacing: -1.4,
              fontWeight: 600,
              color: "#252131",
            }}
          >
            {message.text}
          </div>
        </Interactive.Div>
      ))}
    </AbsoluteFill>
  );
}
