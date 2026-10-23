import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LiveCardBuilder from "./LiveCardBuilder";
import LiveCardIntro from "./LiveCardIntro";

export const metadata: Metadata = {
  title: "Live Cards | Envitefy",
  description:
    "Discover Live Cards: design your own invitation, keep event details up to date and share one link with your guests.",
  robots: { index: false, follow: false },
};

export default async function LiveCardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    create?: string | string[];
    edit?: string | string[];
    intake?: string | string[];
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const params = await searchParams;
  const create = Array.isArray(params.create) ? params.create[0] : params.create;
  const edit = (Array.isArray(params.edit) ? params.edit[0] : params.edit)?.trim();
  const intake = (Array.isArray(params.intake) ? params.intake[0] : params.intake)?.trim();
  if (create !== "1" && !edit && !intake) return <LiveCardIntro />;

  return (
    <LiveCardBuilder
      key={edit || (intake ? `intake:${intake}` : "new")}
      initialEventId={edit || null}
    />
  );
}
