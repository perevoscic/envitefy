import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "Terms of Use — Envitefy",
    description:
      "By using Envitefy, you agree to these terms. Please read them carefully.",
    url: "https://envitefy.com/terms",
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

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
