import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  ActionCaption,
  Brand,
  Phone,
  PhoneVideo,
  WarmBackdrop,
} from "./Shared";
export function FridgeSearch() {
  const frame = useCurrentFrame();
  const query = "turn paper birthday invite into a digital invitation";
  return (
    <AbsoluteFill>
      <WarmBackdrop />
      <Sequence durationInFrames={88} name="Google search">
        <Phone width={830} top={175}>
          <PhoneVideo name="search" />
        </Phone>
        <div
          style={{
            position: "absolute",
            left: 111,
            top: 808,
            width: 790,
            minHeight: 190,
            padding: "30px 34px",
            borderRadius: 45,
            background: "white",
            boxShadow: "0 4px 18px #0003",
            fontSize: 45,
            lineHeight: 1.2,
            color: "#242424",
          }}
        >
          {query.slice(0, Math.min(query.length, Math.ceil(frame / 1.05)))}
          <span style={{ color: "#7855ca" }}>│</span>
        </div>
      </Sequence>
      <Sequence from={88} durationInFrames={62} name="Open Envitefy">
        <Brand top={92} />
        <Phone width={720} top={255}>
          <PhoneVideo name="snap" />
        </Phone>
        <ActionCaption text="Hello, Envitefy." />
      </Sequence>
    </AbsoluteFill>
  );
}
