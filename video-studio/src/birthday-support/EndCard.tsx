import { AbsoluteFill, CanvasImage, staticFile } from "remotion";
export function SupportEndCard() {
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 80% 80%,#ddd7ff,transparent 70%),#fffaf3",
        color: "#2b2035",
        alignItems: "center",
      }}
    >
      <CanvasImage
        src={staticFile("brand/apple-touch-icon-120.png")}
        style={{
          position: "absolute",
          top: 356,
          left: 422,
          width: 180,
          height: 180,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 651,
          left: 75,
          right: 145,
          textAlign: "center",
          fontSize: 89,
          fontWeight: 900,
          letterSpacing: -3.4,
          lineHeight: 1.08,
        }}
      >
        We handle
        <br />
        the invite.
        <br />
        <span
          style={{ color: "#7044c9", display: "inline-block", marginTop: 31 }}
        >
          You handle
          <br />
          the cake.
        </span>
      </div>
      <CanvasImage
        src={staticFile("brand/envitefy-com.png")}
        style={{
          position: "absolute",
          top: 1270,
          left: 215,
          width: 596,
          height: "auto",
        }}
      />
    </AbsoluteFill>
  );
}
