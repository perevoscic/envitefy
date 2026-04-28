"use client";

import * as chrono from "chrono-node";
import { Eye, Mail, Pencil, Share2, Trash2, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEventCache } from "@/app/event-cache-context";
import { type EventContextTab, useSidebar } from "@/app/sidebar-context";
import HomeOverviewDashboard from "@/components/dashboard/HomeOverviewDashboard";
import {
  type SnapPreviewKind,
  SnapProcessingCard,
  type SnapProcessingStatus,
} from "@/components/snap/SnapProcessingCard";
import type { BirthdayTemplateHint } from "@/lib/birthday-ocr-template";
import { normalizeOcrFacts, type OcrFact } from "@/lib/ocr/facts";
import {
  isBasketballOcrSkinCandidate,
  isOcrInviteCategory,
  isPickleballOcrSkinCandidate,
  type OcrSkinSelection,
} from "@/lib/ocr/skin";
import { type PendingSnapUpload, takePendingSnapUpload } from "@/lib/pending-snap-upload";
import { normalizeThumbnailFocus, type ThumbnailFocus } from "@/lib/thumbnail-focus";
import { buildWeddingScanFlyerColorsFromImageColors } from "@/lib/wedding-scan";
import { createClientAttemptId, reportClientLog } from "@/utils/client-log";
import { findFirstEmail, normalizeUrlValue } from "@/utils/contact";
import { buildEventPath } from "@/utils/event-url";
import { extractColorsFromImage } from "@/utils/image-colors";
import {
  createObjectUrlPreview,
  getUploadAcceptAttribute,
  revokeObjectUrl,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { readFileAsDataUrl } from "@/utils/thumbnail";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  timeFound?: boolean | null;
  location: string;
  description: string;
  timezone: string;
  numberOfGuests: number;
  reminders?: { minutes: number }[] | null;
  rsvp?:
    | string
    | {
        isEnabled?: boolean;
        url?: string | null;
        link?: string | null;
        deadline?: string | null;
        contact?: string | null;
      }
    | null;
  /** OCR extracted event host / organizer name. */
  hostName?: string | null;
  /** OCR extracted RSVP contact display name. */
  rsvpName?: string | null;
  /** OCR extracted venue/business/place name. */
  venue?: string | null;
  /** OCR guest tips (flyer footer); maps to event thingsToDo / Good To Know. */
  thingsToDo?: string | null;
  /** OCR extracted attire / dress code text. */
  attire?: string | null;
  /** OCR extracted event flow/activity list. */
  activities?: string[] | null;
  /** OCR extracted gift registry URL. */
  registryUrl?: string | null;
  /** OCR extracted meaningful facts not represented by dedicated fields. */
  ocrFacts?: OcrFact[] | null;
};

type SubmitScannedEventParams = {
  eventInput: EventFields;
  sourceFile?: File | null;
  scanAttemptId?: string | null;
  ocrMeta?: {
    category?: string | null;
    birthdayTemplateHint?: BirthdayTemplateHint | null;
    ocrSkin?: OcrSkinSelection | null;
    flyerColors?: Record<string, string> | null;
    thumbnailFocus?: ThumbnailFocus | null;
  };
};

type SaveHistoryResult =
  | {
      ok: true;
      eventId: string;
      savedTitle?: string;
    }
  | {
      ok: false;
      error: string;
    };

type DashboardEventItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  locationText: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: string | null;
  category: string | null;
  coverImageUrl?: string | null;
  numberOfGuests?: number;
  reminderCount?: number;
  mapsUrl?: string | null;
  createdVia?: string | null;
  ownership?: "owned" | "invited";
  shareStatus?: "accepted" | "pending" | null;
};

type DashboardMetricsCache = {
  eventId: string;
  travelMinutes: number | null;
  travelDistanceKm: number | null;
  travelUpdatedAt: string | null;
  weatherSummary: string | null;
  weatherTemp: number | null;
  weatherUpdatedAt: string | null;
};

type DashboardResponse = {
  ok: boolean;
  nextEvent: DashboardEventItem | null;
  snapshot: {
    upcomingCount30Days: number;
    upcomingCount7Days: number;
    nextEventInDays: number | null;
  };
  upcoming: DashboardEventItem[];
  rsvp: {
    going: number;
    maybe: number;
    declined: number;
    pending: number;
    recent: Array<{
      id: string;
      name: string;
      status: "going" | "maybe" | "declined" | "pending";
      updatedAt: string | null;
    }>;
  } | null;
  setupHealth: {
    flags: Array<{ key: string; label: string }>;
  };
  checklist: {
    source: "tasks" | "derived";
    items: Array<{
      id: string;
      title: string;
      done: boolean;
      dueAt: string | null;
    }>;
  };
  drafts: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      updatedAt: string | null;
      startAt: string;
    }>;
  };
  metricsCache: DashboardMetricsCache | null;
  metricsEligibility: {
    weatherEligible: boolean;
    travelWindowEligible: boolean;
  };
};

type DashboardEnrichMeta = {
  hasDestination?: boolean;
  hasOrigin?: boolean;
  originSource?: "request" | "profile" | "profile-geocoded" | "none" | string;
  travelWindowEligible?: boolean;
  weatherWindowEligible?: boolean;
  travelUsedCache?: boolean;
  weatherUsedCache?: boolean;
};

const DASHBOARD_ORIGIN_STORAGE_KEY = "envitefy:dashboard:last-origin:v1";

type OwnerRsvpRow = {
  id: string;
  name: string;
  status: "Attending" | "Declined" | "Maybe" | "Pending";
  plusOnes: string;
  foodPrefs: string;
};

type OwnerDashboardData = {
  title: string;
  dateLine: string;
  totalGuests: number;
  rsvpRate: number;
  declined: number;
  pageViews: string;
  recentRsvps: OwnerRsvpRow[];
};

declare global {
  interface Window {
    __openCreateEvent?: () => void;
    __openSnapCamera?: () => void;
    __openSnapUpload?: () => void;
    __pendingSnapUpload?: PendingSnapUpload | null;
  }
}

type DashboardInitialEventContext = {
  eventId: string;
  eventTitle: string;
  eventHref: string;
  eventEditHref: string;
  activeEventTab: EventContextTab;
};

