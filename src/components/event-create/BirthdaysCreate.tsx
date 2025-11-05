"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedEvent } from "@/lib/mappers";
import { getEventTheme } from "@/lib/event-theme";
import type { EditorBindings } from "@/components/event-templates/EventTemplateBase";
import BirthdaysTemplate from "@/components/event-templates/BirthdaysTemplate";
import {
  MAX_REGISTRY_LINKS,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "@/utils/registry-links";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractColorsFromImage, type ImageColors } from "@/utils/image-colors";

type Props = {
  defaultDate?: Date;
  editEventId?: string;
};

const createRegistryEntry = () => ({
  key: `registry-${Math.random().toString(36).slice(2, 10)}`,
  label: "",
  url: "",
  error: null as string | null,
  detectedLabel: null as string | null,
});

function toLocalDateValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

function toLocalTimeValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

function formatWhenSummary(
  startIso: string | null,
  endIso: string | null,
  allDay: boolean
): { time: string | null; date: string | null } {
  if (!startIso) return { time: null, date: null };
  try {
    const start = new Date(startIso);
    const end = endIso ? new Date(endIso) : null;
    const sameDay =
      !!end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (allDay) {
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const dateLabel =
        end && !sameDay
          ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
          : dateFmt.format(start);
      return { time: null, date: `${dateLabel} (all day)` };
    }

    const dateFmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (end) {
      if (sameDay) {
        return {
          time: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
          date: dateFmt.format(start),
        };
      }
      return {
        time: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
        date: `${dateFmt.format(start)} – ${dateFmt.format(end)}`,
      };
    }
    return { time: timeFmt.format(start), date: dateFmt.format(start) };
  } catch {
    return { time: null, date: null };
  }
}

