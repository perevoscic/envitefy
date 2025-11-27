"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedEvent } from "@/lib/mappers";
import { getEventTheme } from "@/lib/event-theme";
import EventCategoryTemplateModal from "@/components/EventCategoryTemplateModal";
import type { EditorBindings } from "@/components/event-templates/EventTemplateBase";
import BirthdaysTemplate from "@/components/event-templates/BirthdaysTemplate";
import WeddingsTemplate from "@/components/event-templates/WeddingsTemplate";
import BabyShowersTemplate from "@/components/event-templates/BabyShowersTemplate";
import AppointmentsTemplate from "@/components/event-templates/AppointmentsTemplate";
import SportEventsTemplate from "@/components/event-templates/SportEventsTemplate";
import GeneralEventsTemplate from "@/components/event-templates/GeneralEventsTemplate";
import RegistryLinksEditor, {
  type RegistryFormEntry,
} from "@/components/RegistryLinksEditor";
import Toggle from "@/components/Toggle";
import {
  MAX_REGISTRY_LINKS,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "@/utils/registry-links";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractColorsFromImage, type ImageColors } from "@/utils/image-colors";
import { EditSquareIcon } from "@/components/icons/EditSquareIcon";
import styles from "./EventCreateWysiwyg.module.css";
import { EVENT_CATEGORIES } from "@/components/event-templates/eventCategories";
import { buildEventPath } from "@/utils/event-url";

type ConnectedCalendars = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

type Props = {
  defaultDate?: Date;
  initialCategoryKey?: string;
};

const REGISTRY_CATEGORY_KEYS = new Set([
  "birthdays",
  "weddings",
  "baby showers",
  "gender reveal",
]);

const TEMPLATE_LABELS = EVENT_CATEGORIES.reduce<Record<string, string>>(
  (acc, category) => {
    acc[category.key] = category.label;
    return acc;
  },
  {}
);

