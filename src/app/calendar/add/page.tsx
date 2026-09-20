import type { Metadata } from "next";
import { parseCalendarHandoff } from "@/utils/calendar-handoff";
import CalendarHandoff from "./CalendarHandoff";

export const metadata: Metadata = {
  title: "Add to calendar | Envitefy",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function CalendarAddPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  return <CalendarHandoff handoff={parseCalendarHandoff(query)} />;
}
