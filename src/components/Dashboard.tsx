"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
  type CSSProperties,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarIconGoogle } from "@/components/CalendarIcons";
import {
  CreateEventIllustration,
  ScanIllustration,
  SignUpIllustration,
  UploadIllustration,
} from "@/components/landing/action-illustrations";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import * as chrono from "chrono-node";
import {
  ArrowRight,
  Calendar,
  Car,
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Eye,
  Mail,
  MapPin,
  MapPinned,
  Navigation,
  Pencil,
  Share2,
  Sun,
  Trash2,
  UserPlus,
  Wind,
} from "lucide-react";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { findFirstEmail } from "@/utils/contact";
import { buildEventPath } from "@/utils/event-url";
import {
  SnapProcessingCard,
  type SnapPreviewKind,
  type SnapProcessingStatus,
} from "@/components/snap/SnapProcessingCard";
import {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_KEYS,
  type TemplateKey,
} from "@/config/feature-visibility";
import { useFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { useSidebar, type EventContextTab } from "@/app/sidebar-context";

type EventFields = {
  title: string;
  start: string | null;
  end: string | null;
  location: string;
  description: string;
  timezone: string;
  numberOfGuests: number;
  reminders?: { minutes: number }[] | null;
  rsvp?: string | null;
};

type CalendarProvider = "google" | "microsoft" | "apple" | "envitefy";

type AutoAddPreference = {
  enabled: boolean;
  provider: CalendarProvider | null;
};

type ProviderActionOptions = {
  enableAutoAdd?: boolean;
};

type SubmitScannedEventParams = {
  eventInput: EventFields;
  provider: CalendarProvider;
  mode: "manual" | "auto";
  sourceFile?: File | null;
  rememberAutoAdd?: boolean;
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

function isDashboardResponsePayload(
  value: unknown
): value is DashboardResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DashboardResponse> & { ok?: unknown };
  if (candidate.ok !== true) return false;
  if (!candidate.snapshot || typeof candidate.snapshot !== "object")
    return false;
  if (!Array.isArray(candidate.upcoming)) return false;
  if (!candidate.setupHealth || typeof candidate.setupHealth !== "object")
    return false;
  if (!candidate.checklist || typeof candidate.checklist !== "object")
    return false;
  if (!candidate.drafts || typeof candidate.drafts !== "object") return false;
  if (
    !candidate.metricsEligibility ||
    typeof candidate.metricsEligibility !== "object"
  ) {
    return false;
  }
  return true;
}

type DashboardEnrichMeta = {
  hasDestination?: boolean;
  hasOrigin?: boolean;
  originSource?: "request" | "profile" | "profile-geocoded" | "none" | string;
  travelWindowEligible?: boolean;
  weatherWindowEligible?: boolean;
  travelUsedCache?: boolean;
  weatherUsedCache?: boolean;
};

const AUTO_ADD_PREFERENCE_STORAGE_KEY = "envitefy:snap:auto-add:v1";
const DASHBOARD_ORIGIN_STORAGE_KEY = "envitefy:dashboard:last-origin:v1";
const DEFAULT_AUTO_ADD_PREFERENCE: AutoAddPreference = {
  enabled: false,
  provider: null,
};

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

type HighlightTone = "primary" | "secondary" | "accent" | "success";

const TONE_STYLES: Record<
  HighlightTone,
  { iconBg: string; cardSurface: string; accent: string }
> = {
  primary: {
    iconBg: "bg-[#e6f3ee]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(171, 208, 193, 0.25))",
    accent: "rgba(105, 166, 159, 0.65)",
  },
  secondary: {
    iconBg: "bg-[#ede8fb]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(183, 171, 220, 0.25))",
    accent: "rgba(123, 104, 196, 0.55)",
  },
  accent: {
    iconBg: "bg-[#fde8f1]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(238, 169, 183, 0.25))",
    accent: "rgba(210, 105, 140, 0.58)",
  },
  success: {
    iconBg: "bg-[#e6f6f0]",
    cardSurface:
      "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(170, 214, 196, 0.25))",
    accent: "rgba(94, 154, 127, 0.55)",
  },
};

declare global {
  interface Window {
    __openCreateEvent?: () => void;
    __openSnapCamera?: () => void;
    __openSnapUpload?: () => void;
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
    clearEventContext,
  } = useSidebar();
  const selectedEventId =
    initialEventContext?.eventId ?? sidebarSelectedEventId ?? null;
  const selectedEventTitle =
    initialEventContext?.eventTitle ?? sidebarSelectedEventTitle ?? null;
  const selectedEventHref =
    initialEventContext?.eventHref ?? sidebarSelectedEventHref ?? null;
  const selectedEventEditHref =
    initialEventContext?.eventEditHref ?? sidebarSelectedEventEditHref ?? null;
  const activeEventTab =
    initialEventContext?.activeEventTab ?? sidebarActiveEventTab;
  const isSignedIn = Boolean(session?.user);
  const {
    loading: visibilityLoading,
    required: onboardingRequired,
    completed: onboardingCompleted,
    promptDismissedAt,
    visibleTemplateKeys,
    refresh: refreshVisibility,
  } = useFeatureVisibility();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [event, setEvent] = useState<EventFields | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setOcrText] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrCategory, setOcrCategory] = useState<string | null>(null);
  const [autoAddPreference, setAutoAddPreference] = useState<AutoAddPreference>(
    DEFAULT_AUTO_ADD_PREFERENCE
  );
  const [scanStatus, setScanStatus] = useState<SnapProcessingStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<SnapPreviewKind>(null);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeOcrAbortRef = useRef<AbortController | null>(null);
  const cancelledByUserRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const submitScannedEventRef = useRef<
    (params: SubmitScannedEventParams) => Promise<boolean>
  >(async () => false);
  const currentPreviewUrlRef = useRef<string | null>(null);
  const scanStartedAtRef = useRef<number | null>(null);
  const scanStatusRef = useRef<SnapProcessingStatus>("idle");
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [softPromptDismissed, setSoftPromptDismissed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [nextEventMetrics, setNextEventMetrics] =
    useState<DashboardMetricsCache | null>(null);
  const [enrichMeta, setEnrichMeta] = useState<DashboardEnrichMeta | null>(
    null
  );
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [ownerDashboardData, setOwnerDashboardData] =
    useState<OwnerDashboardData | null>(null);

  useEffect(() => {
    scanStatusRef.current = scanStatus;
  }, [scanStatus]);

  const persistAutoAddPreference = useCallback((next: AutoAddPreference) => {
    setAutoAddPreference(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        AUTO_ADD_PREFERENCE_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTO_ADD_PREFERENCE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AutoAddPreference>;
      const provider =
        parsed?.provider === "google" ||
        parsed?.provider === "microsoft" ||
        parsed?.provider === "apple"
          ? parsed.provider
          : null;
      setAutoAddPreference({
        enabled: Boolean(parsed?.enabled && provider),
        provider,
      });
    } catch {
      setAutoAddPreference(DEFAULT_AUTO_ADD_PREFERENCE);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn || visibilityLoading) return;
    setOnboardingModalOpen(Boolean(onboardingRequired));
  }, [isSignedIn, visibilityLoading, onboardingRequired]);

  const clearScanTimers = useCallback(() => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
  }, []);

  const resetScanUi = useCallback(
    (clearPreview = true) => {
      clearScanTimers();
      setScanStatus("idle");
      setUploadProgress(0);
      scanStartedAtRef.current = null;
      if (clearPreview) {
        if (currentPreviewUrlRef.current) {
          URL.revokeObjectURL(currentPreviewUrlRef.current);
        }
        currentPreviewUrlRef.current = null;
        setPreviewUrl(null);
        setPreviewKind(null);
      }
    },
    [clearScanTimers]
  );

  const startScanUi = useCallback(
    (selected: File) => {
      clearScanTimers();
      scanStartedAtRef.current = null;

      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;

      const nextPreviewKind: SnapPreviewKind = selected.type.startsWith(
        "image/"
      )
        ? "image"
        : selected.type === "application/pdf"
        ? "pdf"
        : "file";
      setPreviewKind(nextPreviewKind);
      if (nextPreviewKind === "image") {
        const nextPreviewUrl = URL.createObjectURL(selected);
        currentPreviewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
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
    [clearScanTimers]
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
    const elapsed = scanStartedAtRef.current
      ? Date.now() - scanStartedAtRef.current
      : 0;
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
    },
    []
  );

  const [connected, setConnected] = useState<{
    google: boolean;
    microsoft: boolean;
  }>({
    google: false,
    microsoft: false,
  });

  useEffect(() => {
    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnected({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
        });
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };
    fetchConnected();
  }, [session]);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadDashboard = async () => {
      setDashboardLoading(true);
      try {
        const res = await fetch("/api/dashboard", {
          credentials: "include",
          cache: "no-store",
        });
        const json = (await res
          .json()
          .catch(() => null)) as DashboardResponse | null;
        if (res.ok && isDashboardResponsePayload(json)) {
          setDashboardData(json);
          setNextEventMetrics(json.metricsCache || null);
          setEnrichMeta(null);
        } else {
          setDashboardData(null);
          setNextEventMetrics(null);
          setEnrichMeta(null);
        }
      } catch {
        setDashboardData(null);
        setNextEventMetrics(null);
        setEnrichMeta(null);
      } finally {
        setDashboardLoading(false);
      }
    };
    void loadDashboard();
  }, [isSignedIn]);

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
            const raw = window.localStorage.getItem(
              DASHBOARD_ORIGIN_STORAGE_KEY
            );
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
          setNextEventMetrics(json.metrics as DashboardMetricsCache);
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

    const formatPageViews = (value: unknown): string => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) return "--";
      if (numeric >= 1000) {
        return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1)}k`;
      }
      return `${Math.round(numeric)}`;
    };

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

    let ignore = false;
    (async () => {
      try {
        const [eventRes, rsvpRes] = await Promise.all([
          fetch(`/api/history/${selectedEventId}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`/api/events/${selectedEventId}/rsvp`, {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        const eventPayload = eventRes.ok
          ? await eventRes.json().catch(() => null)
          : null;
        const rsvpPayload = rsvpRes.ok
          ? await rsvpRes.json().catch(() => null)
          : null;

        const rowData = eventPayload?.data || {};
        const title =
          eventPayload?.title || selectedEventTitle || "Untitled event";
        const startRaw =
          rowData?.startISO ||
          rowData?.start ||
          rowData?.fieldsGuess?.start ||
          rowData?.event?.start ||
          null;
        const endRaw =
          rowData?.endISO ||
          rowData?.end ||
          rowData?.fieldsGuess?.end ||
          rowData?.event?.end ||
          null;
        const dateLine = startRaw
          ? formatEventTimeRange(
              String(startRaw),
              endRaw ? String(endRaw) : null
            )
          : "Date pending";

        const stats = rsvpPayload?.stats || { yes: 0, no: 0, maybe: 0 };
        const yes = Number(stats.yes || 0);
        const no = Number(stats.no || 0);
        const maybe = Number(stats.maybe || 0);
        const filled = Number(
          rsvpPayload?.filled != null ? rsvpPayload.filled : yes + no + maybe
        );
        const configuredGuests = Number(rowData?.numberOfGuests || 0);
        const totalGuests = configuredGuests > 0 ? configuredGuests : filled;
        const rsvpRate =
          totalGuests > 0 ? Math.round((filled / totalGuests) * 100) : 0;

        const responses: OwnerRsvpRow[] = Array.isArray(rsvpPayload?.responses)
          ? rsvpPayload.responses
              .slice(0, 6)
              .map((entry: any, index: number) => {
                const fullName = [entry?.firstName, entry?.lastName]
                  .map((part) => String(part || "").trim())
                  .filter(Boolean)
                  .join(" ");
                const displayName =
                  fullName ||
                  String(entry?.name || "").trim() ||
                  String(entry?.email || "").trim() ||
                  `Guest ${index + 1}`;
                const responseRaw = String(entry?.response || "").toLowerCase();
                const status: OwnerRsvpRow["status"] =
                  responseRaw === "yes"
                    ? "Attending"
                    : responseRaw === "no"
                    ? "Declined"
                    : responseRaw === "maybe"
                    ? "Maybe"
                    : "Pending";
                return {
                  id: `${selectedEventId}-rsvp-${index}`,
                  name: displayName,
                  status,
                  plusOnes: String(entry?.plusOnes ?? "0"),
                  foodPrefs: String(entry?.foodPrefs || "-"),
                };
              })
          : [];

        const pageViewsRaw =
          rowData?.analytics?.pageViews ??
          rowData?.pageViews ??
          rowData?.views ??
          null;

        if (!ignore) {
          setOwnerDashboardData({
            title,
            dateLine,
            totalGuests,
            rsvpRate,
            declined: no,
            pageViews: formatPageViews(pageViewsRaw),
            recentRsvps: responses.length > 0 ? responses : fallbackRows,
          });
        }
      } catch {
        if (!ignore) {
          setOwnerDashboardData({
            title: selectedEventTitle || "Untitled event",
            dateLine: "Date pending",
            totalGuests: 0,
            rsvpRate: 0,
            declined: 0,
            pageViews: "--",
            recentRsvps: fallbackRows,
          });
        }
      }
    })();

    return () => {
      ignore = true;
    };
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
        })
      );
    } catch {}
  }, []);

  const resolveCurrentPosition = useCallback(async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return readStoredOrigin();
    }
    const livePosition = await new Promise<{ lat: number; lng: number } | null>(
      (resolve) => {
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
          }
        );
      }
    );
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
        setNextEventMetrics(json.metrics as DashboardMetricsCache);
      }
      setEnrichMeta((json?.meta || null) as DashboardEnrichMeta | null);
    } catch {
      // keep existing state
    } finally {
      setMetricsLoading(false);
    }
  }, [
    dashboardData?.nextEvent?.id,
    resolveCurrentPosition,
  ]);

  const openCreateEvent = useCallback(() => {
    try {
      router.push("/event/new");
    } catch {}
  }, [router]);

  const isEventRoute =
    (pathname?.startsWith("/event/") ?? false) || Boolean(initialEventContext);
  const hasEventContextOnPage = Boolean(selectedEventId) && isEventRoute;
  const showEventHeaderActions = hasEventContextOnPage;
  const showWelcomeMessage = isSignedIn && pathname === "/";
  const showHeaderRow =
    isSignedIn && (showWelcomeMessage || showEventHeaderActions);
  const selectedEventLabel = selectedEventTitle || "Untitled event";
  const headerPrimaryActionButtonClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[#5b4ed1] bg-[#5b4ed1] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4f44bc]";
  const headerSecondaryActionButtonClass =
    "inline-flex items-center gap-1.5 rounded-full border border-[#ddd6ff] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#4f457a] shadow-sm transition hover:border-[#c8beff] hover:bg-white";
  const showOwnerDashboard = Boolean(
    hasEventContextOnPage && activeEventTab === "dashboard"
  );
  const showOwnerTabPlaceholder = Boolean(
    hasEventContextOnPage && activeEventTab !== "dashboard"
  );

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
            window.location.origin
          ).toString()}`
        : "I wanted to share this event with you."
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [selectedEventHref, selectedEventLabel]);

  const handleHeaderDelete = useCallback(async () => {
    if (!selectedEventId) return;
    const ok = window.confirm(
      `Are you sure you want to delete this event?\n\n${selectedEventLabel}`
    );
    if (!ok) return;
    try {
      const response = await fetch(`/api/history/${selectedEventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete event");
      }
      window.dispatchEvent(
        new CustomEvent("history:deleted", { detail: { id: selectedEventId } })
      );
      clearEventContext();
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : pathname;
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
  }, [
    clearEventContext,
    pathname,
    router,
    selectedEventId,
    selectedEventLabel,
  ]);

  const resetForm = useCallback(() => {
    cancelledByUserRef.current = true;
    activeOcrAbortRef.current?.abort();
    activeOcrAbortRef.current = null;
    resetScanUi();
    setEvent(null);
    setModalOpen(false);
    setLoading(false);
    setError(null);
    setOcrText("");
    setUploadedFile(null);
    setOcrCategory(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetScanUi]);

  useEffect(
    () => () => {
      activeOcrAbortRef.current?.abort();
      activeOcrAbortRef.current = null;
      clearScanTimers();
      if (currentPreviewUrlRef.current) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
      currentPreviewUrlRef.current = null;
    },
    [clearScanTimers]
  );

  const parseStartToIso = useCallback(
    (value: string | null, timezone: string) => {
      if (!value) return null;
      try {
        const isoDate = new Date(value);
        if (!Number.isNaN(isoDate.getTime())) return isoDate.toISOString();
      } catch {
        // ignore
      }
      const parsed = chrono.parseDate(value, new Date(), { forwardDate: true });
      return parsed ? new Date(parsed.getTime()).toISOString() : null;
    },
    []
  );

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
      const timezone =
        input.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";
      const startIso = parseStartToIso(input.start, timezone);
      if (!startIso) return null;
      const endIso = input.end
        ? parseStartToIso(input.end, timezone) ||
          new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString()
        : new Date(new Date(startIso).getTime() + 90 * 60 * 1000).toISOString();
      const location = normalizeAddress(input.location || "");
      return {
        ...input,
        start: startIso,
        end: endIso,
        location,
        timezone,
      } as EventFields;
    },
    [normalizeAddress, parseStartToIso]
  );

  const ingest = useCallback(
    async (incoming: File) => {
      setLoading(true);
      setError(null);
      cancelledByUserRef.current = false;

      // Validate file size before upload (10 MB limit)
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (incoming.size > maxSize) {
        setError("File is too large. Please upload a file smaller than 10 MB.");
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
          console.warn(
            "Failed to prepare OCR upload file, using original file object:",
            readErr
          );
        }

        const form = new FormData();
        form.append("file", fileToUpload);

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
            throw new Error(
              "Upload timed out. Please check your connection and try again."
            );
          }
          logUploadIssue(fetchErr, "fetch", {
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
          });
          // Network errors, CORS issues, etc.
          const errorMessage =
            fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          throw new Error(
            `Upload failed: ${errorMessage}. Please check your connection and try again.`
          );
        }

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const errorMsg =
            (payload as { error?: string })?.error ||
            `Server error (${res.status})`;
          logUploadIssue(new Error(errorMsg || "HTTP error"), "http", {
            status: res.status,
            statusText: res.statusText,
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
          });
          throw new Error(errorMsg || "Failed to scan file");
        }

        const data = await res.json();
        const tz =
          data?.fieldsGuess?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "UTC";
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
        const cleanRsvp = (
          rsvpText: string | null | undefined
        ): string | null => {
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

        const cleanedRsvp = data?.fieldsGuess?.rsvp
          ? cleanRsvp(data.fieldsGuess.rsvp)
          : null;

        const adjusted: EventFields | null = data?.fieldsGuess
          ? {
              title: String(data.fieldsGuess.title || "Event"),
              start: formatIsoForInput(data.fieldsGuess.start, tz),
              end: formatIsoForInput(data.fieldsGuess.end, tz),
              location: String(data.fieldsGuess.location || ""),
              description: String(data.fieldsGuess.description || ""),
              timezone: String(data.fieldsGuess.timezone || tz || "UTC"),
              reminders: [{ minutes: 1440 }],
              numberOfGuests: 0,
              rsvp: cleanedRsvp,
            }
          : null;
        await finishScanUi();
        setEvent(adjusted);
        setOcrText(data.ocrText || "");
        setUploadedFile(fileToUpload);
        setOcrCategory(data?.category || null);
        if (adjusted) {
          setModalOpen(false);
          const created = await submitScannedEventRef.current({
            eventInput: adjusted,
            provider: "envitefy",
            mode: "auto",
            sourceFile: fileToUpload,
          });
          if (!created) {
            resetScanUi();
          }
        } else {
          resetScanUi();
          setModalOpen(false);
          setError(
            "Unable to create an event from this scan. Please try again."
          );
        }
      } catch (err) {
        if (err instanceof Error && err.message === "__scan_cancelled__") {
          setEvent(null);
          setModalOpen(false);
          setError(null);
          return;
        }
        resetScanUi();
        setEvent(null);
        setModalOpen(false);
        const alreadyLogged =
          err instanceof Error &&
          Boolean(
            (err as Error & { __snapUploadLogged?: boolean }).__snapUploadLogged
          );
        if (!alreadyLogged) {
          logUploadIssue(err, "ingest-final", {
            fileName: incoming.name,
            fileSize: incoming.size,
            fileType: incoming.type,
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
    [finishScanUi, logUploadIssue, resetScanUi]
  );

  const onFile = useCallback(
    (selected: File | null) => {
      if (!selected) {
        // User cancelled file selection - silently return
        return;
      }
      startScanUi(selected);
      void ingest(selected);
    },
    [ingest, startScanUi]
  );

  const openCamera = useCallback(() => {
    resetForm();
    // Use setTimeout to ensure the click happens within the user gesture context on mobile
    setTimeout(() => {
      if (cameraInputRef.current) {
        try {
          cameraInputRef.current.click();
        } catch (err) {
          console.error("Failed to open camera:", err);
          setError("Unable to open camera. Please try again.");
        }
      }
    }, 0);
  }, [resetForm, setError]);

  const openUpload = useCallback(() => {
    resetForm();
    // Use setTimeout to ensure the click happens within the user gesture context on mobile
    // This is necessary for iOS Safari and some Android browsers
    setTimeout(() => {
      if (fileInputRef.current) {
        try {
          fileInputRef.current.click();
        } catch (err) {
          console.error("Failed to open file picker:", err);
          setError("Unable to open file picker. Please try again.");
        }
      }
    }, 0);
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
      } else if (action === "upload") {
        openUpload();
        cleanup();
      }
    } catch {
      // noop
    }
  }, [openCamera, openUpload]);

  useEffect(() => {
    if (!event && modalOpen) {
      setModalOpen(false);
    }
  }, [event, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    if (typeof document === "undefined") return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [modalOpen]);

  const providerLabel = useCallback((provider: CalendarProvider) => {
    if (provider === "google") return "Google Calendar";
    if (provider === "microsoft") return "Outlook Calendar";
    if (provider === "envitefy") return "Envitefy";
    return "Apple Calendar";
  }, []);

  const buildIcsQuery = useCallback((ready: EventFields, inline = false) => {
    return new URLSearchParams({
      title: ready.title || "Event",
      start: ready.start ?? "",
      end: ready.end ?? "",
      location: ready.location || "",
      description: ready.description || "",
      timezone: ready.timezone || "America/Chicago",
      ...(inline ? { disposition: "inline" } : {}),
      ...(ready.reminders && ready.reminders.length
        ? {
            reminders: ready.reminders.map((r) => String(r.minutes)).join(","),
          }
        : {}),
    }).toString();
  }, []);

  const saveToEnvitefyHistory = useCallback(
    async ({
      eventInput,
      ready,
      sourceFile,
    }: {
      eventInput: EventFields;
      ready: EventFields;
      sourceFile?: File | null;
    }) => {
      let eventId: string | undefined;
      let savedTitle: string | undefined;
      try {
        const timezone =
          eventInput.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "UTC";

        let thumbnail: string | undefined;
        let attachment:
          | { name: string; type: string; dataUrl: string }
          | undefined;
        const fileForUpload =
          typeof sourceFile !== "undefined" ? sourceFile : uploadedFile;
        if (fileForUpload && fileForUpload.type.startsWith("image/")) {
          try {
            thumbnail =
              (await createThumbnailDataUrl(fileForUpload, 1200, 0.85)) ||
              undefined;
            const dataUrl = await readFileAsDataUrl(fileForUpload);
            attachment = {
              name: fileForUpload.name,
              type: fileForUpload.type,
              dataUrl,
            };
          } catch (err) {
            console.error("Failed to create thumbnail:", err);
          }
        }

        const payload: any = {
          title: eventInput.title || "Event",
          data: {
            category: ocrCategory || undefined,
            startISO: ready.start,
            endISO: ready.end,
            location: ready.location || undefined,
            description: eventInput.description || undefined,
            rsvp: eventInput.rsvp || undefined,
            timezone,
            numberOfGuests: eventInput.numberOfGuests || 0,
            reminders: eventInput.reminders || undefined,
            createdVia: "ocr",
            thumbnail,
            attachment,
          },
        };

        const historyRes = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const historyData: any = await historyRes.json().catch(() => ({}));
        eventId = (historyData as any)?.id as string | undefined;
        if (typeof historyData?.title === "string") {
          savedTitle = historyData.title as string;
        }

        if (eventId && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id: eventId,
                title: historyData?.title || payload.title,
                created_at: historyData?.created_at || new Date().toISOString(),
                start: ready.start,
                category: ocrCategory || null,
                data: payload.data,
              },
            })
          );
        }
      } catch (err) {
        console.error("Failed to save to Envitefy history:", err);
      }

      return { eventId, savedTitle };
    },
    [ocrCategory, uploadedFile]
  );

  const connectGoogle = useCallback(() => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for Google Calendar");
      return;
    }

    // Encode event data as base64 JSON for OAuth state
    const eventData = {
      title: ready.title || "Event",
      start: ready.start,
      end: ready.end,
      location: ready.location || "",
      description: event.description || "",
      timezone: ready.timezone || "UTC",
      reminders: event.reminders || null,
      allDay: false,
      recurrence: null,
    };
    // Browser-compatible base64 encoding matching callback's decodeURIComponent expectation
    // The callback decodes: Buffer.from(state, "base64").toString("utf8") then JSON.parse(decodeURIComponent(json))
    const jsonStr = JSON.stringify(eventData);
    // Use btoa with encodeURIComponent for proper UTF-8 handling
    const stateParam = btoa(encodeURIComponent(jsonStr));
    window.open(
      `/api/google/auth?state=${encodeURIComponent(stateParam)}`,
      "_blank"
    );
  }, [event, buildSubmissionEvent, setError]);

  const connectOutlook = useCallback(() => {
    window.open("/api/outlook/auth", "_blank");
  }, []);

  const submitScannedEvent = useCallback(
    async ({
      eventInput,
      provider,
      mode,
      sourceFile,
      rememberAutoAdd = false,
    }: SubmitScannedEventParams) => {
      if (isSubmittingRef.current) return false;
      isSubmittingRef.current = true;
      try {
        const ready = buildSubmissionEvent(eventInput);
        if (!ready) {
          const label = providerLabel(provider);
          setError(`Missing start time for ${label}`);
          if (mode === "auto" && provider !== "envitefy") {
            setEvent(eventInput);
            setModalOpen(true);
          }
          return false;
        }

        const { eventId, savedTitle } = await saveToEnvitefyHistory({
          eventInput,
          ready,
          sourceFile,
        });

        try {
          if (provider === "envitefy") {
            // Envitefy-only flow: save to history and skip external calendar redirects.
          } else if (provider === "google") {
            const res = await fetch("/api/events/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(ready),
            });
            const payload: any = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                payload?.error || "Failed to add to Google Calendar"
              );
            }
            if (payload?.htmlLink) {
              window.open(payload.htmlLink, "_blank");
            }
          } else if (provider === "microsoft") {
            const res = await fetch("/api/events/outlook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(ready),
            });
            const payload: any = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error(
                payload?.error || "Failed to add to Outlook Calendar"
              );
            }
            if (payload?.webLink) {
              window.open(payload.webLink, "_blank");
            }
          } else {
            const q = buildIcsQuery(ready, true);
            const url = `${window.location.origin}/api/ics?${q}`;
            const popup = window.open(url, "_blank");
            if (!popup) {
              throw new Error(
                "Popup was blocked while opening Apple Calendar. Allow popups and try again."
              );
            }
          }
        } catch (providerErr: any) {
          const label = providerLabel(provider);
          const baseError =
            providerErr?.message ||
            `Failed to add to ${label}. Please try again from review.`;
          setError(
            mode === "auto"
              ? `${baseError} Review details and retry.`
              : baseError
          );
          if (mode === "auto" && provider !== "envitefy") {
            setEvent(eventInput);
            setModalOpen(true);
          }
          return false;
        }

        if (rememberAutoAdd) {
          persistAutoAddPreference({ enabled: true, provider });
        }

        if (eventId) {
          const eventTitle = savedTitle || eventInput.title || "Event";
          router.push(buildEventPath(eventId, eventTitle, { created: true }));
        } else {
          resetForm();
        }
        return true;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [
      buildSubmissionEvent,
      buildIcsQuery,
      persistAutoAddPreference,
      providerLabel,
      resetForm,
      router,
      saveToEnvitefyHistory,
    ]
  );

  submitScannedEventRef.current = submitScannedEvent;

  const dlIcs = useCallback(() => {
    if (!event?.start) return;
    const ready = buildSubmissionEvent(event);
    if (!ready) {
      setError("Missing start time for calendar export");
      return;
    }
    const q = buildIcsQuery(ready);
    window.location.href = `/api/ics?${q}`;
  }, [event, buildIcsQuery, buildSubmissionEvent]);

  const addGoogle = useCallback(
    async (options?: ProviderActionOptions) => {
      if (!event) return;
      await submitScannedEvent({
        eventInput: event,
        provider: "google",
        mode: "manual",
        rememberAutoAdd: Boolean(options?.enableAutoAdd),
      });
    },
    [event, submitScannedEvent]
  );

  const addOutlook = useCallback(
    async (options?: ProviderActionOptions) => {
      if (!event) return;
      await submitScannedEvent({
        eventInput: event,
        provider: "microsoft",
        mode: "manual",
        rememberAutoAdd: Boolean(options?.enableAutoAdd),
      });
    },
    [event, submitScannedEvent]
  );

  const addAppleCalendar = useCallback(
    async (options?: ProviderActionOptions) => {
      if (!event) return;
      await submitScannedEvent({
        eventInput: event,
        provider: "apple",
        mode: "manual",
        rememberAutoAdd: Boolean(options?.enableAutoAdd),
      });
    },
    [event, submitScannedEvent]
  );

  useEffect(() => {
    // Touch the session so provider connections hydrate promptly
  }, [session]);

  const showScanSection = Boolean(
    error || loading || scanStatus !== "idle" || (modalOpen && event)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 1023px)");
    const handler = () => {};
    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
    };
  }, []);

  const showSoftPrompt =
    isSignedIn &&
    !visibilityLoading &&
    !onboardingRequired &&
    !onboardingCompleted &&
    !promptDismissedAt &&
    !softPromptDismissed;

  const handleDismissPrompt = useCallback(async () => {
    try {
      await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "dismiss_prompt" }),
      });
    } catch {
      // ignore network errors for dismiss
    } finally {
      setSoftPromptDismissed(true);
      void refreshVisibility();
    }
  }, [refreshVisibility]);

  const handleOnboardingComplete = useCallback(async () => {
    setOnboardingModalOpen(false);
    await refreshVisibility();
  }, [refreshVisibility]);

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center bg-gradient-to-b from-[#F8F5FF] via-white to-white px-3 pb-20 pt-2 text-foreground md:px-8 md:pt-16">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
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
              <div className="min-w-0 flex flex-col items-start text-left">
                <div
                  className="truncate text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
                  style={{
                    fontFamily:
                      '"Venturis ADF", "Venturis ADF Fallback", serif',
                  }}
                >
                  <span className="text-[#1b1540]">Welcome Back,</span>
                  <span className="ml-2 text-[#7F8CFF] italic">
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
            <UpcomingEventsPanel
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
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#f4eeff]/78 p-4 backdrop-blur-md">
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

          <SnapEventModal
            open={modalOpen && Boolean(event)}
            event={event}
            onClose={resetForm}
            setEvent={setEvent}
            connected={connected}
            addGoogle={addGoogle}
            connectGoogle={connectGoogle}
            addOutlook={addOutlook}
            connectOutlook={connectOutlook}
            dlIcs={dlIcs}
            addAppleCalendar={addAppleCalendar}
            buildSubmissionEvent={buildSubmissionEvent}
            setError={setError}
            resetForm={resetForm}
            autoAddEnabled={autoAddPreference.enabled}
          />
        </section>
      )}
      <OnboardingModal
        open={onboardingModalOpen}
        visibleTemplateKeys={visibleTemplateKeys}
        required={onboardingRequired}
        onClose={() => {
          if (!onboardingRequired) setOnboardingModalOpen(false);
        }}
        onComplete={handleOnboardingComplete}
      />
      <OnboardingPromptPopup
        open={showSoftPrompt && !onboardingModalOpen}
        onStart={() => setOnboardingModalOpen(true)}
        onDismiss={handleDismissPrompt}
      />
    </main>
  );
}

