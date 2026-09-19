"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/navigation/BottomNav";
import type { SignedOutBottomNavItem } from "@/config/navigation";

type ScrollAwareBottomNavProps = {
  onConciergeSelect?: () => void;
  onMenuSelect?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
  initialActiveLabel?: string;
  items?: SignedOutBottomNavItem[];
  onHashSelect?: (href: string) => void;
};

export default function ScrollAwareBottomNav({
  onConciergeSelect,
  onMenuSelect,
  onVisibilityChange,
  initialActiveLabel,
  items,
  onHashSelect,
}: ScrollAwareBottomNavProps) {
  const [showNav, setShowNav] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const hero = document.querySelector("#hero, #landing-hero, main > section:first-of-type:not(#templates)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const syncCurrentVisibility = () => {
      const rect = hero?.getBoundingClientRect();
      const heroVisible = rect ? rect.bottom > 0 && rect.top < window.innerHeight : false;
      setShowNav(mobileQuery.matches && !heroVisible);
    };

    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setShowNav(mobileQuery.matches && !entry.isIntersecting);
      },
      {
        threshold: [0],
      },
    );

    syncCurrentVisibility();
    if (hero) observer?.observe(hero);
    if (!observer) window.addEventListener("scroll", syncCurrentVisibility, { passive: true });
    mobileQuery.addEventListener("change", syncCurrentVisibility);
    window.addEventListener("resize", syncCurrentVisibility);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", syncCurrentVisibility);
      mobileQuery.removeEventListener("change", syncCurrentVisibility);
      window.removeEventListener("resize", syncCurrentVisibility);
    };
  }, [pathname]);

  useEffect(() => {
    onVisibilityChange?.(showNav);
  }, [onVisibilityChange, showNav]);

  return (
    <div
      aria-hidden={!showNav}
      inert={!showNav}
      className={[
        "fixed inset-x-0 bottom-0 z-50 md:hidden transition-all duration-300 ease-out motion-reduce:transition-none",
        showNav
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <BottomNav
        initialActiveLabel={initialActiveLabel}
        items={items}
        onHashSelect={onHashSelect}
        onConciergeSelect={onConciergeSelect}
        onMenuSelect={onMenuSelect}
      />
    </div>
  );
}
