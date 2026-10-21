"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import type { LiveCardForm } from "@/lib/livecard-builder";
import styles from "./livecard-builder.module.css";

type CardText = Pick<LiveCardForm, "title" | "headlineIntro">;

export default function CardTextDialog({
  initialText,
  hasArtwork,
  onApply,
  onClose,
  onReturnFocus,
}: {
  initialText: CardText;
  hasArtwork: boolean;
  onApply: (text: CardText) => void;
  onClose: () => void;
  onReturnFocus: () => void;
}) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.cardTextOverlay} />
        <Dialog.Content
          className={styles.cardTextDialog}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onReturnFocus();
          }}
        >
          <Dialog.Title className={styles.cardTextHeading}>Edit card text</Dialog.Title>
          <Dialog.Description className={styles.hint}>
            Edit the title and optional line above it.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button type="button" className={styles.cardTextClose} aria-label="Close card text editor">
              <X size={20} aria-hidden="true" />
            </button>
          </Dialog.Close>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.title.trim()) {
                setError("Add an event title.");
                titleRef.current?.focus();
                return;
              }
              onApply(text);
            }}
          >
            <div className={styles.formStack}>
              <div className={styles.field}>
                <label htmlFor="card-text-title">Event title</label>
                <input
                  ref={titleRef}
                  id="card-text-title"
                  value={text.title}
                  maxLength={300}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "card-text-title-error" : undefined}
                  onChange={(event) => {
                    setText((current) => ({ ...current, title: event.target.value }));
                    setError("");
                  }}
                />
                {error && <p id="card-text-title-error" className={styles.fieldError} role="alert">{error}</p>}
              </div>
              <div className={styles.field}>
                <label htmlFor="card-text-opening">Opening line (optional)</label>
                <input
                  id="card-text-opening"
                  value={text.headlineIntro}
                  maxLength={300}
                  placeholder="You're invited"
                  onChange={(event) => setText((current) => ({ ...current, headlineIntro: event.target.value }))}
                />
              </div>
            </div>
            {hasArtwork && <p className={styles.hint}>After changing these words, use Update card text to refresh the artwork.</p>}
            <div className={styles.cardTextActions}>
              <Dialog.Close asChild><button type="button" className={styles.secondary}>Cancel</button></Dialog.Close>
              <button type="submit" className={styles.primary}>Done</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
