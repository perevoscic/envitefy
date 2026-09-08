import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { FridgeOpening } from "./fridge-freedom/Opening";
import { FridgeSearch } from "./fridge-freedom/Search";
import { FridgeProduct } from "./fridge-freedom/Product";
import { FridgeCleanup, FridgePayoff } from "./fridge-freedom/Cleanup";

export function FridgeFreedom() {
  return (
    <AbsoluteFill
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#eee7db",
      }}
    >
      <Audio src={staticFile("projects/fridge-freedom/final-mix.wav")} />
      <Sequence durationInFrames={210} name="The overloaded fridge">
        <FridgeOpening />
      </Sequence>
      <Sequence from={210} durationInFrames={150} name="The search">
        <FridgeSearch />
      </Sequence>
      <Sequence from={360} durationInFrames={300} name="Paper to digital">
        <FridgeProduct />
      </Sequence>
      <Sequence from={660} durationInFrames={150} name="Goodbye clutter">
        <FridgeCleanup />
      </Sequence>
      <Sequence from={810} durationInFrames={90} name="Keep the memories">
        <FridgePayoff />
      </Sequence>
    </AbsoluteFill>
  );
}
