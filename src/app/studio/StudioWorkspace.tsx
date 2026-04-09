"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  Gift,
  Image as ImageIcon,
  Layout,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PanelLeft,
  Phone,
  Share2,
  Trash2,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { buildLiveCardDetailsWelcomeMessage } from "@/lib/live-card-event-details";
import {
  buildLiveCardRsvpOutboundHref,
  LIVE_CARD_RSVP_CHOICES,
  parseLiveCardRsvpContact,
  shouldShowLiveCardDescriptionSection,
} from "@/lib/live-card-rsvp";
import { buildEventSlug, buildStudioCardPath } from "@/utils/event-url";
import { formatTimeLabelEn, formatWeekdayMonthDayOrdinalEn } from "@/utils/format-month-day-ordinal";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import type { StudioStep } from "./studio-types";
import { requestStudioGeneration } from "./studio-workspace-api";
import {
  accentClassForStudioRsvpChoice,
  buildInvitationData,
  buildStudioPublishPayload,
  clean,
  createId,
  formatDate,
  getAbsoluteShareUrl,
  getFallbackThumbnail,
  getStudioIdeaLabel,
  getStudioIdeaPlaceholder,
  getRegistryText,
  getStudioShareTitle,
  hasRegistryContent,
  inferBirthdayGenderFromName,
  inputValue,
  pickFirst,
} from "./studio-workspace-builders";
import {
  CATEGORY_FIELDS,
  EMPTY_POSITIONS,
  RSVP_FIELDS,
  SHARED_BASICS,
} from "./studio-workspace-field-config";
import { createInitialDetails, sanitizeMediaItems } from "./studio-workspace-sanitize";
import type {
  ActiveTab,
  ButtonPosition,
  EventDetails,
  MediaItem,
  MediaType,
} from "./studio-workspace-types";
import {
  studioWorkspaceGhostIconButtonClass,
  studioWorkspaceMediaBadgeClass,
  studioWorkspaceMediaCardClass,
  studioWorkspaceShellClass,
} from "./studio-workspace-ui-classes";
import { isRecord, STUDIO_GUEST_IMAGE_URL_MAX } from "./studio-workspace-utils";
import { StudioCategoryStep } from "./workspace/StudioCategoryStep";
import { StudioFormStep } from "./workspace/StudioFormStep";
import { StudioLibraryStep } from "./workspace/StudioLibraryStep";
import { useStudioMediaLibrary } from "./workspace/useStudioMediaLibrary";

async function persistGuestImageUrlsForPublish(details: EventDetails): Promise<EventDetails> {
  const urls = details.guestImageUrls;
  if (!urls.length) return details;
  const next: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const raw = clean(urls[i]);
    if (!raw) continue;
    const persisted = await persistImageMediaValue({
      value: raw,
      fileName: `studio-guest-${i + 1}.png`,
      fallbackValue: raw,
    });
    next.push(persisted || raw);
  }
  return { ...details, guestImageUrls: next.slice(0, STUDIO_GUEST_IMAGE_URL_MAX) };
}

/** Upload data/blob URLs so library sync stays under remote payload limits and thumbnails work across devices. */
async function persistStudioLibraryImageUrl(
  item: MediaItem,
  url: string | undefined,
): Promise<string | undefined> {
  const u = clean(url);
  if (!u) return undefined;
  try {
    const persisted = await persistImageMediaValue({
      value: u,
      fileName: `${buildEventSlug(getStudioShareTitle(item)) || "studio-asset"}.png`,
      fallbackValue: u,
    });
    return persisted || u;
  } catch {
    console.warn("[studio] failed to persist library image for sync");
    return u;
  }
}

function formatCalendarSummary(dateStr: string | undefined, timeStr: string | undefined) {
  const dateLabel = formatWeekdayMonthDayOrdinalEn(dateStr);
  if (!dateLabel) return "";
  const timeLabel = formatTimeLabelEn(timeStr);
  return timeLabel ? `${dateLabel} at ${timeLabel}` : dateLabel;
}

