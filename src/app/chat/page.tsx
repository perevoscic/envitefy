import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import ConciergeChatClient from "./ConciergeChatClient";

type ChatUserProfile = {
  initials: string;
};

export const metadata: Metadata = {
  title: "Envitefy Concierge | Create Events From a Message or Upload",
  description:
    "Start with one message, upload, or screenshot. Envitefy Concierge collects missing details and builds a live event draft.",
  alternates: { canonical: "/chat" },
};

function cleanDisplayName(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned && !cleaned.includes("@") ? cleaned : null;
}

function cleanFirstName(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.includes("@")) return null;
  const firstName =
    cleaned
      .split(" ")[0]
      ?.replace(/[^\p{L}'-]/gu, "")
      .slice(0, 32) || "";
  return /\p{L}/u.test(firstName) ? firstName : null;
}

function profileInitialsFrom(displayName: string | null, email: string) {
  const source = (displayName || email || "U").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  const raw =
    parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`;
  const initials = raw
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 2)
    .toUpperCase();
  return initials || "U";
}

async function resolveChatUserProfile(): Promise<ChatUserProfile> {
  const session = await getServerSession(authOptions as any);
  const email =
    typeof session?.user?.email === "string" ? session.user.email.trim().toLowerCase() : "";
  const sessionName = cleanDisplayName(session?.user?.name);
  let dbFirstName: string | null = null;
  let dbLastName: string | null = null;
  if (email) {
    try {
      const user = await getUserByEmail(email);
      dbFirstName = cleanFirstName(user?.first_name);
      dbLastName = cleanDisplayName(user?.last_name);
    } catch {
      // The session name is enough for chat identity if profile lookup is unavailable.
    }
  }
  const dbDisplayName = [dbFirstName, dbLastName].filter(Boolean).join(" ") || null;
  const displayName = dbDisplayName || sessionName || email || "User";
  return {
    initials: profileInitialsFrom(displayName, email),
  };
}

export default async function ChatPage() {
  const { initials: userInitials } = await resolveChatUserProfile();
  return <ConciergeChatClient userInitials={userInitials} />;
}
