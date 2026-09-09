import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import {
  Caption,
  clamp,
  Film,
  Heading,
  Paper,
  ProductCrop,
  Url,
} from "./Shared";
export function SquareUpdate() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Film name="vertical-update.mp4" style={{ objectPosition: "50% 0%" }} />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#190b3488,transparent 33%,transparent 78%,#190b3455)",
        }}
      />
      {f >= 88 ? <Paper /> : null}
      <Heading dark={f >= 88}>
        Same link.
        <br />
        Updated details.
      </Heading>
      <Url />
      {f < 88 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 355,
              width: 350,
              padding: "12px 20px",
              borderRadius: 15,
              background: "#fffbed",
              boxShadow:
                "8px 9px 0 #dcd3e9,16px 18px 0 #b8a9cd,0 18px 40px #20102a44",
              rotate: "-4deg",
              fontSize: 27,
              lineHeight: 1.13,
              fontWeight: 700,
              color: "#4c355d",
              opacity: interpolate(f, [72, 87], [1, 0], clamp),
              scale: interpolate(f, [75, 88], [1, 0], clamp),
            }}
          >
            Resend texts
            <br />
            and emails
          </div>
          <Caption top={931}>“Small change—we’re starting at three!”</Caption>
        </>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              top: 374,
              left: 80,
              right: 80,
              textAlign: "center",
              fontSize: 66,
              fontWeight: 800,
              color: "#6b3cff",
            }}
          >
            <span style={{ textDecoration: "line-through", color: "#a295b2" }}>
              2:00 PM
            </span>
            <span style={{ padding: "0 30px" }}>→</span>3:00 PM
          </div>
          <Sequence from={88} durationInFrames={44}>
            <ProductCrop
              name="square-ui-edit.mp4"
              left={90}
              top={530}
              width={900}
              height={320}
              cropY={646}
            />
            <div
              style={{
                position: "absolute",
                left: 80,
                right: 80,
                top: 934,
                textAlign: "center",
                fontSize: 37,
                fontWeight: 700,
                color: "#543970",
              }}
            >
              Change the party time in chat.
            </div>
          </Sequence>
          <Sequence from={132} durationInFrames={78}>
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 507,
                width: 290,
                height: 410,
                overflow: "hidden",
                borderRadius: 28,
                boxShadow: "0 18px 40px #3f245c25",
              }}
            >
              <Film
                name="wide-guest-update.mp4"
                style={{
                  position: "absolute",
                  width: 729,
                  height: 410,
                  left: 0,
                }}
              />
            </div>
            <ProductCrop
              name="wide-ui-updated.mp4"
              left={398}
              top={507}
              width={610}
              height={410}
              cropX={52}
              cropY={315}
              sourceWidth={325}
            />
            <div
              style={{
                position: "absolute",
                left: 70,
                right: 70,
                top: 955,
                textAlign: "center",
                fontSize: 36,
                fontWeight: 700,
                color: "#543970",
              }}
            >
              Guests reopen the same invitation link.
            </div>
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
}
