import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
export function WeddingEndCard() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 100% 0%,#ead8d0,transparent 65%),#fff9ee",
        color: "#452c34",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 502,
          left: 85,
          right: 130,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontSize: 100,
          lineHeight: 1.08,
          letterSpacing: -4,
          opacity: interpolate(frame, [0, 4], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        Less coordinating.
        <br />
        <span
          style={{
            display: "inline-block",
            marginTop: 36,
            fontStyle: "italic",
            color: "#7c354a",
          }}
        >
          More celebrating.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 417,
          top: 950,
          width: 200,
          height: 2,
          background: "#cbb6a5",
        }}
      />
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          top: 1083,
          left: 207,
          width: 620,
          height: "auto",
        }}
      />
    </AbsoluteFill>
  );
}
