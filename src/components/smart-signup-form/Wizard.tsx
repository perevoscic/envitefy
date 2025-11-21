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

const STEP_CONFIG = [
  {
    id: "basics",
    title: "Event Basics",
    subtitle: "Tell us about your event",
    description: "Start with the essentials—what, when, and where",
    color: "from-cyan-400 to-blue-500",
    lightBg: "bg-gradient-to-br from-cyan-50 to-blue-50",
  },
  {
    id: "settings",
    title: "Smart Settings",
    subtitle: "Configure your sign-up",
    description: "Set capacity, deadlines, and preferences",
    color: "from-purple-400 to-pink-500",
    lightBg: "bg-gradient-to-br from-purple-50 to-pink-50",
  },
  {
    id: "sections",
    title: "Build Form",
    subtitle: "Create sections & questions",
    description: "Customize what information you need to collect",
    color: "from-amber-400 to-orange-500",
    lightBg: "bg-gradient-to-br from-amber-50 to-orange-50",
  },
  {
    id: "preview",
    title: "Launch",
    subtitle: "Preview & publish",
    description: "Review your sign-up form before sharing it",
    color: "from-emerald-400 to-teal-500",
    lightBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
  },
] as const;

type StepKey = 0 | 1 | 2 | 3;

export default function SmartSignupWizard({
  form,
  onChange,
  onSubmit,
  submitting,
}: Props) {
  const [step, setStep] = useState<StepKey>(0);
  const [showBasicsErrors, setShowBasicsErrors] = useState(false);
  const { data: session } = useSession();

  const theme = useMemo(
    () => getEventTheme((form.description || form.title || "") as string),
    [form.title, form.description]
  );

  const currentStep = STEP_CONFIG[step];
  const progress = ((step + 1) / STEP_CONFIG.length) * 100;

  const next = () => {
    if (step === 0) {
      const address = (form as any).location as string | undefined;
      const missingAddress = !address || !address.trim();
      if (missingAddress) {
        setShowBasicsErrors(true);
        return;
      }
      setShowBasicsErrors(false);
    }
    setStep((s) => (s < 3 ? ((s + 1) as StepKey) : s));
  };

  const prev = () => setStep((s) => (s > 0 ? ((s - 1) as StepKey) : s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div
          className={`absolute inset-0 opacity-[0.03] transition-all duration-700 ${currentStep.lightBg}`}
        />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Compact header with progress */}
        <div className="space-y-3">
          {/* Step indicator and percentage */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              Step {step + 1} of {STEP_CONFIG.length}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>

          {/* Clean progress bar */}
          <div className="relative h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full bg-gradient-to-r ${currentStep.color} transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              {currentStep.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {currentStep.description}
            </p>
          </div>
        </div>
        {/* Direct content - no extra wrapper */}
        <div className="min-h-[400px]">
          {step === 0 && (
            <SignupBuilder
              form={form}
              onChange={onChange}
              showBasicsErrors={showBasicsErrors}
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
        </div>
        {/* Clean action buttons */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="group inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className={`group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${currentStep.color} px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl`}
            >
              Continue
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit as any}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Publishing...
                </>
              ) : (
                <>
                  Publish Sign-Up
                  <span className="text-base">🎉</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
