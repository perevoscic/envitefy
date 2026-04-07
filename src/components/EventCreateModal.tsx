"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RegistryFormEntry } from "@/components/RegistryLinksEditor";
import type { NormalizedEvent } from "@/lib/mappers";
import {
  getRegistrySectionCopyForCategory,
  MAX_REGISTRY_LINKS,
  normalizeRegistryLinks,
  validateRegistryUrl,
} from "@/utils/registry-links";
import { extractColorsFromImage, type ImageColors } from "@/utils/image-colors";
import {
  createObjectUrlPreview,
  mergeUploadedEventMedia,
  uploadMediaFile,
  validateClientUploadFile,
} from "@/utils/media-upload-client";
import EventCreateForm from "@/components/EventCreateForm";
import { buildEventPath } from "@/utils/event-url";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
};

type ConnectedCalendars = {
  google: boolean;
  microsoft: boolean;
  apple: boolean;
};

const createRegistryEntry = (): RegistryFormEntry => ({
  key: `registry-${Math.random().toString(36).slice(2, 10)}`,
  label: "",
  url: "",
  error: null,
  detectedLabel: null,
});

function _toLocalInputValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  } catch {
    return "";
  }
}

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

export default function EventCreateModal({ open, onClose, defaultDate }: Props) {
  const router = useRouter();
  const DOW = [
    { code: "SU", label: "Sun" },
    { code: "MO", label: "Mon" },
    { code: "TU", label: "Tue" },
    { code: "WE", label: "Wed" },
    { code: "TH", label: "Thu" },
    { code: "FR", label: "Fri" },
    { code: "SA", label: "Sat" },
  ] as const;
  const _REPEAT_FREQUENCIES = [
    { key: "weekly", label: "Week" },
    { key: "monthly", label: "Month" },
    { key: "yearly", label: "Year" },
  ] as const;
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

  const [submitting, setSubmitting] = useState(false);
  const _todayMin = useMemo(() => toLocalDateValue(new Date()), []);
  const [title, setTitle] = useState("");
  // Date/time inputs
  const [whenDate, setWhenDate] = useState<string>(toLocalDateValue(new Date(initialStart)));
  const [fullDay, setFullDay] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<string>(toLocalTimeValue(initialStart));
  const [endDate, setEndDate] = useState<string>(toLocalDateValue(new Date(initialEnd)));
  const [endTime, setEndTime] = useState<string>(toLocalTimeValue(initialEnd));
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState<number>(0);
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [_showCustomCategory, setShowCustomCategory] = useState(false);
  const [registryLinks, setRegistryLinks] = useState<RegistryFormEntry[]>([]);
  const [_attachment, setAttachment] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [_attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [_attachmentError, setAttachmentError] = useState<string | null>(null);
  const [imageColors, setImageColors] = useState<ImageColors | null>(null);
  const flyerInputRef = useRef<HTMLInputElement | null>(null);
  // Smart sign-up configuration moved to its own modal

  // Connected calendars state
  const [_connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendars>({
    google: false,
    microsoft: false,
    apple: false,
  });
  const [selectedCalendars, setSelectedCalendars] = useState<{
    google: boolean;
    microsoft: boolean;
    apple: boolean;
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });

  const _addRegistryLink = () => {
    setRegistryLinks((prev) => {
      if (prev.length >= MAX_REGISTRY_LINKS) return prev;
      return [...prev, createRegistryEntry()];
    });
  };

  const _removeRegistryLink = (key: string) => {
    setRegistryLinks((prev) => prev.filter((entry) => entry.key !== key));
  };

  const _handleRegistryFieldChange = (key: string, field: "label" | "url", value: string) => {
    const trimmed = field === "label" ? value.slice(0, 60) : value;
    setRegistryLinks((prev) =>
      prev.map((entry) => {
        if (entry.key !== key) return entry;
        const next: RegistryFormEntry = {
          ...entry,
          [field]: trimmed,
        };
        if (field === "url") {
          if (!trimmed.trim()) {
            next.error = null;
            next.detectedLabel = null;
          } else {
            const validation = validateRegistryUrl(trimmed);
            next.error = validation.ok ? null : validation.error || null;
            next.detectedLabel =
              validation.ok && validation.brand ? validation.brand.defaultLabel : null;
            if (validation.ok && validation.brand && (!entry.label || !entry.label.trim())) {
              next.label = validation.brand.defaultLabel;
            }
          }
        }
        if (field === "label" && !trimmed.trim() && entry.detectedLabel) {
          next.label = "";
        }
        return next;
      }),
    );
  };
  const _handleFlyerChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      setAttachmentFile(null);
      setAttachmentPreviewUrl(null);
      setImageColors(null);
      setAttachmentError(null);
      return;
    }
    const validationError = validateClientUploadFile(file, "attachment");
    if (validationError) {
      setAttachmentError(validationError);
      event.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const previewUrl = createObjectUrlPreview(file);
      let colors: ImageColors | null = null;
      if (previewUrl) {
        // Extract colors from the image for gradient background
        try {
          colors = await extractColorsFromImage(previewUrl);
        } catch (err) {
          console.error("Failed to extract colors from image:", err);
          // Continue without colors if extraction fails
        }
      }
      setAttachmentFile(file);
      setAttachment({ name: file.name, type: file.type, dataUrl: "" });
      setAttachmentPreviewUrl(previewUrl);
      setImageColors(colors);
    } catch {
      setAttachment(null);
      setAttachmentFile(null);
      setAttachmentPreviewUrl(null);
      setImageColors(null);
      setAttachmentError("Could not process the file");
      event.target.value = "";
    }
  };

  const _clearFlyer = () => {
    setAttachment(null);
    setAttachmentPreviewUrl(null);
    setImageColors(null);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  };
  const [repeat, setRepeat] = useState<boolean>(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch connected calendars when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchConnected = async () => {
      try {
        const res = await fetch("/api/calendars", { credentials: "include" });
        const data = await res.json();
        console.log("[EventCreateModal] Connected calendars:", data);
        setConnectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
        // Auto-select all connected calendars
        setSelectedCalendars({
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
        console.log("[EventCreateModal] Set connected calendars:", {
          google: Boolean(data?.google),
          microsoft: Boolean(data?.microsoft),
          apple: Boolean(data?.apple),
        });
      } catch (err) {
        console.error("Failed to fetch connected calendars:", err);
      }
    };

    fetchConnected();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setWhenDate(toLocalDateValue(new Date(initialStart)));
    setFullDay(true);
    setStartTime(toLocalTimeValue(initialStart));
    setEndDate(toLocalDateValue(new Date(initialEnd)));
    setEndTime(toLocalTimeValue(initialEnd));
    setLocation("");
    setVenue("");
    setDescription("");
    setRsvp("");
    setNumberOfGuests(0);
    setCategory("");
    setCustomCategory("");
    setShowCustomCategory(false);
    setRepeat(false);
    setRepeatFrequency("weekly");
    setRepeatDays([]);
    setRegistryLinks([]);
    setAttachment(null);
    setAttachmentPreviewUrl(null);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  }, [open, initialStart, initialEnd]);
  useEffect(() => {
    if (category === "Birthdays" || category === "Weddings" || category === "Baby Showers") return;
    if (rsvp) setRsvp("");
  }, [category]);

  // When enabling repeat with no selected days, preselect the chosen date's weekday
  useEffect(() => {
    try {
      if (repeat && repeatFrequency === "weekly" && repeatDays.length === 0 && whenDate) {
        const d = new Date(`${whenDate}T00:00:00`);
        const code = DOW[d.getDay()].code;
        setRepeatDays([code]);
      }
      if (repeatFrequency !== "weekly") {
        setRepeatDays([]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, repeatFrequency]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description, open]);

  const _submit = async (e: React.FormEvent) => {
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
          if (!trimmedUrl) {
            return { ...entry, error: null };
          }
          const validation = validateRegistryUrl(trimmedUrl);
          return {
            ...entry,
            error: validation.ok ? null : validation.error || "Enter a valid https:// link",
            detectedLabel:
              validation.ok && validation.brand
                ? validation.brand.defaultLabel
                : entry.detectedLabel,
          };
        }),
      );
      alert(getRegistrySectionCopyForCategory(category || "").invalidLinksAlert);
      return;
    }

    const normalizedCategoryForSubmit = (category || "").toLowerCase();
    const allowsRegistriesForSubmit = getRegistrySectionCopyForCategory(
      normalizedCategoryForSubmit,
    ).allowsLinks;
    const sanitizedRegistries = allowsRegistriesForSubmit
      ? normalizeRegistryLinks(
          registryLinks.map((entry) => ({
            label: entry.label,
            url: entry.url,
          })),
        )
      : [];
    const activeSignupForm = null;

    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (whenDate) {
        if (fullDay) {
          const start = new Date(`${whenDate}T00:00:00`);
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (start < todayStart) {
            throw new Error("Start date cannot be in the past");
          }
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          startISO = start.toISOString();
          endISO = end.toISOString();
        } else {
          const start = new Date(`${whenDate}T${startTime || "09:00"}:00`);
          const endBase = endDate || whenDate;
          const end = new Date(`${endBase}T${endTime || "10:00"}:00`);
          // Enforce non-past start and end >= start
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (start < todayStart) {
            throw new Error("Start date cannot be in the past");
          }
          if (end < start) {
            endISO = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
            startISO = start.toISOString();
            // continue
          } else {
            startISO = start.toISOString();
            endISO = end.toISOString();
          }
        }
      }
      // Use custom category if it was entered but not saved yet
      const finalCategory = customCategory.trim() || category || undefined;

      const deriveWeeklyDays = (): string[] => {
        if (repeatDays.length) return repeatDays;
        if (!whenDate) return [];
        try {
          const d = new Date(`${whenDate}T00:00:00`);
          return [DOW[d.getDay()].code];
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
          if (days.length) recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${days.join(",")}`;
          else recurrenceRule = "RRULE:FREQ=WEEKLY";
        } else if (repeatFrequency === "monthly") {
          if (recurrenceSourceIso) {
            const d = new Date(recurrenceSourceIso);
            const day = d.getUTCDate();
            if (!Number.isNaN(day)) {
              recurrenceRule = `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`;
            }
          }
        } else if (repeatFrequency === "yearly") {
          if (recurrenceSourceIso) {
            const d = new Date(recurrenceSourceIso);
            const month = d.getUTCMonth() + 1;
            const day = d.getUTCDate();
            if (!Number.isNaN(month) && !Number.isNaN(day)) {
              recurrenceRule = `RRULE:FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${day}`;
            }
          }
        }
      }

      const attachmentUpload = attachmentFile
        ? await uploadMediaFile({
            file: attachmentFile,
            usage: "attachment",
          })
        : null;
      const mediaPatch = mergeUploadedEventMedia({
        attachmentUpload,
      });

      const payload: any = {
        title: title || "Event",
        data: {
          category: finalCategory,
          createdVia: "manual",
          createdManually: true,
          startISO,
          endISO,
          venue: venue || undefined,
          location: location || undefined,
          description: description || undefined,
          rsvp: trimmedRsvp || undefined,
          numberOfGuests: numberOfGuests || 0,
          allDay: fullDay || undefined,
          repeat: repeat || undefined,
          repeatFrequency: repeat ? repeatFrequency : undefined,
          recurrence: recurrenceRule || undefined,
          ...mediaPatch,
          imageColors: imageColors || undefined,
          registries: sanitizedRegistries.length > 0 ? sanitizedRegistries : undefined,
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

      // Add to selected calendars
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const normalizedDescription = trimmedRsvp
        ? [description, trimmedRsvp].filter(Boolean).join("\n\n")
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
        attachment: (mediaPatch.attachment as any) || null,
        signupForm: activeSignupForm,
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
          }),
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
          }),
        );
      }

      // Apple calendar would be handled similarly when the API is available
      if (selectedCalendars.apple) {
        // TODO: Implement Apple Calendar API when available
        console.log("Apple Calendar integration not yet implemented");
      }

      // Wait for all calendar operations to complete
      if (calendarPromises.length > 0) {
        await Promise.allSettled(calendarPromises);
      }

      try {
        if (id && typeof window !== "undefined") {
          const serverData =
            (j as any)?.data && typeof (j as any)?.data === "object" ? (j as any).data : null;
          const mergedData = {
            ...payload.data,
            ...(serverData || {}),
          };
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id,
                title: (j as any)?.title || payload.title,
                created_at: (j as any)?.created_at || new Date().toISOString(),
                start: serverData?.start || serverData?.startISO || startISO,
                category: mergedData.category || null,
                data: mergedData,
              },
            }),
          );
        }
      } catch {}
      if (id) {
        const eventTitle =
          (typeof (j as any)?.title === "string" && (j as any).title) || payload.title;
        router.push(buildEventPath(id, eventTitle, { created: true }));
      }
      onClose();
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const trimmedRsvp = rsvp.trim();
  const normalizedCategory = (category || "").toLowerCase();
  const _allowsRegistrySection = getRegistrySectionCopyForCategory(normalizedCategory).allowsLinks;
  // RSVP field should ALWAYS show - users may want to add RSVP for any event type
  const _showRsvpField = true;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[400] flex items-center justify-center"
      onClick={() => !submitting && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-[401] w-full sm:max-w-lg sm:rounded-xl bg-surface border border-border shadow-xl sm:mx-auto max-h-[calc(100vh-2rem)] flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <EventCreateForm defaultDate={defaultDate} onCancel={onClose} />
      </div>
    </div>
  );
}