type SnapEventModalProps = {
  open: boolean;
  event: EventFields | null;
  onClose: () => void;
  setEvent: Dispatch<SetStateAction<EventFields | null>>;
  connected: { google: boolean; microsoft: boolean };
  addGoogle: (options?: ProviderActionOptions) => void | Promise<void>;
  connectGoogle: () => void;
  addOutlook: (options?: ProviderActionOptions) => void | Promise<void>;
  connectOutlook: () => void;
  dlIcs: () => void;
  addAppleCalendar?: (options?: ProviderActionOptions) => void | Promise<void>;
  buildSubmissionEvent: (input: EventFields) => any;
  setError: (error: string | null) => void;
  resetForm: () => void;
  autoAddEnabled: boolean;
};

type OnboardingModalProps = {
  open: boolean;
  required: boolean;
  visibleTemplateKeys: TemplateKey[];
  onClose: () => void;
  onComplete: () => void;
};

function OnboardingModal({
  open,
  required,
  visibleTemplateKeys,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<TemplateKey[]>(
    visibleTemplateKeys.length > 0 ? visibleTemplateKeys : [...TEMPLATE_KEYS]
  );

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedKeys(
      visibleTemplateKeys.length > 0 ? visibleTemplateKeys : [...TEMPLATE_KEYS]
    );
  }, [open, visibleTemplateKeys]);

  if (!open) return null;

  const save = async () => {
    if (!selectedKeys.length) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "complete",
          persona: "general",
          personas: ["general"],
          visibleTemplateKeys: selectedKeys,
        }),
      });
      if (!res.ok) throw new Error("Failed to save onboarding");
      onComplete();
    } catch (err) {
      console.error("[onboarding] save failed", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[#e2dafb] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7F8CFF]">
              Onboarding
            </p>
            <h2 className="text-2xl font-semibold text-[#1b1540]">
              Personalize your workspace
            </h2>
          </div>
          {!required && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e6ddff] px-3 py-1 text-sm"
            >
              Close
            </button>
          )}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#4f456f]">
              Step 1: Choose the features you want visible.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TEMPLATE_DEFINITIONS.map((item) => {
                const checked = selectedKeys.includes(item.key);
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl border border-[#ebe6fb] px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedKeys((prev) => {
                          if (e.target.checked) {
                            if (prev.includes(item.key)) return prev;
                            return [...prev, item.key];
                          }
                          return prev.filter((k) => k !== item.key);
                        });
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-[#4f456f]">
              Step 2: Confirm and apply your feature visibility.
            </p>
            <p className="text-sm text-[#1b1540]">
              You can update this anytime in Settings.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2)))}
            className="rounded-lg border border-[#e6ddff] px-3 py-1.5 text-sm"
            disabled={step === 1 || saving}
          >
            Back
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2)}
              disabled={step === 1 && selectedKeys.length === 0}
              className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={saving || selectedKeys.length === 0}
              className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function eventGlyph(item: DashboardEventItem): string {
  const haystack = `${item.title} ${item.category || ""}`.toLowerCase();
  if (haystack.includes("birthday")) return "BD";
  if (haystack.includes("wedding")) return "WD";
  if (haystack.includes("baby")) return "BB";
  if (haystack.includes("appointment")) return "AP";
  if (haystack.includes("doctor")) return "AP";
  if (haystack.includes("sport")) return "SP";
  if (haystack.includes("soccer")) return "SP";
  if (haystack.includes("football")) return "SP";
  if (haystack.includes("gymnastics")) return "SP";
  return "EV";
}

function parseSafeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatEventTimeRange(startRaw: string, endRaw: string | null): string {
  const start = parseSafeDate(startRaw);
  if (!start) return "Date pending";
  const dayPart = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  const end = parseSafeDate(endRaw);
  if (!end || end.getTime() <= start.getTime()) {
    return `${dayPart}, ${startTime}`;
  }
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end);
  return `${dayPart}, ${startTime} - ${endTime}`;
}

function toMiles(km: number): number {
  return km * 0.621371;
}

function WeatherIcon({
  summary,
  className = "h-5 w-5 text-white",
}: {
  summary: string | null | undefined;
  className?: string;
}) {
  const normalized = String(summary || "").toLowerCase();
  if (normalized.includes("thunder")) {
    return <CloudLightning className={className} aria-hidden="true" />;
  }
  if (
    normalized.includes("snow") ||
    normalized.includes("sleet") ||
    normalized.includes("ice")
  ) {
    return <CloudSnow className={className} aria-hidden="true" />;
  }
  if (
    normalized.includes("fog") ||
    normalized.includes("mist") ||
    normalized.includes("haze")
  ) {
    return <CloudFog className={className} aria-hidden="true" />;
  }
  if (
    normalized.includes("rain") ||
    normalized.includes("drizzle") ||
    normalized.includes("shower")
  ) {
    return <CloudRain className={className} aria-hidden="true" />;
  }
  if (normalized.includes("overcast") || normalized.includes("cloud")) {
    return <Cloud className={className} aria-hidden="true" />;
  }
  if (normalized.includes("wind")) {
    return <Wind className={className} aria-hidden="true" />;
  }
  if (!normalized) {
    return <CloudSun className={className} aria-hidden="true" />;
  }
  return <Sun className={className} aria-hidden="true" />;
}

