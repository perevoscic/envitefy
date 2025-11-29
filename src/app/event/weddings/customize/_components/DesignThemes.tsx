import ThemeSelector from "./ThemeSelector";

export default function DesignThemes({
  selectedTemplateId,
  onSelect,
}: {
  selectedTemplateId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ThemeSelector
      selectedTemplateId={selectedTemplateId}
      onSelect={onSelect}
    />
  );
}
