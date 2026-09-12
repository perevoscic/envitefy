"use client";

import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./inline-editable-text.module.css";

/** Edits update parent memory immediately; saving the event remains a separate action. */
export default function InlineEditableText({
  label,
  value,
  fallback,
  maxLength = 160,
  multiline = false,
  onChange,
  renderText,
}: {
  label: string;
  value?: string;
  fallback: string;
  maxLength?: number;
  multiline?: boolean;
  onChange?: (value: string | undefined) => void;
  renderText?: (text: string) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const previousValue = useRef<string | undefined>(undefined);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const pencil = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing]);

  const text = value ?? fallback;
  if (!onChange) return renderText ? renderText(text) : text;

  const finish = () => {
    setEditing(false);
    requestAnimationFrame(() => pencil.current?.focus({ preventScroll: true }));
  };
  const cancel = () => {
    onChange(previousValue.current);
    finish();
  };
  const Input = multiline ? "textarea" : "input";

  return editing ? (
    <span
      className={styles.editing}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false);
      }}
    >
      <Input
        ref={(element: HTMLInputElement | HTMLTextAreaElement | null) => {
          input.current = element;
        }}
        aria-label={label}
        className={styles.input}
        value={draft}
        maxLength={maxLength}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (
            (event.key === "Enter" && (!multiline || event.ctrlKey || event.metaKey)) ||
            event.key === "Escape"
          ) {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === "Escape") cancel();
            else finish();
          }
        }}
      />
      <span className={styles.actions}>
        <button
          type="button"
          onClick={finish}
          className={styles.button}
          aria-label={`Done editing ${label.toLowerCase()}`}
          title="Done"
        >
          <Check size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className={styles.button}
          aria-label={`Cancel editing ${label.toLowerCase()}`}
          title="Cancel"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(undefined);
            finish();
          }}
          className={styles.button}
          aria-label={`Reset ${label.toLowerCase()} to template wording`}
          title="Reset to template wording"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </span>
    </span>
  ) : (
    <span className={styles.editable}>
      {renderText ? renderText(text) : <span className={styles.text}>{text || "Add text"}</span>}
      <button
        ref={pencil}
        type="button"
        onClick={() => {
          previousValue.current = value;
          setDraft(text);
          setEditing(true);
        }}
        className={styles.button}
        aria-label={`Edit ${label.toLowerCase()}`}
        title={`Edit ${label.toLowerCase()}`}
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
    </span>
  );
}
