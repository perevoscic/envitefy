"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layout,
  Loader2,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  type TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getFallbackThumbnail } from "../studio-workspace-builders";
import type { StudioStep } from "../studio-types";
import {
  studioWorkspaceGhostIconButtonClass,
  studioWorkspaceMediaBadgeClass,
  studioWorkspaceMediaCardClass,
} from "../studio-workspace-ui-classes";
import type { MediaItem } from "../studio-workspace-types";

export type StudioLibraryStepProps = {
  mediaList: MediaItem[];
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setStep: (step: StudioStep) => void;
  setActivePage: Dispatch<SetStateAction<MediaItem | null>>;
  setSelectedImage: Dispatch<SetStateAction<MediaItem | null>>;
  openLiveCardEditor: (item: MediaItem) => void;
  openLiveCardImageEdit: (item: MediaItem) => void;
  downloadMedia: (item: MediaItem) => void;
  shareMedia: (item: MediaItem) => void | Promise<void>;
  sharingId: string | null;
  copySuccess: boolean;
  deleteMedia: (id: string) => void;
  handleMediaImageLoadError: (item: MediaItem) => void;
};

function getLibraryGalleryItemsPerPage(viewportWidth: number) {
  if (viewportWidth >= 1536) return 10;
  if (viewportWidth >= 1024) return 6;
  return 4;
}

