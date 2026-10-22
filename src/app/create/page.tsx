import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getCreationAccess } from "@/lib/creation-access-server";
import type { InitialCreationAccess } from "@/lib/create/creation-access-client";
import CreatePageClient from "./CreatePageClient";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create an Event Page | Envitefy",
  description:
    "Upload event information, paste a public link or start from scratch. Choose a matching design and review your Event Page before publishing.",
  robots: { index: false, follow: false },
};

export default async function CreatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const identity = session.user.email;
  let initialCreationAccess: InitialCreationAccess | undefined;
  if (identity) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Include verified choices in the first render without holding the route
      // indefinitely when the database is unavailable. The client can retry.
      initialCreationAccess = await Promise.race([
        (async () => {
          const userId = await resolveSessionUserId(session);
          if (!userId) return undefined;
          return { identity, access: await getCreationAccess(userId) };
        })(),
        new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), 1_500); }),
      ]);
    } catch {
      // A failed preload must never fabricate an account's creation grants.
    } finally {
      clearTimeout(timer);
    }
  }
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          Loading your workspace…
        </p>
      }
    >
      <CreatePageClient initialCreationAccess={initialCreationAccess} />
    </Suspense>
  );
}
