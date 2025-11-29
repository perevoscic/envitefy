"use client";

import themes from "../../../../../../../templates/weddings/index.json";
import ThemeCard from "./ThemeCard";
import { useRouter } from "next/navigation";

export default function ThemeSelector({
  eventId,
  selectedTemplateId,
}: {
  eventId: string;
  selectedTemplateId?: string | null;
}) {
  const router = useRouter();

  async function handleSelect(id: string) {
    await fetch(`/api/events/${eventId}/update-theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: id }),
    });

    router.refresh();
  }

  return (
    <div className="p-3 space-y-4">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          selected={theme.id === selectedTemplateId}
          onSelect={() => handleSelect(theme.id)}
        />
      ))}
    </div>
  );
}