export function StudioLibraryStep({
  mediaList,
  setEditingId,
  setStep,
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
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;
  const ghostIconButtonClass = studioWorkspaceGhostIconButtonClass;
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryDirection, setLibraryDirection] = useState<1 | -1>(1);
  const [libraryItemsPerPage, setLibraryItemsPerPage] = useState(10);
  const libraryTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const libraryPageCount = Math.max(1, Math.ceil(mediaList.length / Math.max(1, libraryItemsPerPage)));
  const libraryWindowStart = libraryPage * libraryItemsPerPage;
  const libraryVisibleItems = useMemo(
    () => mediaList.slice(libraryWindowStart, libraryWindowStart + libraryItemsPerPage),
    [libraryItemsPerPage, libraryWindowStart, mediaList],
  );
  const libraryVisibleRangeLabel =
    mediaList.length > 0
      ? `${libraryWindowStart + 1}-${Math.min(
          libraryWindowStart + libraryVisibleItems.length,
          mediaList.length,
        )}`
      : "0-0";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLibraryItemsPerPage = () => {
      setLibraryItemsPerPage(getLibraryGalleryItemsPerPage(window.innerWidth));
    };

    syncLibraryItemsPerPage();
    window.addEventListener("resize", syncLibraryItemsPerPage);
    return () => window.removeEventListener("resize", syncLibraryItemsPerPage);
  }, []);

  useEffect(() => {
    setLibraryPage((current) => Math.min(current, Math.max(0, libraryPageCount - 1)));
  }, [libraryPageCount]);

  function goToLibraryPage(nextPage: number) {
    const clamped = Math.max(0, Math.min(nextPage, libraryPageCount - 1));
    if (clamped === libraryPage) return;
    setLibraryDirection(clamped > libraryPage ? 1 : -1);
    setLibraryPage(clamped);
  }

  function handleLibraryTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    libraryTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleLibraryTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const start = libraryTouchStartRef.current;
    libraryTouchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      goToLibraryPage(libraryPage + 1);
      return;
    }
    goToLibraryPage(libraryPage - 1);
  }

  return (
    <motion.div
      key="library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto max-w-[1320px] space-y-10"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Library
          </p>
          <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
            Your Library
          </h2>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setStep("form");
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
        >
          <Plus className="h-5 w-5" />
          Create New
        </button>
      </div>

      {mediaList.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-[#e5dbf6] bg-white/88 py-24 text-center shadow-[0_20px_55px_rgba(84,61,140,0.06)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f1ff] shadow-[0_10px_24px_rgba(84,61,140,0.08)]">
            <ImageIcon className="h-8 w-8 text-[#9b82e7]" />
          </div>
          <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
            No invitations created yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[28px] border border-[#ece4f7] bg-white/72 px-4 py-4 shadow-[0_18px_44px_rgba(84,61,140,0.08)] backdrop-blur-xl sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#eadff9] bg-white/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  <span>{libraryVisibleRangeLabel}</span>
                  <span className="text-neutral-300">/</span>
                  <span>{mediaList.length}</span>
                </div>
                {libraryPageCount > 1 ? (
                  <p className="text-xs text-neutral-500 max-sm:hidden">
                    {libraryPage + 1} of {libraryPageCount}
                  </p>
                ) : null}
              </div>

              {libraryPageCount > 1 ? (
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="text-xs text-neutral-500 sm:hidden">Swipe to browse</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToLibraryPage(libraryPage - 1)}
                      disabled={libraryPage === 0}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7dcf7] bg-white/95 text-neutral-700 shadow-[0_10px_26px_rgba(84,61,140,0.12)] transition-all hover:-translate-x-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Show previous library cards"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => goToLibraryPage(libraryPage + 1)}
                      disabled={libraryPage >= libraryPageCount - 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7dcf7] bg-white/95 text-neutral-700 shadow-[0_10px_26px_rgba(84,61,140,0.12)] transition-all hover:translate-x-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Show more library cards"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {libraryPageCount > 1 ? (
              <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {Array.from({ length: libraryPageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToLibraryPage(index)}
                    aria-label={`Show library page ${index + 1}`}
                    aria-pressed={index === libraryPage}
                    className={`h-2.5 rounded-full transition-all ${
                      index === libraryPage
                        ? "w-10 bg-neutral-900"
                        : "w-2.5 bg-[#ded1f4] hover:bg-[#cdb8ef]"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div
            className="relative overflow-hidden"
            onTouchStart={handleLibraryTouchStart}
            onTouchEnd={handleLibraryTouchEnd}
          >
            {libraryPageCount > 1 ? (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#fcfaff] via-[#fcfaff]/78 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#fcfaff] via-[#fcfaff]/78 to-transparent" />
              </>
            ) : null}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${libraryPage}-${libraryItemsPerPage}`}
                initial={{ opacity: 0, x: libraryDirection > 0 ? 48 : -48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: libraryDirection > 0 ? -48 : 48 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-2 gap-3 md:gap-7 lg:grid-cols-3 2xl:grid-cols-5"
              >
                {libraryVisibleItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layoutId={item.id}
                    className={mediaCardClass}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5] md:aspect-[9/16]">
                      {item.status === "loading" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#faf7ff]">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        </div>
                      ) : item.status === "error" ? (
                        <div className="absolute inset-0">
                          <img
                            src={item.url || getFallbackThumbnail(item.details)}
                            alt={item.theme}
                            className="h-full w-full object-cover opacity-35"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/55 px-6 text-center backdrop-blur-[3px]">
                            <p className="text-sm font-semibold text-neutral-900">
                              Generation interrupted
                            </p>
                            <p className="max-w-[18rem] text-xs leading-5 text-neutral-600">
                              {item.errorMessage ||
                                "This saved card did not finish generating. Open it in the editor to rebuild it."}
                            </p>
                            <button
                              onClick={() => openLiveCardEditor(item)}
                              className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
                            >
                              Open Editor
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={item.url || getFallbackThumbnail(item.details)}
                            alt={item.theme}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            referrerPolicy="no-referrer"
                            onError={() => handleMediaImageLoadError(item)}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(18,14,28,0.12),rgba(18,14,28,0.54))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                            {item.type === "page" ? (
                              <button
                                onClick={() => setActivePage(item)}
                                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                              >
                                <Layout className="h-5 w-5" />
                                Open Live Card
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedImage(item)}
                                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-[0_14px_34px_rgba(25,20,40,0.18)] transition-transform hover:scale-[1.02]"
                              >
                                <ImageIcon className="h-5 w-5" />
                                View Full Image
                              </button>
                            )}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  item.type === "page"
                                    ? openLiveCardImageEdit(item)
                                    : openLiveCardEditor(item)
                                }
                                className="rounded-full bg-white p-3 text-neutral-900 shadow-[0_12px_24px_rgba(25,20,40,0.14)] transition-transform hover:scale-105"
                                title={item.type === "page" ? "Edit card image" : "Edit"}
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => downloadMedia(item)}
                                className={ghostIconButtonClass}
                                title="Download"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void shareMedia(item)}
                                disabled={sharingId === item.id}
                                className={ghostIconButtonClass}
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
                      <div className="absolute left-4 top-4 flex gap-2">
                        <span className={mediaBadgeClass}>
                          {item.type === "page" ? (
                            <Layout className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <ImageIcon className="h-3 w-3 text-sky-600" />
                          )}
                          {item.type === "page" ? "Live Card" : "Image"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteMedia(item.id)}
                        className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/82 p-2.5 text-neutral-500 shadow-[0_10px_24px_rgba(25,20,40,0.12)] transition-all hover:bg-white hover:text-red-500"
                        title="Delete from library"
                        aria-label={`Delete ${item.type === "page" ? "live card" : "image"} from library`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
