import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Film, usePortrait, asset, cream, ink } from "./Shared";
export const EndCard = () => {
  const f = useCurrentFrame(),
    v = usePortrait();
  return (
    <AbsoluteFill>
      <Film name="edit-celebration" position={v ? "18%" : "50%"} />
      <AbsoluteFill
        style={{
          opacity: interpolate(f, [10, 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          background: cream,
          color: ink,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: v ? 90 : 820,
            top: v ? 135 : 180,
            width: v ? 900 : 990,
            fontFamily: "Georgia",
            fontSize: v ? 90 : 90,
            lineHeight: 1.12,
          }}
        >
          Tiny human.
          <br />
          Big celebration.
          <br />
          One invitation.
        </div>
        <Img
          src={asset("invitation.webp")}
          style={{
            position: "absolute",
            left: v ? 95 : 220,
            top: v ? 610 : 125,
            width: v ? 410 : 510,
            height: v ? 615 : 765,
            objectFit: "contain",
            borderRadius: 20,
            boxShadow: "0 22px 65px #34463820",
          }}
        />
        <Img
          src={staticFile("brand/envitefy-com.png")}
          style={{
            position: "absolute",
            left: v ? 550 : 815,
            top: v ? 790 : 595,
            width: v ? 455 : 780,
            height: v ? 175 : 235,
            objectFit: "contain",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: v ? 90 : 820,
            top: v ? 1390 : 850,
            width: v ? 900 : 980,
            fontFamily: "Josefin Sans",
            fontSize: v ? 60 : 51,
            fontWeight: 500,
            lineHeight: 1.18,
          }}
        >
          Create yours with
          <br />
          Envitefy Concierge.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
