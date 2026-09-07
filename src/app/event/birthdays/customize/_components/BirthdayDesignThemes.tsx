import BirthdayThemeSelector from "./BirthdayThemeSelector";

export default function BirthdayDesignThemes({
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
  return (
    <BirthdayThemeSelector
      occasion={occasion}
      selectedTemplateId={selectedTemplateId}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
