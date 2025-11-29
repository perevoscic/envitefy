// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Share2,
  Calendar as CalendarIcon,
  Apple,
  MapPin,
  Clock,
  ExternalLink,
  Users,
  Check,
  HelpCircle,
  X,
  Bus,
  Hotel,
  FileText,
  CheckSquare,
  Car,
  Megaphone,
  Link as LinkIcon,
  Phone,
  AlertCircle,
  Plus,
  Mail,
} from "lucide-react";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventActions from "@/components/EventActions";
import Link from "next/link";
import { resolveEditHref } from "@/utils/event-edit-route";

type ThemeSpec = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview?: string;
  backgroundStyle?: React.CSSProperties;
};

type SimpleTemplateViewProps = {
  eventId: string;
  eventData: any;
  eventTitle: string;
  isOwner: boolean;
  isReadOnly: boolean;
  viewerKind: "owner" | "guest" | "readonly";
  shareUrl: string;
  sessionEmail: string | null;
  protectSensitiveSections?: boolean;
  protectedSectionFlags?: {
    roster?: boolean;
    meet?: boolean;
    practice?: boolean;
    logistics?: boolean;
    volunteers?: boolean;
  };
};

type NormalizedRosterAthlete = {
  id: string;
  name: string;
  level?: string;
  status: string;
  primaryEvents: string[];
  events: string[];
  jerseyNumber?: string;
  position?: string;
  grade?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  medicalNotes?: string;
};

const normalizeRosterStatus = (value?: string) =>
  (value || "").toString().trim().toLowerCase();

const normalizeRosterAthletes = (roster: any): NormalizedRosterAthlete[] => {
  if (!roster || typeof roster !== "object") return [];
  const entries = Array.isArray(roster.athletes)
    ? roster.athletes
    : Array.isArray(roster.players)
    ? roster.players
    : [];
  return entries
    .map((entry: any, idx: number) => {
      if (!entry || typeof entry !== "object") return null;
      const id =
        entry.id ||
        entry.playerId ||
        entry.athleteId ||
        entry.name ||
        entry.jerseyNumber ||
        `player-${idx + 1}`;
      const position =
        entry.position ||
        entry.primaryPosition ||
        (Array.isArray(entry.events) && entry.events[0]) ||
        (Array.isArray(entry.primaryEvents) && entry.primaryEvents[0]);
      const primaryEvents =
        Array.isArray(entry.primaryEvents) && entry.primaryEvents.length
          ? entry.primaryEvents
          : position
          ? [position]
          : [];
      const events =
        Array.isArray(entry.events) && entry.events.length
          ? entry.events
          : primaryEvents;
      return {
        id: id.toString(),
        name: entry.name || entry.athleteName || `Player ${idx + 1}`,
        level: entry.level || entry.grade || position || undefined,
        status: normalizeRosterStatus(
          entry.status || entry.playerStatus || entry.attendanceStatus || "active"
        ),
        primaryEvents,
        events,
        jerseyNumber: entry.jerseyNumber,
        position,
        grade: entry.grade,
        parentName: entry.parentName,
        parentPhone: entry.parentPhone,
        parentEmail: entry.parentEmail,
        medicalNotes: entry.medicalNotes,
      };
    })
    .filter(Boolean) as NormalizedRosterAthlete[];
};

