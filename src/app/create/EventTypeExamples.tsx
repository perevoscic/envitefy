"use client";

import { useLayoutEffect, useRef, useState } from "react";
import styles from "./create-workspace.module.css";

/** Fit a complete prefix of event names, never a clipped name or ellipsis. */
export default function EventTypeExamples({ id, examples, expanded }: {
  id: string;
  examples: string[];
  expanded: boolean;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(examples.length);
  const allExamples = examples.join(" · ");

  useLayoutEffect(() => {
    const element = root.current;
    if (!element || !expanded) return;
    let disposed = false;
    let frame = 0;
    let measuredWidth = element.getBoundingClientRect().width;

    const fit = () => {
      if (disposed || !element.parentElement) return;
      const width = element.getBoundingClientRect().width;
      if (width <= 0) return;
      measuredWidth = width;
      const style = getComputedStyle(element);
      const lines = Number.parseInt(style.getPropertyValue("--example-line-limit"), 10) || 2;
      const maxHeight = Number.parseFloat(style.lineHeight) * lines;
      const labels = allExamples.split(" · ");
      const probe = element.cloneNode(false) as HTMLSpanElement;
      probe.removeAttribute("id");
      probe.removeAttribute("data-event-type-group-examples");
      probe.removeAttribute("data-event-type-example-count");
      probe.setAttribute("aria-hidden", "true");
      Object.assign(probe.style, {
        position: "fixed", visibility: "hidden", pointerEvents: "none",
        top: "0", left: "0", display: "block", width: `${width}px`,
        minWidth: "0", maxWidth: "none", blockSize: "auto", maxBlockSize: "none", overflow: "visible",
      });
      element.parentElement.append(probe);
      let count = labels.length;
      try {
        for (; count > 1; count -= 1) {
          probe.textContent = labels.slice(0, count).join(" · ");
          if (probe.getBoundingClientRect().height <= maxHeight + 0.5 && probe.scrollWidth <= Math.ceil(width) + 1) break;
        }
      } finally {
        probe.remove();
      }
      setVisibleCount(count);
    };
    const scheduleFit = () => {
      if (disposed) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };
    fit();
    const observer = new ResizeObserver(() => {
      if (Math.abs(element.getBoundingClientRect().width - measuredWidth) > 0.1) scheduleFit();
    });
    observer.observe(element);
    window.addEventListener("resize", scheduleFit);
    void document.fonts.ready.then(scheduleFit);
    document.fonts.addEventListener("loadingdone", scheduleFit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleFit);
      document.fonts.removeEventListener("loadingdone", scheduleFit);
    };
  }, [allExamples, expanded]);

  return (
    <span
      ref={root}
      id={id}
      className={styles.typeFilterExamples}
      data-event-type-group-examples
      data-event-type-example-count={Math.min(visibleCount, examples.length)}
    >
      {examples.slice(0, visibleCount).join(" · ")}
    </span>
  );
}
