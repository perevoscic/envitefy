"use client";

import { X } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { pickNextRandomPhrase } from "@/components/event-create/gym-discovery-status-phrases";
import styles from "./discovery-progress-panel.module.css";

export type DiscoveryProgressTheme = {
  badgeBackground: string;
  badgeBorder: string;
  baseBackground: string;
  borderColor: string;
  cancelBackground?: string;
  cancelBorderColor: string;
  cancelHoverBackground: string;
  cancelTextColor: string;
  fillEnd: string;
  fillMiddle: string;
  fillStart: string;
  textColor: string;
};

type DiscoveryProgressPanelProps = {
  cancelDisabled?: boolean;
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

export default function DiscoveryProgressPanel({
  cancelDisabled = false,
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
  const clampedProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : 0;

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
    <div className={`space-y-3 ${styles.panel}`}>
      <div className={styles.loader}>
        <div className={styles.labelStage} aria-hidden="true">
          <p key={statusText} className={styles.label}>
            {statusText.split(" ").map((word, wordIndex) => (
              <span key={wordIndex} className={styles.word}>
                {Array.from(word).map((character, index) => (
                  <span
                    key={index}
                    className={styles.letter}
                    style={{ "--letter-delay": `${0.18 + Math.min(wordIndex * 4 + index, 16) * 0.035}s` } as CSSProperties}
                  >
                    {character}
                  </span>
                ))}
                {" "}
              </span>
            ))}
          </p>
        </div>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {statusText}
        </span>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={cancelLabel === "Cancel upload" ? "Upload progress" : "Import progress"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={indeterminate ? undefined : clampedProgress}
          aria-valuetext={indeterminate ? statusText : `${clampedProgress}% – ${statusText}`}
        >
          <div
            className={`${styles.fill} ${indeterminate ? styles.indeterminate : ""}`}
            style={{ width: indeterminate ? "38%" : `${clampedProgress}%` }}
          >
            <div ref={animRef} className={styles.sheen} />
          </div>
        </div>
        {showDetails ? (
          <div className={styles.details}>
            <span>{expectation || "Building an editable draft"}</span>
            <span className="shrink-0 tabular-nums">{elapsedSeconds}s elapsed</span>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        disabled={cancelDisabled}
        onClick={onCancel}
        className={`discovery-progress-cancel ${styles.cancel} inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-xs font-semibold transition`}
        style={
          {
            "--cancel-hover-background": theme.cancelHoverBackground,
            backgroundColor: theme.cancelBackground,
            borderColor: theme.cancelBorderColor,
            color: theme.cancelTextColor,
          } as CSSProperties
        }
      >
        <X aria-hidden="true" className="h-3.5 w-3.5" />
        {cancelLabel}
      </button>
    </div>
  );
}
