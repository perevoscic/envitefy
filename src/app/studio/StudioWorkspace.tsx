"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
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
  WandSparkles,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { type TouchEvent as ReactTouchEvent, useEffect, useMemo, useRef, useState } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import { buildLiveCardDetailsWelcomeMessage } from "@/lib/live-card-event-details";
import {
  buildLiveCardRsvpOutboundHref,
  LIVE_CARD_RSVP_CHOICES,
  parseLiveCardRsvpContact,
  shouldShowLiveCardDescriptionSection,
} from "@/lib/live-card-rsvp";
import { buildEventSlug, buildStudioCardPath } from "@/utils/event-url";
import {
  formatTimeLabelEn,
  formatWeekdayMonthDayOrdinalEn,
} from "@/utils/format-month-day-ordinal";
import {
  persistImageMediaValue,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
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
  isPosterFirstLiveCardCategory,
  pickFirst,
  resolveStudioGenerationSurface,
} from "./studio-workspace-builders";
import {
  CATEGORY_FIELDS,
  EMPTY_POSITIONS,
  SHARED_BASICS,
} from "./studio-workspace-field-config";
import { createInitialDetails, sanitizeMediaItems } from "./studio-workspace-sanitize";
import type {
  ActiveTab,
  ButtonPosition,
  EventDetails,
  InviteCategory,
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
/**
 * Staged live-card / full-image edits: `previewStudioImageEdit` uploads the generated bitmap
 * (see `persistStudioLibraryImageUrl`) and stores the returned URL here only — `mediaList` is
 * unchanged until `commitStudioVisualDraft`. Design-mode drags update `positions` here as well;
 * Save applies image URL (when set and different from saved) + positions together.
 */
type StudioVisualDraft = {
  itemId: string;
  /** Persisted or data URL preview; null means keep the saved library image until commit. */
  previewImageUrl: string | null;
  positions: NonNullable<MediaItem["positions"]>;
};

function mergeStudioButtonPositions(item: MediaItem): NonNullable<MediaItem["positions"]> {
  return { ...EMPTY_POSITIONS, ...item.positions };
}

function studioVisualDraftDiffersFromSaved(item: MediaItem, draft: StudioVisualDraft): boolean {
  const preview = clean(draft.previewImageUrl);
  if (preview && preview !== clean(item.url)) return true;
  const saved = mergeStudioButtonPositions(item);
  for (const key of Object.keys(EMPTY_POSITIONS) as (keyof typeof EMPTY_POSITIONS)[]) {
    if (saved[key].x !== draft.positions[key].x || saved[key].y !== draft.positions[key].y) {
      return true;
    }
  }
  return false;
}

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

type StudioFlyerParseResponse = {
  fieldsGuess?: {
    title?: unknown;
    start?: unknown;
    end?: unknown;
    location?: unknown;
    description?: unknown;
    rsvp?: unknown;
    timezone?: unknown;
  };
  category?: unknown;
  error?: unknown;
  detail?: unknown;
};

function normalizeStudioParsedCategory(value: unknown): InviteCategory | null {
  const normalized = clean(typeof value === "string" ? value : "").toLowerCase();
  if (!normalized) return null;
  if (normalized === "birthday") return "Birthday";
  if (normalized === "wedding") return "Wedding";
  if (normalized === "baby shower") return "Baby Shower";
  if (normalized === "bridal shower") return "Bridal Shower";
  if (normalized === "anniversary") return "Anniversary";
  if (normalized === "housewarming") return "Housewarming";
  if (normalized === "field trip/day" || normalized === "field trip" || normalized === "field day") {
    return "Field Trip/Day";
  }
  if (normalized === "game day" || normalized === "sports") return "Game Day";
  if (normalized === "custom invite" || normalized === "custom") return "Custom Invite";
  return null;
}

function formatOcrIsoToInputDate(value: string, timezone: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value || "";
    const month = parts.find((part) => part.type === "month")?.value || "";
    const day = parts.find((part) => part.type === "day")?.value || "";
    return year && month && day ? `${year}-${month}-${day}` : "";
  } catch {
    return "";
  }
}

function formatOcrIsoToInputTime(value: string, timezone: string): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "America/Chicago",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parts.find((part) => part.type === "hour")?.value || "";
    const minute = parts.find((part) => part.type === "minute")?.value || "";
    return hour && minute ? `${hour}:${minute}` : "";
  } catch {
    return "";
  }
}

function extractStudioTitleHints(title: string, category: InviteCategory): Partial<EventDetails> {
  const normalizedTitle = clean(title);
  if (!normalizedTitle) return {};

  if (category === "Birthday") {
    const fullMatch = normalizedTitle.match(
      /^(.+?)'?s(?:\s+(\d{1,3})(?:st|nd|rd|th)?)?\s+birthday\b/i,
    );
    if (fullMatch) {
      return {
        name: clean(fullMatch[1]),
        age: clean(fullMatch[2]),
      };
    }
  }

  if (category === "Wedding" || category === "Anniversary") {
    const coupleNames = clean(
      normalizedTitle.replace(/\b(wedding|anniversary|celebration|party)\b.*$/i, ""),
    );
    if (coupleNames && /(&|\band\b|\+)/i.test(coupleNames)) {
      return { coupleNames };
    }
  }

  return {};
}

