import type { Metadata } from "next";
import CreateLandingPage from "./CreateLandingPage";

const title = "Envitefy Create | From an Idea to an Invitation";
const description =
  "Describe your event or upload an invitation, flyer, or screenshot. Envitefy Create helps gather the details, create a preview, and publish a shareable Live Card or event page.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/envitefy-create" },
  openGraph: {
    title,
    description,
    url: "https://envitefy.com/envitefy-create",
    siteName: "Envitefy",
    type: "website",
    images: [
      {
        url: "/images/marketing/landing-hero-live-card.webp",
        alt: "A celebration ready to share with Envitefy Create",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/images/marketing/landing-hero-live-card.webp"],
  },
};

export default function EnvitefyCreatePage() {
  return <CreateLandingPage />;
}
