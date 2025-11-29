import WeddingCustomizeClient from "./WeddingCustomizeClient";
import loadWeddingTemplate from "@/lib/templates/loadWeddingTemplate";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WeddingCustomizePage({
  params,
}: {
  params: { id: string };
}) {
  const prismaClient = prisma as any;
  const event = await prismaClient.event.findUnique({
    where: { id: params.id },
  });

  if (!event) {
    return notFound();
  }

  const templateId = event.templateId || "midnight-elegance";
  let template = await loadWeddingTemplate(templateId).catch(async () =>
    loadWeddingTemplate("midnight-elegance")
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
