import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { ReactNode } from "react";
export const asset = (name: string) =>
  staticFile(`projects/fridge-freedom/${name}`);

export function WarmBackdrop() {
  return (
    <AbsoluteFill>
      <Video
        objectFit="cover"
        src={asset("phone.mp4")}
        trimBefore={240}
        playbackRate={0.45}
        muted
        style={{
          width: "100%",
          height: "100%",

          filter: "blur(16px) brightness(.75)",
          scale: 1.08,
        }}
      />
      <AbsoluteFill style={{ background: "#e8dccd4d" }} />
    </AbsoluteFill>
  );
}
export function Phone({
  children,
  width = 740,
  top = 285,
}: {
  children: ReactNode;
  width?: number;
  top?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - width) / 2 - 15,
        top,
        width,
        height: (width * 800) / 430 + 26,
        background: "#252226",
        border: "12px solid #252226",
        borderRadius: 58,
        overflow: "hidden",
        boxShadow: "0 30px 90px #15101355",
        translate: `0 ${interpolate(frame, [0, 8], [15, 0], { extrapolateRight: "clamp" })}px`,
      }}
    >
      {children}
    </div>
  );
}
export function Brand({
  top = 105,
  width = 455,
}: {
  top?: number;
  width?: number;
}) {
  return (
    <CanvasImage
      src={staticFile("brand/envitefy-com.png")}
      style={{
        position: "absolute",
        top,
        left: (1080 - width) / 2 - 15,
        width,
        height: "auto",
      }}
    />
  );
}
export function PhoneVideo({ name }: { name: string }) {
  return (
    <Video
      objectFit="cover"
      src={asset(`demo-${name}.mp4`)}
      muted
      style={{ width: "100%", height: "100%" }}
    />
  );
}
export function ActionCaption({ text, sub }: { text: string; sub?: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 78,
        right: 118,
        bottom: 135,
        textAlign: "center",
        color: "#fff",
        textShadow: "0 3px 15px #30282080",
      }}
    >
      <div
        style={{
          fontSize: 66,
          fontWeight: 750,
          lineHeight: 1.05,
          letterSpacing: -2,
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 17,
            fontSize: 31,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}
