import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HostBrand } from "./HostBrand";

const panels = [
  {
    start: 0,
    end: 60,
    image: "demo-invite.png",
    line1: "Put it in",
    line2: "one link.",
    action: "All the details, in one place.",
  },
  {
    start: 60,
    end: 120,
    image: "demo-rsvp.png",
    line1: "Who’s coming?",
    line2: "RSVP.",
    action: "RSVP on the spot.",
  },
  {
    start: 120,
    end: 180,
    image: "demo-location.png",
    line1: "Where is it?",
    line2: "Right here.",
    action: "Directions, one tap away.",
  },
  {
    start: 180,
    end: 225,
    image: "demo-calendar.png",
    line1: "What time?",
    line2: "Save the date.",
    action: "Add it to your calendar.",
  },
];

export function Product() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const square = width === height;
  return (
    <AbsoluteFill
      name="Real Envitefy product demo"
      style={{ background: "#f5f1ff", color: "#21172e" }}
    >
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          top: 650,
          left: -110,
          background: "radial-gradient(circle, #b8a0fa77 0%, #f5f1ff00 68%)",
        }}
      />
      <div
        style={{ position: "absolute", top: square ? 65 : 160, left: 80, right: square ? 80 : 125 }}
      >
        <HostBrand compact />
      </div>
      {panels.map((panel) => (
        <AbsoluteFill
          key={panel.start}
          from={panel.start}
          durationInFrames={panel.end - panel.start}
        >
          <Interactive.Div
            name={panel.line2}
            style={{
              position: "absolute",
              top: square ? 340 : 290,
              left: square ? 575 : 85,
              right: square ? 80 : 120,
              textAlign: square ? "left" : "center",
              lineHeight: 1.02,
              letterSpacing: square ? -3 : -4,
              fontSize: square ? 80 : 87,
              fontWeight: 800,
              translate: interpolate(
                frame,
                [panel.start, panel.start + 9],
                ["0px 24px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
            }}
          >
            {panel.line1}
            <br />
            <span style={{ color: "#703aff" }}>{panel.line2}</span>
          </Interactive.Div>
          <Interactive.Div
            name="Live card screenshot"
            style={{
              position: "absolute",
              left: square ? 80 : 185,
              top: square ? 205 : 500,
              width: square ? 440 : 660,
              height: square ? 660 : 990,
              borderRadius: square ? 40 : 58,
              overflow: "hidden",
              boxShadow: "0 30px 90px #29144a45",
              scale: interpolate(
                frame,
                [panel.start, panel.start + 12, panel.end],
                [0.98, 1, 1.015],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  output: "perceptual-scale",
                },
              ),
            }}
          >
            <CanvasImage
              src={staticFile(`projects/host-mode/${panel.image}`)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Interactive.Div>
          <Interactive.Div
            name="Card action explanation"
            style={{
              position: "absolute",
              top: square ? 910 : 1530,
              left: square ? 80 : 85,
              right: square ? 80 : 125,
              textAlign: "center",
              color: "#21172e",
              fontSize: square ? 44 : 48,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            {panel.action}
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              top: square ? 980 : 1620,
              left: 85,
              right: square ? 85 : 125,
              textAlign: "center",
              color: "#766986",
              fontSize: 23,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            Envitefy Live Card Demo
          </div>
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
}
