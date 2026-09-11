"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import LiveCardArtworkFrame from "@/components/studio/LiveCardArtworkFrame";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface, {
  type LiveCardActiveTab,
} from "@/components/studio/StudioLiveCardActionSurface";
import type { StudioShowcasePreview } from "@/lib/studio/showcase-previews";
import { resolveNativeShareData } from "@/utils/native-share";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type StudioShowcaseLiveCardProps = {
  preview: StudioShowcasePreview;
  className?: string;
  compactChrome?: boolean;
  showcaseMode?: boolean;
  buttonChromeSize?: "default" | "compact";
  interactive?: boolean;
  previewMode?: boolean;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "high" | "low" | "auto";
  activeTab?: LiveCardActiveTab;
  onActiveTabChange?: (tab: LiveCardActiveTab) => void;
  showcaseOverlay?: ReactNode;
};

export default function StudioShowcaseLiveCard({
  preview,
  className,
  compactChrome = false,
  showcaseMode = false,
  buttonChromeSize = "default",
  interactive = true,
  previewMode = false,
  imageLoading = "lazy",
  imageFetchPriority = "auto",
  activeTab,
  onActiveTabChange,
  showcaseOverlay,
}: StudioShowcaseLiveCardProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<LiveCardActiveTab>(
    preview.initialActiveTab || "none",
  );
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const shareResetTimeoutRef = useRef<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const resolvedActiveTab = activeTab ?? internalActiveTab;
  const handleActiveTabChange = onActiveTabChange ?? setInternalActiveTab;
  const usesPosterArtFrame = preview.invitationData.heroTextMode === "image";
  const canOptimizeImage =
    preview.imageUrl.startsWith("/") && !preview.imageUrl.startsWith("/api/");

  useEffect(() => {
    if (activeTab === undefined) {
      setInternalActiveTab(preview.initialActiveTab || "none");
    }
    setShareState("idle");
  }, [activeTab, preview.id, preview.initialActiveTab]);

  useEffect(() => {
    if (preview.sharePath) {
      setShareUrl(`${window.location.origin}${preview.sharePath}`);
    } else {
      setShareUrl("");
    }

    return () => {
      if (shareResetTimeoutRef.current) {
        window.clearTimeout(shareResetTimeoutRef.current);
      }
    };
  }, [preview.sharePath]);

  const handleShare = async () => {
    if (!preview.sharePath) return;

    const resolvedShareUrl = shareUrl || `${window.location.origin}${preview.sharePath}`;
    if (!resolvedShareUrl) return;

    if (shareResetTimeoutRef.current) {
      window.clearTimeout(shareResetTimeoutRef.current);
      shareResetTimeoutRef.current = null;
    }

    setShareState("pending");

    const sharePayload = {
      title: preview.title,
      text:
        preview.invitationData.description ||
        preview.invitationData.subtitle ||
        `${preview.title} on Envitefy`,
      url: resolvedShareUrl,
    };

    try {
      const nativeShareData = resolveNativeShareData(sharePayload);
      if (nativeShareData) {
        await navigator.share(nativeShareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedShareUrl);
      } else {
        window.prompt("Copy this link", resolvedShareUrl);
      }

      setShareState("success");
      shareResetTimeoutRef.current = window.setTimeout(() => {
        setShareState("idle");
        shareResetTimeoutRef.current = null;
      }, 1800);
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "NotAllowedError")
      ) {
        setShareState("idle");
        return;
      }

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(resolvedShareUrl);
          setShareState("success");
          shareResetTimeoutRef.current = window.setTimeout(() => {
            setShareState("idle");
            shareResetTimeoutRef.current = null;
          }, 1800);
          return;
        }
      } catch {}

      setShareState("idle");
    }
  };

  return (
    <div
      className={cx(
        usesPosterArtFrame ? "relative bg-transparent" : "relative rounded-[2.2rem] bg-neutral-950",
        !usesPosterArtFrame && showcaseMode && "bg-transparent",
        className,
      )}
    >
      <LiveCardArtworkFrame imageUrl={preview.imageUrl} className={usesPosterArtFrame ? "aspect-[2/3] rounded-[1.5rem]" : "aspect-[9/16] rounded-[inherit]"}>
      {canOptimizeImage ? (
        <Image
          src={preview.imageUrl}
          alt={preview.title}
          fill
          loading={imageLoading}
          fetchPriority={imageFetchPriority}
          sizes={showcaseMode ? "300px" : "(min-width: 768px) 420px, 92vw"}
          className={usesPosterArtFrame ? "object-contain object-center" : "object-cover object-center"}
        />
      ) : (
        <img
          src={preview.imageUrl}
          alt={preview.title}
          loading={imageLoading}
          fetchPriority={imageFetchPriority}
          decoding="async"
          className={`absolute inset-0 h-full w-full ${usesPosterArtFrame ? "object-contain" : "object-cover"} object-center`}
        />
      )}
      {!usesPosterArtFrame ? <div className="absolute inset-0 bg-black/20" /> : null}
      <LiveCardHeroTextOverlay invitationData={preview.invitationData} />
      <div
        className={cx(
          "absolute inset-0",
          !usesPosterArtFrame && compactChrome &&
            (showcaseMode ? "origin-bottom scale-y-[0.92]" : "origin-bottom scale-[0.88]"),
          interactive ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <StudioLiveCardActionSurface
          placement="overlay"
          title={preview.title}
          invitationData={preview.invitationData}
          positions={preview.positions}
          activeTab={resolvedActiveTab}
          onActiveTabChange={handleActiveTabChange}
          onShare={preview.sharePath ? handleShare : undefined}
          shareUrl={shareUrl}
          fallbackShareUrlToWindowLocation={false}
          shareState={shareState}
          showcaseMode={showcaseMode}
          buttonChromeSize={buttonChromeSize}
          previewMode={previewMode}
        />
      </div>
      </LiveCardArtworkFrame>
      {showcaseOverlay}
    </div>
  );
}
