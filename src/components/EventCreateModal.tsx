"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultDate?: Date;
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
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [repeat, setRepeat] = useState<boolean>(false);

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setWhenDate(toLocalDateValue(new Date(initialStart)));
    setFullDay(true);
    setStartTime(toLocalTimeValue(initialStart));
    setEndDate(toLocalDateValue(new Date(initialEnd)));
    setEndTime(toLocalTimeValue(initialEnd));
    setLocation("");
    setDescription("");
    setCategory("");
    setRepeat(false);
  }, [open, initialStart, initialEnd]);

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
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          startISO = start.toISOString();
          endISO = end.toISOString();
        } else {
          const start = new Date(`${whenDate}T${startTime || "09:00"}:00`);
          const end = new Date(
            `${endDate || whenDate}T${endTime || "10:00"}:00`
          );
          startISO = start.toISOString();
          endISO = end.toISOString();
        }
      }
      const payload: any = {
        title: title || "Event",
        data: {
          category: category || undefined,
          startISO,
          endISO,
          location: location || undefined,
          description: description || undefined,
          allDay: fullDay || undefined,
          repeat: repeat || undefined,
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
    } catch (err) {
      try {
        console.error("Failed to create event", err);
      } catch {}
      alert("Failed to create event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
        className="relative z-50 w-full sm:max-w-md sm:rounded-xl bg-surface border border-border p-4 sm:p-5 shadow-xl sm:mx-auto"
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
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-when">
              When
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                id="evt-when"
                type="date"
                value={whenDate}
                onChange={(e) => setWhenDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
              <div className="col-span-1 sm:col-span-2 flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fullDay}
                    onChange={(e) => setFullDay(e.target.checked)}
                  />
                  <span>Full day</span>
                </label>
                {!fullDay && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/70">Start</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="px-2 py-1 rounded-md border border-border bg-background"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground/70">End</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
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
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="evt-location">
              Location
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
            <select
              id="evt-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            >
              <option value="">Select category</option>
              <option value="Birthdays">Birthdays</option>
              <option value="Weddings">Weddings</option>
              <option value="Appointments">Appointments</option>
              <option value="Doctor Appointments">Doctor Appointments</option>
              <option value="Sport Events">Sport Events</option>
              <option value="General Events">General Events</option>
            </select>
          </div>
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
