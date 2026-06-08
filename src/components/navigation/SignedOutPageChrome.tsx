"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import BottomNav from "@/components/navigation/BottomNav";
import ConciergeSheet from "@/components/navigation/ConciergeSheet";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import MenuBottomSheet from "@/components/navigation/MenuBottomSheet";
import { publicUseCasePrimaryNavLinks, signedOutMobileMenuLinks } from "@/config/navigation";

type SignedOutPageChromeProps = {
  activeBottomNavLabel?: string;
  brandHref?: string;
  topNavVariant?: "default" | "glass-dark" | "transparent-dark" | "transparent-light";
};

const signedOutPageNavLinks = [
  ...publicUseCasePrimaryNavLinks,
];

export default function SignedOutPageChrome({
  activeBottomNavLabel = "Concierge",
  brandHref = "/landing",
  topNavVariant = "default",
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
        authenticatedPrimaryHref="/concierge-v2"
        brandHref={brandHref}
        variant={topNavVariant}
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
        signupSuccessRedirectUrl="/concierge-v2"
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
        successRedirectUrl={authMode === "signup" ? "/concierge-v2" : "/"}
      />
    </>
  );
}
