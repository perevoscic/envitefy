import type { Caption } from "@remotion/captions";
import { useCurrentFrame } from "remotion";
export function DialogueCaption({ captions }: { captions: Caption[] }) {
  const frame = useCurrentFrame();
  const current = captions.find(
    (c) => (frame / 30) * 1000 >= c.startMs && (frame / 30) * 1000 < c.endMs,
  );
  if (!current) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 85,
        right: 145,
        top: 1390,
        color: "#fff",
        fontSize: 68,
        fontWeight: 800,
        lineHeight: 1.13,
        textAlign: "center",
        letterSpacing: -1.7,
        textShadow: "0 3px 10px #000",
        background: "#18171cee",
        padding: "28px 30px",
        borderRadius: 25,
      }}
    >
      {current.text}
    </div>
  );
}
