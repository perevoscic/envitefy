"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { type MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppearanceSelector from "@/components/AppearanceSelector";
import LoginForm from "@/components/auth/LoginForm";
import EnvitefyBrandImage from "@/components/branding/EnvitefyBrandImage";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import type { MarketingTone } from "@/components/marketing/MarketingPage";
import ArrowFillButton from "@/components/ui/ArrowFillButton";
import ArrowFillLink from "@/components/ui/ArrowFillLink";
import { ENVITEFY_BRAND_ASSETS } from "@/lib/brand-assets";
import editorialStyles from "./editorial-navigation.module.css";
import appearanceStyles from "./navigation-appearance.module.css";
import landingHeaderStyles from "./public-landing-header.module.css";
import scrollStyles from "./scroll-aware-header.module.css";
import useScrollAwareHeader from "./useScrollAwareHeader";

export type HeroTopNavLink = {
  label: string;
  href: string;
};

type HeroTopNavProps = {
  navLinks: HeroTopNavLink[];
  mobileNavLinks?: HeroTopNavLink[];
  primaryCtaLabel?: string;
  authenticatedPrimaryHref: string;
  brandHref?: string;
  dashboardHref?: string;
  guestPrimaryHref?: string;
  loginSuccessRedirectUrl?: string;
  mobileLogoOnly?: boolean;
  externalMobileLogin?: boolean;
  onGuestLoginAction: () => void;
  onGuestPrimaryAction: () => void;
  onGuestSignupAction?: () => void;
  showMobileMenuAuthActions?: boolean;
  hideEditorialPrimary?: boolean;
  editorialAccountAction?: "login" | "signup";
  editorialTone?: MarketingTone;
  variant?: "default" | "glass-dark" | "transparent-dark" | "transparent-light";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getHashLinkId(href: string) {
  if (!href.startsWith("#") || href.length <= 1) return null;

  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return href.slice(1);
  }
}

function scrollToHashTarget(target: HTMLElement) {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  if (target.closest("[data-marketing-page]")) {
    target.scrollIntoView({ block: "start", behavior });
    return;
  }

  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - 100,
    behavior,
  });
}

function normalizeNavPath(path: string) {
  const withoutQuery = path.split("?")[0]?.split("#")[0] ?? path;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

function getActivePathHref(pathname: string | null, links: HeroTopNavLink[]) {
  if (!pathname) return null;

  const current = normalizeNavPath(pathname);
  const pathLinks = links.filter((link) => !link.href.startsWith("#"));
  const exactMatch = pathLinks.find((link) => normalizeNavPath(link.href) === current);
  if (exactMatch) return exactMatch.href;

  let bestMatch: HeroTopNavLink | null = null;
  for (const link of pathLinks) {
    const href = normalizeNavPath(link.href);
    if (href === "/") continue;
    if (current === href || current.startsWith(`${href}/`)) {
      if (!bestMatch || href.length > normalizeNavPath(bestMatch.href).length) {
        bestMatch = link;
      }
    }
  }

  return bestMatch?.href ?? null;
}

function getActiveUnderlineClass(variant: {
  isTransparentOverHero: boolean;
  isTransparentLight: boolean;
  isDarkGlass: boolean;
}) {
  if (variant.isTransparentOverHero && variant.isTransparentLight) {
    return "bg-[#25172d] shadow-[0_0_10px_rgba(37,23,45,0.28)]";
  }
  if (variant.isTransparentOverHero || variant.isDarkGlass) {
    return "bg-white shadow-[0_0_12px_rgba(255,255,255,0.72)]";
  }
  return "bg-[#6e59db] shadow-[0_0_10px_rgba(110,89,219,0.45)]";
}

const glassGhostLoginClass =
  "cta-shell nav-chrome-motion h-11 shrink-0 rounded-full border border-white/18 bg-white/[0.12] px-6 text-sm font-bold text-white transition-all hover:bg-white/[0.18]";
const lightNavPillClass = "hero-top-nav-pill-light";

function NavLinkItem({
  href,
  label,
  className,
  onClick,
  ariaCurrent,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaCurrent?: "location" | "page";
}) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className={className}
        draggable={false}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      draggable={false}
      onClick={onClick}
      aria-current={ariaCurrent}
    >
      {label}
    </Link>
  );
}

