"use client";

import themes from "../../../../../../templates/weddings/index.json" with { type: "json" };
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
          onSelect={() => onSelectAction(theme.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
