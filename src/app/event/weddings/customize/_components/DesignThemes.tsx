import ThemeSelector from "./ThemeSelector";

export default function DesignThemes({
  selectedTemplateId,
  onSelectAction,
  disabled = false,
}: {
  selectedTemplateId?: string;
  onSelectAction: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <ThemeSelector
      selectedTemplateId={selectedTemplateId}
      onSelectAction={onSelectAction}
      disabled={disabled}
    />
  );
}
