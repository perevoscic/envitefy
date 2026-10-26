import { redirect } from "next/navigation";

/** School shares the native Event Page gallery and editor, like holiday collections. */
export default async function SchoolEventsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const params = new URLSearchParams({ collection: "school" });
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) params.set("d", d);
  redirect(`/event/general?${params}`);
}
