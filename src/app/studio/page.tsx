import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StudioMarketingPage from "./StudioMarketingPage";
import StudioWorkspace from "./StudioWorkspace";

export const metadata: Metadata = {
  title: "Envitefy Studio | Live Cards, Invitation Design & Event Pages",
  description:
    "Explore Envitefy Studio to shape live cards, invitation designs, and hosted event pages with RSVP, registry, schedule, and sharing actions.",
  openGraph: {
    title: "Envitefy Studio | Live Cards, Invitation Design & Event Pages",
    description:
      "Explore Envitefy Studio to shape live cards, invitation designs, and hosted event pages with RSVP, registry, schedule, and sharing actions.",
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
  twitter: {
    card: "summary_large_image",
    title: "Envitefy Studio | Live Cards, Invitation Design & Event Pages",
    description:
      "Explore Envitefy Studio to shape live cards, invitation designs, and hosted event pages with RSVP, registry, schedule, and sharing actions.",
    images: ["https://envitefy.com/og-default.jpg"],
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