export default function Dashboard({
  initialEventContext = null,
}: {
  initialEventContext?: DashboardInitialEventContext | null;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const {
    selectedEventId: sidebarSelectedEventId,
    selectedEventTitle: sidebarSelectedEventTitle,
    selectedEventHref: sidebarSelectedEventHref,
    selectedEventEditHref: sidebarSelectedEventEditHref,
    activeEventTab: sidebarActiveEventTab,
    setEventContextSourcePage,
    clearEventContext,
  } = useSidebar();
  const selectedEventId = initialEventContext?.eventId ?? sidebarSelectedEventId ?? null;
  const selectedEventTitle = initialEventContext?.eventTitle ?? sidebarSelectedEventTitle ?? null;
  const selectedEventHref = initialEventContext?.eventHref ?? sidebarSelectedEventHref ?? null;
  const selectedEventEditHref =
    initialEventContext?.eventEditHref ?? sidebarSelectedEventEditHref ?? null;
  const activeEventTab = initialEventContext?.activeEventTab ?? sidebarActiveEventTab;
  const isSignedIn = Boolean(session?.user);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOcrText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrCategory, setOcrCategory] = useState<string | null>(null);
  const [ocrBirthdayTemplateHint, setOcrBirthdayTemplateHint] =
    useState<BirthdayTemplateHint | null>(null);
  const [scanStatus, setScanStatus] = useState<SnapProcessingStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<SnapPreviewKind>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOcrAbortRef = useRef<AbortController | null>(null);
  const cancelledByUserRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const activeScanAttemptIdRef = useRef<string | null>(null);
  const objectPreviewUrlRef = useRef<string | null>(null);
  const submitScannedEventRef = useRef<(params: SubmitScannedEventParams) => Promise<boolean>>(
    async () => false,
  );
  const previewLoadIdRef = useRef(0);
  const scanStartedAtRef = useRef<number | null>(null);
  const scanStatusRef = useRef<SnapProcessingStatus>("idle");
  const [nextEventMetrics, setNextEventMetrics] = useState<DashboardMetricsCache | null>(null);
  const [enrichMeta, setEnrichMeta] = useState<DashboardEnrichMeta | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [ownerDashboardData, setOwnerDashboardData] = useState<OwnerDashboardData | null>(null);
  const {
    dashboardData: cachedDashboardData,
    dashboardLoading,
    refreshDashboard,
    invalidateEventCache,
    setDashboardMetricsCache,
  } = useEventCache();
  const dashboardData = (cachedDashboardData as DashboardResponse | null) ?? null;

  useEffect(() => {
    scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  useEffect(() => {
    if (!isSignedIn || dashboardData || dashboardLoading) return;
    void refreshDashboard();
  }, [dashboardData, dashboardLoading, isSignedIn, refreshDashboard]);

  useEffect(() => {
    if (!isSignedIn) {
      setNextEventMetrics(null);
      setEnrichMeta(null);
      return;
    }
    const nextEventId = dashboardData?.nextEvent?.id || null;
    if (!nextEventId) {
      setNextEventMetrics(null);
      setEnrichMeta(null);
      return;
    }
    setNextEventMetrics(dashboardData?.metricsCache ?? null);
  }, [dashboardData, isSignedIn]);

  const clearScanTimers = useCallback(() => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, []);

  const clearObjectPreviewUrl = useCallback(() => {
    if (objectPreviewUrlRef.current) {
      revokeObjectUrl(objectPreviewUrlRef.current);
      objectPreviewUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearObjectPreviewUrl();
    };
  }, [clearObjectPreviewUrl]);

  const resetScanUi = useCallback(
    (clearPreview = true) => {
      clearScanTimers();
      setScanStatus("idle");
      setUploadProgress(0);
      scanStartedAtRef.current = null;
      if (clearPreview) {
        clearObjectPreviewUrl();
        previewLoadIdRef.current += 1;
        setPreviewUrl(null);
        setPreviewKind(null);
      }
    },
    [clearObjectPreviewUrl, clearScanTimers],
  );

  const startScanUi = useCallback(
    (selected: File, previewOverride?: string | null) => {
      clearScanTimers();
      clearObjectPreviewUrl();
      scanStartedAtRef.current = null;
      previewLoadIdRef.current += 1;

      const nextPreviewKind: SnapPreviewKind = selected.type.startsWith("image/")
        ? "image"
        : selected.type === "application/pdf"
          ? "pdf"
          : "file";
      setPreviewKind(nextPreviewKind);
      if (nextPreviewKind === "image") {
        if (previewOverride) {
          setPreviewUrl(previewOverride);
        } else {
          const objectUrl = createObjectUrlPreview(selected);
          objectPreviewUrlRef.current = objectUrl;
          setPreviewUrl(objectUrl);
        }
      } else {
        setPreviewUrl(null);
      }

      setUploadProgress(0);
      setScanStatus("uploading");
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          const next = Math.min(100, prev + 6);
          if (next >= 100) {
            if (uploadIntervalRef.current) {
              clearInterval(uploadIntervalRef.current);
              uploadIntervalRef.current = null;
            }
            setScanStatus("scanning");
            scanStartedAtRef.current = Date.now();
          }
          return next;
        });
      }, 100);
    },
    [clearObjectPreviewUrl, clearScanTimers],
  );

  const finishScanUi = useCallback(async () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setUploadProgress(100);

    if (scanStatusRef.current !== "scanning") {
      setScanStatus("scanning");
      scanStartedAtRef.current = Date.now();
    }

    const minScanRevealMs = 1200;
    const elapsed = scanStartedAtRef.current ? Date.now() - scanStartedAtRef.current : 0;
    if (elapsed < minScanRevealMs) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, minScanRevealMs - elapsed);
      });
    }
  }, []);

  const logUploadIssue = useCallback(
    (err: unknown, stage: string, details?: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        stage,
        scanAttemptId: activeScanAttemptIdRef.current,
        details,
        timestamp: new Date().toISOString(),
      };
      if (err instanceof Error) {
        payload.errorName = err.name;
        payload.errorMessage = err.message;
        payload.errorStack = err.stack;
      }
      if (typeof window !== "undefined") {
        const globalNavigator = window.navigator as Navigator & {
          connection?: {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
            saveData?: boolean;
          };
        };
        payload.onLine = globalNavigator.onLine;
        payload.userAgent = globalNavigator.userAgent;
        if (globalNavigator.connection) {
          payload.connection = {
            effectiveType: globalNavigator.connection.effectiveType,
            downlink: globalNavigator.connection.downlink,
            rtt: globalNavigator.connection.rtt,
            saveData: globalNavigator.connection.saveData,
          };
        }
      }
      if (err && typeof err === "object") {
        try {
          Reflect.set(err as object, "__snapUploadLogged", true);
        } catch {
          // ignore reflecting failures
        }
      }
      console.error("[snap-upload]", payload, err);
      reportClientLog({
        area: "snap-upload",
        stage,
        scanAttemptId: activeScanAttemptIdRef.current,
        details,
        error: err,
      });
    },
    [],
  );

  useEffect(() => {
    if (!isSignedIn) return;
    if (!dashboardData?.nextEvent?.id) return;
    let cancelled = false;
    const enrich = async () => {
      setMetricsLoading(true);
      try {
        let storedOrigin: { lat: number; lng: number } | null = null;
        try {
          if (typeof window !== "undefined") {
            const raw = window.localStorage.getItem(DASHBOARD_ORIGIN_STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw) as {
                lat?: unknown;
                lng?: unknown;
              };
              const lat = Number(parsed?.lat);
              const lng = Number(parsed?.lng);
              if (
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                lat >= -90 &&
                lat <= 90 &&
                lng >= -180 &&
                lng <= 180
              ) {
                storedOrigin = { lat, lng };
              }
            }
          }
        } catch {}
        const res = await fetch("/api/dashboard/enrich-next-event", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: dashboardData.nextEvent?.id,
            ...(storedOrigin
              ? {
                  originLat: storedOrigin.lat,
                  originLng: storedOrigin.lng,
                  originLabel: "Saved location",
                }
              : {}),
          }),
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (json?.metrics) {
          const metrics = json.metrics as DashboardMetricsCache;
          setNextEventMetrics(metrics);
          setDashboardMetricsCache(metrics);
        }
        setEnrichMeta((json?.meta || null) as DashboardEnrichMeta | null);
      } catch {
        // keep fallback UI state
      } finally {
        if (!cancelled) setMetricsLoading(false);
      }
    };
    const timer = window.setTimeout(() => {
      void enrich();
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isSignedIn, dashboardData?.nextEvent?.id]);

  useEffect(() => {
    if (!selectedEventId) {
      setOwnerDashboardData(null);
      return;
    }

    const fallbackRows: OwnerRsvpRow[] = [
      {
        id: "placeholder-1",
        name: "Sarah Jenkins",
        status: "Attending",
        plusOnes: "1",
        foodPrefs: "Vegan",
      },
      {
        id: "placeholder-2",
        name: "Mark Thompson",
        status: "Attending",
        plusOnes: "0",
        foodPrefs: "None",
      },
      {
        id: "placeholder-3",
        name: "Lila Chen",
        status: "Pending",
        plusOnes: "?",
        foodPrefs: "-",
      },
    ];

    setOwnerDashboardData({
      title: selectedEventTitle || "Untitled event",
      dateLine: "Date pending",
      totalGuests: 0,
      rsvpRate: 0,
      declined: 0,
      pageViews: "--",
      recentRsvps: fallbackRows,
    });
  }, [selectedEventId, selectedEventTitle]);

  const router = useRouter();
  const readStoredOrigin = useCallback((): {
    lat: number;
    lng: number;
  } | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DASHBOARD_ORIGIN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
      const lat = Number(parsed?.lat);
      const lng = Number(parsed?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  }, []);

  const persistOrigin = useCallback((origin: { lat: number; lng: number }) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DASHBOARD_ORIGIN_STORAGE_KEY,
        JSON.stringify({
          lat: origin.lat,
          lng: origin.lng,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {}
  }, []);

  const resolveCurrentPosition = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return readStoredOrigin();
    }
    const livePosition = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      const timeout = window.setTimeout(() => resolve(null), 10500);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(timeout);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          window.clearTimeout(timeout);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    });
    if (livePosition) {
      persistOrigin(livePosition);
      return livePosition;
    }
    return readStoredOrigin();
  }, [persistOrigin, readStoredOrigin]);

  const forceRecalculateTravel = useCallback(async () => {
    const eventId = dashboardData?.nextEvent?.id;
    if (!eventId) return;
    setMetricsLoading(true);
    try {
      const currentOrigin = await resolveCurrentPosition();
      const res = await fetch("/api/dashboard/enrich-next-event", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          forceTravel: true,
          ...(currentOrigin
            ? {
                originLat: currentOrigin.lat,
                originLng: currentOrigin.lng,
                originLabel: "Current location",
              }
            : {}),
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.metrics) {
        const metrics = json.metrics as DashboardMetricsCache;
        setNextEventMetrics(metrics);
        setDashboardMetricsCache(metrics);
      }
      setEnrichMeta((json?.meta || null) as DashboardEnrichMeta | null);
    } catch {
      // keep existing state
    } finally {
      setMetricsLoading(false);
    }
  }, [dashboardData?.nextEvent?.id, resolveCurrentPosition]);

  const openCreateEvent = useCallback(() => {
    try {
      router.push("/event/gymnastics");
    } catch {}
  }, [router]);

  const isEventRoute = (pathname?.startsWith("/event/") ?? false) || Boolean(initialEventContext);
  const hasEventContextOnPage = Boolean(selectedEventId) && isEventRoute;
  const showEventHeaderActions = hasEventContextOnPage;
  const viewerName =
    (session?.user?.name as string) || (session?.user?.email as string)?.split("@")[0] || "there";
  const showWelcomeMessage = false;
  const showHeaderRow = isSignedIn && (showWelcomeMessage || showEventHeaderActions);
  const selectedEventLabel = selectedEventTitle || "Untitled event";
  const headerPrimaryActionButtonClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[#5b4ed1] bg-[#5b4ed1] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4f44bc]";
  const headerSecondaryActionButtonClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[#ddd6ff] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#4f457a] shadow-sm transition hover:border-[#c8beff] hover:bg-white";
  const showOwnerDashboard = Boolean(hasEventContextOnPage && activeEventTab === "dashboard");
  const showOwnerTabPlaceholder = Boolean(hasEventContextOnPage && activeEventTab !== "dashboard");

  const handleHeaderPreview = useCallback(() => {
    if (!selectedEventHref) return;
    router.push(selectedEventHref);
  }, [router, selectedEventHref]);

  const handleHeaderInvite = useCallback(async () => {
    if (!selectedEventHref) return;
    const url = new URL(selectedEventHref, window.location.origin).toString();
    if ((navigator as any).share) {
      await (navigator as any).share({
        title: `${selectedEventLabel} invitation`,
        text: `Join me at ${selectedEventLabel}`,
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(url);
  }, [selectedEventHref, selectedEventLabel]);

  const handleHeaderEdit = useCallback(() => {
    if (!selectedEventEditHref) return;
    router.push(selectedEventEditHref);
  }, [router, selectedEventEditHref]);

  const handleHeaderShare = useCallback(async () => {
    if (!selectedEventHref) return;
    const url = new URL(selectedEventHref, window.location.origin).toString();
    if ((navigator as any).share) {
      await (navigator as any).share({
        title: selectedEventLabel,
        url,
      });
      return;
    }
    await navigator.clipboard.writeText(url);
  }, [selectedEventHref, selectedEventLabel]);

  const handleHeaderEmail = useCallback(() => {
    const subject = encodeURIComponent(selectedEventLabel);
    const body = encodeURIComponent(
      selectedEventHref
        ? `I wanted to share this event with you: ${new URL(
            selectedEventHref,
            window.location.origin,
          ).toString()}`
        : "I wanted to share this event with you.",
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [selectedEventHref, selectedEventLabel]);

  const handleHeaderDelete = useCallback(async () => {
    if (!selectedEventId) return;
    const ok = window.confirm(
      `Are you sure you want to delete this event?\n\n${selectedEventLabel}`,
    );
    if (!ok) return;
    try {
      const response = await fetch(`/api/history/${selectedEventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      window.dispatchEvent(new CustomEvent("history:deleted", { detail: { id: selectedEventId } }));
      invalidateEventCache({ force: true, source: "dashboard-delete" });
      clearEventContext();
      const currentPath = typeof window !== "undefined" ? window.location.pathname : pathname;
      if (
        currentPath &&
        (currentPath === `/event/${selectedEventId}` ||
          currentPath.startsWith(`/event/${selectedEventId}/`) ||
          currentPath === `/smart-signup-form/${selectedEventId}` ||
          currentPath.startsWith(`/smart-signup-form/${selectedEventId}/`) ||
          currentPath.endsWith(`-${selectedEventId}`))
      ) {
        router.replace("/");
        router.refresh();
      }
    } catch {
      // no-op placeholder until a global toast system is wired here
    }
  }, [clearEventContext, pathname, router, selectedEventId, selectedEventLabel]);

  const resetForm = useCallback(() => {
    cancelledByUserRef.current = true;
    activeOcrAbortRef.current?.abort();
    activeOcrAbortRef.current = null;
    activeScanAttemptIdRef.current = null;
    resetScanUi();
    setLoading(false);
    setError(null);
    setOcrText("");
    setUploadedFile(null);
    setOcrCategory(null);
    setOcrBirthdayTemplateHint(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetScanUi]);

  useEffect(
    () => () => {
      activeOcrAbortRef.current?.abort();
      activeOcrAbortRef.current = null;
      clearScanTimers();
      previewLoadIdRef.current += 1;
    },
    [clearScanTimers],
  );

  const parseStartToIso = useCallback((value: string | null, _timezone: string) => {
    if (!value) return null;
    try {
      const isoDate = new Date(value);
      if (!Number.isNaN(isoDate.getTime())) return isoDate.toISOString();
    } catch {
      // ignore
    }
    const parsed = chrono.parseDate(value, new Date(), { forwardDate: true });
    return parsed ? new Date(parsed.getTime()).toISOString() : null;
  }, []);

  const normalizeAddress = useCallback((raw: string) => {
    if (!raw) return "";
    const fromNumber = raw.match(/\b\d{1,6}[^\n]*/);
    const candidate = fromNumber ? fromNumber[0] : raw;
    const streetSuffix =
      /(Ave(nue)?|St(reet)?|Blvd|Road|Rd|Drive|Dr|Ct|Court|Ln|Lane|Way|Pl|Place|Ter(race)?|Pkwy|Parkway|Hwy|Highway)/i;
    if (streetSuffix.test(candidate)) {
      return candidate
        .replace(/^[^\d]*?(?=\d)/, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
    return candidate.trim();
  }, []);

  const buildSubmissionEvent = useCallback(
    (input: EventFields) => {
      const timezone = input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const startIso = parseStartToIso(input.start, timezone);
      if (!startIso) return null;
      const hasExplicitTime = input.timeFound !== false;
      const endIso = input.end
        ? parseStartToIso(input.end, timezone) ||
          new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString()
        : hasExplicitTime
          ? new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString()
          : null;
      const location = normalizeAddress(input.location || "");
      return {
        ...input,
        start: startIso,
        end: endIso,
        location,
        timezone,
      } as EventFields;
    },
    [normalizeAddress, parseStartToIso],
  );

  const ingest = useCallback(
    async (incoming: File, scanAttemptId: string) => {
      setLoading(true);
      setError(null);
      cancelledByUserRef.current = false;

      const validationError = validateClientUploadFile(incoming, "attachment");
      if (validationError) {
        setError(validationError);
        logUploadIssue(new Error(validationError), "client-validation", {
          fileName: incoming.name,
          fileSize: incoming.size,
          fileType: incoming.type,
          scanAttemptId,
        });
        resetScanUi();
        setLoading(false);
        return;
      }

      try {
        let fileToUpload: File = incoming;
        try {
          const arrayBuffer = await incoming.arrayBuffer();
          fileToUpload = new File([arrayBuffer], incoming.name, {
            type: incoming.type || "application/octet-stream",
            lastModified: incoming.lastModified,
          });
        } catch (readErr) {
          // If reading fails, fall back to using the original file object
          // (works on most platforms but may fail on Android)
          console.warn("Failed to prepare OCR upload file, using original file object:", readErr);
        }

        const form = new FormData();
        form.append("file", fileToUpload);
        form.append("scanAttemptId", scanAttemptId);

        // Add timeout handling for mobile/network issues
        const controller = new AbortController();
        activeOcrAbortRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        let res: Response;
        try {
          res = await fetch("/api/ocr?fast=0", {
            method: "POST",
            body: form,
            signal: controller.signal,
            mode: "cors",
            // Ensure credentials are included for authenticated requests
            credentials: "include",
          });
          clearTimeout(timeoutId);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
            if (cancelledByUserRef.current) {
              throw new Error("__scan_cancelled__");
            }
            throw new Error("Upload timed out. Please check your connection and try again.");
          }
          logUploadIssue(fetchErr, "fetch", {
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
            scanAttemptId,
          });
          // Network errors, CORS issues, etc.
          const errorMessage = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          throw new Error(
            `Upload failed: ${errorMessage}. Please check your connection and try again.`,
          );
        }

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const errorMsg = (payload as { error?: string })?.error || `Server error (${res.status})`;
          logUploadIssue(new Error(errorMsg || "HTTP error"), "http", {
            status: res.status,
            statusText: res.statusText,
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
            scanAttemptId,
          });
          throw new Error(errorMsg || "Failed to scan file");
        }

        const data = await res.json();
        const tz =
          data?.fieldsGuess?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const formatIsoForInput = (iso: string | null, timezone: string) => {
          if (!iso) return null;
          try {
            const dt = new Date(iso);
            if (Number.isNaN(dt.getTime())) return iso;
            return new Intl.DateTimeFormat(undefined, {
              year: "numeric",
              month: "short",
              day: "2-digit",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: timezone,
            }).format(dt);
          } catch {
            return iso;
          }
        };
        // Clean RSVP field: extract ONLY phone number (digits only) or email (no "RSVP:", names, etc.)
        // This ensures the field contains ONLY the contact info that can be used directly for SMS/email
        const cleanRsvp = (rsvpText: string | null | undefined): string | null => {
          if (!rsvpText) return null;
          // Try to extract phone number first
          const phone = extractFirstPhoneNumber(rsvpText);
          if (phone) {
            // Return only digits (no formatting, no prefixes) - ready for SMS links
            const digits = phone.replace(/\D/g, "");
            if (digits.length === 11 && digits.startsWith("1")) {
              // Remove leading 1, return 10 digits only
              return digits.slice(1);
            }
            if (digits.length >= 10) {
              // Return last 10 digits only
              return digits.slice(-10);
            }
            return digits;
          }
          // Try to extract email (just the email address, no prefixes)
          const email = findFirstEmail(rsvpText);
          if (email) return email;
          // If neither found, return null
          return null;
        };
        const extractRsvpName = (rsvpText: string | null | undefined): string | null => {
          if (!rsvpText) return null;
          const withoutUrls = rsvpText
            .replace(/\bhttps?:\/\/\S+\b/gi, "")
            .replace(/\bwww\.\S+\b/gi, "");
          const withoutContact = withoutUrls
            .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "")
            .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "")
            .replace(/\b\d{10,}\b/g, "");
          const name = withoutContact
            .replace(/^RSVP:?\s*/i, "")
            .replace(/^to\s+/i, "")
            .replace(/\s+at\s*$/i, "")
            .replace(/^[,;:. -]+|[,;:. -]+$/g, "")
            .replace(/\s{2,}/g, " ")
            .trim();
          return name && /[A-Za-z]/.test(name) ? name : null;
        };

        const rawRsvp =
          typeof data?.fieldsGuess?.rsvp === "string" && data.fieldsGuess.rsvp.trim()
            ? data.fieldsGuess.rsvp.trim()
            : null;
        const cleanedRsvp = rawRsvp ? cleanRsvp(rawRsvp) : null;
        const rsvpNameFromScan = extractRsvpName(rawRsvp);
        const scannedRsvpUrl =
          typeof (data?.fieldsGuess as { rsvpUrl?: unknown })?.rsvpUrl === "string" &&
          (data.fieldsGuess as { rsvpUrl?: string }).rsvpUrl?.trim()
            ? normalizeUrlValue((data.fieldsGuess as { rsvpUrl?: string }).rsvpUrl!.trim())
            : null;
        const scannedRsvpDeadline =
          typeof (data?.fieldsGuess as { rsvpDeadline?: unknown })?.rsvpDeadline === "string" &&
          (data.fieldsGuess as { rsvpDeadline?: string }).rsvpDeadline?.trim()
            ? (data.fieldsGuess as { rsvpDeadline?: string }).rsvpDeadline!.trim()
            : null;
        const hostNameFromScan =
          typeof (data?.fieldsGuess as { hostName?: unknown })?.hostName === "string" &&
          (data.fieldsGuess as { hostName?: string }).hostName?.trim()
            ? (data.fieldsGuess as { hostName?: string }).hostName!.trim()
            : null;
        const venueFromScan =
          typeof (data?.fieldsGuess as { venue?: unknown; venueName?: unknown })?.venue ===
            "string" && (data.fieldsGuess as { venue?: string }).venue?.trim()
            ? (data.fieldsGuess as { venue?: string }).venue!.trim()
            : typeof (data?.fieldsGuess as { venueName?: unknown })?.venueName === "string" &&
                (data.fieldsGuess as { venueName?: string }).venueName?.trim()
              ? (data.fieldsGuess as { venueName?: string }).venueName!.trim()
              : null;
        const isWeddingOcrResult =
          String(data?.category || "")
            .trim()
            .toLowerCase() === "weddings";
        const structuredWeddingRsvp =
          isWeddingOcrResult && (rawRsvp || scannedRsvpUrl || scannedRsvpDeadline)
            ? {
                isEnabled: true,
                contact: rawRsvp || undefined,
                url: scannedRsvpUrl || undefined,
                link: scannedRsvpUrl || undefined,
                deadline: scannedRsvpDeadline || undefined,
              }
            : null;

        const goodToKnowRaw = (data?.fieldsGuess as { goodToKnow?: unknown })?.goodToKnow;
        const thingsToDoFromScan =
          typeof goodToKnowRaw === "string" && goodToKnowRaw.trim() ? goodToKnowRaw.trim() : null;
        const attireFromScanRaw = (data?.fieldsGuess as { attire?: unknown })?.attire;
        const attireFromScan =
          typeof attireFromScanRaw === "string" && attireFromScanRaw.trim()
            ? attireFromScanRaw.trim()
            : null;
        const activitiesFromScanRaw = (data?.fieldsGuess as { activities?: unknown })?.activities;
        const activitiesFromScan = Array.isArray(activitiesFromScanRaw)
          ? activitiesFromScanRaw
              .map((item) => (typeof item === "string" ? item.trim() : ""))
              .filter(Boolean)
              .slice(0, 8)
          : [];
        const registryUrlRaw = (data?.fieldsGuess as { registryUrl?: unknown })?.registryUrl;
        const registryUrlFromScan =
          typeof registryUrlRaw === "string" && registryUrlRaw.trim()
            ? normalizeUrlValue(registryUrlRaw.trim())
            : null;
        const ocrFactsFromScan = normalizeOcrFacts(
          (data?.fieldsGuess as { ocrFacts?: unknown; facts?: unknown })?.ocrFacts ||
            (data?.fieldsGuess as { facts?: unknown })?.facts,
        );

        const adjusted: EventFields | null = data?.fieldsGuess
          ? {
              title: String(data.fieldsGuess.title || "Event"),
              start: formatIsoForInput(data.fieldsGuess.start, tz),
              end: formatIsoForInput(data.fieldsGuess.end, tz),
              timeFound:
                typeof data.fieldsGuess.timeFound === "boolean"
                  ? data.fieldsGuess.timeFound
                  : undefined,
              location: String(data.fieldsGuess.location || ""),
              description: String(data.fieldsGuess.description || ""),
              timezone: String(data.fieldsGuess.timezone || tz || "UTC"),
              reminders: [{ minutes: 1440 }],
              numberOfGuests: 0,
              rsvp: structuredWeddingRsvp || cleanedRsvp,
              rsvpName: rsvpNameFromScan || undefined,
              hostName: hostNameFromScan || undefined,
              venue: venueFromScan || undefined,
              thingsToDo: thingsToDoFromScan || undefined,
              attire: attireFromScan || undefined,
              activities: activitiesFromScan.length ? activitiesFromScan : undefined,
              registryUrl: registryUrlFromScan || undefined,
              ocrFacts: ocrFactsFromScan.length ? ocrFactsFromScan : undefined,
            }
          : null;
        await finishScanUi();
        setOcrText(data.ocrText || "");
        setUploadedFile(fileToUpload);
        setOcrCategory(data?.category || null);
        setOcrBirthdayTemplateHint(data?.birthdayTemplateHint || null);
        if (adjusted) {
          const created = await submitScannedEventRef.current({
            eventInput: adjusted,
            sourceFile: fileToUpload,
            scanAttemptId,
            ocrMeta: {
              category: data?.category || null,
              birthdayTemplateHint: data?.birthdayTemplateHint || null,
              ocrSkin: data?.ocrSkin || null,
              thumbnailFocus: normalizeThumbnailFocus(data?.thumbnailFocus),
            },
          });
          if (!created) {
            resetScanUi();
          }
        } else {
          resetScanUi();
          setError("Unable to create an event from this scan. Please try again.");
        }
      } catch (err) {
        if (err instanceof Error && err.message === "__scan_cancelled__") {
          setError(null);
          return;
        }
        resetScanUi();
        const alreadyLogged =
          err instanceof Error &&
          Boolean((err as Error & { __snapUploadLogged?: boolean }).__snapUploadLogged);
        if (!alreadyLogged) {
          logUploadIssue(err, "ingest-final", {
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
            scanAttemptId,
          });
        }
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to scan file. Please try again.");
        }
      } finally {
        activeOcrAbortRef.current = null;
        cancelledByUserRef.current = false;
        setLoading(false);
      }
    },
    [finishScanUi, logUploadIssue, resetScanUi],
  );

  const onFile = useCallback(
    (selected: File | null, previewOverride?: string | null, pendingScanAttemptId?: string | null) => {
      if (!selected) {
        // User cancelled file selection - silently return
        return;
      }
      const scanAttemptId = pendingScanAttemptId || createClientAttemptId("scan");
      activeScanAttemptIdRef.current = scanAttemptId;
      const validationError = validateClientUploadFile(selected, "attachment");
      if (validationError) {
        setError(validationError);
        logUploadIssue(new Error(validationError), "client-validation", {
          fileName: selected.name,
          fileSize: selected.size,
          fileType: selected.type,
          scanAttemptId,
        });
        return;
      }
      startScanUi(selected, previewOverride);
      void ingest(selected, scanAttemptId);
    },
    [ingest, logUploadIssue, startScanUi],
  );

  const openCamera = useCallback(() => {
    resetForm();
    if (cameraInputRef.current) {
      try {
        cameraInputRef.current.click();
      } catch (err) {
        console.error("Failed to open camera:", err);
        setError("Unable to open camera. Please try again.");
      }
    }
  }, [resetForm, setError]);

  const openUpload = useCallback(() => {
    resetForm();
    if (fileInputRef.current) {
      try {
        fileInputRef.current.click();
      } catch (err) {
        console.error("Failed to open file picker:", err);
        setError("Unable to open file picker. Please try again.");
      }
    }
  }, [resetForm, setError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;
    w.__openSnapCamera = openCamera;
    w.__openSnapUpload = openUpload;
    return () => {
      if (w.__openSnapCamera === openCamera) {
        delete w.__openSnapCamera;
      }
      if (w.__openSnapUpload === openUpload) {
        delete w.__openSnapUpload;
      }
    };
  }, [openCamera, openUpload]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const action = (params.get("action") || "").toLowerCase();
        if (!action) return;
        const cleanup = () => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("action");
            window.history.replaceState({}, "", url.toString());
          } catch {
            // noop
          }
        };
        if (action === "camera") {
          openCamera();
          cleanup();
          return;
        }
        if (action === "upload") {
          const pendingUpload = await takePendingSnapUpload();
          if (cancelled) return;
          if (pendingUpload) {
            onFile(pendingUpload.file, pendingUpload.previewUrl ?? null, pendingUpload.scanAttemptId);
          } else {
            reportClientLog({
              area: "snap-upload",
              stage: "pending-upload-missing",
              details: { action },
            });
            openUpload();
          }
          cleanup();
        }
      } catch {
        // noop
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [onFile, openCamera, openUpload]);

  const saveToEnvitefyHistory = useCallback(
    async ({
      eventInput,
      ready,
      sourceFile,
      scanAttemptId,
      ocrMeta,
    }: {
      eventInput: EventFields;
      ready: EventFields;
      sourceFile?: File | null;
      scanAttemptId?: string | null;
      ocrMeta?: SubmitScannedEventParams["ocrMeta"];
    }): Promise<SaveHistoryResult> => {
      try {
        const timezone =
          eventInput.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

        let thumbnail: string | undefined;
        let attachment: Record<string, unknown> | undefined;
        const fileForUpload = typeof sourceFile !== "undefined" ? sourceFile : uploadedFile;
        if (fileForUpload instanceof File) {
          try {
            const upload = await uploadMediaFile({
              file: fileForUpload,
              usage: "attachment",
              scanAttemptId,
            });
            thumbnail = upload.eventMedia.thumbnail;
            attachment = upload.eventMedia.attachment;
          } catch (err) {
            console.error("Failed to upload scanned media:", err);
            logUploadIssue(err, "media-upload", {
              fileName: fileForUpload.name,
              fileSize: fileForUpload.size,
              fileType: fileForUpload.type,
              scanAttemptId,
            });
            throw err;
          }
        }

        let normalizedOcrCategory =
          typeof ocrMeta?.category === "string" && ocrMeta.category.trim()
            ? ocrMeta.category
            : ocrCategory;
        const normalizedBirthdayTemplateHint =
          ocrMeta?.birthdayTemplateHint || ocrBirthdayTemplateHint;
        const normalizedOcrSkin =
          ocrMeta?.ocrSkin && typeof ocrMeta.ocrSkin === "object" ? ocrMeta.ocrSkin : null;
        const normalizedThumbnailFocus = normalizeThumbnailFocus(ocrMeta?.thumbnailFocus);
        const isBirthdayOcrEvent =
          normalizedBirthdayTemplateHint?.detected &&
          (normalizedOcrCategory || "").toLowerCase() === "birthdays";
        const isWeddingOcrEvent = (normalizedOcrCategory || "").trim().toLowerCase() === "weddings";
        const normalizedActivities = Array.isArray(eventInput.activities)
          ? eventInput.activities
              .map((item) => (typeof item === "string" ? item.trim() : ""))
              .filter(Boolean)
              .slice(0, 8)
          : [];
        const isPickleballOcrEvent =
          normalizedOcrSkin?.sportKind === "pickleball" ||
          isPickleballOcrSkinCandidate({
            category: normalizedOcrCategory,
            title: eventInput.title,
            description: [eventInput.description, eventInput.thingsToDo].filter(Boolean).join(" "),
            activities: normalizedActivities,
          });
        if (isPickleballOcrEvent) {
          normalizedOcrCategory = "Sport Events";
        }
        const isBasketballOcrEvent =
          normalizedOcrSkin?.category === "basketball" ||
          isBasketballOcrSkinCandidate({
            category: normalizedOcrCategory,
            title: eventInput.title,
            description: eventInput.description,
            activities: normalizedActivities,
          });
        if (isBasketballOcrEvent) {
          normalizedOcrCategory = "Sport Events";
        }
        const isInviteOcrEvent =
          isOcrInviteCategory(normalizedOcrCategory) ||
          isBasketballOcrEvent ||
          isPickleballOcrEvent;
        let flyerColors =
          ocrMeta?.flyerColors && typeof ocrMeta.flyerColors === "object"
            ? ocrMeta.flyerColors
            : null;
        if (!flyerColors && isWeddingOcrEvent && normalizedOcrSkin?.category === "wedding") {
          flyerColors = normalizedOcrSkin.palette;
        }
        if (!flyerColors && isWeddingOcrEvent) {
          try {
            const previewDataUrl =
              typeof previewUrl === "string" && previewUrl.startsWith("data:image/")
                ? previewUrl
                : fileForUpload instanceof File &&
                    typeof fileForUpload.type === "string" &&
                    fileForUpload.type.startsWith("image/")
                  ? await readFileAsDataUrl(fileForUpload)
                  : null;
            if (previewDataUrl) {
              const imageColors = await extractColorsFromImage(previewDataUrl);
              flyerColors = imageColors
                ? buildWeddingScanFlyerColorsFromImageColors(imageColors)
                : null;
            }
          } catch {
            flyerColors = null;
          }
        }

        const structuredWeddingRsvp =
          isWeddingOcrEvent && eventInput.rsvp && typeof eventInput.rsvp === "object"
            ? eventInput.rsvp
            : null;
        const existingRegistries = Array.isArray((eventInput as any)?.registries)
          ? ((eventInput as any).registries as any[])
          : [];
        const normalizedRegistryUrl =
          typeof eventInput.registryUrl === "string" && eventInput.registryUrl.trim()
            ? normalizeUrlValue(eventInput.registryUrl.trim())
            : null;
        const mergedRegistries = [...existingRegistries];
        if (normalizedRegistryUrl) {
          const hasAlready = mergedRegistries.some(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.url === "string" &&
              item.url.trim().toLowerCase() === normalizedRegistryUrl.toLowerCase(),
          );
          if (!hasAlready) {
            mergedRegistries.push({
              label: "Registry",
              url: normalizedRegistryUrl,
            });
          }
        }
        const payload: any = {
          title: eventInput.title || "Event",
          data: {
            ownership: "invited",
            invitedFromScan: true,
            category: normalizedOcrCategory || undefined,
            startISO: ready.start,
            endISO: ready.end,
            timeFound: eventInput.timeFound,
            location: ready.location || undefined,
            venue:
              typeof eventInput.venue === "string" && eventInput.venue.trim()
                ? eventInput.venue.trim()
                : undefined,
            description: eventInput.description || undefined,
            rsvp: structuredWeddingRsvp || eventInput.rsvp || undefined,
            rsvpDeadline: structuredWeddingRsvp?.deadline || undefined,
            rsvpName:
              typeof eventInput.rsvpName === "string" && eventInput.rsvpName.trim()
                ? eventInput.rsvpName.trim()
                : undefined,
            hostName:
              typeof eventInput.hostName === "string" && eventInput.hostName.trim()
                ? eventInput.hostName.trim()
                : undefined,
            timezone,
            numberOfGuests: eventInput.numberOfGuests || 0,
            reminders: eventInput.reminders || undefined,
            createdVia: isBirthdayOcrEvent
              ? "ocr-birthday-skin"
              : isWeddingOcrEvent
                ? "ocr-wedding-renderer"
                : isPickleballOcrEvent
                  ? "ocr-pickleball-skin"
                  : isBasketballOcrEvent
                    ? "ocr-basketball-skin"
                    : isInviteOcrEvent
                      ? "ocr-invite-skin"
                      : "ocr",
            thumbnail,
            thumbnailFocus:
              isInviteOcrEvent && normalizedThumbnailFocus ? normalizedThumbnailFocus : undefined,
            attachment: attachment || undefined,
            ocrSkin: isInviteOcrEvent ? normalizedOcrSkin || undefined : undefined,
            flyerColors: isWeddingOcrEvent ? flyerColors || undefined : undefined,
            templateId: isBirthdayOcrEvent ? "party-pop" : undefined,
            variationId: isBirthdayOcrEvent
              ? normalizedOcrSkin?.category === "birthday"
                ? normalizedOcrSkin.skinId
                : normalizedBirthdayTemplateHint.themeId || undefined
              : undefined,
            birthdayAudience: isBirthdayOcrEvent
              ? normalizedBirthdayTemplateHint.audience || "neutral"
              : undefined,
            birthdayTemplateHint: isBirthdayOcrEvent ? normalizedBirthdayTemplateHint : undefined,
            birthdayName: isBirthdayOcrEvent
              ? normalizedBirthdayTemplateHint.honoreeName || undefined
              : undefined,
            age: isBirthdayOcrEvent ? normalizedBirthdayTemplateHint.age || undefined : undefined,
            attire:
              typeof eventInput.attire === "string" && eventInput.attire.trim()
                ? eventInput.attire.trim()
                : undefined,
            activities: normalizedActivities.length ? normalizedActivities : undefined,
            ocrFacts:
              Array.isArray(eventInput.ocrFacts) && eventInput.ocrFacts.length
                ? normalizeOcrFacts(eventInput.ocrFacts)
                : undefined,
            registries: mergedRegistries.length ? mergedRegistries : undefined,
            thingsToDo:
              typeof eventInput.thingsToDo === "string" && eventInput.thingsToDo.trim()
                ? eventInput.thingsToDo.trim()
                : undefined,
            goodToKnow:
              typeof eventInput.thingsToDo === "string" && eventInput.thingsToDo.trim()
                ? eventInput.thingsToDo.trim()
                : undefined,
          },
        };

        const historyRes = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...payload, scanAttemptId }),
        });

        const historyData: any = await historyRes.json().catch(() => ({}));
        const eventId =
          typeof historyData?.id === "string" && historyData.id.trim()
            ? historyData.id.trim()
            : undefined;
        const savedTitle = typeof historyData?.title === "string" ? historyData.title : undefined;

        if (!historyRes.ok || !eventId) {
          const serverError =
            typeof historyData?.error === "string" && historyData.error.trim()
              ? historyData.error.trim()
              : null;
          return {
            ok: false,
            error: serverError || "We couldn't save this event to your account. Please try again.",
          };
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id: eventId,
                title: historyData?.title || payload.title,
                created_at: historyData?.created_at || new Date().toISOString(),
                start: ready.start,
                category: normalizedOcrCategory || null,
                data: payload.data,
              },
            }),
          );
        }
        invalidateEventCache({ force: true, source: "dashboard-create" });
        return { ok: true, eventId, savedTitle };
      } catch (err) {
        console.error("Failed to save to Envitefy history:", err);
        logUploadIssue(err, "history-save", { scanAttemptId });
        return {
          ok: false,
          error: "We couldn't save this event to your account. Please try again.",
        };
      }
    },
    [invalidateEventCache, logUploadIssue, ocrBirthdayTemplateHint, ocrCategory, previewUrl, uploadedFile],
  );

  const submitScannedEvent = useCallback(
    async ({ eventInput, sourceFile, scanAttemptId, ocrMeta }: SubmitScannedEventParams) => {
      if (isSubmittingRef.current) return false;
      isSubmittingRef.current = true;
      try {
        const ready = buildSubmissionEvent(eventInput);
        if (!ready) {
          setError("Missing start time for event creation");
          return false;
        }

        const saveResult = await saveToEnvitefyHistory({
          eventInput,
          ready,
          sourceFile,
          scanAttemptId,
          ocrMeta,
        });
        if (!saveResult.ok) {
          setError(
            saveResult.error === "Unable to resolve signed-in account"
              ? "We couldn't verify your signed-in account. Sign out and sign back in, then try again."
              : saveResult.error,
          );
          return false;
        }
        const { eventId, savedTitle } = saveResult;

        const eventTitle = savedTitle || eventInput.title || "Event";
        const eventHref = buildEventPath(eventId, eventTitle, { created: true });
        clearEventContext();
        setEventContextSourcePage("invitedEvents");
        reportClientLog({
          area: "snap-upload",
          stage: "event-navigation-start",
          scanAttemptId,
          details: { eventId, eventHref },
        });
        router.push(eventHref);
        return true;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [buildSubmissionEvent, router, saveToEnvitefyHistory],
  );

  submitScannedEventRef.current = submitScannedEvent;

  useEffect(() => {
    // Touch the session so provider connections hydrate promptly
  }, [session]);

  const showScanSection = Boolean(error);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const handler = () => {};
    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, []);

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center bg-gradient-to-b from-[#F8F5FF] via-white to-white px-3 pb-20 pt-2 text-foreground md:px-8 md:pt-16">
      <input
        ref={cameraInputRef}
        type="file"
        accept={getUploadAcceptAttribute("header")}
        capture="environment"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={getUploadAcceptAttribute("attachment")}
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        className="hidden"
      />
      {showHeaderRow && (
        <div
          className={`w-full max-w-6xl mt-0 flex flex-col gap-4 ${
            showWelcomeMessage ? "mb-8 md:mb-10" : "mb-4 md:mb-6"
          }`}
        >
          <div
            className={`flex w-full gap-4 ${
              showWelcomeMessage
                ? "flex-col md:flex-row md:items-start md:justify-between"
                : "justify-end"
            }`}
          >
            {showWelcomeMessage && (
              <div className="mt-6 min-w-0 pl-14 sm:pl-0 flex flex-col items-start text-left md:mt-0">
                <div
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
                  style={{
                    fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
                  }}
                >
                  <span className="block text-[#1b1540] sm:inline">Welcome Back,</span>
                  <span className="mt-0.5 block text-[#7F8CFF] italic sm:ml-2 sm:mt-0 sm:inline">
                    {(session?.user?.name as string) ||
                      (session?.user?.email as string)?.split("@")[0] ||
                      "there"}
                  </span>
                </div>
                <p className="text-lg sm:text-xl md:text-xl text-[#1b1540] mt-2">
                  Let&apos;s create something unforgettable.
                </p>
              </div>
            )}
            {showEventHeaderActions && (
              <div className="flex w-full flex-col items-start gap-2 md:w-auto md:items-end">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={handleHeaderPreview}
                    className={headerPrimaryActionButtonClass}
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHeaderInvite}
                    className={headerPrimaryActionButtonClass}
                  >
                    <UserPlus size={14} />
                    <span>Invite</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHeaderEdit}
                    className={headerSecondaryActionButtonClass}
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHeaderShare}
                    className={headerSecondaryActionButtonClass}
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHeaderEmail}
                    className={headerSecondaryActionButtonClass}
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleHeaderDelete}
                    className={headerSecondaryActionButtonClass}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {isSignedIn && (
        <div className="w-full max-w-6xl mb-6 flex flex-col gap-6 md:mb-8 md:gap-8">
          {showOwnerDashboard ? (
            <EventOwnerDashboardPanel
              data={
                ownerDashboardData || {
                  title: selectedEventLabel,
                  dateLine: "Date pending",
                  totalGuests: 0,
                  rsvpRate: 0,
                  declined: 0,
                  pageViews: "--",
                  recentRsvps: [],
                }
              }
            />
          ) : showOwnerTabPlaceholder ? (
            <EventOwnerTabPlaceholder tab={activeEventTab} />
          ) : (
            <HomeOverviewDashboard
              viewerName={viewerName}
              data={dashboardData}
              metrics={nextEventMetrics}
              enrichMeta={enrichMeta}
              metricsLoading={metricsLoading}
              loading={dashboardLoading}
              onForceTravel={forceRecalculateTravel}
              onCreateEvent={openCreateEvent}
            />
          )}
        </div>
      )}
      {scanStatus !== "idle" && (
        <div className="fixed inset-y-0 left-0 right-0 z-[65] flex items-center justify-center bg-[#f4eeff]/78 p-4 backdrop-blur-md lg:left-[20rem]">
          <div role="status" aria-live="polite" className="w-full max-w-md">
            <SnapProcessingCard
              status={scanStatus}
              progress={uploadProgress}
              previewUrl={previewUrl}
              previewKind={previewKind}
              onCancel={resetForm}
            />
          </div>
        </div>
      )}

      {showScanSection && (
        <section id="scan" className="mt-12 w-full max-w-4xl space-y-5">
          <div className="space-y-3">
            {error && (
              <div className="rounded-xl border border-[#f3cade] bg-[#fff6fb] p-3 text-sm font-medium text-[#9f2d5d] shadow-sm">
                {error}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function EventOwnerDashboardPanel({ data }: { data: OwnerDashboardData }) {
  const cards = [
    {
      label: "Total Guests",
      value: String(data.totalGuests),
      accent: "text-[#1f1844]",
      note: "+0 today",
    },
    {
      label: "RSVP Rate",
      value: `${data.rsvpRate}%`,
      accent: "text-[#1f1844]",
      note: "Normal",
    },
    {
      label: "Declined",
      value: String(data.declined),
      accent: "text-[#d94764]",
      note: "",
    },
    {
      label: "Page Views",
      value: data.pageViews,
      accent: "text-[#1f1844]",
      note: "",
    },
  ];

  const statusClass = (status: OwnerRsvpRow["status"]) => {
    if (status === "Attending") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
    if (status === "Declined") {
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    if (status === "Maybe") {
      return "bg-amber-100 text-amber-700 border border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#ddd5ff] bg-gradient-to-br from-[#f4f1ff] via-[#ffffff] to-[#eef9ff] p-4 shadow-[0_22px_60px_rgba(94,76,166,0.15)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#b6a9ff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[#7ed7c8]/15 blur-3xl" />
      <div className="relative z-10 space-y-5">
        <header className="rounded-[24px] border border-[#e3ddff] bg-white/90 p-4 shadow-[0_12px_32px_rgba(70,56,120,0.10)]">
          <h2 className="truncate text-2xl font-semibold text-[#201942] sm:text-3xl">
            {data.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#6e629f]">{data.dateLine}</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-[#e6e0ff] bg-white/90 p-4 shadow-[0_10px_26px_rgba(64,47,124,0.08)]"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8f86ba]">
                {card.label}
              </p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${card.accent}`}>
                {card.value}
              </p>
              {card.note ? (
                <p className="mt-1 text-xs font-semibold text-[#4d9f76]">{card.note}</p>
              ) : (
                <p className="mt-1 text-xs text-transparent">.</p>
              )}
            </article>
          ))}
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[#e1dafb] bg-white/92 shadow-[0_12px_30px_rgba(62,50,112,0.10)]">
          <div className="flex items-center justify-between border-b border-[#ece7ff] px-4 py-3 sm:px-6">
            <h3 className="text-xl font-semibold text-[#221b45]">Recent RSVPs</h3>
            <span className="text-sm font-semibold text-[#4e4acf]">View All</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f86ba]">
                  <th className="px-4 py-3 sm:px-6">Guest Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Plus Ones</th>
                  <th className="px-4 py-3">Food Prefs</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRsvps.length > 0 ? (
                  data.recentRsvps.map((row) => (
                    <tr key={row.id} className="border-t border-[#f0ecff] text-sm text-[#2b2350]">
                      <td className="px-4 py-3 font-semibold sm:px-6">{row.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            row.status,
                          )}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.plusOnes}</td>
                      <td className="px-4 py-3">{row.foodPrefs}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#f0ecff] text-sm text-[#6e629f]">
                    <td className="px-4 py-4 sm:px-6" colSpan={4}>
                      No RSVPs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}

function EventOwnerTabPlaceholder({
  tab,
}: {
  tab: "dashboard" | "guests" | "communications" | "settings";
}) {
  const label =
    tab === "guests" ? "Guests" : tab === "communications" ? "Communications" : "Settings";
  return (
    <section className="rounded-[28px] border border-[#ddd5ff] bg-white/90 p-6 shadow-[0_20px_50px_rgba(80,63,145,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f86ba]">
        Event Workspace
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-[#201942]">{label}</h3>
      <p className="mt-2 text-sm text-[#6e629f]">
        {label} content is available in the next step. Dashboard remains the default view on event
        open.
      </p>
    </section>
  );
}
