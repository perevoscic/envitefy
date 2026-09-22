"use client";

import { Share2, X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useCallback, useState } from "react";
import ArtworkDownloadButton from "@/components/ArtworkDownloadButton";
import viewportStyles from "@/components/ArtworkPreviewDialog.module.css";
import EventCelebrationOverlay from "@/components/EventCelebrationOverlay";
import LiveCardArtworkFrame from "@/components/studio/LiveCardArtworkFrame";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import SharedCardTextLayer from "@/components/studio/SharedCardTextLayer";
import StudioLiveCardActionSurface, {
  isPosterFirstHeroCard,
  type LiveCardActiveTab,
  type LiveCardButtonPositions,
  type LiveCardInvitationData,
} from "@/components/studio/StudioLiveCardActionSurface";
import { useArtworkAspectRatio } from "@/hooks/use-artwork-aspect-ratio";
import type { EventCelebrationKind } from "@/utils/event-celebration";
import { trackEventInteraction } from "@/utils/event-tracking-client";
import { resolveNativeShareData } from "@/utils/native-share";
import styles from "./StudioShowcaseLiveCard.module.css";
import chromeStyles from "./LiveCardChromeButton.module.css";

type SharedStudioCardProps = {
  eventId?: string | null;
  title: string;
  imageUrl: string;
  invitationData?: LiveCardInvitationData | null;
  positions?: LiveCardButtonPositions | null;
  shareUrl?: string | null;
  returnHref?: string | null;
  embeddedPreview?: boolean;
  previewMode?: boolean;
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
  fitToViewport?: boolean;
};

export function SharedStudioCardFrame(props: SharedStudioCardFrameProps) {
  const [activeTab, setActiveTab] = useState<LiveCardActiveTab>("none");
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const invitationData = props.invitationData || null;
  const sharedDesign = invitationData?.sharedDesign;
  const isClassicInvite = invitationData?.eventDetails?.product === "digital_flyer";
  const previewMode = Boolean(props.previewMode || props.embeddedPreview);
  const usesPosterArtFrame = invitationData?.heroTextMode === "image";
  const measuredRatio = useArtworkAspectRatio(props.imageUrl, usesPosterArtFrame ? 2 / 3 : 9 / 16);
  const artworkRatio = sharedDesign ? 2 / 3 : measuredRatio;
  const placeActionsAbove = !sharedDesign && props.actionsPlacement === "above";
  const placeActionsOverlay = Boolean(sharedDesign) || props.actionsPlacement === "overlay";
  const useOutsideActions = !isClassicInvite && !placeActionsOverlay && (usesPosterArtFrame || placeActionsAbove);
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
        previewMode={previewMode}
        showExtendedDetails={usesPosterArtFrame}
      />
    </div>
  ) : null;

  const closeAction = props.onClose ? (
    <button
      type="button"
      onClick={props.onClose}
      aria-label="Close preview"
      title="Close preview"
      className={`${
        useOutsideActions
          ? "relative ml-auto mt-2 flex"
          : "absolute right-3 top-3 inline-flex"
      } z-30 size-11 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${isPosterFirstHeroCard(invitationData) ? chromeStyles.glass : chromeStyles.darkGlass}`}
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  ) : null;

  const artwork = (
    <LiveCardArtworkFrame
      sharedDesign={Boolean(sharedDesign)}
      imageUrl={sharedDesign?.backgroundUrl || props.imageUrl}
      aspectRatio={artworkRatio}
      className={`${usesPosterArtFrame ? "aspect-[2/3] rounded-[1.5rem]" : "aspect-[9/16] rounded-[inherit]"} ${
        fitToContainer ? styles.fittedArtwork : ""
      } ${props.artworkClassName || ""}`}
    >
      <img
        src={sharedDesign?.backgroundUrl || props.imageUrl}
        alt={sharedDesign ? "" : props.title}
        className="absolute inset-0 h-full w-full object-contain object-center"
        referrerPolicy="no-referrer"
      />
      {sharedDesign && invitationData ? <SharedCardTextLayer source={invitationData} /> : <LiveCardHeroTextOverlay invitationData={invitationData} />}
      {!isClassicInvite && (placeActionsOverlay || (!usesPosterArtFrame && !placeActionsAbove)) ? (
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
          previewMode={previewMode}
        />
      ) : null}
      {props.topRightAction}
      {isClassicInvite && props.shareUrl && <button type="button" aria-label="Share invitation" onClick={() => void handleShare()} className={`absolute left-3 top-3 z-30 inline-flex size-11 items-center justify-center rounded-full ${chromeStyles.glass}`}><Share2 size={18} aria-hidden="true" /></button>}
      {!useOutsideActions ? closeAction : null}
    </LiveCardArtworkFrame>
  );

  return (
    <div
      className={`${props.fitToViewport ? viewportStyles.viewportFrame : ""} ${props.className || ""}`}
      style={{
        "--artwork-preview-ratio": artworkRatio,
        ...((isClassicInvite || sharedDesign) && props.fitToViewport ? {
          "--artwork-preview-max-art-height": "calc(var(--artwork-preview-available-height) * 0.9 - 3.5rem)",
          height: "calc(var(--artwork-preview-height) + 3.5rem)",
        } : {}),
        ...props.style,
      } as CSSProperties}
    >
      <div
        className={`relative mx-auto ${
          usesPosterArtFrame || placeActionsAbove
            ? "bg-transparent"
            : "rounded-[3rem] bg-neutral-900"
        } ${placeActionsAbove || fitToContainer ? "flex flex-col gap-3 !bg-transparent" : ""} ${
          fitToContainer ? "h-full min-h-0" : ""
        } ${props.frameClassName || ""}`}
        style={{ width: props.fitToViewport || props.style?.width ? undefined : cardFrameWidth }}
      >
        {placeActionsAbove ? outsideActions : null}
        {fitToContainer ? (
          <div
            className={styles.artworkSlot}
            style={
              { "--live-card-aspect-ratio": artworkRatio } as CSSProperties
            }
          >
            {artwork}
          </div>
        ) : (
          artwork
        )}
        {!placeActionsAbove ? outsideActions : null}
        {usesPosterArtFrame && (!placeActionsOverlay || isClassicInvite || sharedDesign) ? (
          <ArtworkDownloadButton imageUrl={props.imageUrl} title={props.title} invitationData={sharedDesign && invitationData ? { ...invitationData, eventDetails: { ...invitationData.eventDetails, rsvpUrl: props.shareUrl || invitationData.eventDetails?.rsvpUrl } } : invitationData} className="mt-2" />
        ) : null}
        {useOutsideActions ? closeAction : null}
      </div>
    </div>
  );
}

export default function SharedStudioCardPage(props: SharedStudioCardProps) {
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
      className={`${styles.sharedPage} relative isolate flex h-[100dvh] w-full flex-col bg-neutral-950`}
    >
      {props.celebrationKind ? <EventCelebrationOverlay kind={props.celebrationKind} /> : null}

      <main className="relative z-0 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <SharedStudioCardFrame
            {...props}
            onClose={props.embeddedPreview ? undefined : handleClose}
            actionsPlacement="overlay"
            fitToViewport
            frameClassName="!w-full !rounded-[1.5rem]"
          />
        </div>
      </main>

      <footer className={styles.attribution}>
        <Link href="/envitefy-create" className="text-white/70 transition hover:text-white">
          Created by Envitefy Create
        </Link>
      </footer>
    </div>
  );
}
