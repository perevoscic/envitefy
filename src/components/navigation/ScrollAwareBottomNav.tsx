"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/navigation/BottomNav";

type ScrollAwareBottomNavProps = {
  onConciergeSelect?: () => void;
  onMenuSelect?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

export default function ScrollAwareBottomNav({
  onConciergeSelect,
  onMenuSelect,
  onVisibilityChange,
}: ScrollAwareBottomNavProps) {
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("#hero, #landing-hero");

    if (!hero) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const syncCurrentVisibility = () => {
      const rect = hero.getBoundingClientRect();
      const heroVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      setShowNav(mobileQuery.matches && !heroVisible);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setShowNav(mobileQuery.matches && !entry.isIntersecting);
      },
      {
        threshold: [0],
      },
    );

    syncCurrentVisibility();
    observer.observe(hero);
    mobileQuery.addEventListener("change", syncCurrentVisibility);
    window.addEventListener("resize", syncCurrentVisibility);

    return () => {
      observer.disconnect();
      mobileQuery.removeEventListener("change", syncCurrentVisibility);
      window.removeEventListener("resize", syncCurrentVisibility);
    };
  }, []);

  useEffect(() => {
    onVisibilityChange?.(showNav);
  }, [onVisibilityChange, showNav]);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-50 md:hidden transition-all duration-300 ease-out",
        showNav
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <BottomNav
        onConciergeSelect={onConciergeSelect}
        onMenuSelect={onMenuSelect}
      />
    </div>
  );
}
