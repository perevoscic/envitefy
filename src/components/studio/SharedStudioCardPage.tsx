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
  const studioCreditClass = posterFirstHeroCard
    ? "border-white/28 bg-white/16 text-white/88 shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl hover:border-white/40 hover:bg-white/22"
    : "border-white/18 bg-black/36 text-white/78 shadow-[0_16px_36px_rgba(0,0,0,0.38)] backdrop-blur-xl hover:border-white/28 hover:bg-black/46 hover:text-white/88";

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
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-neutral-950">
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

      <main className="relative z-0 min-h-[100dvh]">
        <div className="relative min-h-[100dvh] w-full overflow-hidden">
          <img
            src={props.imageUrl}
            alt={props.title}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_rgba(8,8,8,0.06)_28%,_rgba(8,8,8,0.3)_68%,_rgba(8,8,8,0.62)_100%)]" />
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
      </main>

      <div className="pointer-events-none absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-30">
        <Link
          href="/studio"
          className={`pointer-events-auto inline-flex rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] transition ${studioCreditClass}`}
        >
          Created by Envitefy Studio
        </Link>
      </div>
    </div>
  );
}
