import { AbsoluteFill, CanvasImage, useCurrentFrame } from "remotion";
import timing from "./camera-timing-v4.json";
import { asset } from "./Shared";
export function FridgeCameraScreenV4() {
  const frame = useCurrentFrame();
  const captureFrame = timing.pressFrame + timing.captureDelayFrames;
  const thumbnailFrame = timing.pressFrame + timing.thumbnailDelayFrames;
  return (
    <AbsoluteFill
      style={{
        background: "#161719",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 27,
          left: 25,
          right: 25,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 17,
        }}
      >
        <span>⚡</span>
        <span>⌃</span>
        <span>◎</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 78,
          height: 480,
          background: "#cba97c",
          overflow: "hidden",
        }}
      >
        <CanvasImage
          src={asset("flyer.webp")}
          style={{
            position: "absolute",
            left: 24,
            top: 35,
            width: 312,
            height: 416,
            boxShadow: "0 4px 13px #503c3050",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 15,
            top: 22,
            width: 330,
            height: 443,
            border: frame >= 28 ? "2px solid #f3ca4d" : "1px solid #ffffff55",
            borderRadius: 7,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: 574,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 12,
          letterSpacing: 2,
          color: "#f5d64e",
        }}
      >
        PHOTO
      </div>
      <div
        style={{
          position: "absolute",
          top: 610,
          left: 145,
          width: 70,
          height: 70,
          border: "3px solid white",
          borderRadius: "50%",
          padding: 5,
        }}
      >
        <div
          style={{
            background: "white",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            scale:
              frame >= timing.pressFrame && frame < captureFrame + 3 ? 0.88 : 1,
          }}
        />
      </div>
      <CanvasImage
        src={asset("flyer.webp")}
        style={{
          position: "absolute",
          left: 28,
          top: 625,
          width: 31,
          height: 41,
          borderRadius: 3,
          opacity: frame >= thumbnailFrame ? 1 : 0,
        }}
      />
      <div style={{ position: "absolute", right: 28, top: 628, fontSize: 29 }}>
        ↻
      </div>
      {frame >= captureFrame && frame < captureFrame + 3 ? (
        <AbsoluteFill
          style={{
            background: "white",
            opacity: frame === captureFrame ? 0.85 : 0.15,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
}
