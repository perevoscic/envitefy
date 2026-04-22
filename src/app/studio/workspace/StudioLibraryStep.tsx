"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layout,
  Loader2,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getFallbackThumbnail,
  getStudioShareTitle,
} from "../studio-workspace-builders";
import {
  studioLibraryBadgeClass,
  studioLibraryCardClass,
  studioLibraryGhostIconButtonClass,
} from "../studio-workspace-ui-classes";
import type { MediaItem } from "../studio-workspace-types";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";

export type StudioLibraryStepProps = {
  mediaList: MediaItem[];
  setActivePage: (item: MediaItem | null) => void;
  setSelectedImage: (item: MediaItem | null) => void;
  openLiveCardEditor: (item: MediaItem) => void;
  openLiveCardImageEdit: (item: MediaItem) => void;
  downloadMedia: (item: MediaItem) => void;
  shareMedia: (item: MediaItem) => void | Promise<void>;
  sharingId: string | null;
  copySuccess: boolean;
  deleteMedia: (item: MediaItem) => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

const LIBRARY_ITEMS_PER_BATCH = 10;

function getLibraryTitle(item: MediaItem) {
  return getStudioShareTitle(item);
}

function getLibraryPrimaryActionLabel(item: MediaItem) {
  if (item.status === "error") return "Edit";
  return item.type === "page" ? "Open live card" : "View image";
}

export function StudioLibraryStep({
  mediaList,
  setActivePage,
  setSelectedImage,
  openLiveCardEditor,
  openLiveCardImageEdit,
  downloadMedia,
  shareMedia,
  sharingId,
  copySuccess,
  deleteMedia,
  handleMediaImageLoadError,
}: StudioLibraryStepProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(LIBRARY_ITEMS_PER_BATCH);
  const libraryLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const libraryVisibleItems = useMemo(() => {
    return mediaList.slice(0, visibleCount);
  }, [mediaList, visibleCount]);

  const hasMoreLibraryItems = libraryVisibleItems.length < mediaList.length;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncMobileState = () => setIsMobile(window.innerWidth < 768);

    syncMobileState();
    window.addEventListener("resize", syncMobileState);
    return () => window.removeEventListener("resize", syncMobileState);
  }, []);

  useEffect(() => {
    const nextVisibleCount = Math.max(LIBRARY_ITEMS_PER_BATCH, visibleCount);
    if (mediaList.length <= nextVisibleCount) {
      setVisibleCount(mediaList.length);
      return;
    }
    setVisibleCount(nextVisibleCount);
  }, [mediaList.length]);

  useEffect(() => {
    if (!hasMoreLibraryItems) return;
    if (typeof window === "undefined") return;
    const target = libraryLoadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + LIBRARY_ITEMS_PER_BATCH, mediaList.length));
      },
      {
        rootMargin: "0px 0px 320px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreLibraryItems, mediaList.length, libraryVisibleItems.length]);

  function openLibraryItem(item: MediaItem) {
    if (item.status === "error") {
      openLiveCardEditor(item);
      return;
    }
    if (item.type === "page") {
      setActivePage(item);
      return;
    }
    setSelectedImage(item);
  }

  function editLibraryItem(item: MediaItem) {
    if (item.type === "page") {
      openLiveCardImageEdit(item);
      return;
    }
    openLiveCardEditor(item);
  }

  return (
    <motion.div
      key="library"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1400px] space-y-8 text-[#111111] lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pb-12"
    >
      {mediaList.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-black/10 bg-[#f7f8fb] py-24 text-center shadow-[0_20px_55px_rgba(15,23,42,0.05)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <ImageIcon className="h-8 w-8 text-[#6b7280]" />
          </div>
          <p className="text-lg font-semibold tracking-[-0.02em] text-[#111111]">
            No invitations created yet
          </p>
        </div>
      ) : (
        <>
          <section className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`grid gap-6 md:gap-8 ${
                  isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {libraryVisibleItems.map((item) => {
                  const title = getLibraryTitle(item);
                  const primaryActionLabel = getLibraryPrimaryActionLabel(item);
                  const canTapToOpen = isMobile && item.status !== "loading";

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      whileHover={
                        isMobile ? undefined : { y: -8, transition: { duration: 0.28 } }
                      }
                      onClick={canTapToOpen ? () => openLibraryItem(item) : undefined}
                      className={`${studioLibraryCardClass} ${
                        canTapToOpen ? "cursor-pointer" : ""
                      }`}
                    >
                      <div className="relative w-full overflow-hidden rounded-[20px] bg-[#edf1f5] aspect-[2/3] sm:aspect-[9/16]">
                        {item.status === "loading" ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,#f1f4f8,#dde5ee)]">
                            <Loader2 className="h-8 w-8 animate-spin text-[#6b7280]" />
                          </div>
                        ) : item.status === "error" ? (
                          <div className="absolute inset-0">
                            <img
                              src={item.url || getFallbackThumbnail(item.details)}
                              alt={title}
                              className="h-full w-full object-cover opacity-35"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/62 px-6 text-center backdrop-blur-[4px]">
                              <p className="text-sm font-semibold text-[#111111]">
                                Generation interrupted
                              </p>
                              <p className="max-w-[18rem] text-xs leading-5 text-[#525866]">
                                {item.errorMessage ||
                                  "This saved card did not finish generating. Open it in the editor to rebuild it."}
                              </p>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openLiveCardEditor(item);
                                }}
                                className="rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black"
                              >
                                Open Editor
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={item.url || getFallbackThumbnail(item.details)}
                              alt={title}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                              onError={() => handleMediaImageLoadError(item)}
                            />
                            {item.type === "page" ? (
                              <LiveCardHeroTextOverlay invitationData={item.data} />
                            ) : null}
                            {!isMobile ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,rgba(17,24,39,0.16),rgba(17,24,39,0.58))] opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openLibraryItem(item);
                                }}
                                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#111111] shadow-[0_14px_34px_rgba(15,23,42,0.18)] transition-transform hover:scale-[1.02]"
                              >
                                {item.type === "page" ? (
                                  <Layout className="h-5 w-5" />
                                ) : (
                                  <ImageIcon className="h-5 w-5" />
                                )}
                                {primaryActionLabel}
                              </button>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    editLibraryItem(item);
                                  }}
                                  className={studioLibraryGhostIconButtonClass}
                                  title={item.type === "page" ? "Edit card image" : "Edit"}
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    downloadMedia(item);
                                  }}
                                  className={studioLibraryGhostIconButtonClass}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void shareMedia(item);
                                  }}
                                  disabled={sharingId === item.id}
                                  className={studioLibraryGhostIconButtonClass}
                                  title={sharingId === item.id ? "Creating share link" : "Share"}
                                >
                                  {sharingId === item.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : copySuccess ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Share2 className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                              </div>
                            ) : null}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteMedia(item);
                          }}
                          className={`absolute left-3 top-3 z-10 inline-flex items-center justify-center rounded-full border border-black/8 bg-white/82 text-[#ef4444] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:scale-105 hover:bg-white ${
                            item.type === "page" ? "h-8 w-8" : "h-10 w-10"
                          }`}
                          title="Delete from library"
                          aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                        >
                          <Trash2 className={item.type === "page" ? "h-3.5 w-3.5" : "h-4 w-4"} />
                        </button>

                        <div className="absolute right-3 top-3 z-10 flex gap-2">
                          <span className={studioLibraryBadgeClass}>
                            {item.type === "image" ? (
                              <ImageIcon className="h-3 w-3 text-[#007AFF]" />
                            ) : null}
                            {item.type === "page" ? "Live Card" : "Image"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </section>
          {hasMoreLibraryItems ? (
            <div
              ref={libraryLoadMoreRef}
              aria-hidden="true"
              className="flex min-h-16 items-center justify-center"
            >
              <Loader2 className="h-5 w-5 animate-spin text-[#9ca3af]" />
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
