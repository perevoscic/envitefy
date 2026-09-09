import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Caption, Footage, Title } from "./Shared";
export function JohnHook() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage name="vertical-hook.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#13052c65,transparent 24%,transparent 77%,#13052c35)",
        }}
      />
      <Title>
        Their birthday.
        <br />
        Their imagination.
      </Title>
      <div
        style={{
          position: "absolute",
          top: 1510,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "white",
          fontSize: 38,
          fontWeight: 750,
          textShadow: "0 2px 10px #111",
        }}
      >
        Meet John. Turning 10.
      </div>
      <Caption>
        {f < 52
          ? "My birthday needs dinosaurs…"
          : f < 88
            ? "in space…"
            : "with a DISCO!"}
      </Caption>
    </AbsoluteFill>
  );
}
