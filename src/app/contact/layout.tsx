import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "Contact — Envitefy",
    description: "Questions, feedback, or partnership ideas? Send us a note.",
    url: "https://envitefy.com/contact",
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
