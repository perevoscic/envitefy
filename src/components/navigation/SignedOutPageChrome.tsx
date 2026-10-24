"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import ConciergeLauncher from "@/components/navigation/ConciergeLauncher";
import ConciergeSheet from "@/components/navigation/ConciergeSheet";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import { marketingPageNavLinks } from "@/config/navigation";
import {
  getCreateActionForSignupIntent,
  signupIntentForMarketingPath,
  signupSourceForIntent,
} from "@/lib/signup-intent";
import { templateCategoryForPath } from "@/lib/template-categories";

type SignedOutPageChromeProps = {
  activeBottomNavLabel?: string;
  brandHref?: string;
  topNavVariant?: "default" | "glass-dark" | "transparent-dark" | "transparent-light";
};

export default function SignedOutPageChrome({
  brandHref = "/",
  topNavVariant = "default",
}: SignedOutPageChromeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const pageNavLinks = useMemo(() => marketingPageNavLinks(pathname || ""), [pathname]);

  const openAuth = useCallback((mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);
  const signupIntent = useMemo(() => signupIntentForMarketingPath(pathname || ""), [pathname]);
  const signupSource = signupIntent ? signupSourceForIntent(signupIntent) : undefined;
  const createAction = getCreateActionForSignupIntent(signupIntent);
  const templateCategory = templateCategoryForPath(pathname || "");
  const primaryCreateHref = signupIntent === "football" ? "/football/templates" : templateCategory
    ? `/${templateCategory.slug}/templates`
    : createAction?.href || "/";
  const loginSuccessRedirectUrl = createAction?.href || "/";
  const signupSuccessRedirectUrl = createAction?.href || "/";
  const successRedirectUrl =
    authMode === "signup" ? signupSuccessRedirectUrl : loginSuccessRedirectUrl;

  useEffect(() => {
    const auth = searchParams?.get("auth");
    if (auth !== "login" && auth !== "signup") return;
    openAuth(auth);
  }, [openAuth, searchParams]);

  return (
    <>
      <HeroTopNav
        navLinks={pageNavLinks}
        mobileNavLinks={pageNavLinks}
        primaryCtaLabel={templateCategory ? "Browse templates" : "Let's create"}
        authenticatedPrimaryHref={primaryCreateHref}
        brandHref={brandHref}
        variant={topNavVariant}
        loginSuccessRedirectUrl={loginSuccessRedirectUrl}
        onGuestLoginAction={() => openAuth("login")}
        onGuestPrimaryAction={() =>
          templateCategory ? router.push(primaryCreateHref) : openAuth("signup")
        }
      />

      <ConciergeLauncher open={assistantOpen} onOpen={() => setAssistantOpen((open) => !open)} />
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
