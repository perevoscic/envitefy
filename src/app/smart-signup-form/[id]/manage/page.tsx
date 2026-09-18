import type { Metadata } from "next";
import SignupManageAccess from "@/components/smart-signup-form/SignupManageAccess";

export const metadata: Metadata = {
  title: "Manage your signup | Envitefy",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SignupManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SignupManageAccess eventId={id} />;
}
