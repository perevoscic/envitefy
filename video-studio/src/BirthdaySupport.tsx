import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { SupportHook } from "./birthday-support/Hook";
import { SupportProduct } from "./birthday-support/Product";
import { SupportPayoff } from "./birthday-support/Payoff";
import { SupportEndCard } from "./birthday-support/EndCard";

export function BirthdaySupport() {
  return (
    <AbsoluteFill
      style={{ background: "#fff9f0", fontFamily: "Arial, sans-serif" }}
    >
      <Audio src={staticFile("projects/birthday-support/final-mix-v2.wav")} />
      <Sequence durationInFrames={210} name="Birthday support">
        <SupportHook />
      </Sequence>
      <Sequence from={210} durationInFrames={330} name="One invitation">
        <SupportProduct />
      </Sequence>
      <Sequence from={540} durationInFrames={135} name="The cake">
        <SupportPayoff />
      </Sequence>
      <Sequence from={675} durationInFrames={75} name="Envitefy end card">
        <SupportEndCard />
      </Sequence>
    </AbsoluteFill>
  );
}
