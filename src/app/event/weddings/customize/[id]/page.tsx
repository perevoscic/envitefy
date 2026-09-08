import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { resolveEditHref } from "@/utils/event-edit-route";

export default async function WeddingCustomizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) redirect("/weddings/templates");
  const { id } = await params;
  const event = await getEventHistoryById(id);
  if (!event || event.user_id !== userId) notFound();
  // Preserve the legacy URL while using the current, ownership-checked editor.
  redirect(resolveEditHref(event.id, event.data, event.title));
}
