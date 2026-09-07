
import { ANNIVERSARY_DESIGN_CATALOG, BIRTHDAY_DESIGN_CATALOG } from "@/data/birthday-design-catalog";
import { BIRTHDAY_THEMES } from "../birthdayThemes";
import { BirthdayThemeCard } from "./ThemeCard";

export default function BirthdayThemeSelector({
  occasion = "Birthday",
  selectedTemplateId,
  onSelect,
  disabled = false,
}: {
  occasion?: "Birthday" | "Anniversary";
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const themes = occasion === "Anniversary"
    ? ANNIVERSARY_DESIGN_CATALOG
    : [...BIRTHDAY_DESIGN_CATALOG, ...BIRTHDAY_THEMES.filter((theme) => !BIRTHDAY_DESIGN_CATALOG.some((design) => design.id === theme.id))];

  return (
    <div
      className={`p-3 grid grid-cols-2 gap-3 ${
        disabled ? "opacity-60 pointer-events-none select-none" : ""
      }`}
    >
      {themes.map((theme) => (
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
