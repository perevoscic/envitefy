import { AdaptiveEndCard } from "./AdaptiveScenes";
import { useVideoConfig } from "remotion";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export function CharactersEndCard() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (width >= height) return <AdaptiveEndCard />;
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 85% 5%,#d9e0cf,transparent 67%),#f8f4ec",
        color: "#293426",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 100,
          bottom: 110,
          border: "1px solid #a1ab9259",
          borderRadius: 400,
        }}
      />
      <div
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
            left: 490,
            top: 336,
            width: 100,
            height: 100,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 534,
            left: 100,
            right: 100,
            textAlign: "center",
            fontFamily: "Georgia, serif",
            fontSize: 61,
            fontStyle: "italic",
            color: "#62724e",
            letterSpacing: -1,
          }}
        >
          Bring yours together.
        </div>
        <div
          style={{
            position: "absolute",
            top: 707,
            left: 100,
            right: 100,
            textAlign: "center",
            fontFamily: "Georgia, serif",
            fontSize: 96,
            lineHeight: 1.1,
            letterSpacing: -3,
          }}
        >
          Create your own
          <br />
          wedding website.
        </div>
        <div
          style={{
            position: "absolute",
            left: 440,
            top: 1025,
            width: 200,
            height: 1,
            background: "#a1ab92",
          }}
        />
        <CanvasImage
          src={staticFile("brand/envitefy-com.png")}
          style={{
            position: "absolute",
            left: 295,
            top: 1141,
            width: 490,
            height: "auto",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 1317,
            left: 90,
            right: 90,
            textAlign: "center",
            fontSize: 61,
            fontWeight: 700,
            letterSpacing: -1.5,
          }}
        >
          weddings
        </div>
      </div>
    </AbsoluteFill>
  );
}