export default function SimpleTemplateView({
  eventId,
  eventData,
  eventTitle,
  isOwner,
  isReadOnly,
  viewerKind,
  shareUrl,
  sessionEmail,
  protectSensitiveSections: protectSensitiveSectionsProp = false,
  protectedSectionFlags: protectedSectionFlagsProp = {},
}: SimpleTemplateViewProps) {
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState("yes");
  const [volunteerSignupModal, setVolunteerSignupModal] = useState<{
    open: boolean;
    slotId: string | null;
    slotRole: string | null;
  }>({ open: false, slotId: null, slotRole: null });
  const [volunteerSignupForm, setVolunteerSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [carpoolAddModal, setCarpoolAddModal] = useState(false);
  const [carpoolSignupModal, setCarpoolSignupModal] = useState<{
    open: boolean;
    carpool: any | null;
  }>({ open: false, carpool: null });
  const [carpoolContactModal, setCarpoolContactModal] = useState<{
    open: boolean;
    carpool: any | null;
  }>({ open: false, carpool: null });
  const [carpoolForm, setCarpoolForm] = useState({
    driverName: "",
    phone: "",
    email: "",
    seatsAvailable: 1,
    departureLocation: "",
    departureTime: "",
    direction: "",
  });
  const [carpoolSignupForm, setCarpoolSignupForm] = useState({
    passengerName: "",
    passengerPhone: "",
    passengerEmail: "",
    seatsRequested: 1,
  });
  const [carpoolSubmitting, setCarpoolSubmitting] = useState(false);
  const [carpoolSignupSubmitting, setCarpoolSignupSubmitting] = useState(false);
  const [eventDataState, setEventDataState] = useState(eventData);
  const [rsvpNameInput, setRsvpNameInput] = useState("");
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [gearChecklist, setGearChecklist] = useState<Record<string, boolean>>(
    {}
  );
  const toggleGearChecklistItem = useCallback((itemId: string) => {
    setGearChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  const protectSensitiveSections = Boolean(protectSensitiveSectionsProp);
  const protectedSectionFlags = protectedSectionFlagsProp || {};
  const isLocked = false;

  // Use state data if available, fallback to prop
  const currentData = eventDataState || eventData;
  const normalizedCategory = (() => {
    const raw = currentData?.category;
    if (typeof raw === "string") {
      return raw.trim().toLowerCase();
    }
    return "";
  })();
  const isSoccerTemplate =
    normalizedCategory === "sport_soccer" ||
    normalizedCategory === "soccer" ||
    currentData?.templateId === "soccer";
  const showRsvpSignInRequired = normalizedCategory === "gymnastics";

  // Default theme fallback
  const DEFAULT_THEME: ThemeSpec = {
    id: "default",
    name: "Default",
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
    text: "text-white",
    accent: "text-white",
    preview: "bg-slate-800",
  };

  // Extract theme directly from event data - it should have the full theme object
  const theme: ThemeSpec = (() => {
    // The theme object should be stored directly in currentData.theme
    const storedTheme = currentData?.theme;

    // Debug logging
    if (typeof window !== "undefined") {
      console.log("[SimpleTemplateView] currentData.theme:", storedTheme);
      console.log(
        "[SimpleTemplateView] currentData.themeId:",
        currentData?.themeId
      );
      console.log(
        "[SimpleTemplateView] currentData.address:",
        currentData?.address
      );
    }

    if (storedTheme?.bg && storedTheme?.text) {
      return storedTheme;
    }
    return DEFAULT_THEME;
  })();

  // Template config
  const templateConfig = currentData?.templateConfig || {};
  const detailFields = templateConfig?.detailFields || [];
  const rsvpCopy = templateConfig?.rsvpCopy || {
    editorTitle: "RSVP",
    toggleLabel: "Enable RSVP",
    deadlineLabel: "RSVP Deadline",
  };

  // Palette helpers (mirrors customize UI)
  const getLuminance = (hex: string): number => {
    const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!rgb) return 0.5;
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((val) =>
      parseInt(val, 16)
    );
    const toLinear = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    const [rl, gl, bl] = [r, g, b].map(toLinear);
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  };

  const isPaletteDark = (palette: string[]): boolean => {
    if (!palette || palette.length === 0) return false;
    const colors = palette.filter(Boolean).slice(0, 3);
    if (!colors.length) return false;
    const avg =
      colors.map(getLuminance).reduce((a, b) => a + b, 0) / colors.length;
    return avg < 0.5;
  };

  const paletteToBackgroundStyle = (palette: string[]) => {
    const colors = (palette || []).filter(Boolean);
    if (!colors.length) return undefined;
    if (colors.length === 1) return { backgroundColor: colors[0] };
    if (colors.length === 2) {
      return {
        backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      };
    }
    return {
      backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
    };
  };

  const paletteColors =
    Array.isArray(currentData?.themePalette) &&
    currentData.themePalette.filter(Boolean).length
      ? currentData.themePalette.filter(Boolean)
      : [];
  const paletteBackgroundStyle = paletteToBackgroundStyle(paletteColors);
  const paletteIsDark =
    paletteColors.length > 0 ? isPaletteDark(paletteColors) : null;

  // Event data extraction - use state data if available, fallback to prop
  const heroImage = currentData?.heroImage || "";
  const description = currentData?.description || "";
  const customFields = currentData?.customFields || {};
  const advancedSections =
    currentData?.advancedSections || customFields?.advancedSections || {};
  const rsvpEnabled = currentData?.rsvpEnabled ?? false;
  const rsvpDeadline = currentData?.rsvpDeadline || "";
  const isSignedIn = Boolean(sessionEmail);
  const venue = currentData?.venue || "";
  const city = currentData?.city || "";
  const state = currentData?.state || "";
  const address =
    currentData?.address ||
    customFields?.stadiumAddress ||
    customFields?.address ||
    "";
  const time = currentData?.time || "";
  const date = currentData?.date || "";
  const opponentName =
    customFields?.opponent ||
    currentData?.extra?.opponent ||
    advancedSections?.events?.events?.[0]?.opponent ||
    "";
  const uniformColors =
    customFields?.kit ||
    currentData?.extra?.kit ||
    advancedSections?.gear?.gear?.uniform ||
    advancedSections?.gear?.uniform ||
    "";
  const travelDetails =
    customFields?.travelPlan ||
    currentData?.extra?.travelPlan ||
    advancedSections?.logistics?.transport ||
    "";
  const meetingPoint =
    customFields?.meetingPoint ||
    currentData?.extra?.meetingPoint ||
    "";
  const weatherSummary =
    customFields?.weatherPlan ||
    currentData?.extra?.weatherPlan ||
    advancedSections?.logistics?.weatherPolicy ||
    "";

  // Format date
  const formatDate = (d: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  // Format time
  const formatTime = (t: string) => {
    if (!t) return "";
    try {
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    } catch {
      return t;
    }
  };

  // Build location string for header (compact but keeps city/state when present)
  const headerLocation =
    currentData?.location ||
    [venue, city, state].filter(Boolean).join(", ") ||
    address ||
    "";
  // Full location for calendar exports / map links
  const fullLocation =
    currentData?.location ||
    [venue, address, city, state].filter(Boolean).join(", ");

  // Theme classes
  const isDarkBackground = (() => {
    // Prefer palette inference when available
    if (paletteIsDark !== null) return paletteIsDark;
    const bg = theme?.bg?.toLowerCase() ?? "";
    const id = theme?.id?.toLowerCase() ?? "";
    const darkTokens = [
      "black",
      "slate-9",
      "stone-9",
      "neutral-9",
      "gray-9",
      "grey-9",
      "indigo-9",
      "purple-9",
      "violet-9",
      "emerald-9",
      "teal-9",
      "blue-9",
      "navy",
      "midnight",
      "from-slate-9",
      "from-purple-9",
      "from-indigo-9",
      "from-blue-9",
      "from-red-9",
      "from-rose-9",
      "from-orange-9",
      "from-cyan-9",
      "from-green-9",
      "from-emerald-9",
      "from-violet-9",
      "from-fuchsia",
      "from-yellow-6",
      "from-amber-9",
    ];
    return (
      darkTokens.some((token) => bg.includes(token)) ||
      /#0[0-9a-f]{5,}/i.test(bg) ||
      /(night|dark|midnight)/i.test(id) ||
      bg.includes("900") ||
      bg.includes("950") ||
      bg.includes("800")
    );
  })();

  const paletteTextFallback =
    paletteIsDark === null
      ? ""
      : paletteIsDark
      ? "text-white"
      : "text-slate-900";

  const rawTextClass = theme?.text || paletteTextFallback;
  const forceLightText =
    isDarkBackground && !rawTextClass.toLowerCase().includes("text-white");
  const textClass = forceLightText
    ? "text-white"
    : rawTextClass || "text-white";
  const accentClass =
    theme?.accent ||
    (paletteIsDark !== null
      ? paletteIsDark
        ? "text-slate-100"
        : "text-slate-700"
      : textClass);
  const usesLightText =
    /text-(white|slate-50|neutral-50|gray-50)/.test(textClass) ||
    isDarkBackground;
  const headingShadow = usesLightText
    ? { textShadow: "0 2px 6px rgba(0,0,0,0.55)" }
    : undefined;
  const bodyShadow = usesLightText
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" }
    : undefined;
  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;
  const headingFontFamily =
    currentData?.fontFamily ||
    currentData?.theme?.fontFamily ||
    "var(--font-playfair)";
  const headingSizeClass =
    currentData?.fontSizeClass ||
    currentData?.theme?.fontSizeH1 ||
    "text-3xl md:text-5xl";

  const headingStyle = {
    ...(headingShadow || {}),
    ...(titleColor || {}),
    fontFamily: headingFontFamily,
  };

  const fontHref =
    currentData?.fontHref ||
    currentData?.templateConfig?.fontHref ||
    currentData?.theme?.fontHref ||
    null;

  useEffect(() => {
    if (!fontHref) return;
    let link = document.querySelector<HTMLLinkElement>(
      `link[rel="stylesheet"][data-template-font="${fontHref}"]`
    );
    let added = false;
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontHref;
      link.setAttribute("data-template-font", fontHref);
      document.head.appendChild(link);
      added = true;
    } else if (link.href !== fontHref) {
      link.href = fontHref;
    }
    return () => {
      if (added && link?.parentElement) {
        link.parentElement.removeChild(link);
      }
    };
  }, [fontHref]);

  // Calendar handlers
  const toGoogleDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const buildEventDetails = () => {
    let start: Date | null = null;
    if (date) {
      const tentative = new Date(`${date}T${time || "14:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    return {
      title: eventTitle,
      start,
      end,
      location: fullLocation,
      description,
    };
  };

  const buildIcsUrl = (details: ReturnType<typeof buildEventDetails>) => {
    const params = new URLSearchParams();
    params.set("title", details.title);
    if (details.start) params.set("start", details.start.toISOString());
    if (details.end) params.set("end", details.end.toISOString());
    if (details.location) params.set("location", details.location);
    if (details.description) params.set("description", details.description);
    params.set("disposition", "inline");
    return `/api/ics?${params.toString()}`;
  };

  const openWithAppFallback = (appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 700);
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", clear);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clear();
    });
    try {
      window.location.href = appUrl;
    } catch {
      clearTimeout(timer);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = () => {
    const details = buildEventDetails();
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      shareUrl
    ) {
      (navigator as any)
        .share({
          title: details.title,
          text: details.description || details.location || details.title,
          url: shareUrl,
        })
        .catch(() => {
          window.open(shareUrl, "_blank", "noopener,noreferrer");
        });
    } else if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleGoogleCalendar = () => {
    const details = buildEventDetails();
    const start = toGoogleDate(details.start);
    const end = toGoogleDate(details.end);
    const query = `action=TEMPLATE&text=${encodeURIComponent(
      details.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(
      details.location
    )}&details=${encodeURIComponent(details.description || "")}`;
    const webUrl = `https://calendar.google.com/calendar/render?${query}`;
    const appUrl = `comgooglecalendar://?${query}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleOutlookCalendar = () => {
    const details = buildEventDetails();
    const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleAppleCalendar = () => {
    const details = buildEventDetails();
    const icsPath = buildIcsUrl(details);
    const absoluteIcs =
      typeof window !== "undefined"
        ? `${window.location.origin}${icsPath}`
        : icsPath;
    window.location.href = absoluteIcs;
  };

  const rosterAthletes = useMemo<NormalizedRosterAthlete[]>(
    () => normalizeRosterAthletes(advancedSections?.roster),
    [advancedSections?.roster]
  );

  // Section presence flags and navigation items
  const hasRoster =
    protectSensitiveSections && protectedSectionFlags?.roster !== undefined
      ? Boolean(protectedSectionFlags.roster)
      : rosterAthletes.length > 0;
  const hasMeet =
    protectSensitiveSections && protectedSectionFlags?.meet !== undefined
      ? Boolean(protectedSectionFlags.meet)
      : Boolean(
          advancedSections?.meet?.session ||
            advancedSections?.meet?.sessionNumber ||
            advancedSections?.meet?.warmUpTime ||
            advancedSections?.meet?.marchInTime ||
            advancedSections?.meet?.startApparatus
        );
  const hasPractice = (() => {
    if (
      protectSensitiveSections &&
      protectedSectionFlags?.practice !== undefined
    ) {
      return Boolean(protectedSectionFlags.practice);
    }
    if (Array.isArray(advancedSections?.practice?.blocks)) {
      return advancedSections.practice.blocks.length > 0;
    }
    return false;
  })();
  const hasLogistics = (() => {
    const logistics = advancedSections?.logistics;
    const hasFlag =
      protectSensitiveSections && protectedSectionFlags?.logistics !== undefined
        ? Boolean(protectedSectionFlags.logistics)
        : null;
    if (hasFlag !== null) return hasFlag;
    if (!logistics) return false;
    return (
      Boolean(logistics.travelMode) ||
      Boolean(logistics.transport) ||
      Boolean(logistics.hotel) ||
      Boolean(logistics.hotelName) ||
      Boolean(logistics.meals) ||
      Boolean(logistics.mealPlan) ||
      Boolean(logistics.callTime) ||
      Boolean(logistics.pickupWindow) ||
      Boolean(logistics.feeAmount) ||
      Boolean(logistics.paymentLink) ||
      (logistics.forms?.length ?? 0) > 0 ||
      (logistics.waiverLinks?.length ?? 0) > 0
    );
  })();
  const gearSection = advancedSections?.gear;
  const gearItemsCount = Array.isArray(gearSection?.items)
    ? gearSection.items.length
    : Array.isArray(gearSection)
    ? gearSection.length
    : 0;
  const hasGearInfo =
    Boolean(gearSection?.gear) ||
    Boolean(gearSection?.uniform) ||
    Boolean(gearSection?.hairMakeup) ||
    Boolean(gearSection?.shoes) ||
    Boolean(gearSection?.props) ||
    Boolean(gearSection?.checklist);
  const hasGear = gearItemsCount > 0 || hasGearInfo;
  const hasVolunteers =
    protectSensitiveSections && protectedSectionFlags?.volunteers !== undefined
      ? Boolean(protectedSectionFlags.volunteers)
      : (advancedSections?.volunteers?.volunteerSlots?.length ?? 0) > 0 ||
        (advancedSections?.volunteers?.slots?.length ?? 0) > 0 ||
        (advancedSections?.volunteers?.carpoolOffers?.length ?? 0) > 0 ||
        (advancedSections?.volunteers?.carpools?.length ?? 0) > 0;
  const hasAnnouncements =
    (advancedSections?.announcements?.items?.length ?? 0) > 0 ||
    (advancedSections?.announcements?.announcements?.length ?? 0) > 0;
  const hasRsvpSection = rsvpEnabled;
  const hasEvents =
    Array.isArray(advancedSections?.events?.events) &&
    advancedSections.events.events.length > 0;
  const hasLineup =
    Array.isArray(advancedSections?.lineup?.formation) &&
    advancedSections.lineup.formation.length > 0;
  const hasSnacks =
    Array.isArray(advancedSections?.snacks?.slots) &&
    advancedSections.snacks.slots.length > 0;

  const navItems = useMemo(
    () =>
      [
        { id: "details", label: "Details", enabled: true },
        {
          id: "events",
          label: isSoccerTemplate ? "Matches" : "Events",
          enabled: hasEvents,
        },
        { id: "lineup", label: "Lineup", enabled: hasLineup },
        { id: "roster", label: "Roster", enabled: hasRoster },
        { id: "meet", label: "Meet", enabled: hasMeet },
        { id: "practice", label: "Practice", enabled: hasPractice },
        { id: "logistics", label: "Logistics", enabled: hasLogistics },
        { id: "gear", label: "Gear", enabled: hasGear },
        { id: "snacks", label: "Snacks", enabled: hasSnacks },
        { id: "volunteers", label: "Volunteers", enabled: hasVolunteers },
        {
          id: "announcements",
          label: "Announcements",
          enabled: hasAnnouncements,
        },
        { id: "rsvp", label: "RSVP", enabled: hasRsvpSection },
      ].filter((item) => item.enabled),
    [
      hasAnnouncements,
      hasEvents,
      hasGear,
      hasLogistics,
      hasLineup,
      hasMeet,
      hasPractice,
      hasRoster,
      hasRsvpSection,
      hasSnacks,
      hasVolunteers,
      isSoccerTemplate,
    ]
  );

  const [activeSection, setActiveSection] = useState<string>(
    navItems[0]?.id || "details"
  );

  useEffect(() => {
    if (!selectedAthleteId && rosterAthletes.length > 0) {
      setSelectedAthleteId(rosterAthletes[0].id || "");
    }
  }, [selectedAthleteId, rosterAthletes]);

  useEffect(() => {
    if (!navItems.length) return;

    const updateActiveFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && navItems.some((i) => i.id === hash)) {
        setActiveSection(hash);
      } else {
        setActiveSection(navItems[0].id);
      }
    };

    updateActiveFromHash();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && navItems.some((i) => i.id === id)) {
              setActiveSection(id);
              if (window.location.hash !== `#${id}`) {
                window.history.replaceState(null, "", `#${id}`);
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0,
      }
    );

    const targets = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    targets.forEach((el) => observer.observe(el));

    window.addEventListener("hashchange", updateActiveFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateActiveFromHash);
    };
  }, [navItems]);

  useEffect(() => {
    setGearChecklist({});
  }, [eventId]);

  const wrapProtected = (node: React.ReactNode) => {
    if (isSignedIn) return node;
    const loginHref =
      typeof window !== "undefined"
        ? `/login?callbackUrl=${encodeURIComponent(window.location.href)}`
        : "/login";
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{node}</div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bg-black/70 text-white text-sm rounded-lg px-4 py-3 text-center shadow-lg max-w-sm">
            Sign in required to view this information.
            <a
              href={loginHref}
              className="block mt-2 underline font-semibold text-white"
            >
              Sign in
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Render roster section
  const renderEventsSection = () => {
    const events = advancedSections?.events?.events;
    if (!events?.length) return null;
    const formatDate = (value?: string) => {
      if (!value) return "";
      try {
        return new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return value;
      }
    };
    const formatTime = (value?: string) => {
      if (!value) return "";
      try {
        const [h, m] = value.split(":");
        const hour = parseInt(h, 10);
        const minute = m || "00";
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minute} ${ampm}`;
      } catch {
        return value;
      }
    };
    return wrapProtected(
      <section
        id="events"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Events & Competitions
        </h2>
        <div
          className={
            isSoccerTemplate
              ? "grid grid-cols-1 md:grid-cols-2 gap-4"
              : "space-y-4"
          }
        >
          {events.map((event: any) => {
            const heading = `${event.name || "Event"} ${
              event.type ? `(${event.type})` : ""
            }`;
            const opponent =
              event.opponent && event.opponent !== event.name
                ? `vs ${event.opponent}`
                : "";
            const homeAway = event.homeAway === "away" ? "AWAY" : "HOME";
            const location = [event.venue, event.address]
              .filter(Boolean)
              .join(", ");
            const timeParts = [
              formatDate(event.date),
              formatTime(event.time),
            ].filter(Boolean);
            return (
              <div
                key={event.id || heading + location}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wide text-slate-200">
                    {homeAway}
                  </span>
                  {event.type && (
                    <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10">
                      {event.type}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-lg" style={bodyShadow}>
                  {heading}
                </div>
                {opponent && (
                  <div className="text-sm opacity-90" style={bodyShadow}>
                    {opponent}
                  </div>
                )}
                {timeParts.length > 0 && (
                  <div className="text-sm opacity-70 mt-1" style={bodyShadow}>
                    {timeParts.join(" • ")}
                  </div>
                )}
                {location && (
                  <div className="text-sm opacity-70 mt-1" style={bodyShadow}>
                    {location}
                  </div>
                )}
                {event.callTime && (
                  <div className="text-xs uppercase tracking-wide opacity-70 mt-3">
                    Call time: {formatTime(event.callTime)}
                  </div>
                )}
                {(event.warmupTime || event.onMatTime) && (
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    Warm-up: {formatTime(event.warmupTime)}{" "}
                    {event.onMatTime && `• On mat: ${formatTime(event.onMatTime)}`}
                  </div>
                )}
                {event.notes && (
                  <p className="text-sm opacity-70 mt-2">{event.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderHeaderWidget = () => {
    const hasWidgetContent =
      opponentName || uniformColors || weatherSummary || travelDetails;
    if (!hasWidgetContent) return null;
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide opacity-70">Matchup</p>
          <div className="text-lg font-semibold" style={bodyShadow}>
            {opponentName ? `vs ${opponentName}` : "Match details"}
          </div>
          {meetingPoint && (
            <p className="opacity-70 mt-2">
              Meeting point: {meetingPoint}
            </p>
          )}
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide opacity-70">
            Uniform & Arrival
          </p>
          <div className="text-lg font-semibold" style={bodyShadow}>
            {uniformColors || "Confirm kit"}
          </div>
          {travelDetails && (
            <p className="opacity-70 mt-2">{travelDetails}</p>
          )}
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide opacity-70">Weather</p>
          <div className="text-lg font-semibold" style={bodyShadow}>
            {weatherSummary || "Check forecast"}
          </div>
          {time && (
            <p className="opacity-70 mt-2">
              Kick at {formatTime(time)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderRosterSection = () => {
    if (protectSensitiveSections) {
      if (!hasRoster) return null;
      return wrapProtected(
        <section
          id="roster"
          className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
        >
          <h2
            className={`text-2xl mb-4 ${accentClass}`}
            style={headingStyle}
          >
            Team Roster
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm opacity-80">
            Roster details are private. Please sign in to view athlete names,
            levels, and attendance.
          </div>
        </section>
      );
    }
    if (!rosterAthletes.length) return null;

    const statusSummaries: string[] = [];
    const confirmedCount = rosterAthletes.filter((a) =>
      ["going", "yes"].includes(a.status)
    ).length;
    const activeCount = rosterAthletes.filter(
      (a) => a.status === "active"
    ).length;
    const injuredCount = rosterAthletes.filter((a) =>
      ["injured", "ineligible"].includes(a.status)
    ).length;
    const pendingCount = rosterAthletes.filter((a) =>
      ["pending", "maybe"].includes(a.status)
    ).length;
    const notGoingCount = rosterAthletes.filter((a) =>
      ["notgoing", "not_going", "no"].includes(a.status)
    ).length;
    if (confirmedCount) statusSummaries.push(`${confirmedCount} confirmed`);
    if (activeCount) statusSummaries.push(`${activeCount} active`);
    if (injuredCount) statusSummaries.push(`${injuredCount} injured`);
    if (pendingCount) statusSummaries.push(`${pendingCount} pending`);
    if (notGoingCount) statusSummaries.push(`${notGoingCount} not going`);

    const statusIcon = (status: string) => {
      if (["going", "yes", "active"].includes(status)) {
        return <Check size={16} className="text-emerald-400" />;
      }
      if (["notgoing", "not_going", "no"].includes(status)) {
        return <X size={16} className="text-red-400" />;
      }
      if (["injured", "ineligible"].includes(status)) {
        return <AlertCircle size={16} className="text-yellow-400" />;
      }
      if (["pending", "maybe"].includes(status)) {
        return <Clock size={16} className="text-slate-400" />;
      }
      return <HelpCircle size={16} className="text-slate-400" />;
    };

    return wrapProtected(
      <section
        id="roster"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Team Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rosterAthletes.map((athlete) => (
            <div
              key={athlete.id}
              className={`bg-white/5 border border-white/10 rounded-lg space-y-3 ${
                isSoccerTemplate ? "p-3" : "p-4"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {athlete.jerseyNumber && (
                    <span className="text-2xl font-bold opacity-60">
                      #{athlete.jerseyNumber}
                    </span>
                  )}
                  <div>
                    <div
                      className={`font-semibold ${textClass}`}
                      style={bodyShadow}
                    >
                      {athlete.name}
                    </div>
                    <div
                      className={`text-sm opacity-70 ${textClass}`}
                      style={bodyShadow}
                    >
                      {athlete.position ||
                        athlete.primaryEvents?.[0] ||
                        "Position TBD"}{" "}
                      {athlete.level ? `• ${athlete.level}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
                  {statusIcon(athlete.status)}
                </div>
              </div>
              {(athlete.parentName ||
                athlete.parentPhone ||
                athlete.parentEmail) && (
                <p className="text-xs opacity-70">
                  {athlete.parentName && <>Parent: {athlete.parentName}</>}
                  {athlete.parentPhone && <> • {athlete.parentPhone}</>}
                  {athlete.parentEmail && <> • {athlete.parentEmail}</>}
                </p>
              )}
              {athlete.medicalNotes && (
                <p className="text-xs opacity-70">
                  {athlete.medicalNotes}
                </p>
              )}
            </div>
          ))}
        </div>
        {statusSummaries.length > 0 && (
          <div
            className="mt-4 flex flex-wrap gap-3 text-sm opacity-70"
            style={bodyShadow}
          >
            {statusSummaries.map((summary) => (
              <span key={summary} className={textClass}>
                {summary}
              </span>
            ))}
          </div>
        )}
      </section>
    );
  };

  // Render meet section
  const renderMeetSection = () => {
    const meet = advancedSections?.meet;
    if (protectSensitiveSections) {
      if (!hasMeet) return null;
      return wrapProtected(
        <section
          id="meet"
          className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
        >
          <h2
            className={`text-2xl mb-4 ${accentClass}`}
            style={headingStyle}
          >
            Meet Details
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm opacity-80">
            Meet session times, rotations, and score links are only visible to
            signed-in teammates.
          </div>
        </section>
      );
    }
    if (!meet) return null;

    const hasData =
      meet.session ||
      meet.sessionNumber ||
      meet.warmUpTime ||
      meet.marchInTime ||
      meet.startApparatus ||
      meet.rotationOrder?.length ||
      meet.judgingNotes ||
      meet.scoresLink;
    if (!hasData) return null;

    return wrapProtected(
      <section
        id="meet"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Meet Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Session
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.session || meet.sessionNumber || "—"}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Warm-up
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.warmupTime || meet.warmUpTime || "—"}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              March-in
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.marchInTime || meet.marchinTime || "—"}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
            >
              Start
            </div>
            <div className={`mt-1 font-bold ${textClass}`} style={bodyShadow}>
              {meet.startApparatus || "—"}
            </div>
          </div>
        </div>
        {meet.rotationOrder?.length > 0 && (
          <div
            className={`flex items-center gap-2 flex-wrap mb-4 ${textClass}`}
            style={bodyShadow}
          >
            <span className="opacity-70">Rotation:</span>
            {meet.rotationOrder.map((app: string, idx: number) => (
              <React.Fragment key={idx}>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {app}
                </span>
                {idx < meet.rotationOrder.length - 1 && (
                  <span className="opacity-50">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {(meet.notes || meet.judgingNotes) && (
          <p className={`text-sm opacity-80 ${textClass}`} style={bodyShadow}>
            {meet.notes || meet.judgingNotes}
          </p>
        )}
        {meet.scoresLink && (
          <a
            href={meet.scoresLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ExternalLink size={16} />
            <span>View Live Scores</span>
          </a>
        )}
      </section>
    );
  };

  // Render practice section
  const renderPracticeSection = () => {
    const practice = advancedSections?.practice;
    if (protectSensitiveSections) {
      if (!hasPractice) return null;
      return wrapProtected(
        <section
          id="practice"
          className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
        >
          <h2
            className={`text-2xl mb-4 ${accentClass}`}
            style={headingStyle}
          >
            Practice Schedule
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm opacity-80">
            Weekly practice blocks are hidden for public viewers. Sign in to see
            times and focus areas.
          </div>
        </section>
      );
    }
    if (!practice?.blocks?.length) return null;

    // Helper to format time from startTime/endTime or use time field
    const formatTime = (block: any) => {
      if (block.time) return block.time;
      if (block.startTime && block.endTime) {
        const formatTimeStr = (timeStr: string) => {
          if (!timeStr) return "";
          // Handle both "16:30" and "4:30 PM" formats
          if (timeStr.includes(":")) {
            const [hours, minutes] = timeStr.split(":");
            const hour = parseInt(hours, 10);
            if (hour >= 12) {
              const pmHour = hour === 12 ? 12 : hour - 12;
              return `${pmHour}:${minutes} PM`;
            } else {
              const amHour = hour === 0 ? 12 : hour;
              return `${amHour}:${minutes} AM`;
            }
          }
          return timeStr;
        };
        return `${formatTimeStr(block.startTime)} - ${formatTimeStr(
          block.endTime
        )}`;
      }
      return "";
    };

    // Helper to get description from various possible fields
    const getDescription = (block: any) => {
      return (
        block.skillGoals ||
        block.description ||
        block.goals ||
        block.details ||
        ""
      );
    };

    return wrapProtected(
      <section
        id="practice"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Practice Schedule
        </h2>
        <div className="space-y-4">
          {practice.blocks.map((block: any, idx: number) => {
            const timeStr = formatTime(block);
            const description = getDescription(block);
            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-semibold ${textClass}`}
                    style={bodyShadow}
                  >
                    {block.day}
                  </span>
                  {timeStr && (
                    <span className={`text-sm opacity-70 ${textClass}`}>
                      {timeStr}
                    </span>
                  )}
                </div>
                {block.focus &&
                  (Array.isArray(block.focus)
                    ? block.focus.length > 0
                    : block.focus) && (
                    <div className={`text-sm ${textClass}`} style={bodyShadow}>
                      <span className="opacity-70">Focus:</span>{" "}
                      {Array.isArray(block.focus)
                        ? block.focus.join(", ")
                        : block.focus}
                    </div>
                  )}
                {description && (
                  <p className={`text-sm opacity-70 mt-2 ${textClass}`}>
                    {description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderLineupSection = () => {
    const formation = advancedSections?.lineup?.formation;
    if (!isSoccerTemplate || !formation?.length) return null;
    const lines = Array.from(
      new Set(
        formation.map((slot: any) => Number(slot.line) || 1)
      )
    ).sort((a, b) => a - b);
    return (
      <section
        id="lineup"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Lineup & Formation
        </h2>
        {uniformColors && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center px-4 py-1 rounded-full bg-white/10 border border-white/25 text-xs uppercase tracking-wide">
              Kit: {uniformColors}
            </span>
          </div>
        )}
        <div className="relative bg-gradient-to-b from-emerald-900 to-emerald-600 border border-emerald-950 rounded-[32px] p-6 text-white overflow-hidden shadow-xl">
          <div className="absolute inset-4 border-2 border-white/20 rounded-[28px] pointer-events-none" />
          <div className="absolute left-1/2 top-6 bottom-28 w-px bg-white/25 pointer-events-none" />
          <div className="absolute inset-x-10 top-1/3 h-px bg-white/15 pointer-events-none" />
          <div className="absolute inset-x-10 top-1/2 h-px bg-white/15 pointer-events-none" />
          <div className="absolute inset-x-14 top-2/3 h-px bg-white/15 pointer-events-none" />
          <div className="absolute inset-x-10 bottom-6 h-24 border-2 border-white/25 rounded-b-[90px] pointer-events-none" />
          <div className="absolute inset-x-[120px] bottom-6 h-12 border border-white/30 rounded-b-full pointer-events-none" />
          <div className="absolute left-1/2 bottom-16 w-20 h-20 -translate-x-1/2 border border-white/30 rounded-full pointer-events-none" />
          <div className="relative space-y-6">
            {lines.map((line) => {
              const rowSlots = formation
                .filter((slot: any) => (Number(slot.line) || 1) === line)
                .sort(
                  (a: any, b: any) =>
                    (Number(a.spot) || 2) - (Number(b.spot) || 2)
                );
              return (
                <div
                  key={`line-${line}`}
                  className="flex flex-wrap items-center justify-center gap-4"
                >
                  {rowSlots.map((slot: any) => {
                    const slotNumber =
                      slot.number ||
                      slot.jerseyNumber ||
                      slot.jersey ||
                      slot.playerNumber ||
                      "?";
                    return (
                      <div
                        key={slot.id || `${line}-${slot.label}`}
                        className="min-w-[130px] rounded-2xl bg-white/15 border border-white/35 px-4 py-4 text-center shadow-md backdrop-blur-sm flex flex-col items-center gap-1"
                      >
                        <div className="flex items-center justify-center mb-1">
                          <div className="relative w-14 h-16">
                            <div className="absolute inset-0 rounded-t-[18px] rounded-b-[40%] border border-white/70 bg-gradient-to-b from-white/95 to-white/60 text-emerald-900 flex flex-col items-center justify-center shadow-lg">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                                {slot.label || "--"}
                              </span>
                              <span className="text-lg font-black">
                                #{slotNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold text-base">
                          {slot.player || "Open slot"}
                        </div>
                        {uniformColors && (
                          <div className="text-[11px] opacity-70">
                            {uniformColors}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // Render logistics section
  const renderLogisticsSection = () => {
    const logistics = advancedSections?.logistics;
    if (protectSensitiveSections) {
      if (!hasLogistics) return null;
      return wrapProtected(
        <section
          id="logistics"
          className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
        >
          <h2
            className={`text-2xl mb-4 ${accentClass}`}
            style={headingStyle}
          >
            Logistics
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm opacity-80 space-y-2">
            <p>Travel, hotel, fees, and meal plans stay private.</p>
            <p>Please sign in to view the full trip logistics.</p>
          </div>
        </section>
      );
    }
    if (!logistics) return null;

    const hasContent =
      logistics.travelMode ||
      logistics.transport ||
      logistics.hotel ||
      logistics.hotelName ||
      logistics.meals ||
      logistics.mealPlan ||
      logistics.forms?.length ||
      logistics.feeAmount ||
      logistics.paymentLink ||
      logistics.waiverLinks?.length ||
      logistics.callTime ||
      logistics.pickupWindow;
    if (!hasContent) return null;

    return wrapProtected(
      <section
        id="logistics"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Logistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transportation - show if travelMode, callTime, pickupWindow, or transport exists */}
          {(logistics.travelMode ||
            logistics.callTime ||
            logistics.pickupWindow ||
            logistics.transport) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bus size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  TRANSPORTATION
                </span>
              </div>
              {logistics.transport && (
                <p className={`text-sm opacity-80 ${textClass}`}>
                  {logistics.transport}
                </p>
              )}
              {logistics.travelMode && !logistics.transport && (
                <p className={`text-sm opacity-80 ${textClass}`}>
                  {logistics.travelMode === "bus" && "🚌 Team Bus"}
                  {logistics.travelMode === "parent_drive" && "🚗 Parent Drive"}
                  {logistics.travelMode === "carpool" && "🚙 Carpool"}
                  {logistics.travelMode === "other" && "Other"}
                </p>
              )}
              {logistics.callTime && (
                <p className={`text-sm mt-2 ${textClass}`}>
                  <span className="opacity-70">Call time:</span>{" "}
                  {logistics.callTime.includes(":") &&
                  !logistics.callTime.includes("AM") &&
                  !logistics.callTime.includes("PM")
                    ? (() => {
                        const [hours, minutes] = logistics.callTime.split(":");
                        const hour = parseInt(hours, 10);
                        if (hour >= 12) {
                          const pmHour = hour === 12 ? 12 : hour - 12;
                          return `${pmHour}:${minutes} PM`;
                        } else {
                          const amHour = hour === 0 ? 12 : hour;
                          return `${amHour}:${minutes} AM`;
                        }
                      })()
                    : logistics.callTime}
                </p>
              )}
            </div>
          )}

          {/* Hotel - show if hotelName or hotel exists */}
          {(logistics.hotelName || logistics.hotel) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hotel size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  HOTEL
                </span>
              </div>
              {logistics.hotelName && (
                <p
                  className={`text-sm font-medium opacity-90 ${textClass}`}
                  style={bodyShadow}
                >
                  {logistics.hotelName}
                </p>
              )}
              {logistics.hotelAddress && (
                <p className={`text-sm opacity-80 mt-1 ${textClass}`}>
                  {logistics.hotelAddress}
                </p>
              )}
              {logistics.hotelCheckIn && (
                <p className={`text-sm opacity-70 mt-1 ${textClass}`}>
                  <span className="opacity-70">Check-in:</span>{" "}
                  {logistics.hotelCheckIn}
                </p>
              )}
              {logistics.hotel && !logistics.hotelName && (
                <p className={`text-sm opacity-80 ${textClass}`}>
                  {logistics.hotel}
                </p>
              )}
            </div>
          )}

          {/* Fee - show if feeAmount, paymentLink, or waiverLinks exist */}
          {(logistics.feeAmount ||
            logistics.paymentLink ||
            logistics.waiverLinks?.length) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  FEE
                </span>
              </div>
              {logistics.feeAmount && (
                <p className={`text-sm opacity-80 ${textClass}`}>
                  {logistics.feeAmount}
                </p>
              )}
              {logistics.feeDueDate && (
                <p className={`text-sm opacity-70 mt-1 ${textClass}`}>
                  <span className="opacity-70">Due:</span>{" "}
                  {new Date(logistics.feeDueDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {logistics.paymentLink && (
                  <a
                    href={logistics.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
                  >
                    <LinkIcon size={16} />
                    Pay Fees
                  </a>
                )}
                {(logistics.waiverLinks || []).map(
                  (link: string, idx: number) =>
                    link && (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
                      >
                        <FileText size={16} />
                        Form #{idx + 1}
                      </a>
                    )
                )}
              </div>
            </div>
          )}

          {/* Meals - show if mealPlan or meals exists */}
          {(logistics.mealPlan || logistics.meals) && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  MEALS
                </span>
              </div>
              <p className={`text-sm opacity-80 ${textClass}`}>
                {logistics.mealPlan || logistics.meals}
              </p>
            </div>
          )}
          {logistics.forms?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className={accentClass} />
                <span
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  Required Forms
                </span>
              </div>
              <ul className="space-y-1">
                {logistics.forms.map((form: any, idx: number) => (
                  <li key={idx}>
                    {form.url ? (
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm underline ${accentClass}`}
                      >
                        {form.name}
                      </a>
                    ) : (
                      <span className={`text-sm opacity-80 ${textClass}`}>
                        {form.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Forms - only if not already shown in Fee section */}
          {logistics.forms?.length > 0 &&
            !logistics.feeAmount &&
            !logistics.paymentLink &&
            !logistics.waiverLinks?.length && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={18} className={accentClass} />
                  <span
                    className={`font-semibold ${textClass}`}
                    style={bodyShadow}
                  >
                    Required Forms
                  </span>
                </div>
                <ul className="space-y-1">
                  {logistics.forms.map((form: any, idx: number) => (
                    <li key={idx}>
                      {form.url ? (
                        <a
                          href={form.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm underline ${accentClass}`}
                        >
                          {form.name}
                        </a>
                      ) : (
                        <span className={`text-sm opacity-80 ${textClass}`}>
                          {form.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </section>
    );
  };

  // Render gear section
  const renderGearSection = () => {
    const gear = advancedSections?.gear;
    const gearItems = Array.isArray(gear?.items)
      ? gear.items
      : Array.isArray(gear)
      ? gear
      : [];
    const gearInfo =
      gear?.gear ||
      (gear?.uniform ||
      gear?.hairMakeup ||
      gear?.shoes ||
      gear?.props ||
      gear?.checklist
        ? gear
        : null);
    if (!gearItems.length && !gearInfo) return null;

    return (
      <section
        id="gear"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Gear & Uniform Checklist
        </h2>
        {gearInfo && (
          <div className="mb-4 bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            {gearInfo.uniform && (
              <p className={`text-sm ${textClass}`}>
                <strong>Uniform:</strong> {gearInfo.uniform}
              </p>
            )}
            {gearInfo.hairMakeup && (
              <p className={`text-sm ${textClass}`}>
                <strong>Hair / Makeup:</strong> {gearInfo.hairMakeup}
              </p>
            )}
            {gearInfo.shoes && (
              <p className={`text-sm ${textClass}`}>
                <strong>Shoes / Accessories:</strong> {gearInfo.shoes}
              </p>
            )}
            {gearInfo.props && (
              <p className={`text-sm ${textClass}`}>
                <strong>Props:</strong> {gearInfo.props}
              </p>
            )}
            {gearInfo.musicLink && (
              <p className={`text-sm ${textClass}`}>
                <strong>Music:</strong>{" "}
                <a
                  href={gearInfo.musicLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {gearInfo.musicLink}
                </a>
              </p>
            )}
            {gearInfo.checklist && (
              <p className={`text-sm ${textClass}`}>
                <strong>Checklist:</strong> {gearInfo.checklist}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {gearItems.map((item: any, idx: number) => {
            const normalized =
              typeof item === "string" ? { id: `gear-${idx}`, name: item } : item;
            const itemId =
              normalized?.id || normalized?.name || `gear-${idx}`;
            const itemName = normalized?.name || String(itemId);
            const isChecked = Boolean(gearChecklist[itemId]);
            return (
              <label
                key={idx}
                className={`flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors ${
                  isChecked ? "bg-white/10 border-white/20" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleGearChecklistItem(itemId)}
                  className="w-5 h-5 rounded border-white/30 bg-white/10 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer"
                />
                <span
                  className={`flex-1 ${textClass} ${
                    isChecked ? "line-through opacity-60" : ""
                  }`}
                  style={bodyShadow}
                >
                  {itemName}
                </span>
              </label>
            );
          })}
        </div>
        {gear?.notes && (
          <p
            className={`text-sm opacity-70 mt-4 ${textClass}`}
            style={bodyShadow}
          >
            {gear.notes}
          </p>
        )}
      </section>
    );
  };

  const renderSnacksSection = () => {
    const snacks = advancedSections?.snacks;
    const slots = Array.isArray(snacks?.slots) ? snacks.slots : [];
    if (!slots.length) return null;
    return (
      <section
        id="snacks"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Snacks & Hydration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slots.map((slot: any, idx: number) => {
            const slotId = slot.id || `snack-${idx}`;
            const filled = Boolean(slot.family);
            return (
              <div
                key={slotId}
                className={`rounded-xl border p-4 transition-colors ${
                  filled
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-dashed border-white/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <div
                      className={`text-sm uppercase tracking-wide opacity-80 ${textClass}`}
                      style={bodyShadow}
                    >
                      {slot.role || "Snack duty"}
                    </div>
                    {slot.notes && (
                      <p
                        className={`text-xs opacity-70 ${textClass}`}
                        style={bodyShadow}
                      >
                        {slot.notes}
                      </p>
                    )}
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      filled ? "bg-white/20" : "bg-white/5"
                    }`}
                  >
                    {filled ? "Assigned" : "Open"}
                  </div>
                </div>
                {filled ? (
                  <p className={`text-sm ${textClass}`} style={bodyShadow}>
                    {slot.family}
                    {slot.contact ? ` · ${slot.contact}` : ""}
                  </p>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="opacity-70">Open slot – sign up below.</p>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold hover:bg-white/20 transition-colors"
                      onClick={() => {
                        setVolunteerSignupForm({ name: "", email: "", phone: "" });
                        setVolunteerSignupModal({
                          open: true,
                          slotId,
                          slotRole: slot.role || "Snacks & Hydration",
                        });
                      }}
                    >
                      Claim
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Update eventDataState when eventData prop changes
  useEffect(() => {
    setEventDataState(eventData);
  }, [eventData]);

  const handleRsvpSubmit = async () => {
    // Redirect guests to sign-in
    if (!isSignedIn) {
      const loginHref =
        typeof window !== "undefined"
          ? `/login?callbackUrl=${encodeURIComponent(window.location.href)}`
          : "/login";
      window.location.href = loginHref;
      return;
    }

    if (!selectedAthleteId && !rsvpNameInput.trim()) {
      setRsvpError("Select an athlete or enter a name.");
      return;
    }

    setRsvpError(null);
    setRsvpSubmitting(true);
    try {
      const res = await fetch("/api/rsvp/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          status: rsvpAttending === "yes" ? "going" : "notgoing",
          athleteId: selectedAthleteId || null,
          athleteName: rsvpNameInput.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setRsvpError(json?.error || "Failed to submit attendance.");
        return;
      }
      if (json?.updatedEvent?.data) {
        setEventDataState(json.updatedEvent.data);
      }
      setRsvpSubmitted(true);
    } catch (err: any) {
      setRsvpError(err?.message || "Failed to submit attendance.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Handle volunteer signup
  const handleVolunteerSignup = async () => {
    if (!volunteerSignupModal.slotId || !volunteerSignupForm.name.trim()) {
      return;
    }

    setVolunteerSubmitting(true);
    try {
      const response = await fetch(`/api/history/${eventId}/volunteer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: volunteerSignupModal.slotId,
          name: volunteerSignupForm.name.trim(),
          email: volunteerSignupForm.email.trim() || undefined,
          phone: volunteerSignupForm.phone.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || "Failed to sign up for volunteer slot");
        return;
      }

      // Refresh event data
      const updatedResponse = await fetch(`/api/history/${eventId}`, {
        cache: "no-store",
      });
      if (updatedResponse.ok) {
        const updated = await updatedResponse.json();
        setEventDataState(updated.data || updated);
      }

      // Close modal and reset form
      setVolunteerSignupModal({ open: false, slotId: null, slotRole: null });
      setVolunteerSignupForm({ name: "", email: "", phone: "" });
    } catch (err: any) {
      alert(err?.message || "Failed to sign up for volunteer slot");
    } finally {
      setVolunteerSubmitting(false);
    }
  };

  // Handle adding carpool offer
  const handleAddCarpool = async () => {
    if (!carpoolForm.driverName.trim() || !carpoolForm.seatsAvailable) {
      return;
    }

    setCarpoolSubmitting(true);
    try {
      const response = await fetch(`/api/history/${eventId}/carpool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          driverName: carpoolForm.driverName.trim(),
          phone: carpoolForm.phone.trim() || undefined,
          email: carpoolForm.email.trim() || undefined,
          seatsAvailable: Number(carpoolForm.seatsAvailable) || 1,
          departureLocation: carpoolForm.departureLocation.trim() || undefined,
          departureTime: carpoolForm.departureTime.trim() || undefined,
          direction: carpoolForm.direction.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || "Failed to add carpool offer");
        return;
      }

      // Refresh event data
      const updatedResponse = await fetch(`/api/history/${eventId}`, {
        cache: "no-store",
      });
      if (updatedResponse.ok) {
        const updated = await updatedResponse.json();
        setEventDataState(updated.data || updated);
      }

      // Close modal and reset form
      setCarpoolAddModal(false);
      setCarpoolForm({
        driverName: "",
        phone: "",
        email: "",
        seatsAvailable: 1,
        departureLocation: "",
        departureTime: "",
        direction: "",
      });
    } catch (err: any) {
      alert(err?.message || "Failed to add carpool offer");
    } finally {
      setCarpoolSubmitting(false);
    }
  };

  // Handle carpool signup
  const handleCarpoolSignup = async () => {
    if (
      !carpoolSignupModal.carpool ||
      !carpoolSignupForm.passengerName.trim() ||
      !carpoolSignupForm.seatsRequested
    ) {
      return;
    }

    setCarpoolSignupSubmitting(true);
    try {
      const response = await fetch(`/api/history/${eventId}/carpool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          carpoolId: carpoolSignupModal.carpool.id,
          passengerName: carpoolSignupForm.passengerName.trim(),
          passengerPhone: carpoolSignupForm.passengerPhone.trim() || undefined,
          passengerEmail: carpoolSignupForm.passengerEmail.trim() || undefined,
          seatsRequested: Number(carpoolSignupForm.seatsRequested) || 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || "Failed to sign up for carpool");
        return;
      }

      // Refresh event data
      const updatedResponse = await fetch(`/api/history/${eventId}`, {
        cache: "no-store",
      });
      if (updatedResponse.ok) {
        const updated = await updatedResponse.json();
        setEventDataState(updated.data || updated);
      }

      // Close modal and reset form
      setCarpoolSignupModal({ open: false, carpool: null });
      setCarpoolSignupForm({
        passengerName: "",
        passengerPhone: "",
        passengerEmail: "",
        seatsRequested: 1,
      });
    } catch (err: any) {
      alert(err?.message || "Failed to sign up for carpool");
    } finally {
      setCarpoolSignupSubmitting(false);
    }
  };

  // Render volunteers section - handle both data structures
  const renderVolunteersSection = () => {
    const advancedSections = currentData?.advancedSections || {};
    const volunteers = advancedSections?.volunteers;

    if (protectSensitiveSections) {
      if (!hasVolunteers) return null;
      return wrapProtected(
        <section
          id="volunteers"
          className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
        >
          <h2
            className={`text-2xl mb-4 ${accentClass}`}
            style={headingStyle}
          >
            Volunteers & Carpool
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm opacity-80 space-y-2">
            <p>Volunteer roles and carpool offers are private.</p>
            <p>Sign in to view and respond to openings.</p>
          </div>
        </section>
      );
    }

    // Handle both data structures: slots/carpools and volunteerSlots/carpoolOffers
    const slots = volunteers?.volunteerSlots || volunteers?.slots || [];
    const carpools = volunteers?.carpoolOffers || volunteers?.carpools || [];

    if (!slots.length && !carpools.length) return null;

    // Format time helper
    const formatTime = (timeStr: string) => {
      if (!timeStr) return "";
      if (
        timeStr.includes(":") &&
        !timeStr.includes("AM") &&
        !timeStr.includes("PM")
      ) {
        const [hours, minutes] = timeStr.split(":");
        const hour = parseInt(hours, 10);
        if (hour >= 12) {
          const pmHour = hour === 12 ? 12 : hour - 12;
          return `${pmHour}:${minutes} PM`;
        } else {
          const amHour = hour === 0 ? 12 : hour;
          return `${amHour}:${minutes} AM`;
        }
      }
      return timeStr;
    };

    return wrapProtected(
      <section
        id="volunteers"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        {slots.length > 0 && (
          <div className="mb-8">
            <h2
              className={`text-2xl mb-4 ${accentClass}`}
              style={headingStyle}
            >
              Volunteers Needed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slots.map((slot: any, idx: number) => {
                const isFilled = slot.filled || slot.assignee || slot.name;
                const assigneeName = slot.assignee || slot.name || "";
                return (
                  <div
                    key={slot.id || idx}
                    className={`flex items-center justify-between rounded-lg p-3 ${
                      isFilled
                        ? "bg-green-500/20 border border-green-400/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div>
                      <div
                        className={`font-medium ${textClass}`}
                        style={bodyShadow}
                      >
                        {slot.role}
                      </div>
                      {assigneeName && (
                        <div className={`text-sm opacity-70 ${textClass}`}>
                          {assigneeName}
                        </div>
                      )}
                    </div>
                    {isFilled ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <button
                        onClick={() =>
                          setVolunteerSignupModal({
                            open: true,
                            slotId: slot.id || String(idx),
                            slotRole: slot.role || "Volunteer",
                          })
                        }
                        className="text-xs px-3 py-1.5 bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 rounded transition-colors font-medium"
                      >
                        Sign Up
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-2xl ${accentClass}`}
              style={headingStyle}
            >
              Carpool Offers
            </h2>
            <button
              onClick={() => setCarpoolAddModal(true)}
              className="text-xs px-3 py-1.5 bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 rounded transition-colors font-medium flex items-center gap-1"
            >
              <Plus size={14} /> Add Offer
            </button>
          </div>
          {carpools.length > 0 ? (
        <div
          className={
            isSoccerTemplate
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "space-y-3"
          }
        >
              {carpools
                .filter((cp: any) => cp.driverName || cp.driver)
                .map((carpool: any, idx: number) => {
                  const driverName = carpool.driverName || carpool.driver || "";
                  const seatsAvailable =
                    carpool.seatsAvailable || carpool.seats || 0;
                  const seatsTaken = carpool.seatsTaken || 0;
                  const seatsRemaining = seatsAvailable - seatsTaken;
                  const phone = carpool.phone || "";
                  const departureLocation = carpool.departureLocation || "";
                  const departureTime = carpool.departureTime || "";
                  const direction = carpool.direction || "";
                  const signups = carpool.signups || [];

                  return (
                    <div
                      key={carpool.id || idx}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`font-semibold ${textClass}`}
                          style={bodyShadow}
                        >
                          {driverName}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            seatsRemaining > 0
                              ? "bg-cyan-500/30 text-cyan-200"
                              : "bg-red-500/30 text-red-200"
                          }`}
                        >
                          {seatsRemaining} of {seatsAvailable} seat
                          {seatsAvailable !== 1 ? "s" : ""} available
                        </span>
                      </div>
                      {(departureLocation || departureTime) && (
                        <div
                          className={`text-sm opacity-70 ${textClass}`}
                          style={bodyShadow}
                        >
                          {departureLocation && (
                            <span>{departureLocation}</span>
                          )}
                          {departureTime && (
                            <span> • {formatTime(departureTime)}</span>
                          )}
                        </div>
                      )}
                      {direction && !departureLocation && !departureTime && (
                        <div className={`text-sm opacity-70 ${textClass}`}>
                          {direction}
                        </div>
                      )}
                      {signups.length > 0 && (
                        <div className="mt-2 mb-2">
                          <div
                            className={`text-xs opacity-70 ${textClass}`}
                            style={bodyShadow}
                          >
                            Passengers:{" "}
                            {signups
                              .map(
                                (s: any) =>
                                  `${s.passengerName} (${
                                    s.seatsRequested
                                  } seat${s.seatsRequested !== 1 ? "s" : ""})`
                              )
                              .join(", ")}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {seatsRemaining > 0 && (
                          <button
                            onClick={() => {
                              setCarpoolSignupModal({ open: true, carpool });
                              setCarpoolSignupForm({
                                passengerName: "",
                                passengerPhone: "",
                                passengerEmail: "",
                                seatsRequested: 1,
                              });
                            }}
                            className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-orange-500/30 hover:bg-orange-500/50 text-orange-200 rounded transition-colors font-medium`}
                          >
                            <Users size={14} /> Sign Up
                          </button>
                        )}
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors ${textClass}`}
                          >
                            <Phone size={14} /> Call
                          </a>
                        )}
                        <button
                          onClick={() =>
                            setCarpoolContactModal({ open: true, carpool })
                          }
                          className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors ${textClass}`}
                        >
                          <Mail size={14} /> Contact
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>
              No carpool offers yet. Be the first to add one!
            </p>
          )}
        </div>
      </section>
    );
  };

  // Render announcements section - handle both data structures
  const renderAnnouncementsSection = () => {
    const announcements = advancedSections?.announcements;

    // Handle both data structures: items array and announcements array
    const items = announcements?.items || announcements?.announcements || [];
    const filteredItems = items.filter(
      (item: any) => item.text || item.message || item.title
    );

    if (!filteredItems.length) return null;

    return (
      <section
        id="announcements"
        className="py-8 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
      >
        <h2
          className={`text-2xl mb-6 ${accentClass}`}
          style={headingStyle}
        >
          Announcements/Urgent
        </h2>
        <div className="space-y-4">
          {filteredItems.map((item: any, idx: number) => {
            const isUrgent = item.priority === "urgent" || item.urgent;
            const message = item.text || item.message || "";
            const title = item.title || "";
            const date = item.date || item.createdAt;

            return (
              <div
                key={item.id || idx}
                className={`rounded-lg p-4 ${
                  isUrgent
                    ? "bg-red-500/20 border border-red-400/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isUrgent ? (
                    <AlertCircle size={20} className="text-red-400" />
                  ) : (
                    <Megaphone size={20} className={accentClass} />
                  )}
                  <div className="flex-1">
                    {isUrgent && (
                      <div className="flex items-center gap-2 mb-2 text-red-200">
                        <span className="text-xs font-bold uppercase">
                          Urgent
                        </span>
                      </div>
                    )}
                    {title && (
                      <div
                        className={`font-semibold mb-1 ${textClass}`}
                        style={bodyShadow}
                      >
                        {title}
                      </div>
                    )}
                    {message && (
                      <p
                        className={`text-sm opacity-90 whitespace-pre-wrap ${textClass}`}
                        style={bodyShadow}
                      >
                        {message}
                      </p>
                    )}
                    {date && (
                      <p className={`text-xs opacity-50 mt-2 ${textClass}`}>
                        {new Date(date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Info line for header
  const infoLine = (
    <div
      className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-base font-medium opacity-90 ${textClass}`}
      style={bodyShadow}
    >
      {date && <span>{formatDate(date)}</span>}
      {date && time && (
        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
      )}
      {time && <span>{formatTime(time)}</span>}
      {headerLocation && (
        <>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
          <span className="md:truncate">{headerLocation}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#f0f2f5] flex justify-center py-4 md:py-8">
      <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px]">
        <div
          className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${theme?.bg || ""} ${textClass} transition-all duration-500 relative z-0`}
          style={paletteBackgroundStyle || theme?.backgroundStyle}
        >
          <div className="relative z-10">
            {/* Header */}
            <div
              className={`relative p-6 md:p-8 border-b border-white/10 ${textClass}`}
            >
              {/* Actions - White background bar with Edit/Delete/Share/Email */}
              {!isLocked && !isReadOnly && (
                <div className="absolute top-3 right-3 z-40">
                  <div className="flex items-center gap-1 text-sm font-medium bg-white/95 backdrop-blur rounded-lg px-2 py-1.5 shadow-lg border border-white/20">
                    {isOwner && (
                      <>
                        <Link
                          href={resolveEditHref(eventId, eventData, eventTitle)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-800/80 hover:text-neutral-900 hover:bg-black/5 transition-colors"
                          title="Edit event"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                        <EventDeleteModal
                          eventId={eventId}
                          eventTitle={eventTitle}
                        />
                      </>
                    )}
                    <EventActions
                      shareUrl={shareUrl}
                      event={eventData}
                      historyId={eventId}
                      className=""
                      variant="compact"
                      tone="default"
                    />
                  </div>
                </div>
              )}
              <div className="pr-32">
                <h1
                  className={`${headingSizeClass} mb-2 leading-tight ${textClass}`}
                  style={headingStyle}
                >
                  {eventTitle}
                </h1>
                {infoLine}
                {/* Address line (if different from header location) */}
                {address && (
                  <div
                    className={`mt-2 text-sm opacity-80 flex items-center gap-2 ${textClass}`}
                    style={bodyShadow}
                  >
                    <MapPin size={14} />
                    <span>{address}</span>
                  </div>
                )}
                {navItems.length > 1 && !isLocked && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {navItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(item.id);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth" });
                              window.history.replaceState(
                                null,
                                "",
                                `#${item.id}`
                              );
                              setActiveSection(item.id);
                            }
                          }}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition border ${
                            isActive
                              ? "bg-white/80 text-[#1b1540] border-white/90 shadow"
                              : "bg-white/10 text-inherit border-white/20 hover:bg-white/20"
                          }`}
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                )}
                {renderHeaderWidget()}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-64 md:h-96">
              {heroImage ? (
                heroImage.startsWith("http") ? (
                  <Image
                    src={heroImage}
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                ) : (
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>

            {/* Details Section */}
            <section
              id="details"
              className="py-10 border-t border-white/10 px-6 md:px-10 scroll-mt-24"
            >
              <h2
                className={`text-2xl mb-3 ${accentClass}`}
                style={headingStyle}
              >
                Details
              </h2>
              {description ? (
                <p
                  className={`text-base leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`}
                  style={bodyShadow}
                >
                  {description}
                </p>
              ) : (
                <p
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  No description provided.
                </p>
              )}

              {/* Custom Fields Grid */}
              {detailFields.length > 0 && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailFields.map((field: any) => {
                    const val =
                      customFields[field.key] ??
                      currentData?.extra?.[field.key];
                    if (!val) return null;
                    return (
                      <div
                        key={field.key}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div
                          className={`text-xs uppercase tracking-wide opacity-80 ${textClass}`}
                          style={bodyShadow}
                        >
                          {field.label}
                        </div>
                        <div
                          className={`mt-2 text-base font-semibold opacity-90 ${textClass}`}
                          style={bodyShadow}
                        >
                          {val}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Advanced Sections */}
            {renderEventsSection()}
            {renderLineupSection()}
            {renderRosterSection()}
            {renderMeetSection()}
            {renderPracticeSection()}
            {renderLogisticsSection()}
            {renderGearSection()}
            {renderSnacksSection()}
            {renderVolunteersSection()}
            {renderAnnouncementsSection()}

            {/* RSVP Section */}
            {rsvpEnabled && (
              <section
                id="rsvp"
                className="max-w-2xl mx-auto text-center p-6 md:p-10 scroll-mt-24"
              >
                <h2
                  className={`text-2xl mb-6 ${accentClass}`}
                  style={headingStyle}
                >
                  {rsvpCopy.editorTitle || "RSVP"}
                </h2>
                <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
                  {!rsvpSubmitted ? (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <p className="opacity-80">
                          {rsvpDeadline
                            ? `Kindly respond by ${new Date(
                                rsvpDeadline
                              ).toLocaleDateString()}`
                            : "Please RSVP"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                          Full Name
                        </label>
                        <input
                          className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                          placeholder="Guest Name"
                          value={rsvpNameInput}
                          onChange={(e) => setRsvpNameInput(e.target.value)}
                        />
                      </div>
                      {hasRoster && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                            Select Athlete (updates roster)
                          </label>
                        <select
                          className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                          value={selectedAthleteId}
                          onChange={(e) =>
                            setSelectedAthleteId(
                              e.target.value === "__other"
                                ? ""
                                : e.target.value
                            )
                          }
                        >
                          <option value="">Choose athlete</option>
                            {rosterAthletes.map((athlete) => {
                              const labelParts = [
                                athlete.name,
                                athlete.jerseyNumber
                                  ? `#${athlete.jerseyNumber}`
                                  : null,
                                athlete.position ||
                                  athlete.primaryEvents?.[0] ||
                                  null,
                                athlete.level,
                              ].filter(Boolean);
                              return (
                                <option key={athlete.id} value={athlete.id}>
                                  {labelParts.join(" • ")}
                                </option>
                              );
                            })}
                          <option value="__other">Not listed / other</option>
                        </select>
                      </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                          Attending?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="group relative cursor-pointer">
                            <input
                              type="radio"
                              name="attending"
                              className="peer sr-only"
                              checked={rsvpAttending === "yes"}
                              onChange={() => setRsvpAttending("yes")}
                            />
                            <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                              <div className="mt-0.5">
                                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="font-semibold">
                                  Joyfully Accept
                                </div>
                                <p className="text-sm opacity-70">
                                  I'll be there.
                                </p>
                              </div>
                            </div>
                          </label>
                          <label className="group relative cursor-pointer">
                            <input
                              type="radio"
                              name="attending"
                              className="peer sr-only"
                              checked={rsvpAttending === "no"}
                              onChange={() => setRsvpAttending("no")}
                            />
                            <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                              <div className="mt-0.5">
                                <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="font-semibold">
                                  Regretfully Decline
                                </div>
                                <p className="text-sm opacity-70">
                                  Sending warm wishes.
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                      {showRsvpSignInRequired && !isSignedIn && (
                        <div className="text-sm text-center text-red-100 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          Sign in to confirm attendance and view roster details.
                        </div>
                      )}
                      {rsvpError && (
                        <div className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          {rsvpError}
                        </div>
                      )}
                      <button
                        onClick={handleRsvpSubmit}
                        disabled={rsvpSubmitting}
                        className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {rsvpSubmitting ? "Submitting..." : "Send RSVP"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎉</div>
                      <h3 className="text-2xl font-serif mb-2">Thank you!</h3>
                      <p className="opacity-70">Your RSVP has been sent.</p>
                      <button
                        onClick={() => {
                          setRsvpSubmitted(false);
                          setRsvpAttending("yes");
                        }}
                        className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                      >
                        Send another response
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Calendar buttons */}
            <section className="py-6 px-6 md:px-10 border-t border-white/10">
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Share2 size={16} />
                  Share
                </button>
                <button
                  onClick={handleGoogleCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Image
                    src="/brands/google-white.svg"
                    alt="Google"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Google Calendar
                </button>
                <button
                  onClick={handleAppleCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Image
                    src="/brands/apple-white.svg"
                    alt="Apple"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Apple Calendar
                </button>
                <button
                  onClick={handleOutlookCalendar}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Image
                    src="/brands/microsoft-white.svg"
                    alt="Microsoft"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  Outlook
                </button>
              </div>
            </section>

            {/* Footer */}
            <footer
              className={`text-center py-8 border-t border-white/10 mt-1 ${textClass}`}
            >
              <a
                href="https://envitefy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="space-y-1 inline-block no-underline"
              >
                <p className="text-sm opacity-60" style={bodyShadow}>
                  Powered By Envitefy. Create. Share. Enjoy.
                </p>
                <p className="text-xs opacity-50" style={bodyShadow}>
                  Create yours now.
                </p>
              </a>
              <div className="flex items-center justify-center gap-4 mt-4">
                <a
                  href="https://www.facebook.com/envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Facebook"
                >
                  <Image
                    src="/email/social-facebook.svg"
                    alt="Facebook"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.instagram.com/envitefy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Instagram"
                >
                  <Image
                    src="/email/social-instagram.svg"
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.tiktok.com/@envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="TikTok"
                >
                  <Image
                    src="/email/social-tiktok.svg"
                    alt="TikTok"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a
                  href="https://www.youtube.com/@Envitefy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="YouTube"
                >
                  <Image
                    src="/email/social-youtube.svg"
                    alt="YouTube"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* Volunteer Signup Modal */}
      {volunteerSignupModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() =>
                setVolunteerSignupModal({
                  open: false,
                  slotId: null,
                  slotRole: null,
                })
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Sign Up for {volunteerSignupModal.slotRole}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Fill out the form below to volunteer for this position.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerSignupForm.name}
                  onChange={(e) =>
                    setVolunteerSignupForm({
                      ...volunteerSignupForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={volunteerSignupForm.email}
                  onChange={(e) =>
                    setVolunteerSignupForm({
                      ...volunteerSignupForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={volunteerSignupForm.phone}
                  onChange={(e) =>
                    setVolunteerSignupForm({
                      ...volunteerSignupForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    setVolunteerSignupModal({
                      open: false,
                      slotId: null,
                      slotRole: null,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVolunteerSignup}
                  disabled={
                    volunteerSubmitting || !volunteerSignupForm.name.trim()
                  }
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {volunteerSubmitting ? "Signing Up..." : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Carpool Modal */}
      {carpoolAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCarpoolAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Add Carpool Offer
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Share your carpool details so others can join you.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Driver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={carpoolForm.driverName}
                  onChange={(e) =>
                    setCarpoolForm({
                      ...carpoolForm,
                      driverName: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={carpoolForm.phone}
                    onChange={(e) =>
                      setCarpoolForm({ ...carpoolForm, phone: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={carpoolForm.email}
                    onChange={(e) =>
                      setCarpoolForm({ ...carpoolForm, email: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Seats Available <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={carpoolForm.seatsAvailable}
                  onChange={(e) =>
                    setCarpoolForm({
                      ...carpoolForm,
                      seatsAvailable: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Departure Location
                </label>
                <input
                  type="text"
                  value={carpoolForm.departureLocation}
                  onChange={(e) =>
                    setCarpoolForm({
                      ...carpoolForm,
                      departureLocation: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g., NIU Recreation Center parking lot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Departure Time
                </label>
                <input
                  type="time"
                  value={carpoolForm.departureTime}
                  onChange={(e) =>
                    setCarpoolForm({
                      ...carpoolForm,
                      departureTime: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Direction (optional)
                </label>
                <input
                  type="text"
                  value={carpoolForm.direction}
                  onChange={(e) =>
                    setCarpoolForm({
                      ...carpoolForm,
                      direction: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g., To/From venue"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCarpoolAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCarpool}
                  disabled={
                    carpoolSubmitting ||
                    !carpoolForm.driverName.trim() ||
                    !carpoolForm.seatsAvailable
                  }
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {carpoolSubmitting ? "Adding..." : "Add Offer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Carpool Driver Modal */}
      {carpoolContactModal.open && carpoolContactModal.carpool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() =>
                setCarpoolContactModal({ open: false, carpool: null })
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Contact{" "}
              {carpoolContactModal.carpool.driverName ||
                carpoolContactModal.carpool.driver}
            </h3>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                {carpoolContactModal.carpool.phone && (
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Phone:
                    </span>
                    <a
                      href={`tel:${carpoolContactModal.carpool.phone}`}
                      className="block text-indigo-600 hover:text-indigo-700 mt-1"
                    >
                      {carpoolContactModal.carpool.phone}
                    </a>
                  </div>
                )}
                {carpoolContactModal.carpool.email && (
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Email:
                    </span>
                    <a
                      href={`mailto:${carpoolContactModal.carpool.email}`}
                      className="block text-indigo-600 hover:text-indigo-700 mt-1"
                    >
                      {carpoolContactModal.carpool.email}
                    </a>
                  </div>
                )}
                {!carpoolContactModal.carpool.phone &&
                  !carpoolContactModal.carpool.email && (
                    <p className="text-sm text-slate-600">
                      No contact information available. Please contact the event
                      organizer.
                    </p>
                  )}
              </div>
              <div className="flex gap-3">
                {carpoolContactModal.carpool.phone && (
                  <a
                    href={`tel:${carpoolContactModal.carpool.phone}`}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Phone size={16} /> Call
                  </a>
                )}
                {carpoolContactModal.carpool.email && (
                  <a
                    href={`mailto:${carpoolContactModal.carpool.email}`}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <Mail size={16} /> Email
                  </a>
                )}
                <button
                  onClick={() =>
                    setCarpoolContactModal({ open: false, carpool: null })
                  }
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carpool Signup Modal */}
      {carpoolSignupModal.open && carpoolSignupModal.carpool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() =>
                setCarpoolSignupModal({ open: false, carpool: null })
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              Sign Up for Carpool
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Driver:{" "}
              {carpoolSignupModal.carpool.driverName ||
                carpoolSignupModal.carpool.driver}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={carpoolSignupForm.passengerName}
                  onChange={(e) =>
                    setCarpoolSignupForm({
                      ...carpoolSignupForm,
                      passengerName: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Number of Seats <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={(() => {
                    const seatsAvailable =
                      carpoolSignupModal.carpool.seatsAvailable ||
                      carpoolSignupModal.carpool.seats ||
                      0;
                    const seatsTaken =
                      carpoolSignupModal.carpool.seatsTaken || 0;
                    return seatsAvailable - seatsTaken;
                  })()}
                  value={carpoolSignupForm.seatsRequested}
                  onChange={(e) =>
                    setCarpoolSignupForm({
                      ...carpoolSignupForm,
                      seatsRequested: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="1"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  {(() => {
                    const seatsAvailable =
                      carpoolSignupModal.carpool.seatsAvailable ||
                      carpoolSignupModal.carpool.seats ||
                      0;
                    const seatsTaken =
                      carpoolSignupModal.carpool.seatsTaken || 0;
                    const remaining = seatsAvailable - seatsTaken;
                    return `${remaining} seat${
                      remaining !== 1 ? "s" : ""
                    } available`;
                  })()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={carpoolSignupForm.passengerPhone}
                    onChange={(e) =>
                      setCarpoolSignupForm({
                        ...carpoolSignupForm,
                        passengerPhone: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={carpoolSignupForm.passengerEmail}
                    onChange={(e) =>
                      setCarpoolSignupForm({
                        ...carpoolSignupForm,
                        passengerEmail: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    setCarpoolSignupModal({ open: false, carpool: null })
                  }
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCarpoolSignup}
                  disabled={
                    carpoolSignupSubmitting ||
                    !carpoolSignupForm.passengerName.trim() ||
                    !carpoolSignupForm.seatsRequested
                  }
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {carpoolSignupSubmitting ? "Signing Up..." : "Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
