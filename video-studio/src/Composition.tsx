import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Captions } from "./Captions";
import { Create } from "./scenes/Create";
import { Hook } from "./scenes/Hook";
import { Payoff } from "./scenes/Payoff";
import { Share } from "./scenes/Share";
import { Updates } from "./scenes/Updates";
import type { VideoProps } from "./types";

export function EnvitefyVideo({ manifest }: VideoProps) {
  if (!manifest) throw new Error("Narration manifest is missing. Run npm run narration -- intro.");
  return (
    <AbsoluteFill style={{ fontFamily: '"Josefin Sans", sans-serif' }}>
      <TransitionSeries>
        {manifest.scenes.map((scene) => (
          <TransitionSeries.Sequence
            key={scene.id}
            name={scene.id}
            durationInFrames={scene.durationInFrames}
          >
            {scene.id === "hook" && <Hook />}
            {scene.id === "create" && <Create />}
            {scene.id === "share" && <Share heroImage={manifest.heroImage} />}
            {scene.id === "updates" && <Updates />}
            {scene.id === "payoff" && <Payoff heroImage={manifest.heroImage} />}
            <Sequence from={scene.audioOffsetFrames} layout="none" name={`${scene.id} narration`}>
              <Audio src={staticFile(scene.audioFile)} />
            </Sequence>
            <Captions captions={scene.captions} offsetFrames={scene.audioOffsetFrames} />
          </TransitionSeries.Sequence>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
}