export default function StudioWorkspace() {
  const { status: sessionStatus } = useSession();
  const [step, setStep] = useState<StudioStep>("category");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOptionalCollapsed, setIsOptionalCollapsed] = useState(true);
  const [details, setDetails] = useState<EventDetails>(createInitialDetails);
  const { mediaList, setMediaList, librarySyncError, retryLibrarySync } = useStudioMediaLibrary();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePage, setActivePage] = useState<MediaItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("none");
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [applyingEditId, setApplyingEditId] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isLiveCardToolsDrawerOpen, setIsLiveCardToolsDrawerOpen] = useState(false);

  const editingMediaItem = useMemo(
    () => (editingId ? (mediaList.find((item) => item.id === editingId) ?? null) : null),
    [editingId, mediaList],
  );

  const isEditingLiveCard = editingMediaItem?.type === "page";

  const activePageRecord = useMemo(
    () => mediaList.find((item) => item.id === activePage?.id) ?? activePage,
    [activePage, mediaList],
  );
  const activePageRsvpContact = clean(activePageRecord?.data?.eventDetails.rsvpContact);
  const activePageRsvpParsed = parseLiveCardRsvpContact(activePageRsvpContact);
  const studioPreviewShareUrl = useMemo(() => {
    const path = activePageRecord?.sharePath;
    return path?.startsWith("/card/") ? getAbsoluteShareUrl(path) : "";
  }, [activePageRecord?.sharePath]);
  const studioRsvpOutboundHint =
    activePageRsvpParsed.kind === "email"
      ? "Tap a response to open your email with a draft message."
      : activePageRsvpParsed.kind === "sms"
        ? "Tap a response to open your messages app with a draft text."
        : "Add a phone number or email as the RSVP contact to send a reply from here.";

  const studioDetailsWelcome = useMemo(
    () =>
      activePageRecord?.data
        ? buildLiveCardDetailsWelcomeMessage(
            activePageRecord.data.eventDetails,
            activePageRecord.data.title,
          )
        : null,
    [activePageRecord?.data?.eventDetails, activePageRecord?.data?.title],
  );

  useEffect(() => {
    setEditPrompt("");
    setIsEditPanelOpen(false);
  }, [selectedImage?.id, activePageRecord?.id, editingMediaItem?.id]);

  useEffect(() => {
    if (!activePageRecord?.data) {
      setIsLiveCardToolsDrawerOpen(false);
      return;
    }
    if (typeof window === "undefined") return;
    setIsLiveCardToolsDrawerOpen(window.matchMedia("(min-width: 768px)").matches);
  }, [activePageRecord?.id, activePageRecord?.data]);

  useEffect(() => {
    if (details.category !== "Birthday") return;
    const nextGender = inferBirthdayGenderFromName(details.name) || "Neutral";
    if (details.gender === nextGender) return;
    setDetails((prev) =>
      prev.category === "Birthday" && prev.gender !== nextGender
        ? { ...prev, gender: nextGender }
        : prev,
    );
  }, [details.category, details.gender, details.name]);

  function isFormValid() {
    const missingShared = SHARED_BASICS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingShared.length > 0) return false;

    const missingCategory = (CATEGORY_FIELDS[details.category] || []).filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingCategory.length > 0) return false;

    const missingRsvp = RSVP_FIELDS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    return missingRsvp.length === 0;
  }

  function deleteMedia(id: string) {
    setMediaList((prev) => sanitizeMediaItems(prev.filter((item) => item.id !== id)));
    if (activePage?.id === id) {
      setActivePage(null);
      setActiveTab("none");
      setIsDesignMode(false);
    }
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  }

  function downloadMedia(item: MediaItem) {
    if (!item.url || typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = item.url;
    link.download = `envitefy-${item.type}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function patchMediaItem(id: string, patch: Partial<MediaItem>) {
    setMediaList((prev) =>
      sanitizeMediaItems(prev.map((item) => (item.id === id ? { ...item, ...patch } : item))),
    );
    if (activePage?.id === id) {
      setActivePage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
    if (selectedImage?.id === id) {
      setSelectedImage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }

  function beginLiveCardDetailEdit(item: MediaItem) {
    setDetails(item.details);
    setEditingId(item.id);
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setIsOptionalCollapsed(false);
    setActiveTab("none");
    setIsDesignMode(false);
    setActivePage(null);
    setStep("form");
  }

  function openLiveCardEditor(item: MediaItem) {
    beginLiveCardDetailEdit(item);
  }

  function openLiveCardTextEdit(item: MediaItem) {
    beginLiveCardDetailEdit(item);
  }

  function openLiveCardImageEdit(item: MediaItem) {
    setActivePage(item);
    setEditPrompt("");
    setIsEditPanelOpen(true);
    setActiveTab("none");
    setIsDesignMode(false);
  }

  async function ensurePublicSharePath(item: MediaItem): Promise<string> {
    if (item.sharePath?.startsWith("/card/")) {
      return item.sharePath;
    }
    if (item.status !== "ready") {
      throw new Error("This invite must finish generating before it can be shared.");
    }

    const persistedImageUrl = await persistImageMediaValue({
      value: item.url,
      fileName: `${buildEventSlug(getStudioShareTitle(item)) || "studio-invite"}.png`,
    });

    let publishItem = item;
    if (item.data?.eventDetails) {
      const eventDetails = await persistGuestImageUrlsForPublish(item.data.eventDetails);
      publishItem = {
        ...item,
        data: { ...item.data, eventDetails },
      };
    }

    const payload = buildStudioPublishPayload(publishItem, persistedImageUrl);

    const response = item.publishedEventId
      ? await fetch(`/api/history/${encodeURIComponent(item.publishedEventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        })
      : await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
    const json = await response.json().catch(() => null);

    if (!response.ok || !json || typeof json.id !== "string" || !json.id.trim()) {
      const errorMessage =
        isRecord(json) && typeof json.error === "string" && json.error.trim()
          ? json.error.trim()
          : "Failed to publish this invite for sharing.";
      throw new Error(errorMessage);
    }

    const sharePath = buildStudioCardPath(json.id, payload.title);
    patchMediaItem(item.id, {
      publishedEventId: json.id,
      sharePath,
      ...(publishItem.data ? { data: publishItem.data } : {}),
    });
    return sharePath;
  }

  async function shareMedia(item: MediaItem) {
    try {
      setSharingId(item.id);
      const sharePath = await ensurePublicSharePath(item);
      const shareUrl = getAbsoluteShareUrl(sharePath);
      const shareData = {
        title: getStudioShareTitle(item),
        text:
          item.data?.interactiveMetadata.shareNote ||
          item.data?.socialCaption ||
          item.data?.description ||
          "Check out this invitation!",
        url: shareUrl,
      };

      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else if (typeof window !== "undefined") {
        window.prompt("Copy your share link:", shareUrl);
      }
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("[studio] share failed", error);
      if (typeof window !== "undefined") {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Unable to create a public share link right now.";
        window.alert(message);
      }
    } finally {
      setSharingId((current) => (current === item.id ? null : current));
    }
  }

  function updatePosition(
    id: string,
    buttonKey: keyof typeof EMPTY_POSITIONS,
    point: ButtonPosition,
  ) {
    setMediaList((prev) =>
      sanitizeMediaItems(
        prev.map((item) => {
          if (item.id !== id) return item;
          const updated = {
            ...item,
            positions: {
              ...EMPTY_POSITIONS,
              ...item.positions,
              [buttonKey]: point,
            },
          };
          if (activePage?.id === id) {
            setActivePage(updated);
          }
          return updated;
        }),
      ),
    );
  }

  async function generateMedia(type: MediaType) {
    const currentDetails = { ...details };
    const targetId = editingId ?? createId();
    const existingItem = editingId
      ? (mediaList.find((item) => item.id === editingId) ?? null)
      : null;
    const sourceImageDataUrl =
      type === "page" && existingItem?.type === "page" ? clean(existingItem.url) : "";
    const loadingItem: MediaItem = {
      id: targetId,
      type,
      url: existingItem?.url,
      data: existingItem?.data,
      theme: pickFirst(currentDetails.theme, `${currentDetails.category} Event`),
      status: "loading",
      details: currentDetails,
      createdAt: existingItem?.createdAt || new Date().toISOString(),
      publishedEventId: existingItem?.publishedEventId,
      sharePath: existingItem?.publishedEventId ? undefined : existingItem?.sharePath,
      positions: existingItem?.positions || { ...EMPTY_POSITIONS },
    };

    setIsGenerating(true);
    setActiveTab("none");

    setMediaList((prev) => {
      if (editingId) {
        return sanitizeMediaItems(
          prev.map((item) =>
            item.id === editingId ? { ...loadingItem, createdAt: item.createdAt } : item,
          ),
        );
      }
      return sanitizeMediaItems([loadingItem, ...prev]);
    });

    try {
      const response = await requestStudioGeneration(
        currentDetails,
        type === "page" ? "both" : "image",
        sourceImageDataUrl ? editPrompt : undefined,
        sourceImageDataUrl || undefined,
      );
      const rawUrl =
        response.imageDataUrl || existingItem?.url || getFallbackThumbnail(currentDetails);
      const persistedUrl = await persistStudioLibraryImageUrl(
        { ...loadingItem, status: "ready", url: rawUrl },
        rawUrl,
      );
      const nextItem: MediaItem = {
        ...loadingItem,
        status: "ready",
        url: persistedUrl || rawUrl,
        data: type === "page" ? buildInvitationData(currentDetails, response) : undefined,
        errorMessage: undefined,
      };

      setMediaList((prev) =>
        sanitizeMediaItems(prev.map((item) => (item.id === targetId ? nextItem : item))),
      );
      setEditingId(null);
      setEditPrompt("");
      setStep("studio");
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Studio generation failed.";
      console.error("Studio generation failed", error);
      setMediaList((prev) =>
        sanitizeMediaItems(
          prev.map((item) =>
            item.id === targetId
              ? {
                  ...item,
                  status: "error",
                  url: existingItem?.url || getFallbackThumbnail(currentDetails),
                  errorMessage,
                }
              : item,
          ),
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function applyImageEdit(item: MediaItem) {
    const prompt = clean(editPrompt);
    if (!prompt) {
      if (typeof window !== "undefined") {
        window.alert("Add an edit prompt first.");
      }
      return;
    }

    const sourceImageDataUrl = clean(item.url);
    if (!sourceImageDataUrl) {
      if (typeof window !== "undefined") {
        window.alert("The current image is not available to edit.");
      }
      return;
    }

    try {
      setApplyingEditId(item.id);
      const response = await requestStudioGeneration(
        item.details,
        "image",
        prompt,
        sourceImageDataUrl,
      );

      const rawEditUrl = response.imageDataUrl || item.url;
      const persistedEditUrl = await persistStudioLibraryImageUrl(
        { ...item, url: rawEditUrl },
        rawEditUrl,
      );
      patchMediaItem(item.id, {
        url: persistedEditUrl || rawEditUrl,
        status: "ready",
        errorMessage: undefined,
        sharePath: undefined,
      });
      setEditPrompt("");
      setIsEditPanelOpen(false);
    } catch (error) {
      console.error("[studio] image edit failed", error);
      if (typeof window !== "undefined") {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Unable to apply that edit right now.";
        window.alert(message);
      }
    } finally {
      setApplyingEditId((current) => (current === item.id ? null : current));
    }
  }

  function renderEditImagePanel(item: MediaItem) {
    return (
      <div className="pointer-events-auto flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setIsEditPanelOpen((prev) => !prev)}
          aria-expanded={isEditPanelOpen}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/15"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-2 text-white">
              <WandSparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Edit Image
              </p>
            </div>
          </div>
          <ChevronRight
            className={`h-5 w-5 text-white/70 transition-transform ${isEditPanelOpen ? "rotate-90" : ""}`}
          />
        </button>

        {isEditPanelOpen ? (
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
            <textarea
              value={editPrompt}
              onChange={(event) => setEditPrompt(event.target.value)}
              placeholder="e.g. clean up the text, reduce clutter, and soften the gold lighting"
              className="min-h-[104px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => applyImageEdit(item)}
                disabled={applyingEditId === item.id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-70"
              >
                {applyingEditId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4" />
                )}
                Edit Image
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderEditTextPanel(item: MediaItem) {
    return (
      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => openLiveCardTextEdit(item)}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left backdrop-blur-md transition-colors hover:bg-white/15"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/15 p-2 text-white">
              <Type className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Edit Text
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/70" />
        </button>
      </div>
    );
  }

  function renderLiveCardPreviewTools(page: MediaItem) {
    return (
      <>
        {renderEditImagePanel(page)}

        {renderEditTextPanel(page)}

        <div className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              Design Mode
            </p>
          </div>
          <button
            type="button"
            aria-pressed={isDesignMode}
            aria-label={isDesignMode ? "Turn off design mode" : "Turn on design mode"}
            onClick={() => setIsDesignMode((prev) => !prev)}
            className={`relative h-7 w-14 rounded-full transition-all ${isDesignMode ? "bg-purple-500" : "bg-neutral-700"}`}
          >
            <motion.div
              animate={{ x: isDesignMode ? 28 : 4 }}
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg"
            />
          </button>
        </div>

      </>
    );
  }

  const studioIdeaLabel = getStudioIdeaLabel(details.category);
  const studioIdeaPlaceholder = getStudioIdeaPlaceholder(details.category);
  const isDetailsTabActive = step === "category" || step === "form";
  const shellClass = studioWorkspaceShellClass;
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;
  const ghostIconButtonClass = studioWorkspaceGhostIconButtonClass;

  return (
    <div className="min-h-screen bg-[#faf7ff] text-neutral-900 selection:bg-purple-200">
      <header className="sticky top-0 z-40 border-b border-[#efe7f8] bg-[#faf7ff]">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-center px-5 sm:h-[72px] sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full max-w-md items-center justify-center rounded-full border border-[#d4c2f5] bg-white/85 p-1.5 shadow-[0_4px_24px_rgba(91,33,182,0.1),0_12px_48px_-8px_rgba(109,40,217,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] ring-2 ring-[#c4b0f0]/35 backdrop-blur-xl"
          >
            <button
              type="button"
              onClick={() => setStep("form")}
              className={`relative flex-1 rounded-full px-4 py-2.5 text-sm transition-colors duration-200 ${
                isDetailsTabActive
                  ? "font-bold text-[#5b21b6]"
                  : "font-medium text-neutral-500 hover:text-[#6d28d9]"
              }`}
            >
              {isDetailsTabActive ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#7c3aed] opacity-95"
                />
              ) : null}
              <span className="relative">Details</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isFormValid()) setStep("studio");
              }}
              disabled={!isFormValid()}
              className={`relative flex-1 rounded-full px-4 py-2.5 text-sm transition-colors duration-200 disabled:cursor-not-allowed ${
                step === "studio"
                  ? "font-bold text-[#5b21b6]"
                  : "font-medium text-neutral-500 hover:text-[#6d28d9] disabled:text-neutral-400 disabled:hover:text-neutral-400"
              }`}
            >
              {step === "studio" ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#7c3aed] opacity-95"
                />
              ) : null}
              <span className="relative">Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setStep("library")}
              className={`relative flex-1 rounded-full px-4 py-2.5 text-sm transition-colors duration-200 ${
                step === "library"
                  ? "font-bold text-[#5b21b6]"
                  : "font-medium text-neutral-500 hover:text-[#6d28d9]"
              }`}
            >
              {step === "library" ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#6d28d9] to-[#7c3aed] opacity-95"
                />
              ) : null}
              <span className="relative">Library</span>
            </button>
          </motion.div>
        </div>
      </header>

      {sessionStatus === "authenticated" && librarySyncError ? (
        <div
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-center text-sm text-amber-950 sm:px-6"
        >
          <span>{librarySyncError}</span>
          <button
            type="button"
            onClick={retryLibrarySync}
            className="ml-2 font-semibold text-amber-900 underline decoration-amber-600/60 underline-offset-2 hover:text-amber-950"
          >
            Retry sync
          </button>
        </div>
      ) : null}

      <main className="mx-auto px-5 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <AnimatePresence mode="wait">
          {step === "category" ? (
            <StudioCategoryStep
              details={details}
              setDetails={setDetails}
              setStep={setStep}
              shellClass={shellClass}
            />
          ) : null}

          {step === "form" ? (
            <StudioFormStep
              details={details}
              setDetails={setDetails}
              setStep={setStep}
              isOptionalCollapsed={isOptionalCollapsed}
              setIsOptionalCollapsed={setIsOptionalCollapsed}
              isFormValid={isFormValid}
              editingId={editingId}
            />
          ) : null}
          {step === "library" ? (
            <StudioLibraryStep
              mediaList={mediaList}
              setEditingId={setEditingId}
              setStep={setStep}
              setActivePage={setActivePage}
              setSelectedImage={setSelectedImage}
              openLiveCardEditor={openLiveCardEditor}
              openLiveCardImageEdit={openLiveCardImageEdit}
              openLiveCardTextEdit={openLiveCardTextEdit}
              downloadMedia={downloadMedia}
              shareMedia={shareMedia}
              sharingId={sharingId}
              copySuccess={copySuccess}
              deleteMedia={deleteMedia}
            />
          ) : null}
          {step === "studio" ? (
            <motion.div
              key="studio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-10"
            >
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <button
                  onClick={() => setStep("form")}
                  className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500 transition-colors hover:text-[#8a6fdb]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to form
                </button>

                <div className={`${shellClass} space-y-8`}>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Idea
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-[#eee7f7] bg-[#fdfaff] p-4">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        {studioIdeaLabel}
                      </label>
                      <textarea
                        placeholder={studioIdeaPlaceholder}
                        className="min-h-[120px] w-full rounded-2xl border border-[#e8e0f5] bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35"
                        value={details.theme}
                        onChange={(event) =>
                          setDetails((prev) => ({ ...prev, theme: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/80 pt-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Generate Media
                  </h2>
                  {isEditingLiveCard ? (
                    <div className="rounded-[24px] border border-[#eee7f7] bg-[#fdfaff] p-4">
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Edit current image
                      </label>
                      <textarea
                        placeholder="e.g. clean up the text, reduce clutter, and soften the gold lighting"
                        className="min-h-[120px] w-full rounded-2xl border border-[#e8e0f5] bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[#b59cff] focus:outline-none focus:ring-4 focus:ring-[#cab8ff]/35"
                        value={editPrompt}
                        onChange={(event) => setEditPrompt(event.target.value)}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    <button
                      onClick={() => generateMedia("page")}
                      disabled={isGenerating}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(25,20,40,0.18)] transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:opacity-50"
                    >
                      <Layout className="h-5 w-5" />
                      {isEditingLiveCard ? "Update Invitation" : "Create Live Card"}
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>

                    <button
                      onClick={() => generateMedia("image")}
                      disabled={isGenerating}
                      className="group flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#e8e0f5] bg-white text-sm font-semibold text-neutral-900 shadow-[0_12px_30px_rgba(25,20,40,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[#faf7ff] disabled:opacity-50"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Generate Image
                      <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                  </div>
                  <p className="text-center text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Powered by Gemini 3 &amp; Veo 3.1
                  </p>
                </div>
              </aside>

              <section className="space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Studio
                    </p>
                    <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-neutral-900 sm:text-[44px]">
                      Your Studio
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>
                      {sessionStatus === "authenticated"
                        ? "Synced to your account"
                        : "Saved on this device only"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-7 md:grid-cols-2 2xl:grid-cols-5">
                  <AnimatePresence>
                    {mediaList.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={mediaCardClass}
                      >
                        <div
                          className={`relative flex items-center justify-center overflow-hidden bg-neutral-100 ${
                            item.details.orientation === "portrait"
                              ? "aspect-[9/16]"
                              : "aspect-[16/9]"
                          }`}
                        >
                          {item.status === "loading" ? (
                            <div className="flex flex-col items-center gap-4">
                              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                              <span className="animate-pulse text-xs font-bold uppercase tracking-widest text-neutral-400">
                                Processing {item.type}...
                              </span>
                            </div>
                          ) : item.status === "error" ? (
                            <div className="p-6 text-center">
                              <p className="mb-2 font-bold text-red-500">Generation Failed</p>
                              {item.errorMessage ? (
                                <p className="mb-3 text-[11px] leading-5 text-neutral-500">
                                  {item.errorMessage}
                                </p>
                              ) : null}
                              <button
                                onClick={() => generateMedia(item.type)}
                                className="text-xs text-neutral-500 underline hover:text-neutral-900"
                              >
                                Try Again
                              </button>
                            </div>
                          ) : (
                            <div className="relative h-full w-full">
                              <img
                                src={item.url}
                                alt={item.theme}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {item.status === "ready" ? (
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
                                  onClick={() => downloadMedia(item)}
                                  className={ghostIconButtonClass}
                                  title="Download"
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => shareMedia(item)}
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
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className={`${ghostIconButtonClass} text-red-500 hover:text-red-600`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div className={`absolute left-4 top-4 ${mediaBadgeClass}`}>
                            {item.type === "page" ? (
                              <>
                                <Layout className="h-3 w-3 text-green-600" />
                                Live Card
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-3 w-3 text-blue-600" />
                                Image
                              </>
                            )}
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

                    {mediaList.length === 0 ? (
                      <div className="col-span-full rounded-[32px] border border-dashed border-[#e5dbf6] bg-white/88 py-28 text-center shadow-[0_20px_55px_rgba(84,61,140,0.06)]">
                        <div className="mb-6 inline-flex rounded-full bg-[#f7f1ff] p-6 shadow-[0_10px_24px_rgba(84,61,140,0.08)]">
                          <WandSparkles className="h-12 w-12 text-[#9b82e7]" />
                        </div>
                        <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-neutral-900">
                          No media generated yet
                        </h3>
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </section>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-6"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute right-0 top-0 z-20 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-8 w-8" />
              </button>

              <div className="absolute right-0 top-16 z-10 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3">
                {renderEditImagePanel(selectedImage)}
              </div>

              <div className="group relative flex w-full justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.theme}
                  className="max-h-[80vh] max-w-full rounded-2xl border border-white/20 object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => downloadMedia(selectedImage)}
                    className="rounded-full bg-white p-4 text-neutral-900 shadow-xl transition-transform hover:scale-110"
                  >
                    <Download className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-bold text-white">{selectedImage.theme}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {selectedImage.details.category} • {selectedImage.details.eventDate}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activePageRecord?.data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-12"
          >
            <button
              onClick={() => {
                setActivePage(null);
                setActiveTab("none");
                setIsDesignMode(false);
                setIsLiveCardToolsDrawerOpen(false);
              }}
              className="absolute right-4 top-4 z-[110] rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30 md:right-8 md:top-8"
            >
              <X className="h-6 w-6" />
            </button>

            {!isLiveCardToolsDrawerOpen ? (
              <button
                type="button"
                aria-label="Open studio tools"
                onClick={() => setIsLiveCardToolsDrawerOpen(true)}
                className="fixed left-3 top-20 z-[115] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/25 md:hidden"
              >
                <PanelLeft className="h-6 w-6" />
              </button>
            ) : null}

            <div className="absolute right-4 top-20 z-[110] hidden w-[min(22rem,calc(100vw-1rem))] flex-col gap-3 md:right-8 md:top-24 md:flex">
              {renderLiveCardPreviewTools(activePageRecord)}
            </div>

            <AnimatePresence>
              {isLiveCardToolsDrawerOpen ? (
                <motion.div
                  key="live-card-tools-drawer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[112] md:hidden"
                >
                  <button
                    type="button"
                    aria-label="Close tools"
                    className="absolute inset-0 bg-black/45"
                    onClick={() => setIsLiveCardToolsDrawerOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute bottom-0 left-0 top-0 z-10 flex w-[min(22rem,88vw)] flex-col gap-3 overflow-y-auto border-r border-white/10 bg-neutral-950/97 p-4 pb-8 pt-14 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="flex shrink-0 items-center justify-between border-b border-white/10 pb-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                        Studio tools
                      </p>
                      <button
                        type="button"
                        aria-label="Close tools"
                        onClick={() => setIsLiveCardToolsDrawerOpen(false)}
                        className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                      {renderLiveCardPreviewTools(activePageRecord)}
                    </div>
                  </motion.aside>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-purple-500/20 aspect-[9/16]"
            >
              <img
                src={activePageRecord.url}
                alt={activePageRecord.theme}
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />

              <div className="pointer-events-none absolute inset-0 flex flex-col pt-8 pb-1 px-3 max-md:px-1 max-md:pt-6 max-md:pb-0.5 sm:px-4 md:p-8 md:pb-2">
                <div className="flex h-full min-h-0 flex-col justify-end">
                  <AnimatePresence>
                    {activeTab !== "none" && activeTab !== "share" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="pointer-events-auto absolute bottom-32 left-4 right-4 z-50 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl max-md:left-2 max-md:right-2 md:left-6 md:right-6"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-neutral-100 p-2 text-neutral-900">
                              {activeTab === "location" ? <MapPin className="h-5 w-5" /> : null}
                              {activeTab === "calendar" ? (
                                <CalendarDays className="h-5 w-5" />
                              ) : null}
                              {activeTab === "registry" ? <Gift className="h-5 w-5" /> : null}
                              {activeTab === "rsvp" ? <MessageSquare className="h-5 w-5" /> : null}
                              {activeTab === "details" ? (
                                <ClipboardList className="h-5 w-5" />
                              ) : null}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900">
                              {activeTab === "location" ? "Event Location" : null}
                              {activeTab === "calendar" ? "Add to Calendar" : null}
                              {activeTab === "registry" ? "Gift Registry" : null}
                              {activeTab === "rsvp" ? "RSVP" : null}
                              {activeTab === "details" ? "Overview" : null}
                            </h4>
                          </div>
                          <button
                            onClick={() => setActiveTab("none")}
                            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {activeTab === "rsvp" ? (
                            <div className="flex flex-col space-y-4">
                              <div className="space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                                <p className="text-sm font-medium text-neutral-900">
                                  {activePageRecord.data.eventDetails.rsvpName || "Host"}
                                </p>
                                {activePageRecord.data.eventDetails.rsvpContact ? (
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                      RSVP contact
                                    </p>
                                    <p className="inline-flex items-center gap-2 text-sm text-neutral-800">
                                      {activePageRsvpParsed.kind === "email" ? (
                                        <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                                      ) : activePageRsvpParsed.kind === "sms" ? (
                                        <Phone className="h-4 w-4 shrink-0 text-neutral-500" />
                                      ) : null}
                                      {activePageRecord.data.eventDetails.rsvpContact}
                                    </p>
                                  </div>
                                ) : null}
                                {activePageRecord.data.eventDetails.rsvpDeadline ? (
                                  <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                      RSVP deadline
                                    </p>
                                    <p className="text-sm text-red-600">
                                      {formatDate(activePageRecord.data.eventDetails.rsvpDeadline)}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4">
                                {LIVE_CARD_RSVP_CHOICES.map((choice) => {
                                  const href = buildLiveCardRsvpOutboundHref({
                                    rsvpContact: activePageRsvpContact,
                                    eventTitle: activePageRecord.data?.title || "Event",
                                    responseLabel: choice.label,
                                    shareUrl: studioPreviewShareUrl,
                                  });
                                  const accent = accentClassForStudioRsvpChoice(choice.key);
                                  if (!href) {
                                    return (
                                      <button
                                        key={choice.key}
                                        type="button"
                                        disabled
                                        aria-disabled="true"
                                        title={studioRsvpOutboundHint}
                                        className={`flex cursor-not-allowed items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] opacity-45 ${accent}`}
                                      >
                                        {choice.label}
                                      </button>
                                    );
                                  }
                                  return (
                                    <a
                                      key={choice.key}
                                      href={href}
                                      className={`flex items-center justify-center rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${accent}`}
                                    >
                                      {choice.label}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {activeTab === "details" ? (
                            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-2">
                              {studioDetailsWelcome ? (
                                <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700">
                                    Welcome
                                  </p>
                                  <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
                                    {studioDetailsWelcome}
                                  </p>
                                </div>
                              ) : null}
                              {clean(activePageRecord.data.eventDetails.detailsDescription) ? (
                                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                    Description
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
                                    {clean(activePageRecord.data.eventDetails.detailsDescription)}
                                  </p>
                                </div>
                              ) : null}
                              {shouldShowLiveCardDescriptionSection(
                                clean(activePageRecord.data.eventDetails.message),
                              ) &&
                              (clean(activePageRecord.data.description) ||
                                clean(activePageRecord.data.eventDetails.message)) ? (
                                <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    Description
                                  </p>
                                  <p className="mt-1 text-sm text-neutral-900">
                                    {clean(activePageRecord.data.description) ||
                                      clean(activePageRecord.data.eventDetails.message)}
                                  </p>
                                </div>
                              ) : null}
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {Object.entries(activePageRecord.data.eventDetails)
                                  .filter(([key, value]) => {
                                    if (!value || typeof value === "boolean") return false;
                                    if (Array.isArray(value)) return false;
                                    return ![
                                      "category",
                                      "name",
                                      "age",
                                      "detailsDescription",
                                      "guestImageUrls",
                                      "coupleNames",
                                      "eventDate",
                                      "startTime",
                                      "endTime",
                                      "location",
                                      "venueName",
                                      "rsvpName",
                                      "rsvpContact",
                                      "rsvpDeadline",
                                      "message",
                                      "specialInstructions",
                                      "orientation",
                                      "colors",
                                      "style",
                                      "visualPreferences",
                                      "theme",
                                      "gender",
                                    ].includes(key);
                                  })
                                  .map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                                    >
                                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/^./, (char) => char.toUpperCase())}
                                      </p>
                                      <p className="text-sm text-neutral-900">{String(value)}</p>
                                    </div>
                                  ))}
                                {activePageRecord.data.eventDetails.message ? (
                                  <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 italic">
                                    <p className="text-xs text-purple-600">
                                      "{activePageRecord.data.eventDetails.message}"
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}

                          {activeTab === "location" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">
                                {activePageRecord.data.eventDetails.venueName ||
                                  activePageRecord.data.eventDetails.location}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.eventDetails.location}
                              </p>
                              <button
                                onClick={() =>
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePageRecord.data?.eventDetails.location || "")}`,
                                    "_blank",
                                  )
                                }
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-white"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open in Maps
                              </button>
                            </>
                          ) : null}

                          {activeTab === "calendar" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">Save the Date</p>
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.eventDetails.eventDate
                                  ? formatCalendarSummary(
                                      activePageRecord.data.eventDetails.eventDate,
                                      activePageRecord.data.eventDetails.startTime,
                                    )
                                  : "Date TBD"}
                              </p>
                              <button
                                onClick={() => {
                                  const title = encodeURIComponent(
                                    activePageRecord.data?.title || "Event",
                                  );
                                  const detailsText = encodeURIComponent(
                                    activePageRecord.data?.description || "",
                                  );
                                  const location = encodeURIComponent(
                                    activePageRecord.data?.eventDetails.location || "",
                                  );
                                  const date = (
                                    activePageRecord.data?.eventDetails.eventDate || ""
                                  ).replace(/-/g, "");
                                  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${detailsText}&location=${location}&dates=${date}/${date}`;
                                  window.open(url, "_blank");
                                }}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white"
                              >
                                <CalendarDays className="h-3 w-3" />
                                Add to Google Calendar
                              </button>
                            </>
                          ) : null}

                          {activeTab === "registry" ? (
                            <>
                              <p className="text-sm font-medium text-neutral-900">Gift Registry</p>
                              {hasRegistryContent(activePageRecord.data.eventDetails) ? (
                                <p className="text-xs text-neutral-500">
                                  {getRegistryText(activePageRecord.data.eventDetails)}
                                </p>
                              ) : null}
                              <p className="text-xs text-neutral-500">
                                {activePageRecord.data.interactiveMetadata.shareNote}
                              </p>
                              {activePageRecord.data.eventDetails.registryLink ? (
                                <button
                                  onClick={() =>
                                    window.open(
                                      activePageRecord.data?.eventDetails.registryLink,
                                      "_blank",
                                    )
                                  }
                                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-2 text-xs font-bold text-white"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Visit Registry
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div
                    className="pointer-events-none max-md:min-h-[min(18svh,5.5rem)] min-h-[min(10svh,3rem)] shrink-0 md:min-h-[min(8svh,2.5rem)]"
                    aria-hidden
                  />

                  <div className="pointer-events-none z-20 flex w-full min-w-0 flex-nowrap items-end justify-center gap-2 overflow-x-auto pb-8 [scrollbar-width:none] [-ms-overflow-style:none] max-sm:justify-between max-sm:gap-0.5 max-sm:px-0 max-md:pb-6 px-1 md:gap-4 md:px-2 [&::-webkit-scrollbar]:hidden">
                    {(
                      [
                        {
                          key: "rsvp",
                          label: "RSVP",
                          icon: MessageSquare,
                          visible: Boolean(
                            activePageRecord.data.eventDetails.rsvpName ||
                              activePageRecord.data.eventDetails.rsvpContact,
                          ),
                          onClick: () => setActiveTab(activeTab === "rsvp" ? "none" : "rsvp"),
                        },
                        {
                          key: "details",
                          label: "Overview",
                          icon: ClipboardList,
                          visible: true,
                          onClick: () => setActiveTab(activeTab === "details" ? "none" : "details"),
                        },
                        {
                          key: "location",
                          label: "Location",
                          icon: MapPin,
                          visible: true,
                          onClick: () =>
                            setActiveTab(activeTab === "location" ? "none" : "location"),
                        },
                        {
                          key: "calendar",
                          label: "Calendar",
                          icon: CalendarDays,
                          visible: true,
                          onClick: () =>
                            setActiveTab(activeTab === "calendar" ? "none" : "calendar"),
                        },
                        {
                          key: "share",
                          label:
                            sharingId === activePageRecord.id
                              ? "Sharing..."
                              : copySuccess
                                ? "Copied!"
                                : "Share",
                          icon:
                            sharingId === activePageRecord.id
                              ? Loader2
                              : copySuccess
                                ? CheckCircle2
                                : Share2,
                          visible: true,
                          onClick: () => shareMedia(activePageRecord),
                        },
                        {
                          key: "registry",
                          label: "Registry",
                          icon: Gift,
                          visible: hasRegistryContent(activePageRecord.data.eventDetails),
                          onClick: () =>
                            setActiveTab(activeTab === "registry" ? "none" : "registry"),
                        },
                      ] as const
                    )
                      .filter((button) => button.visible)
                      .map((button) => {
                        const Icon = button.icon;
                        const position =
                          activePageRecord.positions?.[button.key] || EMPTY_POSITIONS[button.key];
                        return (
                          <motion.div
                            key={button.key}
                            drag={isDesignMode}
                            dragMomentum={false}
                            onDragEnd={(_, info) =>
                              updatePosition(activePageRecord.id, button.key, {
                                x: position.x + info.offset.x,
                                y: position.y + info.offset.y,
                              })
                            }
                            style={{ x: position.x, y: position.y }}
                            className="pointer-events-auto max-sm:min-w-0 max-sm:flex-1 max-sm:max-w-[20%] sm:flex-none sm:max-w-none"
                          >
                            <button
                              onClick={() => {
                                if (!isDesignMode) button.onClick();
                              }}
                              disabled={button.key === "share" && sharingId === activePageRecord.id}
                              className={`group flex w-full flex-col items-center gap-1 md:gap-2 ${isDesignMode ? "cursor-move" : ""}`}
                            >
                              <div
                                className={`rounded-full border border-white/30 bg-white/20 p-2 shadow-xl backdrop-blur-md transition-all group-hover:bg-white/40 md:p-3 ${
                                  isDesignMode ? "ring-2 ring-purple-400" : ""
                                } ${
                                  (button.key === "rsvp" && activeTab === "rsvp") ||
                                  (button.key === "details" && activeTab === "details") ||
                                  (button.key === "location" && activeTab === "location") ||
                                  (button.key === "calendar" && activeTab === "calendar") ||
                                  (button.key === "registry" && activeTab === "registry")
                                    ? "border-white/50 bg-white/40"
                                    : ""
                                }`}
                              >
                                <Icon
                                  className={`h-4 w-4 md:h-5 md:w-5 ${
                                    button.key === "share" && sharingId === activePageRecord.id
                                      ? "animate-spin text-white"
                                      : button.key === "share" && copySuccess
                                        ? "text-green-400"
                                        : "text-white"
                                  }`}
                                />
                              </div>
                              <span className="max-w-full truncate text-center text-[7px] font-bold uppercase tracking-tight text-white drop-shadow-md sm:text-[8px] sm:tracking-wider md:text-[9px] md:tracking-widest">
                                {button.label}
                              </span>
                            </button>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-purple-600/5 blur-[120px]" />
    </div>
  );
}
