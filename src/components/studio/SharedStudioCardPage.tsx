"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useCallback, useState } from "react";
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
  style?: CSSProperties;
};

export function SharedStudioCardFrame(props: SharedStudioCardFrameProps) {
  const [activeTab, setActiveTab] = useState<LiveCardActiveTab>("none");
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const invitationData = props.invitationData || null;
  const usesPosterArtFrame = invitationData?.heroTextMode === "image";
  const cardFrameWidth = usesPosterArtFrame
    ? "min(calc(100vw - 2rem), calc((100dvh - 6.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) * 2 / 3))"
    : "min(calc(100vw - 2rem), calc((100dvh - 6.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) * 9 / 16))";

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
        className={`relative mx-auto ${
          usesPosterArtFrame ? "aspect-[2/3]" : "aspect-[9/16]"
        } overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20 ${
          props.frameClassName || ""
        }`}
        style={{ width: props.style?.width ? undefined : cardFrameWidth }}
      >
        <img
          src={props.imageUrl}
          alt={props.title}
          className="absolute inset-0 h-full w-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <LiveCardHeroTextOverlay invitationData={invitationData} />
        <StudioLiveCardActionSurface
          title={props.title}
          invitationData={invitationData}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          positions={props.positions}
          shareUrl={props.shareUrl}
          fallbackShareUrlToWindowLocation
          onShare={() => void handleShare()}
          shareState={shareState}
        />
      </div>
    </div>
  );
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const invitationData = props.invitationData || null;
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
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-neutral-950">
      {props.celebrationKind ? <EventCelebrationOverlay kind={props.celebrationKind} /> : null}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Close preview"
        className="fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[max(calc(var(--app-mobile-topbar-offset,4rem)+0.75rem),calc(env(safe-area-inset-top)+0.75rem))] z-[7001] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/92 text-slate-950 shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:bg-white lg:left-[calc(20rem+1rem)] lg:right-auto lg:top-[max(1rem,env(safe-area-inset-top))]"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <img
          src={props.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,10,10,0.24)_30%,_rgba(10,10,10,0.82)_100%)]" />
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 md:py-6">
          <SharedStudioCardFrame {...props} />
        </div>
      </main>

      {posterFirstHeroCard ? (
        <div className="shrink-0 px-4 py-3 text-center">
          <Link
            href="/studio"
            className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-md transition hover:border-white/22 hover:bg-white/12 hover:text-white/88"
          >
            Created by Envitefy Concierge
          </Link>
        </div>
      ) : (
        <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
          <Link
            href="/studio"
            className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
          >
            Created by Envitefy Concierge
          </Link>
        </footer>
      )}
    </div>
  );
}
