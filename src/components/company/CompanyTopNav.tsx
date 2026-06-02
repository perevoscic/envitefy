"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav, { type HeroTopNavLink } from "@/components/navigation/HeroTopNav";

const companyTopNavLinks: HeroTopNavLink[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function CompanyTopNav() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <HeroTopNav
        navLinks={companyTopNavLinks}
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
