import { CanvasImage, staticFile } from "remotion";

export function HostBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 20 : 28,
      }}
    >
      <CanvasImage
        src={staticFile("brand/apple-touch-icon-120.png")}
        style={{ width: compact ? 66 : 98, height: compact ? 66 : 98 }}
      />
      <CanvasImage
        src={staticFile("brand/envitefy-wordmark-email.png")}
        style={{ width: compact ? 290 : 426, height: "auto" }}
      />
    </div>
  );
}
