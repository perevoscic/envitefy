"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GymnasticsTextPlacement } from "@/lib/gymnastics-page-text";
import styles from "./inline-editable-text.module.css";

type Point = { x: number; y: number };
type Geometry = {
  canvas: HTMLElement;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
  device: "desktop" | "mobile";
  style: CSSProperties;
};
export type InlineTextMoveControls = {
  moving: boolean;
  dragging: boolean;
  beginMove: () => void;
  startDrag: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  reset?: () => void;
};
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Keep a natural placeholder, but place moved text above the entire event canvas. */
export default function InlineTextPositioner({
  text, label, placement, onChange, onMoveEnd, children,
}: {
  text: string;
  label: string;
  placement?: GymnasticsTextPlacement;
  onChange?: (value: GymnasticsTextPlacement | undefined) => void;
  onMoveEnd?: () => void;
  children: (controls?: InlineTextMoveControls) => ReactNode;
}) {
  const anchor = useRef<HTMLSpanElement>(null);
  const floatingElement = useRef<HTMLSpanElement>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [live, setLive] = useState<Point | null>(null);
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const gesture = useRef<{ cancel: () => void } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const source = anchor.current;
    const canvas = source?.closest<HTMLElement>("[data-text-canvas]");
    if (!source || !canvas) return;
    const measure = () => {
      const bounds = source.getBoundingClientRect();
      const canvasBounds = canvas.getBoundingClientRect();
      if (!bounds.width || !canvasBounds.width) return;
      const scale = canvasBounds.width / canvas.clientWidth;
      const computed = getComputedStyle(source);
      let opacity = 1;
      for (let parent = source.parentElement; parent && parent !== canvas; parent = parent.parentElement) {
        opacity *= Number(getComputedStyle(parent).opacity);
      }
      const next: Geometry = {
        canvas, width: Math.min(bounds.width / scale, canvas.clientWidth), height: bounds.height / scale,
        canvasWidth: canvas.clientWidth, canvasHeight: canvas.clientHeight,
        device: canvas.clientWidth < 640 ? "mobile" : "desktop",
        style: {
          fontFamily: computed.fontFamily, fontSize: computed.fontSize, fontWeight: computed.fontWeight,
          fontStyle: computed.fontStyle, lineHeight: computed.lineHeight, letterSpacing: computed.letterSpacing,
          textTransform: computed.textTransform as CSSProperties["textTransform"],
          textAlign: computed.textAlign as CSSProperties["textAlign"], color: computed.color, opacity,
        },
      };
      setGeometry(previous => previous && previous.canvas === canvas &&
        JSON.stringify({ ...previous, canvas: null }) === JSON.stringify({ ...next, canvas: null }) ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(source);
    observer.observe(canvas);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [text]);

  useEffect(() => () => gesture.current?.cancel(), []);
  useEffect(() => {
    if (!moving) return;
    const leave = (event: globalThis.PointerEvent) => {
      const target = event.target as Node;
      if (!anchor.current?.contains(target) && !floatingElement.current?.contains(target)) setMoving(false);
    };
    document.addEventListener("pointerdown", leave);
    return () => document.removeEventListener("pointerdown", leave);
  }, [moving]);
  useEffect(() => {
    if (!onChange) {
      gesture.current?.cancel();
      setMoving(false);
      setLive(null);
    }
  }, [Boolean(onChange)]);

  const point = live ?? (geometry ? placement?.[geometry.device] : undefined);
  const origin = (): Point => {
    if (point) return point;
    if (!geometry || !anchor.current) return { x: 0, y: 0 };
    const bounds = anchor.current.getBoundingClientRect();
    const canvas = geometry.canvas.getBoundingClientRect();
    const scale = canvas.width / geometry.canvas.clientWidth;
    return {
      x: clamp((bounds.left - canvas.left) / scale / Math.max(1, geometry.canvasWidth - geometry.width)),
      y: clamp((bounds.top - canvas.top) / scale / Math.max(1, geometry.canvasHeight - geometry.height)),
    };
  };
  const commit = (next: Point) => {
    if (!geometry || !onChange) return;
    onChange({ ...placement, [geometry.device]: next });
    setStatus("Position updated. Save to keep it.");
  };
  const controls: InlineTextMoveControls | undefined = onChange ? {
    moving, dragging,
    beginMove: () => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      setMoving(true);
      setStatus("Drag the text to move it. Arrow keys move it too; Escape finishes.");
    },
    startDrag: (event) => {
      if (!geometry || event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      event.stopPropagation();
      gesture.current?.cancel();
      const initial = origin();
      const startX = event.clientX, startY = event.clientY;
      const canvasBounds = geometry.canvas.getBoundingClientRect();
      const scale = canvasBounds.width / geometry.canvas.clientWidth;
      const grabX = (event.clientX - canvasBounds.left) / scale - initial.x * (geometry.canvasWidth - geometry.width);
      const grabY = (event.clientY - canvasBounds.top) / scale - initial.y * (geometry.canvasHeight - geometry.height);
      let latest = initial, changed = false, clientX = event.clientX, clientY = event.clientY;
      let frame = 0;
      const pointerId = event.pointerId;
      const canvas = geometry.canvas;
      canvas.setPointerCapture(pointerId);
      setDragging(true);
      const update = () => {
        const bounds = canvas.getBoundingClientRect();
        const factor = bounds.width / canvas.clientWidth;
        latest = {
          x: clamp(((clientX - bounds.left) / factor - grabX) / Math.max(1, canvas.clientWidth - geometry.width)),
          y: clamp(((clientY - bounds.top) / factor - grabY) / Math.max(1, canvas.clientHeight - geometry.height)),
        };
        setLive(latest);
      };
      const move = (next: globalThis.PointerEvent) => {
        if (next.pointerId !== pointerId) return;
        next.preventDefault();
        clientX = next.clientX; clientY = next.clientY;
        changed ||= Math.hypot(clientX - startX, clientY - startY) > 3;
        if (changed) update();
      };
      let scroller: HTMLElement | null = canvas.parentElement;
      while (scroller && !(scroller.scrollHeight > scroller.clientHeight && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) scroller = scroller.parentElement;
      const scroll = () => {
        const bounds = scroller?.getBoundingClientRect();
        const top = bounds ? Math.max(0, bounds.top) : 0;
        const bottom = bounds ? Math.min(innerHeight, bounds.bottom) : innerHeight;
        const delta = clientY < top + 48 ? -12 : clientY > bottom - 48 ? 12 : 0;
        if (delta && changed) {
          if (scroller) scroller.scrollTop += delta;
          else window.scrollBy(0, delta);
          update();
        }
        frame = requestAnimationFrame(scroll);
      };
      const cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);
        window.removeEventListener("blur", cancel);
        window.removeEventListener("keydown", escape, true);
        if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
        gesture.current = null;
      };
      const cancel = () => { cleanup(); setLive(null); setDragging(false); setMoving(false); onMoveEnd?.(); };
      const finish = (next: globalThis.PointerEvent) => {
        if (next.pointerId !== pointerId) return;
        cleanup();
        if (changed) {
          commit(latest); suppressClick.current = true;
          setTimeout(() => { suppressClick.current = false; }, 0);
        }
        setLive(null); setDragging(false); setMoving(!changed);
        onMoveEnd?.();
        if (!changed) setStatus("Drag the text to move it. Arrow keys move it too; Escape finishes.");
        requestAnimationFrame(() => (floatingElement.current ?? anchor.current)?.querySelector<HTMLElement>("[data-inline-text-editor]")?.focus({ preventScroll: true }));
      };
      const escape = (next: globalThis.KeyboardEvent) => {
        if (next.key === "Escape") { next.preventDefault(); next.stopPropagation(); cancel(); }
      };
      gesture.current = { cancel };
      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", cancel);
      window.addEventListener("blur", cancel);
      window.addEventListener("keydown", escape, true);
      frame = requestAnimationFrame(scroll);
    },
    onKeyDown: (event) => {
      if (event.key === "Escape") {
        gesture.current?.cancel(); setMoving(false); setLive(null);
      }
      if (!moving || !geometry || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const base = origin(), step = event.shiftKey ? 10 : 1;
      commit({
        x: clamp(base.x + (event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0) / Math.max(1, geometry.canvasWidth - geometry.width)),
        y: clamp(base.y + (event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0) / Math.max(1, geometry.canvasHeight - geometry.height)),
      });
    },
    reset: point && geometry ? () => {
      const next = { ...placement };
      delete next[geometry.device];
      onChange(Object.keys(next).length ? next : undefined);
      setLive(null); setMoving(false); setStatus("Text returned to its original position.");
    } : undefined,
  } : undefined;
  const content = children(controls);
  const floating = point && geometry;
  return (
    <>
      <span ref={anchor} className={styles.positionAnchor} data-text-placement-source={label}>
        {floating ? <span className={styles.ghost} aria-hidden="true">
          <span className={styles.editable}><span className={styles.text}>{text}</span>{onChange ? <span className={styles.mobileTrigger} /> : null}</span>
        </span> : content}
      </span>
      {floating ? createPortal(
        <span
          ref={floatingElement}
          className={styles.positioned}
          data-text-positioned={label}
          style={{ ...geometry.style, width: geometry.width, height: geometry.height,
            left: point.x * Math.max(0, geometry.canvasWidth - geometry.width),
            top: point.y * Math.max(0, geometry.canvasHeight - geometry.height) }}
        >{content}</span>, geometry.canvas,
      ) : null}
      {onChange && status ? <span className={styles.srOnly} role="status">{status}</span> : null}
    </>
  );
}
