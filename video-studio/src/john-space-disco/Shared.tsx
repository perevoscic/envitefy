import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";
export const asset = (n: string) =>
  staticFile(`projects/john-space-disco/${n}`);
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const palette = {
  blue: "#397eff",
  violet: "#773cff",
  ink: "#24133f",
  paper: "#f5f1ff",
};
export function Footage({
  name,
  style,
}: {
  name: string;
  style?: CSSProperties;
}) {
  return (
    <Video
      src={asset(name)}
      objectFit="cover"
      muted
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
export function Title({
  children,
  top = 115,
  dark = false,
  size = 80,
}: {
  children: ReactNode;
  top?: number;
  dark?: boolean;
  size?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 75,
        right: 75,
        textAlign: "center",
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: -2,
        color: dark ? palette.ink : "white",
        textShadow: dark ? "none" : "0 3px 22px #15052680",
      }}
    >
      {children}
    </div>
  );
}
export function URL() {
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top: 1670,
        padding: "26px 18px",
        background: "rgba(255,255,255,.97)",
        borderRadius: 30,
        border: "2px solid #d8c8ff",
        boxShadow: "0 18px 50px #13092a30",
        fontSize: 43,
        fontWeight: 750,
        textAlign: "center",
        letterSpacing: -1.1,
        color: palette.ink,
      }}
    >
      envitefy.com/card/<span style={{ color: "#6541de" }}>john-is-10</span>
    </div>
  );
}
export function Label({
  children,
  top = 1555,
  dark = false,
}: {
  children: ReactNode;
  top?: number;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 75,
        right: 75,
        textAlign: "center",
        fontSize: 46,
        lineHeight: 1.15,
        fontWeight: 700,
        color: dark ? palette.ink : "white",
        textShadow: dark ? "none" : "0 3px 18px #1a0746",
      }}
    >
      {children}
    </div>
  );
}
export function Caption({
  children,
  top = 1660,
}: {
  children: ReactNode;
  top?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 90,
        right: 90,
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          background: "#211333e8",
          padding: "16px 25px",
          borderRadius: 23,
          color: "#fff",
          fontSize: 46,
          lineHeight: 1.18,
          fontWeight: 750,
        }}
      >
        {children}
      </span>
    </div>
  );
}
export function Phone({
  name,
  top = 400,
  left = 160,
  width = 760,
  height = 1260,
  cropY = 0,
  zoom = 1,
}: {
  name: string;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  cropY?: number;
  zoom?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        overflow: "hidden",
        borderRadius: 44,
        border: "9px solid white",
        boxShadow: "0 26px 80px #260d5848",
        background: "#f9f7ff",
      }}
    >
      <Video
        src={asset(name)}
        muted
        style={{
          position: "absolute",
          left: 0,
          top: (-cropY * width) / 430,
          width: width * zoom,
          height: "auto",
        }}
      />
    </div>
  );
}
export function Sparkles() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 18 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: i % 3 === 0 ? 10 : 5,
            height: i % 3 === 0 ? 10 : 5,
            borderRadius: 20,
            background: i % 2 ? "#ffffff" : "#ffe38a",
            left: (i * 173 + 80) % 1080,
            top: (((i * 223 - f * ((i % 3) + 1) * 0.6) % 1920) + 1920) % 1920,
            opacity: 0.22 + 0.24 * Math.sin(f / 12 + i),
          }}
        />
      ))}
    </AbsoluteFill>
  );
}
export function Brand() {
  return (
    <CanvasImage
      src={staticFile("brand/envitefy-com.png")}
      style={{ width: 620, height: "auto" }}
    />
  );
}
export function Flash() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "#dcdbff",
        opacity: interpolate(f, [0, 8], [0.6, 0], clamp),
      }}
    />
  );
}
