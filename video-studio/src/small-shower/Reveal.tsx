import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Film, usePortrait } from "./Shared";
export const Reveal = () => {
  const f = useCurrentFrame();
  const portrait = usePortrait();
  const position = !portrait
    ? "50%"
    : f < 28
      ? "34%"
      : f < 51
        ? "58%"
        : f < 98
          ? "12%"
          : "64%";
  return (
    <AbsoluteFill>
      <Film name="edit-reveal" position={position} />
    </AbsoluteFill>
  );
};
