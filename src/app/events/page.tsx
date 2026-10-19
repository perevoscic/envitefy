import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import EventsWorkspaceClient from "./EventsWorkspaceClient";

export const metadata: Metadata = {
  title: "My Events | Envitefy",
  robots: { index: false, follow: false },
};
export default async function EventsWorkspacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !UNIFIED_CREATION_ENABLED) redirect("/");
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          Loading your events…
        </p>
      }
    >
      <EventsWorkspaceClient />
    </Suspense>
  );
}
