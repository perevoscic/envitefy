import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingPage from "./landing/page";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    return <Dashboard />;
  }

  return <LandingPage />;
}
