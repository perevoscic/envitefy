import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { listEventAssets } from "@/lib/concierge/event-storage";
import { getEventHistoryById } from "@/lib/db";
import { buildEventPath } from "@/utils/event-url";
import EventManageClient from "./EventManageClient";

export const metadata: Metadata = {
  title: "Event Tools | Envitefy",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function EventManagePage({ params }: { params: Promise<{ id: string }> }) {
  const session: any = await getServerSession(authOptions as any);
  const userId = await resolveSessionUserId(session);
  if (!userId) redirect("/login");

  const { id } = await params;
  const event = await getEventHistoryById(id);
  if (!event || event.user_id !== userId) notFound();

  const data = asRecord(event.data);
  const title =
    (typeof data.title === "string" && data.title.trim()) || event.title || "Untitled event";
  const assets = await listEventAssets(event.id, userId);

  return (
    <EventManageClient
      eventId={event.id}
      initialTitle={title}
      initialData={data}
      initialAssets={assets}
      eventHref={buildEventPath(event.id, title, undefined, event.public_slug)}
    />
  );
}
