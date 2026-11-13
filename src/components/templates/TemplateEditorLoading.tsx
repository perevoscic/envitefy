"use client";

import { type CSSProperties, type ReactNode, useMemo, useSyncExternalStore } from "react";
import styles from "./template-editor.module.css";

export const TEMPLATE_LOADING_PHRASES = [
  "Hang tight…",
  "Wrangling the confetti…",
  "Almost there…",
  "Polishing the pixels…",
  "Warming up the wow…",
  "Rolling out the fun…",
  "Adding a little sparkle…",
  "One tiny drumroll…",
  "Party mode: loading…",
  "Making room for magic…",
] as const;

const initialSequence = { index: 0, previousIndex: null as number | null, round: 0, startedAt: 0 };
let sequence = initialSequence;
let remaining: number[] = [];
const listeners = new Set<() => void>();
let resetTimer: ReturnType<typeof setTimeout> | undefined;

function nextPhrase() {
  if (!remaining.length) {
    remaining = TEMPLATE_LOADING_PHRASES.map((_, index) => index);
    for (let index = remaining.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [remaining[index], remaining[other]] = [remaining[other], remaining[index]];
    }
    // Start another shuffled round without repeating its previous last phrase.
    if (sequence.round && remaining.at(-1) === sequence.index) {
      [remaining[0], remaining[remaining.length - 1]] = [
        remaining[remaining.length - 1],
        remaining[0],
      ];
    }
  }
  sequence = {
    index: remaining.pop()!,
    previousIndex: sequence.round ? sequence.index : null,
    round: sequence.round + 1,
    startedAt: performance.now(),
  };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  clearTimeout(resetTimer);
  listeners.add(listener);
  if (!sequence.round) nextPhrase();
  return () => {
    listeners.delete(listener);
    // Access, draft and module fallbacks can hand off in the same React commit.
    // Retain the current phrase and its elapsed roll through that handoff.
    if (!listeners.size)
      resetTimer = setTimeout(() => {
        if (listeners.size) return;
        remaining = [];
        sequence = initialSequence;
      }, 0);
  };
}

function finishRoll(round: number) {
  if (
    round !== sequence.round ||
    !listeners.size ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  nextPhrase();
}

const getSequence = () => sequence;
const getServerSequence = () => initialSequence;
const subscribeInactive = () => () => {};

/** One loading presentation for access, draft hydration and lazy editor code. */
export default function TemplateEditorLoading({
  error = false,
  viewport = false,
  children,
}: {
  error?: boolean;
  viewport?: boolean;
  children?: ReactNode;
}) {
  const current = useSyncExternalStore(
    error ? subscribeInactive : subscribe,
    getSequence,
    getServerSequence,
  );
  const message = TEMPLATE_LOADING_PHRASES[current.index];
  const previousMessage =
    current.previousIndex === null ? "" : TEMPLATE_LOADING_PHRASES[current.previousIndex];
  const faces = [
    ...(previousMessage ? [{ face: "out" as const, text: previousMessage }] : []),
    { face: "in" as const, text: message },
  ];
  const lastFace = previousMessage.length > message.length ? "out" : "in";
  const elapsed = useMemo(
    () => (current.round ? Math.max(0, performance.now() - current.startedAt) / 1000 : 0),
    [current],
  );
  return (
    <div
      className={viewport ? `${styles.opening} ${styles.openingViewport}` : styles.opening}
      data-template-editor-loading="true"
      data-loading-message={error ? undefined : message}
      data-loading-previous-message={error || !previousMessage ? undefined : previousMessage}
      data-loading-round={error ? undefined : current.round}
      role="status"
      aria-atomic="true"
    >
      {!error && (
        <div className={styles.openingIllustration} aria-hidden="true">
          <div className={styles.openingCard}>
            <div className={styles.openingCardContent}>
              <div className={styles.openingArtwork}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  focusable="false"
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M16 3v4M8 3v4M3 11h18M8 15h3M8 18h7" />
                </svg>
              </div>
              <div className={styles.openingLines}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.openingCopy}>
        <p className={styles.openingTitle}>
          {error ? (
            "Your draft could not be opened."
          ) : (
            <>
              <span key={current.round} className={styles.openingRoll} aria-hidden="true">
                {faces.map(({ face, text }) => (
                  <span key={face} className={styles.openingRollLayer} data-loading-face={face}>
                    {text.split(" ").map((word, wordIndex, words) => (
                      <span key={wordIndex}>
                        {wordIndex > 0 && " "}
                        <span className={styles.openingWord}>
                          {Array.from(word).map((letter, letterIndex) => (
                            <span
                              key={letterIndex}
                              className={styles.openingLetter}
                              style={
                                {
                                  "--opening-letter-delay": `${(words.slice(0, wordIndex).join(" ").length + (wordIndex > 0 ? 1 : 0) + letterIndex) * 0.1 - elapsed}s`,
                                } as CSSProperties
                              }
                            >
                              <span
                                className={
                                  face === "in" ? styles.openingLetterIn : styles.openingLetterOut
                                }
                                onAnimationEnd={
                                  face === lastFace &&
                                  wordIndex === words.length - 1 &&
                                  letterIndex === Array.from(word).length - 1
                                    ? () => finishRoll(current.round)
                                    : undefined
                                }
                              >
                                {letter}
                              </span>
                              <span className={styles.openingLetterMeasure}>{letter}</span>
                            </span>
                          ))}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
              <span className={styles.openingAccessibleText}>Opening your template…</span>
            </>
          )}
        </p>
      </div>
      {children}
    </div>
  );
}
