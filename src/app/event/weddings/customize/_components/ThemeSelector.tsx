"use client";

import themes from "../../../../../../templates/weddings/index.json" assert { type: "json" };
import ThemeCard from "./ThemeCard";

export default function ThemeSelector({
  selectedTemplateId,
  onSelect,
  disabled = false,
}: {
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-3 grid grid-cols-2 gap-3 ${
        disabled ? "opacity-60 pointer-events-none select-none" : ""
      }`}
    >
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          selected={theme.id === selectedTemplateId}
          onSelect={() => onSelect(theme.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
