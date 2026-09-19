"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Home, LayoutTemplate, Menu, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import ScrollAwareBottomNav from "@/components/navigation/ScrollAwareBottomNav";
import ConciergeSheet from "@/components/navigation/ConciergeSheet";
import HeroTopNav from "@/components/navigation/HeroTopNav";
import MenuBottomSheet from "@/components/navigation/MenuBottomSheet";
import { marketingPageNavLinks, type SignedOutBottomNavItem } from "@/config/navigation";
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
  activeBottomNavLabel = "Create",
  brandHref = "/",
  topNavVariant = "default",
}: SignedOutPageChromeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    : createAction?.href || "/chat";
  const loginSuccessRedirectUrl = createAction?.href || "/";
  const signupSuccessRedirectUrl = createAction?.href || "/chat";
  const successRedirectUrl =
    authMode === "signup" ? signupSuccessRedirectUrl : loginSuccessRedirectUrl;
  const templateLink = pageNavLinks.find((link) => link.label === "Templates");
  const sectionLink = pageNavLinks.find((link) => link.label === "How it works") ??
    pageNavLinks.find((link) => link.href.startsWith("#") && link !== templateLink);
  const bottomNavItems: SignedOutBottomNavItem[] = [
    { label: "Home", href: "/", icon: Home, purpose: "Go to the main landing page." },
    ...(templateLink ? [{ ...templateLink, icon: LayoutTemplate, purpose: "Browse this category's templates." }] : []),
    { label: "Create", href: "#concierge", icon: Sparkles, action: "concierge", featured: true, purpose: "Create with Envitefy." },
    ...(sectionLink ? [{ ...sectionLink, icon: Eye, purpose: sectionLink.label }] : []),
    { label: "Menu", href: "#menu", icon: Menu, action: "menu", purpose: "Open the page menu." },
  ];

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

      <ScrollAwareBottomNav
        initialActiveLabel={activeBottomNavLabel}
        items={bottomNavItems}
        onConciergeSelect={() => setAssistantOpen(true)}
        onMenuSelect={() => setMobileMenuOpen(true)}
      />

      <MenuBottomSheet
        navLinks={pageNavLinks}
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