function UpcomingEventsPanel({
  data,
  metrics,
  enrichMeta,
  metricsLoading,
  loading,
  onForceTravel,
  onCreateEvent,
}: {
  data: DashboardResponse | null;
  metrics: DashboardMetricsCache | null;
  enrichMeta: DashboardEnrichMeta | null;
  metricsLoading: boolean;
  loading: boolean;
  onForceTravel: () => void;
  onCreateEvent: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(4);
  const [firstCardHeight, setFirstCardHeight] = useState(236);
  const [now, setNow] = useState(() => Date.now());
  const firstScheduleCardRef = useRef<HTMLAnchorElement | null>(null);
  const nextEvent = data?.nextEvent ?? null;
  const scheduleEvents = data?.upcoming ?? [];
  const hasOverflow = scheduleEvents.length > cardsPerRow;
  const showCollapsedTeaser = hasOverflow && !isExpanded;
  const previewLimit = cardsPerRow * 2;
  const visibleScheduleEvents = showCollapsedTeaser
    ? scheduleEvents.slice(0, previewLimit)
    : scheduleEvents;
  const teaserHeightPx = 96;
  const gridGapPx = 12;
  const collapsedMaxHeight = firstCardHeight + gridGapPx + teaserHeightPx;
  const showCreateTile = isExpanded || scheduleEvents.length === 0;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const syncCardsPerRow = () => {
      if (desktopQuery.matches) {
        setCardsPerRow(4);
        return;
      }
      if (mobileQuery.matches) {
        setCardsPerRow(1);
        return;
      }
      setCardsPerRow(2);
    };
    syncCardsPerRow();

    const onChange = () => syncCardsPerRow();
    const addListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
      }
      query.addListener(onChange);
      return () => query.removeListener(onChange);
    };
    const cleanupMobile = addListener(mobileQuery);
    const cleanupDesktop = addListener(desktopQuery);

    return () => {
      cleanupMobile();
      cleanupDesktop();
    };
  }, []);

  useEffect(() => {
    if (!hasOverflow && isExpanded) {
      setIsExpanded(false);
    }
  }, [hasOverflow, isExpanded]);

  useEffect(() => {
    if (!showCollapsedTeaser) return;
    const el = firstScheduleCardRef.current;
    if (!el) return;

    const syncHeight = () => {
      const measured = Math.ceil(el.getBoundingClientRect().height);
      if (Number.isFinite(measured) && measured > 0) {
        setFirstCardHeight(measured);
      }
    };

    syncHeight();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncHeight);
      return () => window.removeEventListener("resize", syncHeight);
    }

    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [showCollapsedTeaser, visibleScheduleEvents.length, cardsPerRow]);

  const nextStart = parseSafeDate(nextEvent?.startAt);
  const daysUntilNext = nextStart
    ? Math.ceil((nextStart.getTime() - now) / (24 * 60 * 60 * 1000))
    : null;
  const msUntilNext = nextStart ? nextStart.getTime() - now : null;
  const countdown =
    msUntilNext != null && msUntilNext > 0
      ? (() => {
          const totalSeconds = Math.floor(msUntilNext / 1000);
          const days = Math.floor(totalSeconds / (24 * 60 * 60));
          const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
          const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
          const seconds = totalSeconds % 60;
          return `${String(days).padStart(2, "0")}d : ${String(hours).padStart(
            2,
            "0"
          )}h : ${String(minutes).padStart(2, "0")}m : ${String(
            seconds
          ).padStart(2, "0")}s`;
        })()
      : "00d : 00h : 00m : 00s";
  const daysMessage =
    daysUntilNext === null
      ? "Add your next event"
      : daysUntilNext <= 0
      ? "Happening today"
      : daysUntilNext === 1
      ? "Tomorrow"
      : `In ${daysUntilNext} days`;
  const statusNormalized = String(nextEvent?.status || "").toLowerCase();
  const createdVia = String(nextEvent?.createdVia || "").toLowerCase();
  const isScannedOrUploaded =
    createdVia === "ocr" ||
    createdVia.includes("scan") ||
    createdVia.includes("upload");
  const nextBadges: string[] = [];
  if (statusNormalized === "draft") nextBadges.push("Draft");
  if (!nextEvent?.locationText) {
    nextBadges.push("Missing Location");
  }
  if (
    !isScannedOrUploaded &&
    (!nextEvent?.numberOfGuests || nextEvent.numberOfGuests <= 0)
  ) {
    nextBadges.push("No Guests");
  }
  // Temporary preview mode: always render weather card for next event.
  const showWeather = Boolean(nextEvent);
  const weatherEligible = Boolean(data?.metricsEligibility?.weatherEligible);
  const hasTravelMetrics =
    metrics?.travelMinutes != null || metrics?.travelDistanceKm != null;
  const travelMiles =
    metrics?.travelDistanceKm != null
      ? toMiles(metrics.travelDistanceKm)
      : null;
  const travelMissingOrigin =
    enrichMeta?.hasDestination && enrichMeta?.hasOrigin === false;
  const weatherHasData = Boolean(
    metrics?.weatherSummary || metrics?.weatherTemp != null
  );
  const weatherNormalized = String(metrics?.weatherSummary || "").toLowerCase();
  const weatherSunny =
    !weatherNormalized ||
    weatherNormalized.includes("sun") ||
    weatherNormalized.includes("clear");

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#ddd5ff] bg-gradient-to-br from-[#f4f1ff] via-[#ffffff] to-[#eef9ff] p-4 shadow-[0_22px_60px_rgba(94,76,166,0.15)] sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#b6a9ff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[#7ed7c8]/15 blur-3xl" />
      <div className="relative z-10 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <article className="relative overflow-hidden rounded-[2.5rem] border border-[#8e92ff]/35 bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#3730a3] p-6 text-white shadow-[0_24px_60px_rgba(71,52,150,0.35)] sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          {loading ? (
            <div className="relative space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-white/25" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-white/20" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-white/20" />
            </div>
          ) : nextEvent ? (
            <div className="relative">
              <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row">
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-sm">
                    Next Event
                  </span>
                  <h3 className="text-4xl font-serif italic font-semibold leading-tight !text-white md:text-5xl">
                    {nextEvent.title}
                  </h3>
                </div>
              </div>

              <div className="mb-9 space-y-3">
                <div className="flex items-center gap-3 text-indigo-100/90">
                  <Calendar className="h-5 w-5" />
                  <span className="text-base font-medium md:text-lg">
                    {formatEventTimeRange(nextEvent.startAt, nextEvent.endAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100/80">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm md:text-base">
                    {nextEvent.locationText || daysMessage}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-2xl font-light tracking-wide tabular-nums text-white md:text-3xl">
                    {countdown}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-200/70">
                    Starts In
                  </p>
                </div>
              </div>

              {nextBadges.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {nextBadges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-white/35 bg-white/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-8">
                <Link
                  href={`/event/${nextEvent.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-bold text-indigo-900 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/10"
                >
                  Open Event
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="group rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-colors hover:bg-white/15">
                  <div className="mb-4 flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                      Travel
                    </span>
                    <Navigation
                      className="h-4 w-4 text-white/55"
                      aria-hidden="true"
                    />
                  </div>
                  {metricsLoading ? (
                    <div className="h-8 w-32 animate-pulse rounded bg-white/25" />
                  ) : hasTravelMetrics ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {metrics?.travelMinutes != null
                            ? metrics.travelMinutes
                            : "--"}
                        </span>
                        <span className="text-lg text-indigo-200">min</span>
                        <span className="mx-1 h-6 w-px bg-white/20" />
                        <span className="text-3xl font-bold text-white">
                          {travelMiles != null ? travelMiles.toFixed(1) : "--"}
                        </span>
                        <span className="text-lg text-indigo-200">mi</span>
                      </div>
                      <p className="mt-2 text-xs text-indigo-200/65">
                        Estimated driving time from origin
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-indigo-200/75">
                        {travelMissingOrigin
                          ? "Add your home location to estimate travel."
                          : "Travel estimate is not ready yet."}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {nextEvent.mapsUrl ? (
                          <Link
                            href={nextEvent.mapsUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-2"
                          >
                            <MapPinned
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Open in Maps
                          </Link>
                        ) : (
                          <span className="text-xs text-white/80">
                            Open in Maps
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={onForceTravel}
                          className="inline-flex items-center rounded-full border border-white/35 px-2.5 py-1 text-[0.65rem] font-semibold text-white"
                        >
                          Calculate travel
                        </button>
                      </div>
                    </>
                  )}
                </article>

                {showWeather ? (
                  <article className="group rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md transition-colors hover:bg-white/15">
                    <div className="mb-4 flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                        Weather
                      </span>
                      <Clock
                        className="h-4 w-4 text-white/55"
                        aria-hidden="true"
                      />
                    </div>
                    {metricsLoading ? (
                      <div className="h-8 w-24 animate-pulse rounded bg-white/25" />
                    ) : weatherHasData ? (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <WeatherIcon
                            summary={metrics?.weatherSummary}
                            className={`h-12 w-12 ${
                              weatherSunny
                                ? "animate-[spin_8s_linear_infinite] text-yellow-300"
                                : "text-white"
                            }`}
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-full bg-yellow-400/20 blur-lg transition-opacity group-hover:bg-yellow-400/35" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">
                            {metrics?.weatherTemp != null
                              ? `${Math.round(metrics.weatherTemp)}°F`
                              : "--"}
                          </p>
                          <p className="font-medium text-indigo-200">
                            {metrics?.weatherSummary || "Forecast"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-200/75">
                        {weatherEligible
                          ? "Forecast pending"
                          : "Weather available 72h before event"}
                      </p>
                    )}
                  </article>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <h3 className="mt-4 text-3xl font-serif italic font-semibold leading-tight text-white sm:text-4xl">
                No upcoming events yet
              </h3>
              <p className="mt-3 text-sm text-white/85 sm:text-base">
                Start with a new event and this dashboard will highlight what is
                next.
              </p>
              <div className="mt-7">
                <button
                  type="button"
                  onClick={onCreateEvent}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#40349b] shadow-[0_10px_24px_rgba(21,16,56,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f6f3ff]"
                >
                  Book First Event
                </button>
              </div>
            </>
          )}
        </article>

        <aside className="rounded-[28px] border border-[#d8dbff] bg-white/88 p-6 shadow-[0_18px_36px_rgba(70,56,120,0.12)] backdrop-blur-sm">
          <h3 className="text-xl font-semibold text-[#221b45]">
            Schedule Snapshot
          </h3>
          <div className="mt-5 text-center">
            <p className="text-4xl font-bold tracking-tight text-[#31275e]">
              {data?.snapshot?.upcomingCount30Days ?? 0}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6e629f]">
              Upcoming (30 days)
            </p>
          </div>
          <div className="mt-5 space-y-2 border-b border-[#e9e3ff] pb-4">
            <div className="flex items-center justify-between text-sm text-[#62588f]">
              <span>Next 7 days</span>
              <span className="font-semibold text-[#3a2f6f]">
                {data?.snapshot.upcomingCount7Days ?? 0} planned
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[#62588f]">
              <span>Next event in</span>
              <span className="font-semibold text-[#3a2f6f]">
                {data?.snapshot.nextEventInDays != null
                  ? `${data.snapshot?.nextEventInDays} days`
                  : "--"}
              </span>
            </div>
            <p className="text-xs text-[#7a71a7]">{daysMessage}</p>
          </div>

          <h4 className="mt-4 text-lg font-semibold text-[#221b45]">
            RSVP Snapshot
          </h4>
          {nextEvent && data?.rsvp ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-xl bg-[#eefcf4] px-3 py-2 text-[#1f7d52]">
                  Going:{" "}
                  <span className="font-semibold">{data.rsvp.going}</span>
                </p>
                <p className="rounded-xl bg-[#fff8e9] px-3 py-2 text-[#9c6b00]">
                  Maybe:{" "}
                  <span className="font-semibold">{data.rsvp.maybe}</span>
                </p>
                <p className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[#a33d56]">
                  Declined:{" "}
                  <span className="font-semibold">{data.rsvp.declined}</span>
                </p>
                <p className="rounded-xl bg-[#f3f2fd] px-3 py-2 text-[#4b437f]">
                  Pending:{" "}
                  <span className="font-semibold">{data.rsvp.pending}</span>
                </p>
              </div>
              <div className="mt-3 space-y-1.5">
                {data.rsvp.recent.length > 0 ? (
                  data.rsvp.recent.slice(0, 3).map((row) => (
                    <p key={row.id} className="text-sm text-[#5a4f87]">
                      <span className="font-semibold text-[#2d2555]">
                        {row.name}
                      </span>{" "}
                      - {row.status}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-[#7a71a8]">No recent RSVPs yet.</p>
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-[#7a71a8]">
              No next event selected.
            </p>
          )}
          <div className="mt-5 border-t border-[#e9e3ff] pt-4">
            <h4 className="text-lg font-semibold text-[#221b45]">Drafts</h4>
            <p className="mt-1 text-sm text-[#6a6196]">
              {data?.drafts?.count ?? 0} draft
              {(data?.drafts?.count ?? 0) === 1 ? "" : "s"}
            </p>
            <div className="mt-2 space-y-1.5">
              {(data?.drafts?.items || []).length > 0 ? (
                data?.drafts?.items.slice(0, 3).map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/event/${draft.id}`}
                    className="block text-sm font-medium text-[#3f3691] hover:underline"
                  >
                    {draft.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[#7a71a8]">No drafts right now.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="relative z-10 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-[#201942]">My Schedule</h3>
          <Link
            href="/calendar"
            className="text-sm font-semibold text-[#4e4acf] transition hover:text-[#3a37a5]"
          >
            View Calendar
          </Link>
        </div>
        <div className="relative">
          <div
            className={showCollapsedTeaser ? "overflow-hidden" : ""}
            style={
              showCollapsedTeaser
                ? { maxHeight: `${collapsedMaxHeight}px` }
                : undefined
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleScheduleEvents.map((item, index) => {
                const start = parseSafeDate(item.startAt);
                const month = start
                  ? new Intl.DateTimeFormat("en-US", { month: "short" })
                      .format(start)
                      .toUpperCase()
                  : "--";
                const day = start
                  ? new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(
                      start
                    )
                  : "--";
                const time = start
                  ? new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(start)
                  : "Time TBD";
                return (
                  <Link
                    key={item.id}
                    ref={index === 0 ? firstScheduleCardRef : undefined}
                    href={`/event/${item.id}`}
                    className="group min-h-[236px] rounded-[24px] border border-[#e5e0ff] bg-white/90 p-4 shadow-[0_10px_26px_rgba(64,47,124,0.08)] transition hover:-translate-y-1 hover:border-[#d4cbff] hover:shadow-[0_20px_36px_rgba(64,47,124,0.12)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f2eefe] text-[0.66rem] font-bold tracking-[0.08em] text-[#4f4293]">
                        {eventGlyph(item)}
                      </span>
                      <span className="rounded-full bg-[#f1efff] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#6660a0]">
                        Upcoming
                      </span>
                    </div>
                    <h4 className="mt-4 line-clamp-2 text-lg font-semibold leading-tight text-[#27204a]">
                      {item.title}
                    </h4>
                    <p className="mt-1 line-clamp-1 text-sm text-[#7a71a8]">
                      {item.locationText || item.category || "Event details"}
                    </p>
                    <div className="mt-6 border-t border-[#efecff] pt-3">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8f86ba]">
                        {month}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <p className="text-3xl font-bold tracking-tight text-[#231c47]">
                          {day}
                        </p>
                        <p className="text-sm font-semibold text-[#3e3384]">
                          {time}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {showCreateTile && (
                <button
                  type="button"
                  onClick={onCreateEvent}
                  className="group flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#c9c1f6] bg-white/45 px-4 text-center transition hover:-translate-y-1 hover:border-[#a7a0e9] hover:bg-white/70"
                >
                  <span className="text-5xl font-light leading-none text-[#6a61b2]">
                    +
                  </span>
                  <span className="mt-2 text-lg font-semibold text-[#4b437f]">
                    Book New Event
                  </span>
                  <span className="mt-1 text-sm text-[#7a71a8]">
                    Create a fresh invite in seconds
                  </span>
                </button>
              )}
            </div>
          </div>
          {showCollapsedTeaser && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-[#f4f1ff00] via-[#f5f2ffde] to-[#f4f1ffff]">
              <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center justify-center rounded-full border border-[#cfc8f8] bg-white/95 px-5 py-2 text-sm font-semibold text-[#433c9f] shadow-[0_8px_22px_rgba(75,60,148,0.18)] transition hover:-translate-y-0.5 hover:border-[#bcb3ee]"
                >
                  Load more
                </button>
              </div>
            </div>
          )}
          {hasOverflow && isExpanded && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="inline-flex items-center justify-center rounded-full border border-[#d3cbf8] bg-white/95 px-5 py-2 text-sm font-semibold text-[#433c9f] shadow-[0_8px_20px_rgba(75,60,148,0.12)] transition hover:-translate-y-0.5 hover:border-[#bcb3ee]"
              >
                Show less
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
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
          <p className="mt-1 text-sm font-medium text-[#6e629f]">
            {data.dateLine}
          </p>
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
              <p
                className={`mt-2 text-3xl font-bold tracking-tight ${card.accent}`}
              >
                {card.value}
              </p>
              {card.note ? (
                <p className="mt-1 text-xs font-semibold text-[#4d9f76]">
                  {card.note}
                </p>
              ) : (
                <p className="mt-1 text-xs text-transparent">.</p>
              )}
            </article>
          ))}
        </div>

        <section className="overflow-hidden rounded-[24px] border border-[#e1dafb] bg-white/92 shadow-[0_12px_30px_rgba(62,50,112,0.10)]">
          <div className="flex items-center justify-between border-b border-[#ece7ff] px-4 py-3 sm:px-6">
            <h3 className="text-xl font-semibold text-[#221b45]">
              Recent RSVPs
            </h3>
            <span className="text-sm font-semibold text-[#4e4acf]">
              View All
            </span>
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
                    <tr
                      key={row.id}
                      className="border-t border-[#f0ecff] text-sm text-[#2b2350]"
                    >
                      <td className="px-4 py-3 font-semibold sm:px-6">
                        {row.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            row.status
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
    tab === "guests"
      ? "Guests"
      : tab === "communications"
      ? "Communications"
      : "Settings";
  return (
    <section className="rounded-[28px] border border-[#ddd5ff] bg-white/90 p-6 shadow-[0_20px_50px_rgba(80,63,145,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f86ba]">
        Event Workspace
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-[#201942]">{label}</h3>
      <p className="mt-2 text-sm text-[#6e629f]">
        {label} content is available in the next step. Dashboard remains the
        default view on event open.
      </p>
    </section>
  );
}

function OnboardingPromptPopup({
  open,
  onStart,
  onDismiss,
}: {
  open: boolean;
  onStart: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[79] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-[#e2dafb] bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7F8CFF]">
          Quick Setup
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-[#1b1540]">
          Personalize your workspace
        </h3>
        <p className="mt-3 text-sm text-[#4f456f]">
          Select the event features you want visible, and we will personalize
          create menus and dashboard sections.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-[#d8d2ef] px-3 py-1.5 text-sm font-semibold text-[#4a406b]"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onStart}
            className="rounded-lg bg-[#7F8CFF] px-3 py-1.5 text-sm font-semibold text-white"
          >
            Start onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

function SnapEventModal({
  open,
  event,
  onClose,
  setEvent,
  connected,
  addGoogle,
  connectGoogle,
  addOutlook,
  connectOutlook,
  dlIcs,
  addAppleCalendar,
  buildSubmissionEvent,
  setError,
  resetForm,
  autoAddEnabled,
}: SnapEventModalProps) {
  const router = useRouter();
  const [enableAutoAddOnSave, setEnableAutoAddOnSave] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [connectedCalendars, setConnectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: connected.google,
    microsoft: connected.microsoft,
    apple: false,
  });

  useEffect(() => {
    if (!open) return;
    setEnableAutoAddOnSave(false);
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = window.navigator;
    const ua = nav.userAgent || (nav as any).vendor || "";
    const uaLower = ua.toLowerCase();
    const platform = (nav.platform || "").toLowerCase();
    const maxTouchPoints =
      typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : 0;

    // First, check if it's clearly NOT an Apple device - exclude these explicitly
    const isNotApple =
      uaLower.includes("android") ||
      uaLower.includes("windows") ||
      uaLower.includes("linux") ||
      uaLower.includes("cros") || // Chrome OS
      uaLower.includes("x11") || // Unix-like systems
      platform.includes("win") ||
      platform.includes("linux") ||
      platform.includes("android");

    if (isNotApple) {
      setIsAppleDevice(false);
      return;
    }

    // Detect iPad (including iPadOS)
    // iPadOS 13+ reports as "MacIntel" but has touch support
    const isIpadLike =
      uaLower.includes("ipad") ||
      platform === "ipad" ||
      (platform === "macintel" && maxTouchPoints > 1);

    // Detect iPhone/iPod Touch (strict iOS check)
    const isIOS =
      /iPhone|iPod/.test(ua) ||
      platform === "iphone" ||
      uaLower.includes("iphone") ||
      uaLower.includes("ipod");

    // Detect macOS (but exclude touch-enabled Macs which are actually iPads)
    const isMacOS =
      (/Mac OS X|Macintosh/.test(ua) ||
        platform.startsWith("mac") ||
        platform === "macintel") &&
      !isIpadLike; // Exclude touch-enabled Macs that are actually iPads

    // Only set to true if it's definitively an Apple device
    const isApple = isIOS || isIpadLike || isMacOS;

    setIsAppleDevice(isApple);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Fetch connected calendars when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };
    fetchConnected();

    // Refresh connection status when window regains focus (after OAuth)
    const handleFocus = () => {
      fetchConnected();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [open]);

  const updateEvent = useCallback(
    (mutator: (current: EventFields) => EventFields) => {
      setEvent((prev) => {
        if (!prev) return prev;
        return mutator(prev);
      });
    },
    [setEvent]
  );

  if (!open || !event) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-5 md:px-8">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#2f1d47]/62 via-[#3c2b5f]/58 to-[#2d2346]/62 backdrop-blur-xl"
          onClick={onClose}
        />

        <div
          className="relative z-10 w-full max-w-3xl h-[90dvh] max-h-[90dvh] rounded-[32px] border border-[#ddd5f6] bg-gradient-to-bl from-[#f3efff] via-[#ffffff] to-[#f7f3ff] shadow-[0_25px_60px_rgba(101,67,145,0.20)] backdrop-blur-2xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#e3dbf8] bg-gradient-to-r from-[#ffffff]/95 via-[#f4efff]/92 to-[#ffffff]/90 backdrop-blur-xl px-5 py-4 sm:px-7">
              <div className="flex-1 pt-1">
                <h2
                  className="text-lg sm:text-2xl font-semibold text-[#3e2f68] mb-1 tracking-tight"
                  style={{
                    fontFamily:
                      '"Venturis ADF", "Venturis ADF Fallback", serif',
                  }}
                >
                  Review Event Details
                </h2>
                <p className="text-sm text-[#7f73a9] leading-relaxed">
                  Tweak anything before you save or send to a calendar.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close event editor"
                className="rounded-2xl border border-[#ddd5f6] bg-white/90 hover:bg-[#f7f3ff] shadow-sm hover:shadow-md transition-all p-2.5 text-[#7f73a9] hover:text-[#3e2f68] hover:scale-105"
                onClick={onClose}
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 px-5 py-6 sm:px-7 sm:py-7 space-y-6">
              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-title"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Title
                </label>
                <input
                  id="snap-event-title"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  value={event.title}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="snap-event-start"
                    className="text-sm font-semibold text-[#43336d] block"
                  >
                    Start
                  </label>
                  <input
                    id="snap-event-start"
                    className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                    value={event.start || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      updateEvent((current) => ({ ...current, start: value }));
                    }}
                  />
                </div>
                <div className="space-y-2.5">
                  <label
                    htmlFor="snap-event-end"
                    className="text-sm font-semibold text-[#43336d] block"
                  >
                    End (optional)
                  </label>
                  <input
                    id="snap-event-end"
                    className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                    value={event.end || ""}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      updateEvent((current) => ({ ...current, end: value }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-location"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Location
                </label>
                <input
                  id="snap-event-location"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  value={event.location}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-description"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  Description
                </label>
                <textarea
                  id="snap-event-description"
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg resize-none"
                  rows={4}
                  value={event.description}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="snap-event-rsvp"
                  className="text-sm font-semibold text-[#43336d] block"
                >
                  RSVP (Phone or Email)
                </label>
                <input
                  id="snap-event-rsvp"
                  type="text"
                  inputMode="tel"
                  maxLength={64}
                  style={{ minWidth: "14ch" }}
                  className="w-full rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                  placeholder="e.g., RSVP: Taya 850-555-8888 or contact@example.com"
                  value={event.rsvp || ""}
                  onChange={(e) =>
                    updateEvent((current) => ({
                      ...current,
                      rsvp: e.target.value || null,
                    }))
                  }
                />
                <p className="text-xs text-[#8a7fb3] mt-1.5 pl-1">
                  Phone number or email for RSVP. Detected info is pre-filled.
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-sm font-semibold text-[#43336d] block">
                  Reminders
                </span>
                <div className="space-y-3">
                  {(event.reminders || []).map((reminder, idx) => {
                    const dayOptions = [1, 2, 3, 7, 14, 30];
                    const currentDays = Math.max(
                      1,
                      Math.round((reminder.minutes || 0) / 1440) || 1
                    );
                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <select
                          className="w-full sm:w-[240px] rounded-xl border border-[#d8d1f3] bg-white backdrop-blur-sm text-[#3f3269] px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#bba9eb]/55 focus:border-[#a18ddf] shadow-sm hover:shadow-md focus:shadow-lg"
                          value={currentDays}
                          onChange={(e) => {
                            const days = Math.max(
                              1,
                              Number(e.target.value) || 1
                            );
                            updateEvent((current) => {
                              const next = [...(current.reminders || [])];
                              next[idx] = { minutes: days * 1440 };
                              return { ...current, reminders: next };
                            });
                          }}
                        >
                          {dayOptions.map((d) => (
                            <option key={d} value={d}>
                              {d} day{d === 1 ? "" : "s"} before
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          aria-label="Delete reminder"
                          className="self-start sm:self-auto rounded-xl border border-red-200/70 bg-red-50/80 hover:bg-red-100 px-3.5 py-2.5 text-sm text-red-700 hover:text-red-800 transition-all hover:border-red-300 hover:scale-105 shadow-sm"
                          onClick={() =>
                            updateEvent((current) => ({
                              ...current,
                              reminders: (current.reminders || []).filter(
                                (_, i) => i !== idx
                              ),
                            }))
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              d="M6 7h12M9 7l1-2h4l1 2m-9 0l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6m4-6v6"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  <div>
                    <button
                      type="button"
                      className="rounded-xl border border-[#c8baf0] bg-[#f2edff] hover:bg-[#ebe3ff] px-4 py-2.5 text-sm text-[#6a58a8] font-semibold transition-all hover:border-[#b8a5ea] hover:scale-105 shadow-sm"
                      onClick={() =>
                        updateEvent((current) => {
                          const base = Array.isArray(current.reminders)
                            ? [...current.reminders]
                            : [];
                          return {
                            ...current,
                            reminders: [...base, { minutes: 1440 }],
                          };
                        })
                      }
                    >
                      + Add reminder
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#ebe4fb] bg-[#fbf9ff] px-5 py-3 sm:px-7">
              <label className="flex items-start gap-2.5 text-xs sm:text-sm text-[#51457d]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-[#cfc4f2] text-[#7f8cff] focus:ring-[#bcaef0]"
                  checked={enableAutoAddOnSave}
                  onChange={(e) => setEnableAutoAddOnSave(e.target.checked)}
                />
                <span>
                  Skip review next time and auto-add to the calendar button you
                  tap now, plus Envitefy.
                  {autoAddEnabled
                    ? " Auto-add is currently enabled; saving here can update the provider."
                    : ""}
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7 sm:py-6 border-t border-[#e3dbf8] bg-gradient-to-r from-[#ffffff]/90 via-[#f5f1ff]/90 to-[#ffffff]/90 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-3">
                {connectedCalendars.google ? (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={() =>
                      void addGoogle({
                        enableAutoAdd: enableAutoAddOnSave,
                      })
                    }
                  >
                    <span>Add to</span>
                    <CalendarIconGoogle className="h-5 w-5 text-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={connectGoogle}
                  >
                    <span>Connect to</span>
                    <CalendarIconGoogle className="h-5 w-5 text-white" />
                  </button>
                )}
                {connectedCalendars.microsoft ? (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={() =>
                      void addOutlook({
                        enableAutoAdd: enableAutoAddOnSave,
                      })
                    }
                  >
                    <span>Add to</span>
                    <Image
                      src="/brands/microsoft-white.svg"
                      alt="Microsoft"
                      width={20}
                      height={20}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={connectOutlook}
                  >
                    <span>Connect to</span>
                    <Image
                      src="/brands/microsoft-white.svg"
                      alt="Microsoft"
                      width={20}
                      height={20}
                    />
                  </button>
                )}
                {isAppleDevice && (
                  <button
                    type="button"
                    className="rounded-xl bg-[#8667d8] hover:bg-[#7657cb] px-5 py-3 text-sm text-white font-semibold shadow-lg shadow-[#8667d8]/30 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-[#8667d8]/40 hover:scale-105 active:scale-100"
                    onClick={() => {
                      if (addAppleCalendar) {
                        void addAppleCalendar({
                          enableAutoAdd: enableAutoAddOnSave,
                        });
                        return;
                      }
                      dlIcs();
                    }}
                  >
                    <span>Add to</span>
                    <Image
                      src="/brands/apple-white.svg"
                      alt="Apple"
                      width={20}
                      height={20}
                    />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-[#d8d1f3] bg-white/90 hover:bg-[#f4efff] backdrop-blur-sm px-5 py-3 text-sm text-[#4b3f72] font-semibold transition-all hover:border-[#c7b9ed] hover:scale-105 active:scale-100 shadow-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipHintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 5h9.5a.5.5 0 01.5.5V11" />
      <path d="M16 9l2 2 2-2" />
      <path d="M17 19H7.5a.5.5 0 01-.5-.5V13" />
      <path d="M8 15l-2-2-2 2" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function OptionCard({
  href,
  title,
  artwork,
  details,
  tone = "primary",
  ctaLabel,
  ctaColor,
  onClick,
}: {
  href?: string;
  title: string;
  artwork: ReactNode;
  details?: string[];
  tone?: HighlightTone;
  ctaLabel?: string;
  ctaColor?: string;
  onClick?: () => void;
}) {
  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  const [showDetails, setShowDetails] = useState(false);
  const buttonLabel = ctaLabel ?? title;

  const iconWrapperClass = [
    "mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border border-dashed bg-white/90 text-foreground/80 shadow-inner transition group-hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
    toneClass.iconBg,
  ]
    .filter(Boolean)
    .join(" ");

  const description = details?.length ? (
    <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
      {details.map((item, index) => (
        <p key={`${title}-${index}`}>{item}</p>
      ))}
    </div>
  ) : null;

  const buttonClass =
    "inline-flex items-center justify-center rounded-full px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap shadow-[0_12px_30px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.45)] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus:outline-none disabled:opacity-70";

  const buttonStyle = { backgroundColor: ctaColor ?? toneClass.accent };

  const cardSurfaceStyle: CSSProperties = {
    borderColor: toneClass.accent,
    background: toneClass.cardSurface,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    transform: "translateZ(0)",
  };

  const handlePrimaryAction = (
    event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    event.stopPropagation();
    if (showDetails) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.();
  };

  const cta = href ? (
    <Link
      href={href}
      className={buttonClass}
      style={buttonStyle}
      onClick={handlePrimaryAction}
      tabIndex={showDetails ? -1 : undefined}
    >
      {buttonLabel}
    </Link>
  ) : (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className={buttonClass}
      style={buttonStyle}
      tabIndex={showDetails ? -1 : undefined}
    >
      {buttonLabel}
    </button>
  );

  const openDetails = () => setShowDetails(true);

  const handleFrontCardClick = () => {
    if (!showDetails) {
      openDetails();
    }
  };

  const handleInfoPointer = (
    event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openDetails();
  };

  const handleInfoKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleInfoPointer(event);
    }
  };

  const closeDetails = (
    event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>
  ) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setShowDetails(false);
  };

  const baseCardClass =
    "group relative flex h-full flex-col overflow-hidden rounded-[32px] border text-foreground shadow-[0_25px_80px_rgba(15,13,9,0.35)] ring-1 ring-black/5 backdrop-blur-sm";

  const frontCard = (
    <article
      className={baseCardClass}
      style={cardSurfaceStyle}
      onClick={handleFrontCardClick}
    >
      <button
        type="button"
        aria-label="Show details"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-foreground/60 transition hover:border-white hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={handleInfoPointer}
        onKeyDown={handleInfoKeyDown}
      >
        <FlipHintIcon className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col items-center gap-5 px-6 pb-4 pt-8 text-center">
        {href ? (
          <Link
            href={href}
            className={iconWrapperClass}
            style={{ borderColor: toneClass.accent }}
            onClick={handlePrimaryAction}
            tabIndex={showDetails ? -1 : undefined}
            aria-label={buttonLabel}
          >
            <div className="w-20">{artwork}</div>
          </Link>
        ) : (
          <button
            type="button"
            className={iconWrapperClass}
            style={{ borderColor: toneClass.accent }}
            onClick={handlePrimaryAction}
            tabIndex={showDetails ? -1 : undefined}
            aria-label={buttonLabel}
          >
            <div className="w-20">{artwork}</div>
          </button>
        )}
        <div className="flex flex-col items-center gap-3">
          <h2
            className="text-base font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-xl sm:tracking-tight whitespace-nowrap"
            style={{
              fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      <div className="flex items-center justify-center border-t border-white/50 bg-white/40 px-6 py-4">
        {cta}
      </div>
    </article>
  );

  const backCard = (
    <article
      className={baseCardClass}
      style={cardSurfaceStyle}
      role="button"
      tabIndex={0}
      onClick={closeDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          closeDetails(event);
        }
      }}
    >
      <button
        type="button"
        aria-label="Hide details"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/70 text-foreground/60 transition hover:border-white hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        onClick={closeDetails}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
      <div className="flex flex-1 flex-col items-center gap-4 px-6 pb-4 pt-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <h2
            className="text-base font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-xl sm:tracking-tight whitespace-nowrap"
            style={{
              fontFamily: '"Venturis ADF", "Venturis ADF Fallback", serif',
            }}
          >
            {title}
          </h2>
          {description}
        </div>
      </div>
    </article>
  );

  return (
    <div className="relative h-full w-full [perspective:2000px]">
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{
          transform: showDetails ? "rotateY(180deg)" : "rotateY(0deg)",
          willChange: "transform",
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: showDetails ? "none" : "auto",
          }}
        >
          {frontCard}
        </div>
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: showDetails ? "auto" : "none",
          }}
        >
          {backCard}
        </div>
      </div>
    </div>
  );
}
