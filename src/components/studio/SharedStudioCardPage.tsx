"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useCallback, useState } from "react";
import ArtworkDownloadButton from "@/components/ArtworkDownloadButton";
import EventCelebrationOverlay from "@/components/EventCelebrationOverlay";
import LiveCardArtworkFrame from "@/components/studio/LiveCardArtworkFrame";
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
import styles from "./StudioShowcaseLiveCard.module.css";

type SharedStudioCardProps = {
  eventId?: string | null;
  title: string;
  imageUrl: string;
  invitationData?: LiveCardInvitationData | null;
  positions?: LiveCardButtonPositions | null;
  shareUrl?: string | null;
  returnHref?: string | null;
  embeddedPreview?: boolean;
  celebrationKind?: EventCelebrationKind | null;
};

type SharedStudioCardFrameProps = SharedStudioCardProps & {
  className?: string;
  frameClassName?: string;
  artworkClassName?: string;
  topRightAction?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
  actionsPlacement?: "auto" | "above" | "overlay";
  fitToContainer?: boolean;
};

export function SharedStudioCardFrame(props: SharedStudioCardFrameProps) {
  const [activeTab, setActiveTab] = useState<LiveCardActiveTab>("none");
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const invitationData = props.invitationData || null;
  const usesPosterArtFrame = invitationData?.heroTextMode === "image";
  const placeActionsAbove = props.actionsPlacement === "above";
  const placeActionsOverlay = props.actionsPlacement === "overlay";
  const useOutsideActions = !placeActionsOverlay && (usesPosterArtFrame || placeActionsAbove);
  const fitToContainer = Boolean(props.fitToContainer);
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

  const outsideActions = useOutsideActions ? (
    <div className="shrink-0">
      <StudioLiveCardActionSurface
        placement={placeActionsAbove ? "above" : "below"}
        title={props.title}
        invitationData={invitationData}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        shareUrl={props.shareUrl}
        fallbackShareUrlToWindowLocation
        onShare={props.topRightAction ? undefined : () => void handleShare()}
        shareState={shareState}
        previewMode={props.embeddedPreview}
        showExtendedDetails={usesPosterArtFrame}
      />
    </div>
  ) : null;

  const artwork = (
    <LiveCardArtworkFrame
      imageUrl={props.imageUrl}
      className={`${usesPosterArtFrame ? "aspect-[2/3] rounded-[1.5rem]" : "aspect-[9/16] rounded-[inherit]"} ${
        fitToContainer ? styles.fittedArtwork : ""
      } ${props.artworkClassName || ""}`}
    >
      <img
        src={props.imageUrl}
        alt={props.title}
        className={`absolute inset-0 h-full w-full ${usesPosterArtFrame ? "object-contain" : "object-cover"} object-center`}
        referrerPolicy="no-referrer"
      />
      <LiveCardHeroTextOverlay invitationData={invitationData} />
      {placeActionsOverlay || (!usesPosterArtFrame && !placeActionsAbove) ? (
        <StudioLiveCardActionSurface
          placement="overlay"
          title={props.title}
          invitationData={invitationData}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          positions={props.positions}
          shareUrl={props.shareUrl}
          fallbackShareUrlToWindowLocation
          sharePosition="left"
          onShare={props.topRightAction ? undefined : () => void handleShare()}
          shareState={shareState}
        />
      ) : null}
      {props.topRightAction}
    </LiveCardArtworkFrame>
  );

  return (
    <div className={props.className || ""} style={props.style}>
      <div
        className={`relative mx-auto ${
          usesPosterArtFrame || placeActionsAbove
            ? "bg-transparent"
            : "rounded-[3rem] bg-neutral-900"
        } ${placeActionsAbove || fitToContainer ? "flex flex-col gap-3 !bg-transparent" : ""} ${
          fitToContainer ? "h-full min-h-0" : ""
        } ${props.frameClassName || ""}`}
        style={{ width: props.style?.width ? undefined : cardFrameWidth }}
      >
        {placeActionsAbove ? outsideActions : null}
        {fitToContainer ? (
          <div
            className={styles.artworkSlot}
            style={
              { "--live-card-aspect-ratio": usesPosterArtFrame ? 2 / 3 : 9 / 16 } as CSSProperties
            }
          >
            {artwork}
          </div>
        ) : (
          artwork
        )}
        {!placeActionsAbove ? outsideActions : null}
        {usesPosterArtFrame && !placeActionsOverlay ? (
          <ArtworkDownloadButton imageUrl={props.imageUrl} title={props.title} className="mt-2" />
        ) : null}
        {props.onClose ? (
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close preview"
            title="Close preview"
            className={`${
              usesPosterArtFrame || placeActionsAbove
                ? "relative ml-auto mt-2 flex"
                : "absolute right-3 top-5 inline-flex"
            } z-30 size-11 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-950 shadow-lg backdrop-blur-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
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
    <div
      className={`relative isolate flex min-h-[100dvh] w-full flex-col max-md:pt-[env(safe-area-inset-top)] ${usesPosterArtFrame ? "bg-slate-50" : "bg-neutral-950"}`}
    >
      {props.celebrationKind ? <EventCelebrationOverlay kind={props.celebrationKind} /> : null}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <img
          src={props.imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-35 blur-3xl"
          referrerPolicy="no-referrer"
        />
        <div
          className={
            usesPosterArtFrame
              ? "absolute inset-0 bg-white/80"
              : "absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,10,10,0.24)_30%,_rgba(10,10,10,0.82)_100%)]"
          }
        />
      </div>

      <main className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-0 pt-2 md:py-6">
          <SharedStudioCardFrame
            {...props}
            onClose={props.embeddedPreview ? undefined : handleClose}
            className="w-full max-w-[30rem]"
            frameClassName="max-md:!w-full !rounded-[1.5rem]"
          />
        </div>
      </main>

      {posterFirstHeroCard ? (
        <div className="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-center md:py-3">
          <Link
            href="/envitefy-create"
            className={`inline-flex rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.24em] backdrop-blur-md transition ${usesPosterArtFrame ? "border-slate-200 bg-white/70 text-slate-600 hover:bg-white" : "border-white/14 bg-white/8 text-white/70 hover:border-white/22 hover:bg-white/12 hover:text-white/88"}`}
          >
            Created by Envitefy Create
          </Link>
        </div>
      ) : (
        <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-4 py-3 text-center">
          <Link
            href="/envitefy-create"
            className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/55 transition hover:text-white/80"
          >
            Created by Envitefy Create
          </Link>
        </footer>
      )}
    </div>
  );
}
