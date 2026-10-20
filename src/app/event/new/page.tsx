import { redirect } from "next/navigation";
export default async function NewEventPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) || {})) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
  }
  const eventId = params.get("edit");
  redirect(`${eventId ? `/event/${encodeURIComponent(eventId)}` : "/create"}${params.size ? `?${params}` : ""}`);
}
