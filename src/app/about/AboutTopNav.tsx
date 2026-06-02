"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import HeroTopNav, { type HeroTopNavLink } from "@/components/navigation/HeroTopNav";

const aboutTopNavLinks: HeroTopNavLink[] = [
  { label: "What we build", href: "#what-we-build" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Product proof", href: "#product-proof" },
  { label: "Who it serves", href: "#who-it-serves" },
  { label: "Start", href: "#start" },
];

export default function AboutTopNav() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <HeroTopNav
        navLinks={aboutTopNavLinks}
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
