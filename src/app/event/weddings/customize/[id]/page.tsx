import WeddingCustomizeClient from "./WeddingCustomizeClient";
import loadWeddingTemplate from "@/lib/templates/loadWeddingTemplate";
import getPrismaClient from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WeddingCustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const awaitedParams = await params;
  const prismaClient = getPrismaClient();
  const event = await prismaClient.event.findUnique({
    where: { id: awaitedParams.id },
  });

  if (!event) {
    return notFound();
  }

  const templateId = event.templateId || "ethereal-classic";
  const template = await loadWeddingTemplate(templateId).catch(async () =>
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
