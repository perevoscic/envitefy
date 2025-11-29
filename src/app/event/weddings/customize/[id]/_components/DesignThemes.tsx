import ThemeSelector from "./ThemeSelector";

export default function DesignThemes({ event }: { event: any }) {
  return (
    <ThemeSelector eventId={event.id} selectedTemplateId={event.templateId} />
  );
}
