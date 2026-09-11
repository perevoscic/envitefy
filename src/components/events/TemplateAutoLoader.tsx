"use client";

import { type Dispatch, type RefObject, type SetStateAction, useEffect, useRef } from "react";
import TemplateScrollToTop from "./TemplateScrollToTop";

export default function TemplateAutoLoader({
  visibleCount,
  totalCount,
  setVisibleCount,
  batchSize = 12,
  itemLabel = "designs",
  scrollRoot,
}: {
  visibleCount: number;
  totalCount: number;
  setVisibleCount: Dispatch<SetStateAction<number>>;
  batchSize?: number;
  itemLabel?: "designs" | "templates";
  scrollRoot?: RefObject<HTMLElement | null>;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < totalCount;

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;

    // Keep the complete catalog reachable in browsers without observation support.
    if (!("IntersectionObserver" in window)) {
      setVisibleCount(totalCount);
      return;
    }

    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!active || !entries.some((entry) => entry.isIntersecting)) return;
        active = false;
        observer.disconnect();
        setVisibleCount((count) => Math.min(count + batchSize, totalCount));
      },
      { root: scrollRoot?.current ?? null, rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [batchSize, hasMore, scrollRoot, setVisibleCount, totalCount, visibleCount]);

  if (!totalCount) return null;

  return (
    <>
      <div ref={sentinel} data-template-autoload className="py-8 text-center">
        <p role="status" aria-atomic="true" className="text-xs text-[#746775]">
          Showing {Math.min(visibleCount, totalCount)} of {totalCount} {itemLabel}
        </p>
      </div>
      {!scrollRoot && <TemplateScrollToTop />}
    </>
  );
}
