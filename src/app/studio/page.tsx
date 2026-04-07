import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StudioMarketingPage from "./StudioMarketingPage";
import StudioWorkspace from "./StudioWorkspace";

export const metadata: Metadata = {
  title: "Studio - Envitefy",
  description:
    "Explore Studio, a public Envitefy space for shaping event ideas, pages, and creative direction.",
  openGraph: {
    title: "Studio - Envitefy",
    description:
      "Explore Studio, a public Envitefy space for shaping event ideas, pages, and creative direction.",
    url: "https://envitefy.com/studio",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy Studio preview",
      },
    ],
    type: "website",
  },
  alternates: { canonical: "/studio" },
};

export default async function StudioPage() {
  const session: any = await getServerSession(authOptions as any);
  if (session?.user) {
    return <StudioWorkspace />;
  }
  return <StudioMarketingPage />;
}
