import { useMemo } from "react";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useCurrentFrame, useVideoConfig } from "remotion";

export function Captions({
  captions,
  offsetFrames,
}: {
  captions: Caption[];
  offsetFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = ((frame - offsetFrames) / fps) * 1000;
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 1000 }),
    [captions],
  );
  const page = pages.find(
    (candidate, index) =>
      timeMs >= candidate.startMs &&
      timeMs <
        Math.min(
          pages[index + 1]?.startMs ?? Infinity,
          candidate.startMs + candidate.durationMs + 120,
        ),
  );
  if (!page) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 175,
        left: 80,
        right: 80,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          padding: "22px 34px 15px",
          borderRadius: 24,
          background: "rgba(28, 21, 48, 0.93)",
          color: "white",
          fontSize: 46,
          lineHeight: 1.26,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {page.tokens.map((token, index) => (
          <span
            key={`${token.fromMs}-${index}`}
            style={{
              whiteSpace: "pre-wrap",
              color: timeMs >= token.fromMs && timeMs < token.toMs ? "#d4c3ff" : "#ffffff",
            }}
          >
            {token.text}
          </span>
        ))}
      </div>
    </div>
  );
}
