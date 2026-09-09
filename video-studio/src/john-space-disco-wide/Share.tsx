import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Film, ProductCrop, Sweep, Url } from "./Shared";
export function WideShare() {
  const f = useCurrentFrame();
  const idx = f < 63 ? 0 : f < 126 ? 1 : f < 168 ? 2 : 3;
  const labels = [
    "RSVP on the spot.",
    "Explore the Gift List.",
    "Directions, one tap away.",
    "Add it to your calendar.",
  ];
  const sections = [
    { name: "rsvp", from: 0, duration: 63, y: 283, h: 500 },
    { name: "gift", from: 63, duration: 63, y: 294, h: 485 },
    { name: "directions", from: 126, duration: 42, y: 320, h: 450 },
    { name: "calendar", from: 168, duration: 42, y: 302, h: 490 },
  ];
  return (
    <AbsoluteFill>
      <Film name="wide-edit-guests.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg,transparent 43%,#faf7ffbb 56%,#f3f0ffed)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1010,
          top: 77,
          fontSize: 63,
          lineHeight: 1.07,
          fontWeight: 800,
          color: "#2a1748",
          letterSpacing: -1.4,
        }}
      >
        One link.
        <br />
        All the party details.
      </div>
      <Url top={253} />
      <div
        style={{
          position: "absolute",
          left: 1046,
          top: 373,
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#6947aa",
        }}
      >
        0{idx + 1} / 04 ·{" "}
        {["RSVP", "GIFT LIST", "DIRECTIONS", "ADD TO CALENDAR"][idx]}
      </div>
      {sections.map((s) => (
        <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
          <ProductCrop
            name={`wide-ui-${s.name}.mp4`}
            left={1042}
            top={431}
            width={770}
            height={s.h}
            cropX={28}
            cropY={s.y}
            sourceWidth={374}
          />
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          left: 1037,
          right: 80,
          top: 955,
          fontSize: 34,
          fontWeight: 750,
          color: "#392557",
          textAlign: "center",
        }}
      >
        {labels[idx]}
      </div>
      <div
        style={{
          position: "absolute",
          left: 95,
          bottom: 90,
          fontSize: 26,
          fontWeight: 650,
          color: "#37224f",
          padding: "12px 19px",
          background: "#ffffffbb",
          borderRadius: 18,
        }}
      >
        Envitefy Live Card Demo
      </div>
      <Sweep />
    </AbsoluteFill>
  );
}
