"use client";

import {
  LayoutTemplate,
  PencilLine,
  Sparkles,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { useModalDialog } from "@/hooks/useModalDialog";

type CreateAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  action?: "concierge";
};

type CreateActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConciergeSelect?: () => void;
  onHashSelect?: (href: string) => void;
};

const createActionItems: CreateAction[] = [
  {
    label: "Create with AI Concierge",
    description: "Start from the signed-out Concierge demo.",
    icon: Sparkles,
    href: "#concierge",
    action: "concierge",
  },
  {
    label: "Start from Template",
    description: "Browse polished card starting points.",
    icon: LayoutTemplate,
    href: "#examples",
  },
  {
    label: "Upload Flyer / Scan Invite",
    description: "Use Snap for a flyer, invite, PDF, or screenshot.",
    icon: Upload,
    href: "/snap",
  },
  {
    label: "Create Manually",
    description: "Review the current creation paths.",
    icon: PencilLine,
    // TODO: Switch to /create when a signed-out manual create route exists.
    href: "#creation-paths",
  },
];

export default function CreateActionSheet({
  open,
  onOpenChange,
  onConciergeSelect,
  onHashSelect,
}: CreateActionSheetProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeSheet = useCallback(() => onOpenChange(false), [onOpenChange]);
  useModalDialog({ dialogRef, onClose: closeSheet, open });

  if (!open) return null;

  const handleAction = (item: CreateAction) => {
    closeSheet();

    if (item.action === "concierge") {
      onConciergeSelect?.();
      return;
    }

    if (item.href.startsWith("#")) {
      onHashSelect?.(item.href);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#1a1022]/28 backdrop-blur-[2px]"
        aria-label="Close create options"
        onClick={closeSheet}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create options"
        tabIndex={-1}
        className="absolute inset-x-3 bottom-[calc(6.1rem+env(safe-area-inset-bottom))] mx-auto max-w-[27rem] overflow-hidden rounded-[1.5rem] border border-white/90 bg-[radial-gradient(circle_at_86%_6%,rgba(156,113,255,0.2),transparent_29%),radial-gradient(circle_at_4%_96%,rgba(77,140,255,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.98),rgba(247,243,255,0.98))] p-3 text-[#2b2037] shadow-[0_26px_80px_rgba(41,22,63,0.26),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/70 bg-white/20 shadow-[inset_0_0_35px_rgba(139,92,246,0.1)]"
        />
        <button
          type="button"
          aria-label="Close create options"
          onClick={closeSheet}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-[#f1eef6]/90 text-[#665a72] shadow-[5px_5px_12px_rgba(52,39,76,0.14),-4px_-4px_10px_rgba(255,255,255,0.95)] transition duration-200 hover:-translate-y-0.5 hover:text-[#6d35f5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b4dff] focus-visible:ring-offset-2 active:translate-y-0 active:scale-95"
        >
          <X className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>

        <div className="relative z-[1] px-2 pb-2 pr-14 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a6ccf]">
            Create
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-tight">Choose a starting point</h2>
        </div>

        <div className="relative z-[1] grid gap-1.5">
          {createActionItems.map((item) => {
            const Icon = item.icon;
            const row = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4efff] text-[#6847d8]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-[#2b2037]">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#74697c]">
                    {item.description}
                  </span>
                </span>
              </>
            );

            if (item.href.startsWith("#") || item.action) {
              return (
                <button
                  key={item.label}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#faf7ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b4dff]"
                  onClick={() => handleAction(item)}
                >
                  {row}
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[#faf7ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b4dff]"
                onClick={() => handleAction(item)}
              >
                {row}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
