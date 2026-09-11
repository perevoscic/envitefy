"use client";

import { Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useEventTopbarEdit } from "@/hooks/useEventPageChrome";
import type { EventPreviewBackground } from "@/lib/event-preview-background";
import { buildEmbeddedEventPreviewHref, buildOwnerEventEditHref } from "@/lib/event-preview-viewport";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventPreviewViewport from "./EventPreviewViewport";

type Props = {
  eventId: string;
  title: string;
  publicHref: string;
  editHref: string;
  backgroundColor?: string;
  mobileEditInEvent?: boolean;
};

export default function EventOwnerView({
  eventId,
  title,
  publicHref,
  editHref,
  backgroundColor,
  mobileEditInEvent = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [background, setBackground] = useState<EventPreviewBackground>({ backgroundColor });
  const editUrl = buildOwnerEventEditHref(editHref, publicHref, String(background.backgroundColor || ""));
  const editAction = useMemo(() => ({ href: editUrl }), [editUrl]);
  useEventTopbarEdit(mobileEditInEvent ? null : editAction);

  async function shareEvent() {
    const url = new URL(publicHref, window.location.origin).href;
    trackEventInteraction({
      eventId,
      eventName: "share_link_click",
      targetUrl: url,
      targetLabel: title,
      sourceSurface: "owner_event_view",
    });
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      window.prompt("Copy your event link:", url);
    }
  }

  const actionClassName =
    "min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

  const actions = (
    <div role="group" aria-label="Event actions" className="flex min-w-0 items-center gap-2">
      <Link href={editUrl} aria-label="Edit event" title="Edit event" className={`hidden lg:inline-flex ${actionClassName}`}>
        <Pencil size={19} aria-hidden="true" />
        <span>Edit</span>
      </Link>
      <button
        type="button"
        onClick={shareEvent}
        aria-label="Share event"
        title="Share event"
        className={`inline-flex ${actionClassName}`}
      >
        <Share2 size={19} aria-hidden="true" />
        <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
      </button>
      <EventDeleteModal
        eventId={eventId}
        eventTitle={title}
        ariaLabel="Delete event"
        buttonClassName={`inline-flex ${actionClassName}`}
      />
      {copied ? (
        <span role="status" className="sr-only">
          Event link copied
        </span>
      ) : null}
    </div>
  );

  return (
    <section
      aria-label={`${title} owner view`}
      data-owner-event-view
      className="fixed bottom-0 right-0 top-0 left-[var(--app-sidebar-width,0px)] flex min-w-0 flex-col overflow-hidden text-slate-950"
    >
      <EventPreviewViewport
        title={title}
        src={buildEmbeddedEventPreviewHref(publicHref)}
        preserveNavigation
        onBackgroundChange={setBackground}
        initialBackground={background}
        actions={actions}
      />
    </section>
  );
}
