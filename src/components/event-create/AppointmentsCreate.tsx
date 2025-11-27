"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedEvent } from "@/lib/mappers";
import { getEventTheme } from "@/lib/event-theme";
import type { EditorBindings } from "@/components/event-templates/EventTemplateBase";
import AppointmentsTemplate from "@/components/event-templates/AppointmentsTemplate";
import { createThumbnailDataUrl, readFileAsDataUrl } from "@/utils/thumbnail";
import { extractColorsFromImage, type ImageColors } from "@/utils/image-colors";
import { EditSquareIcon } from "@/components/icons/EditSquareIcon";
import { buildEventPath } from "@/utils/event-url";

type Props = { defaultDate?: Date };

function toLocalDateValue(d: Date | null): string {
  if (!d) return "";
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
    const s = new Date(startIso);
    const e = endIso ? new Date(endIso) : null;
    const same =
      !!e &&
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate();
    if (allDay) {
      const df = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const dl =
        e && !same ? `${df.format(s)} – ${df.format(e)}` : df.format(s);
      return { time: null, date: `${dl} (all day)` } as const;
    }
    const df = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const tf = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (e) {
      if (same)
        return {
          time: `${tf.format(s)} – ${tf.format(e)}`,
          date: df.format(s),
        } as const;
      return {
        time: `${tf.format(s)} – ${tf.format(e)}`,
        date: `${df.format(s)} – ${df.format(e)}`,
      } as const;
    }
    return { time: tf.format(s), date: df.format(s) } as const;
  } catch {
    return { time: null, date: null } as const;
  }
}

export default function AppointmentsCreate({ defaultDate }: Props) {
  const router = useRouter();
  const initialStart = useMemo(() => {
    const base = defaultDate ? new Date(defaultDate) : new Date();
    base.setSeconds(0, 0);
    const r = new Date(base);
    r.setMinutes(r.getMinutes() - (r.getMinutes() % 15));
    return r;
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

  const clearFlyer = () => {
    setAttachment(null);
    setAttachmentPreviewUrl(null);
    setImageColors(null);
    setAttachmentError(null);
    if (flyerInputRef.current) flyerInputRef.current.value = "";
  };
  const handleFlyerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      clearFlyer();
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setAttachmentError("Upload an image or PDF file");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("File must be 5 MB or smaller");
      e.target.value = "";
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
      e.target.value = "";
    }
  };
  const handleAttachmentOnlyChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      setAttachmentError("Upload an image or PDF file");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("File must be 5 MB or smaller");
      e.target.value = "";
      return;
    }
    setAttachmentError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachment({ name: file.name, type: file.type, dataUrl });
    } catch {
      setAttachment(null);
      e.target.value = "";
    }
  };

  const clearProfile = () => {
    setProfileImage(null);
    setProfilePreviewUrl(null);
    if (profileInputRef.current) profileInputRef.current.value = "";
  };
  const handleProfileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      clearProfile();
      return;
    }
    if (!file.type.startsWith("image/")) {
      e.target.value = "";
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
      e.target.value = "";
    }
  };

  const eventTheme = getEventTheme("Appointments");
  const [headerThemeId, setHeaderThemeId] = useState<string | null>(null);
  const [headerBgColor, setHeaderBgColor] = useState<string | null>(null);
  const [headerBgCss, setHeaderBgCss] = useState<string | null>(null);
  const BG_PRESETS = [
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
      id: "steel-sky",
      name: "Steel Sky",
      bgColor: "#93C5FD",
      bgCss: "linear-gradient(135deg, #93C5FD 0%, #A7F3D0 100%)",
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
          const s = new Date(`${whenDate}T00:00:00`);
          const e2 = new Date(s);
          e2.setDate(e2.getDate() + 1);
          startISO = s.toISOString();
          endISO = e2.toISOString();
        } else {
          const s = new Date(`${whenDate}T${startTime || "09:00"}:00`);
          const eb = endDate || whenDate;
          const e2 = new Date(`${eb}T${endTime || "10:00"}:00`);
          startISO = s.toISOString();
          endISO = e2.toISOString();
        }
      }
      const recurrenceRule: null = null;
      const payload: any = {
        title: title || "Event",
        data: {
          category: "Appointments",
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
          repeat: undefined,
          repeatFrequency: undefined,
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
          registries: undefined,
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
        description: description || undefined,
        recurrence: null,
        reminders: [{ minutes: 30 }],
        registries: null,
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
      if (id) {
        router.push(buildEventPath(id, payload.title, { created: true }));
      }
    } catch (err: any) {
      alert(String(err?.message || err || "Failed to create event"));
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    let s: string | null = null;
    let e: string | null = null;
    if (whenDate) {
      if (fullDay) {
        const a = new Date(`${whenDate}T00:00:00`);
        const b = new Date(a);
        b.setDate(b.getDate() + 1);
        s = a.toISOString();
        e = b.toISOString();
      } else {
        const a = new Date(`${whenDate}T${startTime || "09:00"}:00`);
        const eb = endDate || whenDate;
        const b = new Date(`${eb}T${endTime || "10:00"}:00`);
        s = a.toISOString();
        e = b.toISOString();
      }
    }
    return formatWhenSummary(s, e, fullDay);
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
                    <EditSquareIcon className="h-4 w-4" />
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
              className={`w-full bg-transparent focus:outline-none text-2xl sm:text-3xl font-semibold ${
                attachmentPreviewUrl
                  ? "text-white placeholder-white/70"
                  : "text-foreground"
              }`}
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
            allowsRegistrySection: false,
            registryLinks: [],
            addRegistryLink: () => {},
            removeRegistryLink: () => {},
            handleRegistryFieldChange: () => {},
            MAX_REGISTRY_LINKS: 0,
            attachment,
            attachmentPreviewUrl,
            attachmentError,
            flyerInputRef,
            handleFlyerChange,
            clearFlyer,
            attachmentInputRef,
            handleAttachmentOnlyChange,
            repeat: false,
            setRepeat: () => {},
            repeatFrequency: "weekly",
            setRepeatFrequency: () => {},
            repeatDays: [],
            setRepeatDays: () => {},
            connectedCalendars,
            selectedCalendars,
            setSelectedCalendars,
            cardBackgroundImage: (imageColors?.cardLight ||
              eventTheme.cardLight) as string | undefined,
          };
          return <AppointmentsTemplate editor={editor} />;
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
