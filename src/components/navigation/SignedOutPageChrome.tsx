"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import BottomNav from "@/components/navigation/BottomNav";
import ConciergeSheet from "@/components/navigation/ConciergeSheet";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import MenuBottomSheet from "@/components/navigation/MenuBottomSheet";
import { signedOutMobileMenuLinks } from "@/config/navigation";

type SignedOutPageChromeProps = {
  activeBottomNavLabel?: string;
};

const signedOutPageNavLinks = [
  { label: "Home", href: "/landing" },
  { label: "Examples", href: "/showcase" },
  { label: "Templates", href: "/templates" },
  { label: "Studio", href: "/studio" },
  { label: "Snap", href: "/snap" },
  { label: "Contact", href: "/contact" },
];

export default function SignedOutPageChrome({
  activeBottomNavLabel = "Concierge",
}: SignedOutPageChromeProps) {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const openLandingHash = (href: string) => {
    router.push(href.startsWith("#") ? `/landing${href}` : href);
  };

  return (
    <>
      <HeroTopNav
        navLinks={[...signedOutPageNavLinks]}
        mobileNavLinks={[...signedOutMobileMenuLinks]}
        primaryCtaLabel="Let's create"
        authenticatedPrimaryHref="/chat"
        brandHref="/landing"
        variant="default"
        loginSuccessRedirectUrl="/"
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() => openAuth("signup")}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <BottomNav
          initialActiveLabel={activeBottomNavLabel}
          onConciergeSelect={() => setAssistantOpen(true)}
          onHashSelect={openLandingHash}
          onMenuSelect={() => setMobileMenuOpen(true)}
        />
      </div>

      <MenuBottomSheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        successRedirectUrl="/"
      />
      <ConciergeSheet
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onSignupSelect={() => openAuth("signup")}
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
