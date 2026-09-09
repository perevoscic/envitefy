import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Film, Heading, Paper, ProductCrop, Sweep, Url } from "./Shared";
export function SquareShare() {
  const f = useCurrentFrame(),
    i = f < 63 ? 0 : f < 126 ? 1 : f < 168 ? 2 : 3;
  const sections = [
    { name: "rsvp", from: 0, duration: 63, y: 283, h: 396 },
    { name: "gift", from: 63, duration: 63, y: 294, h: 385 },
    { name: "directions", from: 126, duration: 42, y: 320, h: 357 },
    { name: "calendar", from: 168, duration: 42, y: 302, h: 389 },
  ];
  return (
    <AbsoluteFill>
      <Paper />
      <Heading dark>
        One link.
        <br />
        All the party details.
      </Heading>
      <Url />
      <div
        style={{
          position: "absolute",
          left: 55,
          top: 367,
          width: 295,
          height: 545,
          overflow: "hidden",
          borderRadius: 30,
          boxShadow: "0 20px 50px #36214925",
        }}
      >
        <Film
          name="wide-edit-guests.mp4"
          style={{ position: "absolute", width: 969, height: 545, left: f < 69 ? -105 : f < 138 ? -125 : -60 }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 400,
          top: 370,
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: 1.4,
          color: "#6d4ba2",
        }}
      >
        0{i + 1} / 04 ·{" "}
        {["RSVP", "GIFT LIST", "DIRECTIONS", "ADD TO CALENDAR"][i]}
      </div>
      {sections.map((s) => (
        <Sequence key={s.name} from={s.from} durationInFrames={s.duration}>
          <ProductCrop
            name={"wide-ui-" + s.name + ".mp4"}
            left={400}
            top={426}
            width={600}
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
          left: 400,
          width: 600,
          top: 866,
          textAlign: "center",
          fontSize: 36,
          lineHeight: 1.15,
          fontWeight: 700,
          color: "#3b2554",
        }}
      >
        {
          [
            "RSVP on the spot.",
            "Explore the Gift List.",
            "Directions, one tap away.",
            "Add it to your calendar.",
          ][i]
        }
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 985,
          textAlign: "center",
          fontSize: 27,
          fontWeight: 600,
          color: "#7a688d",
        }}
      >
        Envitefy Live Card Demo
      </div>
      <Sweep />
    </AbsoluteFill>
  );
}
