import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  CanvasImage,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { asset, Phone, WarmBackdrop } from "./Shared";
function SearchIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}
export function FridgeSearchV3() {
  const frame = useCurrentFrame();
  const results = frame >= 48;
  const landing = frame >= 94;
  const query = "turn paper birthday invite into a digital invitation";
  return (
    <AbsoluteFill>
      <WarmBackdrop />
      <Phone width={812} top={132}>
        <AbsoluteFill
          style={{
            background: "#fff",
            color: "#202124",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          <div
            style={{
              height: 100,
              background: "#f7f8fa",
              borderBottom: "1px solid #dadce0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              gap: 12,
            }}
          >
            <span style={{ fontSize: 25 }}>⌑</span>
            {landing ? "envitefy.com/snap" : "google.com"}
          </div>
          {landing ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 100,
                bottom: 0,
                overflow: "hidden",
              }}
            >
              <Video
                objectFit="cover"
                src={asset("v3-snap-landing.mp4")}
                from={94}
                trimBefore={0}
                muted
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          ) : (
            <>
              <CanvasImage
                src={asset("google-logo.png")}
                style={{
                  position: "absolute",
                  top: results ? 145 : 265,
                  left: results ? 271 : 214,
                  width: results ? 245 : 360,
                  height: "auto",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 36,
                  right: 36,
                  top: results ? 276 : 486,
                  minHeight: results ? 170 : 204,
                  border: "2px solid #dadce0",
                  borderRadius: 38,
                  padding: "26px 62px 26px 28px",
                  fontSize: 40,
                  lineHeight: 1.28,
                  background: "#fff",
                  boxShadow: "0 3px 10px #00000009",
                  overflowWrap: "break-word",
                  overflow: "hidden",
                }}
              >
                {query.slice(
                  0,
                  results
                    ? query.length
                    : Math.min(query.length, Math.ceil(frame / 0.84)),
                )}
                {!results ? <span style={{ color: "#1a73e8" }}>│</span> : null}
                <div
                  style={{
                    position: "absolute",
                    right: 19,
                    top: 28,
                    color: "#4285f4",
                  }}
                >
                  <SearchIcon size={30} />
                </div>
              </div>
              {!results ? (
                <>
                  <div
                    style={{
                      position: "absolute",
                      top: 740,
                      left: 130,
                      right: 130,
                      padding: 24,
                      textAlign: "center",
                      borderRadius: 12,
                      background: frame >= 43 ? "#e2e9f7" : "#f8f9fa",
                      border: "1px solid #f1f3f4",
                      fontSize: 28,
                    }}
                  >
                    Google Search
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: 40,
                      right: 40,
                      top: 492,
                      display: "flex",
                      gap: 42,
                      fontSize: 29,
                      color: "#70757a",
                      paddingBottom: 22,
                      borderBottom: "2px solid #f0f1f3",
                    }}
                  >
                    <span
                      style={{
                        color: "#1a73e8",
                        borderBottom: "3px solid #1a73e8",
                        paddingBottom: 20,
                      }}
                    >
                      All
                    </span>
                    <span>Images</span>
                    <span>Videos</span>
                    <span>More</span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      left: 39,
                      right: 39,
                      top: 598,
                      padding: "24px 23px 30px",
                      borderRadius: 22,
                      background: frame >= 86 ? "#edf3ff" : "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 18,
                        alignItems: "center",
                        marginBottom: 22,
                      }}
                    >
                      <CanvasImage
                        src={staticFile("brand/apple-touch-icon-120.png")}
                        style={{ width: 52, height: 52, borderRadius: 12 }}
                      />
                      <div>
                        <div style={{ fontSize: 34, color: "#202124" }}>
                          Envitefy
                        </div>
                        <div
                          style={{
                            fontSize: 28,
                            color: "#5f6368",
                            marginTop: 7,
                          }}
                        >
                          https://envitefy.com › snap
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 43,
                        lineHeight: 1.19,
                        color: "#1a0dab",
                        marginBottom: 24,
                        textDecoration: frame >= 86 ? "underline" : "none",
                      }}
                    >
                      Envitefy Snap | Turn invites, flyers, and PDFs into event
                      pages
                    </div>
                    <div
                      style={{
                        fontSize: 33,
                        lineHeight: 1.43,
                        color: "#4d5156",
                      }}
                    >
                      Upload a flyer or invite. Review the details, share the
                      event, and add it to your calendar.
                    </div>
                  </div>
                  {frame >= 86 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: 372,
                        top: 828,
                        width: 82,
                        height: 82,
                        borderRadius: "50%",
                        border: "4px solid #8058df",
                        background: "#a280ef55",
                        scale: interpolate(frame, [86, 93], [0.5, 1.2], {
                          extrapolateRight: "clamp",
                        }),
                        opacity: interpolate(frame, [86, 90, 94], [1, 1, 0]),
                      }}
                    />
                  ) : null}
                </>
              )}
            </>
          )}
        </AbsoluteFill>
      </Phone>
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 108,
          bottom: 130,
          textAlign: "center",
          color: "white",
          textShadow: "0 2px 12px #332a2280",
          fontSize: landing ? 49 : 27,
          fontWeight: landing ? 700 : 400,
        }}
      >
        {landing ? "Paper in. Event details out." : "Search demonstration"}
      </div>
    </AbsoluteFill>
  );
}
