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
        className="mx-auto mb-[max(0.45rem,env(safe-area-inset-bottom))] w-[calc(100%_-_1.5rem)] max-w-[27rem] select-none rounded-[1.65rem] border border-white/90 bg-[radial-gradient(circle_at_50%_-45%,rgba(139,92,246,0.2),transparent_52%),linear-gradient(145deg,rgba(255,255,255,0.98),rgba(244,241,250,0.96))] px-2.5 pb-2 pt-2 text-[#352742] shadow-[0_16px_42px_rgba(54,39,84,0.2),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl"
      >
        <div className="grid grid-cols-5 items-end gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isFeatured = Boolean(item.featured);
            const isActive = activeLabel === item.label;
            const content = (
              <>
                <span
                  className={cx(
                    "relative flex shrink-0 items-center justify-center transition-all duration-300 ease-out",
                    isFeatured
                      ? "-mt-7 h-14 w-14 rounded-full border-[3px] border-white/90 bg-[linear-gradient(145deg,#a56cff,#7138f5_54%,#4d8cff)] text-white shadow-[0_12px_24px_rgba(91,52,190,0.34),0_3px_8px_rgba(91,52,190,0.2),inset_0_1px_1px_rgba(255,255,255,0.42)] group-hover:-translate-y-0.5 group-hover:scale-[1.03] group-active:translate-y-0 group-active:scale-95"
                      : cx(
                          "h-9 w-9 rounded-full border bg-[#f0eef5] shadow-[4px_4px_10px_rgba(45,38,74,0.13),-4px_-4px_10px_rgba(255,255,255,0.96)] group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:scale-95",
                          isActive
                            ? "scale-[1.04] border-[#ded1ff] bg-[linear-gradient(145deg,#f7f3ff,#ebe4ff)] text-[#6d35f5] shadow-[5px_5px_12px_rgba(82,55,135,0.17),-5px_-5px_12px_rgba(255,255,255,0.98),inset_0_1px_0_rgba(255,255,255,0.9)]"
                            : "border-white/90 text-[#8f879b] group-hover:text-[#7442e8]",
                        ),
                  )}
                >
                  {isFeatured ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.34),transparent_42%)]"
                    />
                  ) : null}
                  {isFeatured && item.action === "concierge" ? (
                    <span
                      className="relative h-7 w-7 bg-white drop-shadow-[0_2px_7px_rgba(255,255,255,0.5)]"
                      style={conciergeNavLogoMaskStyle}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon className={cx("relative", isFeatured ? "h-5 w-5" : "h-5 w-5")} />
                  )}
                </span>
                <span
                  className={cx(
                    "mt-1 max-w-full truncate rounded-full px-0.5 py-0.5 text-[8px] font-semibold leading-tight tracking-[-0.01em] transition-all duration-200 min-[360px]:px-1.5 min-[360px]:text-[9px]",
                    isActive
                      ? "bg-white/75 text-[#5b359d] shadow-[0_3px_8px_rgba(67,45,104,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]"
                      : isFeatured
                        ? "text-[#6940b0]"
                        : "text-[#938c9e] group-hover:text-[#6940b0]",
                  )}
                >
                  {item.label}
                </span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#4d8cff)] shadow-[0_0_7px_rgba(109,53,245,0.58)]"
                  />
                ) : null}
              </>
            );

            const className = cx(
              "group relative flex min-w-0 cursor-pointer flex-col items-center justify-end px-0.5 pb-0.5 pt-1 text-center outline-none transition-all duration-200 focus-visible:rounded-[1.15rem] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
              isFeatured ? "min-h-[3.75rem]" : "min-h-[3.6rem]",
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