function mergeParsedFlyerDetails(
  current: EventDetails,
  parsed: Partial<EventDetails>,
  parsedCategory: InviteCategory | null,
): EventDetails {
  const next = { ...current };

  if (!clean(next.eventTitle) && clean(parsed.eventTitle)) {
    next.eventTitle = clean(parsed.eventTitle);
  }
  if (!clean(next.eventDate) && clean(parsed.eventDate)) {
    next.eventDate = clean(parsed.eventDate);
  }
  if (!clean(next.startTime) && clean(parsed.startTime)) {
    next.startTime = clean(parsed.startTime);
  }
  if (!clean(next.endTime) && clean(parsed.endTime)) {
    next.endTime = clean(parsed.endTime);
  }
  if (!clean(next.location) && clean(parsed.location)) {
    next.location = clean(parsed.location);
  }
  if (!clean(next.detailsDescription) && clean(parsed.detailsDescription)) {
    next.detailsDescription = clean(parsed.detailsDescription);
  }
  if (!clean(next.rsvpContact) && clean(parsed.rsvpContact)) {
    next.rsvpContact = clean(parsed.rsvpContact);
  }

  const titleHints = extractStudioTitleHints(
    clean(parsed.eventTitle),
    parsedCategory || current.category,
  );
  if (!clean(next.name) && clean(titleHints.name)) {
    next.name = clean(titleHints.name);
  }
  if (!clean(next.age) && clean(titleHints.age)) {
    next.age = clean(titleHints.age);
  }
  if (!clean(next.coupleNames) && clean(titleHints.coupleNames)) {
    next.coupleNames = clean(titleHints.coupleNames);
  }

  return next;
}

async function parseStudioFlyerDetails(file: File): Promise<{
  parsedDetails: Partial<EventDetails>;
  parsedCategory: InviteCategory | null;
}> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/ocr?fast=0", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as StudioFlyerParseResponse | null;
  if (!response.ok) {
    const message =
      clean(typeof payload?.error === "string" ? payload.error : "") ||
      clean(typeof payload?.detail === "string" ? payload.detail : "") ||
      `Flyer parsing failed with status ${response.status}.`;
    throw new Error(message);
  }

  const guessed = isRecord(payload?.fieldsGuess) ? payload?.fieldsGuess : null;
  const timezone =
    clean(typeof guessed?.timezone === "string" ? guessed.timezone : "") ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "America/Chicago";
  const startValue = clean(typeof guessed?.start === "string" ? guessed.start : "");
  const endValue = clean(typeof guessed?.end === "string" ? guessed.end : "");

  return {
    parsedCategory: normalizeStudioParsedCategory(payload?.category),
    parsedDetails: {
      eventTitle: clean(typeof guessed?.title === "string" ? guessed.title : ""),
      eventDate: startValue ? formatOcrIsoToInputDate(startValue, timezone) : "",
      startTime: startValue ? formatOcrIsoToInputTime(startValue, timezone) : "",
      endTime: endValue ? formatOcrIsoToInputTime(endValue, timezone) : "",
      location: clean(typeof guessed?.location === "string" ? guessed.location : ""),
      detailsDescription: clean(
        typeof guessed?.description === "string" ? guessed.description : "",
      ),
      rsvpContact: clean(typeof guessed?.rsvp === "string" ? guessed.rsvp : ""),
    },
  };
}

const STUDIO_MOBILE_TOP_CHROME = "3rem + max(0.5rem, env(safe-area-inset-top, 0px)) + 0.75rem";
const STUDIO_MOBILE_BOTTOM_CHROME = "max(0.75rem, env(safe-area-inset-bottom, 0px)) + 0.5rem";

function getStudioGalleryItemsPerPage(viewportWidth: number) {
  if (viewportWidth >= 1536) return 10;
  if (viewportWidth >= 1024) return 6;
  return 4;
}

