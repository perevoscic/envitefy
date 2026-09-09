import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence } from "remotion";
import { asset } from "./john-space-disco-square/Shared";
import { SquareHook } from "./john-space-disco-square/Hook";
import { SquareCreate } from "./john-space-disco-square/Create";
import { SquareShare } from "./john-space-disco-square/Share";
import { SquareUpdate } from "./john-space-disco-square/Update";
import { SquarePayoff } from "./john-space-disco-square/Payoff";
export function JohnSpaceDiscoSquare() {
  return (
    <AbsoluteFill
      style={{
        background: "#24143e",
        fontFamily: '"Josefin Sans", Arial, sans-serif',
      }}
    >
      <Sequence durationInFrames={150} name="John’s imagination">
        <SquareHook />
      </Sequence>
      <Sequence
        from={150}
        durationInFrames={210}
        name="Create with Envitefy Concierge"
      >
        <SquareCreate />
      </Sequence>
      <Sequence from={360} durationInFrames={210} name="One easy link">
        <SquareShare />
      </Sequence>
      <Sequence
        from={570}
        durationInFrames={210}
        name="Same link, updated details"
      >
        <SquareUpdate />
      </Sequence>
      <Sequence
        from={780}
        durationInFrames={120}
        name="Dinosaur left, John right"
      >
        <SquarePayoff />
      </Sequence>
      <Audio src={asset("vertical-final-mix-v11.wav")} />
    </AbsoluteFill>
  );
}
