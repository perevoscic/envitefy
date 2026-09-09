import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Caption, clamp, Footage, Label, Phone, Title, URL } from "./Shared";
export function JohnUpdates() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Footage name="vertical-update.mp4" />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(#1a123c75,transparent 35%,transparent 70%,#1a123c70)",
        }}
      />
      {f >= 88 ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(150deg,#f4f1ff,#e2eaff)",
            opacity: interpolate(f, [88, 95], [0, 1], clamp),
          }}
        />
      ) : null}
      <Title size={74} dark={f >= 95}>
        Same link.
        <br />
        Updated details.
      </Title>
      {f < 90 ? (
        <>
          <Caption top={1360}>
            Small change—we’re
            <br />
            starting at three!
          </Caption>
          <div
            style={{
              position: "absolute",
              left: 75,
              top: 1140,
              width: 360,
              padding: "16px 20px",
              background: "#fffdf2",
              color: "#41365a",
              borderRadius: 12,
              boxShadow:
                "9px 9px 0 #dfd4eb, 18px 18px 0 #c6b5dc, 0 16px 25px #28124444",
              rotate: "-5deg",
              fontSize: 36,
              lineHeight: 1.05,
              fontWeight: 750,
              opacity: interpolate(f, [72, 87], [1, 0], clamp),
              scale: interpolate(f, [75, 88], [1, 0], clamp),
            }}
          >
            Resend texts
            <br />
            and emails
          </div>
        </>
      ) : null}
      {f >= 88 ? (
        <>
          <div
            style={{
              position: "absolute",
              top: 380,
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: 76,
              fontWeight: 800,
              color: "#48316c",
            }}
          >
            <span style={{ color: "#9f94b2", textDecoration: "line-through" }}>
              2:00 PM
            </span>
            <span style={{ padding: "0 26px", color: "#6b3cff" }}>→</span>
            <span style={{ color: "#6b3cff" }}>3:00 PM</span>
          </div>
          <Sequence from={88} durationInFrames={44}>
            <Phone
              name="vertical-demo-edit.mp4"
              top={620}
              left={95}
              width={890}
              height={800}
              cropY={410}
            />
            <Label top={1490} dark>
              Change the party time in chat.
            </Label>
          </Sequence>
          <Sequence from={132}>
            <Phone
              name="vertical-demo-updated.mp4"
              top={570}
              left={110}
              width={860}
              height={905}
              cropY={225}
            />
            <Label top={1520} dark>
              Guests reopen the same link.
            </Label>
          </Sequence>
        </>
      ) : null}
      <URL />
    </AbsoluteFill>
  );
}
