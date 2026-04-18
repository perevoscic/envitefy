"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface, {
  type LiveCardActiveTab,
  type LiveCardButtonPositions,
  type LiveCardInvitationData,
} from "@/components/studio/StudioLiveCardActionSurface";
import { landingLiveCardSnapshots } from "@/components/landing/landing-live-card-snapshots";
import { buildLandingShowcasePath } from "@/lib/landing-showcase";
import { resolveNativeShareData } from "@/utils/native-share";

type ShowcaseCardItem = {
  id: string;
  sharePath: string;
  title: string;
  preview: StudioMarketingCardConfig;
};

type StudioMarketingCardConfig = {
  title: string;
  imageUrl: string;
  invitationData: LiveCardInvitationData;
  positions?: LiveCardButtonPositions;
  initialActiveTab?: LiveCardActiveTab;
};

const revealIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const showcaseCards: ShowcaseCardItem[] = landingLiveCardSnapshots.map((snapshot) => ({
  id: snapshot.id,
  sharePath: buildLandingShowcasePath(snapshot.slug),
  title: snapshot.title,
  preview: {
    title: snapshot.title,
    imageUrl: snapshot.imageUrl,
    invitationData: snapshot.invitationData,
    positions: snapshot.positions,
    initialActiveTab: snapshot.initialActiveTab,
  },
}));

function StudioMarketingLiveCard({
  preview,
  sharePath,
  className,
  compactChrome = false,
  showcaseMode = false,
  interactive = true,
  imageLoading = "lazy",
  activeTab,
  onActiveTabChange,
  showcaseOverlay,
}: {
  preview: StudioMarketingCardConfig;
  sharePath: string;
  className?: string;
  compactChrome?: boolean;
  showcaseMode?: boolean;
  interactive?: boolean;
  imageLoading?: "eager" | "lazy";
  activeTab?: LiveCardActiveTab;
  onActiveTabChange?: (tab: LiveCardActiveTab) => void;
  showcaseOverlay?: ReactNode;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<LiveCardActiveTab>(
    preview.initialActiveTab || "none",
  );
  const [shareState, setShareState] = useState<"idle" | "pending" | "success">("idle");
  const shareResetTimeoutRef = useRef<number | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const resolvedActiveTab = activeTab ?? internalActiveTab;
  const handleActiveTabChange = onActiveTabChange ?? setInternalActiveTab;

  useEffect(() => {
    setShareUrl(`${window.location.origin}${sharePath}`);

    return () => {
      if (shareResetTimeoutRef.current) {
        window.clearTimeout(shareResetTimeoutRef.current);
      }
    };
  }, [sharePath]);

  const handleShare = async () => {
    const resolvedShareUrl = shareUrl || `${window.location.origin}${sharePath}`;
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
        `${preview.title} on Envitefy Studio`,
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
        "relative aspect-[9/16] overflow-hidden rounded-[2.2rem] border border-white/10 bg-neutral-950 shadow-[0_28px_80px_rgba(15,23,42,0.32)]",
        showcaseMode && "border-slate-300/70 bg-transparent shadow-none",
        className,
      )}
    >
      <img
        src={preview.imageUrl}
        alt={preview.title}
        loading={imageLoading}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.06)_26%,rgba(0,0,0,0.28)_100%)]" />
      <LiveCardHeroTextOverlay invitationData={preview.invitationData} />
      <div
        className={cx(
          "absolute inset-0",
          compactChrome && "origin-bottom scale-[0.88]",
          interactive ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <StudioLiveCardActionSurface
          title={preview.title}
          invitationData={preview.invitationData}
          positions={preview.positions}
          activeTab={resolvedActiveTab}
          onActiveTabChange={handleActiveTabChange}
          onShare={handleShare}
          shareUrl={shareUrl}
          fallbackShareUrlToWindowLocation={false}
          shareState={shareState}
        />
      </div>
      {showcaseOverlay}
    </div>
  );
}

