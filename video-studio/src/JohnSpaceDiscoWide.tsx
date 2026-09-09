import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence } from "remotion";
import { asset } from "./john-space-disco-wide/Shared";
import { WideHook } from "./john-space-disco-wide/Hook";
import { WideCreate } from "./john-space-disco-wide/Create";
import { WideShare } from "./john-space-disco-wide/Share";
import { WideUpdate } from "./john-space-disco-wide/Update";
import { WidePayoff } from "./john-space-disco-wide/Payoff";
export function JohnSpaceDiscoWide() {
  return (
    <AbsoluteFill
      style={{
        background: "#24123e",
        fontFamily: '"Josefin Sans", Arial, sans-serif',
      }}
    >
      <Sequence durationInFrames={150} name="The imagination hook">
        <WideHook />
      </Sequence>
      <Sequence
        from={150}
        durationInFrames={210}
        name="Create with Envitefy Concierge"
      >
        <WideCreate />
      </Sequence>
      <Sequence
        from={360}
        durationInFrames={210}
        name="One link, everything together"
      >
        <WideShare />
      </Sequence>
      <Sequence
        from={570}
        durationInFrames={210}
        name="Same link, updated details"
      >
        <WideUpdate />
      </Sequence>
      <Sequence
        from={780}
        durationInFrames={120}
        name="John's party and brand payoff"
      >
        <WidePayoff />
      </Sequence>
      <Audio src={asset("wide-final-mix-v5.wav")} />
    </AbsoluteFill>
  );
}
