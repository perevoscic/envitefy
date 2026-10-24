"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav, { type HeroTopNavLink } from "@/components/navigation/HeroTopNav";
import PublicConciergeWidget from "@/components/navigation/PublicConciergeWidget";

const companyTopNavLinks: HeroTopNavLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function CompanyTopNav({ concierge = true }: { concierge?: boolean }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <HeroTopNav
        editorialTone="celebration"
        navLinks={companyTopNavLinks}
        primaryCtaLabel="Home"
        authenticatedPrimaryHref="/"
        guestPrimaryHref="/"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
        variant="transparent-light"
      />
      {concierge && <PublicConciergeWidget onSignupSelect={() => openAuth("signup")} />}
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
