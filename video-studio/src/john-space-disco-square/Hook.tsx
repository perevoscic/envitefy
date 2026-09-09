import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Caption, clamp, Film, Heading } from "./Shared";
export function SquareHook() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film
        name="vertical-hook.mp4"
        style={{
          objectPosition:
            "50% " + interpolate(f, [0, 52, 95], [10, 10, 38], clamp) + "%",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#16092d90,transparent 28%,transparent 77%,#16092d88)",
        }}
      />
      <Heading>
        Their birthday.
        <br />
        Their imagination.
      </Heading>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 824,
          textAlign: "center",
          color: "white",
          fontSize: 32,
          fontWeight: 700,
          textShadow: "0 2px 12px #170927",
        }}
      >
        Meet John. Turning 10.
      </div>
      <Caption>
        {f < 52
          ? "My birthday needs dinosaurs…"
          : f < 88
            ? "…in space…"
            : "…with a DISCO!"}
      </Caption>
    </AbsoluteFill>
  );
}
