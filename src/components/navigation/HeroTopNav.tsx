"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";

export type HeroTopNavLink = {
  label: string;
  href: string;
};

type HeroTopNavProps = {
  navLinks: HeroTopNavLink[];
  primaryCtaLabel?: string;
  authenticatedPrimaryHref: string;
  brandHref?: string;
  dashboardHref?: string;
  onGuestLoginAction: () => void;
  onGuestPrimaryAction: () => void;
};

function NavLinkItem({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: () => void;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export default function HeroTopNav({
  navLinks,
  primaryCtaLabel = "Get Started",
  authenticatedPrimaryHref,
  brandHref = "/landing",
  dashboardHref = "/",
  onGuestLoginAction,
  onGuestPrimaryAction,
}: HeroTopNavProps) {
  const { status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8 ${
        isScrolled ? "drop-shadow-[0_18px_44px_rgba(87,67,157,0.14)]" : ""
      }`}
    >
      <div className="relative mx-auto max-w-[1400px]">
        <div className="rounded-full border border-white/90 bg-white/96 px-4 py-3 shadow-[0_18px_44px_rgba(87,67,157,0.1)] backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={brandHref}
              className="group flex min-w-0 flex-1 items-center overflow-hidden lg:flex-none"
              aria-label="Envitefy"
            >
              <EnvitefyWordmark
                scaled={false}
                className="max-w-full text-[1.78rem] leading-none transition-transform duration-300 group-hover:scale-[1.02] sm:text-[1.96rem] md:text-[2.18rem]"
              />
            </Link>

            <nav
              className="hidden items-center gap-1 rounded-full bg-[#fbf8ff] px-2 py-1.5 lg:flex"
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  label={link.label}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#5f5678] transition hover:bg-white hover:text-[#241b45]"
                />
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[#30264f] transition hover:text-[#1f1635]"
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestLoginAction}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[#30264f] transition hover:text-[#1f1635]"
                >
                  Login
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className="cta-shell h-11 rounded-full bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(123,77,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]"
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestPrimaryAction}
                  className="cta-shell h-11 rounded-full bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(123,77,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]"
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfff] bg-white text-[#31264f] shadow-sm lg:hidden"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={
                mobileMenuOpen ? "Close navigation" : "Open navigation"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="hero-top-nav-mobile"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div
          id="hero-top-nav-mobile"
          className={`pointer-events-none absolute right-0 top-full z-10 w-full pt-4 transition-[opacity,transform] duration-300 lg:hidden ${
            mobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
        >
          <div className="pointer-events-auto ml-auto w-full max-w-[20rem] rounded-[1.75rem] border border-[#efe6ff] bg-white/98 p-3 shadow-[0_24px_54px_rgba(87,67,157,0.16)] backdrop-blur-xl">
            <nav
              className="flex flex-col items-end gap-1 text-right"
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}:mobile`}
                  href={link.href}
                  label={link.label}
                  className="w-full rounded-2xl px-4 py-3 text-right text-sm font-semibold text-[#433865] transition hover:bg-[#f8f4ff]"
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>

            <div className="mt-3 flex items-center justify-end gap-3 rounded-[1.4rem] border border-[#eee3ff] bg-[#fcfbff] px-4 py-4">
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className="text-right text-sm font-semibold text-[#30264f]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGuestLoginAction();
                  }}
                  className="text-right text-sm font-semibold text-[#30264f]"
                >
                  Login
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className="cta-shell h-11 rounded-full bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(123,77,255,0.22)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGuestPrimaryAction();
                  }}
                  className="cta-shell h-11 rounded-full bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(123,77,255,0.22)]"
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
