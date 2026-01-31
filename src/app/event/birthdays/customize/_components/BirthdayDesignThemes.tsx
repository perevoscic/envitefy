import BirthdayThemeSelector from "./BirthdayThemeSelector";

export default function BirthdayDesignThemes({
  selectedTemplateId,
  onSelect,
  disabled = false,
}: {
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <BirthdayThemeSelector
      selectedTemplateId={selectedTemplateId}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
