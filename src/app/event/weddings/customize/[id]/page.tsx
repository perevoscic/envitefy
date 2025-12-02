import WeddingCustomizeClient from "./WeddingCustomizeClient";
import loadWeddingTemplate from "@/lib/templates/loadWeddingTemplate";
import { getEventHistoryById } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function WeddingCustomizePage({
  params,
}: {
  params: { id: string };
}) {
  const eventHistory = await getEventHistoryById(params.id);

  if (!eventHistory) {
    return notFound();
  }

  const data = (eventHistory.data as any) || {};
  const templateId = data.templateId || data.template || "ethereal-classic";
  const template = await loadWeddingTemplate(templateId).catch(async () =>
    loadWeddingTemplate("ethereal-classic")
  );

  const event = {
    id: eventHistory.id,
    title: eventHistory.title || data.title || "",
    ...data,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <WeddingCustomizeClient
        event={event}
        template={template}
        editingId={eventHistory.id}
      />
    </div>
  );
}
