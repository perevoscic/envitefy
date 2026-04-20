"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Download,
  Loader2,
  Pencil,
  PanelLeft,
  Share2,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveStudioImageFinishPreset } from "@/lib/studio/image-finish-presets";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface from "@/components/studio/StudioLiveCardActionSurface";
import { buildEventSlug, buildStudioCardPath } from "@/utils/event-url";
import {
  persistImageMediaValue,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import { resolveNativeShareData } from "@/utils/native-share";
import type { StudioCreateStep, StudioWorkspaceView } from "./studio-types";
import { requestStudioGeneration } from "./studio-workspace-api";
import {
  buildInvitationData,
  buildStudioPublishPayload,
  clean,
  createId,
  getAbsoluteShareUrl,
  getFallbackThumbnail,
  getStudioDesignIdeaPlaceholder,
  getStudioEventDetailsPlaceholder,
  getStudioShareTitle,
  hasStudioSubjectReferencePhotos,
  inferBirthdayGenderFromName,
  inputValue,
  pickFirst,
  resolveStudioGenerationSurface,
} from "./studio-workspace-builders";
import {
  CATEGORY_FIELDS,
  EMPTY_POSITIONS,
  SHARED_BASICS,
  supportsStudioCategoryRsvp,
} from "./studio-workspace-field-config";
import { createInitialDetails, sanitizeMediaItems } from "./studio-workspace-sanitize";
import type {
  ActiveTab,
  ButtonPosition,
  EventDetails,
  FieldConfig,
  InviteCategory,
  MediaItem,
  MediaType,
  SharedFieldConfig,
} from "./studio-workspace-types";
import { isRecord, STUDIO_GUEST_IMAGE_URL_MAX } from "./studio-workspace-utils";
import { StudioCategoryStep } from "./workspace/StudioCategoryStep";
import { StudioCreateFlow } from "./workspace/StudioCreateFlow";
import { StudioFormStep } from "./workspace/StudioFormStep";
import { StudioLibraryStep } from "./workspace/StudioLibraryStep";
import { StudioWorkspaceShell } from "./workspace/StudioWorkspaceShell";
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

const STUDIO_LIKENESS_OPTIONS: Array<{
  value: EventDetails["likenessStrength"];
  label: string;
}> = [
  { value: "strict", label: "Strict" },
  { value: "balanced", label: "Balanced" },
  { value: "creative", label: "Creative" },
];

const STUDIO_VISUAL_STYLE_OPTIONS: Array<{
  value: EventDetails["visualStyleMode"];
  label: string;
}> = [
  { value: "photoreal", label: "Photoreal" },
  { value: "editorial_cinematic", label: "Editorial cinematic" },
  { value: "playful_stylized", label: "Playful stylized" },
];

function parseStudioWorkspaceView(value: string | null): StudioWorkspaceView {
  return value === "library" ? "library" : "create";
}

function parseStudioCreateStep(value: string | null): StudioCreateStep {
  if (value === "details" || value === "editor") return "details";
  return "type";
}

function parseStudioCategoryParam(value: string | null): InviteCategory | null {
  return normalizeStudioParsedCategory(value);
}

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

function applyStudioVisualDraft(item: MediaItem, draft: StudioVisualDraft | null): MediaItem {
  if (!draft || draft.itemId !== item.id) return item;
  const preview = clean(draft.previewImageUrl);
  const nextItem: MediaItem = {
    ...item,
    positions: draft.positions,
  };
  if (preview && preview !== clean(item.url)) {
    nextItem.url = preview;
    nextItem.sharePath = undefined;
    nextItem.errorMessage = undefined;
    nextItem.status = "ready";
  }
  return nextItem;
}

function serializeStudioMediaItem(item: MediaItem | null): string {
  if (!item) return "";
  const [sanitized] = sanitizeMediaItems([item]);
  return sanitized ? JSON.stringify(sanitized) : "";
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

function isValidMonthDayInput(value: string): boolean {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return false;
  const month = Number.parseInt(match[1] || "", 10);
  const day = Number.parseInt(match[2] || "", 10);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  const candidate = new Date(Date.UTC(2024, month - 1, day));
  return candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
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
const STUDIO_MOBILE_ACTION_BAR_CLEARANCE = "5.5rem";
const STUDIO_MOBILE_CARD_TOP_OFFSET = "2rem";
const STUDIO_EDITOR_MOBILE_BREAKPOINT = "(max-width: 767px)";

export default function StudioWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status: sessionStatus } = useSession();
  const [view, setView] = useState<StudioWorkspaceView>(() =>
    parseStudioWorkspaceView(searchParams.get("view")),
  );
  const [createStep, setCreateStep] = useState<StudioCreateStep>(() =>
    parseStudioCreateStep(searchParams.get("step")),
  );
  const [details, setDetails] = useState<EventDetails>(() => {
    const initial = createInitialDetails();
    const parsedCategory = parseStudioCategoryParam(searchParams.get("category"));
    return parsedCategory ? { ...initial, category: parsedCategory } : initial;
  });
  const { mediaList, setMediaList, librarySyncError, retryLibrarySync } = useStudioMediaLibrary();
  const [currentProject, setCurrentProject] = useState<MediaItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePage, setActivePage] = useState<MediaItem | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<StudioWorkspaceView | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [deleteConfirmationItem, setDeleteConfirmationItem] = useState<MediaItem | null>(null);
  const [currentProjectPreviewTab, setCurrentProjectPreviewTab] = useState<ActiveTab>("none");
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
  const [isMobileEditorViewport, setIsMobileEditorViewport] = useState(false);
  const [mobileEditorPane, setMobileEditorPane] = useState<"composer" | "preview">("composer");
  const [isFlyerUploading, setIsFlyerUploading] = useState(false);
  const [isSubjectPhotoUploading, setIsSubjectPhotoUploading] = useState(false);
  const [flyerUploadError, setFlyerUploadError] = useState<string | null>(null);
  const [subjectPhotoUploadError, setSubjectPhotoUploadError] = useState<string | null>(null);
  const liveCardHistoryEntryActiveRef = useRef(false);
  const editingMediaItem = currentProject;
  const isEditingLiveCard = editingMediaItem?.type === "page";

  const activePageRecord = useMemo(
    () =>
      (currentProject?.id && activePage?.id === currentProject.id ? currentProject : null) ||
      mediaList.find((item) => item.id === activePage?.id) ||
      activePage,
    [activePage, currentProject, mediaList],
  );
  const currentProjectWithVisualDraft = useMemo(
    () => (currentProject ? applyStudioVisualDraft(currentProject, studioVisualDraft) : null),
    [currentProject, studioVisualDraft],
  );
  const savedCurrentProject = useMemo(
    () => (currentProject ? (mediaList.find((item) => item.id === currentProject.id) ?? null) : null),
    [currentProject, mediaList],
  );
  const currentProjectHasUnsavedChanges = useMemo(() => {
    if (!currentProjectWithVisualDraft) return false;
    if (!savedCurrentProject) return true;
    return (
      serializeStudioMediaItem(currentProjectWithVisualDraft) !==
      serializeStudioMediaItem(savedCurrentProject)
    );
  }, [currentProjectWithVisualDraft, savedCurrentProject]);
  const currentProjectSaveLabel = "Save to Library";
  const studioPreviewShareUrl = useMemo(() => {
    const path = activePageRecord?.sharePath;
    return path?.startsWith("/card/") ? getAbsoluteShareUrl(path) : "";
  }, [activePageRecord?.sharePath]);
  const currentProjectPreviewShareUrl = useMemo(() => {
    const path = currentProjectWithVisualDraft?.sharePath;
    return path?.startsWith("/card/") ? getAbsoluteShareUrl(path) : "";
  }, [currentProjectWithVisualDraft?.sharePath]);
  const studioLiveCardModalStyle = isDesktopLiveCardViewport
    ? undefined
    : {
        paddingTop: `calc(${STUDIO_MOBILE_TOP_CHROME} + ${STUDIO_MOBILE_CARD_TOP_OFFSET} + 0.25rem)`,
        paddingBottom: `calc(${STUDIO_MOBILE_BOTTOM_CHROME} + ${STUDIO_MOBILE_ACTION_BAR_CLEARANCE})`,
      };
  const studioLiveCardFrameStyle = isDesktopLiveCardViewport
    ? undefined
    : {
        maxHeight: `calc(100dvh - (${STUDIO_MOBILE_TOP_CHROME}) - (${STUDIO_MOBILE_BOTTOM_CHROME}) - (${STUDIO_MOBILE_ACTION_BAR_CLEARANCE}))`,
        width: `min(100%, calc((100dvh - (${STUDIO_MOBILE_TOP_CHROME}) - (${STUDIO_MOBILE_BOTTOM_CHROME}) - (${STUDIO_MOBILE_ACTION_BAR_CLEARANCE})) * 9 / 16))`,
      };
  const studioLiveCardControlTop = isDesktopLiveCardViewport
    ? undefined
    : `calc(${STUDIO_MOBILE_TOP_CHROME} + 0.25rem)`;
  const formValid = useMemo(() => {
    const isRequiredFieldComplete = (field: FieldConfig | SharedFieldConfig) => {
      const value = clean(String(inputValue(details[field.key])));
      if (!value) return false;
      if (field.key === "eventDate") {
        if (details.category === "Wedding") {
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        }
        return /^\d{4}-\d{2}-\d{2}$/.test(value) || isValidMonthDayInput(value);
      }
      return true;
    };
    const missingShared = SHARED_BASICS.filter(
      (field) => field.required && !isRequiredFieldComplete(field),
    );
    if (missingShared.length > 0) return false;
    if (supportsStudioCategoryRsvp(details.category) && !clean(details.rsvpContact)) return false;

    if (details.sourceMediaMode === "flyer" && clean(details.sourceFlyerUrl)) {
      return true;
    }

    if (!clean(details.detailsDescription) || !clean(details.theme)) {
      return false;
    }

    const missingCategory = (CATEGORY_FIELDS[details.category] || []).filter(
      (field) => field.required && !isRequiredFieldComplete(field),
    );
    return missingCategory.length === 0;
  }, [details]);

  const navigateWorkspace = useCallback(
    (
      nextView: StudioWorkspaceView,
      nextCreateStep?: StudioCreateStep,
      nextCategory?: InviteCategory,
    ) => {
      const resolvedCreateStep: StudioCreateStep | null =
        nextView === "create" ? (nextCreateStep ?? createStep) : null;
      const resolvedCategory = nextCategory ?? details.category;

      setView((current) => (current === nextView ? current : nextView));
      if (resolvedCreateStep) {
        setCreateStep((current) => (current === resolvedCreateStep ? current : resolvedCreateStep));
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("view", nextView);
      if (nextView === "create" && resolvedCreateStep) {
        params.set("step", resolvedCreateStep);
        params.set("category", resolvedCategory);
      } else {
        params.delete("step");
        params.delete("category");
      }
      const next = params.toString();
      const current = searchParams.toString();
      if (next === current) return;
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [createStep, details.category, pathname, router, searchParams],
  );

  useEffect(() => {
    const nextView = parseStudioWorkspaceView(searchParams.get("view"));
    const stepParam = searchParams.get("step");
    const nextCreateStep = stepParam ? parseStudioCreateStep(stepParam) : null;
    const nextCategory = parseStudioCategoryParam(searchParams.get("category"));
    setView((current) => (current === nextView ? current : nextView));
    if (nextView === "create" && nextCreateStep) {
      setCreateStep((current) => (current === nextCreateStep ? current : nextCreateStep));
    }
    if (nextView === "create" && nextCategory) {
      setDetails((current) =>
        current.category === nextCategory ? current : { ...current, category: nextCategory },
      );
    }
  }, [searchParams]);

  useEffect(() => {
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
  }, [selectedImage?.id, activePageRecord?.id, editingMediaItem?.id]);

  useEffect(() => {
    setCurrentProjectPreviewTab("none");
  }, [currentProject?.id]);

  useEffect(() => {
    if (!details.imageFinishPreset) return;
    if (resolveStudioImageFinishPreset(details.category, details.imageFinishPreset)) return;
    setDetails((prev) =>
      prev.imageFinishPreset &&
      !resolveStudioImageFinishPreset(prev.category, prev.imageFinishPreset)
        ? { ...prev, imageFinishPreset: "" }
        : prev,
    );
  }, [details.category, details.imageFinishPreset]);

  useEffect(() => {
    setActiveTab("none");
  }, [activePageRecord?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(STUDIO_EDITOR_MOBILE_BREAKPOINT);
    const syncMobileEditorViewport = () => {
      const matches = mediaQuery.matches;
      setIsMobileEditorViewport(matches);
      if (!matches) {
        setMobileEditorPane("composer");
      }
    };

    syncMobileEditorViewport();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileEditorViewport);
      return () => mediaQuery.removeEventListener("change", syncMobileEditorViewport);
    }
    mediaQuery.addListener(syncMobileEditorViewport);
    return () => mediaQuery.removeListener(syncMobileEditorViewport);
  }, []);

  useEffect(() => {
    if (!deleteConfirmationItem) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDeleteConfirmationItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirmationItem]);

  const closeLiveCardFullscreen = useCallback(
    (options?: { fromPopState?: boolean }) => {
      discardStudioVisualDraft();
      setActivePage(null);
      setActiveTab("none");
      setIsDesignMode(false);
      setIsLiveCardToolsDrawerOpen(false);
      if (previewOrigin === "create") {
        navigateWorkspace("create", "details");
      } else {
        navigateWorkspace("library");
      }
      setPreviewOrigin(null);
      if (!options?.fromPopState && liveCardHistoryEntryActiveRef.current && typeof window !== "undefined") {
        liveCardHistoryEntryActiveRef.current = false;
        window.history.back();
      }
    },
    [navigateWorkspace, previewOrigin],
  );

  useEffect(() => {
    if (!activePageRecord?.id || !activePageRecord.data || typeof window === "undefined") return;

    window.history.pushState({ ...(window.history.state ?? {}), studioLiveCardFullscreen: true }, "");
    liveCardHistoryEntryActiveRef.current = true;

    const handlePopState = () => {
      if (!activePageRecord?.id) return;
      closeLiveCardFullscreen({ fromPopState: true });
      liveCardHistoryEntryActiveRef.current = false;
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (!activePageRecord?.id) {
        liveCardHistoryEntryActiveRef.current = false;
      }
    };
  }, [activePageRecord?.id, closeLiveCardFullscreen]);

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
    if (details.category !== "Birthday") return;
    const nextGender = inferBirthdayGenderFromName(details.name) || "Neutral";
    if (details.gender === nextGender) return;
    setDetails((prev) =>
      prev.category === "Birthday" && prev.gender !== nextGender
        ? { ...prev, gender: nextGender }
        : prev,
    );
  }, [details.category, details.gender, details.name]);

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
          "Flyer uploaded, but Event Details could not be read. Add Event Details manually, and add a Design Idea if you want to steer the look.",
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

  function deleteMedia(item: MediaItem) {
    if (item.type === "page") {
      setDeleteConfirmationItem(item);
      return;
    }
    performDeleteMedia(item);
  }

  function performDeleteMedia(item: MediaItem) {
    const { id } = item;
    setMediaList((prev) => sanitizeMediaItems(prev.filter((item) => item.id !== id)));
    if (activePage?.id === id) {
      setActivePage(null);
      setActiveTab("none");
      setIsDesignMode(false);
      setPreviewOrigin(null);
    }
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  }

  function confirmDeleteMedia() {
    if (!deleteConfirmationItem) return;
    performDeleteMedia(deleteConfirmationItem);
    setDeleteConfirmationItem(null);
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

  function getProjectItem(id: string) {
    if (currentProject?.id === id) return currentProject;
    return mediaList.find((item) => item.id === id) ?? null;
  }

  function upsertLibraryItem(item: MediaItem) {
    setMediaList((prev) => {
      const exists = prev.some((entry) => entry.id === item.id);
      const next = exists
        ? prev.map((entry) => (entry.id === item.id ? item : entry))
        : [item, ...prev];
      return sanitizeMediaItems(next);
    });
  }

  function patchMediaItem(id: string, patch: Partial<MediaItem>) {
    if (currentProject?.id === id) {
      setCurrentProject((prev) => (prev ? { ...prev, ...patch } : prev));
    } else {
      setMediaList((prev) =>
        sanitizeMediaItems(prev.map((item) => (item.id === id ? { ...item, ...patch } : item))),
      );
    }
    if (activePage?.id === id) {
      setActivePage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
    if (selectedImage?.id === id) {
      setSelectedImage((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  }

  function clearCurrentProject(options?: { resetDetails?: boolean }) {
    setCurrentProject(null);
    setMobileEditorPane("composer");
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
    setIsLiveCardToolsDrawerOpen(false);
    setActiveTab("none");
    setIsDesignMode(false);
    if (activePage?.id === currentProject?.id) {
      setActivePage(null);
      setPreviewOrigin(null);
    }
    if (selectedImage?.id === currentProject?.id) {
      setSelectedImage(null);
    }
    if (options?.resetDetails) {
      setDetails(createInitialDetails());
    }
  }

  function confirmDiscardCurrentProject(message?: string) {
    if (!currentProjectHasUnsavedChanges) return true;
    if (typeof window === "undefined") return false;
    return window.confirm(
      message ||
        "You have an unsaved Studio project. Discard it and continue?",
    );
  }

  function saveWorkingProject(project: MediaItem | null) {
    if (!project) return null;
    const nextProject = prepareProjectForLibrarySave(project);
    setCurrentProject(nextProject);
    upsertLibraryItem(nextProject);
    setStudioVisualDraft((prev) => (prev?.itemId === nextProject.id ? null : prev));
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setIsDesignMode(false);
    return nextProject;
  }

  function saveCurrentProjectToLibrary() {
    if (!currentProject || currentProject.status !== "ready") return;
    saveWorkingProject(currentProject);
  }

  function saveCurrentProjectAsImageToLibrary() {
    if (!currentProjectWithVisualDraft || currentProjectWithVisualDraft.status !== "ready") return;
    const imageUrl = clean(currentProjectDisplayUrl);
    if (!imageUrl) return;

    const imageItem: MediaItem = {
      id: createId(),
      type: "image",
      url: imageUrl,
      theme: `${getStudioShareTitle(currentProjectWithVisualDraft)} Image`,
      status: "ready",
      details: currentProjectWithVisualDraft.details,
      createdAt: new Date().toISOString(),
    };

    upsertLibraryItem(imageItem);
  }

  function prepareProjectForLibrarySave(project: MediaItem): MediaItem {
    const nextProject = applyStudioVisualDraft(project, studioVisualDraft);
    const existingSavedProject = mediaList.find((item) => item.id === nextProject.id);
    if (!existingSavedProject) return nextProject;
    if (serializeStudioMediaItem(nextProject) === serializeStudioMediaItem(existingSavedProject)) {
      return nextProject;
    }
    return {
      ...nextProject,
      id: createId(),
      createdAt: new Date().toISOString(),
      publishedEventId: undefined,
      sharePath: undefined,
    };
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
    if (currentProject?.id !== item.id && !confirmDiscardCurrentProject()) {
      return;
    }
    const target = currentProject?.id === item.id ? currentProject : item;
    setCurrentProject(target);
    setDetails(target.details);
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
    setActiveTab("none");
    setIsDesignMode(false);
    setActivePage(null);
    setPreviewOrigin(null);
    navigateWorkspace("create", "details");
  }

  function openLiveCardEditor(item: MediaItem) {
    beginLiveCardDetailEdit(item);
  }

  function openLiveCardImageEdit(item: MediaItem) {
    if (currentProject?.id !== item.id && !confirmDiscardCurrentProject()) {
      return;
    }
    const target = currentProject?.id === item.id ? currentProject : item;
    setCurrentProject(target);
    setDetails(target.details);
    setIsLiveCardToolsDrawerOpen(true);
    setActivePage(target);
    setEditPrompt("");
    setIsEditPanelOpen(true);
    setActiveTab("none");
    setIsDesignMode(false);
    setPreviewOrigin("create");
    navigateWorkspace("create", "details");
  }

  function getReusablePublicSharePath(item: MediaItem): string | null {
    const isCurrentProjectItem = currentProject?.id === item.id;
    const workingItem =
      isCurrentProjectItem && currentProjectWithVisualDraft
        ? currentProjectWithVisualDraft
        : getProjectItem(item.id) || item;

    if (
      workingItem.sharePath?.startsWith("/card/") &&
      (!isCurrentProjectItem || !currentProjectHasUnsavedChanges)
    ) {
      return workingItem.sharePath;
    }

    return null;
  }

  async function ensurePublicSharePath(item: MediaItem): Promise<string> {
    const isCurrentProjectItem = currentProject?.id === item.id;
    const workingItem =
      isCurrentProjectItem && currentProjectWithVisualDraft
        ? currentProjectWithVisualDraft
        : getProjectItem(item.id) || item;
    const reusableSharePath = getReusablePublicSharePath(item);
    if (reusableSharePath) {
      return reusableSharePath;
    }
    if (workingItem.status !== "ready") {
      throw new Error("This invite must finish generating before it can be shared.");
    }

    const shareableWorkingItem = isCurrentProjectItem
      ? (saveWorkingProject(workingItem) ?? workingItem)
      : workingItem;

    const persistedImageUrl = await persistImageMediaValue({
      value: shareableWorkingItem.url,
      fileName: `${buildEventSlug(getStudioShareTitle(shareableWorkingItem)) || "studio-invite"}.png`,
    });

    let publishItem = shareableWorkingItem;
    if (shareableWorkingItem.data?.eventDetails) {
      const eventDetails = await persistGuestImageUrlsForPublish(
        shareableWorkingItem.data.eventDetails,
      );
      publishItem = {
        ...shareableWorkingItem,
        data: { ...shareableWorkingItem.data, eventDetails },
      };
    }

    const payload = buildStudioPublishPayload(publishItem, persistedImageUrl);

    const response = publishItem.publishedEventId
      ? await fetch(`/api/history/${encodeURIComponent(publishItem.publishedEventId)}`, {
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
    const syncedItem = {
      ...publishItem,
      publishedEventId: json.id,
      sharePath,
      ...(publishItem.data ? { data: publishItem.data } : {}),
    };
    if (isCurrentProjectItem) {
      setCurrentProject(syncedItem);
      upsertLibraryItem(syncedItem);
    } else {
      patchMediaItem(syncedItem.id, syncedItem);
    }
    return sharePath;
  }

  async function shareMedia(item: MediaItem) {
    try {
      setSharingId(item.id);
      const reusableSharePath = getReusablePublicSharePath(item);
      const sharePath = reusableSharePath ?? (await ensurePublicSharePath(item));
      const shareUrl = getAbsoluteShareUrl(sharePath);
      const shareItem =
        currentProject?.id === item.id && currentProjectWithVisualDraft
          ? currentProjectWithVisualDraft
          : getProjectItem(item.id) || item;
      const shareData = {
        title: getStudioShareTitle(shareItem),
        text:
          shareItem.data?.interactiveMetadata.shareNote ||
          shareItem.data?.socialCaption ||
          shareItem.data?.description ||
          "Check out this invitation!",
        url: shareUrl,
      };

      const nativeShareData = reusableSharePath
        ? resolveNativeShareData(shareData)
        : null;
      if (nativeShareData) {
        await navigator.share(nativeShareData);
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
    const savedItem = getProjectItem(id);
    if (!savedItem) return;
    setStudioVisualDraft((prev) => {
      const base = mergeStudioButtonPositions(savedItem);
      const clampedPoint = {
        x: point.x,
        y: Math.min(point.y, 0),
      };
      const nextPositions =
        prev?.itemId === id
          ? { ...prev.positions, [buttonKey]: clampedPoint }
          : { ...base, [buttonKey]: clampedPoint };
      return {
        itemId: id,
        positions: nextPositions,
        previewImageUrl: prev?.itemId === id ? (prev.previewImageUrl ?? null) : null,
      };
    });
  }

  async function generateMedia(type: MediaType) {
    const currentDetails = { ...details };
    const targetId = currentProject?.id ?? createId();
    const existingItem = currentProject;
    const generationSurface = resolveStudioGenerationSurface(currentDetails, type, {
      existingItemType: existingItem?.type,
    });
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
    setCurrentProject(loadingItem);
    if (isMobileEditorViewport) {
      setMobileEditorPane("preview");
    }

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

      setCurrentProject(nextItem);
      setEditPrompt("");
      if (isMobileEditorViewport) {
        setMobileEditorPane("preview");
      }
      navigateWorkspace("create", "details");
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Studio generation failed.";
      console.error("Studio generation failed", error);
      setCurrentProject({
        ...loadingItem,
        status: "error",
        url: existingItem?.url || getFallbackThumbnail(currentDetails),
        errorMessage,
      });
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

    const savedItem = getProjectItem(item.id) ?? item;
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
    const savedItem = getProjectItem(item.id) ?? item;
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
    const savedItem = getProjectItem(item.id) ?? item;
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
    const savedPage = getProjectItem(page.id) ?? page;
    const showVisualSaveBar =
      studioVisualDraft?.itemId === page.id &&
      studioVisualDraftDiffersFromSaved(savedPage, studioVisualDraft);

    if (!showVisualSaveBar) return null;

    return (
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
    );
  }

  const studioDesignIdeaPlaceholder = getStudioDesignIdeaPlaceholder(details.category);
  const studioEventDetailsPlaceholder = getStudioEventDetailsPlaceholder(details.category);
  const showStudioCreativeControls = hasStudioSubjectReferencePhotos(details);
  const currentProjectDisplayUrl = currentProjectWithVisualDraft
    ? getStudioImageDisplayUrl(currentProjectWithVisualDraft)
    : "";
  const currentProjectSaveImageLabel = "Save Image Only";

  function openTypeStep() {
    if (!confirmDiscardCurrentProject("Discard the current Studio project and switch categories?")) {
      return;
    }
    clearCurrentProject({ resetDetails: true });
    setPreviewOrigin(null);
    navigateWorkspace("create", "type");
  }

  function handleCategorySelect(category: InviteCategory) {
    setDetails((prev) => ({
      ...prev,
      category,
    }));
    setMobileEditorPane("composer");
    navigateWorkspace("create", "details", category);
  }

  function openEditorStep() {
    setMobileEditorPane("composer");
    navigateWorkspace("create", "details");
  }

  function handleWorkspaceViewChange(nextView: StudioWorkspaceView) {
    navigateWorkspace(nextView);
  }

  function openLibraryPage(item: MediaItem | null) {
    setPreviewOrigin(item ? "library" : null);
    setActivePage(item);
  }

  function openCurrentLiveCardFullscreen() {
    if (!currentProjectWithVisualDraft?.data || currentProjectWithVisualDraft.type !== "page") return;
    const fullscreenTarget = currentProject ?? currentProjectWithVisualDraft;
    setPreviewOrigin("create");
    setActivePage(fullscreenTarget);
    setActiveTab("none");
  }

  return (
    <>
      <StudioWorkspaceShell
      activeView={view}
      onViewChange={handleWorkspaceViewChange}
      librarySyncError={librarySyncError}
      showLibrarySyncError={sessionStatus === "authenticated"}
      onRetryLibrarySync={retryLibrarySync}
      >
        {view === "create" ? (
          <StudioCreateFlow
            createStep={createStep}
            details={details}
            onOpenTypeStep={openTypeStep}
            typeContent={
              <StudioCategoryStep
                details={details}
                onSelectCategory={handleCategorySelect}
              />
            }
            detailsContent={
              <StudioFormStep
                details={details}
                setDetails={setDetails}
                onOpenEditorStep={openEditorStep}
                isFormValid={formValid}
                editingId={currentProject?.id ?? null}
                onUploadFlyer={handleUploadFlyer}
                onRemoveFlyer={handleRemoveFlyer}
                onUploadSubjectPhotos={handleUploadSubjectPhotos}
                onRemoveSubjectPhoto={handleRemoveSubjectPhoto}
                isFlyerUploading={isFlyerUploading}
                isSubjectPhotoUploading={isSubjectPhotoUploading}
                flyerUploadError={flyerUploadError}
                subjectPhotoUploadError={subjectPhotoUploadError}
                studioDesignIdeaPlaceholder={studioDesignIdeaPlaceholder}
                studioEventDetailsPlaceholder={studioEventDetailsPlaceholder}
                showStudioCreativeControls={showStudioCreativeControls}
                likenessOptions={STUDIO_LIKENESS_OPTIONS}
                visualStyleOptions={STUDIO_VISUAL_STYLE_OPTIONS}
                currentProjectWithVisualDraft={currentProjectWithVisualDraft}
                currentProjectDisplayUrl={currentProjectDisplayUrl}
                currentProjectHasUnsavedChanges={currentProjectHasUnsavedChanges}
                currentProjectSaveLabel={currentProjectSaveLabel}
                currentProjectSaveImageLabel={currentProjectSaveImageLabel}
                savedCurrentProject={savedCurrentProject}
                currentProjectPreviewTab={currentProjectPreviewTab}
                setCurrentProjectPreviewTab={setCurrentProjectPreviewTab}
                currentProjectPreviewShareUrl={currentProjectPreviewShareUrl}
                isGenerating={isGenerating}
                isEditingLiveCard={isEditingLiveCard}
                isMobileViewport={isMobileEditorViewport}
                mobilePane={mobileEditorPane}
                sharingId={sharingId}
                copySuccess={copySuccess}
                generateMedia={generateMedia}
                saveCurrentProjectToLibrary={saveCurrentProjectToLibrary}
                saveCurrentProjectAsImageToLibrary={saveCurrentProjectAsImageToLibrary}
                openCurrentLiveCardFullscreen={openCurrentLiveCardFullscreen}
                showPromptComposer={() => setMobileEditorPane("composer")}
                showPreviewPane={() => setMobileEditorPane("preview")}
                shareCurrentProject={() => {
                  if (!currentProjectWithVisualDraft) return;
                  void shareMedia(currentProjectWithVisualDraft);
                }}
                openCurrentImage={() => {
                  if (!currentProjectWithVisualDraft) return;
                  setSelectedImage(currentProjectWithVisualDraft);
                }}
                handleMediaImageLoadError={handleMediaImageLoadError}
              />
            }
          />
        ) : (
          <StudioLibraryStep
            mediaList={mediaList}
            setActivePage={openLibraryPage}
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
        )}
      </StudioWorkspaceShell>

      <AnimatePresence>
        {deleteConfirmationItem ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7200] flex items-center justify-center p-4 sm:p-6"
            role="presentation"
          >
            <button
              type="button"
              aria-label="Close delete confirmation"
              className="absolute inset-0 bg-[rgba(16,10,7,0.58)] backdrop-blur-[10px]"
              onClick={() => setDeleteConfirmationItem(null)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="studio-delete-live-card-title"
              aria-describedby="studio-delete-live-card-description"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(180deg,rgba(40,29,23,0.96),rgba(19,15,13,0.98))] text-white shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(234,179,88,0.24),transparent_72%)]" />

              <div className="relative p-6 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/12 bg-white/8 text-[#fca5a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmationItem(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/80 transition-colors hover:bg-white/12 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f0c98a]">
                    Confirm Delete
                  </p>
                  <h2
                    id="studio-delete-live-card-title"
                    className="font-[family-name:var(--font-playfair),Georgia,serif] text-[1.9rem] leading-none tracking-[-0.03em] !text-white"
                  >
                    Delete live card?
                  </h2>
                  <p
                    id="studio-delete-live-card-description"
                    className="max-w-sm text-sm leading-6 text-white/72"
                  >
                    Remove this live card from your Studio library. This action cannot be undone.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Live Card
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-white">
                    {getStudioShareTitle(deleteConfirmationItem)}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {deleteConfirmationItem.details.category}
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmationItem(null)}
                    className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/12 hover:text-white"
                  >
                    Keep live card
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteMedia}
                    className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef4444,#dc2626)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(220,38,38,0.32)] transition-transform hover:scale-[1.01]"
                  >
                    Delete live card
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl"
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
          (() => {
            const liveCardPreviewTools = renderLiveCardPreviewTools(activePageRecord);

            return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-12"
            style={studioLiveCardModalStyle}
          >
            <button
              type="button"
              aria-label="Close live card preview"
              onClick={() => closeLiveCardFullscreen()}
              className="absolute inset-0"
            />

            <button
              onClick={() => closeLiveCardFullscreen()}
              className="absolute right-4 top-4 z-[7010] rounded-full bg-white/20 p-3 text-white transition-colors hover:bg-white/30 md:right-8 md:top-8"
            >
              <X className="h-6 w-6" />
            </button>

            {!isLiveCardToolsDrawerOpen && liveCardPreviewTools ? (
              <button
                type="button"
                aria-label="Open studio tools"
                onClick={() => setIsLiveCardToolsDrawerOpen(true)}
                className="fixed right-3 z-[7015] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/25 md:hidden"
                style={studioLiveCardControlTop ? { top: studioLiveCardControlTop } : undefined}
              >
                <PanelLeft className="h-6 w-6" />
              </button>
            ) : null}

            {liveCardPreviewTools ? (
              <div className="absolute right-4 top-20 z-[7010] hidden max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-1rem))] flex-col gap-3 overflow-y-auto overscroll-contain md:right-8 md:top-24 md:flex">
                {liveCardPreviewTools}
              </div>
            ) : null}

            <AnimatePresence>
              {isLiveCardToolsDrawerOpen && liveCardPreviewTools ? (
                <motion.div
                  key="live-card-tools-drawer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[7012] md:hidden"
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
                      {liveCardPreviewTools}
                    </div>
                  </motion.aside>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative z-[7005] w-full max-w-md overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl shadow-[#8C7B65]/20 aspect-[9/16]"
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

              <StudioLiveCardActionSurface
                title={activePageRecord.data?.title || getStudioShareTitle(activePageRecord)}
                invitationData={activePageRecord.data}
                activeTab={activeTab}
                onActiveTabChange={setActiveTab}
                positions={liveCardInteractionLayout?.positions}
                shareUrl={studioPreviewShareUrl}
                onShare={() => void shareMedia(activePageRecord)}
                shareState={
                  sharingId === activePageRecord.id
                    ? "pending"
                    : copySuccess
                      ? "success"
                      : "idle"
                }
                isDesignMode={isDesignMode}
                onDragEnd={(buttonKey, position) =>
                  updatePosition(activePageRecord.id, buttonKey, position)
                }
                showExtendedDetails
                registryHelperText={activePageRecord.data.interactiveMetadata.shareNote}
              />
            </motion.div>

            {!isDesktopLiveCardViewport ? (
              <div
                className="fixed left-1/2 z-[7010] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/12 bg-white/14 px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl md:hidden"
                style={{ bottom: `calc(${STUDIO_MOBILE_BOTTOM_CHROME} + 0.25rem)` }}
              >
                <button
                  type="button"
                  onClick={() => openLiveCardImageEdit(activePageRecord)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform hover:scale-105"
                  aria-label="Edit live card"
                  title="Edit"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => downloadMedia(activePageRecord)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform hover:scale-105"
                  aria-label="Download live card"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => void shareMedia(activePageRecord)}
                  disabled={sharingId === activePageRecord.id}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-80"
                  aria-label={sharingId === activePageRecord.id ? "Creating share link" : "Share live card"}
                  title={sharingId === activePageRecord.id ? "Creating share link" : "Share"}
                >
                  {sharingId === activePageRecord.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : copySuccess ? (
                    <Share2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Share2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : null}
          </motion.div>
            );
          })()
        ) : null}
      </AnimatePresence>

    </>
  );
}
