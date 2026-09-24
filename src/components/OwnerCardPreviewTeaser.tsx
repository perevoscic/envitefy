"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import styles from "./OwnerCardPreviewTeaser.module.css";

const HINT_KEY = "envitefy:owner-card-swipe-hint:v1";
let hintSeenInMemory = false;

export default function OwnerCardPreviewTeaser({
  imageUrl,
  previewOpen,
  triggerRef,
  onOpen,
}: {
  imageUrl: string;
  previewOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    );
    let timer = 0;
    const stop = () => {
      window.clearTimeout(timer);
      setShowHint(false);
    };
    const schedule = () => {
      stop();
      if (previewOpen || !media.matches || hintSeenInMemory) return;
      try {
        if (localStorage.getItem(HINT_KEY)) return;
      } catch {
        /* The visible teaser also works without browser storage. */
      }
      timer = window.setTimeout(() => {
        if (document.hidden) return;
        hintSeenInMemory = true;
        try {
          localStorage.setItem(HINT_KEY, "seen");
        } catch {
          /* Use the in-memory fallback. */
        }
        setShowHint(true);
      }, 900);
    };
    schedule();
    media.addEventListener("change", schedule);
    document.addEventListener("pointerdown", stop, { passive: true });
    document.addEventListener("keydown", stop);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", schedule);
      document.removeEventListener("pointerdown", stop);
      document.removeEventListener("keydown", stop);
    };
  }, [previewOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-owner-card-teaser
        aria-label="View Live Card"
        aria-haspopup="dialog"
        onClick={onOpen}
        className={styles.teaser}
      >
        <span className={styles.thumbnail}>
          <img src={imageUrl} alt="" draggable={false} />
        </span>
        <span className={styles.copy}>
          <span className={styles.title}>View Live Card</span>
          <span className={styles.hint}>Tap or swipe left to view</span>
        </span>
        <ArrowRight size={20} className={styles.arrow} aria-hidden="true" />
      </button>
      {showHint && !previewOpen
        ? createPortal(
            <div
              className={styles.peek}
              aria-hidden="true"
              onAnimationEnd={() => setShowHint(false)}
            >
              <img src={imageUrl} alt="" draggable={false} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
