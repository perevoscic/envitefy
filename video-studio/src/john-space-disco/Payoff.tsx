import { AbsoluteFill } from "remotion";
import { Brand, Footage, Title } from "./Shared";
export function JohnPayoff() {
  return (
    <AbsoluteFill>
      <Footage name="vertical-payoff-v5-uncut.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#14073190,transparent 27%,transparent 70%,#f8f4fff5 79%,#f8f4ff 100%)",
        }}
      />
      <Title size={78}>
        Big imagination.
        <br />
        One live invitation.
      </Title>
      <div
        style={{
          position: "absolute",
          top: 1490,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Brand />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1710,
          left: 80,
          right: 80,
          textAlign: "center",
          fontSize: 46,
          lineHeight: 1.2,
          fontWeight: 750,
          color: "#382052",
        }}
      >
        Create yours with
        <br />
        <span style={{ color: "#7042df" }}>Envitefy Concierge.</span>
      </div>
    </AbsoluteFill>
  );
}
