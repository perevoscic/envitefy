import WeddingCustomizeClient from "./WeddingCustomizeClient";
import loadWeddingTemplate from "@/lib/templates/loadWeddingTemplate";
import getPrismaClient from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WeddingCustomizePage({
  params,
}: {
  params: { id: string };
}) {
  const prismaClient = getPrismaClient();
  const event = await prismaClient.event.findUnique({
    where: { id: params.id },
  });

  if (!event) {
    return notFound();
  }

  const templateId = event.templateId || "ethereal-classic";
  let template = await loadWeddingTemplate(templateId).catch(async () =>
    loadWeddingTemplate("ethereal-classic")
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <WeddingCustomizeClient
        event={JSON.parse(JSON.stringify(event))}
        template={template}
      />
    </div>
  );
}
