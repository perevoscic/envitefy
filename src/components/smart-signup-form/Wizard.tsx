"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { SignupForm } from "@/types/signup";
import SignupBuilder from "@/components/smart-signup-form/SignupBuilder";
import { getEventTheme } from "@/lib/event-theme";
import SignupViewer from "@/components/smart-signup-form/SignupViewer";

type Props = {
  form: SignupForm;
  onChange: (next: SignupForm) => void;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  submitting?: boolean;
};

const STEP_TITLES = [
  "Basics",
  "Smart settings",
  "Sections",
  "Preview & publish",
] as const;

type StepKey = 0 | 1 | 2 | 3;

export default function SmartSignupWizard({
  form,
  onChange,
  onSubmit,
  submitting,
}: Props) {
  const [step, setStep] = useState<StepKey>(0);
  const { data: session } = useSession();
  const creatorName = (session?.user?.name as string | undefined) || null;

  const theme = useMemo(
    () => getEventTheme((form.description || form.title || "") as string),
    [form.title, form.description]
  );
  const themeStyleVars = useMemo(
    () =>
      ({
        "--event-header-gradient-light": theme.headerLight,
        "--event-header-gradient-dark": theme.headerDark,
        "--event-card-bg-light": theme.cardLight,
        "--event-card-bg-dark": theme.cardDark,
        "--event-border-light": theme.borderLight,
        "--event-border-dark": theme.borderDark,
        "--event-chip-light": theme.chipLight,
        "--event-chip-dark": theme.chipDark,
        "--event-text-light": theme.textLight,
        "--event-text-dark": theme.textDark,
      } as React.CSSProperties),
    [theme]
  );

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as StepKey) : s));
  const prev = () => setStep((s) => (s > 0 ? ((s - 1) as StepKey) : s));
  const initials = (creatorName || "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() : ""))
    .slice(0, 2)
    .join("");

  const formatRangeLabel = (
    startInput?: string | null,
    endInput?: string | null,
    options?: { timeZone?: string | null; allDay?: boolean | null }
  ): string | null => {
    const timeZone = options?.timeZone || undefined;
    const allDay = Boolean(options?.allDay);
    try {
      if (!startInput) return null;
      const start = new Date(startInput);
      const end = endInput ? new Date(endInput) : null;
      if (Number.isNaN(start.getTime())) return null;
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
          timeZone,
        });
        const label =
          end && !sameDay
            ? `${dateFmt.format(start)} – ${dateFmt.format(end)}`
            : dateFmt.format(start);
        return `${label} (all day)`;
      }
      const dateFmt = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone,
      });
      if (end) {
        if (sameDay) {
          return `${dateFmt.format(start)}`;
        }
        return `${dateFmt.format(start)} – ${dateFmt.format(end)}`;
      }
      return dateFmt.format(start);
    } catch {
      return startInput || null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    // Never auto-submit on Enter or implicit form submit; publishing is only via the button click
    e.preventDefault();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {STEP_TITLES.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li
              key={label}
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border ${
                active
                  ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white"
                  : done
                  ? "border-border bg-surface text-foreground"
                  : "border-dashed border-border text-foreground/70"
              }`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-[11px]">
                {i + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {/* Content */}
      {step === 0 && (
        <SignupBuilder
          form={form}
          onChange={onChange}
          panels={{
            basics: true,
            settings: false,
            sections: false,
            questions: false,
          }}
        />
      )}
      {step === 1 && (
        <SignupBuilder
          form={form}
          onChange={onChange}
          panels={{
            basics: false,
            settings: true,
            sections: false,
            questions: false,
          }}
        />
      )}
      {step === 2 && (
        <SignupBuilder
          form={form}
          onChange={onChange}
          panels={{
            basics: false,
            settings: false,
            sections: true,
            questions: true,
          }}
        />
      )}
      {step === 3 && (
        <SignupViewer
          eventId="preview"
          initialForm={form as SignupForm}
          viewerKind="readonly"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={prev}
          disabled={step === 0}
          className="px-3 py-2 text-sm rounded-md border border-border disabled:opacity-60"
        >
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="px-3 py-2 text-sm rounded-md bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit as any}
            disabled={submitting}
            className="px-3 py-2 text-sm rounded-md bg-primary text-white disabled:opacity-70"
          >
            {submitting ? "Publishing…" : "Publish sign-up"}
          </button>
        )}
      </div>
    </form>
  );
}
