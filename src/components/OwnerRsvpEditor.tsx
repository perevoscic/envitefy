"use client";

import { Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useUnsavedProgress } from "@/components/UnsavedProgressProvider";
import {
  readOwnerRsvpSettings,
  validateOwnerRsvpSettings,
  type OwnerRsvpSettings,
} from "@/lib/owner-rsvp-settings";

export default function OwnerRsvpEditor({
  eventId,
  eventData,
}: {
  eventId: string;
  eventData: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const formId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const hostInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [baseline, setBaseline] = useState(() => readOwnerRsvpSettings(eventData));
  const [form, setForm] = useState<OwnerRsvpSettings>(baseline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const dirty = (Object.keys(form) as Array<keyof OwnerRsvpSettings>).some(
    (key) => form[key] !== baseline[key],
  );

  useEffect(() => {
    if (open) hostInput.current?.focus();
  }, [open]);

  function cancel() {
    setForm(baseline);
    setError("");
    setOpen(false);
    trigger.current?.focus();
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      const settings = validateOwnerRsvpSettings(form);
      const response = await fetch(`/api/history/${encodeURIComponent(eventId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rsvpSettings: settings }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "The RSVP details could not be saved.");
      setBaseline(settings);
      setForm(settings);
      setSaved(true);
      setOpen(false);
      trigger.current?.focus();
      window.dispatchEvent(new CustomEvent("history:updated", { detail: { id: eventId } }));
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "The RSVP details could not be saved. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }

  useUnsavedProgress({ dirty, busy: saving, save, discard: cancel });

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-slate-950">Guest responses</h4>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => {
            setOpen(true);
            setSaved(false);
          }}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        >
          <Pencil size={13} aria-hidden="true" />
          Edit RSVP
        </button>
      </div>
      {saved ? (
        <p role="status" className="mt-2 text-sm text-emerald-700">
          RSVP details saved.
        </p>
      ) : null}
      {open ? (
        <form
          id={formId}
          aria-label="Edit RSVP details"
          className="mt-4 border-t border-slate-100 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save().catch(() => {});
          }}
        >
          <fieldset disabled={saving} className="grid min-w-0 gap-3 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-slate-700">RSVP contact</legend>
            {(
              [
                {
                  key: "hostName",
                  label: "Host name",
                  type: "text",
                  autoComplete: "name",
                  maxLength: 254,
                },
                { key: "phone", label: "Phone", type: "tel", autoComplete: "tel", maxLength: 80 },
                {
                  key: "email",
                  label: "Email",
                  type: "email",
                  autoComplete: "email",
                  maxLength: 254,
                },
              ] as const
            ).map((field) => (
              <label
                key={field.key}
                className={`block min-w-0 text-sm font-semibold text-slate-600 ${field.key === "hostName" ? "sm:col-span-2" : ""}`}
              >
                {field.label}
                <input
                  ref={field.key === "hostName" ? hostInput : undefined}
                  name={field.key}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  maxLength={field.maxLength}
                  value={form[field.key]}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, [field.key]: event.target.value }));
                    setError("");
                  }}
                  className="mt-1.5 min-h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-950 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-60"
                />
              </label>
            ))}
          </fieldset>
          {error ? (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={cancel}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={16} aria-hidden="true" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={16}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}
              {saving ? "Saving" : "Save RSVP"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
