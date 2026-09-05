import { CanvasImage, staticFile } from "remotion";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 148,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        fontSize: 28,
      }}
    >
      <CanvasImage
        src={staticFile("brand/envitefy-wordmark-email.png")}
        style={{
          width: 390,
          height: "auto",
          background: light ? "#ffffffed" : undefined,
          borderRadius: light ? 18 : undefined,
          padding: light ? 16 : undefined,
        }}
      />
    </div>
  );
}
