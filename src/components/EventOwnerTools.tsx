"use client";

import { CheckCircle2, Copy, ExternalLink, Pencil, Share2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type EventContextTab, useSidebar } from "@/app/sidebar-context";
import EventResponseDashboard from "@/components/EventResponseDashboard";
import { SharedStudioCardFrame } from "@/components/studio/SharedStudioCardPage";
import { hasActionableRsvp } from "@/lib/dashboard-data";
import { resolveEditHref } from "@/utils/event-edit-route";

type EventOwnerToolsProps = {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  eventHref: string;
  eventOwnerHref?: string;
  initialTab: EventContextTab;
  numberOfGuests: number;
};

type ProductPreviewModel = {
  imageUrl: string | null;
  invitationData: Record<string, unknown> | null;
  positions: Record<string, unknown> | null;
  dateLine: string;
  locationLine: string;
  categoryLine: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return "";
}

const CARD_FIRST_OUTPUTS = new Set([
  "live_card",
  "digital_flyer",
  "printable_flyer",
  "invitation",
  "instagram_story",
  "thank_you_card",
  "menu",
  "welcome_sign",
]);

const PREVIEW_IMAGE_BY_CATEGORY: Record<string, string> = {
  birthday: "/studio/birthday.webp",
  birthdays: "/studio/birthday.webp",
  wedding: "/studio/wedding.webp",
  weddings: "/studio/wedding.webp",
  "baby shower": "/studio/baby-shower.webp",
  baby_shower: "/studio/baby-shower.webp",
  "baby showers": "/studio/baby-shower.webp",
  "gender reveal": "/studio/baby-shower.webp",
  gender_reveal: "/studio/baby-shower.webp",
  "bridal shower": "/studio/bridal-shower.webp",
  bridal_shower: "/studio/bridal-shower.webp",
  "game day": "/studio/game-day.webp",
  game_day: "/studio/game-day.webp",
  football: "/studio/game-day.webp",
  sport_event: "/studio/game-day.webp",
  "field trip/day": "/studio/field-trip-day.webp",
  field_trip: "/studio/field-trip-day.webp",
  "open house": "/studio/open-house.webp",
  open_house: "/studio/open-house.webp",
  housewarming: "/studio/housewarming.webp",
  anniversary: "/studio/anniversary.webp",
};

