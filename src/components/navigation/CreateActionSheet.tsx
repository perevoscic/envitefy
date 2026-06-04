"use client";

import { LayoutTemplate, PencilLine, Sparkles, Upload, type LucideIcon } from "lucide-react";
import Link from "next/link";

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
  if (!open) return null;

  const handleAction = (item: CreateAction) => {
    onOpenChange(false);

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
        onClick={() => onOpenChange(false)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Create options"
        className="absolute inset-x-3 bottom-[calc(6.1rem+env(safe-area-inset-bottom))] mx-auto max-w-[27rem] overflow-hidden rounded-[1.5rem] border border-[#eadfff] bg-white/96 p-3 text-[#2b2037] shadow-[0_26px_80px_rgba(41,22,63,0.26)] backdrop-blur-xl"
      >
        <div className="px-2 pb-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a6ccf]">
            Create
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-tight">Choose a starting point</h2>
        </div>

        <div className="grid gap-1.5">
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
