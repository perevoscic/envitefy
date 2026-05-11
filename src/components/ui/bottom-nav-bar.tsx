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
  labelWidth?: number;
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
  activeValue?: string | null;
  ariaLabel?: string;
  spreadItems?: boolean;
  autoOpenOnMount?: boolean;
  autoOpenIntervalMs?: number;
  autoOpenCycles?: number;
  onValueChange?: (value: string, item: BottomNavItem, index: number) => void;
};

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyBottom = false,
  items = navItems,
  activeValue,
  ariaLabel = "Bottom Navigation",
  spreadItems = false,
  autoOpenOnMount = false,
  autoOpenIntervalMs = 2000,
  autoOpenCycles = 1,
  onValueChange,
}: BottomNavBarProps) {
  const safeDefaultIndex = items.length
    ? Math.min(Math.max(defaultIndex, -1), items.length - 1)
    : -1;
  const [activeIndex, setActiveIndex] = useState(safeDefaultIndex);
  const [autoOpenIndex, setAutoOpenIndex] = useState<number | null>(null);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const isActiveValueControlled = activeValue !== undefined;
  const controlledIndex =
    typeof activeValue === "string"
      ? items.findIndex((item) => (item.value || item.label) === activeValue)
      : -1;
  const resolvedActiveIndex = isActiveValueControlled ? controlledIndex : activeIndex;
  const expandedIndex = autoOpenIndex ?? resolvedActiveIndex;

  useEffect(() => {
    if (!autoOpenOnMount || hasManualSelection || items.length <= 1) {
      setAutoOpenIndex(null);
      return;
    }

    const startIndex = safeDefaultIndex >= 0 ? safeDefaultIndex : 0;
    setAutoOpenIndex(startIndex);
    let nextIndex = startIndex;
    let displayedCount = 1;
    const maxDisplays = items.length * Math.max(autoOpenCycles, 1);
    const interval = window.setInterval(
      () => {
        if (displayedCount >= maxDisplays) {
          window.clearInterval(interval);
          setAutoOpenIndex(null);
          return;
        }

        nextIndex += 1;
        if (nextIndex >= items.length) {
          nextIndex = 0;
        }
        displayedCount += 1;
        setAutoOpenIndex(nextIndex);
      },
      Math.max(autoOpenIntervalMs, 500),
    );

    return () => window.clearInterval(interval);
  }, [
    autoOpenCycles,
    autoOpenIntervalMs,
    autoOpenOnMount,
    hasManualSelection,
    items.length,
    safeDefaultIndex,
  ]);

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        "flex min-h-[48px] min-w-[320px] max-w-[95vw] items-center gap-1 rounded-full bg-[#eff1f8] p-1.5 shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] sm:min-h-[52px] sm:gap-2 sm:p-2",
        spreadItems && "justify-between",
        stickyBottom && "fixed inset-x-0 bottom-4 z-20 mx-auto w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = resolvedActiveIndex === idx;
        const isExpanded = expandedIndex === idx;
        const activeLabelWidth = item.labelWidth ?? MOBILE_LABEL_WIDTH;

        return (
          <motion.button
            key={`${item.value || item.label}-${idx}`}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "group relative flex h-9 max-h-[44px] min-h-9 min-w-[40px] items-center gap-0 rounded-full px-2.5 py-1.5 transition-all duration-300 sm:h-10 sm:min-h-[40px] sm:min-w-[44px] sm:px-3 sm:py-2",
              isActive
                ? "gap-2 text-[#5c5be5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]"
                : "bg-transparent text-[#747684] hover:text-[#5d6070]",
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
              className={cn(
                "transition-transform duration-300",
                isActive ? "scale-110" : "group-hover:scale-105",
              )}
            />

            <motion.div
              initial={false}
              animate={{
                width: isExpanded ? `${activeLabelWidth}px` : "0px",
                opacity: isExpanded ? 1 : 0,
                marginLeft: isExpanded ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className="flex items-center overflow-hidden"
              style={{ maxWidth: `${activeLabelWidth}px` }}
            >
              <span
                className={cn(
                  "relative select-none overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium leading-[1.9] transition-opacity duration-200",
                  isExpanded ? "text-current" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
            {isActive ? (
              <motion.span
                layoutId="bottomNavActiveUnderline"
                className="absolute bottom-2 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[#5c5be5] opacity-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
              />
            ) : null}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
