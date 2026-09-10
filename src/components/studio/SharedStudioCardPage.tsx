"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useCallback, useState } from "react";
import EventCelebrationOverlay from "@/components/EventCelebrationOverlay";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface, {
  isPosterFirstHeroCard,
  type LiveCardActiveTab,
  type LiveCardButtonPositions,
  type LiveCardInvitationData,
} from "@/components/studio/StudioLiveCardActionSurface";
import type { EventCelebrationKind } from "@/utils/event-celebration";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import { resolveNativeShareData } from "@/utils/native-share";

type SharedStudioCardProps = {
  eventId?: string | null;
  title: string;
  imageUrl: string;
  invitationData?: LiveCardInvitationData | null;
  positions?: LiveCardButtonPositions | null;
  shareUrl?: string | null;
  returnHref?: string | null;
  celebrationKind?: EventCelebrationKind | null;
};

type SharedStudioCardFrameProps = SharedStudioCardProps & {
  className?: string;
  frameClassName?: string;
  artworkClassName?: string;
  topRightAction?: ReactNode;
  onClose?: () => void;
  closeButtonPlacement?: "below" | "overlay";
  style?: CSSProperties;
};

export function SharedStudioCardFrame(props: SharedStudioCardFrameProps) {
  const [activeTab, setActiveTab] = useState<LiveCardActiveTab>("none");
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const invitationData = props.invitationData || null;
  const usesPosterArtFrame = invitationData?.heroTextMode === "image";
  const cardFrameWidth = usesPosterArtFrame
    ? "min(calc(100vw - 2rem), calc((100dvh - 13rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) * 2 / 3))"
    : "min(calc(100vw - 2rem), calc((100dvh - 13rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) * 9 / 16))";

  async function handleShare() {
    const shareUrl = props.shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = {
      url: shareUrl,
    };

    try {
      setShareState("pending");
      if (props.eventId) {
        trackEventInteraction({
          eventId: props.eventId,
          eventName: "share_link_click",
          targetUrl: shareUrl,
          targetLabel: props.title,
          sourceSurface: "studio_live_card",
        });
      }
      const nativeShareData = resolveNativeShareData(shareData);
      if (nativeShareData) {
        await navigator.share(nativeShareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof window !== "undefined") {
        window.prompt("Copy your share link:", shareUrl);
      }
      setShareState("success");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareState("idle");
        return;
      }
      setShareState("idle");
    }
  }

  return (
    <div className={props.className || ""} style={props.style}>
      <div
        className={`relative mx-auto ${usesPosterArtFrame ? "bg-transparent" : "overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20"} ${
          props.frameClassName || ""
        }`}
        style={{ width: props.style?.width ? undefined : cardFrameWidth }}
      >
        <div data-live-card-artwork className={`relative ${usesPosterArtFrame ? "aspect-[2/3] overflow-hidden rounded-[1.5rem] shadow-xl" : "aspect-[9/16]"} ${props.artworkClassName || ""}`}>
        <img
          src={props.imageUrl}
          alt={props.title}
          className={`absolute inset-0 h-full w-full ${usesPosterArtFrame ? "object-contain" : "object-cover"} object-center`}
          referrerPolicy="no-referrer"
        />
        <LiveCardHeroTextOverlay invitationData={invitationData} />
        <StudioLiveCardActionSurface
          placement="overlay"
          title={props.title}
          invitationData={invitationData}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          positions={props.positions}
          shareUrl={props.shareUrl}
          fallbackShareUrlToWindowLocation
          sharePosition={props.onClose ? "left" : "right"}
          onShare={props.topRightAction ? undefined : () => void handleShare()}
          shareState={shareState}
        />
        {props.topRightAction}
        {props.onClose && props.closeButtonPlacement === "overlay" ? (
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close preview"
            title="Close preview"
            className="absolute right-3 top-5 z-30 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:right-5 sm:top-6 md:right-8 md:top-8 md:h-16 md:w-16"
          >
            <X className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          </button>
        ) : null}
        </div>
        {props.onClose && props.closeButtonPlacement !== "overlay" ? (
          <div className={`flex justify-end px-1 pt-2 ${usesPosterArtFrame ? "bg-transparent" : "bg-neutral-950"}`}>
            <button type="button" onClick={props.onClose} aria-label="Close preview"
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 ${usesPosterArtFrame ? "text-slate-700 hover:bg-white/70 focus-visible:ring-violet-500" : "text-white/80 hover:bg-white/10 focus-visible:ring-white"}`}>
              <X size={18} aria-hidden="true" /> Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const invitationData = props.invitationData || null;
  const usesPosterArtFrame = invitationData?.heroTextMode === "image";
  const posterFirstHeroCard = isPosterFirstHeroCard(invitationData);
  const handleClose = useCallback(() => {
    if (props.returnHref) {
      window.location.assign(props.returnHref);
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/landing");
  }, [props.returnHref]);

  return (
    <div className={`relative isolate flex min-h-[100dvh] w-full flex-col max-md:pt-[env(safe-area-inset-top)] ${usesPosterArtFrame ? "bg-slate-50" : "bg-neutral-950"}`}>
      {props.celebrationKind ? <EventCelebrationOverlay kind={props.celebrationKind} /> : null}


      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <img
          src={props.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          referrerPolicy="no-referrer"
        />
        <div className={usesPosterArtFrame ? "absolute inset-0 bg-white/80" : "absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,10,10,0.24)_30%,_rgba(10,10,10,0.82)_100%)]"} />
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-0 pt-2 md:py-6">
          <SharedStudioCardFrame
            {...props}
            onClose={handleClose}
            className="w-full max-w-[30rem]"
            frameClassName="max-md:!w-full !rounded-[1.5rem]"
          />
        </div>
      </main>

      {posterFirstHeroCard ? (
        <div className="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-center md:py-3">
          <Link
            href="/envitefy-concierge"
            className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] backdrop-blur-md transition ${usesPosterArtFrame ? "border-slate-200 bg-white/70 text-slate-600 hover:bg-white" : "border-white/14 bg-white/8 text-white/70 hover:border-white/22 hover:bg-white/12 hover:text-white/88"}`}
          >
            Created by Envitefy Concierge
          </Link>
        </div>
      ) : (
        <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
          <Link
            href="/envitefy-concierge"
            className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
          >
            Created by Envitefy Concierge
          </Link>
        </footer>
      )}
    </div>
  );
}
