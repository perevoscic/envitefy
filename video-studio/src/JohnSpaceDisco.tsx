import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence } from "remotion";
import { JohnHook } from "./john-space-disco/Hook";
import { JohnCreate } from "./john-space-disco/Create";
import { JohnShare } from "./john-space-disco/Share";
import { JohnUpdates } from "./john-space-disco/Updates";
import { JohnPayoff } from "./john-space-disco/Payoff";
import { asset } from "./john-space-disco/Shared";
export function JohnSpaceDisco() {
  return (
    <AbsoluteFill
      style={{ background: "#211439", fontFamily: "Arial, sans-serif" }}
    >
      <Audio src={asset("vertical-final-mix-v11.wav")} />
      <Sequence durationInFrames={150} name="John’s imagination">
        <JohnHook />
      </Sequence>
      <Sequence
        from={150}
        durationInFrames={210}
        name="Create with Envitefy Concierge"
      >
        <JohnCreate />
      </Sequence>
      <Sequence
        from={360}
        durationInFrames={210}
        name="One link, all the details"
      >
        <JohnShare />
      </Sequence>
      <Sequence
        from={570}
        durationInFrames={210}
        name="Same link, updated details"
      >
        <JohnUpdates />
      </Sequence>
      <Sequence
        from={780}
        durationInFrames={120}
        name="John’s kind of birthday"
      >
        <JohnPayoff />
      </Sequence>
    </AbsoluteFill>
  );
}
