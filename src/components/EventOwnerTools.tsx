"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Share2,
  SlidersHorizontal,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type EventContextTab, useSidebar } from "@/app/sidebar-context";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
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
  const invitationData = asRecord(studioCard?.invitationData);
  const positions = asRecord(studioCard?.positions);
  const imageUrl =
    firstString(
      eventData?.coverImageUrl,
      studioCard?.imageUrl,
      eventData?.customHeroImage,
      eventData?.heroImage,
      eventData?.thumbnail,
    ) || null;

  return {
    imageUrl,
    invitationData,
    positions,
    dateLine: firstString(eventDetails?.eventDate, publicEvent?.dateLine) || formatDateLine(eventData),
    locationLine: firstString(
      eventDetails?.locationName,
      publicEvent?.locationLine,
      eventData?.venue,
      eventData?.location,
    ),
    categoryLine: firstString(eventData?.category, eventData?.eventType, publicEvent?.primaryOutput),
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

export default function EventOwnerTools({
  eventId,
  eventTitle,
  eventData,
  eventHref,
  eventOwnerHref,
  initialTab,
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

  useEffect(() => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle || "Untitled event");
    setSelectedEventHref(publicUrl);
    setSelectedEventOwnerHref(ownerHref);
    setSelectedEventEditHref(resolvedEditHref);
    setActiveEventTab(initialTab);
  }, [
    eventId,
    eventTitle,
    initialTab,
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
    <main className="min-h-[100dvh] w-full px-4 pb-5 pt-[calc(var(--app-mobile-topbar-offset,4rem)+1rem)] text-slate-950 sm:px-6 lg:px-8 lg:py-5">
      <div className="mx-auto grid w-full max-w-[1380px] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,410px)] xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 space-y-4">
          <OwnerWorkspaceHeader
            title={eventTitle}
            dateLine={preview.dateLine}
            locationLine={preview.locationLine}
            publicUrl={publicUrl}
            editHref={resolvedEditHref}
            onCopy={copyPublicLink}
            onShare={sharePublicLink}
            shareState={shareState}
          />
          <OwnerWorkspaceTabs activeTab={initialTab} ownerHref={ownerHref} eventId={eventId} />
          <OwnerTabContent
            tab={initialTab}
            eventId={eventId}
            eventTitle={eventTitle}
            numberOfGuests={numberOfGuests}
            rsvpEnabled={rsvpEnabled}
            editHref={resolvedEditHref}
          />
        </section>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <EventProductPreview
            eventTitle={eventTitle}
            preview={preview}
            publicUrl={publicUrl}
            onCopy={copyPublicLink}
            onShare={sharePublicLink}
            shareState={shareState}
          />
        </aside>
      </div>
    </main>
  );
}

function EventProductPreview({
  eventTitle,
  preview,
  publicUrl,
  onCopy,
  onShare,
  shareState,
}: {
  eventTitle: string;
  preview: ProductPreviewModel;
  publicUrl: string;
  onCopy: () => void;
  onShare: () => void;
  shareState: "idle" | "copied";
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(79,70,128,0.16)] backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-4 py-4 sm:px-5">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#786bd6]">
          Live product
        </p>
        <h1 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight text-slate-950">
          {eventTitle || "Untitled event"}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          {preview.dateLine ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
              <CalendarDays size={13} />
              {preview.dateLine}
            </span>
          ) : null}
          {preview.categoryLine ? (
            <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">
              {preview.categoryLine}
            </span>
          ) : null}
        </div>
      </div>

      <div className="bg-slate-950 px-3 py-4">
        {preview.imageUrl ? (
          <SharedStudioCardFrame
            title={eventTitle}
            imageUrl={preview.imageUrl}
            invitationData={preview.invitationData as any}
            positions={preview.positions as any}
            shareUrl={publicUrl}
            className="mx-auto w-full max-w-[280px] sm:max-w-[310px] lg:max-w-[330px]"
            frameClassName="!rounded-[2.35rem] shadow-[0_20px_58px_rgba(168,85,247,0.20)]"
            style={{ width: "100%" }}
          />
        ) : (
          <div className="mx-auto flex aspect-[9/16] w-full max-w-[300px] flex-col justify-end rounded-[2.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.26),_rgba(88,80,236,0.18)_35%,_rgba(15,23,42,1)_100%)] p-5 text-white shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
              Event preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{eventTitle}</h2>
            {preview.locationLine ? <p className="mt-3 text-sm text-white/70">{preview.locationLine}</p> : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        <Link
          href={publicUrl}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          <ExternalLink size={14} />
          View
        </Link>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300"
        >
          {shareState === "copied" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          {shareState === "copied" ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>
    </section>
  );
}

function OwnerWorkspaceHeader({
  title,
  dateLine,
  locationLine,
  publicUrl,
  editHref,
  onCopy,
  onShare,
  shareState,
}: {
  title: string;
  dateLine: string;
  locationLine: string;
  publicUrl: string;
  editHref: string;
  onCopy: () => void;
  onShare: () => void;
  shareState: "idle" | "copied";
}) {
  return (
    <header className="rounded-[28px] border border-white/72 bg-white/90 p-4 shadow-[0_20px_58px_rgba(79,70,128,0.12)] backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#786bd6]">
            Owner workspace
          </p>
          <h2 className="mt-1 truncate text-2xl font-semibold text-slate-950 sm:text-3xl">
            {title || "Untitled event"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-slate-500">
            <span>{dateLine || "Date pending"}</span>
            {locationLine ? <span>{locationLine}</span> : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Link
            href={publicUrl}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            <ExternalLink size={14} />
            Preview
          </Link>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            {shareState === "copied" ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {shareState === "copied" ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-100"
          >
            <Share2 size={14} />
            Share
          </button>
          <Link
            href={editHref}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Pencil size={14} />
            Edit
          </Link>
        </div>
      </div>
    </header>
  );
}

function OwnerWorkspaceTabs({
  activeTab,
  ownerHref,
  eventId,
}: {
  activeTab: EventContextTab;
  ownerHref: string;
  eventId: string;
}) {
  const tabs: Array<{ key: EventContextTab; label: string; icon: LucideIcon }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "guests", label: "RSVPs", icon: Users },
    { key: "communications", label: "Messages", icon: MessageSquare },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      className="flex gap-2 overflow-x-auto rounded-[24px] border border-white/72 bg-white/86 p-2 shadow-[0_16px_44px_rgba(79,70,128,0.10)] backdrop-blur-xl"
      aria-label="Owner workspace sections"
    >
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.key;
        return (
          <Link
            key={item.key}
            href={buildOwnerTabHref(ownerHref, eventId, item.key)}
            className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black uppercase tracking-[0.08em] transition sm:flex-1 ${
              active
                ? "bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)]"
                : "bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={14} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function OwnerTabContent({
  tab,
  eventId,
  eventTitle,
  numberOfGuests,
  rsvpEnabled,
  editHref,
}: {
  tab: EventContextTab;
  eventId: string;
  eventTitle: string;
  numberOfGuests: number;
  rsvpEnabled: boolean;
  editHref: string;
}) {
  if (tab === "communications") {
    return (
      <OwnerUtilityPanel
        icon={MessageSquare}
        title="Communications"
        body="Messaging tools will live here. For now, share the public link or copy guest details from the RSVP board."
      />
    );
  }

  if (tab === "settings") {
    return (
      <OwnerUtilityPanel
        icon={SlidersHorizontal}
        title="Settings"
        body="Core event settings are managed from the editor while this workspace focuses on publishing, sharing, and response management."
        actionHref={editHref}
        actionLabel="Open editor"
      />
    );
  }

  if (!rsvpEnabled && tab === "guests") {
    return <RsvpDisabledPanel eventTitle={eventTitle} editHref={editHref} />;
  }

  return (
    <div className="space-y-4">
      {tab === "dashboard" ? (
        <OwnerDashboardIntro
          eventTitle={eventTitle}
          rsvpEnabled={rsvpEnabled}
          numberOfGuests={numberOfGuests}
          editHref={editHref}
        />
      ) : null}
      {rsvpEnabled ? (
        <EventRsvpDashboard
          eventId={eventId}
          initialNumberOfGuests={numberOfGuests}
          rsvpEnabled={rsvpEnabled}
        />
      ) : (
        <RsvpDisabledPanel eventTitle={eventTitle} editHref={editHref} />
      )}
    </div>
  );
}

function OwnerDashboardIntro({
  eventTitle,
  rsvpEnabled,
  numberOfGuests,
  editHref,
}: {
  eventTitle: string;
  rsvpEnabled: boolean;
  numberOfGuests: number;
  editHref: string;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-[24px] border border-white/72 bg-white/90 p-4 shadow-[0_16px_44px_rgba(79,70,128,0.10)]">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
          RSVP
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {rsvpEnabled ? "Active" : "Off"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {rsvpEnabled ? "Guest responses are being collected." : "Enable RSVP from the editor."}
        </p>
      </article>
      <article className="rounded-[24px] border border-white/72 bg-white/90 p-4 shadow-[0_16px_44px_rgba(79,70,128,0.10)]">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
          Capacity
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {numberOfGuests > 0 ? numberOfGuests : "--"}
        </p>
        <p className="mt-1 text-sm text-slate-500">Configured guest target.</p>
      </article>
      <article className="rounded-[24px] border border-white/72 bg-white/90 p-4 shadow-[0_16px_44px_rgba(79,70,128,0.10)]">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-400">
          Event
        </p>
        <p className="mt-2 truncate text-2xl font-semibold text-slate-950">{eventTitle}</p>
        <Link href={editHref} className="mt-1 inline-flex text-sm font-bold text-violet-700">
          Adjust details
        </Link>
      </article>
    </section>
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

function OwnerUtilityPanel({
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="rounded-[28px] border border-white/72 bg-white/90 p-6 shadow-[0_20px_58px_rgba(79,70,128,0.10)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <Icon size={21} />
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{body}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
