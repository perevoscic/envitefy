import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HostBrand } from "./HostBrand";

export function Party() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const square = width === height;
  const squareTop = frame < 89 ? -130 : frame < 149 ? -450 : frame < 239 ? -260 : -300;
  return (
    <AbsoluteFill
      name="Get back to your people"
      style={{ background: "#221c18", overflow: "hidden" }}
    >
      <Video
        src={staticFile("projects/host-mode/party.mp4")}
        volume={0.15}
        objectFit="cover"
        style={{
          position: "absolute",
          top: square ? squareTop : 0,
          width: "100%",
          height: square ? 1920 : "100%",
        }}
      />
      <Sequence from={89} durationInFrames={60} name="Single hand placing the bowl">
        <Video
          src={staticFile("projects/host-mode/bowl-single-hand.mp4")}
          muted
          objectFit="cover"
          style={{
            position: "absolute",
            top: square ? -450 : 0,
            width: "100%",
            height: square ? 1920 : "100%",
          }}
        />
      </Sequence>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, #0007 0%, transparent 40%, #0002 65%, #0009 100%)",
        }}
      />
      <Interactive.Div
        name="Host mode"
        durationInFrames={90}
        style={{
          position: "absolute",
          top: square ? 75 : 205,
          left: square ? 80 : 85,
          right: square ? 80 : 125,
          fontSize: square ? 80 : 94,
          lineHeight: 1.08,
          fontWeight: 800,
          letterSpacing: -3,
          color: "#fff",
          textShadow: "0 3px 20px #0008",
        }}
      >
        Host mode:
        <br />
        <span style={{ color: "#dcf679" }}>ON.</span>
      </Interactive.Div>
      <Interactive.Div
        name="The payoff"
        from={100}
        durationInFrames={105}
        style={{
          position: "absolute",
          top: square ? 75 : 220,
          left: square ? 80 : 85,
          right: square ? 80 : 125,
          fontSize: square ? 70 : 83,
          lineHeight: 1.06,
          fontWeight: 800,
          letterSpacing: -3,
          color: "#fff",
          textShadow: "0 3px 20px #0008",
        }}
      >
        Less replying.
        <br />
        <span style={{ color: "#dcf679" }}>More being there.</span>
      </Interactive.Div>
      <Interactive.Div
        name="Closing brand and CTA"
        from={205}
        style={{
          position: "absolute",
          top: square ? 700 : 1080,
          left: square ? 80 : 85,
          right: square ? 80 : 125,
          borderRadius: 44,
          padding: square ? "20px 30px" : "32px 35px",
          background: "#fffffff2",
          textAlign: "center",
          boxShadow: "0 20px 70px #0005",
          translate: interpolate(frame, [205, 217], ["0px 45px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          opacity: interpolate(frame, [205, 214], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <HostBrand compact />
        <div
          style={{
            fontSize: square ? 44 : 50,
            fontWeight: 750,
            lineHeight: 1.08,
            color: "#251b39",
            marginTop: square ? 12 : 26,
          }}
        >
          Send the link.
          {square ? " " : <br />}
          Enjoy the night.
        </div>
        <div
          style={{
            display: "inline-flex",
            marginTop: square ? 12 : 20,
            padding: square ? "12px 24px" : "17px 30px 19px",
            color: "white",
            background: "#6b3cff",
            borderRadius: 50,
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          Create yours · envitefy.com
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
}
