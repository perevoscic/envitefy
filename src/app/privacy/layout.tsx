import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "Privacy Policy — Envitefy",
    description:
      "This policy summarizes how Envitefy handles account, event, RSVP, and sign-up information.",
    url: "https://envitefy.com/privacy",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
