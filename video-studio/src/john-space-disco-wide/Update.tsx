import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { clamp, Film, ProductCrop, Sweep, Url } from "./Shared";
export function WideUpdate() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film
        name="wide-update-long.mp4"
        style={{
          position: "absolute",
          left: interpolate(f, [0, 75], [-180, -450], clamp),
          width: 1920,
          height: 1080,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg,#0b082b20,transparent 45%,#f6f2ff 51%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1008,
          top: 74,
          fontSize: 63,
          fontWeight: 800,
          lineHeight: 1.07,
          color: "#2b1845",
        }}
      >
        Same link.
        <br />
        Updated details.
      </div>
      <Url top={242} />
      <div
        style={{
          position: "absolute",
          left: 1008,
          top: 363,
          width: 810,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 27,
          fontSize: 60,
          fontWeight: 800,
        }}
      >
        <span
          style={{
            color: "#a497b6",
            textDecoration: f > 80 ? "line-through" : "none",
          }}
        >
          2:00 PM
        </span>
        <span style={{ color: "#7654ce" }}>→</span>
        <span
          style={{
            color: f > 80 ? "#6938f0" : "#ad9fbd",
            scale: interpolate(f, [78, 88, 97], [0.94, 1.09, 1], clamp),
          }}
        >
          3:00 PM
        </span>
      </div>
      <Sequence durationInFrames={82}>
        <div
          style={{
            position: "absolute",
            left: 1017,
            top: 496,
            width: 793,
            fontSize: 35,
            color: "#5a4774",
            fontWeight: 700,
            lineHeight: 1.35,
            textAlign: "center",
          }}
        >
          A small change to the party plan.
        </div>
        <ProductCrop
          name="wide-ui-edit-slow.mp4"
          left={1007}
          top={606}
          width={810}
          height={287}
          cropY={646}
          sourceWidth={430}
        />
      </Sequence>
      <Sequence from={82} durationInFrames={128}>
        <div
          style={{
            position: "absolute",
            left: 1010,
            top: 477,
            width: 290,
            height: 399,
            overflow: "hidden",
            borderRadius: 28,
            boxShadow: "0 18px 50px #2e15522b",
          }}
        >
          <Film
            name="wide-guest-update.mp4"
            style={{
              position: "absolute",
              width: 711,
              height: 400,
              left: 0,
              objectFit: "fill",
            }}
          />
        </div>
        <ProductCrop
          name="wide-ui-updated.mp4"
          left={1324}
          top={477}
          width={490}
          height={440}
          cropX={52}
          cropY={215}
          sourceWidth={325}
        />
        <div
          style={{
            position: "absolute",
            left: 1020,
            top: 940,
            fontSize: 31,
            fontWeight: 700,
            color: "#4f386c",
          }}
        >
          Guests reopen the same invitation link.
        </div>
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 85,
          top: 742,
          width: 510,
          padding: "22px 27px",
          borderRadius: 18,
          rotate: "-4deg",
          background: "#fffbed",
          color: "#4d3b60",
          boxShadow:
            "8px 9px 0 #dcd3e9,16px 18px 0 #b8a9cd,0 16px 40px #1d102e40",
          fontSize: 31,
          lineHeight: 1.16,
          fontWeight: 700,
          opacity: interpolate(f, [131, 139], [1, 0], clamp),
          scale: interpolate(f, [130, 136, 140], [1, 1.08, 0], clamp),
        }}
      >
        Resend texts and emails
      </div>
      {f < 73 ? (
        <div
          style={{
            position: "absolute",
            left: 87,
            top: 897,
            width: 806,
            padding: "20px",
            borderRadius: 22,
            background: "#261533",
            color: "white",
            fontWeight: 700,
            fontSize: 33,
            textAlign: "center",
          }}
        >
          “Small change—we’re starting at three!”
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: 95,
            top: 929,
            color: "white",
            fontWeight: 700,
            fontSize: 34,
            textShadow: "0 2px 12px #251137",
          }}
        >
          Change the plans. No resending needed.
        </div>
      )}
      <Sweep />
    </AbsoluteFill>
  );
}
