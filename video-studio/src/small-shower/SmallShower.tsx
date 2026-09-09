import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import { Opening } from "./Opening";
import { Product } from "./Product";
import { Reveal } from "./Reveal";
import { EndCard } from "./EndCard";
import { asset, usePortrait } from "./Shared";
import captions from "./captions.json";
export const SmallShower = () => {
  const frame = useCurrentFrame(),
    v = usePortrait();
  const caption = (captions as Caption[]).find(
    (c) => (frame / 30) * 1000 >= c.startMs && (frame / 30) * 1000 < c.endMs,
  );
  return (
    <AbsoluteFill style={{ background: "#f5f2e9" }}>
      <Sequence durationInFrames={150}>
        <Opening />
      </Sequence>
      <Sequence from={150} durationInFrames={480}>
        <Product />
      </Sequence>
      <Sequence from={630} durationInFrames={180}>
        <Reveal />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <EndCard />
      </Sequence>
      <Audio src={asset("final-mix.wav")} />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: v ? 70 : 180,
            right: v ? 70 : 180,
            bottom: v ? 160 : 90,
            textAlign: "center",
            fontFamily: "Josefin Sans",
            fontWeight: 600,
            fontSize: v ? 60 : 62,
            lineHeight: 1.15,
            color: "#fff",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "16px 28px 12px",
              borderRadius: 14,
              background: "#17211cc9",
              boxShadow: "0 4px 22px #0002",
            }}
          >
            {caption.text}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
