"use client";

import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import { readEventCanvasColor } from "@/lib/event-canvas";
import { normalizeEventPageColor, registerEventPageColor } from "@/lib/event-page-chrome";
import styles from "./EventCanvas.module.css";

/** The event's own paper fills the preview gutter, navigation and safe areas. */
const EventCanvas = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div"> & { initialColor?: string }
>(function EventCanvas({ initialColor, children, className = "", style, ...props }, forwardedRef) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [color, setColor] = useState(() => normalizeEventPageColor(initialColor));
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const view = canvas?.ownerDocument.defaultView;
    if (!canvas || !view) return;
    const registration = registerEventPageColor(canvas.ownerDocument.documentElement, initialColor);
    let frame = 0;
    const sync = () => {
      const next = readEventCanvasColor(canvas);
      if (!next) return;
      registration.update(next);
      setColor((previous) => (previous === next ? previous : next));
    };
    const schedule = () => {
      view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(sync);
    };
    sync();
    const observer = new view.MutationObserver(schedule);
    observer.observe(canvas, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    const resize = new view.ResizeObserver(schedule);
    resize.observe(canvas);
    canvas.addEventListener("load", schedule, true);
    return () => {
      view.cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      canvas.removeEventListener("load", schedule, true);
      registration.dispose();
    };
  }, [initialColor]);
  return (
    <div
      {...props}
      ref={(element) => {
        canvasRef.current = element;
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef) forwardedRef.current = element;
      }}
      className={`${styles.canvas} ${className}`}
      style={
        {
          ...style,
          ...(color ? { "--event-canvas-color": color, backgroundColor: color } : {}),
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
});

export default EventCanvas;
