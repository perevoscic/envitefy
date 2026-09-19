import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminRouteError, requireAdminSession } from "@/lib/admin/require-admin";
import LiveCardBuilder from "./LiveCardBuilder";

export const metadata: Metadata = {
  title: "Live Cards & Invites | Envitefy",
  description:
    "Create a Live Card while you add event details, locations, RSVP and registry options.",
  robots: { index: false, follow: false },
};

export default async function LiveCardsInvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  try {
    await requireAdminSession();
  } catch (error) {
    if (error instanceof AdminRouteError) redirect("/");
    throw error;
  }
  return <LiveCardBuilder key={edit || "new"} initialEventId={edit || null} />;
}
