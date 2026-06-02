"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav, { type HeroTopNavLink } from "@/components/navigation/HeroTopNav";

const guidesTopNavLinks: HeroTopNavLink[] = [
  { label: "Guides", href: "/guides" },
  { label: "PDF", href: "/guides/pdf-to-event-page" },
  { label: "Flyers", href: "/guides/flyer-to-event-page" },
  { label: "RSVP", href: "/guides/rsvp-event-page" },
  { label: "Live cards", href: "/guides/live-card-invitations" },
  { label: "Gymnastics", href: "/guides/gymnastics-meet-page" },
];

export default function GuidesTopNav() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <HeroTopNav
        navLinks={guidesTopNavLinks}
        primaryCtaLabel="Home"
        authenticatedPrimaryHref="/"
        guestPrimaryHref="/"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
        variant="transparent-light"
      />
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
        successRedirectUrl="/"
      />
    </>
  );
}
