"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { NormalizedEvent } from "@/lib/mappers";

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

function toLocalInputValue(d: Date | null): string {
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

export default function EventCreateModal({
  open,
  onClose,
  defaultDate,
}: Props) {
  // Category color helpers
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

  const DOW = [
    { code: "SU", label: "Sun" },
    { code: "MO", label: "Mon" },
    { code: "TU", label: "Tue" },
    { code: "WE", label: "Wed" },
    { code: "TH", label: "Thu" },
    { code: "FR", label: "Fri" },
    { code: "SA", label: "Sat" },
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
  const todayMin = useMemo(() => toLocalDateValue(new Date()), []);
  const [title, setTitle] = useState("");
  // Date/time inputs
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
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [rsvp, setRsvp] = useState("");
  const [category, setCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Connected calendars state
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
  }>({
    google: false,
    microsoft: false,
    apple: false,
  });
  const maybeAssignCategoryColor = (cat: string) => {
    if (!cat) return;
    try {
      const raw = localStorage.getItem("categoryColors");
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      if (!map[cat]) {
        // Prefer an unused color from the palette, else random
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
  const [repeat, setRepeat] = useState<boolean>(false);
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
    setCategory("");
    setCustomCategory("");
    setShowCustomCategory(false);
    setRepeat(false);
    setRepeatDays([]);
  }, [open, initialStart, initialEnd]);
  useEffect(() => {
    if (category === "Birthdays" || category === "Weddings") return;
    if (rsvp) setRsvp("");
  }, [category]);

  // When enabling repeat with no selected days, preselect the chosen date's weekday
  useEffect(() => {
    try {
      if (repeat && repeatDays.length === 0 && whenDate) {
        const d = new Date(`${whenDate}T00:00:00`);
        const code = DOW[d.getDay()].code;
        setRepeatDays([code]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description, open]);

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
          const now = new Date();
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
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
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
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

      const payload: any = {
        title: title || "Event",
        data: {
          category: finalCategory,
          startISO,
          endISO,
          venue: venue || undefined,
          location: location || undefined,
          description: description || undefined,
          rsvp: trimmedRsvp || undefined,
          allDay: fullDay || undefined,
          repeat: repeat || undefined,
          recurrence:
            repeat && repeatDays.length
              ? `RRULE:FREQ=WEEKLY;BYDAY=${repeatDays.join(",")}`
              : undefined,
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
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
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
        recurrence:
          repeat && repeatDays.length
            ? `RRULE:FREQ=WEEKLY;BYDAY=${repeatDays.join(",")}`
            : null,
        reminders: [{ minutes: 30 }],
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
          window.dispatchEvent(
            new CustomEvent("history:created", {
              detail: {
                id,
                title: (j as any)?.title || payload.title,
                created_at: (j as any)?.created_at || new Date().toISOString(),
                start: (j as any)?.data?.start || startISO,
                category: (j as any)?.data?.category || payload.data.category,
              },
            })
          );
        }
      } catch {}
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
  const showRsvpField =
    normalizedCategory.includes("birthday") ||
    normalizedCategory.includes("wedding") ||
    Boolean(trimmedRsvp);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={() => !submitting && onClose()}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-50 w-full sm:max-w-lg sm:rounded-xl bg-surface border border-border p-4 sm:p-5 shadow-xl sm:mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold">New event</h3>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="text-foreground/70 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form className="mt-3 space-y-3" onSubmit={submit}>
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-title">
              Title
            </label>
            <input
              id="evt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              placeholder="Event title"
            />
          </div>
          {/* Color picker removed; colors derive from category or random assignment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm" htmlFor="evt-when">
                When
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fullDay}
                  onChange={(e) => setFullDay(e.target.checked)}
                />
                <span>Full day</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {fullDay ? (
                <input
                  id="evt-when"
                  type="date"
                  value={whenDate}
                  onChange={(e) => setWhenDate(e.target.value)}
                  min={todayMin}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background min-w-0"
                />
              ) : (
                <div className="col-span-3 grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-xs text-foreground/70 mb-1">Start</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={whenDate}
                        onChange={(e) => setWhenDate(e.target.value)}
                        min={todayMin}
                        className="px-2 py-1 rounded-md border border-border bg-background"
                      />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="px-2 py-1 rounded-md border border-border bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/70 mb-1">End</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={whenDate || todayMin}
                        className="px-2 py-1 rounded-md border border-border bg-background"
                      />
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="px-2 py-1 rounded-md border border-border bg-background"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-venue">
              Venue
            </label>
            <input
              id="evt-venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              placeholder="Venue name"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-location">
              Address
            </label>
            <input
              id="evt-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
              placeholder="Where is it?"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-category">
              Category
            </label>
            {!showCustomCategory ? (
              <select
                id="evt-category"
                value={category}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setShowCustomCategory(true);
                    setCategory("");
                  } else {
                    setCategory(v);
                    maybeAssignCategoryColor(v);
                  }
                }}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="">Select category</option>
                <option value="Birthdays">Birthdays</option>
                <option value="Weddings">Weddings</option>
                <option value="Appointments">Appointments</option>
                <option value="Doctor Appointments">Doctor Appointments</option>
                <option value="Sport Events">Sport Events</option>
                <option value="General Events">General Events</option>
                <option value="__custom__">+ Add your own...</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  onBlur={() => {
                    if (customCategory.trim()) {
                      setCategory(customCategory.trim());
                      maybeAssignCategoryColor(customCategory.trim());
                    }
                  }}
                  placeholder="Enter category name"
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customCategory.trim()) {
                      setCategory(customCategory.trim());
                      maybeAssignCategoryColor(customCategory.trim());
                      setShowCustomCategory(false);
                    }
                  }}
                  className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomCategory(false);
                    setCustomCategory("");
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-border hover:bg-surface"
                >
                  ✕
                </button>
              </div>
            )}
            {category && !showCustomCategory && (
              <div className="mt-2 text-sm text-foreground/70">
                <span>Selected: {category}</span>
              </div>
            )}
          </div>

          {showRsvpField && (
            <div>
              <label className="block text-sm mb-1" htmlFor="evt-rsvp">
                RSVP
              </label>
              <textarea
                id="evt-rsvp"
                value={rsvp}
                onChange={(e) => setRsvp(e.target.value)}
                rows={1}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            </div>
          )}

          {/* Connected Calendars Checkboxes */}
          {(connectedCalendars.google ||
            connectedCalendars.microsoft ||
            connectedCalendars.apple) && (
            <div>
              <label className="block text-sm mb-2">Add to Calendar</label>
              <div className="space-y-2">
                {connectedCalendars.google && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCalendars.google}
                      onChange={(e) =>
                        setSelectedCalendars((prev) => ({
                          ...prev,
                          google: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span>Google Calendar</span>
                  </label>
                )}
                {connectedCalendars.microsoft && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCalendars.microsoft}
                      onChange={(e) =>
                        setSelectedCalendars((prev) => ({
                          ...prev,
                          microsoft: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span>Outlook Calendar</span>
                  </label>
                )}
                {connectedCalendars.apple && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCalendars.apple}
                      onChange={(e) =>
                        setSelectedCalendars((prev) => ({
                          ...prev,
                          apple: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-border"
                    />
                    <span>Apple Calendar</span>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm">Repeat</span>
            <button
              type="button"
              onClick={() => setRepeat((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                repeat ? "bg-blue-600" : "bg-foreground/30"
              }`}
              aria-pressed={repeat}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  repeat ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {repeat && (
            <div className="-mt-1">
              <div className="text-xs text-foreground/70 mb-1">Repeat on</div>
              <div className="grid grid-cols-7 gap-2">
                {DOW.map((d) => {
                  const active = repeatDays.includes(d.code);
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => {
                        setRepeatDays((prev) =>
                          active
                            ? prev.filter((c) => c !== d.code)
                            : [...prev, d.code]
                        );
                      }}
                      className={`h-8 rounded-md border text-xs font-medium ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-background text-foreground border-border"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-desc">
              Description
            </label>
            <textarea
              id="evt-desc"
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
