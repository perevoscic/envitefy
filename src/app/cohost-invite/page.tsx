import type { Metadata } from "next";
import CoHostInvitation from "./CoHostInvitation";
export const metadata: Metadata = {
  title: "Co-host invitation | Envitefy",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function CoHostInvitationPage() {
  return <CoHostInvitation />;
}
