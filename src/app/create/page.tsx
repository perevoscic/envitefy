import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  return (
    <Suspense
      fallback={
        <p role="status" className="p-8">
          Loading your workspace…
        </p>
      }
    >
      <CreatePageClient />
    </Suspense>
  );
}
