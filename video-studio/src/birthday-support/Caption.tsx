import type { Caption } from "@remotion/captions";
import { useCurrentFrame } from "remotion";
export function Dialogue({ captions }: { captions: Caption[] }) {
  const ms = (useCurrentFrame() / 30) * 1000;
  const current = captions.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!current) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 150,
        top: 1390,
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "22px 30px",
          borderRadius: 22,
          background: "#171421ed",
          color: "white",
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.12,
          whiteSpace: "pre-line",
          boxShadow: "0 8px 22px #0003",
        }}
      >
        {current.text}
      </span>
    </div>
  );
}
export function CaptionBlock({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 145,
        top: 125,
        fontSize: 76,
        fontWeight: 900,
        letterSpacing: -2.5,
        lineHeight: 1.06,
        textAlign: "center",
        color: "white",
        textShadow: "0 4px 18px #000a, 0 2px 3px #0008",
      }}
    >
      {children}
    </div>
  );
}
