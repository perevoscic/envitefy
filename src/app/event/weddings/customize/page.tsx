import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import WeddingCustomizeClient from "./[id]/WeddingCustomizeClient";
import loadWeddingTemplate from "@/lib/templates/loadWeddingTemplate";
import { authOptions } from "@/lib/auth";
import { getEventHistoryById, getOrCreateWeddingDraftForUser, getUserByEmail } from "@/lib/db";

export default async function WeddingCustomizeLanding({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const session: any = await getServerSession(authOptions as any);
  const email = (session?.user?.email as string | undefined) || null;
  if (!email) {
    return redirect("/login");
  }

  const user = await getUserByEmail(email);
  const userId = user?.id;
  if (!userId) {
    return redirect("/login");
  }

  const awaitedSearchParams = await (searchParams as any);
  const requestedEditRaw = awaitedSearchParams?.edit;
  const requestedEdit = Array.isArray(requestedEditRaw)
    ? requestedEditRaw[0]
    : requestedEditRaw;

  let draft = await getOrCreateWeddingDraftForUser(userId);
  let editId = draft.id;

  if (requestedEdit) {
    const existing = await getEventHistoryById(requestedEdit);
    if (existing && existing.user_id === userId) {
      draft = existing;
      editId = existing.id;
    }
  }

  if (!requestedEdit || requestedEdit !== editId) {
    return redirect(`/event/weddings/customize?edit=${encodeURIComponent(editId)}`);
  }

  const data = (draft.data as any) || {};
  const templateId = data.templateId || data.template || "ethereal-classic";
  const template = await loadWeddingTemplate(templateId).catch(async () =>
    loadWeddingTemplate("ethereal-classic")
  );

  const event = {
    id: editId,
    title: draft.title || data.title || "",
    ...data,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <WeddingCustomizeClient event={event} template={template} editingId={editId} />
    </div>
  );
}