function normalizeProductOutput(value: unknown): string {
  return readString(value)
    .toLowerCase()
    .replace(/\//g, "_")
    .replace(/[\s-]+/g, "_");
}

function readOutputValues(data: Record<string, unknown> | null): string[] {
  if (!data) return [];
  return [
    ...(Array.isArray(data.requestedOutputs) ? data.requestedOutputs : []),
    ...(Array.isArray(data.outputs) ? data.outputs : []),
  ]
    .map(normalizeProductOutput)
    .filter(Boolean);
}

function isCardFirstProduct(data: Record<string, unknown> | null): boolean {
  if (!data) return false;
  const publicEvent = asRecord(data.publicEvent);
  const primaryOutput = normalizeProductOutput(
    firstString(
      publicEvent?.primaryOutput,
      publicEvent?.renderer,
      data.primaryOutput,
      data.productType,
      data.publicRenderer,
    ),
  );
  const outputs = readOutputValues(data);
  return (
    CARD_FIRST_OUTPUTS.has(primaryOutput) ||
    outputs.some((output) => CARD_FIRST_OUTPUTS.has(output))
  );
}

function resolveProductPreviewImageUrl(
  data: Record<string, unknown> | null,
  studioCard: Record<string, unknown> | null,
): string | null {
  const explicit =
    firstString(
      data?.coverImageUrl,
      studioCard?.imageUrl,
      data?.customHeroImage,
      data?.heroImage,
      data?.thumbnail,
    ) || null;
  if (explicit) return explicit;
  if (!isCardFirstProduct(data)) return null;

  const category = firstString(data?.eventType, data?.category).toLowerCase();
  return PREVIEW_IMAGE_BY_CATEGORY[category] || "/studio/custom-invite.webp";
}

function buildFallbackInvitationData(
  data: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!data) return null;
  const liveCard = asRecord(data.liveCard);
  const publicEvent = asRecord(data.publicEvent);
  const previewCopy = asRecord(data.previewCopy);
  const title = firstString(
    liveCard?.headline,
    publicEvent?.headline,
    data.headlineTitle,
    data.title,
  );
  const subtitle = firstString(
    liveCard?.subheadline,
    publicEvent?.subheadline,
    previewCopy?.subheadline,
  );
  const description = firstString(
    liveCard?.body,
    publicEvent?.body,
    previewCopy?.body,
    data.description,
  );
  const scheduleLine = firstString(
    liveCard?.scheduleLine,
    publicEvent?.scheduleLine,
    data.scheduleLine,
    data.whenLabel,
  );
  const locationLine = firstString(
    liveCard?.locationLine,
    publicEvent?.locationLine,
    data.locationLabel,
    data.placeName,
    data.venue,
    data.location,
  );
  const rsvp = asRecord(data.rsvp);
  return {
    title: title || "Invitation",
    subtitle,
    description,
    scheduleLine,
    locationLine,
    heroTextMode: firstString(data.heroTextMode) || (isCardFirstProduct(data) ? "image" : ""),
    theme: {
      themeStyle: firstString(data.themeStyle),
    },
    interactiveMetadata: {
      ctaLabel: firstString(rsvp?.cta, liveCard?.cta) || "RSVP",
      shareNote: description,
    },
    eventDetails: {
      category: firstString(data.category),
      eventTitle: title,
      eventDate: firstString(data.startISO, data.startAt, data.start).slice(0, 10),
      venueName: firstString(data.venue),
      location: locationLine,
      detailsDescription: description,
      rsvpEnabled: data.rsvpEnabled === true || rsvp?.isEnabled === true || rsvp?.enabled === true,
      rsvpMode: firstString(rsvp?.mode) || "envitefy",
      rsvpName: firstString(data.rsvpName, rsvp?.name),
      rsvpContact: firstString(data.rsvpContact, rsvp?.contact),
      rsvpDeadline: firstString(data.rsvpDeadline, rsvp?.deadline),
      registryLink:
        Array.isArray(data.registries) && asRecord(data.registries[0])
          ? firstString(asRecord(data.registries[0])?.url)
          : firstString(data.registryLink),
    },
  };
}

