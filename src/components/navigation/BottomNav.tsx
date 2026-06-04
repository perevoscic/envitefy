"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CreateActionSheet from "@/components/navigation/CreateActionSheet";
import {
  signedOutBottomNav,
  type SignedOutBottomNavItem,
} from "@/config/navigation";

type BottomNavProps = {
  initialActiveLabel?: string;
  items?: SignedOutBottomNavItem[];
  onConciergeSelect?: () => void;
  onHashSelect?: (href: string) => void;
  onMenuSelect?: () => void;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const conciergeNavLogoMaskStyle = {
  WebkitMask: "url(/logo-colored.png) center / contain no-repeat",
  mask: "url(/logo-colored.png) center / contain no-repeat",
};

function scrollToHash(href: string) {
  if (!href.startsWith("#") || typeof window === "undefined") return false;

  const target = document.getElementById(href.slice(1));
  if (!target) return false;

  window.history.pushState(null, "", href);
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
  return true;
}

export default function BottomNav({
  initialActiveLabel = "Concierge",
  items = signedOutBottomNav,
  onConciergeSelect,
  onHashSelect,
  onMenuSelect,
}: BottomNavProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState(initialActiveLabel);

  useEffect(() => {
    setActiveLabel(initialActiveLabel);
  }, [initialActiveLabel]);

  const handleHashSelect = (href: string) => {
    if (onHashSelect) {
      onHashSelect(href);
      return;
    }

    scrollToHash(href);
  };

  const handleNavAction = (item: SignedOutBottomNavItem) => {
    setActiveLabel(item.label);

    if (item.action === "create") {
      setCreateSheetOpen(true);
      return;
    }

    if (item.action === "menu") {
      onMenuSelect?.();
      return;
    }

    if (item.action === "concierge") {
      if (onConciergeSelect) {
        onConciergeSelect();
      } else {
        handleHashSelect(item.href);
      }
      return;
    }

    handleHashSelect(item.href);
  };

  return (
    <>
      <nav
        aria-label="Signed-out mobile navigation"
        className="mx-auto w-full max-w-md select-none rounded-t-[1.35rem] border border-violet-100/70 border-b-0 bg-white/95 px-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-0 text-[#352742] shadow-[0_-8px_24px_rgba(99,102,241,0.08)] backdrop-blur-xl"
      >
        <div className="grid grid-cols-5 items-end gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isFeatured = Boolean(item.featured);
            const isActive = activeLabel === item.label;
            const content = (
              <>
                <span
                  className={cx(
                    "relative flex items-center justify-center transition-all duration-300",
                    isFeatured
                      ? "-mt-6 h-12 w-12 rounded-full bg-gradient-to-tr from-pink-500 via-violet-600 to-indigo-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.35),0_10px_20px_rgba(217,70,239,0.22)] group-hover:scale-105 group-active:scale-95"
                      : cx(
                          "h-6 w-6 rounded-full",
                          isActive
                            ? "scale-110 text-violet-600 drop-shadow-[0_0_3px_rgba(139,92,246,0.5)]"
                            : "text-gray-400 group-hover:text-violet-500",
                        ),
                  )}
                >
                  {isFeatured ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-white/15 blur-[1px]"
                    />
                  ) : null}
                  {isFeatured && item.action === "concierge" ? (
                    <span
                      className="relative h-6 w-6 bg-white drop-shadow-[0_0_8px_rgba(255,255,255,0.52)]"
                      style={conciergeNavLogoMaskStyle}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon className={cx("relative", isFeatured ? "h-5 w-5" : "h-5 w-5")} />
                  )}
                </span>
                <span
                  className={cx(
                    "mt-1 max-w-full truncate text-[8.5px] font-bold leading-tight tracking-tight",
                    isActive || isFeatured ? "text-violet-700" : "text-gray-400",
                  )}
                >
                  {item.label}
                </span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 h-[3px] w-5 rounded-full bg-violet-600 shadow-[0_0_6px_rgba(139,92,246,1)]"
                  />
                ) : null}
              </>
            );

            const className = cx(
              "group relative flex min-w-0 cursor-pointer flex-col items-center justify-end gap-1 px-1 pb-1 pt-0 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
              isFeatured ? "min-h-[3.35rem]" : "min-h-[3.2rem]",
            );

            if (item.action) {
              return (
                <button
                  key={`${item.label}:${item.href}`}
                  type="button"
                  className={className}
                  onClick={() => handleNavAction(item)}
                  aria-label={item.purpose}
                  aria-current={isActive ? "page" : undefined}
                  aria-haspopup={
                    item.action === "create" || item.action === "menu" ? "dialog" : undefined
                  }
                  aria-expanded={
                    item.action === "create"
                      ? createSheetOpen
                      : item.action === "menu"
                        ? false
                        : undefined
                  }
                >
                  {content}
                </button>
              );
            }

            if (item.href.startsWith("#")) {
              return (
                <button
                  key={`${item.label}:${item.href}`}
                  type="button"
                  className={className}
                  onClick={() => handleNavAction(item)}
                  aria-label={item.purpose}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={`${item.label}:${item.href}`}
                href={item.href}
                className={className}
                aria-label={item.purpose}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setActiveLabel(item.label)}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      <CreateActionSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onConciergeSelect={() => {
          setActiveLabel("Concierge");
          onConciergeSelect?.();
        }}
        onHashSelect={(href) => {
          setActiveLabel(href === "#examples" ? "Templates" : "Create");
          handleHashSelect(href);
        }}
      />
    </>
  );
}
