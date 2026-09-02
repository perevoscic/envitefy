"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

type MobileBrandHeaderProps = {
  onMenuClick?: () => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function MobileBrandHeader({ onMenuClick }: MobileBrandHeaderProps) {
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  useEffect(() => {
    const hero = document.querySelector("#landing-hero, #hero");
    if (!hero) return;

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const syncCurrentVisibility = () => {
      const rect = hero.getBoundingClientRect();
      setIsHeroVisible(
        mobileQuery.matches && rect.bottom > 0 && rect.top < window.innerHeight,
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsHeroVisible(mobileQuery.matches && entry.isIntersecting);
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

  return (
    <header
      className={cx(
        "fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-none bg-transparent px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-none backdrop-blur-0 transition-all duration-300 ease-out md:hidden",
        isHeroVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-4 opacity-0 pointer-events-none",
      )}
      data-hero-visible={isHeroVisible ? "true" : "false"}
    >
      <Link
        href="/"
        aria-label="Envitefy home"
        className="flex shrink-0 items-center overflow-hidden"
      >
        <EnvitefyWordmark
          scaled={false}
          tone="light"
          className="max-w-full text-[2.05rem] leading-none"
        />
      </Link>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white shadow-none transition hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d58f]"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
    </header>
  );
}
