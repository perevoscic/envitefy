"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronRight, RefreshCw, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { reviewSourceChanges, type SourceChange } from "@/lib/event-source-updates";
import type { EventPageEditorSession } from "./useEventPageEditor";
import styles from "./event-editor.module.css";

type CheckResult = {
  previous?: Record<string, any>;
  incoming: Record<string, any>;
  checkedAt: string;
  warnings: string[];
};
const readable = (value: any): string => {
  if (value == null || value === "") return "None";
  if (Array.isArray(value)) return value.map(readable).join("\n");
  if (typeof value === "object")
    return Object.entries(value)
      .filter(([key]) => !["id", "source", "importSources", "enabled"].includes(key))
      .map(([key, item]) => `${key.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${readable(item)}`)
      .join("\n");
  return String(value);
};

export default function EventSourceUpdates({ editor }: { editor: EventPageEditorSession }) {
  const updates = editor.sourceUpdates;
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckResult>();
  const [changes, setChanges] = useState<SourceChange[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ended, setEnded] = useState(false);
  const [clock, tick] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const descriptionId = useId();
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort();
    setOpen(false);
    setChecking(false);
    setResult(undefined);
    setEnded(false);
  }, [editor.eventId]);
  useEffect(() => {
    const timer = window.setInterval(() => tick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  // Reading the latest editor session after each tick also updates date-only cutoffs.
  void clock;
  if (!updates || !editor.eventId || !editor.authenticated) return null;
  const unavailable = ended || updates.ended || updates.isEnded();
  let sourceWebsite = "your original event link";
  try {
    sourceWebsite = new URL(updates.url).hostname.replace(/^www\./, "");
  } catch { /* Keep the generic source label if an older record has no valid URL. */ }
  const check = async () => {
    controller.current?.abort();
    const attempt = new AbortController();
    controller.current = attempt;
    setOpen(true);
    setChecking(true);
    setError("");
    setResult(undefined);
    setChanges([]);
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(editor.eventId!)}/source-updates`,
        { method: "POST", credentials: "include", signal: attempt.signal },
      );
      const body = await response.json();
      if (attempt.signal.aborted) return;
      if (!response.ok) {
        if (body.ended) setEnded(true);
        throw new Error(body.error || "The source could not be checked. Your event is unchanged.");
      }
      const next = reviewSourceChanges(body.previous, updates.current(), body.incoming);
      setResult(body);
      setChanges(next);
      setSelected(
        new Set(
          next
            .filter((change) => !change.conflict && change.kind !== "removed")
            .map((change) => change.id),
        ),
      );
    } catch (failure) {
      if (!attempt.signal.aborted)
        setError(
          failure instanceof Error
            ? failure.message
            : "The source could not be checked. Your event is unchanged.",
        );
    } finally {
      if (!attempt.signal.aborted) setChecking(false);
    }
  };
  const apply = () => {
    if (!result) return;
    try {
      updates.apply(
        changes.filter((change) => selected.has(change.id)),
        result.previous,
        result.checkedAt,
        result.incoming,
      );
      setOpen(false);
      setResult(undefined);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The event changed. Check for updates again.",
      );
    }
  };
  const close = (value: boolean) => {
    if (!value) {
      controller.current?.abort();
      setChecking(false);
    }
    setOpen(value);
  };
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`${styles.menuCard} ${styles.sourceCheckButton}`}
        data-source-updates
        aria-label="Check original link for updates"
        aria-describedby={descriptionId}
        onClick={() => void check()}
        disabled={unavailable || editor.busy || !editor.ready}
      >
        <span className={styles.menuIcon} aria-hidden="true"><RefreshCw size={20} /></span>
        <span className={styles.menuText}>
          <strong>Check original link for updates</strong>
          <span id={descriptionId} className={styles.menuDescription}>Review new information from {sourceWebsite}.</span>
          {unavailable && <span>Updates are available until the event ends.</span>}
          {(result?.checkedAt || updates.lastCheckedAt) && <span>
            Last checked: {new Date(result?.checkedAt || updates.lastCheckedAt!).toLocaleString()}
          </span>}
        </span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
      <Dialog.Root open={open} onOpenChange={close}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.sourceOverlay} />
          <Dialog.Content
            className={styles.sourceDialog}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
            onOpenAutoFocus={(event) => {
              if (checking) {
                event.preventDefault();
                document.getElementById("source-check-cancel")?.focus();
              }
            }}
          >
            <header className={styles.sourceDialogHeader}>
              <div>
                <Dialog.Title>
                  {checking ? "Checking for updates…" : "Review source updates"}
                </Dialog.Title>
                <Dialog.Description>
                  Choose what to apply. Your changes stay in the editor until you save.
                </Dialog.Description>
              </div>
              <Dialog.Close className={styles.sourceClose} aria-label="Close source updates">
                <X size={20} aria-hidden="true" />
              </Dialog.Close>
            </header>
            <div className={styles.sourceDialogBody}>
              <a href={updates.url} target="_blank" rel="noopener noreferrer">
                Open original source
              </a>
              {checking && (
                <p role="status">
                  Reading the event source and relevant documents. This may take a few minutes.
                </p>
              )}
              {error && <p role="alert">{error}</p>}
              {result?.warnings.length ? (
                <div role="status">
                  <strong>Some sources could not be checked completely.</strong>
                  <ul>
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                  <p>Existing information is preserved.</p>
                </div>
              ) : null}
              {result && !changes.length && (
                <p role="status">
                  {result.warnings.length
                    ? "No changes found in the sources that were read. Other sources remain unverified."
                    : "No changes found."}
                </p>
              )}
              {changes.map((change) => (
                <article key={change.id} className={styles.sourceChange}>
                  <label className={styles.sourceChoice}>
                    <input
                      type="checkbox"
                      checked={selected.has(change.id)}
                      disabled={change.kind === "removed" || change.manualReview}
                      onChange={(event) =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(change.id);
                          else next.delete(change.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <strong>{change.label}</strong>
                      <small>
                        {change.manualReview
                          ? "Rows could not be matched reliably · Edit this collection manually"
                          : change.kind === "removed"
                            ? "Missing from source · Kept in your event"
                            : change.conflict
                              ? "You edited this · Select to use the source value"
                              : change.kind === "added"
                                ? "New information"
                                : "Source updated"}
                      </small>
                    </span>
                  </label>
                  <div className={styles.sourceComparison}>
                    <div>
                      <strong>Your event</strong>
                      <p>{readable(change.before)}</p>
                    </div>
                    <div>
                      <strong>Latest source</strong>
                      <p>
                        {change.kind === "removed"
                          ? "Not found in this check"
                          : readable(change.after)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <footer className={styles.sourceDialogFooter}>
              <Dialog.Close id="source-check-cancel">
                {checking ? "Cancel check" : "Close"}
              </Dialog.Close>
              {!checking && error && (
                <button type="button" onClick={() => void check()} disabled={unavailable}>
                  Check again
                </button>
              )}
              {result && changes.length > 0 && (
                <button
                  type="button"
                  onClick={apply}
                  disabled={!selected.size || editor.busy || unavailable}
                >
                  Apply selected ({selected.size})
                </button>
              )}
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
