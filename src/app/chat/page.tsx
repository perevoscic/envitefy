import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Envitefy Concierge | Create Events From a Message or Upload",
  description:
    "Start with one message, upload, or screenshot. Envitefy Concierge builds event pages, schedules, RSVPs, forms, and reminders.",
  alternates: { canonical: "/concierge-v2" },
};

export default function ChatPage() {
  redirect("/concierge-v2");
}
