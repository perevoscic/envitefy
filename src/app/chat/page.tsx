import type { Metadata } from "next";
import ConciergeChatClient from "./ConciergeChatClient";

export const metadata: Metadata = {
  title: "Envitefy Concierge | Create Events From a Message or Upload",
  description:
    "Start with one message, upload, or screenshot. Envitefy Concierge collects missing details and builds a live event draft.",
  alternates: { canonical: "/chat" },
};

export default function ChatPage() {
  return <ConciergeChatClient />;
}
