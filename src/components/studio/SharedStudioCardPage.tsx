"use client";

import Link from "next/link";
import { useState } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface, {
  type LiveCardActiveTab,
  type LiveCardButtonPositions,
  type LiveCardInvitationData,
  isPosterFirstHeroCard,
} from "@/components/studio/StudioLiveCardActionSurface";
import { resolveNativeShareData } from "@/utils/native-share";

type SharedStudioCardProps = {
  title: string;
  imageUrl: string;
  invitationData?: LiveCardInvitationData | null;
  positions?: LiveCardButtonPositions | null;
  shareUrl?: string | null;
};

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
  const [activeTab, setActiveTab] = useState<LiveCardActiveTab>("none");
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const invitationData = props.invitationData || null;
  const posterFirstHeroCard = isPosterFirstHeroCard(invitationData);
  const cardFrameWidth =
    "min(calc(100vw - 2rem), calc((100dvh - 6.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) * 9 / 16))";

  async function handleShare() {
    const shareUrl =
      props.shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = {
      title: props.title,
      text:
        invitationData?.interactiveMetadata?.shareNote ||
        invitationData?.description ||
        "Check out this invitation!",
      url: shareUrl,
    };

    try {
      setShareState("pending");
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
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-neutral-950">
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
          <div
            className="relative mx-auto aspect-[9/16] overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20"
            style={{ width: cardFrameWidth }}
          >
            <img
              src={props.imageUrl}
              alt={props.title}
              className="absolute inset-0 h-full w-full object-cover"
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
      </main>

      {posterFirstHeroCard ? (
        <div className="shrink-0 px-4 py-3 text-center">
          <Link
            href="/studio"
            className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-md transition hover:border-white/22 hover:bg-white/12 hover:text-white/88"
          >
            Created by Envitefy Studio
          </Link>
        </div>
      ) : (
        <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
          <Link
            href="/studio"
            className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
          >
            Created by Envitefy Studio
          </Link>
        </footer>
      )}
    </div>
  );
}
