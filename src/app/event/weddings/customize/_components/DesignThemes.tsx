import ThemeSelector from "./ThemeSelector";

export default function DesignThemes({
  selectedTemplateId,
  onSelect,
  disabled = false,
}: {
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <ThemeSelector
      selectedTemplateId={selectedTemplateId}
      onSelect={onSelect}
      disabled={disabled}
    />
  );
}
