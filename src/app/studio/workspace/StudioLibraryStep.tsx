"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layout,
  Loader2,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getFallbackThumbnail,
  getStudioShareTitle,
} from "../studio-workspace-builders";
import {
  studioLibraryBadgeClass,
  studioLibraryCardClass,
  studioLibraryGhostIconButtonClass,
  studioLibraryPanelClass,
} from "../studio-workspace-ui-classes";
import type { MediaItem } from "../studio-workspace-types";

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
  deleteMedia: (id: string) => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

const LIBRARY_ITEMS_PER_PAGE = 8;

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
  const [libraryPage, setLibraryPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const libraryPageCount = isMobile
    ? 1
    : Math.max(1, Math.ceil(mediaList.length / LIBRARY_ITEMS_PER_PAGE));

  const libraryVisibleItems = useMemo(() => {
    if (isMobile) return mediaList;
    const windowStart = libraryPage * LIBRARY_ITEMS_PER_PAGE;
    return mediaList.slice(windowStart, windowStart + LIBRARY_ITEMS_PER_PAGE);
  }, [isMobile, libraryPage, mediaList]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncMobileState = () => setIsMobile(window.innerWidth < 768);

    syncMobileState();
    window.addEventListener("resize", syncMobileState);
    return () => window.removeEventListener("resize", syncMobileState);
  }, []);

  useEffect(() => {
    setLibraryPage((current) => {
      if (isMobile) return 0;
      return Math.min(current, Math.max(0, libraryPageCount - 1));
    });
  }, [isMobile, libraryPageCount]);

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-[1400px] space-y-8 text-[#111111]"
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
          <div className={studioLibraryPanelClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6b7280]">
                  Studio Library
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-3xl">
                  Saved cards gallery
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/6 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
                <span>{mediaList.length}</span>
                <span>items</span>
                {!isMobile && libraryPageCount > 1 ? (
                  <>
                    <span className="text-black/20">•</span>
                    <span>
                      Page {libraryPage + 1} of {libraryPageCount}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <section className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={libraryPage + (isMobile ? "-mobile" : "-desktop")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className={`grid gap-6 md:gap-8 ${
                  isMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                }`}
              >
                {libraryVisibleItems.map((item) => {
                  const title = getLibraryTitle(item);
                  const primaryActionLabel = getLibraryPrimaryActionLabel(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      whileHover={{ y: -8, transition: { duration: 0.28 } }}
                      className={studioLibraryCardClass}
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
                                onClick={() => openLiveCardEditor(item)}
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,rgba(17,24,39,0.16),rgba(17,24,39,0.58))] opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                              <button
                                type="button"
                                onClick={() => openLibraryItem(item)}
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
                                  onClick={() => editLibraryItem(item)}
                                  className={studioLibraryGhostIconButtonClass}
                                  title={item.type === "page" ? "Edit card image" : "Edit"}
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadMedia(item)}
                                  className={studioLibraryGhostIconButtonClass}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void shareMedia(item)}
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
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteMedia(item.id)}
                          className="absolute left-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white/82 text-[#ef4444] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all hover:scale-105 hover:bg-white"
                          title="Delete from library"
                          aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="absolute right-3 top-3 z-10 flex gap-2">
                          <span className={studioLibraryBadgeClass}>
                            {item.type === "page" ? (
                              <Activity className="h-3 w-3 text-[#007AFF]" />
                            ) : (
                              <ImageIcon className="h-3 w-3 text-[#007AFF]" />
                            )}
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

          {!isMobile && libraryPageCount > 1 ? (
            <div className="flex justify-center items-center gap-3">
              {Array.from({ length: libraryPageCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setLibraryPage(index)}
                  aria-label={`Show library page ${index + 1}`}
                  aria-pressed={index === libraryPage}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === libraryPage
                      ? "w-6 bg-[#1A1A1A]"
                      : "w-2 bg-[#d1d5db] hover:bg-[#9ca3af]"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
