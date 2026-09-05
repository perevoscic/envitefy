import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { WeddingOpening } from "./wedding-200-texts/Opening";
import { WeddingProduct } from "./wedding-200-texts/Product";
import { WeddingEnding } from "./wedding-200-texts/Ending";
import { WeddingEndCard } from "./wedding-200-texts/EndCard";
export function Wedding200Texts() {
  return (
    <AbsoluteFill
      style={{ background: "#fff9ee", fontFamily: "Arial, sans-serif" }}
    >
      <Audio src={staticFile("projects/wedding-200-texts/final-mix.wav")} />
      <Sequence durationInFrames={210} name="200 texts">
        <WeddingOpening />
      </Sequence>
      <Sequence from={210} durationInFrames={330} name="Wedding invitation">
        <WeddingProduct />
      </Sequence>
      <Sequence from={540} durationInFrames={135} name="The seating chart">
        <WeddingEnding />
      </Sequence>
      <Sequence from={675} durationInFrames={75} name="More celebrating">
        <WeddingEndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
