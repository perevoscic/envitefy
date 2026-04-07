"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layout,
  Loader2,
  Pencil,
  Plus,
  Share2,
  Trash2,
  Type,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { getDisplayTitle, getFallbackThumbnail } from "../studio-workspace-builders";
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
  openLiveCardTextEdit: (item: MediaItem) => void;
  downloadMedia: (item: MediaItem) => void;
  shareMedia: (item: MediaItem) => void | Promise<void>;
  sharingId: string | null;
  copySuccess: boolean;
  deleteMedia: (id: string) => void;
};

export function StudioLibraryStep({
  mediaList,
  setEditingId,
  setStep,
  setActivePage,
  setSelectedImage,
  openLiveCardEditor,
  openLiveCardImageEdit,
  openLiveCardTextEdit,
  downloadMedia,
  shareMedia,
  sharingId,
  copySuccess,
  deleteMedia,
}: StudioLibraryStepProps) {
  const { status: sessionStatus } = useSession();
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;
  const ghostIconButtonClass = studioWorkspaceGhostIconButtonClass;

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
                  <p className="text-sm leading-6 text-neutral-600 sm:text-[15px]">
                    {sessionStatus === "authenticated"
                      ? "A gallery view of your saved invitations and generated assets. When you are signed in, this library syncs to your account across devices, with a local copy in this browser."
                      : "A gallery view of saved invitations and generated assets on this device. Sign in to sync your library across browsers and phones."}
                  </p>
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
                  <p className="mt-2 text-sm text-neutral-500">
                    {sessionStatus === "authenticated"
                      ? "Your saved live cards and images will appear here on every device where you use Envitefy while signed in."
                      : "Your saved live cards and images will appear here. Sign in to keep them in sync everywhere."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 2xl:grid-cols-5">
                  {mediaList.map((item) => (
                    <motion.div key={item.id} layoutId={item.id} className={mediaCardClass}>
                      <div className="relative aspect-[9/16] overflow-hidden">
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
                              referrerPolicy="no-referrer"
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
                              src={item.url}
                              alt={item.theme}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              referrerPolicy="no-referrer"
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
                                {item.type === "page" ? (
                                  <button
                                    type="button"
                                    onClick={() => openLiveCardTextEdit(item)}
                                    className="rounded-full bg-white p-3 text-neutral-900 shadow-[0_12px_24px_rgba(25,20,40,0.14)] transition-transform hover:scale-105"
                                    title="Edit card text and details"
                                  >
                                    <Type className="h-5 w-5" />
                                  </button>
                                ) : null}
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
                                  title={
                                    sharingId === item.id ? "Creating share link" : "Share"
                                  }
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
                      <div className="space-y-1 px-6 py-5">
                        <h3 className="truncate text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                          {getDisplayTitle(item.details)}
                        </h3>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                          {item.theme}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
  );
}
