import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import ConciergeChatClient from "./ConciergeChatClient";

export const metadata: Metadata = {
  title: "Envitefy Concierge | Create Events From a Message or Upload",
  description:
    "Start with one message, upload, or screenshot. Envitefy Concierge collects missing details and builds a live event draft.",
  alternates: { canonical: "/chat" },
};

function cleanFirstName(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.includes("@")) return null;
  const firstName = cleaned.split(" ")[0]?.replace(/[^\p{L}'-]/gu, "").slice(0, 32) || "";
  return /\p{L}/u.test(firstName) ? firstName : null;
}

async function resolveChatUserFirstName() {
  const session = await getServerSession(authOptions as any);
  const email =
    typeof session?.user?.email === "string" ? session.user.email.trim().toLowerCase() : "";
  if (email) {
    try {
      const user = await getUserByEmail(email);
      const fromDb = cleanFirstName(user?.first_name);
      if (fromDb) return fromDb;
    } catch {
      // The session name is enough for greeting if profile lookup is unavailable.
    }
  }
  return cleanFirstName(session?.user?.name);
}

export default async function ChatPage() {
  const userFirstName = await resolveChatUserFirstName();
  return <ConciergeChatClient userFirstName={userFirstName} />;
}
