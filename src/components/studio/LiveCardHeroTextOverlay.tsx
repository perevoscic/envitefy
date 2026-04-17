"use client";

type LiveCardOverlayDetails = {
  category?: string;
  occasion?: string;
};

type LiveCardOverlayData = {
  title?: string;
  subtitle?: string;
  description?: string;
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

function getOverlayCategoryBlob(details?: LiveCardOverlayDetails | null) {
  return [readString(details?.category), readString(details?.occasion)].filter(Boolean).join(" ").toLowerCase();
}

function shouldUseFormalPanelLayout(details?: LiveCardOverlayDetails | null) {
  const blob = getOverlayCategoryBlob(details);
  return /\bwedding|anniversary|bridal\b/.test(blob);
}

function shouldUsePosterHeadlineUppercase(details?: LiveCardOverlayDetails | null) {
  const blob = getOverlayCategoryBlob(details);
  return /\bcustom invite|game day|field trip|field day|school|housewarming|community|team\b/.test(blob);
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
  const description = readString(invitationData.description);
  const detailLines = [readString(invitationData.scheduleLine), readString(invitationData.locationLine)].filter(Boolean);
  const formalPanelLayout = shouldUseFormalPanelLayout(invitationData.eventDetails);
  const uppercasePosterHeadline = shouldUsePosterHeadlineUppercase(invitationData.eventDetails);
  const displayHeadline =
    uppercasePosterHeadline && headline ? headline.toUpperCase() : headline;
  const topSupportLine = subheadline || description;
  const supportingLine = subheadline && description ? description : "";

  if (!eyebrow && !headline && !subheadline && !description && detailLines.length === 0) {
    return null;
  }

  if (formalPanelLayout) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-4 pb-[5.4rem] pt-6 text-center max-md:px-3 max-md:pb-[5rem] max-md:pt-5">
        <div className="mx-auto w-full max-w-[17.5rem] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,30,0.5),rgba(14,18,30,0.3),rgba(14,18,30,0.18))] px-5 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-[14px]">
          {eyebrow ? (
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-white/72">
              {eyebrow}
            </p>
          ) : null}
          {displayHeadline ? (
            <h2 className="mt-3 font-[var(--font-playfair)] text-[2.08rem] font-semibold leading-[0.93] tracking-[-0.05em] text-white [text-shadow:0_3px_20px_rgba(0,0,0,0.36)] max-md:text-[1.9rem]">
              {displayHeadline}
            </h2>
          ) : null}
          {topSupportLine ? (
            <p className="mt-3 text-[1rem] font-medium leading-[1.2] text-white/88 [text-shadow:0_2px_16px_rgba(0,0,0,0.28)] max-md:text-[0.94rem]">
              {topSupportLine}
            </p>
          ) : null}
          {supportingLine ? (
            <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/70">
              {supportingLine}
            </p>
          ) : null}
        </div>

        {detailLines.length > 0 || description ? (
          <div className="mx-auto w-full max-w-[16rem] space-y-1.5 text-center text-white">
            {detailLines.map((line) => (
              <p
                key={line}
                className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white/84 [text-shadow:0_2px_14px_rgba(0,0,0,0.34)]"
              >
                {line}
              </p>
            ))}
            {description && !topSupportLine ? (
              <p className="pt-1 text-[0.76rem] font-medium leading-[1.45] text-white/82 [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 text-center text-white">
      <div className="absolute inset-x-0 top-0 h-[52%] bg-[linear-gradient(180deg,rgba(6,8,13,0.56),rgba(6,8,13,0.2)_40%,rgba(6,8,13,0))]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(0deg,rgba(6,8,13,0.62),rgba(6,8,13,0.24)_42%,rgba(6,8,13,0))]" />

      <div className="absolute inset-x-5 top-7 max-md:inset-x-4 max-md:top-6">
        {eyebrow ? (
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-white/70">
            {eyebrow}
          </p>
        ) : null}
        {displayHeadline ? (
          <h2 className="mt-3 font-[var(--font-josefin-sans)] text-[2.65rem] font-bold leading-[0.88] tracking-[0.04em] text-[#f3dcc2] [text-shadow:0_4px_22px_rgba(0,0,0,0.42)] max-md:text-[2.22rem]">
            {displayHeadline}
          </h2>
        ) : null}
        {topSupportLine ? (
          <p className="mt-3 font-[var(--font-josefin-sans)] text-[1.14rem] font-semibold uppercase leading-[1.08] tracking-[0.12em] text-[#e9bf7f] [text-shadow:0_2px_16px_rgba(0,0,0,0.36)] max-md:text-[0.98rem]">
            {topSupportLine}
          </p>
        ) : null}
        {supportingLine ? (
          <p className="mx-auto mt-3 max-w-[14rem] text-[0.8rem] font-semibold uppercase leading-[1.3] tracking-[0.09em] text-white/88 [text-shadow:0_2px_14px_rgba(0,0,0,0.34)]">
            {supportingLine}
          </p>
        ) : null}
      </div>

      {detailLines.length > 0 || description ? (
        <div className="absolute inset-x-5 bottom-[5.25rem] max-md:inset-x-4 max-md:bottom-[4.9rem]">
          {detailLines.length > 0 ? (
            <div className="space-y-1.5">
              {detailLines.map((line) => (
                <p
                  key={line}
                  className="font-[var(--font-josefin-sans)] text-[1rem] font-bold uppercase leading-[1.08] tracking-[0.08em] text-[#f3dcc2] [text-shadow:0_3px_18px_rgba(0,0,0,0.42)] max-md:text-[0.9rem]"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          {description && !topSupportLine ? (
            <p className="mx-auto mt-3 max-w-[15rem] text-[0.8rem] font-semibold uppercase leading-[1.28] tracking-[0.08em] text-white/84 [text-shadow:0_2px_16px_rgba(0,0,0,0.34)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