function formatDateLine(data: Record<string, unknown> | null): string {
  const raw = firstString(data?.startAt, data?.startISO, data?.start, data?.dateText, data?.date);
  if (!raw) return "Date pending";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function buildProductPreviewModel(eventData: Record<string, unknown> | null): ProductPreviewModel {
  const studioCard = asRecord(eventData?.studioCard);
  const publicEvent = asRecord(eventData?.publicEvent);
  const eventDetails = asRecord(studioCard?.eventDetails);
  const invitationData =
    asRecord(studioCard?.invitationData) || buildFallbackInvitationData(eventData);
  const positions = asRecord(studioCard?.positions);
  const imageUrl = resolveProductPreviewImageUrl(eventData, studioCard);

  return {
    imageUrl,
    invitationData,
    positions,
    dateLine:
      firstString(eventDetails?.eventDate, publicEvent?.dateLine) || formatDateLine(eventData),
    locationLine: firstString(
      eventDetails?.locationName,
      publicEvent?.locationLine,
      eventData?.venue,
      eventData?.location,
    ),
    categoryLine: firstString(
      eventData?.category,
      eventData?.eventType,
      publicEvent?.primaryOutput,
    ),
  };
}

function absoluteBrowserUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function buildOwnerTabHref(baseHref: string, eventId: string, tab: EventContextTab): string {
  const fallbackPath = `/event/${encodeURIComponent(eventId)}`;
  try {
    const parsed = new URL(baseHref || fallbackPath, "https://envitefy.local");
    parsed.searchParams.set("tab", tab);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return `${fallbackPath}?tab=${encodeURIComponent(tab)}`;
  }
}

function buildOwnerPreviewHref(publicUrl: string, returnHref: string): string {
  try {
    const parsed = new URL(publicUrl || "/", "https://envitefy.local");
    parsed.searchParams.set("preview", "owner");
    parsed.searchParams.set("returnTo", returnHref);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return publicUrl || "/";
  }
}

export default function EventOwnerTools({
  eventId,
  eventTitle,
  eventData,
  eventHref,
  eventOwnerHref,
  numberOfGuests,
}: EventOwnerToolsProps) {
  const {
    setSelectedEventId,
    setSelectedEventTitle,
    setSelectedEventHref,
    setSelectedEventOwnerHref,
    setSelectedEventEditHref,
    setActiveEventTab,
  } = useSidebar();
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const resolvedEditHref = useMemo(
    () => resolveEditHref(eventId, eventData, eventTitle),
    [eventData, eventId, eventTitle],
  );
  const ownerHref = eventOwnerHref || `/event/${encodeURIComponent(eventId)}`;
  const preview = useMemo(() => buildProductPreviewModel(eventData), [eventData]);
  const rsvpEnabled = hasActionableRsvp(eventData, numberOfGuests);
  const publicUrl = eventHref || ownerHref;
  const activeOwnerTab: EventContextTab = "dashboard";
  const dashboardHref = buildOwnerTabHref(ownerHref, eventId, "dashboard");
  const previewHref = buildOwnerPreviewHref(publicUrl, dashboardHref);

  useEffect(() => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle || "Untitled event");
    setSelectedEventHref(publicUrl);
    setSelectedEventOwnerHref(ownerHref);
    setSelectedEventEditHref(resolvedEditHref);
    setActiveEventTab(activeOwnerTab);
  }, [
    activeOwnerTab,
    eventId,
    eventTitle,
    ownerHref,
    publicUrl,
    resolvedEditHref,
    setActiveEventTab,
    setSelectedEventEditHref,
    setSelectedEventHref,
    setSelectedEventId,
    setSelectedEventOwnerHref,
    setSelectedEventTitle,
  ]);

  async function copyPublicLink() {
    const url = absoluteBrowserUrl(publicUrl);
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1600);
    } catch {
      window.prompt("Copy your event link:", url);
    }
  }

  async function sharePublicLink() {
    const url = absoluteBrowserUrl(publicUrl);
    const data = {
      title: eventTitle || "Event",
      text: `You're invited to ${eventTitle || "this event"}.`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await copyPublicLink();
    } catch {}
  }

  return (
    <main className="min-h-[100dvh] w-full px-3 pb-5 pt-[calc(var(--app-mobile-topbar-offset,4rem)+0.65rem)] text-slate-950 sm:px-6 lg:px-8 lg:py-5">
      <div className="mx-auto grid w-full max-w-[1380px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,410px)] xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 space-y-3 sm:space-y-4">
          <OwnerWorkspaceHeader
            title={eventTitle}
            dateLine={preview.dateLine}
            locationLine={preview.locationLine}
            previewHref={previewHref}
            editHref={resolvedEditHref}
            onCopy={copyPublicLink}
            onShare={sharePublicLink}
            shareState={shareState}
          />
          <OwnerTabContent
            eventId={eventId}
            eventTitle={eventTitle}
            eventData={eventData}
            numberOfGuests={numberOfGuests}
            rsvpEnabled={rsvpEnabled}
            editHref={resolvedEditHref}
          />
        </section>

        <aside className="hidden min-w-0 lg:sticky lg:top-5 lg:block lg:self-start">
          <EventProductPreview eventTitle={eventTitle} preview={preview} publicUrl={publicUrl} />
        </aside>
      </div>
    </main>
  );
}

