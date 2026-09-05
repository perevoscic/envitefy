import { Video } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { CaptionBlock, Dialogue } from "./Caption";
import captions from "./opening-captions.json";
export function SupportHook() {
  const frame = useCurrentFrame();
  const call = frame < 18 ? 0 : frame < 42 ? 1 : frame < 86 ? 2 : -1;
  return (
    <AbsoluteFill>
      <Video
        src={staticFile("projects/birthday-support/opening-edit-v2.mp4")}
        muted
        style={{ width: "100%", height: "100%" }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg,#0007 0%,transparent 27%,transparent 68%,#0005 100%)",
        }}
      />
      <CaptionBlock>
        You volunteered
        <br />
        to plan <span style={{ color: "#ffe278" }}>ONE party.</span>
      </CaptionBlock>
      {call >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 145,
            top: 1415,
            padding: "25px 30px",
            background: "#fff9f5f2",
            borderRadius: 28,
            boxShadow: "0 10px 30px #0003",
          }}
        >
          <div
            style={{
              fontSize: 27,
              letterSpacing: 3,
              fontWeight: 800,
              color: "#725687",
              marginBottom: 10,
            }}
          >
            INCOMING CALL {call + 1}
          </div>
          <div
            style={{
              fontSize: 65,
              fontWeight: 850,
              letterSpacing: -1.5,
              color: "#251b31",
              lineHeight: 1.07,
            }}
          >
            {
              ["“What time?”", "“What’s the address?”", "“Did you count us?”"][
                call
              ]
            }
          </div>
        </div>
      ) : (
        <Dialogue captions={captions} />
      )}
    </AbsoluteFill>
  );
}
