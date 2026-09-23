import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LiveCardBuilder from "./LiveCardBuilder";

export const metadata: Metadata = {
  title: "Live Cards & Invites | Envitefy",
  description:
    "Create a matching Live Card and Invite through Idea, Event details, Design and Review, with local event times and a dashboard for sharing.",
  robots: { index: false, follow: false },
};

export default async function LiveCardsInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const { edit } = await searchParams;
  return <LiveCardBuilder key={edit || "new"} initialEventId={edit || null} />;
}
