"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type OverflowDiagnostic = {
  path: string;
  viewportWidth: number;
  documentWidth: number;
  offenders: Array<{ selector: string; left: number; right: number; width: number }>;
};

const selectorFor = (element: Element) => {
  if (element.id) return `#${CSS.escape(element.id)}`;
  const testId = element.getAttribute("data-testid");
  if (testId) return `[data-testid="${testId}"]`;
  return (
    element.tagName.toLowerCase() +
    [...element.classList]
      .slice(0, 3)
      .map((name) => `.${CSS.escape(name)}`)
      .join("")
  );
};

export default function MobileOverflowReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    let frame = 0;
    let lastSignature = "";

    const inspect = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const viewportWidth = document.documentElement.clientWidth;
        if (viewportWidth >= 1024) return;
        const documentWidth = document.documentElement.scrollWidth;
        if (documentWidth <= viewportWidth + 1) return;
        const offenders: OverflowDiagnostic["offenders"] = [];
        for (const element of document.querySelectorAll("body *")) {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            rect.width < 1 ||
            rect.height < 1
          ) {
            continue;
          }
          if (rect.left < -1 || rect.right > viewportWidth + 1) {
            offenders.push({
              selector: selectorFor(element),
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
          }
          if (offenders.length >= 8) break;
        }
        const diagnostic: OverflowDiagnostic = {
          path: pathname,
          viewportWidth,
          documentWidth,
          offenders,
        };
        const signature = JSON.stringify(diagnostic);
        if (signature === lastSignature) return;
        lastSignature = signature;
        console.warn("[mobile-overflow]", diagnostic);
      });
    };

    inspect();
    const observer = new ResizeObserver(inspect);
    observer.observe(document.documentElement);
    window.addEventListener("resize", inspect);
    void document.fonts.ready.then(inspect);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", inspect);
    };
  }, [pathname]);

  return null;
}
