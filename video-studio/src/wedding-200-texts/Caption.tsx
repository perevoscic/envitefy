import type { Caption } from "@remotion/captions";
import { useCurrentFrame } from "remotion";
export function SpokenCaption({ captions }: { captions: Caption[] }) {
  const time = (useCurrentFrame() / 30) * 1000;
  const caption = captions.find((c) => time >= c.startMs && time < c.endMs);
  if (!caption) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 1430,
        left: 85,
        right: 145,
        textAlign: "center",
        fontSize: 70,
        lineHeight: 1.16,
        fontWeight: 800,
        letterSpacing: -1.5,
        whiteSpace: "pre-line",
        color: "#fffaf2",
      }}
    >
      <span
        style={{
          background: "#241b1bed",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
          padding: "10px 24px",
          borderRadius: 13,
        }}
      >
        {caption.text}
      </span>
    </div>
  );
}
