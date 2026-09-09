import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Film, usePortrait } from "./Shared";
export const Opening = () => {
  const f = useCurrentFrame();
  const portrait = usePortrait();
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={129}>
        <Film
          name="edit-opening"
          position={portrait ? (f < 84 ? "25%" : "76%") : "50%"}
        />
      </Sequence>
      <Sequence from={129} durationInFrames={21}>
        <Film name="edit-trunk" position={portrait ? "55%" : "50%"} />
      </Sequence>
    </AbsoluteFill>
  );
};
