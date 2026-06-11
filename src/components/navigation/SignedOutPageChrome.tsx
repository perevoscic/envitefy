"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import BottomNav from "@/components/navigation/BottomNav";
import ConciergeSheet from "@/components/navigation/ConciergeSheet";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import MenuBottomSheet from "@/components/navigation/MenuBottomSheet";
import { publicUseCasePrimaryNavLinks, signedOutMobileMenuLinks } from "@/config/navigation";
import {
  getCreateActionForSignupIntent,
  signupIntentForMarketingPath,
  signupSourceForIntent,
} from "@/lib/signup-intent";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openAuth = useCallback((mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);
  const signupIntent = useMemo(
    () => signupIntentForMarketingPath(pathname || ""),
    [pathname],
  );
  const signupSource = signupIntent ? signupSourceForIntent(signupIntent) : undefined;
  const createAction = getCreateActionForSignupIntent(signupIntent);
  const primaryCreateHref = createAction?.href || "/chat";
  const loginSuccessRedirectUrl = createAction?.href || "/";
  const signupSuccessRedirectUrl = createAction?.href || "/chat";
  const successRedirectUrl = authMode === "signup" ? signupSuccessRedirectUrl : loginSuccessRedirectUrl;

  useEffect(() => {
    const auth = searchParams?.get("auth");
    if (auth !== "login" && auth !== "signup") return;
    openAuth(auth);
  }, [openAuth, searchParams]);

  const openLandingHash = (href: string) => {
    router.push(href.startsWith("#") ? `/landing${href}` : href);
  };

  return (
    <>
      <HeroTopNav
        navLinks={[...signedOutPageNavLinks]}
        mobileNavLinks={[...signedOutMobileMenuLinks]}
        primaryCtaLabel="Let's create"
        authenticatedPrimaryHref={primaryCreateHref}
        brandHref={brandHref}
        variant={topNavVariant}
        loginSuccessRedirectUrl={loginSuccessRedirectUrl}
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
        successRedirectUrl={loginSuccessRedirectUrl}
        signupSuccessRedirectUrl={signupSuccessRedirectUrl}
        signupSource={signupSource}
        signupIntent={signupIntent || undefined}
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
        successRedirectUrl={successRedirectUrl}
        signupSource={signupSource}
        signupIntent={signupIntent || undefined}
      />
    </>
  );
}
