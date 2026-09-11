"use client";

import { Pencil, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useSidebar } from "@/app/sidebar-context";
import { buildEmbeddedEventPreviewHref } from "@/lib/event-preview-viewport";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventPreviewViewport from "./EventPreviewViewport";

type Props = {
  eventId: string;
  title: string;
  publicHref: string;
  editHref: string;
};

export default function EventOwnerView({ eventId, title, publicHref, editHref }: Props) {
  const router = useRouter();
  const { clearEventContext, setEventContextSourcePage } = useSidebar();
  const [copied, setCopied] = useState(false);
  const backToEvents = useCallback(() => {
    clearEventContext();
    setEventContextSourcePage("myEvents");
    window.dispatchEvent(new CustomEvent("envitefy:sidebar:open-my-events"));
    router.push("/");
  }, [clearEventContext, router, setEventContextSourcePage]);

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
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

  const actions = (
    <div role="group" aria-label="Event actions" className="flex min-w-0 items-center gap-1">
      <Link href={editHref} aria-label="Edit event" title="Edit event" className={actionClassName}>
        <Pencil size={19} aria-hidden="true" />
        <span className="hidden sm:inline">Edit</span>
      </Link>
      <button
        type="button"
        onClick={shareEvent}
        aria-label="Share event"
        title="Share event"
        className={actionClassName}
      >
        <Share2 size={19} aria-hidden="true" />
        <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
      </button>
      <EventDeleteModal
        eventId={eventId}
        eventTitle={title}
        ariaLabel="Delete event"
        buttonClassName={actionClassName}
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
      className="fixed bottom-0 right-0 top-[var(--app-mobile-topbar-offset,6rem)] left-[var(--app-sidebar-width,0px)] flex min-w-0 flex-col overflow-hidden bg-slate-50 text-slate-950 lg:top-0"
    >
      <EventPreviewViewport
        title={title}
        src={buildEmbeddedEventPreviewHref(publicHref)}
        preserveNavigation
        onClose={backToEvents}
        closeLabel="Back to My Events"
        actions={actions}
      />
    </section>
  );
}
