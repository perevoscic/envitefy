"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import type { SignupForm } from "@/types/signup";
import SignupBuilder from "@/components/smart-signup-form/SignupBuilder";
import { getEventTheme } from "@/lib/event-theme";

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
        <div className="space-y-3">
          <div
            className="event-theme-scope rounded-xl overflow-hidden border"
            style={themeStyleVars}
          >
            <section
              className="px-5 py-6"
              style={{
                backgroundColor: form.header?.backgroundColor || undefined,
                backgroundImage: form.header?.backgroundCss || undefined,
                backgroundSize: form.header?.backgroundCss
                  ? "cover"
                  : undefined,
                backgroundPosition: form.header?.backgroundCss
                  ? "center"
                  : undefined,
                color: form.header?.textColor2 || undefined,
              }}
            >
              <div
                className={`grid gap-6 items-start ${
                  (form.header?.templateId || "header-1") === "header-2"
                    ? "md:grid-cols-[1fr_325px]"
                    : (form.header?.templateId || "header-1") === "header-3"
                    ? "grid-cols-1"
                    : (form.header?.templateId || "header-1") === "header-5"
                    ? "md:grid-cols-2"
                    : (form.header?.templateId || "header-1") === "header-6"
                    ? "md:grid-cols-3"
                    : "md:grid-cols-[325px_1fr]"
                }`}
              >
                <div
                  className={`relative ${
                    (form.header?.templateId || "header-1") === "header-2"
                      ? "order-2"
                      : "order-1"
                  } ${
                    (form.header?.templateId || "header-1") === "header-3"
                      ? "col-span-full"
                      : ""
                  }`}
                >
                  {(form.header?.templateId || "header-1") === "header-3" ? (
                    form.header?.images?.[0]?.dataUrl ? (
                      <img
                        src={form.header.images[0].dataUrl}
                        alt="banner"
                        className="w-full h-48 sm:h-64 md:h-72 object-cover rounded-xl border border-border"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-64 md:h-72 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60">
                        Full-width image
                      </div>
                    )
                  ) : (form.header?.templateId || "header-1") === "header-5" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1].map((i) =>
                        form.header?.images?.[i]?.dataUrl ? (
                          <img
                            key={i}
                            src={form.header.images[i].dataUrl}
                            alt={`image-${i}`}
                            className="w-full h-40 object-cover rounded-xl border border-border"
                          />
                        ) : (
                          <div
                            key={i}
                            className="w-full h-40 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60"
                          >
                            Image {i + 1}
                          </div>
                        )
                      )}
                    </div>
                  ) : (form.header?.templateId || "header-1") === "header-6" ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((i) =>
                        form.header?.images?.[i]?.dataUrl ? (
                          <img
                            key={i}
                            src={form.header.images[i].dataUrl}
                            alt={`image-${i}`}
                            className="w-full h-36 object-cover rounded-xl border border-border"
                          />
                        ) : (
                          <div
                            key={i}
                            className="w-full h-36 rounded-xl border border-dashed border-border/70 grid place-items-center text-foreground/60"
                          >
                            Image {i + 1}
                          </div>
                        )
                      )}
                    </div>
                  ) : form.header?.backgroundImage?.dataUrl ? (
                    <img
                      src={form.header.backgroundImage.dataUrl}
                      alt="header"
                      className="w-full max-w-[325px] max-h-[325px] rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="w-full max-w-[325px] h-[200px] rounded-xl border border-border/70 bg-white/20 grid place-items-center text-foreground/80">
                      Top-left image
                    </div>
                  )}
                </div>
                <div
                  className={`flex flex-col gap-3 ${
                    (form.header?.templateId || "header-1") === "header-2"
                      ? "order-1"
                      : "order-2"
                  }`}
                >
                  {form.header?.groupName ? (
                    <div
                      className="text-xs font-semibold opacity-85"
                      style={{ color: form.header?.textColor1 || undefined }}
                    >
                      {form.header.groupName}
                    </div>
                  ) : null}
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: form.header?.textColor2 || undefined }}
                  >
                    {form.title || "Smart sign-up"}
                  </h3>
                  {creatorName ? (
                    <div
                      className="flex items-center gap-2 text-xs opacity-85"
                      style={{ color: form.header?.textColor1 || undefined }}
                    >
                      <span
                        className="inline-grid place-items-center h-7 w-7 rounded-full"
                        style={{
                          background: form.header?.buttonColor || "#44AD3C",
                          color: form.header?.buttonTextColor || "#FFF4C7",
                        }}
                      >
                        {initials || "?"}
                      </span>
                      <span>Created by {creatorName}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              {form.description && (
                <p
                  className="mt-3 text-sm max-w-2xl opacity-90"
                  style={{ color: form.header?.textColor1 || undefined }}
                >
                  {form.description}
                </p>
              )}
            </section>
            <section className="event-theme-card px-5 py-4 border-t">
              <p className="text-sm opacity-80">
                This preview reflects the current theme colors. Final layout on
                the event page also shows slots and questions.
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm opacity-90">
                <strong>Related files</strong>
                <span aria-hidden>📎</span>
              </div>
            </section>
          </div>
        </div>
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