export default function StudioWorkspace() {
  const { status: sessionStatus } = useSession();
  const [step, setStep] = useState<StudioStep>("category");
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [studioVisualDraft, setStudioVisualDraft] = useState<StudioVisualDraft | null>(null);
  const [isLiveCardToolsDrawerOpen, setIsLiveCardToolsDrawerOpen] = useState(false);
  const [isDesktopLiveCardViewport, setIsDesktopLiveCardViewport] = useState(false);
  const [studioGalleryPage, setStudioGalleryPage] = useState(0);
  const [studioGalleryDirection, setStudioGalleryDirection] = useState<1 | -1>(1);
  const [studioGalleryItemsPerPage, setStudioGalleryItemsPerPage] = useState(10);
  const [isFlyerUploading, setIsFlyerUploading] = useState(false);
  const [isSubjectPhotoUploading, setIsSubjectPhotoUploading] = useState(false);
  const [flyerUploadError, setFlyerUploadError] = useState<string | null>(null);
  const [subjectPhotoUploadError, setSubjectPhotoUploadError] = useState<string | null>(null);
  const studioGalleryTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const editingMediaItem = useMemo(
    () => (editingId ? (mediaList.find((item) => item.id === editingId) ?? null) : null),
    [editingId, mediaList],
  );

  const isEditingLiveCard = editingMediaItem?.type === "page";
  const editingLiveCardHeroTextMode = editingMediaItem?.data?.heroTextMode;

  const activePageRecord = useMemo(
    () => mediaList.find((item) => item.id === activePage?.id) ?? activePage,
    [activePage, mediaList],
  );
  const studioGalleryPageCount = Math.max(
    1,
    Math.ceil(mediaList.length / Math.max(1, studioGalleryItemsPerPage)),
  );
  const studioGalleryWindowStart = studioGalleryPage * studioGalleryItemsPerPage;
  const studioGalleryVisibleItems = useMemo(
    () =>
      mediaList.slice(
        studioGalleryWindowStart,
        studioGalleryWindowStart + studioGalleryItemsPerPage,
      ),
    [mediaList, studioGalleryItemsPerPage, studioGalleryWindowStart],
  );
  const studioGalleryVisibleRangeLabel =
    mediaList.length > 0
      ? `${studioGalleryWindowStart + 1}-${Math.min(
          studioGalleryWindowStart + studioGalleryVisibleItems.length,
          mediaList.length,
        )}`
      : "0-0";

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
  const studioLiveCardModalStyle = isDesktopLiveCardViewport
    ? undefined
    : {
        paddingTop: `calc(${STUDIO_MOBILE_TOP_CHROME} + 0.25rem)`,
        paddingBottom: `calc(${STUDIO_MOBILE_BOTTOM_CHROME})`,
      };
  const studioLiveCardFrameStyle = isDesktopLiveCardViewport
    ? undefined
    : {
        maxHeight: `calc(100dvh - (${STUDIO_MOBILE_TOP_CHROME}) - (${STUDIO_MOBILE_BOTTOM_CHROME}))`,
        width: `min(100%, calc((100dvh - (${STUDIO_MOBILE_TOP_CHROME}) - (${STUDIO_MOBILE_BOTTOM_CHROME})) * 9 / 16))`,
      };
  const studioLiveCardControlTop = isDesktopLiveCardViewport
    ? undefined
    : `calc(${STUDIO_MOBILE_TOP_CHROME} + 0.25rem)`;
  const activePageUsesPosterControls =
    activePageRecord?.type === "page" &&
    activePageRecord?.data?.heroTextMode === "image" &&
    isPosterFirstLiveCardCategory(
      clean(activePageRecord.data?.eventDetails.category) || clean(activePageRecord.details.category),
    );

  useEffect(() => {
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
  }, [selectedImage?.id, activePageRecord?.id, editingMediaItem?.id]);

  useEffect(() => {
    if (!activePageRecord?.data) {
      setIsLiveCardToolsDrawerOpen(false);
      setIsDesktopLiveCardViewport(false);
      return;
    }
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncLiveCardViewport = () => {
      const matches = mediaQuery.matches;
      setIsDesktopLiveCardViewport(matches);
      setIsLiveCardToolsDrawerOpen((current) => (matches ? true : current));
    };

    syncLiveCardViewport();
    const onChange = () => syncLiveCardViewport();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }
    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, [activePageRecord?.id, activePageRecord?.data]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStudioGalleryItemsPerPage = () => {
      setStudioGalleryItemsPerPage(getStudioGalleryItemsPerPage(window.innerWidth));
    };

    syncStudioGalleryItemsPerPage();
    window.addEventListener("resize", syncStudioGalleryItemsPerPage);
    return () => window.removeEventListener("resize", syncStudioGalleryItemsPerPage);
  }, []);

  useEffect(() => {
    setStudioGalleryPage((current) => Math.min(current, Math.max(0, studioGalleryPageCount - 1)));
  }, [studioGalleryPageCount]);

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

  useEffect(() => {
    if (activeTab === "none" || activeTab === "share") return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-live-card-panel]") || target.closest("[data-live-card-trigger]")) {
        return;
      }
      setActiveTab("none");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [activeTab]);

  function isFormValid() {
    const missingShared = SHARED_BASICS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingShared.length > 0) return false;

    if (details.sourceMediaMode === "flyer" && clean(details.sourceFlyerUrl)) {
      return true;
    }

    const missingCategory = (CATEGORY_FIELDS[details.category] || []).filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    return missingCategory.length === 0;
  }

  async function handleUploadFlyer(file: File) {
    const validationError = validateClientUploadFile(file, "header");
    if (validationError) {
      setFlyerUploadError(validationError);
      return;
    }

    setIsFlyerUploading(true);
    setFlyerUploadError(null);
    setSubjectPhotoUploadError(null);

    try {
      const [uploadResult, parseResult] = await Promise.allSettled([
        uploadMediaFile({ file, usage: "header" }),
        parseStudioFlyerDetails(file),
      ]);

      if (uploadResult.status !== "fulfilled") {
        throw uploadResult.reason instanceof Error
          ? uploadResult.reason
          : new Error("Unable to upload the flyer.");
      }

      const flyerUrl =
        clean(uploadResult.value.stored.display?.url) ||
        clean(uploadResult.value.eventMedia.thumbnail) ||
        "";
      const flyerPreviewUrl =
        clean(uploadResult.value.stored.thumb?.url) ||
        clean(uploadResult.value.stored.display?.url) ||
        clean(uploadResult.value.eventMedia.thumbnail) ||
        "";

      if (!flyerUrl) {
        throw new Error("Unable to prepare the uploaded flyer.");
      }

      setDetails((prev) => {
        const nextBase: EventDetails = {
          ...prev,
          sourceMediaMode: "flyer",
          sourceFlyerUrl: flyerUrl,
          sourceFlyerName: file.name,
          sourceFlyerPreviewUrl: flyerPreviewUrl || flyerUrl,
          guestImageUrls: [],
        };
        if (parseResult.status !== "fulfilled") {
          return nextBase;
        }
        return mergeParsedFlyerDetails(
          nextBase,
          parseResult.value.parsedDetails,
          parseResult.value.parsedCategory,
        );
      });

      if (parseResult.status !== "fulfilled") {
        setFlyerUploadError(
          "Flyer uploaded, but details could not be read. Fill the fields manually if needed.",
        );
      }
    } catch (error) {
      setFlyerUploadError(
        error instanceof Error && clean(error.message)
          ? clean(error.message)
          : "Unable to upload that flyer right now.",
      );
    } finally {
      setIsFlyerUploading(false);
    }
  }

  function handleRemoveFlyer() {
    setFlyerUploadError(null);
    setDetails((prev) => ({
      ...prev,
      sourceMediaMode: prev.guestImageUrls.length > 0 ? "subjectPhotos" : "none",
      sourceFlyerUrl: "",
      sourceFlyerName: "",
      sourceFlyerPreviewUrl: "",
    }));
  }

  async function handleUploadSubjectPhotos(files: File[]) {
    if (!files.length) return;

    setIsSubjectPhotoUploading(true);
    setSubjectPhotoUploadError(null);
    setFlyerUploadError(null);

    try {
      const existingUrls =
        details.sourceMediaMode === "subjectPhotos"
          ? details.guestImageUrls.filter((url) => clean(url))
          : [];
      const availableSlots = Math.max(0, STUDIO_GUEST_IMAGE_URL_MAX - existingUrls.length);
      if (availableSlots <= 0) {
        throw new Error(`You can add up to ${STUDIO_GUEST_IMAGE_URL_MAX} photos.`);
      }

      const nextUploads = files.slice(0, availableSlots);
      const uploadedUrls: string[] = [];

      for (const file of nextUploads) {
        const validationError = validateClientUploadFile(file, "header");
        if (validationError) {
          throw new Error(validationError);
        }
        const upload = await uploadMediaFile({ file, usage: "header" });
        const url = clean(upload.stored.display?.url) || clean(upload.eventMedia.thumbnail) || "";
        if (!url) {
          throw new Error("A photo upload completed without a usable image URL.");
        }
        uploadedUrls.push(url);
      }

      setDetails((prev) => {
        const currentUrls =
          prev.sourceMediaMode === "subjectPhotos"
            ? prev.guestImageUrls.filter((url) => clean(url))
            : [];
        return {
          ...prev,
          sourceMediaMode: "subjectPhotos",
          sourceFlyerUrl: "",
          sourceFlyerName: "",
          sourceFlyerPreviewUrl: "",
          guestImageUrls: [...currentUrls, ...uploadedUrls].slice(0, STUDIO_GUEST_IMAGE_URL_MAX),
        };
      });
    } catch (error) {
      setSubjectPhotoUploadError(
        error instanceof Error && clean(error.message)
          ? clean(error.message)
          : "Unable to upload those photos right now.",
      );
    } finally {
      setIsSubjectPhotoUploading(false);
    }
  }

  function handleRemoveSubjectPhoto(index: number) {
    setSubjectPhotoUploadError(null);
    setDetails((prev) => {
      const nextUrls = prev.guestImageUrls.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        guestImageUrls: nextUrls,
        sourceMediaMode: nextUrls.length > 0 ? "subjectPhotos" : "none",
      };
    });
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

  function getMediaPreviewUrl(item: MediaItem) {
    return clean(item.url) || getFallbackThumbnail(item.details);
  }

  function getStudioImageDisplayUrl(item: MediaItem) {
    if (studioVisualDraft?.itemId === item.id && clean(studioVisualDraft.previewImageUrl)) {
      return studioVisualDraft.previewImageUrl as string;
    }
    return getMediaPreviewUrl(item);
  }

  const liveCardInteractionLayout = useMemo(() => {
    if (!activePageRecord?.data) return null;
    const item = activePageRecord;
    const draft = studioVisualDraft;
    if (!draft || draft.itemId !== item.id) {
      return {
        imageUrl: getMediaPreviewUrl(item),
        positions: mergeStudioButtonPositions(item),
      };
    }
    return {
      imageUrl: draft.previewImageUrl ? draft.previewImageUrl : getMediaPreviewUrl(item),
      positions: draft.positions,
    };
  }, [activePageRecord, studioVisualDraft]);

  function handleMediaImageLoadError(item: MediaItem) {
    const fallbackUrl = getFallbackThumbnail(item.details);
    if (clean(item.url) === fallbackUrl) return;
    patchMediaItem(item.id, { url: fallbackUrl });
  }

  function beginLiveCardDetailEdit(item: MediaItem) {
    setDetails(item.details);
    setEditingId(item.id);
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setActiveTab("none");
    setIsDesignMode(false);
    setActivePage(null);
    setStep("form");
  }

  function openLiveCardEditor(item: MediaItem) {
    beginLiveCardDetailEdit(item);
  }

  function openLiveCardImageEdit(item: MediaItem) {
    setIsLiveCardToolsDrawerOpen(true);
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
    const savedItem = mediaList.find((item) => item.id === id) ?? null;
    if (!savedItem) return;
    setStudioVisualDraft((prev) => {
      const base = mergeStudioButtonPositions(savedItem);
      const nextPositions =
        prev?.itemId === id
          ? { ...prev.positions, [buttonKey]: point }
          : { ...base, [buttonKey]: point };
      return {
        itemId: id,
        positions: nextPositions,
        previewImageUrl: prev?.itemId === id ? (prev.previewImageUrl ?? null) : null,
      };
    });
  }

  async function generateMedia(type: MediaType) {
    const currentDetails = { ...details };
    const targetId = editingId ?? createId();
    const existingItem = editingId
      ? (mediaList.find((item) => item.id === editingId) ?? null)
      : null;
    const generationSurface = resolveStudioGenerationSurface(currentDetails, type, {
      existingItemType: existingItem?.type,
    });
    const sourceImageDataUrl =
      clean(existingItem?.url) ||
      (currentDetails.sourceMediaMode === "flyer" ? clean(currentDetails.sourceFlyerUrl) : "");
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
        generationSurface,
        sourceImageDataUrl ? editPrompt : undefined,
        sourceImageDataUrl || undefined,
      );
      const generatedDetails = response.preparedDetails || currentDetails;
      const rawUrl =
        response.imageDataUrl || existingItem?.url || getFallbackThumbnail(currentDetails);
      const persistedUrl = await persistStudioLibraryImageUrl(
        { ...loadingItem, status: "ready", url: rawUrl },
        rawUrl,
      );
      const nextItem: MediaItem = {
        ...loadingItem,
        status: "ready",
        details: generatedDetails,
        url: persistedUrl || rawUrl,
        data: type === "page" ? buildInvitationData(generatedDetails, response) : undefined,
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

  async function previewStudioImageEdit(item: MediaItem) {
    const prompt = clean(editPrompt);
    if (!prompt) {
      if (typeof window !== "undefined") {
        window.alert("Add an edit prompt first.");
      }
      return;
    }

    const savedItem = mediaList.find((media) => media.id === item.id) ?? item;
    const sourceImageDataUrl = clean(savedItem.url);
    if (!sourceImageDataUrl) {
      if (typeof window !== "undefined") {
        window.alert("The current image is not available to edit.");
      }
      return;
    }

    try {
      setApplyingEditId(item.id);
      const response = await requestStudioGeneration(
        savedItem.details,
        "image",
        "page",
        prompt,
        sourceImageDataUrl,
      );

      const rawEditUrl = response.imageDataUrl || savedItem.url;
      const persistedEditUrl = await persistStudioLibraryImageUrl(
        { ...savedItem, url: rawEditUrl },
        rawEditUrl,
      );
      const nextUrl = clean(persistedEditUrl || rawEditUrl) || null;
      if (!nextUrl) {
        if (typeof window !== "undefined") {
          window.alert("The preview did not return an image. Try a different prompt.");
        }
        return;
      }
      setStudioVisualDraft((prev) => {
        const merged = mergeStudioButtonPositions(savedItem);
        if (prev?.itemId === item.id) {
          return { ...prev, previewImageUrl: nextUrl };
        }
        return {
          itemId: item.id,
          previewImageUrl: nextUrl,
          positions: merged,
        };
      });
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

  function commitStudioVisualDraft(item: MediaItem) {
    const draft = studioVisualDraft;
    if (!draft || draft.itemId !== item.id) return;
    const savedItem = mediaList.find((media) => media.id === item.id) ?? item;
    const patch: Partial<MediaItem> = { positions: draft.positions };
    const preview = clean(draft.previewImageUrl);
    if (preview && preview !== clean(savedItem.url)) {
      patch.url = preview;
      patch.sharePath = undefined;
      patch.errorMessage = undefined;
    }
    patchMediaItem(item.id, { ...patch, status: "ready" });
    setStudioVisualDraft(null);
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setIsDesignMode(false);
  }

  function discardStudioVisualDraft() {
    setStudioVisualDraft(null);
  }

  function renderEditImagePanel(
    item: MediaItem,
    options: { layout: "liveCardTools" | "standalone" },
  ) {
    const { layout } = options;
    const savedItem = mediaList.find((media) => media.id === item.id) ?? item;
    const draftMatches = studioVisualDraft?.itemId === item.id;
    const hasPendingVisualChanges =
      draftMatches && studioVisualDraft
        ? studioVisualDraftDiffersFromSaved(savedItem, studioVisualDraft)
        : false;

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
              placeholder="e.g. soften the gold lighting, simplify the florals, and keep the same composition"
              className="min-h-[104px] w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9b49a]/40"
            />
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void previewStudioImageEdit(item)}
                  disabled={applyingEditId === item.id}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 disabled:cursor-wait disabled:opacity-70"
                >
                  {applyingEditId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <WandSparkles className="h-4 w-4" />
                  )}
                  Preview edit
                </button>
              </div>
              {layout === "liveCardTools" ? (
                <p className="text-center text-[10px] leading-relaxed text-white/50">
                  Save or discard below to apply image and Design mode button moves together.
                </p>
              ) : null}
              {layout === "standalone" && hasPendingVisualChanges ? (
                <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => discardStudioVisualDraft()}
                    className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => commitStudioVisualDraft(item)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
                  >
                    Save changes
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderLiveCardPreviewTools(page: MediaItem) {
    const savedPage = mediaList.find((media) => media.id === page.id) ?? page;
    const showVisualSaveBar =
      studioVisualDraft?.itemId === page.id &&
      studioVisualDraftDiffersFromSaved(savedPage, studioVisualDraft);

    return (
      <>
        {renderEditImagePanel(page, { layout: "liveCardTools" })}

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
            className={`relative h-7 w-14 rounded-full transition-all ${isDesignMode ? "bg-[#8C7B65]" : "bg-neutral-700"}`}
          >
            <motion.div
              animate={{ x: isDesignMode ? 28 : 4 }}
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-lg"
            />
          </button>
        </div>

        {showVisualSaveBar ? (
          <div className="pointer-events-auto rounded-2xl border border-amber-300/45 bg-amber-500/15 px-4 py-3 backdrop-blur-md">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-100/95">
              Unsaved image or layout
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => discardStudioVisualDraft()}
                className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => commitStudioVisualDraft(page)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                Save changes
              </button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  function goToStudioGalleryPage(nextPage: number) {
    const clamped = Math.max(0, Math.min(nextPage, studioGalleryPageCount - 1));
    if (clamped === studioGalleryPage) return;
    setStudioGalleryDirection(clamped > studioGalleryPage ? 1 : -1);
    setStudioGalleryPage(clamped);
  }

  function handleStudioGalleryTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    if (!touch) return;
    studioGalleryTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleStudioGalleryTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const start = studioGalleryTouchStartRef.current;
    studioGalleryTouchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      goToStudioGalleryPage(studioGalleryPage + 1);
      return;
    }
    goToStudioGalleryPage(studioGalleryPage - 1);
  }

  const studioIdeaLabel = getStudioIdeaLabel(details.category);
  const studioIdeaPlaceholder = getStudioIdeaPlaceholder(details.category);
  const activeEditorialTab = step === "studio" ? "studio" : step === "library" ? "library" : "details";
  const shellClass = studioWorkspaceShellClass;
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;
  const ghostIconButtonClass = studioWorkspaceGhostIconButtonClass;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F2EF] text-[#1A1A1A] selection:bg-[#e7d9c8]">
      <div className="pointer-events-none absolute -left-[180px] -top-[180px] h-[430px] w-[430px] rounded-full border border-[#8C7B65]/10" />
      <div className="pointer-events-none absolute inset-y-0 right-6 hidden items-center py-12 lg:flex">
        <span className="[writing-mode:vertical-rl] text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8C7B65]/35">
          EST. MMXXIV - PRIVATE INQUIRY
        </span>
      </div>

      {sessionStatus === "authenticated" && librarySyncError ? (
        <div
          role="status"
          className="border-b border-[#d9c7ab] bg-[#f5eadc] px-5 py-3 text-center text-sm text-[#5F5345] sm:px-6"
        >
          <span>{librarySyncError}</span>
          <button
            type="button"
            onClick={retryLibrarySync}
            className="ml-2 font-semibold text-[#1A1A1A] underline decoration-[#8C7B65]/60 underline-offset-2 hover:text-[#4A4036]"
          >
            Retry sync
          </button>
        </div>
      ) : null}

      {step === "category" ? (
        <main className="relative mx-auto w-full max-w-[1500px] px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <StudioCategoryStep details={details} setDetails={setDetails} setStep={setStep} />
        </main>
      ) : (
        <main className="relative mx-auto w-full max-w-[1600px] px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(210px,0.72fr)_minmax(0,1.88fr)] lg:gap-16 xl:gap-20">
            <aside className="flex flex-col gap-8 lg:min-h-[720px] lg:justify-between lg:gap-0">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setStep("category");
                    }}
                    className="mb-5 text-[#8C7B65] transition-colors hover:text-[#1A1A1A]"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8C7B65]">
                    {details.category}
                  </p>
                </motion.div>

                <nav className="flex flex-col items-start gap-4">
                  {[
                    { id: "details", label: "Details" as const },
                    { id: "studio", label: "Studio" as const },
                    { id: "library", label: "Library" as const },
                  ].map((tab) => {
                    const isActive = activeEditorialTab === tab.id;
                    const isDisabled = tab.id === "studio" && !isFormValid();
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          if (tab.id === "details") {
                            setStep("form");
                            return;
                          }
                          if (tab.id === "studio") {
                            if (isFormValid()) setStep("studio");
                            return;
                          }
                          setStep("library");
                        }}
                        disabled={isDisabled}
                        className={`text-left text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                          isActive
                            ? "translate-x-4 text-[#1A1A1A]"
                            : "text-[#8C7B65]/55 hover:translate-x-2 hover:text-[#8C7B65]"
                        } ${isDisabled ? "cursor-not-allowed opacity-45 hover:translate-x-0" : ""}`}
                      >
                        <span className="flex items-center gap-2">
                          {isActive ? <span className="h-px w-8 bg-[#1A1A1A]" /> : null}
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="hidden max-w-[250px] text-[11px] uppercase tracking-[0.16em] leading-relaxed text-[#8C7B65] lg:block"
              >
                Every exceptional journey begins with a single, intentional conversation.
              </motion.p>
            </aside>

            <section className="min-w-0">
              <AnimatePresence mode="wait">
                {step === "form" ? (
                  <StudioFormStep
                    details={details}
                    setDetails={setDetails}
                    setStep={setStep}
                    isFormValid={isFormValid}
                    editingId={editingId}
                    onUploadFlyer={handleUploadFlyer}
                    onRemoveFlyer={handleRemoveFlyer}
                    onUploadSubjectPhotos={handleUploadSubjectPhotos}
                    onRemoveSubjectPhoto={handleRemoveSubjectPhoto}
                    isFlyerUploading={isFlyerUploading}
                    isSubjectPhotoUploading={isSubjectPhotoUploading}
                    flyerUploadError={flyerUploadError}
                    subjectPhotoUploadError={subjectPhotoUploadError}
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
                    downloadMedia={downloadMedia}
                    shareMedia={shareMedia}
                    sharingId={sharingId}
                    copySuccess={copySuccess}
                    deleteMedia={deleteMedia}
                    handleMediaImageLoadError={handleMediaImageLoadError}
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
                  className="hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to form
                </button>

                <div className="space-y-6 lg:pt-[5.25rem]">
                  <div className={`${shellClass} space-y-3`}>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                      {studioIdeaLabel}
                    </label>
                    <textarea
                      placeholder={studioIdeaPlaceholder}
                      className="min-h-[120px] w-full resize-none border-0 border-b border-[#1A1A1A]/18 bg-transparent px-0 py-2 font-[var(--font-playfair)] text-2xl text-[#1A1A1A] transition-colors focus:border-[#1A1A1A] focus:outline-none focus:ring-0 [&::placeholder]:text-[rgba(26,26,26,0.1)] [&::placeholder]:italic [&::placeholder]:opacity-100"
                      value={details.theme}
                      onChange={(event) =>
                        setDetails((prev) => ({ ...prev, theme: event.target.value }))
                      }
                    />
                    <p className="text-sm leading-7 text-[#6B5E4E]">
                      Describe your invitation in your own words. We&apos;ll generate it for you.
                    </p>
                  </div>

                  <div className="space-y-4 border-t border-[#1A1A1A]/8 pt-6">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                      Generate Media
                    </h2>
                    {isEditingLiveCard ? (
                      <div className="rounded-[1.5rem] border border-[#d8cdc0]/85 bg-[#fbf8f4] p-4">
                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                          {editingLiveCardHeroTextMode === "image"
                            ? "Edit current invitation art"
                            : "Edit current background"}
                        </label>
                        <textarea
                          placeholder="e.g. soften the gold lighting, simplify the florals, and keep the same composition"
                          className="min-h-[120px] w-full resize-none border-0 border-b border-[#1A1A1A]/18 bg-transparent px-0 py-2 font-[var(--font-playfair)] text-2xl text-[#1A1A1A] transition-colors focus:border-[#1A1A1A] focus:outline-none focus:ring-0 [&::placeholder]:text-[rgba(26,26,26,0.1)] [&::placeholder]:italic [&::placeholder]:opacity-100"
                          value={editPrompt}
                          onChange={(event) => setEditPrompt(event.target.value)}
                        />
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      <button
                        onClick={() => generateMedia("page")}
                        disabled={isGenerating}
                        className="group flex h-14 w-full items-center justify-center gap-3 bg-[#1A1A1A] px-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F5F2EF] shadow-[0_20px_50px_rgba(26,26,26,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#262626] disabled:opacity-50"
                      >
                        <Layout className="h-5 w-5" />
                        {isEditingLiveCard ? "Update Invitation" : "Create Live Card"}
                        <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                      </button>

                      <button
                        onClick={() => generateMedia("image")}
                        disabled={isGenerating}
                        className="group flex h-14 w-full items-center justify-center gap-3 border border-[#d8cdc0] bg-[#fbf8f4] text-[10px] font-semibold uppercase tracking-[0.28em] text-[#1A1A1A] shadow-[0_12px_30px_rgba(49,32,17,0.08)] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:opacity-50"
                      >
                        <ImageIcon className="h-5 w-5" />
                        Generate Image
                        <ChevronRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="space-y-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8C7B65]">
                      Studio
                    </p>
                    <h2 className="font-[var(--font-playfair)] text-4xl tracking-[-0.03em] text-[#1A1A1A] sm:text-[44px]">
                      Your Studio
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#d9c7ab] bg-[#fbf5ee] px-4 py-2 text-sm font-medium text-[#5F5345]">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>
                      {sessionStatus === "authenticated"
                        ? "Synced to your account"
                        : "Saved on this device only"}
                    </span>
                  </div>
                </div>

                {mediaList.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-[1.75rem] border border-[#d8cdc0]/85 bg-[#fbf8f4]/95 px-4 py-4 shadow-[0_18px_44px_rgba(49,32,17,0.06)] backdrop-blur-xl sm:px-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d9ca] bg-[#f8f3ed] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5F5345]">
                            <span>{studioGalleryVisibleRangeLabel}</span>
                            <span className="text-[#8C7B65]/45">/</span>
                            <span>{mediaList.length}</span>
                          </div>
                          {studioGalleryPageCount > 1 ? (
                            <p className="text-xs text-[#8C7B65] max-sm:hidden">
                              {studioGalleryPage + 1} of {studioGalleryPageCount}
                            </p>
                          ) : null}
                        </div>

                        {studioGalleryPageCount > 1 ? (
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <p className="text-xs text-[#8C7B65] sm:hidden">Swipe to browse</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => goToStudioGalleryPage(studioGalleryPage - 1)}
                                disabled={studioGalleryPage === 0}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5d9ca] bg-[#f8f3ed] text-[#5F5345] shadow-[0_10px_26px_rgba(49,32,17,0.08)] transition-all hover:-translate-x-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="Show previous studio cards"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => goToStudioGalleryPage(studioGalleryPage + 1)}
                                disabled={studioGalleryPage >= studioGalleryPageCount - 1}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5d9ca] bg-[#f8f3ed] text-[#5F5345] shadow-[0_10px_26px_rgba(49,32,17,0.08)] transition-all hover:translate-x-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="Show more studio cards"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {studioGalleryPageCount > 1 ? (
                        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {Array.from({ length: studioGalleryPageCount }, (_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => goToStudioGalleryPage(index)}
                              aria-label={`Show studio page ${index + 1}`}
                              aria-pressed={index === studioGalleryPage}
                              className={`h-2.5 rounded-full transition-all ${
                                index === studioGalleryPage
                                  ? "w-10 bg-[#1A1A1A]"
                                  : "w-2.5 bg-[#d8c9b9] hover:bg-[#c7b39e]"
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className="relative overflow-hidden"
                      onTouchStart={handleStudioGalleryTouchStart}
                      onTouchEnd={handleStudioGalleryTouchEnd}
                    >
                      {studioGalleryPageCount > 1 ? (
                        <>
                          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#F5F2EF] via-[#F5F2EF]/78 to-transparent" />
                          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#F5F2EF] via-[#F5F2EF]/78 to-transparent" />
                        </>
                      ) : null}

                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${studioGalleryPage}-${studioGalleryItemsPerPage}`}
                          initial={{ opacity: 0, x: studioGalleryDirection > 0 ? 48 : -48 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: studioGalleryDirection > 0 ? -48 : 48 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="grid grid-cols-2 gap-3 md:gap-7 lg:grid-cols-3 2xl:grid-cols-5"
                        >
                          {studioGalleryVisibleItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className={mediaCardClass}
                            >
                              <div
                                className={`relative flex items-center justify-center overflow-hidden bg-[#efe7dc] ${
                                  item.details.orientation === "portrait"
                                    ? "aspect-[9/16]"
                                    : "aspect-[16/9]"
                                }`}
                              >
                                {item.status === "loading" ? (
                                  <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#8C7B65]" />
                                    <span className="animate-pulse text-xs font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                                      Processing {item.type}...
                                    </span>
                                  </div>
                                ) : item.status === "error" ? (
                                  <div className="p-6 text-center">
                                      <p className="mb-2 font-semibold text-red-600">Generation Failed</p>
                                    {item.errorMessage ? (
                                      <p className="mb-3 text-[11px] leading-5 text-[#6B5E4E]">
                                        {item.errorMessage}
                                      </p>
                                    ) : null}
                                    <button
                                      onClick={() => generateMedia(item.type)}
                                      className="text-xs text-[#5F5345] underline hover:text-[#1A1A1A]"
                                    >
                                      Try Again
                                    </button>
                                  </div>
                                ) : (
                                  <div className="relative h-full w-full">
                                    <img
                                      src={getMediaPreviewUrl(item)}
                                      alt={item.theme}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                      referrerPolicy="no-referrer"
                                      onError={() => handleMediaImageLoadError(item)}
                                    />
                                  </div>
                                )}

                                {item.status === "ready" ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(27,20,15,0.12),rgba(27,20,15,0.58))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                    {item.type === "page" ? (
                                      <button
                                        onClick={() => setActivePage(item)}
                                        className="flex items-center gap-2 rounded-full bg-[#fbf8f4] px-6 py-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_14px_34px_rgba(49,32,17,0.18)] transition-transform hover:scale-[1.02]"
                                      >
                                        <Layout className="h-5 w-5" />
                                        Open Live Card
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setSelectedImage(item)}
                                        className="flex items-center gap-2 rounded-full bg-[#fbf8f4] px-6 py-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_14px_34px_rgba(49,32,17,0.18)] transition-transform hover:scale-[1.02]"
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
                                          <Layout className="h-3 w-3 text-emerald-600" />
                                      Live Card
                                    </>
                                  ) : (
                                    <>
                                          <ImageIcon className="h-3 w-3 text-sky-600" />
                                      Image
                                    </>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteMedia(item.id)}
                                  className="absolute right-4 top-4 rounded-full border border-[#efe4d7] bg-[#f8f3ed] p-2.5 text-[#5F5345] shadow-[0_10px_24px_rgba(49,32,17,0.12)] transition-all hover:bg-[#fffdf9] hover:text-red-500"
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
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-[#d8cdc0] bg-[#fbf8f4] py-28 text-center shadow-[0_20px_55px_rgba(49,32,17,0.05)]">
                    <div className="mb-6 inline-flex rounded-full bg-[#f0e7db] p-6 shadow-[0_10px_24px_rgba(49,32,17,0.08)]">
                      <WandSparkles className="h-12 w-12 text-[#8C7B65]" />
                    </div>
                    <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                      No media generated yet
                    </h3>
                  </div>
                )}
              </section>
            </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          </div>
        </main>
      )}

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
                {renderEditImagePanel(selectedImage, { layout: "standalone" })}
              </div>

              <div className="group relative flex w-full justify-center">
                <img
                  src={getStudioImageDisplayUrl(selectedImage)}
                  alt={selectedImage.theme}
                  className="max-h-[80vh] max-w-full rounded-2xl border border-white/20 object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (!selectedImage) return;
                    setStudioVisualDraft((prev) => {
                      if (
                        !prev ||
                        prev.itemId !== selectedImage.id ||
                        !clean(prev.previewImageUrl)
                      ) {
                        handleMediaImageLoadError(selectedImage);
                        return prev;
                      }
                      return { ...prev, previewImageUrl: null };
                    });
                  }}
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
            style={studioLiveCardModalStyle}
          >
            <button
              onClick={() => {
                discardStudioVisualDraft();
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
                className="fixed right-3 z-[115] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/25 md:hidden"
                style={studioLiveCardControlTop ? { top: studioLiveCardControlTop } : undefined}
              >
                <PanelLeft className="h-6 w-6" />
              </button>
            ) : null}

            <div className="absolute right-4 top-20 z-[110] hidden max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-1rem))] flex-col gap-3 overflow-y-auto overscroll-contain md:right-8 md:top-24 md:flex">
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
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute bottom-0 right-0 top-0 z-10 flex w-[min(22rem,88vw)] flex-col gap-3 overflow-y-auto border-l border-white/10 bg-neutral-950/97 p-4 pb-8 pt-14 shadow-2xl backdrop-blur-xl"
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
              className="relative w-full max-w-md overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-[#8C7B65]/20 aspect-[9/16]"
              style={studioLiveCardFrameStyle}
            >
              <img
                src={liveCardInteractionLayout?.imageUrl ?? getMediaPreviewUrl(activePageRecord)}
                alt={activePageRecord.theme}
                className="absolute inset-0 h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => {
                  setStudioVisualDraft((prev) => {
                    if (
                      !prev ||
                      !activePageRecord ||
                      prev.itemId !== activePageRecord.id ||
                      !clean(prev.previewImageUrl)
                    ) {
                      handleMediaImageLoadError(activePageRecord);
                      return prev;
                    }
                    return { ...prev, previewImageUrl: null };
                  });
                }}
              />
              <LiveCardHeroTextOverlay invitationData={activePageRecord.data} />

              <div className="pointer-events-none absolute inset-0 flex flex-col pt-8 pb-1 px-3 max-md:px-1 max-md:pt-6 max-md:pb-0.5 sm:px-4 md:p-8 md:pb-2">
                <div className="flex h-full min-h-0 flex-col justify-end">
                  <AnimatePresence>
                    {activeTab !== "none" && activeTab !== "share" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        data-live-card-panel
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
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C7B65]">
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
                                  <div className="rounded-xl border border-[#e2d5c7] bg-[#f7efe7] p-4 italic">
                                    <p className="text-xs text-[#8C7B65]">
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
                    className={`pointer-events-none shrink-0 ${
                      activePageUsesPosterControls
                        ? "max-md:min-h-[min(14svh,4rem)] min-h-[min(8svh,2.4rem)] md:min-h-[min(6svh,2rem)]"
                        : "max-md:min-h-[min(18svh,5.5rem)] min-h-[min(10svh,3rem)] md:min-h-[min(8svh,2.5rem)]"
                    }`}
                    aria-hidden
                  />

                  <div
                    className={`pointer-events-none z-20 flex w-full min-w-0 flex-nowrap items-end justify-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] max-sm:justify-between max-sm:gap-0.5 max-sm:px-0 px-1 md:gap-4 md:px-2 [&::-webkit-scrollbar]:hidden ${
                      activePageUsesPosterControls
                        ? "pb-[max(0.45rem,calc(env(safe-area-inset-bottom)+0.2rem))] max-md:pb-[max(0.3rem,calc(env(safe-area-inset-bottom)+0.12rem))]"
                        : "pb-8 max-md:pb-6"
                    }`}
                  >
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
                          onClick: () => {
                            setActiveTab("none");
                            void shareMedia(activePageRecord);
                          },
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
                          liveCardInteractionLayout?.positions[button.key] ||
                          EMPTY_POSITIONS[button.key];
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
                              data-live-card-trigger
                              className={`group flex w-full flex-col items-center gap-1 md:gap-2 ${isDesignMode ? "cursor-move" : ""}`}
                            >
                              <div
                                className={`rounded-full border p-2 backdrop-blur-md transition-all md:p-3 ${
                                  activePageUsesPosterControls
                                    ? "border-white/28 bg-white/18 shadow-[0_14px_32px_rgba(0,0,0,0.34),0_0_18px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.18)] group-hover:-translate-y-0.5 group-hover:border-white/42 group-hover:bg-white/24"
                                    : "border-white/30 bg-white/20 shadow-xl group-hover:bg-white/40"
                                } ${
                                  isDesignMode ? "ring-2 ring-[#c9b49a]" : ""
                                } ${
                                  (button.key === "rsvp" && activeTab === "rsvp") ||
                                  (button.key === "details" && activeTab === "details") ||
                                  (button.key === "location" && activeTab === "location") ||
                                  (button.key === "calendar" && activeTab === "calendar") ||
                                  (button.key === "registry" && activeTab === "registry")
                                    ? activePageUsesPosterControls
                                      ? "translate-y-0.5 border-white/78 bg-white/92 shadow-[0_18px_36px_rgba(0,0,0,0.38),0_0_20px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.82)]"
                                      : "border-white/50 bg-white/40"
                                    : ""
                                }`}
                              >
                                <Icon
                                  className={`h-4 w-4 md:h-5 md:w-5 ${
                                    button.key === "share" && sharingId === activePageRecord.id
                                      ? "animate-spin text-white"
                                      : activePageUsesPosterControls &&
                                          ((button.key === "rsvp" && activeTab === "rsvp") ||
                                            (button.key === "details" && activeTab === "details") ||
                                            (button.key === "location" && activeTab === "location") ||
                                            (button.key === "calendar" && activeTab === "calendar") ||
                                            (button.key === "registry" && activeTab === "registry"))
                                        ? "text-neutral-950"
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

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[#8C7B65]/6 blur-[120px]" />
    </div>
  );
}
