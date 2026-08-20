"use client";

import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { pickNextRandomPhrase } from "@/components/event-create/gym-discovery-status-phrases";

export type DiscoveryProgressTheme = {
  badgeBackground: string;
  badgeBorder: string;
  baseBackground: string;
  borderColor: string;
  cancelBorderColor: string;
  cancelHoverBackground: string;
  cancelTextColor: string;
  fillEnd: string;
  fillMiddle: string;
  fillStart: string;
  textColor: string;
};

type DiscoveryProgressPanelProps = {
  cancelLabel: string;
  expectation?: string;
  indeterminate?: boolean;
  label: string;
  onCancel: () => void;
  progress: number;
  /** When set, status line cycles a random phrase on each bar animation loop instead of `label`. */
  rotatingStatusPhrases?: readonly string[];
  showDetails?: boolean;
  theme: DiscoveryProgressTheme;
};

const MINIMUM_VISIBLE_PROGRESS = 14;

export default function DiscoveryProgressPanel({
  cancelLabel,
  expectation,
  indeterminate = false,
  label,
  onCancel,
  progress,
  rotatingStatusPhrases,
  showDetails = true,
  theme,
}: DiscoveryProgressPanelProps) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const visibleProgress = indeterminate
    ? 100
    : clampedProgress > 0
      ? Math.max(MINIMUM_VISIBLE_PROGRESS, clampedProgress)
      : MINIMUM_VISIBLE_PROGRESS;

  const useRotation = Boolean(rotatingStatusPhrases?.length);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [displayPhrase, setDisplayPhrase] = useState(() =>
    rotatingStatusPhrases?.length ? pickNextRandomPhrase(rotatingStatusPhrases, null) : "",
  );
  const animRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rotatingStatusPhrases?.length) return;
    const el = animRef.current;
    if (!el) return;
    const onIter = () => {
      setDisplayPhrase((cur) => pickNextRandomPhrase(rotatingStatusPhrases, cur));
    };
    el.addEventListener("animationiteration", onIter);
    return () => el.removeEventListener("animationiteration", onIter);
  }, [indeterminate, rotatingStatusPhrases]);

  useEffect(() => {
    if (!showDetails) return;
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [showDetails]);

  const statusText = useRotation ? displayPhrase : label;

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border shadow-[0_14px_30px_rgba(15,25,53,0.12)]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          backgroundColor: theme.baseBackground,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        />
        <div
          className={`absolute inset-y-0 left-0 overflow-hidden ${
            indeterminate ? "" : "transition-[width] duration-500 ease-out"
          }`}
          style={{ width: `${visibleProgress}%` }}
        >
          <div
            ref={animRef}
            className={`h-full w-full ${
              indeterminate ? "launcher-progress-indeterminate" : "launcher-progress-shimmer"
            }`}
            style={{
              backgroundImage: `linear-gradient(90deg, ${theme.fillStart} 0%, ${theme.fillMiddle} 58%, ${theme.fillEnd} 100%)`,
              backgroundSize: "200% 100%",
            }}
          />
        </div>
        <div className="relative px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold" style={{ color: theme.textColor }}>
              {statusText}
            </p>
            <span
              className="shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{
                backgroundColor: theme.badgeBackground,
                borderColor: theme.badgeBorder,
                color: theme.textColor,
              }}
            >
              {indeterminate ? "Live" : `${clampedProgress}%`}
            </span>
          </div>
          {showDetails ? (
            <div
              className="mt-2 flex items-center justify-between gap-3 text-[10px] font-medium opacity-75"
              style={{ color: theme.textColor }}
            >
              <span>{expectation || "Building an editable draft"}</span>
              <span className="shrink-0 tabular-nums">{elapsedSeconds}s elapsed</span>
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="discovery-progress-cancel inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-semibold transition"
        style={
          {
            "--cancel-hover-background": theme.cancelHoverBackground,
            borderColor: theme.cancelBorderColor,
            color: theme.cancelTextColor,
          } as CSSProperties
        }
      >
        <X className="h-3.5 w-3.5" />
        {cancelLabel}
      </button>
      <style jsx>{`
        @keyframes launcher-progress-shimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes launcher-progress-indeterminate {
          0% {
            background-position: 200% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .launcher-progress-shimmer {
          animation: launcher-progress-shimmer 2.2s ease-in-out infinite;
        }
        .launcher-progress-indeterminate {
          animation: launcher-progress-indeterminate 1.2s ease-in-out infinite alternate;
        }
        .discovery-progress-cancel:hover {
          background-color: var(--cancel-hover-background);
        }
      `}</style>
    </div>
  );
}
