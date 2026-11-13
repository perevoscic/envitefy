"use client";

import { createPortal } from "react-dom";
import { Check, Copy, EllipsisVertical, Move, Pencil, RotateCcw, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { GymnasticsTextPlacement } from "@/lib/gymnastics-page-text";
import InlineTextPositioner, { type InlineTextMoveControls } from "./InlineTextPositioner";
import { useSectionTextField } from "./EventSectionTextContext";
import { useEventPageReadOnly } from "./EventPageReadOnlyContext";
import styles from "./inline-editable-text.module.css";

/** Edits update parent memory immediately; saving the event remains a separate action. */
export default function InlineEditableText({
  label,
  value,
  fallback,
  maxLength = 160,
  multiline = false,
  removable = false,
  onDuplicate,
  onRemove,
  onChange,
  renderText,
  description,
  placement,
  onPlacementChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  maxLength?: number;
  multiline?: boolean;
  removable?: boolean;
  onDuplicate?: (text: string) => void;
  onRemove?: () => void;
  onChange?: (value: string | undefined) => void;
  renderText?: (text: string) => ReactNode;
  description?: string;
  placement?: GymnasticsTextPlacement;
  onPlacementChange?: (value: GymnasticsTextPlacement | undefined) => void;
}) {
  const readOnly = useEventPageReadOnly();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const [touchControls, setTouchControls] = useState(false);
  const canEdit = Boolean(onChange) && !readOnly;
  const sheet = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!canEdit) return;
    const query = matchMedia("(max-width: 767px), (hover: none), (pointer: coarse)");
    const sync = () => setTouchControls(query.matches);
    sync(); query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [canEdit]);
  useEffect(() => {
    if (!selected || readOnly) return;
    const deselect = (event: Event) => {
      if (!interaction.current?.contains(event.target as Node) && !sheet.current?.contains(event.target as Node)) {
        setSelected(false); setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", deselect);
    document.addEventListener("focusin", deselect);
    return () => { document.removeEventListener("pointerdown", deselect); document.removeEventListener("focusin", deselect); };
  }, [selected, readOnly]);
  useLayoutEffect(() => {
    if (menuOpen && touchControls && !readOnly) sheet.current?.showModal();
  }, [menuOpen, touchControls, readOnly]);
  const previousValue = useRef<string | undefined>(undefined);
  const input = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const pencil = useRef<HTMLButtonElement>(null);
  const textButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const interaction = useRef<HTMLSpanElement>(null);
  const descriptionId = useId();
  const toolbarId = useId();
  const sectionEditing = useSectionTextField({ label, value, fallback, maxLength, multiline, onChange }, readOnly);
  useEffect(() => {
    if (editing && !readOnly) {
      input.current?.focus();
      input.current?.select();
    }
  }, [editing, readOnly]);
  useEffect(() => {
    if (!menuOpen || readOnly) return;
    const close = (event: globalThis.PointerEvent) => {
      if (!interaction.current?.contains(event.target as Node) && !sheet.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen, readOnly]);

  const text = value ?? fallback;
  const positionToolbar = () => {
    const element = interaction.current;
    const toolbar = element?.querySelector<HTMLElement>(`[id="${toolbarId}"]`);
    if (touchControls || !element || !toolbar || element.closest("[data-event-navigation-rail]")) return;
    const bounds = element.getBoundingClientRect();
    const canvas = element.closest("[data-text-canvas]")?.getBoundingClientRect();
    let left = Math.max(12, canvas?.left ?? 0), right = Math.min(innerWidth - 12, canvas?.right ?? innerWidth);
    let top = 0, bottom = innerHeight;
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
      if (/auto|scroll|hidden|clip/.test(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
      if (/auto|scroll|hidden|clip/.test(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
    }
    const footer = element.closest("[data-event-page-editor]")?.querySelector("footer[data-bottom-settings]")?.getBoundingClientRect();
    if (footer?.width && footer.height && footer.left < bounds.right && footer.right > bounds.left && footer.bottom >= bottom - 1) bottom = Math.min(bottom, footer.top - 4);
    const center = (bounds.top + bounds.bottom) / 2;
    const inline = matchMedia("(min-width: 640px) and (hover: hover) and (pointer: fine)").matches &&
      bounds.right + toolbar.offsetWidth + 8 <= right && center - toolbar.offsetHeight / 2 >= top && center + toolbar.offsetHeight / 2 <= bottom;
    const x = inline ? bounds.right + 6 : Math.max(left, Math.min(bounds.right - toolbar.offsetWidth, right - toolbar.offsetWidth));
    toolbar.style.setProperty("--toolbar-shift", `${x - bounds.left}px`);
    toolbar.toggleAttribute("data-inline", inline);
    toolbar.toggleAttribute("data-above", !inline && bounds.bottom + toolbar.offsetHeight + 4 > Math.min(bottom, canvas?.bottom ?? bottom));
  };

  useLayoutEffect(() => {
    if (menuOpen && !readOnly) positionToolbar();
  }, [menuOpen, text, editing, readOnly]);

  if (!onChange || readOnly || sectionEditing) {
    const content = renderText ? renderText(text) : text;
    if (sectionEditing) return <span data-section-focus-label={label}>{content}</span>;
    return placement ? (
      <InlineTextPositioner text={text} label={label} placement={placement}>{() => content}</InlineTextPositioner>
    ) : content;
  }

  const finish = () => {
    setEditing(false);
    setMenuOpen(false);
    requestAnimationFrame(() => (textButton.current || (trigger.current?.offsetParent ? trigger.current : pencil.current))?.focus({ preventScroll: true }));
  };
  const cancel = () => {
    onChange(previousValue.current);
    finish();
  };
  const Input = multiline ? "textarea" : "input";
  const dismissOptions = () => {
    setMenuOpen(false);
    requestAnimationFrame(() => (textButton.current || trigger.current)?.focus({ preventScroll: true }));
  };
  const startEditing = () => {
    previousValue.current = value;
    setDraft(text);
    setMenuOpen(false);
    setEditing(true);
  };
  const renderContent = (move?: InlineTextMoveControls) => {
    const actions = <>
      <button ref={pencil} type="button" onClick={startEditing} className={styles.button}
        aria-label={`Edit ${label.toLowerCase()}`} title={`Edit ${label.toLowerCase()}`}>
        <Pencil size={16} aria-hidden="true" /><span>Edit text</span>
      </button>
      {onDuplicate && text ? <button type="button" className={styles.button}
        aria-label={`Duplicate ${label.toLowerCase()}`} title={`Duplicate ${label.toLowerCase()}`}
        onClick={(event) => { onDuplicate(text); setMenuOpen(false); event.currentTarget.blur(); }}>
        <Copy size={16} aria-hidden="true" /><span>Duplicate</span>
      </button> : null}
      {move && text ? <button type="button" className={`${styles.button} ${styles.moveButton}`}
        aria-label={`Move ${label.toLowerCase()}`} title="Drag to move, or use arrow keys"
        onPointerDown={(event) => { if (!touchControls) move.startDrag(event); }}
        onClick={() => { move.beginMove(); setMenuOpen(false); requestAnimationFrame(() => interaction.current?.focus({ preventScroll: true })); }}>
        <Move size={16} aria-hidden="true" /><span>Move</span>
      </button> : null}
      {move?.reset ? <button type="button" className={styles.button}
        aria-label={`Reset ${label.toLowerCase()} position`} title="Reset position"
        onClick={() => { move.reset?.(); setMenuOpen(false); }}>
        <RotateCcw size={16} aria-hidden="true" /><span>Reset position</span>
      </button> : null}
      {removable && text ? <button type="button" className={styles.button}
        aria-label={`Delete ${label.toLowerCase()}`} title={`Delete ${label.toLowerCase()}`}
        onClick={() => { if (onRemove) onRemove(); else onChange(""); setMenuOpen(false); }}>
        <X size={16} aria-hidden="true" /><span>Remove</span>
      </button> : null}
    </>;
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
        aria-describedby={description ? descriptionId : undefined}
        data-preserve-control-colors
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
      {description && (
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      )}
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
    <span
      ref={interaction}
      className={styles.editable}
      data-inline-text-editor=""
      tabIndex={-1}
      data-menu-open={menuOpen || undefined}
      data-selected={selected || undefined}
      data-moving={move?.moving || move?.dragging || undefined}
      onMouseEnter={positionToolbar}
      onFocusCapture={() => { setSelected(true); positionToolbar(); }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !sheet.current?.contains(event.relatedTarget as Node)) setMenuOpen(false);
      }}
      onPointerDown={(event) => {
        if (move?.moving && !(event.target as Element).closest("button")) move.startDrag(event);
      }}
      onKeyDown={(event) => {
        move?.onKeyDown(event);
        if (move?.moving && event.key.startsWith("Arrow")) {
          requestAnimationFrame(() => interaction.current?.focus({ preventScroll: true }));
        }
        if (event.key === "Escape") {
          event.preventDefault(); event.stopPropagation(); setMenuOpen(false);
          (textButton.current || trigger.current)?.focus({ preventScroll: true });
        }
      }}
    >
      {renderText ? renderText(text) : (
        <button ref={textButton} type="button" className={`${styles.view} ${styles.text}`}
          aria-label={`Edit ${label.toLowerCase()} text`}
          onPointerDown={(event) => { if (move?.moving) move.startDrag(event); }}
          onClick={() => {
            if (move?.moving || move?.dragging) return;
            setSelected(true);
            if (touchControls) setMenuOpen(true); else startEditing();
          }}>
          {text || "Add text"}
        </button>
      )}
      <button
        ref={trigger}
        type="button"
        className={styles.mobileTrigger}
        aria-label={`Options for ${label.toLowerCase()}`}
        aria-expanded={menuOpen}
        aria-controls={toolbarId}
        onClick={() => {
          setMenuOpen(!menuOpen);
          requestAnimationFrame(positionToolbar);
        }}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {!touchControls && <span id={toolbarId} className={styles.toolbar} role="group" aria-label={`${label} actions`}
        onPointerDown={(event) => event.preventDefault()}>{actions}</span>}
      {touchControls && menuOpen && createPortal(
        <dialog ref={sheet} className={styles.mobileSheet} aria-labelledby={`${toolbarId}-title`}
          data-appearance-scope="app"
          onCancel={(event) => { event.preventDefault(); dismissOptions(); }}
          onClose={dismissOptions}
          onClick={(event) => { if (event.target === event.currentTarget) dismissOptions(); }}>
          <div className={styles.sheetBody}>
            <header><h2 id={`${toolbarId}-title`}>{label}</h2>
              <button type="button" className={styles.button} aria-label="Close text options" onClick={dismissOptions}><X size={20} /></button>
            </header>
            <div id={toolbarId} role="group" aria-label={`${label} actions`}>{actions}</div>
          </div>
        </dialog>, document.body)}
    </span>
  );
  };
  return onPlacementChange || placement ? (
    <InlineTextPositioner text={text || "Add text"} label={label} placement={placement} onChange={onPlacementChange}
      onMoveEnd={() => setMenuOpen(false)}>
      {renderContent}
    </InlineTextPositioner>
  ) : renderContent();
}
