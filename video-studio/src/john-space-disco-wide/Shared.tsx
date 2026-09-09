import type { CSSProperties, ReactNode } from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
export const asset = (name: string) =>
  staticFile(`projects/john-space-disco/${name}`);
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const ink = "#24143e";
export function Film({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <Video
      src={asset(name)}
      objectFit="cover"
      muted
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
export function Caption({
  children,
  bottom = 78,
}: {
  children: ReactNode;
  bottom?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 310,
        right: 310,
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          minWidth: 960,
          background: "#211333",
          padding: "19px 28px",
          borderRadius: 22,
          color: "white",
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.12,
        }}
      >
        {children}
      </span>
    </div>
  );
}
export function Url({
  top = 230,
  left = 1010,
  width = 820,
}: {
  top?: number;
  left?: number;
  width?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        padding: "20px 12px",
        borderRadius: 24,
        border: "2px solid #d8c6ff",
        background: "#fffffff5",
        boxShadow: "0 15px 50px #26074422",
        fontSize: 41,
        fontWeight: 700,
        letterSpacing: -1,
        textAlign: "center",
        color: ink,
      }}
    >
      envitefy.com/card/<span style={{ color: "#6b3cff" }}>john-is-10</span>
    </div>
  );
}
export function ProductCrop({
  name,
  left,
  top,
  width,
  height,
  cropX = 0,
  cropY = 0,
  sourceWidth = 430,
}: {
  name: string;
  left: number;
  top: number;
  width: number;
  height: number;
  cropX?: number;
  cropY?: number;
  sourceWidth?: number;
}) {
  const scale = width / sourceWidth;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        overflow: "hidden",
        borderRadius: 28,
        border: "3px solid #ffffff",
        boxShadow: "0 25px 70px #1b0c3838",
        background: "#f9f7ff",
      }}
    >
      <Video
        src={asset(name)}
        objectFit="cover"
        muted
        style={{
          position: "absolute",
          width: 430 * scale,
          height: 800 * scale,
          maxWidth: "none",
          left: -cropX * scale,
          top: -cropY * scale,
        }}
      />
    </div>
  );
}
export function Brand({ width = 750 }: { width?: number }) {
  return (
    <CanvasImage
      src={staticFile("brand/envitefy-com.png")}
      style={{ width, height: "auto" }}
    />
  );
}
export function Sweep() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "linear-gradient(105deg,transparent,#d9c8ffbb,transparent)",
        translate: `${interpolate(f, [0, 12], [-2100, 2100], clamp)}px 0px`,
        opacity: interpolate(f, [0, 12, 13], [1, 1, 0], clamp),
      }}
    />
  );
}