export default function HeroTopNav({
  navLinks,
  mobileNavLinks,
  primaryCtaLabel = "Get Started",
  authenticatedPrimaryHref,
  brandHref = "/",
  dashboardHref = "/",
  guestPrimaryHref,
  loginSuccessRedirectUrl = dashboardHref,
  mobileLogoOnly = false,
  externalMobileLogin = false,
  onGuestLoginAction,
  onGuestPrimaryAction,
  onGuestSignupAction = onGuestPrimaryAction,
  showMobileMenuAuthActions = true,
  hideEditorialPrimary = false,
  editorialAccountAction = "signup",
  editorialTone,
  variant = "default",
}: HeroTopNavProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { headerRef, hidden: headerHidden } = useScrollAwareHeader(mobileMenuOpen);
  const [mobileLoginExpanded, setMobileLoginExpanded] = useState(false);
  const [mobileMenuPortalReady, setMobileMenuPortalReady] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [activeNavHref, setActiveNavHref] = useState<string | null>(null);
  const mobileMenuCardRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuSwipeStartX = useRef<number | null>(null);
  const pendingMobileHashHrefRef = useRef<string | null>(null);
  const isTransparentDark = variant === "transparent-dark";
  const isTransparentLight = variant === "transparent-light";
  const isTransparentVariant = isTransparentDark || isTransparentLight;
  const isDarkGlass = variant === "glass-dark" || isTransparentDark;
  const isTransparentOverHero = isTransparentVariant && !hasScrolledPastHero;
  const useDarkMobileMenu = isDarkGlass;
  const showMobileGuestActions = status !== "authenticated" && !mobileLoginExpanded;
  const resolvedMobileNavLinks = mobileNavLinks ?? navLinks;
  const hasWideNavigation = navLinks.length > 6;
  const pathActiveHref = useMemo(() => getActivePathHref(pathname, navLinks), [pathname, navLinks]);
  const mobilePathActiveHref = useMemo(
    () => getActivePathHref(pathname, resolvedMobileNavLinks),
    [pathname, resolvedMobileNavLinks],
  );
  const resolvedActiveHref = activeNavHref ?? pathActiveHref;

  useEffect(() => {
    setMobileMenuPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isTransparentVariant) {
      setHasScrolledPastHero(false);
      return;
    }

    const syncScrolledState = () => {
      setHasScrolledPastHero(window.scrollY > Math.max(120, window.innerHeight * 0.82));
    };

    syncScrolledState();
    window.addEventListener("scroll", syncScrolledState, { passive: true });
    window.addEventListener("resize", syncScrolledState);

    return () => {
      window.removeEventListener("scroll", syncScrolledState);
      window.removeEventListener("resize", syncScrolledState);
    };
  }, [isTransparentVariant]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hashHrefs = navLinks
      .map((link) => link.href)
      .filter((href) => href.startsWith("#") && href.length > 1);
    if (hashHrefs.length === 0) {
      setActiveNavHref(null);
      return;
    }

    let frameId: number | null = null;

    const getActiveHref = () => {
      const markerY = Math.max(160, window.innerHeight * 0.5);
      const heroSection = document.getElementById("landing-hero");
      const heroRect = heroSection?.getBoundingClientRect();
      if (heroRect && heroRect.top <= markerY && heroRect.bottom > markerY) {
        return null;
      }

      let nextActiveHref: string | null = null;

      for (const href of hashHrefs) {
        const targetId = getHashLinkId(href);
        if (!targetId) continue;

        const target = document.getElementById(targetId);
        if (!target) continue;

        const rect = target.getBoundingClientRect();
        if (rect.top <= markerY && rect.bottom > markerY) {
          return href;
        }
        if (rect.top <= markerY) {
          nextActiveHref = href;
        }
      }

      return nextActiveHref;
    };

    const syncActiveNavHref = () => {
      frameId = null;
      const nextActiveHref = getActiveHref();
      setActiveNavHref((currentHref) =>
        currentHref === nextActiveHref ? currentHref : nextActiveHref,
      );
    };

    const requestSyncActiveNavHref = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(syncActiveNavHref);
    };

    syncActiveNavHref();
    window.addEventListener("scroll", requestSyncActiveNavHref, { passive: true });
    window.addEventListener("resize", requestSyncActiveNavHref);
    window.addEventListener("hashchange", requestSyncActiveNavHref);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestSyncActiveNavHref);
      window.removeEventListener("resize", requestSyncActiveNavHref);
      window.removeEventListener("hashchange", requestSyncActiveNavHref);
    };
  }, [navLinks]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (mobileMenuCardRef.current?.contains(target)) return;
      if (mobileMenuToggleRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
      setMobileLoginExpanded(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen || typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;

    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      const pendingMobileHashHref = pendingMobileHashHrefRef.current;
      pendingMobileHashHrefRef.current = null;

      if (pendingMobileHashHref === null) {
        window.scrollTo(0, scrollY);
        return;
      }

      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => {
        const pendingTargetId = getHashLinkId(pendingMobileHashHref);
        const pendingTarget = pendingTargetId ? document.getElementById(pendingTargetId) : null;

        if (!pendingTarget) return;

        setActiveNavHref(pendingMobileHashHref);
        scrollToHashTarget(pendingTarget);
      });
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileLoginExpanded(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileMenuOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setMobileLoginExpanded(false);
    }
  }, [status]);

  useEffect(() => {
    if (!mobileLogoOnly) return;
    setMobileMenuOpen(false);
    setMobileLoginExpanded(false);
  }, [mobileLogoOnly]);

  useEffect(() => {
    if (!mobileLoginExpanded || typeof window === "undefined") return;

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("hero-top-nav-mobile-login")
        ?.querySelector<HTMLInputElement>("#login-email-input")
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileLoginExpanded]);

  const handleHashLinkClick =
    (href: string, closeMobileMenu = false): MouseEventHandler<HTMLAnchorElement> =>
    (event) => {
      const targetId = getHashLinkId(href);
      if (!targetId || typeof window === "undefined") return;

      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      window.history.pushState(null, "", href);

      if (closeMobileMenu) {
        pendingMobileHashHrefRef.current = href;
        setMobileMenuOpen(false);
        return;
      }

      setActiveNavHref(href);
      scrollToHashTarget(target);
    };

  return (
    <header
      ref={headerRef}
      data-scroll-hidden={headerHidden ? "true" : "false"}
      data-scrolled-past-hero={hasScrolledPastHero ? "true" : "false"}
      data-public-landing-header={editorialTone ? "" : undefined}
      data-create-account-actions={
        editorialTone && editorialAccountAction === "login" && status !== "authenticated"
          ? ""
          : undefined
      }
      className={cx(
        scrollStyles.header,
        editorialTone
          ? landingHeaderStyles.header
          : cx(
              appearanceStyles.chrome,
              appearanceStyles.publicHeader,
              "fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8",
            ),
      )}
    >
      <div className={editorialTone ? landingHeaderStyles.inner : "relative w-full"}>
        {editorialTone ? (
          <>
            <Link href={brandHref} className={landingHeaderStyles.brand} aria-label="Envitefy home">
              <EnvitefyBrandImage
                src={ENVITEFY_BRAND_ASSETS.wordmark.color}
                whiteSrc={ENVITEFY_BRAND_ASSETS.wordmark.white}
                alt="Envitefy"
                width={150}
                height={55}
                priority
              />
            </Link>
            <nav className={landingHeaderStyles.nav} aria-label="Hero navigation">
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  label={link.label}
                  className={landingHeaderStyles.navLink}
                  ariaCurrent={
                    resolvedActiveHref === link.href
                      ? link.href.startsWith("#")
                        ? "location"
                        : "page"
                      : undefined
                  }
                  onClick={link.href.startsWith("#") ? handleHashLinkClick(link.href) : undefined}
                />
              ))}
            </nav>
            <div className={landingHeaderStyles.actions}>
              {status === "authenticated" ? (
                <Link href={dashboardHref} className={landingHeaderStyles.join} data-header-join>
                  Dashboard
                </Link>
              ) : editorialAccountAction === "login" ? (
                <ArrowFillButton
                  label="Sign in"
                  onClick={onGuestLoginAction}
                  className={cx(landingHeaderStyles.join, landingHeaderStyles.signIn)}
                  data-header-join
                />
              ) : (
                <ArrowFillButton
                  label="Let's create"
                  onClick={onGuestSignupAction}
                  className={cx(landingHeaderStyles.join, landingHeaderStyles.signIn)}
                  data-header-join
                />
              )}
              {status !== "authenticated" && editorialAccountAction === "login" && (
                <ArrowFillButton
                  liquidBorder
                  label="Let's create"
                  onClick={onGuestSignupAction}
                  className={landingHeaderStyles.create}
                  data-header-create
                />
              )}
              {hideEditorialPrimary ? null : status === "authenticated" || guestPrimaryHref ? (
                <ArrowFillLink
                  href={status === "authenticated" ? authenticatedPrimaryHref : guestPrimaryHref!}
                  label={primaryCtaLabel}
                  className={landingHeaderStyles.primary}
                  data-header-primary
                />
              ) : primaryCtaLabel !== "Let's create" ? (
                <ArrowFillButton
                  type="button"
                  label={primaryCtaLabel}
                  onClick={onGuestPrimaryAction}
                  className={landingHeaderStyles.primary}
                  data-header-primary
                />
              ) : null}
              <button
                ref={mobileMenuToggleRef}
                type="button"
                className={landingHeaderStyles.menuButton}
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-haspopup="dialog"
                aria-expanded={mobileMenuOpen}
                aria-controls="hero-top-nav-mobile"
                onClick={() => setMobileMenuOpen((value) => !value)}
              >
                {mobileMenuOpen ? (
                  <X size={22} aria-hidden="true" />
                ) : (
                  <Menu size={22} aria-hidden="true" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div
            className={cx(
              mobileLogoOnly
                ? cx("px-1 py-2", isTransparentLight ? "text-[#25172d]" : "text-white")
                : isTransparentOverHero
                  ? cx("px-1 py-2", isTransparentLight ? "text-[#25172d]" : "text-white")
                  : cx(
                      "nav-chrome-glass-header px-4 py-3 sm:px-6",
                      isDarkGlass
                        ? "theme-glass-nav rounded-[2rem] border-white/14 shadow-[0_18px_40px_rgba(3,1,10,0.24)]"
                        : "hero-top-nav-shell-light rounded-[2rem]",
                    ),
            )}
          >
            <div
              className={cx(
                "flex items-center justify-between gap-4",
                "lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center",
                "lg:gap-3 xl:gap-5 2xl:gap-6",
              )}
            >
              <Link
                href={brandHref}
                className="group flex shrink-0 items-center overflow-hidden justify-self-start"
                aria-label="Envitefy"
              >
                <EnvitefyWordmark
                  scaled={false}
                  tone={mobileLogoOnly || !isDarkGlass ? "gradient" : "light"}
                  className={cx(
                    "max-w-full leading-none transition-transform duration-300 group-hover:scale-[1.02]",
                    isTransparentOverHero
                      ? "text-[2.5rem] sm:text-[2.8rem] md:text-[3.1rem]"
                      : "text-[2.25rem] sm:text-[2.5rem] md:text-[2.7rem]",
                    (mobileLogoOnly || !isDarkGlass) && "hero-top-nav-brand-light",
                  )}
                />
              </Link>

              <nav
                className={cx(
                  appearanceStyles.publicLinks,
                  "hidden min-w-0 flex-nowrap items-center justify-center",
                  hasWideNavigation ? "gap-1 lg:flex 2xl:gap-2" : "lg:flex",
                  !hasWideNavigation &&
                    (isTransparentOverHero
                      ? "gap-2 xl:gap-4 2xl:gap-7"
                      : "gap-1 xl:gap-3 2xl:gap-5"),
                )}
                aria-label="Hero navigation"
              >
                {navLinks.map((link) => {
                  const isActive = resolvedActiveHref === link.href;
                  return (
                    <span key={`${link.label}:${link.href}`} className="relative inline-flex">
                      <NavLinkItem
                        href={link.href}
                        label={link.label}
                        ariaCurrent={
                          isActive ? (link.href.startsWith("#") ? "location" : "page") : undefined
                        }
                        onClick={
                          link.href.startsWith("#") ? handleHashLinkClick(link.href) : undefined
                        }
                        className={cx(
                          "nav-chrome-menu-entry nav-chrome-motion relative whitespace-nowrap font-semibold transition",
                          hasWideNavigation ? "text-[13px]" : "text-sm",
                          isTransparentOverHero
                            ? cx(
                                "px-1 py-2",
                                isActive
                                  ? isTransparentLight
                                    ? "text-[#1d1224]"
                                    : "text-white"
                                  : isTransparentLight
                                    ? "text-[#2c2035]/78 hover:text-[#171019]"
                                    : "text-white/82 hover:text-white",
                              )
                            : cx(
                                "rounded-full py-2",
                                hasWideNavigation ? "px-1.5" : "px-1.5 xl:px-3",
                                isActive
                                  ? isDarkGlass
                                    ? "text-white"
                                    : "text-[#4f39dd]"
                                  : isDarkGlass
                                    ? "text-white hover:bg-white/[0.12]"
                                    : lightNavPillClass,
                              ),
                        )}
                      />
                      {isActive ? (
                        <span
                          className={cx(
                            "pointer-events-none absolute inset-x-0 -bottom-0.5 h-[2.5px] origin-center rounded-full",
                            getActiveUnderlineClass({
                              isTransparentOverHero,
                              isTransparentLight,
                              isDarkGlass,
                            }),
                          )}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </nav>

              <div
                className={cx(
                  appearanceStyles.publicActions,
                  "hidden shrink-0 items-center gap-3 justify-self-end",
                  "lg:flex",
                )}
              >
                {status === "authenticated" ? (
                  <Link
                    href={dashboardHref}
                    className={cx(
                      "nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                      isTransparentOverHero
                        ? isTransparentLight
                          ? "text-[#25172d]"
                          : "text-white"
                        : isDarkGlass
                          ? "text-white"
                          : lightNavPillClass,
                    )}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <ArrowFillButton
                    type="button"
                    label="Login"
                    onClick={onGuestLoginAction}
                    className={cx(
                      landingHeaderStyles.legacyLogin,
                      isTransparentOverHero && isTransparentLight
                        ? cx(
                            landingHeaderStyles.legacyLoginLightHero,
                            "cta-shell nav-chrome-motion h-11 shrink-0 rounded-full border border-[#25172d]/10 bg-[#25172d]/8 px-6 text-sm font-bold text-[#25172d] transition-all hover:bg-[#25172d]/12",
                          )
                        : isDarkGlass
                          ? cx(landingHeaderStyles.legacyLoginGlass, glassGhostLoginClass)
                          : "cta-shell nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                      !isTransparentOverHero && !isDarkGlass && lightNavPillClass,
                    )}
                  />
                )}

                {status === "authenticated" ? (
                  <ArrowFillLink
                    href={authenticatedPrimaryHref}
                    label={primaryCtaLabel}
                    className={cx(
                      landingHeaderStyles.legacyPrimary,
                      isDarkGlass && landingHeaderStyles.legacyPrimaryGlass,
                      "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                      isDarkGlass
                        ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                        : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                    )}
                  />
                ) : guestPrimaryHref ? (
                  <ArrowFillLink
                    href={guestPrimaryHref}
                    label={primaryCtaLabel}
                    className={cx(
                      landingHeaderStyles.legacyPrimary,
                      (isDarkGlass || isTransparentOverHero) &&
                        landingHeaderStyles.legacyPrimaryGlass,
                      "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                      isDarkGlass || isTransparentOverHero
                        ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                        : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                    )}
                  />
                ) : (
                  <ArrowFillButton
                    type="button"
                    label={primaryCtaLabel}
                    onClick={onGuestPrimaryAction}
                    className={cx(
                      landingHeaderStyles.legacyPrimary,
                      (isDarkGlass || isTransparentOverHero) &&
                        landingHeaderStyles.legacyPrimaryGlass,
                      "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                      isDarkGlass || isTransparentOverHero
                        ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                        : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                    )}
                  />
                )}
              </div>

              <button
                ref={mobileMenuToggleRef}
                type="button"
                className={cx(
                  mobileLogoOnly ? "hidden" : "inline-flex",
                  "nav-chrome-motion h-11 w-11 items-center justify-center shadow-sm",
                  "lg:hidden",
                  isTransparentOverHero && isTransparentLight
                    ? "rounded-full border border-[#25172d]/10 bg-[#25172d]/8 text-[#25172d]"
                    : isDarkGlass
                      ? "rounded-full border border-white/14 bg-white/[0.08] text-white"
                      : "nav-chrome-pill-secondary rounded-full text-[#31264f]",
                  isTransparentOverHero && "justify-self-end",
                )}
                onClick={() => setMobileMenuOpen((value) => !value)}
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileMenuOpen}
                aria-controls="hero-top-nav-mobile"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {mobileMenuPortalReady && typeof document !== "undefined"
          ? createPortal(
              <div
                id="hero-top-nav-mobile"
                data-editorial-tone={editorialTone}
                aria-hidden={!mobileMenuOpen}
                inert={!mobileMenuOpen ? true : undefined}
                onPointerDownCapture={(event) => {
                  mobileMenuSwipeStartX.current = event.clientX;
                }}
                onPointerUpCapture={(event) => {
                  const swipeStartX = mobileMenuSwipeStartX.current;
                  mobileMenuSwipeStartX.current = null;

                  if (swipeStartX != null && event.clientX - swipeStartX > 100) {
                    setMobileMenuOpen(false);
                    setMobileLoginExpanded(false);
                  }
                }}
                className={cx(
                  appearanceStyles.chrome,
                  appearanceStyles.mobileMenu,
                  editorialTone && editorialStyles.menu,
                  "!fixed inset-0 z-[1000] h-dvh w-screen touch-pan-y !overflow-y-auto overscroll-y-contain px-4 pb-6 pt-[max(0.9rem,env(safe-area-inset-top))] transition-[transform,opacity] duration-300 ease-out will-change-transform [-webkit-overflow-scrolling:touch]",
                  "lg:hidden",
                  mobileMenuOpen
                    ? "pointer-events-auto translate-x-0 opacity-100"
                    : "pointer-events-none translate-x-full opacity-0",
                  useDarkMobileMenu
                    ? "theme-glass-menu bg-[#150c29] text-white shadow-[0_30px_80px_rgba(4,1,14,0.5)]"
                    : "bg-[linear-gradient(180deg,#faf7ff_0%,#f4efff_100%)] text-[#31264f] shadow-[0_30px_80px_rgba(80,61,150,0.2)]",
                )}
              >
                <div
                  ref={mobileMenuCardRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Hero navigation"
                  className="relative mx-auto flex min-h-full w-full max-w-[1400px] flex-col"
                >
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={brandHref}
                      className="group flex min-w-0 flex-1 items-center overflow-hidden"
                      aria-label="Envitefy"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <EnvitefyWordmark
                        scaled={false}
                        tone={useDarkMobileMenu ? "light" : "gradient"}
                        className={cx(
                          "max-w-full text-[2.05rem] leading-none transition-transform duration-300 group-hover:scale-[1.02]",
                          !useDarkMobileMenu && "hero-top-nav-brand-light",
                        )}
                      />
                    </Link>

                    <button
                      type="button"
                      className={cx(
                        "nav-chrome-motion inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm",
                        editorialTone && editorialStyles.secondaryAction,
                        useDarkMobileMenu
                          ? "border border-white/16 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                          : "nav-chrome-pill-secondary text-[#31264f]",
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close navigation"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav
                    className="mt-8 flex flex-1 flex-col items-end justify-start gap-0 pb-8 text-right"
                    aria-label="Hero navigation"
                  >
                    {resolvedMobileNavLinks.map((link) => {
                      const isActive = (activeNavHref ?? mobilePathActiveHref) === link.href;
                      return (
                        <span key={`${link.label}:${link.href}:mobile`} className="relative w-full">
                          <NavLinkItem
                            href={link.href}
                            label={link.label}
                            ariaCurrent={
                              isActive
                                ? link.href.startsWith("#")
                                  ? "location"
                                  : "page"
                                : undefined
                            }
                            className={cx(
                              "nav-chrome-menu-entry nav-chrome-motion relative flex min-h-11 w-full items-center justify-end rounded-2xl px-4 py-1.5 text-right text-base font-semibold transition",
                              editorialTone && editorialStyles.navLink,
                              isActive
                                ? useDarkMobileMenu
                                  ? "text-white"
                                  : "text-[#4f39dd]"
                                : useDarkMobileMenu
                                  ? "text-white/74 hover:bg-white/[0.08] hover:text-white"
                                  : lightNavPillClass,
                            )}
                            onClick={
                              link.href.startsWith("#")
                                ? handleHashLinkClick(link.href, true)
                                : () => setMobileMenuOpen(false)
                            }
                          />
                          {isActive ? (
                            <span
                              className={cx(
                                "pointer-events-none absolute right-4 bottom-1.5 h-[2px] w-12 rounded-full",
                                editorialTone && editorialStyles.activeIndicator,
                                useDarkMobileMenu ? "bg-white" : "bg-[#6e59db]",
                              )}
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      );
                    })}

                    <div className="mt-3 flex min-h-11 w-full items-center justify-end px-4 py-2 text-sm">
                      <AppearanceSelector compact />
                    </div>

                    {showMobileMenuAuthActions ? (
                      <>
                        {status === "authenticated" ? (
                          <Link
                            href={dashboardHref}
                            className={cx(
                              "nav-chrome-motion mt-1.5 w-full rounded-2xl px-4 py-3 text-right text-base font-semibold transition",
                              editorialTone && editorialStyles.navLink,
                              useDarkMobileMenu
                                ? "text-white/74 hover:bg-white/[0.08] hover:text-white"
                                : lightNavPillClass,
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        ) : (
                          <>
                            {showMobileGuestActions ? (
                              <ArrowFillButton
                                type="button"
                                label="Login"
                                aria-expanded={mobileLoginExpanded}
                                aria-controls="hero-top-nav-mobile-login"
                                onClick={() => {
                                  if (externalMobileLogin) {
                                    setMobileMenuOpen(false);
                                    onGuestLoginAction();
                                  } else setMobileLoginExpanded((value) => !value);
                                }}
                                className={cx(
                                  "cta-shell mt-1.5 self-end nav-chrome-motion rounded-2xl px-6 py-3 text-center text-base font-semibold transition",
                                  landingHeaderStyles.legacyLogin,
                                  editorialTone && landingHeaderStyles.editorialMenuLogin,
                                  useDarkMobileMenu
                                    ? cx(
                                        landingHeaderStyles.legacyLoginGlass,
                                        "border border-white/16 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/[0.12]",
                                      )
                                    : lightNavPillClass,
                                )}
                              />
                            ) : null}

                            <div
                              id="hero-top-nav-mobile-login"
                              aria-hidden={!mobileLoginExpanded}
                              inert={!mobileLoginExpanded ? true : undefined}
                              className={cx(
                                "grid w-full transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                                mobileLoginExpanded
                                  ? "mt-3 grid-rows-[1fr] opacity-100"
                                  : "mt-0 grid-rows-[0fr] opacity-0",
                              )}
                            >
                              <div className="overflow-hidden">
                                <div
                                  className={cx(
                                    "rounded-[2rem] px-4 py-4",
                                    editorialTone && editorialStyles.loginPanel,
                                    useDarkMobileMenu
                                      ? "border border-white/16 bg-white/[0.08] shadow-[0_18px_44px_rgba(4,1,14,0.28)]"
                                      : "border border-[#e7dcff] bg-white/92 shadow-[0_18px_44px_rgba(89,70,171,0.12)]",
                                  )}
                                >
                                  <LoginForm
                                    variant="inline"
                                    inlineTone={useDarkMobileMenu ? "dark" : "light"}
                                    successRedirectUrl={loginSuccessRedirectUrl}
                                    onInlineCancel={() => setMobileLoginExpanded(false)}
                                    onSwitchMode={() => {
                                      setMobileLoginExpanded(false);
                                      setMobileMenuOpen(false);
                                      onGuestSignupAction();
                                    }}
                                    onSuccess={() => {
                                      setMobileLoginExpanded(false);
                                      setMobileMenuOpen(false);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {status === "authenticated" ? (
                          <ArrowFillLink
                            href={authenticatedPrimaryHref}
                            label={primaryCtaLabel}
                            className={cx(
                              landingHeaderStyles.legacyPrimary,
                              useDarkMobileMenu && landingHeaderStyles.legacyPrimaryGlass,
                              editorialTone && landingHeaderStyles.editorialMenuPrimary,
                              "mt-1.5 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                              editorialTone && editorialStyles.primaryAction,
                              useDarkMobileMenu
                                ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                                : "nav-chrome-pill-primary text-white",
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          />
                        ) : showMobileGuestActions ? (
                          guestPrimaryHref ? (
                            <ArrowFillLink
                              href={guestPrimaryHref}
                              label={primaryCtaLabel}
                              className={cx(
                                landingHeaderStyles.legacyPrimary,
                                useDarkMobileMenu && landingHeaderStyles.legacyPrimaryGlass,
                                editorialTone && landingHeaderStyles.editorialMenuPrimary,
                                "mt-2 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                                editorialTone && editorialStyles.primaryAction,
                                useDarkMobileMenu
                                  ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                                  : "nav-chrome-pill-primary text-white",
                              )}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileLoginExpanded(false);
                              }}
                            />
                          ) : (
                            <ArrowFillButton
                              type="button"
                              label={primaryCtaLabel}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileLoginExpanded(false);
                                onGuestPrimaryAction();
                              }}
                              className={cx(
                                landingHeaderStyles.legacyPrimary,
                                useDarkMobileMenu && landingHeaderStyles.legacyPrimaryGlass,
                                editorialTone && landingHeaderStyles.editorialMenuPrimary,
                                "mt-2 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                                editorialTone && editorialStyles.primaryAction,
                                useDarkMobileMenu
                                  ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                                  : "nav-chrome-pill-primary text-white",
                              )}
                            />
                          )
                        ) : null}
                      </>
                    ) : null}
                  </nav>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </header>
  );
}
