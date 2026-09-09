import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  Freeze,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FridgeSearch } from "./fridge-freedom/Search";
import { FridgeProduct } from "./fridge-freedom/Product";
import { FridgePayoff } from "./fridge-freedom/Cleanup";
import { asset } from "./fridge-freedom/Shared";

export function OpeningV2() {
  const frame = useCurrentFrame();
  const caption =
    frame >= 28 && frame < 49
      ? "Can I go?"
      : frame >= 145 && frame < 190
        ? "There has to be a better way."
        : null;
  return (
    <AbsoluteFill>
      <Video
        objectFit="cover"
        src={asset("v2-opening-edit.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 95,
            right: 130,
            bottom: 230,
            textAlign: "center",
            color: "white",
            fontSize: 64,
            fontWeight: 750,
            lineHeight: 1.13,
            textShadow: "0 3px 8px #000,0 1px 25px #0008",
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
function SearchV2() {
  const frame = useCurrentFrame();
  return (
    <Freeze frame={frame >= 128 ? 125 : frame}>
      <FridgeSearch />
    </Freeze>
  );
}
export function FridgeFreedomV2() {
  return (
    <AbsoluteFill
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#eee7db",
      }}
    >
      <Audio src={staticFile("projects/fridge-freedom/v2-final-mix.wav")} />
      <Sequence durationInFrames={210} name="Steady handoff and paper mishap">
        <OpeningV2 />
      </Sequence>
      <Sequence from={210} durationInFrames={150} name="The search">
        <SearchV2 />
      </Sequence>
      <Sequence from={360} durationInFrames={300} name="Paper to digital">
        <FridgeProduct />
      </Sequence>
      <Sequence
        from={660}
        durationInFrames={150}
        name="Deliberate paper removal"
      >
        <Video
          objectFit="cover"
          src={asset("v2-ending-edit.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </Sequence>
      <Sequence from={810} durationInFrames={90} name="Keep the memories">
        <FridgePayoff source="v2-ending-edit.mp4" trimBefore={150} />
      </Sequence>
    </AbsoluteFill>
  );
}
