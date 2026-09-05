import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { BirthdayChaos } from "./birthday-second-job/Chaos";
import { BirthdayPayoff } from "./birthday-second-job/Payoff";
import { BirthdayProduct } from "./birthday-second-job/Product";
export function BirthdaySecondJob() {
  return (
    <AbsoluteFill style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={staticFile("projects/birthday-second-job/final-mix-v4.wav")} />
      <Sequence durationInFrames={300} name="Birthday admin chaos">
        <BirthdayChaos />
      </Sequence>
      <Sequence from={300} durationInFrames={300} name="Guests RSVP and save the date">
        <BirthdayProduct />
      </Sequence>
      <Sequence from={600} durationInFrames={300} name="The new theme">
        <BirthdayPayoff />
      </Sequence>
    </AbsoluteFill>
  );
}
