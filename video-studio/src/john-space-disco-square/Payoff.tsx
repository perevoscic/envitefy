import { AbsoluteFill } from "remotion";
import { Brand, Film, Heading } from "./Shared";
export function SquarePayoff() {
  return (
    <AbsoluteFill>
      <Film
        name="vertical-payoff-v5-uncut.mp4"
        style={{ objectPosition: "50% 45%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#17063090,transparent 28%,transparent 68%,#f8f4fff5 79%,#f8f4ff)",
        }}
      />
      <Heading>
        Big imagination.
        <br />
        One live invitation.
      </Heading>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 790,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Brand />
      </div>
      <div
        style={{
          position: "absolute",
          left: 75,
          right: 75,
          top: 946,
          textAlign: "center",
          fontSize: 35,
          fontWeight: 700,
          lineHeight: 1.15,
          color: "#6040a0",
        }}
      >
        Create yours with Envitefy Concierge.
      </div>
    </AbsoluteFill>
  );
}
