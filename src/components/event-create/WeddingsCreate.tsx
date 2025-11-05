"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedEvent } from "@/lib/mappers";
import { getEventTheme } from "@/lib/event-theme";
import type { EditorBindings } from "@/components/event-templates/EventTemplateBase";
import WeddingsTemplate from "@/components/event-templates/WeddingsTemplate";
import {
  MAX_REGISTRY_LINKS,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "@/utils/registry-links";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractColorsFromImage, type ImageColors } from "@/utils/image-colors";

type Props = { defaultDate?: Date };

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
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function formatWhenSummary(
  startIso: string | null,
  endIso: string | null,
  allDay: boolean
) {
  if (!startIso) return { time: null, date: null } as const;
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
      return { time: null, date: `${dateLabel} (all day)` } as const;
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
      if (sameDay)
        return {
          time: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
          date: dateFmt.format(start),
        } as const;
      return {
        time: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
        date: `${dateFmt.format(start)} – ${dateFmt.format(end)}`,
      } as const;
    }
    return {
      time: timeFmt.format(start),
      date: dateFmt.format(start),
    } as const;
  } catch {
    return { time: null, date: null } as const;
  }
}

export default function WeddingsCreate({ defaultDate }: Props) {
  const router = useRouter();
  const initialStart = useMemo(() => {
    const base = defaultDate ? new Date(defaultDate) : new Date();
    base.setSeconds(0, 0);
    const rounded = new Date(base);
    rounded.setMinutes(rounded.getMinutes() - (rounded.getMinutes() % 15));
    return rounded;
  }, [defaultDate]);
  const initialEnd = useMemo(() => {
    const d = new Date(initialStart);
    d.setHours(d.getHours() + 1);
    return d;
  }, [initialStart]);

  const [title, setTitle] = useState("");
  const [whenDate, setWhenDate] = useState(
    toLocalDateValue(new Date(initialStart))
  );
  const [fullDay, setFullDay] = useState(true);
  const [startTime, setStartTime] = useState(toLocalTimeValue(initialStart));
  const [endDate, setEndDate] = useState(
    toLocalDateValue(new Date(initialEnd))
  );
  const [endTime, setEndTime] = useState(toLocalTimeValue(initialEnd));
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
  const [profileImage, setProfileImage] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    null
  );
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  // Title style controls (ported from Birthdays)
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

  const [repeat, setRepeat] = useState(false);
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

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        setConnectedCalendars({
          google: !!data?.google,
          microsoft: !!data?.microsoft,
          apple: !!data?.apple,
        });
        setSelectedCalendars({
          google: !!data?.google,
          microsoft: !!data?.microsoft,
          apple: !!data?.apple,
        });
      } catch {}
    })();
  }, []);

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
        const next: any = { ...entry, [field]: trimmed };
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

  const clearFlyer = () => {
    setAttachment(null);
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
      clearFlyer();
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
        } catch {}
      }
      setAttachment({ name: file.name, type: file.type, dataUrl });
      setAttachmentPreviewUrl(previewUrl);
      setImageColors(colors);
    } catch {
      clearFlyer();
      event.target.value = "";
    }
  };

  const handleAttachmentOnlyChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await handleFlyerChange(event);
  };

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

  const eventTheme = getEventTheme("Weddings");
  const [headerThemeId, setHeaderThemeId] = useState<string | null>(null);
  const [headerBgColor, setHeaderBgColor] = useState<string | null>(null);
  const [headerBgCss, setHeaderBgCss] = useState<string | null>(null);
  const BG_PRESETS = [
    {
      id: "royal-plum",
      name: "Royal Plum",
      bgColor: "#6D28D9",
      bgCss:
        "linear-gradient(135deg, rgba(109,40,217,0.95), rgba(147,51,234,0.85))",
    },
    {
      id: "dawn-rose",
      name: "Dawn Rose",
      bgColor: "#FBCFE8",
      bgCss: "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 100%)",
    },
    {
      id: "charcoal-glow",
      name: "Charcoal Glow",
      bgColor: "#1F2937",
      bgCss: "linear-gradient(135deg, #1F2937 0%, #374151 60%, #4B5563 100%)",
    },
  ];
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
    return { backgroundImage: eventTheme.headerLight } as React.CSSProperties;
  })();

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

  const [submitting, setSubmitting] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
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
      const sanitizedRegistries = normalizeRegistryLinks(
        registryLinks.map((e: any) => ({ label: e.label, url: e.url }))
      );
      const recurrenceSourceIso = startISO
        ? startISO
        : whenDate
        ? new Date(`${whenDate}T00:00:00`).toISOString()
        : null;
      let recurrenceRule: string | null = null;
      if (repeat) {
        if (repeatFrequency === "weekly") {
          const d = new Date(recurrenceSourceIso!);
          const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
          const days = repeatDays.length ? repeatDays : [codes[d.getUTCDay()]];
          recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`;
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
            const m = d.getUTCMonth() + 1;
            const day = d.getUTCDate();
            if (!Number.isNaN(m) && !Number.isNaN(day))
              recurrenceRule = `RRULE:FREQ=YEARLY;BYMONTH=${m};BYMONTHDAY=${day}`;
          }
        }
      }

      const payload: any = {
        title: title || "Event",
        data: {
          category: "Weddings",
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
          // Persist title style and header customization
          titleStyle: {
            color: titleColor || null,
            font: titleFont,
            weight: titleWeight,
            hAlign: titleHAlign,
            vAlign: titleVAlign,
            size: titleSize,
          },
          headerThemeId: headerThemeId || undefined,
          headerBgColor: headerBgColor || undefined,
          headerBgCss: headerBgCss || undefined,
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
      const normalizedEvent: NormalizedEvent = {
        title: title || "Event",
        start: startISO || new Date().toISOString(),
        end: endISO || new Date().toISOString(),
        allDay: fullDay,
        timezone,
        venue: venue || undefined,
        location: location || undefined,
        description: (rsvp || "").trim()
          ? [description, (rsvp || "").trim()].filter(Boolean).join("\n\n")
          : description,
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

      const tasks: Promise<any>[] = [];
      if (selectedCalendars.google)
        tasks.push(
          fetch("/api/events/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(normalizedEvent),
          }).catch(() => ({ ok: false }))
        );
      if (selectedCalendars.microsoft)
        tasks.push(
          fetch("/api/events/outlook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(normalizedEvent),
          }).catch(() => ({ ok: false }))
        );
      if (tasks.length) await Promise.allSettled(tasks);

      if (id) router.push(`/event/${id}?created=1`);
    } catch (err: any) {
      alert(String(err?.message || err || "Failed to create event"));
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    let startISO: string | null = null;
    let endISO: string | null = null;
    if (whenDate) {
      if (fullDay) {
        const s = new Date(`${whenDate}T00:00:00`);
        const e = new Date(s);
        e.setDate(e.getDate() + 1);
        startISO = s.toISOString();
        endISO = e.toISOString();
      } else {
        const s = new Date(`${whenDate}T${startTime || "09:00"}:00`);
        const endBase = endDate || whenDate;
        const e = new Date(`${endBase}T${endTime || "10:00"}:00`);
        startISO = s.toISOString();
        endISO = e.toISOString();
      }
    }
    return formatWhenSummary(startISO, endISO, fullDay);
  }, [whenDate, fullDay, startTime, endDate, endTime]);

  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-10 py-10">
      <form onSubmit={submit} className="space-y-6">
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
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage(null);
                      setProfilePreviewUrl(null);
                    }}
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
              className={`w-full bg-transparent focus:outline-none text-2xl sm:text-3xl ${
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
              }}
            />
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
        {/* Title style controls */}
        <section className="rounded-xl">
          <div className="w-full rounded-2xl border border-[#C9B8A4] bg-[#FFF9F6]/60 p-4 space-y-3">
            <label className="font-semibold text-[#3A2C1E] text-base sm:text-lg block">
              Title style:
            </label>
            <div className="flex flex-nowrap items-center gap-3 sm:gap-4 overflow-x-auto">
              <input
                type="color"
                value={titleColor || "#333333"}
                onChange={(e) => setTitleColor(e.target.value)}
                className="w-10 h-10 rounded-md border border-[#E4CDB9] cursor-pointer bg-transparent"
                aria-label="Title color"
              />
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
                  headerThemeId === p.id ? "border-foreground" : "border-border"
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
          return <WeddingsTemplate editor={editor} />;
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
            {submitting ? "Saving…" : "Create event"}
          </button>
        </div>
      </form>
    </main>
  );
}