const createRegistryEntry = (): RegistryFormEntry => ({
  key: `registry-${Math.random().toString(36).slice(2, 10)}`,
  label: "",
  url: "",
  error: null,
  detectedLabel: null,
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
      const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
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

export default function EventCreateWysiwyg({
  defaultDate,
  initialCategoryKey,
}: Props) {
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
  // Background presets (mirrors signup builder look-and-feel)
  const BG_PRESETS: Array<{
    id: string;
    name: string;
    bgColor: string;
    bgCss?: string;
  }> = [
    {
      id: "trusty-blue",
      name: "Trusty Blue + Orange",
      bgColor: "#143A66",
      bgCss:
        "linear-gradient(120deg, rgba(20,58,102,0.95) 0%, rgba(17,92,150,0.85) 100%)",
    },
    {
      id: "mint-fresh",
      name: "Mint Fresh",
      bgColor: "#D1F1E0",
      bgCss:
        "linear-gradient(135deg, rgba(59,201,159,0.25), rgba(255,255,255,0.6))",
    },
    {
      id: "night-sky",
      name: "Night Sky",
      bgColor: "#334155",
      bgCss: "linear-gradient(180deg, #334155 0%, #1F2937 100%)",
    },
    {
      id: "sunset-blend",
      name: "Sunset Blend",
      bgColor: "#F97316",
      bgCss: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #DB2777 100%)",
    },
    {
      id: "ocean-wave",
      name: "Ocean Wave",
      bgColor: "#0EA5E9",
      bgCss:
        "linear-gradient(120deg, rgba(14,165,233,0.95) 0%, rgba(59,130,246,0.85) 100%)",
    },
    {
      id: "forest-mist",
      name: "Forest Mist",
      bgColor: "#166534",
      bgCss:
        "linear-gradient(135deg, rgba(22,101,52,0.95), rgba(15,118,110,0.85))",
    },
    {
      id: "royal-plum",
      name: "Royal Plum",
      bgColor: "#6D28D9",
      bgCss:
        "linear-gradient(135deg, rgba(109,40,217,0.95), rgba(147,51,234,0.85))",
    },
    {
      id: "citrus-light",
      name: "Citrus Light",
      bgColor: "#FDE68A",
      bgCss: "linear-gradient(135deg, #FDE68A 0%, #FCA5A5 100%)",
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
  ];
  const [categoryKey, setCategoryKey] = useState<string>(
    initialCategoryKey || ""
  );
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

  const [registryLinks, setRegistryLinks] = useState<RegistryFormEntry[]>([]);
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

  // Header background selection (matches signup preview behavior)
  const [headerThemeId, setHeaderThemeId] = useState<string | null>(null);
  const [headerBgColor, setHeaderBgColor] = useState<string | null>(null);
  const [headerBgCss, setHeaderBgCss] = useState<string | null>(null);

  const [connectedCalendars, setConnectedCalendars] =
    useState<ConnectedCalendars>({
      google: false,
      microsoft: false,
      apple: false,
    });
  const [selectedCalendars, setSelectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({ google: false, microsoft: false, apple: false });

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
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };
    fetchConnected();
  }, []);

  // Draft autosave removed

  // Category color assignment (keeps UI consistent with rest of app)
  const PALETTE = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
  ] as const;
  const maybeAssignCategoryColor = (cat: string) => {
    if (!cat) return;
    try {
      const raw = localStorage.getItem("categoryColors");
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      if (!map[cat]) {
        const used = new Set(Object.values(map));
        const unused = PALETTE.filter((c) => !used.has(c));
        const pick = (arr: readonly string[]) =>
          arr[Math.floor(Math.random() * arr.length)] as string;
        const chosen = (unused.length ? pick(unused) : pick(PALETTE)) as string;
        const next = { ...map, [cat]: chosen };
        localStorage.setItem("categoryColors", JSON.stringify(next));
        try {
          window.dispatchEvent(
            new CustomEvent("categoryColorsUpdated", { detail: next })
          );
        } catch {}
      }
    } catch {}
  };

  // Registry handlers
  const addRegistryLink = () => {
    setRegistryLinks((prev) => {
      if (prev.length >= MAX_REGISTRY_LINKS) return prev;
      return [...prev, createRegistryEntry()];
    });
  };
  const removeRegistryLink = (key: string) => {
    setRegistryLinks((prev) => prev.filter((entry) => entry.key !== key));
  };
  const handleRegistryFieldChange = (
    key: string,
    field: "label" | "url",
    value: string
  ) => {
    const trimmed = field === "label" ? value.slice(0, 60) : value;
    setRegistryLinks((prev) =>
      prev.map((entry) => {
        if (entry.key !== key) return entry;
        const next: RegistryFormEntry = {
          ...entry,
          [field]: trimmed,
        } as any;
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
            ) {
              next.label = validation.brand.defaultLabel;
            }
          }
        }
        if (field === "label" && !trimmed.trim() && entry.detectedLabel) {
          next.label = "";
        }
        return next;
      })
    );
  };

  // Attachment handlers
  const clearFlyer = () => {
    setAttachment(null);
    setAttachmentPreviewUrl(null);
    setImageColors(null);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };
  const handleFlyerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      setImageColors(null);
      setAttachmentError(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setAttachmentError("Upload an image or PDF file");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError("File must be 10 MB or smaller");
      event.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      let previewUrl: string | null = null;
      let colors: ImageColors | null = null;
      if (isImage) {
        previewUrl = (await createThumbnailDataUrl(file, 1200, 0.85)) || null;
        try {
          colors = await extractColorsFromImage(dataUrl);
        } catch (err) {
          console.error("Failed to extract colors from image:", err);
        }
      }
      setAttachment({ name: file.name, type: file.type, dataUrl });
      setAttachmentPreviewUrl(previewUrl);
      setImageColors(colors);
    } catch {
      setAttachment(null);
      setAttachmentPreviewUrl(null);
      setImageColors(null);
      setAttachmentError("Could not process the file");
      event.target.value = "";
    }
  };
  // Separate handler for attachment-only upload (bottom flyer/invite)
  const handleAttachmentOnlyChange = handleFlyerChange;

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

  // Derived theme (preview header background like final event page)
  const categoryLabel = TEMPLATE_LABELS[categoryKey] || "";
  const eventTheme = getEventTheme(categoryLabel);
  const headerBackground = (() => {
    if (attachmentPreviewUrl)
      return {
        backgroundImage: `url(${attachmentPreviewUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties;
    if (headerBgCss)
      return { backgroundImage: headerBgCss } as React.CSSProperties;
    if (headerBgColor)
      return { backgroundColor: headerBgColor } as React.CSSProperties;
    return {
      backgroundImage: imageColors?.headerLight || eventTheme.headerLight,
    } as React.CSSProperties;
  })();

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

    const invalidRegistries = registryLinks.filter((entry) => {
      const trimmedUrl = entry.url.trim();
      if (!trimmedUrl) return false;
      return !validateRegistryUrl(trimmedUrl).ok;
    });
    if (invalidRegistries.length > 0) {
      setRegistryLinks((prev) =>
        prev.map((entry) => {
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

    // Require template selection first
    if (!categoryKey) {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
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

      const normalizedCategoryForSubmit = (categoryLabel || "").toLowerCase();
      const allowsRegistriesForSubmit = REGISTRY_CATEGORY_KEYS.has(
        normalizedCategoryForSubmit
      );
      const sanitizedRegistries = allowsRegistriesForSubmit
        ? normalizeRegistryLinks(
            registryLinks.map((entry) => ({
              label: entry.label,
              url: entry.url,
            }))
          )
        : [];

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
          category: categoryLabel || undefined,
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
          thumbnail:
            attachmentPreviewUrl && attachment?.type.startsWith("image/")
              ? attachmentPreviewUrl
              : undefined,
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

      const r = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      const id = (j as any)?.id as string | undefined;

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
          }).catch((err) => {
            console.error("Failed to add to Google Calendar:", err);
            return { ok: false };
          })
        );
      }
      if (selectedCalendars.microsoft) {
        calendarPromises.push(
          fetch("/api/events/outlook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(normalizedEvent),
          }).catch((err) => {
            console.error("Failed to add to Microsoft Calendar:", err);
            return { ok: false };
          })
        );
      }
      if (selectedCalendars.apple) {
        console.log("Apple Calendar integration not yet implemented");
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

      // autosave cleanup removed

      if (id) {
        const eventTitle =
          (typeof (j as any)?.title === "string" && (j as any).title) ||
          payload.title;
        router.push(buildEventPath(id, eventTitle, { created: true }));
      }
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

  const normalizedCategory = (categoryLabel || "").toLowerCase();
  const allowsRegistrySection = REGISTRY_CATEGORY_KEYS.has(normalizedCategory);
  const showRsvpField = true;
  // Inline category selector (no modal)
  const handleSelectTemplate = (key: string) => {
    const label = TEMPLATE_LABELS[key] || key;
    // If we're on /event/new, navigate to dedicated template route
    try {
      const slugMap: Record<string, string> = {
        birthdays: "birthdays",
        weddings: "weddings",
        baby_showers: "baby-showers",
        gender_reveal: "gender-reveal",
        appointments: "appointments",
        sport_events: "sport-events",
        special_events: "special-events",
        general: "general",
      };
      const slug = slugMap[key] || key;
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/event/new"
      ) {
        router.push(`/event/${slug}`);
        return;
      }
    } catch {}
    // Fallback: set locally
    setCategoryKey(key);
    maybeAssignCategoryColor(label);
  };

  return (
    <main className="px-5 py-10">
      {/* Autosave banner removed */}

      <form onSubmit={submit}>
        <section className="mx-auto w-full max-w-7xl space-y-5">
          {!categoryKey && (
            <>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5D4736]">
                  Event templates
                </p>
                <h1 className="text-3xl font-semibold text-[#2C1F19]">
                  Create an Event
                </h1>
                <p className="text-sm text-[#63534A]">
                  Pick a template to get the right fields and styling.
                </p>
              </div>
              <div className={styles.gallery}>
                {EVENT_CATEGORIES.map((c) => {
                  // Assign button colors and icon backgrounds based on category
                  const getCategoryStyles = (key: string) => {
                    const styleMap: Record<
                      string,
                      {
                        buttonColor: string;
                        iconBg: string;
                        borderColor: string;
                      }
                    > = {
                      birthdays: {
                        buttonColor: "#5fb1ff",
                        iconBg: "#e6f3ee",
                        borderColor: "rgba(105, 166, 159, 0.65)",
                      },
                      weddings: {
                        buttonColor: "#a855f7",
                        iconBg: "#ede8fb",
                        borderColor: "rgba(123, 104, 196, 0.55)",
                      },
                      baby_showers: {
                        buttonColor: "#ec4899",
                        iconBg: "#fde8f1",
                        borderColor: "rgba(210, 105, 140, 0.58)",
                      },
                      gender_reveal: {
                        buttonColor: "#f59e0b",
                        iconBg: "#fef3c7",
                        borderColor: "rgba(245, 158, 11, 0.5)",
                      },
                      appointments: {
                        buttonColor: "#3b82f6",
                        iconBg: "#dbeafe",
                        borderColor: "rgba(59, 130, 246, 0.5)",
                      },
                      sport_events: {
                        buttonColor: "#10b981",
                        iconBg: "#d1fae5",
                        borderColor: "rgba(16, 185, 129, 0.5)",
                      },
                      general: {
                        buttonColor: "#6366f1",
                        iconBg: "#e0e7ff",
                        borderColor: "rgba(99, 102, 241, 0.5)",
                      },
                      special_events: {
                        buttonColor: "#f97316",
                        iconBg: "#fed7aa",
                        borderColor: "rgba(249, 115, 22, 0.5)",
                      },
                    };
                    return (
                      styleMap[key] || {
                        buttonColor: "#6366f1",
                        iconBg: "#e0e7ff",
                        borderColor: "rgba(99, 102, 241, 0.5)",
                      }
                    );
                  };

                  const categoryStyles = getCategoryStyles(c.key);
                  const buttonLabel = c.hint ? "Select" : "Create";

                  return (
                    <article
                      key={c.key}
                      role="button"
                      tabIndex={0}
                      data-label={c.label}
                      onClick={() => handleSelectTemplate(c.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectTemplate(c.key);
                        }
                      }}
                      className={styles.templateCard}
                    >
                      <div className={styles.cardBody}>
                        <div className={styles.cardHeader}>
                          <span
                            className={styles.cardIcon}
                            style={{
                              backgroundColor: categoryStyles.iconBg,
                              borderColor: categoryStyles.borderColor,
                            }}
                            aria-hidden="true"
                          >
                            {c.icon}
                          </span>
                          <div className={styles.cardText}>
                            <h3 className={styles.cardTitle}>{c.label}</h3>
                            {c.hint && (
                              <span className={styles.hint}>{c.hint}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.cardButton}
                          style={{
                            backgroundColor: categoryStyles.buttonColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(c.key);
                          }}
                        >
                          {buttonLabel}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {categoryKey && (
            <section
              className="event-theme-header relative overflow-hidden rounded-2xl border shadow-lg px-3 py-6 sm:px-8 min-h-[220px] sm:min-h-[280px]"
              style={headerBackground as React.CSSProperties}
            >
              {attachmentPreviewUrl && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "inherit",
                  }}
                />
              )}
              {profilePreviewUrl && (
                <div
                  className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6"
                  style={{ zIndex: 2 }}
                >
                  <div className="relative group">
                    <img
                      src={profilePreviewUrl}
                      alt="profile"
                      className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl border border-border object-cover shadow-md"
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => profileInputRef.current?.click()}
                        className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                        aria-label="Replace profile image"
                      >
                        <EditSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={clearProfile}
                        className="p-1.5 bg-white rounded-full shadow hover:bg-red-100"
                        aria-label="Remove profile image"
                      >
                        ✖️
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className={`w-full bg-transparent focus:outline-none text-2xl sm:text-3xl font-semibold ${
                    attachmentPreviewUrl
                      ? "text-white placeholder-white/70"
                      : "text-foreground"
                  }`}
                />
                {/* Header image controls (signup preview style) */}
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => flyerInputRef.current?.click()}
                    className={`rounded-md border px-2 py-0.5 font-medium ${
                      attachmentPreviewUrl
                        ? "bg-white/80 text-foreground hover:bg-white"
                        : "bg-background text-foreground hover:bg-surface"
                    }`}
                  >
                    {attachmentPreviewUrl
                      ? "Replace header image"
                      : "Upload header image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className={`rounded-md border px-2 py-0.5 font-medium ${
                      profilePreviewUrl
                        ? "bg-white/80 text-foreground hover:bg-white"
                        : "bg-background text-foreground hover:bg-surface"
                    }`}
                  >
                    {profilePreviewUrl
                      ? "Replace profile image"
                      : "Add profile image"}
                  </button>
                  {attachmentPreviewUrl && (
                    <button
                      type="button"
                      onClick={clearFlyer}
                      className="text-foreground/80 underline decoration-dotted underline-offset-4 hover:no-underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {/* Hidden inputs for header/profile images */}
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileChange}
                className="hidden"
              />
            </section>
          )}

          {/* Background presets (choose gradient) */}
          {categoryKey && (
            <section className="rounded-xl border px-4 sm:px-5 py-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-2">
                Header background
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
          )}

          {categoryKey &&
            (() => {
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
                showRsvpField,
                rsvp,
                setRsvp,
                allowsRegistrySection,
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
              const cat = (categoryLabel || "Birthdays").toLowerCase();
              if (cat === "birthdays")
                return <BirthdaysTemplate editor={editor} />;
              if (cat === "weddings")
                return <WeddingsTemplate editor={editor} />;
              if (cat === "baby showers")
                return <BabyShowersTemplate editor={editor} />;
              if (cat === "appointments" || cat === "doctor appointments")
                return <AppointmentsTemplate editor={editor} />;
              if (cat === "sport events")
                return <SportEventsTemplate editor={editor} />;
              return <GeneralEventsTemplate editor={editor} />;
            })()}

          {categoryKey && (
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
                {submitting ? "Saving…" : "Create event"}
              </button>
            </div>
          )}
        </section>
      </form>
    </main>
  );
}
