"use client";

type LiveCardOverlayDetails = {
  category?: string;
  occasion?: string;
};

type LiveCardOverlayData = {
  title?: string;
  subtitle?: string;
  scheduleLine?: string;
  locationLine?: string;
  heroTextMode?: "image" | "overlay";
  eventDetails?: LiveCardOverlayDetails | null;
};

type LiveCardHeroTextOverlayProps = {
  invitationData?: LiveCardOverlayData | null;
};

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildEyebrow(details?: LiveCardOverlayDetails | null) {
  return readString(details?.occasion) || readString(details?.category) || "Invitation";
}

export default function LiveCardHeroTextOverlay({
  invitationData,
}: LiveCardHeroTextOverlayProps) {
  if (invitationData?.heroTextMode !== "overlay") {
    return null;
  }

  const eyebrow = buildEyebrow(invitationData.eventDetails);
  const headline = readString(invitationData.title);
  const subheadline = readString(invitationData.subtitle);
  const detailLines = [readString(invitationData.scheduleLine), readString(invitationData.locationLine)].filter(Boolean);

  if (!eyebrow && !headline && !subheadline && detailLines.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[58%] justify-center px-4 pt-8 text-center max-md:px-3 max-md:pt-6 md:px-8 md:pt-10">
      <div className="w-full max-w-[18rem] space-y-3 rounded-[2rem] bg-[linear-gradient(180deg,rgba(15,23,42,0.46),rgba(15,23,42,0.18),rgba(15,23,42,0))] px-5 py-5 text-white shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
        {eyebrow ? (
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/82">
            {eyebrow}
          </p>
        ) : null}
        {headline ? (
          <h2 className="font-[var(--font-playfair)] text-[1.9rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.38)] max-md:text-[1.72rem]">
            {headline}
          </h2>
        ) : null}
        {subheadline ? (
          <p className="mx-auto max-w-[15rem] text-sm font-medium leading-5 text-white/88 [text-shadow:0_2px_16px_rgba(0,0,0,0.34)]">
            {subheadline}
          </p>
        ) : null}
        {detailLines.length > 0 ? (
          <div className="space-y-1 pt-1">
            {detailLines.map((line) => (
              <p
                key={line}
                className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/82 [text-shadow:0_2px_14px_rgba(0,0,0,0.34)]"
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
