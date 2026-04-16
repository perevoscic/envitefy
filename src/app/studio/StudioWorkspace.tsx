"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Layout,
  Loader2,
  PanelLeft,
  WandSparkles,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import LiveCardHeroTextOverlay from "@/components/studio/LiveCardHeroTextOverlay";
import StudioLiveCardActionSurface from "@/components/studio/StudioLiveCardActionSurface";
import { buildEventSlug, buildStudioCardPath } from "@/utils/event-url";
import {
  persistImageMediaValue,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import type { StudioStep } from "./studio-types";
import { requestStudioGeneration } from "./studio-workspace-api";
import {
  buildInvitationData,
  buildStudioPublishPayload,
  clean,
  createId,
  formatDate,
  getAbsoluteShareUrl,
  getFallbackThumbnail,
  getStudioIdeaLabel,
  getStudioIdeaPlaceholder,
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
  InviteCategory,
  MediaItem,
  MediaType,
} from "./studio-workspace-types";
import {
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

export default function StudioWorkspace() {
  const { status: sessionStatus } = useSession();
  const [step, setStep] = useState<StudioStep>("category");
  const [details, setDetails] = useState<EventDetails>(createInitialDetails);
  const { mediaList, setMediaList, librarySyncError, retryLibrarySync } = useStudioMediaLibrary();
  const [currentProject, setCurrentProject] = useState<MediaItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePage, setActivePage] = useState<MediaItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
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
  const [isFlyerUploading, setIsFlyerUploading] = useState(false);
  const [isSubjectPhotoUploading, setIsSubjectPhotoUploading] = useState(false);
  const [flyerUploadError, setFlyerUploadError] = useState<string | null>(null);
  const [subjectPhotoUploadError, setSubjectPhotoUploadError] = useState<string | null>(null);
  const editingMediaItem = currentProject;

  const isEditingLiveCard = editingMediaItem?.type === "page";
  const editingLiveCardHeroTextMode = editingMediaItem?.data?.heroTextMode;

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
  const currentProjectSaveLabel = !savedCurrentProject
    ? "Save to Library"
    : currentProjectHasUnsavedChanges
      ? "Save Changes"
      : "Saved to Library";
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

  useEffect(() => {
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
  }, [selectedImage?.id, activePageRecord?.id, editingMediaItem?.id]);

  useEffect(() => {
    setCurrentProjectPreviewTab("none");
  }, [currentProject?.id]);

  useEffect(() => {
    setActiveTab("none");
  }, [activePageRecord?.id]);

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

  function isFormValid() {
    const missingShared = SHARED_BASICS.filter(
      (field) => field.required && !clean(String(inputValue(details[field.key]))),
    );
    if (missingShared.length > 0) return false;
    if (supportsStudioCategoryRsvp(details.category) && !clean(details.rsvpContact)) return false;

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
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setStudioVisualDraft(null);
    setIsLiveCardToolsDrawerOpen(false);
    setActiveTab("none");
    setIsDesignMode(false);
    if (activePage?.id === currentProject?.id) {
      setActivePage(null);
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
    if (!project) return;
    const nextProject = applyStudioVisualDraft(project, studioVisualDraft);
    setCurrentProject(nextProject);
    upsertLibraryItem(nextProject);
    setStudioVisualDraft((prev) => (prev?.itemId === nextProject.id ? null : prev));
    setEditPrompt("");
    setIsEditPanelOpen(false);
    setIsDesignMode(false);
  }

  function saveCurrentProjectToLibrary() {
    if (!currentProject || currentProject.status !== "ready") return;
    saveWorkingProject(currentProject);
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
    setStep("form");
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
    setStep("studio");
  }

  async function ensurePublicSharePath(item: MediaItem): Promise<string> {
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
    if (workingItem.status !== "ready") {
      throw new Error("This invite must finish generating before it can be shared.");
    }

    if (isCurrentProjectItem) {
      saveWorkingProject(workingItem);
    }

    const persistedImageUrl = await persistImageMediaValue({
      value: workingItem.url,
      fileName: `${buildEventSlug(getStudioShareTitle(workingItem)) || "studio-invite"}.png`,
    });

    let publishItem = workingItem;
    if (workingItem.data?.eventDetails) {
      const eventDetails = await persistGuestImageUrlsForPublish(workingItem.data.eventDetails);
      publishItem = {
        ...workingItem,
        data: { ...workingItem.data, eventDetails },
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
      const sharePath = await ensurePublicSharePath(item);
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
    const savedItem = getProjectItem(id);
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
      setStep("studio");
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

  const studioIdeaLabel = getStudioIdeaLabel(details.category);
  const studioIdeaPlaceholder = getStudioIdeaPlaceholder(details.category);
  const activeEditorialTab = step === "studio" ? "studio" : step === "library" ? "library" : "details";
  const shellClass = studioWorkspaceShellClass;
  const mediaCardClass = studioWorkspaceMediaCardClass;
  const mediaBadgeClass = studioWorkspaceMediaBadgeClass;
  const showStudioCreativeControls = hasStudioSubjectReferencePhotos(details);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F2EF] text-[#1A1A1A] selection:bg-[#e7d9c8]">
      <div className="pointer-events-none absolute -left-[180px] -top-[180px] h-[430px] w-[430px] rounded-full border border-[#8C7B65]/10" />
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
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-[minmax(210px,260px)_minmax(0,1fr)] lg:gap-0">
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
                      if (!confirmDiscardCurrentProject("Discard the current Studio project and switch categories?")) {
                        return;
                      }
                      clearCurrentProject({ resetDetails: true });
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
                    editingId={currentProject?.id ?? null}
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
              className="mr-auto grid max-w-[1440px] gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:gap-10"
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

                  {showStudioCreativeControls ? (
                    <div className="space-y-4 rounded-[1.75rem] border border-[#d8cdc0]/85 bg-[#fbf8f4] p-5">
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                          Creative Upgrade
                        </p>
                        <p className="text-sm leading-7 text-[#6B5E4E]">
                          Use these controls when you want the uploaded person transformed into the
                          theme instead of simply blended into the scene.
                        </p>
                      </div>

                      <div className="space-y-4 border-t border-[#1A1A1A]/8 pt-4">
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                            Likeness Strength
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {STUDIO_LIKENESS_OPTIONS.map((option) => {
                              const active = details.likenessStrength === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    setDetails((prev) => ({
                                      ...prev,
                                      likenessStrength: option.value,
                                      subjectTransformMode: "premium_makeover",
                                    }))
                                  }
                                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                                    active
                                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#F5F2EF]"
                                      : "border-[#d8cdc0] bg-white text-[#5F5345] hover:border-[#8C7B65]"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                            Visual Style
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {STUDIO_VISUAL_STYLE_OPTIONS.map((option) => {
                              const active = details.visualStyleMode === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    setDetails((prev) => ({
                                      ...prev,
                                      visualStyleMode: option.value,
                                      subjectTransformMode: "premium_makeover",
                                    }))
                                  }
                                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                                    active
                                      ? "border-[#1A1A1A] bg-[#1A1A1A] text-[#F5F2EF]"
                                      : "border-[#d8cdc0] bg-white text-[#5F5345] hover:border-[#8C7B65]"
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3 pt-6">
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
                {currentProjectWithVisualDraft ? (
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={saveCurrentProjectToLibrary}
                        disabled={
                          currentProjectWithVisualDraft.status !== "ready" ||
                          (!currentProjectHasUnsavedChanges && Boolean(savedCurrentProject))
                        }
                        className="inline-flex items-center justify-center rounded-full bg-[#1A1A1A] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F5F2EF] transition-all hover:-translate-y-0.5 hover:bg-[#262626] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {currentProjectSaveLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => void shareMedia(currentProjectWithVisualDraft)}
                        disabled={
                          currentProjectWithVisualDraft.status !== "ready" ||
                          sharingId === currentProjectWithVisualDraft.id
                        }
                        className="inline-flex items-center justify-center rounded-full border border-[#d8cdc0] bg-[#fbf8f4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {sharingId === currentProjectWithVisualDraft.id ? "Sharing..." : "Share"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadMedia(currentProjectWithVisualDraft)}
                        disabled={!currentProjectWithVisualDraft.url}
                        className="inline-flex items-center justify-center rounded-full border border-[#d8cdc0] bg-[#fbf8f4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1A1A1A] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !currentProjectHasUnsavedChanges ||
                            confirmDiscardCurrentProject(
                              "Discard the current Studio project?",
                            )
                          ) {
                            clearCurrentProject();
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-[#e6d7c7] bg-[#fffaf4] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7a5e47] transition-all hover:-translate-y-0.5 hover:bg-[#fffdf9]"
                      >
                        {currentProjectHasUnsavedChanges ? "Discard" : "Clear Studio"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {currentProjectWithVisualDraft ? (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,25rem)_16rem] xl:justify-center">
                    <div className={`${mediaCardClass} overflow-hidden`}>
                      <div
                        className={`relative mx-auto flex items-center justify-center overflow-hidden bg-[#efe7dc] ${
                          currentProjectWithVisualDraft.details.orientation === "portrait"
                            ? "aspect-[9/16] w-full"
                            : "aspect-[16/9] w-full max-w-[38rem]"
                        }`}
                      >
                        {currentProjectWithVisualDraft.status === "loading" ? (
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-[#8C7B65]" />
                            <span className="animate-pulse text-xs font-semibold uppercase tracking-[0.2em] text-[#8C7B65]">
                              Processing {currentProjectWithVisualDraft.type}...
                            </span>
                          </div>
                        ) : currentProjectWithVisualDraft.status === "error" ? (
                          <div className="max-w-md p-8 text-center">
                            <p className="mb-2 font-semibold text-red-600">Generation Failed</p>
                            {currentProjectWithVisualDraft.errorMessage ? (
                              <p className="mb-4 text-sm leading-6 text-[#6B5E4E]">
                                {currentProjectWithVisualDraft.errorMessage}
                              </p>
                            ) : null}
                            <button
                              onClick={() => generateMedia(currentProjectWithVisualDraft.type)}
                              className="text-sm font-medium text-[#5F5345] underline hover:text-[#1A1A1A]"
                            >
                              Try Again
                            </button>
                          </div>
                        ) : (
                          <>
                            <img
                              src={getStudioImageDisplayUrl(currentProjectWithVisualDraft)}
                              alt={currentProjectWithVisualDraft.theme}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={() => handleMediaImageLoadError(currentProjectWithVisualDraft)}
                            />
                            {currentProjectWithVisualDraft.type === "page" ? (
                              <>
                                <LiveCardHeroTextOverlay invitationData={currentProjectWithVisualDraft.data} />
                                <StudioLiveCardActionSurface
                                  title={getStudioShareTitle(currentProjectWithVisualDraft)}
                                  invitationData={currentProjectWithVisualDraft.data}
                                  activeTab={currentProjectPreviewTab}
                                  onActiveTabChange={setCurrentProjectPreviewTab}
                                  positions={currentProjectWithVisualDraft.positions}
                                  shareUrl={currentProjectPreviewShareUrl}
                                  onShare={() => void shareMedia(currentProjectWithVisualDraft)}
                                  shareState={
                                    sharingId === currentProjectWithVisualDraft.id
                                      ? "pending"
                                      : copySuccess
                                        ? "success"
                                        : "idle"
                                  }
                                  showExtendedDetails
                                  registryHelperText={
                                    currentProjectWithVisualDraft.data?.interactiveMetadata?.shareNote
                                  }
                                />
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(27,20,15,0.12),rgba(27,20,15,0.58))] opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => setSelectedImage(currentProjectWithVisualDraft)}
                                  className="flex items-center gap-2 rounded-full bg-[#fbf8f4] px-6 py-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_14px_34px_rgba(49,32,17,0.18)] transition-transform hover:scale-[1.02]"
                                >
                                  <ImageIcon className="h-5 w-5" />
                                  View Full Image
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        <div className={`absolute left-4 top-4 ${mediaBadgeClass}`}>
                          {currentProjectWithVisualDraft.type === "page" ? (
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
                        <div className="absolute right-4 top-4 rounded-full border border-[#efe4d7] bg-[#f8f3ed] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5F5345] shadow-[0_10px_24px_rgba(49,32,17,0.12)]">
                          {currentProjectHasUnsavedChanges ? "Unsaved" : "Saved"}
                        </div>
                      </div>
                    </div>

                    <div className={`${shellClass} space-y-4 self-start`}>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C7B65]">
                          Current Project
                        </p>
                        <h3 className="mt-2 font-[var(--font-playfair)] text-3xl tracking-[-0.03em] text-[#1A1A1A]">
                          {getStudioShareTitle(currentProjectWithVisualDraft)}
                        </h3>
                      </div>
                      <div className="space-y-3 text-sm text-[#6B5E4E]">
                        <p>{currentProjectWithVisualDraft.details.category}</p>
                        {currentProjectWithVisualDraft.details.eventDate ? (
                          <p>{formatDate(currentProjectWithVisualDraft.details.eventDate)}</p>
                        ) : null}
                        {clean(currentProjectWithVisualDraft.details.location) ? (
                          <p>{clean(currentProjectWithVisualDraft.details.location)}</p>
                        ) : null}
                      </div>
                      <div className="space-y-3 border-t border-[#1A1A1A]/8 pt-4 text-sm leading-7 text-[#6B5E4E]">
                        <p>
                          Save this project to keep it in Library. If you clear Studio without saving, it will be discarded.
                        </p>
                        {currentProjectWithVisualDraft.type === "image" ? (
                          <button
                            type="button"
                            onClick={() => setSelectedImage(currentProjectWithVisualDraft)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#1A1A1A] underline decoration-[#8C7B65]/50 underline-offset-4"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Open current image
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[304px] items-center justify-center rounded-[2rem] border border-dashed border-[#d8cdc0] bg-[#fbf8f4] px-8 py-12 text-center shadow-[0_20px_55px_rgba(49,32,17,0.05)] lg:mt-[5.25rem]">
                    <div className="max-w-xl">
                      <div className="mb-6 inline-flex rounded-full bg-[#f0e7db] p-6 shadow-[0_10px_24px_rgba(49,32,17,0.08)]">
                      <WandSparkles className="h-12 w-12 text-[#8C7B65]" />
                      </div>
                      <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                        No current project yet
                      </h3>
                      <p className="mx-auto max-w-xl text-sm leading-7 text-[#6B5E4E]">
                        Generate a live card or image here, then save it to Library only when you want to keep it.
                      </p>
                    </div>
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
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[600px] w-[1000px] -translate-x-1/2 bg-[#8C7B65]/6 blur-[120px]" />
    </div>
  );
}