export default function LandingLiveCardShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showcaseOverlayIndex, setShowcaseOverlayIndex] = useState<number | null>(null);
  const [fullscreenShowcaseIndex, setFullscreenShowcaseIndex] = useState<number | null>(null);
  const [fullscreenActiveTab, setFullscreenActiveTab] = useState<LiveCardActiveTab>("none");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(showcaseCards.length > 1);
  const showcaseScrollRef = useRef<HTMLDivElement | null>(null);
  const showcaseCardsRef = useRef<HTMLElement[]>([]);
  const showcaseCardCentersRef = useRef<number[]>([]);
  const showcaseSwipeStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    index: number;
    didSwipe: boolean;
  } | null>(null);
  const suppressShowcaseClickRef = useRef(false);
  const suppressShowcaseClickTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (suppressShowcaseClickTimeoutRef.current) {
        window.clearTimeout(suppressShowcaseClickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = showcaseScrollRef.current;
    if (!node) return;

    let activeIndexValue = 0;
    let canScrollLeftValue = false;
    let canScrollRightValue = showcaseCards.length > 1;

    const syncShowcaseMeasurements = () => {
      const cards = Array.from(node.querySelectorAll<HTMLElement>("[data-showcase-card]"));
      showcaseCardsRef.current = cards;
      showcaseCardCentersRef.current = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
    };

    const syncShowcaseState = () => {
      const cards = showcaseCardsRef.current;
      if (cards.length === 0) {
        if (activeIndexValue !== 0) {
          activeIndexValue = 0;
          setActiveIndex(0);
        }
        if (canScrollLeftValue) {
          canScrollLeftValue = false;
          setCanScrollLeft(false);
        }
        if (canScrollRightValue) {
          canScrollRightValue = false;
          setCanScrollRight(false);
        }
        return;
      }

      const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);
      const nextCanScrollLeft = node.scrollLeft > 10;
      const nextCanScrollRight = node.scrollLeft < maxScrollLeft - 10;

      if (canScrollLeftValue !== nextCanScrollLeft) {
        canScrollLeftValue = nextCanScrollLeft;
        setCanScrollLeft(nextCanScrollLeft);
      }
      if (canScrollRightValue !== nextCanScrollRight) {
        canScrollRightValue = nextCanScrollRight;
        setCanScrollRight(nextCanScrollRight);
      }

      const containerCenter = node.scrollLeft + node.clientWidth / 2;
      let nextActiveIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const [index, cardCenter] of showcaseCardCentersRef.current.entries()) {
        const distance = Math.abs(cardCenter - containerCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextActiveIndex = index;
        }
      }

      if (activeIndexValue !== nextActiveIndex) {
        activeIndexValue = nextActiveIndex;
        setActiveIndex(nextActiveIndex);
      }
    };

    let frameId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncShowcaseState);
    };
    const handleResize = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        syncShowcaseMeasurements();
        syncShowcaseState();
      });
    };

    syncShowcaseMeasurements();
    syncShowcaseState();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setShowcaseOverlayIndex(null);
  }, [activeIndex]);

  useEffect(() => {
    if (showcaseOverlayIndex === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest(`[data-showcase-card-index="${showcaseOverlayIndex}"]`)) {
        return;
      }
      setShowcaseOverlayIndex(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showcaseOverlayIndex]);

  useEffect(() => {
    if (fullscreenShowcaseIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenShowcaseIndex(null);
        setFullscreenActiveTab("none");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenShowcaseIndex]);

  const scrollToShowcaseIndex = (index: number) => {
    const node = showcaseScrollRef.current;
    if (!node) return;
    const cards = showcaseCardsRef.current;
    if (cards.length === 0) return;

    const nextIndex = Math.max(0, Math.min(index, cards.length - 1));
    const card = cards[nextIndex];
    const targetLeft = card.offsetLeft - (node.clientWidth - card.offsetWidth) / 2;
    const maxScrollLeft = Math.max(node.scrollWidth - node.clientWidth, 0);

    setShowcaseOverlayIndex(null);
    setActiveIndex(nextIndex);
    node.scrollTo({
      left: Math.min(Math.max(targetLeft, 0), maxScrollLeft),
      behavior: "smooth",
    });
  };

  const closeShowcaseFullscreen = () => {
    setFullscreenShowcaseIndex(null);
    setFullscreenActiveTab("none");
  };

  const openShowcaseFullscreen = (index: number) => {
    setShowcaseOverlayIndex(null);
    setFullscreenActiveTab("none");
    setFullscreenShowcaseIndex(index);
  };

  const handleShowcaseCardClick = (index: number, event?: MouseEvent<HTMLDivElement>) => {
    if (suppressShowcaseClickRef.current) {
      event?.preventDefault();
      event?.stopPropagation();
      suppressShowcaseClickRef.current = false;
      return;
    }

    if (index !== activeIndex) {
      event?.preventDefault();
      event?.stopPropagation();
      scrollToShowcaseIndex(index);
      return;
    }

    const target = event?.target;
    if (
      target instanceof HTMLElement &&
      target.closest("[data-live-card-trigger], [data-live-card-panel], button, a")
    ) {
      return;
    }

    event?.preventDefault();
    event?.stopPropagation();
    setShowcaseOverlayIndex((current) => (current === index ? null : index));
  };

  const suppressShowcaseClick = () => {
    suppressShowcaseClickRef.current = true;
    if (suppressShowcaseClickTimeoutRef.current) {
      window.clearTimeout(suppressShowcaseClickTimeoutRef.current);
    }
    suppressShowcaseClickTimeoutRef.current = window.setTimeout(() => {
      suppressShowcaseClickRef.current = false;
      suppressShowcaseClickTimeoutRef.current = null;
    }, 280);
  };

  const handleShowcasePointerDown = (
    index: number,
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!event.isPrimary || event.pointerType === "mouse") return;
    showcaseSwipeStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      index,
      didSwipe: false,
    };
  };

  const handleShowcasePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const swipeState = showcaseSwipeStateRef.current;
    if (!swipeState || swipeState.pointerId !== event.pointerId || swipeState.didSwipe) {
      return;
    }

    const deltaX = event.clientX - swipeState.startX;
    const deltaY = event.clientY - swipeState.startY;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    swipeState.didSwipe = true;
    suppressShowcaseClick();
    scrollToShowcaseIndex(swipeState.index + (deltaX < 0 ? 1 : -1));
  };

  const clearShowcaseSwipeState = (event?: React.PointerEvent<HTMLDivElement>) => {
    const swipeState = showcaseSwipeStateRef.current;
    if (!swipeState) return;
    if (event && swipeState.pointerId !== event.pointerId) return;
    showcaseSwipeStateRef.current = null;
  };

  const handleShowcaseClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressShowcaseClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressShowcaseClickRef.current = false;
  };

  const scrollShowcase = (direction: "left" | "right") => {
    scrollToShowcaseIndex(activeIndex + (direction === "left" ? -1 : 1));
  };

  return (
    <>
      <motion.section
        id="showcase"
        className="hash-anchor-below-fixed-nav overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        {...revealIn}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-6">
            <div>
              <h2
                className="text-5xl font-extrabold leading-[0.9] tracking-tight text-slate-900 sm:text-6xl lg:text-[5.25rem]"
                style={{ fontFamily: '"Outfit", "Inter", ui-sans-serif, system-ui, sans-serif' }}
              >
                Live Card Showcase
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
                See how hosts use Envitefy Studio to create memorable event experiences.
              </p>
            </div>
          </div>
        </div>

        <div className="relative left-1/2 mt-12 w-screen -translate-x-1/2 px-4 py-4 sm:px-6 lg:px-8">
          <div className="group/carousel relative">
            <button
              type="button"
              aria-label="Scroll showcase left"
              onClick={() => scrollShowcase("left")}
              disabled={!canScrollLeft}
              className={cx(
                "absolute left-4 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-500 hover:border-slate-300 hover:bg-white active:scale-95 md:inline-flex lg:left-8",
                canScrollLeft
                  ? "opacity-0 group-hover/carousel:opacity-100"
                  : "pointer-events-none -translate-x-8 opacity-0",
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll showcase right"
              onClick={() => scrollShowcase("right")}
              disabled={!canScrollRight}
              className={cx(
                "absolute right-4 top-1/2 z-20 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 text-slate-700 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-all duration-500 hover:border-slate-300 hover:bg-white active:scale-95 md:inline-flex lg:right-8",
                canScrollRight
                  ? "opacity-0 group-hover/carousel:opacity-100"
                  : "pointer-events-none translate-x-8 opacity-0",
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div
              ref={showcaseScrollRef}
              className="no-scrollbar flex items-start gap-4 overflow-x-auto scroll-smooth px-[max(1.25rem,calc(50vw-136px))] py-8 snap-x snap-mandatory sm:gap-6 sm:px-[max(2rem,calc(50vw-150px))]"
            >
              {showcaseCards.map((item, index) => (
                <div
                  key={item.id}
                  onClickCapture={handleShowcaseClickCapture}
                  onClick={(event) => handleShowcaseCardClick(index, event)}
                  onPointerDownCapture={(event) => handleShowcasePointerDown(index, event)}
                  onPointerMoveCapture={handleShowcasePointerMove}
                  onPointerUpCapture={clearShowcaseSwipeState}
                  onPointerCancelCapture={clearShowcaseSwipeState}
                  data-showcase-card
                  data-showcase-card-index={index}
                  className="w-[min(272px,calc(100vw-5.5rem))] shrink-0 snap-center cursor-pointer sm:w-[min(300px,calc(100vw-4rem))]"
                >
                  <div
                    className={cx(
                      "rounded-[2.2rem] shadow-[0_28px_60px_rgba(15,23,42,0.12),0_12px_28px_rgba(15,23,42,0.08),0_1px_0_rgba(255,255,255,0.7)_inset] transition-all duration-700 ease-out",
                      activeIndex === index
                        ? "scale-100 opacity-100 blur-0"
                        : "scale-[0.85] opacity-40 blur-[2px]",
                    )}
                  >
                    <StudioMarketingLiveCard
                      preview={item.preview}
                      sharePath={item.sharePath}
                      compactChrome
                      showcaseMode
                      interactive={activeIndex === index}
                      imageLoading="lazy"
                      showcaseOverlay={
                        showcaseOverlayIndex === index && activeIndex === index ? (
                          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-md">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openShowcaseFullscreen(index);
                              }}
                              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/92 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.24)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Open live card
                            </button>
                          </div>
                        ) : null
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-3">
              {showcaseCards.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show showcase card ${index + 1}`}
                  aria-current={activeIndex === index}
                  onClick={() => scrollToShowcaseIndex(index)}
                  className={cx(
                    "rounded-full transition-all duration-500",
                    activeIndex === index ? "h-1.5 w-8 bg-[#7c3aed]" : "h-1.5 w-1.5 bg-black/10",
                  )}
                />
              ))}
            </div>

            <div className="mt-6 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-slate-500/70 md:hidden">
              Swipe to explore
            </div>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {fullscreenShowcaseIndex !== null ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-12"
            onClick={() => closeShowcaseFullscreen()}
          >
            <button
              type="button"
              aria-label="Close live card"
              onClick={() => closeShowcaseFullscreen()}
              className="absolute right-4 top-4 z-[7010] rounded-full border border-white/20 bg-white/15 p-3 text-white transition-colors hover:bg-white/25 md:right-8 md:top-8"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.div
              initial={{ scale: 0.94, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 24 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md"
              onClick={(event) => event.stopPropagation()}
            >
              <StudioMarketingLiveCard
                preview={showcaseCards[fullscreenShowcaseIndex].preview}
                sharePath={showcaseCards[fullscreenShowcaseIndex].sharePath}
                activeTab={fullscreenActiveTab}
                onActiveTabChange={setFullscreenActiveTab}
                className="rounded-[3rem] shadow-2xl shadow-black/40"
                imageLoading="eager"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
