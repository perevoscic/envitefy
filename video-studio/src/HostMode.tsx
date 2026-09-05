import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Chaos } from "./host-mode/Chaos";
import { Party } from "./host-mode/Party";
import { Product } from "./host-mode/Product";
import { Reset } from "./host-mode/Reset";

export function HostMode() {
  return (
    <AbsoluteFill style={{ fontFamily: "Arial, sans-serif" }} durationInFrames={660}>
      <Audio
        src={staticFile("projects/host-mode/final-mix.wav")}
        volume={(f) =>
          interpolate(f, [0, 640, 659], [0.88, 0.88, 0], { extrapolateRight: "clamp" })
        }
      />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120} name="The group chat">
          <Chaos />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={15} name="Pause">
          <Reset />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={225} name="One event link">
          <Product />
        </TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={300} name="The actual party">
          <Party />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}