export default function BirthdaysCreate({ defaultDate, editEventId }: Props) {
  const router = useRouter();

  const initialStart = useMemo(() => {
    const base = defaultDate ? new Date(defaultDate) : new Date();
    base.setSeconds(0, 0);
    const rounded = new Date(base);
    const minutes = rounded.getMinutes();
    rounded.setMinutes(minutes - (minutes % 15));
    return rounded;
  }, [defaultDate]);

  const initialEnd = useMemo(() => {
    const d = new Date(initialStart);
    d.setHours(d.getHours() + 1);
    return d;
  }, [initialStart]);

  const [title, setTitle] = useState("");
  const [whenDate, setWhenDate] = useState<string>(
    toLocalDateValue(new Date(initialStart))
  );
  const [fullDay, setFullDay] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>(
    toLocalTimeValue(initialStart)
  );
  const [endDate, setEndDate] = useState<string>(
    toLocalDateValue(new Date(initialEnd))
  );
  const [endTime, setEndTime] = useState<string>(toLocalTimeValue(initialEnd));
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState<number>(0);

  const [registryLinks, setRegistryLinks] = useState<any[]>([]);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<
    string | null
  >(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [imageColors, setImageColors] = useState<ImageColors | null>(null);
  const flyerInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  // Header profile image (small overlay)
  const [profileImage, setProfileImage] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    null
  );
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const [repeat, setRepeat] = useState<boolean>(false);
  const [repeatFrequency, setRepeatFrequency] = useState<
    "weekly" | "monthly" | "yearly"
  >("weekly");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  const [connectedCalendars, setConnectedCalendars] = useState({
    google: false,
    microsoft: false,
    apple: false,
  });
  const [selectedCalendars, setSelectedCalendars] = useState({
    google: false,
    microsoft: false,
    apple: false,
  });

  // Edit mode: load existing event data by id and prefill state
  useEffect(() => {
    if (!editEventId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/history/${editEventId}`, {
          cache: "no-store",
        });
        const row = await r.json().catch(() => null);
        if (!row || !row.data) return;
        if (cancelled) return;
        const data = row.data as any;
        setTitle(row.title || "Event");
        try {
          const startIso = (data.startISO as string) || null;
          const endIso = (data.endISO as string) || null;
          const allDayInit = Boolean(data.allDay);
          setFullDay(allDayInit);
          if (startIso) {
            const d = new Date(startIso);
            setWhenDate(toLocalDateValue(d));
            setStartTime(toLocalTimeValue(d));
          }
          if (endIso) {
            const d2 = new Date(endIso);
            setEndDate(toLocalDateValue(d2));
            setEndTime(toLocalTimeValue(d2));
          }
        } catch {}
        setVenue(typeof data.venue === "string" ? data.venue : "");
        setLocation(typeof data.location === "string" ? data.location : "");
        setDescription(
          typeof data.description === "string" ? data.description : ""
        );
        setRsvp(typeof data.rsvp === "string" ? data.rsvp : "");
        setNumberOfGuests(
          typeof data.numberOfGuests === "number" ? data.numberOfGuests : 0
        );
        // Header customizations
        setHeaderThemeId((data as any).headerThemeId || null);
        setHeaderBgColor((data as any).headerBgColor || null);
        setHeaderBgCss((data as any).headerBgCss || null);
        const ts = (data as any).titleStyle || {};
        if (ts) {
          if (typeof ts.color === "string") setTitleColor(ts.color);
          if (typeof ts.font === "string") setTitleFont(ts.font);
          if (typeof ts.weight === "string") setTitleWeight(ts.weight);
          if (typeof ts.hAlign === "string") setTitleHAlign(ts.hAlign);
          if (typeof ts.vAlign === "string") setTitleVAlign(ts.vAlign);
          if (typeof ts.size === "number") setTitleSize(ts.size);
        }
        const profile = (data as any).profileImage;
        if (
          profile &&
          typeof profile === "object" &&
          typeof profile.dataUrl === "string"
        ) {
          setProfileImage({
            name: profile.name || "profile",
            type: profile.type || "image/png",
            dataUrl: profile.dataUrl,
          });
          setProfilePreviewUrl(profile.dataUrl);
        }
        const attach = (data as any).attachment;
        if (
          attach &&
          typeof attach === "object" &&
          typeof attach.dataUrl === "string"
        ) {
          setAttachment({
            name: attach.name || "file",
            type: attach.type || "application/octet-stream",
            dataUrl: attach.dataUrl,
          });
          setAttachmentPreviewUrl(
            (typeof data.thumbnail === "string" && data.thumbnail) ||
              (attach.type?.startsWith?.("image/") ? attach.dataUrl : null)
          );
        }
        const colors = (data as any).imageColors;
        if (colors && typeof colors === "object") setImageColors(colors);
        if (Array.isArray((data as any).registries)) {
          setRegistryLinks(
            ((data as any).registries as any[]).map((link: any) => ({
              key: `registry-${Math.random().toString(36).slice(2, 10)}`,
              label: typeof link?.label === "string" ? link.label : "",
              url: typeof link?.url === "string" ? link.url : "",
              error: null,
              detectedLabel: null,
            }))
          );
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [editEventId]);

  // Autosize description
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  // Connected calendars
  useEffect(() => {
    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
        setSelectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
      } catch {}
    };
    fetchConnected();
  }, []);

  // Registry helpers
  const addRegistryLink = () =>
    setRegistryLinks((prev) =>
      prev.length >= MAX_REGISTRY_LINKS
        ? prev
        : [...prev, createRegistryEntry()]
    );
  const removeRegistryLink = (key: string) =>
    setRegistryLinks((prev) => prev.filter((e: any) => e.key !== key));
  const handleRegistryFieldChange = (
    key: string,
    field: "label" | "url",
    value: string
  ) => {
    const trimmed = field === "label" ? value.slice(0, 60) : value;
    setRegistryLinks((prev: any[]) =>
      prev.map((entry: any) => {
        if (entry.key !== key) return entry;
        const next = { ...entry, [field]: trimmed } as any;
        if (field === "url") {
          if (!trimmed.trim()) {
            next.error = null;
            next.detectedLabel = null;
          } else {
            const validation = validateRegistryUrl(trimmed);
            next.error = validation.ok ? null : validation.error || null;
            next.detectedLabel =
              validation.ok && validation.brand
                ? validation.brand.defaultLabel
                : null;
            if (
              validation.ok &&
              validation.brand &&
              (!entry.label || !entry.label.trim())
            )
              next.label = validation.brand.defaultLabel;
          }
        }
        if (field === "label" && !trimmed.trim() && entry.detectedLabel)
          next.label = "";
        return next;
      })
    );
  };

  // Header image handlers
  const clearHeader = () => {
    setAttachmentPreviewUrl(null);
    setImageColors(null);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  };
  const handleFlyerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      clearHeader();
      return;
    }
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      setAttachmentError("Upload an image file");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("File must be 5 MB or smaller");
      event.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      let previewUrl: string | null = null;
      let colors: ImageColors | null = null;
      previewUrl = (await createThumbnailDataUrl(file, 1200, 0.85)) || null;
      try {
        colors = await extractColorsFromImage(dataUrl);
      } catch {}
      setAttachmentPreviewUrl(previewUrl);
      setImageColors(colors);
    } catch {
      clearHeader();
      event.target.value = "";
    }
  };
  // Flyer/invite clear (separate from header)
  const clearFlyer = () => {
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  // Attachment-only (flyer/invite) upload – does not affect header background/colors
  const handleAttachmentOnlyChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setAttachmentError("Upload an image or PDF file");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("File must be 5 MB or smaller");
      event.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachment({ name: file.name, type: file.type, dataUrl });
      // Do not set attachmentPreviewUrl or imageColors here to keep header independent
    } catch {
      setAttachment(null);
      event.target.value = "";
    }
  };

  // Profile image handlers
  const clearProfile = () => {
    setProfileImage(null);
    setProfilePreviewUrl(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
  };
  const handleProfileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      clearProfile();
      return;
    }
    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const previewUrl =
        (await createThumbnailDataUrl(file, 600, 0.9)) || dataUrl;
      setProfileImage({ name: file.name, type: file.type, dataUrl });
      setProfilePreviewUrl(previewUrl);
    } catch {
      clearProfile();
      event.target.value = "";
    }
  };

  // Derived theme (use Birthdays)
  const eventTheme = getEventTheme("Birthdays");
  const [headerThemeId, setHeaderThemeId] = useState<string | null>(null);
  const [headerBgColor, setHeaderBgColor] = useState<string | null>(null);
  const [headerBgCss, setHeaderBgCss] = useState<string | null>(null);
  const [titleColor, setTitleColor] = useState<string | null>(null);
  const [titleFont, setTitleFont] = useState<
    | "auto"
    | "montserrat"
    | "pacifico"
    | "geist"
    | "mono"
    | "serif"
    | "system"
    | "poppins"
    | "raleway"
    | "playfair"
    | "dancing"
  >("auto");
  const [titleWeight, setTitleWeight] = useState<
    "normal" | "semibold" | "bold"
  >("semibold");
  const [titleHAlign, setTitleHAlign] = useState<"left" | "center" | "right">(
    "center"
  );
  const [titleVAlign, setTitleVAlign] = useState<"top" | "middle" | "bottom">(
    "middle"
  );
  const [titleSize, setTitleSize] = useState<number>(28);

  const BG_PRESETS = [
    {
      id: "sunset-blend",
      name: "Sunset Blend",
      bgColor: "#F97316",
      bgCss: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #DB2777 100%)",
    },
    {
      id: "dawn-rose",
      name: "Dawn Rose",
      bgColor: "#FBCFE8",
      bgCss: "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 100%)",
    },
    {
      id: "steel-sky",
      name: "Steel Sky",
      bgColor: "#93C5FD",
      bgCss: "linear-gradient(135deg, #93C5FD 0%, #A7F3D0 100%)",
    },
    // Birthday-focused additions (boys & girls)
    {
      id: "cotton-candy",
      name: "Cotton Candy",
      bgColor: "#FDE2F3",
      bgCss: "linear-gradient(135deg, #FDE2F3 0%, #CDE7FF 100%)",
    },
    {
      id: "bubblegum-pop",
      name: "Bubblegum Pop",
      bgColor: "#F9A8D4",
      bgCss: "linear-gradient(135deg, #FF9ACB 0%, #FF80B5 45%, #FFB4D2 100%)",
    },
    {
      id: "princess-dream",
      name: "Princess Dream",
      bgColor: "#E9D5FF",
      bgCss: "linear-gradient(135deg, #F5D0FE 0%, #E9D5FF 45%, #FBCFE8 100%)",
    },
    {
      id: "royal-blues",
      name: "Royal Blues",
      bgColor: "#60A5FA",
      bgCss: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)",
    },
    {
      id: "ocean-splash",
      name: "Ocean Splash",
      bgColor: "#67E8F9",
      bgCss: "linear-gradient(135deg, #06B6D4 0%, #22D3EE 45%, #67E8F9 100%)",
    },
    {
      id: "mint-lemonade",
      name: "Mint Lemonade",
      bgColor: "#A7F3D0",
      bgCss: "linear-gradient(135deg, #86EFAC 0%, #A7F3D0 50%, #FDE68A 100%)",
    },
    {
      id: "grape-soda",
      name: "Grape Soda",
      bgColor: "#C4B5FD",
      bgCss: "linear-gradient(135deg, #9333EA 0%, #A855F7 45%, #C4B5FD 100%)",
    },
    {
      id: "rainbow-sherbet",
      name: "Rainbow Sherbet",
      bgColor: "#FED7AA",
      bgCss:
        "linear-gradient(135deg, #FDBA74 0%, #FB7185 40%, #F472B6 70%, #FDE68A 100%)",
    },
    {
      id: "confetti-citrus",
      name: "Confetti Citrus",
      bgColor: "#FDE68A",
      bgCss: "linear-gradient(135deg, #FACC15 0%, #34D399 50%, #60A5FA 100%)",
    },
    {
      id: "jungle-lime",
      name: "Jungle Lime",
      bgColor: "#86EFAC",
      bgCss: "linear-gradient(135deg, #10B981 0%, #22C55E 50%, #A3E635 100%)",
    },
    {
      id: "berry-blast",
      name: "Berry Blast",
      bgColor: "#FDA4AF",
      bgCss: "linear-gradient(135deg, #EF4444 0%, #EC4899 50%, #FDA4AF 100%)",
    },
    {
      id: "neon-sunset",
      name: "Neon Sunset",
      bgColor: "#FCA5A5",
      bgCss: "linear-gradient(135deg, #F97316 0%, #FB7185 50%, #A78BFA 100%)",
    },
  ];

  const headerBackground = (() => {
    // Show uploaded header image when present
    if (attachmentPreviewUrl)
      return {
        backgroundImage: `url(${attachmentPreviewUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties;
    // Otherwise use selected gradient/color or category default
    if (headerBgCss)
      return { backgroundImage: headerBgCss } as React.CSSProperties;
    if (headerBgColor)
      return { backgroundColor: headerBgColor } as React.CSSProperties;
    return { backgroundImage: eventTheme.headerLight } as React.CSSProperties;
  })();

  // Page-level event theme variables so the whole page adopts the selected header background
  const themeStyleVars = useMemo(() => {
    if (imageColors) {
      return {
        "--event-header-gradient-light": imageColors.headerLight,
        "--event-header-gradient-dark": imageColors.headerDark,
        "--event-card-bg-light": imageColors.cardLight,
        "--event-card-bg-dark": imageColors.cardDark,
        "--event-border-light": imageColors.borderLight,
        "--event-border-dark": imageColors.borderDark,
        "--event-chip-light": imageColors.chipLight,
        "--event-chip-dark": imageColors.chipDark,
        "--event-text-light": imageColors.textLight,
        "--event-text-dark": imageColors.textDark,
      } as React.CSSProperties;
    }
    if (headerBgCss || headerBgColor) {
      const bg = (headerBgCss || headerBgColor) as string;
      return {
        "--event-header-gradient-light": bg,
        "--event-header-gradient-dark": bg,
        "--event-card-bg-light": eventTheme.cardLight,
        "--event-card-bg-dark": eventTheme.cardDark,
        "--event-border-light": eventTheme.borderLight,
        "--event-border-dark": eventTheme.borderDark,
        "--event-chip-light": eventTheme.chipLight,
        "--event-chip-dark": eventTheme.chipDark,
        "--event-text-light": eventTheme.textLight,
        "--event-text-dark": eventTheme.textDark,
      } as React.CSSProperties;
    }
    return {
      "--event-header-gradient-light": eventTheme.headerLight,
      "--event-header-gradient-dark": eventTheme.headerDark,
      "--event-card-bg-light": eventTheme.cardLight,
      "--event-card-bg-dark": eventTheme.cardDark,
      "--event-border-light": eventTheme.borderLight,
      "--event-border-dark": eventTheme.borderDark,
      "--event-chip-light": eventTheme.chipLight,
      "--event-chip-dark": eventTheme.chipDark,
      "--event-text-light": eventTheme.textLight,
      "--event-text-dark": eventTheme.textDark,
    } as React.CSSProperties;
  }, [imageColors, headerBgCss, headerBgColor, eventTheme]);

  // Also drive the app-wide background (behind the cards) by overriding the
  // global theme hero gradient while this editor is mounted
  const prevHeroRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (!root) return;
      if (prevHeroRef.current === null) {
        prevHeroRef.current = root.style.getPropertyValue(
          "--theme-hero-gradient"
        );
      }
      // Reflect the chosen header background across the page:
      // 1) explicit gradient preset (headerBgCss) or solid color
      // 2) else image-derived colors when a flyer is present
      // 3) else category theme default
      const chosen =
        (headerBgCss as string | null) ||
        (headerBgColor
          ? `linear-gradient(0deg, ${headerBgColor}, ${headerBgColor})`
          : (imageColors?.headerLight as string | null) ||
            (eventTheme.headerLight as string));
      root.style.setProperty("--theme-hero-gradient", chosen);
      return () => {
        if (prevHeroRef.current !== null) {
          root.style.setProperty("--theme-hero-gradient", prevHeroRef.current);
        }
      };
    } catch {}
  }, [headerBgCss, headerBgColor, imageColors, eventTheme]);

  // Repeat helpers
  useEffect(() => {
    try {
      if (
        repeat &&
        repeatFrequency === "weekly" &&
        repeatDays.length === 0 &&
        whenDate
      ) {
        const d = new Date(`${whenDate}T00:00:00`);
        const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
        setRepeatDays([codes[d.getDay()]]);
      }
      if (repeatFrequency !== "weekly") setRepeatDays([]);
    } catch {}
  }, [repeat, repeatFrequency, whenDate]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const invalidRegistries = registryLinks.filter((entry: any) => {
      const trimmedUrl = entry.url.trim();
      if (!trimmedUrl) return false;
      return !validateRegistryUrl(trimmedUrl).ok;
    });
    if (invalidRegistries.length > 0) {
      setRegistryLinks((prev: any[]) =>
        prev.map((entry: any) => {
          const trimmedUrl = entry.url.trim();
          if (!trimmedUrl) return { ...entry, error: null };
          const validation = validateRegistryUrl(trimmedUrl);
          return {
            ...entry,
            error: validation.ok
              ? null
              : validation.error || "Enter a valid https:// link",
            detectedLabel:
              validation.ok && validation.brand
                ? validation.brand.defaultLabel
                : entry.detectedLabel,
          };
        })
      );
      alert("Fix the highlighted registry links before saving.");
      return;
    }

    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (whenDate) {
        if (fullDay) {
          const start = new Date(`${whenDate}T00:00:00`);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          if (start < todayStart)
            throw new Error("Start date cannot be in the past");
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          startISO = start.toISOString();
          endISO = end.toISOString();
        } else {
          const start = new Date(`${whenDate}T${startTime || "09:00"}:00`);
          const endBase = endDate || whenDate;
          const end = new Date(`${endBase}T${endTime || "10:00"}:00`);
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          if (start < todayStart)
            throw new Error("Start date cannot be in the past");
          if (end < start) {
            endISO = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
            startISO = start.toISOString();
          } else {
            startISO = start.toISOString();
            endISO = end.toISOString();
          }
        }
      }

      const sanitizedRegistries = normalizeRegistryLinks(
        registryLinks.map((entry: any) => ({
          label: entry.label,
          url: entry.url,
        }))
      );

      const deriveWeeklyDays = (): string[] => {
        if (repeatDays.length) return repeatDays;
        if (!whenDate) return [];
        try {
          const d = new Date(`${whenDate}T00:00:00`);
          const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
          return [codes[d.getDay()]];
        } catch {
          return [];
        }
      };
      const recurrenceSourceIso = startISO
        ? startISO
        : whenDate
        ? new Date(`${whenDate}T00:00:00`).toISOString()
        : null;
      let recurrenceRule: string | null = null;
      if (repeat) {
        if (repeatFrequency === "weekly") {
          const days = deriveWeeklyDays();
          recurrenceRule = days.length
            ? `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`
            : "RRULE:FREQ=WEEKLY";
        } else if (repeatFrequency === "monthly") {
          if (recurrenceSourceIso) {
            const d = new Date(recurrenceSourceIso);
            const day = d.getUTCDate();
            if (!Number.isNaN(day))
              recurrenceRule = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`;
          }
        } else if (repeatFrequency === "yearly") {
          if (recurrenceSourceIso) {
            const d = new Date(recurrenceSourceIso);
            const month = d.getUTCMonth() + 1;
            const day = d.getUTCDate();
            if (!Number.isNaN(month) && !Number.isNaN(day))
              recurrenceRule = `RRULE:FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${day}`;
          }
        }
      }

      const payload: any = {
        title: title || "Event",
        data: {
          category: "Birthdays",
          createdVia: "manual",
          createdManually: true,
          startISO,
          endISO,
          venue: venue || undefined,
          location: location || undefined,
          description: description || undefined,
          rsvp: (rsvp || "").trim() || undefined,
          numberOfGuests: numberOfGuests || 0,
          allDay: fullDay || undefined,
          repeat: repeat || undefined,
          repeatFrequency: repeat ? repeatFrequency : undefined,
          recurrence: recurrenceRule || undefined,
          // Title style to mirror editor → final view
          titleStyle: {
            color: titleColor || null,
            font: titleFont,
            weight: titleWeight,
            hAlign: titleHAlign,
            vAlign: titleVAlign,
            size: titleSize,
          },
          // Persist header customization so the final Birthday template matches the editor
          headerThemeId: headerThemeId || undefined,
          headerBgColor: headerBgColor || undefined,
          headerBgCss: headerBgCss || undefined,
          profileImage: profileImage
            ? {
                name: profileImage.name,
                type: profileImage.type,
                dataUrl: profileImage.dataUrl,
              }
            : undefined,
          // Always persist the header image as thumbnail, regardless of flyer type
          thumbnail: attachmentPreviewUrl || undefined,
          attachment: attachment
            ? {
                name: attachment.name,
                type: attachment.type,
                dataUrl: attachment.dataUrl,
              }
            : undefined,
          imageColors: imageColors || undefined,
          registries:
            sanitizedRegistries.length > 0 ? sanitizedRegistries : undefined,
          signupForm: undefined,
        },
      };

      let id: string | undefined = undefined;
      let j: any = null;
      if (editEventId) {
        // Update existing event: merge data and title
        try {
          await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: payload.title }),
          });
        } catch {}
        try {
          await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ data: payload.data }),
          });
        } catch {}
        id = editEventId;
        j = { id };
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const normalizedDescription = (rsvp || "").trim()
        ? [description, (rsvp || "").trim()].filter(Boolean).join("\n\n")
        : description;
      const normalizedEvent: NormalizedEvent = {
        title: title || "Event",
        start: startISO || new Date().toISOString(),
        end: endISO || new Date().toISOString(),
        allDay: fullDay,
        timezone,
        venue: venue || undefined,
        location: location || undefined,
        description: normalizedDescription || undefined,
        recurrence: recurrenceRule,
        reminders: [{ minutes: 30 }],
        registries: sanitizedRegistries.length ? sanitizedRegistries : null,
        attachment: attachment
          ? {
              name: attachment.name,
              type: attachment.type,
              dataUrl: attachment.dataUrl,
            }
          : null,
        signupForm: null,
      };

      const calendarPromises: Promise<any>[] = [];
      if (selectedCalendars.google) {
        calendarPromises.push(
          fetch("/api/events/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(normalizedEvent),
          }).catch(() => ({ ok: false }))
        );
      }
      if (selectedCalendars.microsoft) {
        calendarPromises.push(
          fetch("/api/events/outlook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(normalizedEvent),
          }).catch(() => ({ ok: false }))
        );
      }
      if (calendarPromises.length > 0)
        await Promise.allSettled(calendarPromises);

      try {
        if (id && typeof window !== "undefined") {
          const serverData =
            (j as any)?.data && typeof (j as any)?.data === "object"
              ? (j as any).data
              : null;
          const mergedData = { ...payload.data, ...(serverData || {}) };
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id,
                title: (j as any)?.title || payload.title,
                created_at: (j as any)?.created_at || new Date().toISOString(),
                start:
                  (serverData && (serverData as any).start) ||
                  (serverData && (serverData as any).startISO) ||
                  startISO,
                category: (mergedData as any).category || null,
                data: mergedData,
              },
            })
          );
        }
      } catch {}

      if (id) router.push(`/event/${id}?created=${editEventId ? "0" : "1"}`);
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    let startISO: string | null = null;
    let endISO: string | null = null;
    if (whenDate) {
      if (fullDay) {
        const start = new Date(`${whenDate}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        startISO = start.toISOString();
        endISO = end.toISOString();
      } else {
        const start = new Date(`${whenDate}T${startTime || "09:00"}:00`);
        const endBase = endDate || whenDate;
        const end = new Date(`${endBase}T${endTime || "10:00"}:00`);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }
    }
    return formatWhenSummary(startISO, endISO, fullDay);
  }, [whenDate, fullDay, startTime, endDate, endTime]);

  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-10 py-10">
      <div
        className="event-theme-scope"
        style={themeStyleVars as React.CSSProperties}
      >
        <form onSubmit={submit} className="space-y-6">
          <section
            className="event-theme-header relative overflow-visible rounded-2xl border shadow-lg px-1 py-6 sm:px-2 min-h-[220px] sm:min-h-[280px]"
            style={headerBackground as React.CSSProperties}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest(
                  "button, input, textarea, select, a, [data-stop-upload]"
                )
              )
                return;
              flyerInputRef.current?.click();
            }}
          >
            {attachmentPreviewUrl && (
              <div className="absolute inset-0 rounded-2xl group pointer-events-none z-0">
                {/* Persistent dark filter over the header image for readability */}
                <div className="absolute inset-0 rounded-2xl bg-black/30" />
                <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      flyerInputRef.current?.click();
                    }}
                    className="p-2 bg-white/90 rounded-full shadow hover:bg-white"
                    aria-label="Replace header image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M12 16V4" />
                      <path d="M8 8l4-4 4 4" />
                      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearHeader();
                      try {
                        if (flyerInputRef.current)
                          flyerInputRef.current.value = "";
                      } catch {}
                    }}
                    className="p-2 bg-white/90 rounded-full shadow hover:bg-red-100"
                    aria-label="Remove header image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M9 10v8M15 10v8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {!attachmentPreviewUrl && (
              <div className="absolute top-3 right-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    flyerInputRef.current?.click();
                  }}
                  className="p-2 bg-white/90 rounded-full shadow hover:bg-white"
                  aria-label="Upload header image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M12 16V4" />
                    <path d="M8 8l4-4 4 4" />
                    <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                  </svg>
                </button>
              </div>
            )}

            <div
              className="absolute left-4 bottom-[-12px] sm:left-6 sm:bottom-[-16px] z-40"
              style={{ zIndex: 40 }}
            >
              <div
                className="relative group cursor-pointer"
                data-stop-upload
                onClick={(e) => {
                  e.stopPropagation();
                  profileInputRef.current?.click();
                }}
                aria-label={
                  profilePreviewUrl
                    ? "Replace profile image"
                    : "Add profile image"
                }
              >
                {profilePreviewUrl ? (
                  <img
                    src={profilePreviewUrl}
                    alt="profile"
                    className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl border-2 border-border object-cover shadow-md"
                    data-stop-upload
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-xl border-2 border-dashed border-border/80 bg-white/40 backdrop-blur-sm flex items-center justify-center shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 text-foreground/80"
                    >
                      <path d="M12 16V4" />
                      <path d="M8 8l4-4 4 4" />
                      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                    </svg>
                  </div>
                )}
                {profilePreviewUrl && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors opacity-0 group-hover:opacity-100" />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          profileInputRef.current?.click();
                        }}
                        className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                        data-stop-upload
                        aria-label="Replace profile image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M12 16V4" />
                          <path d="M8 8l4-4 4 4" />
                          <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setProfileImage(null);
                          setProfilePreviewUrl(null);
                          try {
                            if (profileInputRef.current)
                              profileInputRef.current.value = "";
                          } catch {}
                        }}
                        className="p-1.5 bg-white rounded-full shadow hover:bg-red-100"
                        data-stop-upload
                        aria-label="Remove profile image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M9 10v8M15 10v8" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className={`absolute inset-0 z-30 flex h-full w-full px-1 sm:px-2 pointer-events-none ${
                titleVAlign === "top"
                  ? "items-start"
                  : titleVAlign === "middle"
                  ? "items-center"
                  : "items-end"
              } ${
                titleHAlign === "left"
                  ? "justify-start"
                  : titleHAlign === "center"
                  ? "justify-center"
                  : "justify-end"
              }`}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Type event title here"
                className={`title-color-inherit w-auto max-w-[90%] bg-transparent focus:outline-none text-2xl sm:text-3xl pointer-events-auto ${
                  titleWeight === "bold"
                    ? "font-bold"
                    : titleWeight === "semibold"
                    ? "font-semibold"
                    : "font-normal"
                } ${
                  titleHAlign === "center"
                    ? "text-center"
                    : titleHAlign === "right"
                    ? "text-right"
                    : "text-left"
                } ${
                  titleColor
                    ? ""
                    : attachmentPreviewUrl
                    ? "text-white placeholder-white/70"
                    : "text-foreground"
                }`}
                data-stop-upload
                style={{
                  color: titleColor || undefined,
                  fontFamily:
                    titleFont === "pacifico"
                      ? "var(--font-pacifico)"
                      : titleFont === "montserrat"
                      ? "var(--font-montserrat)"
                      : titleFont === "geist"
                      ? "var(--font-geist-sans)"
                      : titleFont === "mono"
                      ? "var(--font-geist-mono)"
                      : titleFont === "poppins"
                      ? "var(--font-poppins)"
                      : titleFont === "raleway"
                      ? "var(--font-raleway)"
                      : titleFont === "playfair"
                      ? "var(--font-playfair)"
                      : titleFont === "dancing"
                      ? "var(--font-dancing)"
                      : titleFont === "serif"
                      ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                      : titleFont === "system"
                      ? 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"'
                      : undefined,
                  fontSize: titleSize ? `${titleSize}px` : undefined,
                  transform:
                    titleVAlign === "middle" ? "translateY(-24px)" : undefined,
                }}
              />
            </div>

            {/* Hidden inputs for header/profile images */}
            <input
              ref={flyerInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFlyerChange}
              className="hidden"
            />
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileChange}
              className="hidden"
            />
          </section>

          {/* Title style (styled row) */}
          <section className="rounded-xl">
            <div className="w-full rounded-2xl border border-[#C9B8A4] bg-[#FFF9F6]/60 p-4 space-y-3">
              <label className="font-semibold text-[#3A2C1E] text-base sm:text-lg block">
                Title style:
              </label>

              <div className="flex flex-nowrap items-center gap-3 sm:gap-4 overflow-x-auto">
                {/* Color Picker */}
                <input
                  type="color"
                  value={titleColor || "#333333"}
                  onChange={(e) => setTitleColor(e.target.value)}
                  className="w-10 h-10 rounded-md border border-[#E4CDB9] cursor-pointer bg-transparent"
                  aria-label="Title color"
                />

                {/* Font Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7A6A5A]">Font</span>
                  <select
                    value={titleFont}
                    onChange={(e) => setTitleFont(e.target.value as any)}
                    className="rounded-lg border border-[#E4CDB9] bg-[#FFF9F6] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="auto">Default</option>
                    <option value="montserrat">Montserrat</option>
                    <option value="pacifico">Pacifico</option>
                    <option value="geist">Geist</option>
                    <option value="mono">Mono</option>
                    <option value="serif">Serif</option>
                    <option value="system">System</option>
                    <option value="poppins">Poppins</option>
                    <option value="raleway">Raleway</option>
                    <option value="playfair">Playfair</option>
                    <option value="dancing">Dancing Script</option>
                  </select>
                </div>

                {/* Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7A6A5A]">Size</span>
                  <select
                    value={String(titleSize)}
                    onChange={(e) =>
                      setTitleSize(parseInt(e.target.value || "28", 10))
                    }
                    className="rounded-lg border border-[#E4CDB9] bg-[#FFF9F6] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="20">20 px</option>
                    <option value="24">24 px</option>
                    <option value="28">28 px</option>
                    <option value="32">32 px</option>
                    <option value="36">36 px</option>
                    <option value="40">40 px</option>
                    <option value="44">44 px</option>
                    <option value="48">48 px</option>
                    <option value="52">52 px</option>
                    <option value="56">56 px</option>
                    <option value="60">60 px</option>
                    <option value="64">64 px</option>
                    <option value="68">68 px</option>
                    <option value="72">72 px</option>
                  </select>
                </div>

                {/* Alignment Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7A6A5A]">Align</span>
                  <select
                    value={titleHAlign}
                    onChange={(e) => setTitleHAlign(e.target.value as any)}
                    className="rounded-lg border border-[#E4CDB9] bg-[#FFF9F6] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                  <select
                    value={titleVAlign}
                    onChange={(e) => setTitleVAlign(e.target.value as any)}
                    className="rounded-lg border border-[#E4CDB9] bg-[#FFF9F6] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Background presets (choose gradient) */}
          <section className="rounded-xl border px-4 sm:px-5 py-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-2">
              Background color
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {BG_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setHeaderThemeId(p.id);
                    setHeaderBgColor(p.bgColor || null);
                    setHeaderBgCss(p.bgCss || null);
                  }}
                  className={`relative w-full rounded-lg border ${
                    headerThemeId === p.id
                      ? "border-foreground"
                      : "border-border"
                  }`}
                  title={p.name}
                >
                  <div
                    className="h-12 rounded-t-lg"
                    style={{
                      backgroundColor: p.bgColor,
                      backgroundImage: p.bgCss,
                    }}
                  />
                  <div className="px-2 py-1 text-left">
                    <div className="text-[11px] font-semibold truncate">
                      {p.name}
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setHeaderThemeId(null);
                  setHeaderBgColor(null);
                  setHeaderBgCss(null);
                }}
                className={`relative w-full rounded-lg border ${
                  !headerThemeId ? "border-foreground" : "border-border"
                }`}
                title="Default"
              >
                <div className="h-12 rounded-t-lg bg-surface" />
                <div className="px-2 py-1 text-left">
                  <div className="text-[11px] font-semibold truncate">
                    Default
                  </div>
                </div>
              </button>
            </div>
          </section>

          {(() => {
            const editor: EditorBindings = {
              summary,
              whenDate,
              setWhenDate,
              fullDay,
              setFullDay,
              startTime,
              setStartTime,
              endDate,
              setEndDate,
              endTime,
              setEndTime,
              venue,
              setVenue,
              location,
              setLocation,
              numberOfGuests,
              setNumberOfGuests,
              description,
              setDescription,
              descriptionRef,
              showRsvpField: true,
              rsvp,
              setRsvp,
              allowsRegistrySection: true,
              registryLinks,
              addRegistryLink,
              removeRegistryLink,
              handleRegistryFieldChange,
              MAX_REGISTRY_LINKS,
              attachment,
              attachmentPreviewUrl,
              attachmentError,
              flyerInputRef,
              handleFlyerChange,
              clearFlyer,
              attachmentInputRef,
              handleAttachmentOnlyChange,
              repeat,
              setRepeat,
              repeatFrequency,
              setRepeatFrequency,
              repeatDays,
              setRepeatDays,
              connectedCalendars,
              selectedCalendars,
              setSelectedCalendars,
              cardBackgroundImage: (imageColors?.cardLight ||
                eventTheme.cardLight) as string | undefined,
            };
            return <BirthdaysTemplate editor={editor} />;
          })()}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-foreground border border-border rounded-md bg-surface hover:bg-surface/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Saving…"
                : editEventId
                ? "Save changes"
                : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
