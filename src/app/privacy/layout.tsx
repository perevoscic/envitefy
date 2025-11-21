import type { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    title: "Privacy Policy — Envitefy",
    description:
      "This page explains the information we collect, how we use and share it, and the choices you have.",
    url: "https://envitefy.com/privacy",
    siteName: "Envitefy",
    images: [
      {
        url: "https://envitefy.com/og-default-v2.jpg",
        width: 1200,
        height: 630,
        alt: "Envitefy preview",
      },
    ],
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

