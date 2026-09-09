import type { CSSProperties, ReactNode } from "react";
import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
export { ProductCrop } from "../john-space-disco-wide/Shared";
export const asset = (name: string) =>
  staticFile("projects/john-space-disco/" + name);
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export function Film({ name, style }: { name: string; style?: CSSProperties }) {
  return (
    <Video
      src={asset(name)}
      muted
      objectFit="cover"
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
export function Heading({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        top: 70,
        textAlign: "center",
        fontSize: 68,
        fontWeight: 800,
        lineHeight: 1.06,
        letterSpacing: -1.8,
        color: dark ? "#291640" : "white",
        textShadow: dark ? "none" : "0 3px 22px #16073599",
      }}
    >
      {children}
    </div>
  );
}
export function Caption({
  children,
  top = 912,
}: {
  children: ReactNode;
  top?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "17px 25px",
          borderRadius: 22,
          background: "#251339ed",
          color: "white",
          fontSize: 39,
          lineHeight: 1.16,
          fontWeight: 700,
        }}
      >
        {children}
      </span>
    </div>
  );
}
export function Url() {
  return (
    <div
      style={{
        position: "absolute",
        left: 75,
        top: 242,
        width: 930,
        padding: "21px 12px",
        borderRadius: 23,
        background: "#fffffffa",
        border: "2px solid #d8c6ff",
        color: "#2a1746",
        fontSize: 42,
        fontWeight: 700,
        letterSpacing: -1,
        textAlign: "center",
        boxShadow: "0 15px 40px #30114520",
      }}
    >
      envitefy.com/card/<span style={{ color: "#6b3cff" }}>john-is-10</span>
    </div>
  );
}
export function Paper() {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg,#fffdfd,#f4efff 60%,#e8f2ff)",
      }}
    />
  );
}
export function Brand() {
  return (
    <CanvasImage
      src={staticFile("brand/envitefy-com.png")}
      style={{ width: 580, height: "auto" }}
    />
  );
}
export function Sweep() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: "linear-gradient(105deg,transparent,#e7dbff88,transparent)",
        translate: interpolate(
          f,
          [0, 10],
          ["-1200px 0px", "1200px 0px"],
          clamp,
        ),
        opacity: interpolate(f, [0, 10, 11], [0.6, 0.6, 0], clamp),
      }}
    />
  );
}
