import PricingStrip from "./PricingStrip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function FinalCta() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session);
  return <PricingStrip isAuthed={isAuthed} />;
}
