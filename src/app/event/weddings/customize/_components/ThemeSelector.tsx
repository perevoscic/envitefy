"use client";

import themes from "../../../../../../templates/weddings/index.json" assert { type: "json" };
import ThemeCard from "./ThemeCard";

export default function ThemeSelector({
  selectedTemplateId,
  onSelect,
}: {
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="p-3 space-y-4">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          selected={theme.id === selectedTemplateId}
          onSelect={() => onSelect(theme.id)}
        />
      ))}
    </div>
  );
}