function EventProductPreview({
  eventTitle,
  preview,
  publicUrl,
}: {
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
}) {
  return (
    <section
      className="h-[min(680px,calc(100dvh-5rem))] min-h-[480px] overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 shadow-[0_24px_70px_rgba(79,70,128,0.16)] backdrop-blur-xl lg:h-[min(760px,calc(100dvh-2.5rem))] lg:max-h-[760px]"
      aria-label="Product preview"
    >
      <div className="flex h-full w-full items-center justify-center">
        {preview.imageUrl ? (
          <SharedStudioCardFrame
            title={eventTitle}
            imageUrl={preview.imageUrl}
            invitationData={preview.invitationData as any}
            positions={preview.positions as any}
            shareUrl={publicUrl}
            className="flex h-full w-full items-center justify-center"
            frameClassName="!h-full !w-auto !max-w-full !rounded-[28px] !border-0 shadow-none"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="flex h-full w-auto max-w-full flex-col justify-between rounded-[28px] border border-slate-200 bg-gradient-to-b from-white via-violet-50 to-slate-100 p-5 text-slate-950 shadow-2xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                Event page
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{eventTitle}</h2>
            </div>
            <div className="space-y-3 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Live details
              </p>
              <p className="text-sm font-semibold text-slate-700">
                {preview.dateLine || "Date pending"}
              </p>
              {preview.locationLine ? (
                <p className="text-sm text-slate-500">{preview.locationLine}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function OwnerWorkspaceHeader({
  title,
  dateLine,
  locationLine,
  previewHref,
  editHref,
  onCopy,
  onShare,
  shareState,
}: {
  title: string;
  dateLine: string;
  locationLine: string;
  previewHref: string;
  editHref: string;
  onCopy: () => void;
  onShare: () => void;
  shareState: "idle" | "copied";
}) {
  return (
    <header className="rounded-[24px] border border-white/75 bg-white/92 p-4 shadow-[0_16px_46px_rgba(79,70,128,0.10)] backdrop-blur-xl sm:p-5 lg:rounded-[28px]">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#786bd6]">
            Owner workspace
          </p>
          <h2 className="mt-1 line-clamp-2 text-[1.65rem] font-semibold leading-tight text-slate-950 sm:text-3xl">
            {title || "Untitled event"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex min-h-8 items-center rounded-full border border-slate-200/80 bg-white/74 px-3">
              {dateLine || "Date pending"}
            </span>
            {locationLine ? (
              <span className="inline-flex min-h-8 max-w-full items-center rounded-full border border-slate-200/80 bg-white/74 px-3">
                <span className="truncate">{locationLine}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 sm:flex sm:shrink-0 sm:items-center">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 sm:order-3 sm:min-h-11"
          >
            <Share2 size={15} />
            Share event
          </button>
          <div className="grid grid-cols-3 gap-2 sm:contents">
            <Link
              href={previewHref}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ExternalLink size={14} />
              Preview
            </Link>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              {shareState === "copied" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {shareState === "copied" ? "Copied" : "Copy"}
            </button>
            <Link
              href={editHref}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-100"
            >
              <Pencil size={14} />
              Edit
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function OwnerTabContent({
  eventId,
  eventTitle,
  eventData,
  numberOfGuests,
  rsvpEnabled,
  editHref,
}: {
  eventId: string;
  eventTitle: string;
  eventData: Record<string, unknown> | null;
  numberOfGuests: number;
  rsvpEnabled: boolean;
  editHref: string;
}) {
  return rsvpEnabled ? (
    <EventResponseDashboard
      eventId={eventId}
      eventTitle={eventTitle}
      eventData={eventData}
      numberOfGuests={numberOfGuests}
      rsvpEnabled={rsvpEnabled}
      editHref={editHref}
    />
  ) : (
    <RsvpDisabledPanel eventTitle={eventTitle} editHref={editHref} />
  );
}

function RsvpDisabledPanel({ eventTitle, editHref }: { eventTitle: string; editHref: string }) {
  return (
    <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-6 text-center shadow-[0_20px_58px_rgba(79,70,128,0.10)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
        <Users size={22} />
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">RSVP is not enabled</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {eventTitle || "This event"} can still be previewed and shared. Add RSVP details in the
        editor when you want Envitefy to collect responses.
      </p>
      <Link
        href={editHref}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
      >
        <Pencil size={15} />
        Add RSVP
      </Link>
    </section>
  );
}
