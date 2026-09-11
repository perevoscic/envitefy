"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Adapted from the supplied expanding sidebar. The app owns persistence and
// mobile dialog behavior so navigation has one source of truth.
const SidebarContext = createContext({ open: true, animate: true });

export function Sidebar({
  children,
  open,
  animate = true,
}: {
  children: ReactNode;
  open: boolean;
  animate?: boolean;
}) {
  return <SidebarContext.Provider value={{ open, animate }}>{children}</SidebarContext.Provider>;
}

export function SidebarBody({
  width,
  style,
  ...props
}: ComponentProps<typeof motion.div> & { width: string }) {
  const { animate } = useContext(SidebarContext);
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      {...props}
      initial={false}
      animate={{ width }}
      transition={{ duration: animate && !reducedMotion ? 0.2 : 0, ease: "easeOut" }}
      style={style}
    />
  );
}

export type SidebarLinkItem = {
  label: string;
  href?: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  badge?: number;
};

export function SidebarLink({ link, className }: { link: SidebarLinkItem; className?: string }) {
  const { open, animate } = useContext(SidebarContext);
  const reducedMotion = useReducedMotion();
  const expanded = open || !animate;
  const content = (
    <>
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
      >
        {link.icon}
      </span>
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.15 }}
        className="nav-chrome-menu-label min-w-0 flex-1 truncate"
      >
        {link.label}
      </motion.span>
      {expanded && link.badge ? (
        <span
          aria-hidden="true"
          className="ml-auto rounded-md bg-violet-500/8 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-600"
        >
          {link.badge}
        </span>
      ) : null}
    </>
  );
  const shared = {
    onClick: link.onClick,
    "aria-label": link.badge ? `${link.label}, ${link.badge}` : link.label,
    "aria-current": link.active ? ("page" as const) : undefined,
    title: expanded ? undefined : link.label,
    className: cn(
      "group flex min-h-12 w-full shrink-0 items-center gap-3 rounded-2xl px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
      link.active
        ? "bg-white text-[#6b5fc2] shadow-[0_3px_16px_rgba(91,72,158,0.08)] ring-1 ring-violet-100/70"
        : "text-[rgba(107,95,194,0.64)] hover:bg-white/70 hover:text-[#6b5fc2]",
      className,
    ),
  };
  return link.href ? (
    <Link href={link.href} {...shared}>
      {content}
    </Link>
  ) : (
    <button type="button" {...shared}>
      {content}
    </button>
  );
}
