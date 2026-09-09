import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Brand, Caption, clamp, Film } from "./Shared";
export function WidePayoff() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film name="wide-edit-payoff.mp4" />
      {f < 59 ? <Caption>“That’s MY kind of birthday!”</Caption> : null}
      <AbsoluteFill
        style={{
          background: "linear-gradient(120deg,#fffdfd,#f5f0ff 62%,#e8f2ff)",
          opacity: interpolate(f, [54, 63], [0, 1], clamp),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            translate: `${interpolate(f, [54, 68], [15, 0], clamp)}px 0px`,
          }}
        >
          <Brand width={800} />
          <div
            style={{
              fontSize: 49,
              fontWeight: 700,
              color: "#6a40d0",
              marginTop: 6,
              letterSpacing: 1.2,
            }}
          >
            Live Cards
          </div>
          <div
            style={{
              fontSize: 70,
              fontWeight: 800,
              color: "#291341",
              marginTop: 40,
              letterSpacing: -1.3,
            }}
          >
            Big imagination. One live invitation.
          </div>
          <div
            style={{
              fontSize: 43,
              color: "#6a40d0",
              fontWeight: 700,
              marginTop: 33,
            }}
          >
            Create yours with Envitefy Concierge.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 92,
            width: 19,
            height: 19,
            borderRadius: 30,
            background: "#7140ec",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 126,
            bottom: 145,
            width: 28,
            height: 28,
            borderRadius: 30,
            background: "#4799ff",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
