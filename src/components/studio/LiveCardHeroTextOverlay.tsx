"use client";

import { CalendarDays, Clock3, MapPin, type LucideIcon } from "lucide-react";

type LiveCardOverlayDetails = {
  category?: string;
  occasion?: string;
  eventDate?: string;
  startTime?: string;
  venueName?: string;
  location?: string;
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
  return [readString(details?.category), readString(details?.occasion)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function shouldUseFormalPanelLayout(details?: LiveCardOverlayDetails | null) {
  const blob = getOverlayCategoryBlob(details);
  return /\bwedding|anniversary|bridal\b/.test(blob);
}

function shouldUsePosterHeadlineUppercase(details?: LiveCardOverlayDetails | null) {
  const blob = getOverlayCategoryBlob(details);
  return /\bcustom invite|game day|field trip|field day|school|housewarming|community|team\b/.test(
    blob,
  );
}

function formatDateChipValue(value: string): string {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTimeChipValue(value: string): string {
  const raw = readString(value).replace(/\s+/g, " ");
  if (!raw) return "";
  const twelveHour = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (twelveHour) {
    const hour = Number.parseInt(twelveHour[1] || "", 10);
    const minutes = twelveHour[2] || "00";
    if (Number.isFinite(hour)) return `${hour}:${minutes} ${(twelveHour[3] || "").toUpperCase()}`;
  }
  const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hour = Number.parseInt(twentyFourHour[1] || "", 10);
    const minutes = Number.parseInt(twentyFourHour[2] || "", 10);
    if (hour >= 0 && hour <= 23 && minutes >= 0 && minutes <= 59) {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2000, 0, 1, hour, minutes)));
    }
  }
  return raw;
}

function splitScheduleLine(line: string): { date: string; time: string } {
  const cleaned = readString(line);
  if (!cleaned) return { date: "", time: "" };
  const timeMatch = cleaned.match(
    /\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*[AaPp][Mm]\b|\b(?:[01]?\d|2[0-3]):[0-5]\d\b/,
  );
  const time = formatTimeChipValue(timeMatch?.[0] || "");
  const date = timeMatch
    ? cleaned
        .replace(timeMatch[0], "")
        .replace(/\s+\bat\b\s*$/i, "")
        .replace(/\s*[,•|-]\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim()
    : cleaned;
  return { date, time };
}

type DetailChip = {
  key: "date" | "time" | "place";
  label: string;
};

function buildDetailChips(
  details: LiveCardOverlayDetails | null | undefined,
  scheduleLine: string,
  locationLine: string,
): DetailChip[] {
  const schedule = splitScheduleLine(scheduleLine);
  const date = details?.eventDate
    ? formatDateChipValue(readString(details.eventDate))
    : schedule.date;
  const time = details?.startTime
    ? formatTimeChipValue(readString(details.startTime))
    : schedule.time;
  const place =
    readString(details?.venueName) || readString(locationLine) || readString(details?.location);

  return [
    date ? { key: "date" as const, label: date } : null,
    time ? { key: "time" as const, label: time } : null,
    place ? { key: "place" as const, label: place } : null,
  ].filter((chip): chip is DetailChip => Boolean(chip));
}

function EventDetailChips({ chips }: { chips: DetailChip[] }) {
  if (chips.length === 0) return null;

  const chipConfig = {
    date: {
      icon: CalendarDays,
      className: "text-[#7c3aed]",
      ariaLabel: "Date",
    },
    time: {
      icon: Clock3,
      className: "text-[#0f9f8a]",
      ariaLabel: "Time",
    },
    place: {
      icon: MapPin,
      className: "text-[#d99a00]",
      ariaLabel: "Location",
    },
  } satisfies Record<DetailChip["key"], { icon: LucideIcon; className: string; ariaLabel: string }>;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {chips.map((chip) => {
        const config = chipConfig[chip.key];
        const Icon = config.icon;
        return (
          <span
            key={`${chip.key}-${chip.label}`}
            className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-white/75 bg-white/94 px-3.5 py-1.5 text-[0.72rem] font-semibold leading-none text-[#5f6876] shadow-[0_7px_18px_rgba(31,41,55,0.12)] backdrop-blur-md"
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${config.className}`}
              aria-label={config.ariaLabel}
            />
            <span className="truncate">{chip.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function LiveCardHeroTextOverlay({ invitationData }: LiveCardHeroTextOverlayProps) {
  if (invitationData?.heroTextMode !== "overlay") {
    return null;
  }

  const eyebrow = buildEyebrow(invitationData.eventDetails);
  const headline = readString(invitationData.title);
  const subheadline = readString(invitationData.subtitle);
  const description = readString(invitationData.description);
  const detailLines = [
    readString(invitationData.scheduleLine),
    readString(invitationData.locationLine),
  ].filter(Boolean);
  const detailChips = buildDetailChips(
    invitationData.eventDetails,
    readString(invitationData.scheduleLine),
    readString(invitationData.locationLine),
  );
  const formalPanelLayout = shouldUseFormalPanelLayout(invitationData.eventDetails);
  const uppercasePosterHeadline = shouldUsePosterHeadlineUppercase(invitationData.eventDetails);
  const displayHeadline = uppercasePosterHeadline && headline ? headline.toUpperCase() : headline;
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
        <EventDetailChips chips={detailChips} />
      </div>

      {description && !topSupportLine ? (
        <div className="absolute inset-x-5 bottom-[5.25rem] max-md:inset-x-4 max-md:bottom-[4.9rem]">
          <p className="mx-auto mt-3 max-w-[15rem] text-[0.8rem] font-semibold uppercase leading-[1.28] tracking-[0.08em] text-white/84 [text-shadow:0_2px_16px_rgba(0,0,0,0.34)]">
            {description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
