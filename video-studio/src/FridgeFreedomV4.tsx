import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { OpeningV2 } from "./FridgeFreedomV2";
import { FridgeSearchV3 } from "./fridge-freedom/SearchV3";
import { FridgePayoff } from "./fridge-freedom/Cleanup";
import {
  ActionCaption,
  asset,
  Brand,
  Phone,
  PhoneVideo,
  WarmBackdrop,
} from "./fridge-freedom/Shared";
function DemoV4({
  name,
  caption,
  sub,
}: {
  name: string;
  caption: string;
  sub?: string;
}) {
  return (
    <AbsoluteFill>
      <WarmBackdrop />
      <Brand />
      <Phone width={702} top={245}>
        <PhoneVideo name={name} />
      </Phone>
      <ActionCaption text={caption} sub={sub} />
    </AbsoluteFill>
  );
}
function ProductV4() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={60} name="Clear full-flyer camera preview">
        <Video
          objectFit="cover"
          src={asset("v4-camera-ready.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
        <ActionCaption text="Snap it." />
      </Sequence>
      <Sequence from={60} durationInFrames={18} name="Extract event details">
        <DemoV4 name="processing" caption="Snap it." />
      </Sequence>
      <Sequence from={78} durationInFrames={15} name="Digital invitation">
        <DemoV4 name="event" caption="The party. All here." />
      </Sequence>
      <Sequence
        from={93}
        durationInFrames={51}
        name="Review date time and venue"
      >
        <DemoV4
          name="details"
          caption="Date. Time. Place."
          sub="Envitefy Live Card Demo"
        />
      </Sequence>
      <Sequence from={144} durationInFrames={24} name="Copy event link">
        <DemoV4 name="share" caption="Share it." />
      </Sequence>
      <Sequence from={168} durationInFrames={30} name="Share with other parent">
        <DemoV4 name="message" caption="Share it." sub="Illustrative message" />
      </Sequence>
      <Sequence from={198} durationInFrames={36} name="Calendar options">
        <DemoV4 name="calendar" caption="Add it to your calendar." />
      </Sequence>
      <Sequence from={234} durationInFrames={24} name="Confirm calendar save">
        <DemoV4 name="calendar-add" caption="Add it to your calendar." />
      </Sequence>
      <Sequence from={258} durationInFrames={42} name="Birthday saved">
        <DemoV4
          name="calendar-saved"
          caption="Snap it. Share it. Add it to your calendar."
          sub="Illustrative calendar · verified event details"
        />
      </Sequence>
    </AbsoluteFill>
  );
}
export function FridgeFreedomV4() {
  return (
    <AbsoluteFill
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#eee7db",
      }}
    >
      <Audio src={staticFile("projects/fridge-freedom/v4-final-mix.wav")} />
      <Sequence durationInFrames={210} name="The invitation comes home">
        <OpeningV2 />
      </Sequence>
      <Sequence
        from={210}
        durationInFrames={150}
        name="Search result and Envitefy click"
      >
        <FridgeSearchV3 />
      </Sequence>
      <Sequence
        from={360}
        durationInFrames={300}
        name="Snap share and calendar"
      >
        <ProductV4 />
      </Sequence>
      <Sequence from={660} durationInFrames={150} name="Clear the fridge">
        <Video
          objectFit="cover"
          src={asset("v4-ending-edit.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
      </Sequence>
      <Sequence from={810} durationInFrames={90} name="Keep the memories">
        <FridgePayoff source="v4-ending-edit.mp4" trimBefore={150} />
      </Sequence>
    </AbsoluteFill>
  );
}
