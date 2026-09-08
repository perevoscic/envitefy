import { Video } from "@remotion/media";
import { AbsoluteFill, Sequence } from "remotion";
import {
  ActionCaption,
  asset,
  Brand,
  Phone,
  PhoneVideo,
  WarmBackdrop,
} from "./Shared";
function Demo({
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
export function FridgeProduct() {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={33} name="Mom snaps the invitation">
        <Video
          objectFit="cover"
          src={asset("snap-action.mp4")}
          muted
          style={{ width: "100%", height: "100%" }}
        />
        <ActionCaption text="Snap it." />
      </Sequence>
      <Sequence from={33} durationInFrames={35} name="Actual Envitefy scan">
        <Demo name="processing" caption="Snap it." />
      </Sequence>
      <Sequence from={68} durationInFrames={15} name="Saved digital invitation">
        <Demo name="event" caption="The party. All here." />
      </Sequence>
      <Sequence
        from={83}
        durationInFrames={66}
        name="Review date time and place"
      >
        <Demo
          name="details"
          caption="Date. Time. Place."
          sub="Envitefy Live Card Demo"
        />
      </Sequence>
      <Sequence
        from={149}
        durationInFrames={28}
        name="Copy the actual event link"
      >
        <Demo name="share" caption="Share it." />
      </Sequence>
      <Sequence
        from={177}
        durationInFrames={31}
        name="Share with the other parent"
      >
        <Demo name="message" caption="Share it." sub="Illustrative message" />
      </Sequence>
      <Sequence
        from={208}
        durationInFrames={40}
        name="Actual calendar controls"
      >
        <Demo name="calendar" caption="Add it to your calendar." />
      </Sequence>
      <Sequence from={248} durationInFrames={15} name="Confirm calendar import">
        <Demo name="calendar-add" caption="Add it to your calendar." />
      </Sequence>
      <Sequence
        from={263}
        durationInFrames={37}
        name="Birthday saved in Moms calendar"
      >
        <Demo
          name="calendar-saved"
          caption="Snap it. Share it. Add it to your calendar."
          sub="Illustrative calendar · verified event details"
        />
      </Sequence>
    </AbsoluteFill>
  );
}
