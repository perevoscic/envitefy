"use client";

import { Gem } from "lucide-react";
import { weddingDesignCatalog } from "@/lib/wedding-designs";
import ThemeCard from "./ThemeCard";

export default function ThemeSelector({
  selectedTemplateId,
  onSelectAction,
  disabled = false,
}: {
  selectedTemplateId?: string;
  onSelectAction: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "pointer-events-none select-none opacity-60" : ""}>
      <div className="border-b border-[#e7dfd6] bg-[#fbf8f4] px-4 py-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a7850]">
          <Gem className="h-3.5 w-3.5" />
          Wedding design atelier
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Every choice changes the complete page composition, typography, imagery, and section style.
        </p>
      </div>
      <div
        className={`grid grid-cols-1 gap-4 p-3 ${
        disabled ? "opacity-60 pointer-events-none select-none" : ""
      }`}
      >
        {weddingDesignCatalog.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={theme.id === selectedTemplateId}
            onSelect={() => onSelectAction(theme.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
