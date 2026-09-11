"use client";

import { ArrowUp } from "lucide-react";
import { type RefObject, useEffect, useState } from "react";

export default function TemplateScrollToTop({
  scrollRoot,
  className = "fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6",
}: {
  scrollRoot?: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = scrollRoot?.current;
    const target = root ?? window;
    const updateVisibility = () => setVisible((root ? root.scrollTop : window.scrollY) > 400);
    updateVisibility();
    target.addEventListener("scroll", updateVisibility, { passive: true });
    return () => target.removeEventListener("scroll", updateVisibility);
  }, [scrollRoot]);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        const target = scrollRoot?.current ?? window;
        target.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        });
      }}
      className={`${className} z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[#ded4df] bg-white text-[#59405c] shadow-[0_6px_20px_rgba(52,45,56,0.16)] transition-colors hover:bg-[#f5eff6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#926e93] motion-reduce:transition-none`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
