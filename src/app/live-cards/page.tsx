import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LiveCardBuilder from "./LiveCardBuilder";

export const metadata: Metadata = {
  title: "Live Cards | Envitefy",
  description:
    "Create a Live Card through Design, Event details and Review, then share it or download an invitation with your event details.",
  robots: { index: false, follow: false },
};

export default async function LiveCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const { edit } = await searchParams;
  return <LiveCardBuilder key={edit || "new"} initialEventId={edit || null} />;
}
