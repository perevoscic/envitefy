import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import LandingPage from "./landing/page";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(
    cookieStore.get("__Secure-next-auth.session-token")?.value ||
      cookieStore.get("__Host-next-auth.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value
  );

  // Fallback for post-login races where getServerSession is briefly null
  // but the session cookie already exists.
  if (session || hasSessionCookie) {
    return <Dashboard />;
  }

  return <LandingPage />;
}
