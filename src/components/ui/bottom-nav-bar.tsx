"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import {
  CreditCard,
  Home,
  LineChart,
  MessageCircle,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type BottomNavItem = {
  label: string;
  icon: LucideIcon;
  value?: string;
};

const navItems: BottomNavItem[] = [
  { label: "Home", icon: Home },
  { label: "Portfolio", icon: LineChart },
  { label: "Transactions", icon: CreditCard },
  { label: "Messages", icon: MessageCircle },
  { label: "Rewards", icon: Trophy },
  { label: "Profile", icon: User },
];

const MOBILE_LABEL_WIDTH = 72;

type BottomNavBarProps = {
  className?: string;
  defaultIndex?: number;
  stickyBottom?: boolean;
  items?: BottomNavItem[];
  activeValue?: string;
  ariaLabel?: string;
  autoOpenOnMount?: boolean;
  autoOpenIntervalMs?: number;
  onValueChange?: (value: string, item: BottomNavItem, index: number) => void;
};

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyBottom = false,
  items = navItems,
  activeValue,
  ariaLabel = "Bottom Navigation",
  autoOpenOnMount = false,
  autoOpenIntervalMs = 2000,
  onValueChange,
}: BottomNavBarProps) {
  const safeDefaultIndex = Math.min(Math.max(defaultIndex, 0), Math.max(items.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeDefaultIndex);
  const [autoOpenIndex, setAutoOpenIndex] = useState<number | null>(null);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const controlledIndex =
    typeof activeValue === "string"
      ? items.findIndex((item) => (item.value || item.label) === activeValue)
      : -1;
  const resolvedActiveIndex =
    autoOpenIndex ?? (controlledIndex >= 0 ? controlledIndex : activeIndex);

  useEffect(() => {
    if (!autoOpenOnMount || hasManualSelection || items.length <= 1) {
      setAutoOpenIndex(null);
      return;
    }

    setAutoOpenIndex(safeDefaultIndex);
    let nextIndex = safeDefaultIndex;
    const interval = window.setInterval(
      () => {
        nextIndex += 1;
        if (nextIndex >= items.length) {
          window.clearInterval(interval);
          setAutoOpenIndex(null);
          return;
        }
        setAutoOpenIndex(nextIndex);
      },
      Math.max(autoOpenIntervalMs, 500),
    );

    return () => window.clearInterval(interval);
  }, [autoOpenIntervalMs, autoOpenOnMount, hasManualSelection, items.length, safeDefaultIndex]);

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        "flex h-[52px] min-w-[320px] max-w-[95vw] items-center gap-1 rounded-full border border-[#ebe7f2] bg-white/96 p-2 shadow-[0_16px_36px_rgba(35,27,55,0.14)]",
        stickyBottom && "fixed inset-x-0 bottom-4 z-20 mx-auto w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = resolvedActiveIndex === idx;

        return (
          <motion.button
            key={`${item.value || item.label}-${idx}`}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "relative flex h-10 max-h-[44px] min-h-[40px] min-w-[44px] items-center gap-0 rounded-full px-3 py-2 transition-colors duration-200",
              isActive
                ? "gap-2 bg-[#ede8f7] text-[#4b3674]"
                : "bg-transparent text-[#6d5a8e] hover:bg-[#f5f1fb] hover:text-[#4b3674]",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => {
              setHasManualSelection(true);
              setAutoOpenIndex(null);
              setActiveIndex(idx);
              onValueChange?.(item.value || item.label, item, idx);
            }}
            aria-label={item.label}
            aria-pressed={isActive}
            type="button"
          >
            <Icon
              size={22}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200"
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className={cn("flex max-w-[72px] items-center overflow-hidden")}
            >
              <span
                className={cn(
                  "select-none overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium leading-[1.9] transition-opacity duration-200",
                  isActive ? "text-[#4b3674]" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
