import React from "react";
import { BIRTHDAY_THEMES } from "../birthdayThemes";
import { BirthdayThemeCard } from "./ThemeCard";

export default function BirthdayThemeSelector({
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
      {BIRTHDAY_THEMES.map((theme) => (
        <BirthdayThemeCard
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
