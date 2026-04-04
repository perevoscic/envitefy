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
  variant?: "default" | "glass-dark";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

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
  variant = "default",
}: HeroTopNavProps) {
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDarkGlass = variant === "glass-dark";

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
      className={cx(
        "fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8",
      )}
    >
      <div className="relative mx-auto max-w-[1400px]">
        <div
          className={cx(
            "px-4 py-3 backdrop-blur-xl sm:px-6",
            isDarkGlass
              ? cx(
                  "isolate rounded-[1.8rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-[18px] [backface-visibility:hidden] [transform:translateZ(0)]",
                  "border-white/14 bg-[linear-gradient(135deg,rgba(13,9,26,0.68)_0%,rgba(21,12,39,0.56)_54%,rgba(43,20,73,0.48)_100%)] shadow-[0_14px_36px_rgba(3,1,10,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]",
                )
              : "rounded-full border border-white/90 bg-white/96 shadow-[0_18px_44px_rgba(87,67,157,0.1)]",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href={brandHref}
              className="group flex min-w-0 flex-1 items-center overflow-hidden lg:flex-none"
              aria-label="Envitefy"
            >
              <EnvitefyWordmark
                scaled={false}
                tone={isDarkGlass ? "light" : "gradient"}
                className="max-w-full text-[2.05rem] leading-none transition-transform duration-300 group-hover:scale-[1.02] sm:text-[2.28rem] md:text-[2.52rem]"
              />
            </Link>

            <nav
              className={cx(
                "hidden items-center gap-1 px-2 py-1.5 lg:flex",
                isDarkGlass
                  ? "rounded-full border border-white/8 bg-white/[0.03]"
                  : "rounded-full bg-[#fbf8ff]",
              )}
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  label={link.label}
                  className={cx(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white hover:bg-white/[0.1]"
                      : "text-[#5f5678] hover:bg-white hover:text-[#241b45]",
                  )}
                />
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className={cx(
                    "rounded-full px-3 py-2 text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white"
                      : "text-[#30264f] hover:text-[#1f1635]",
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestLoginAction}
                  className={cx(
                    "rounded-full px-3 py-2 text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white"
                      : "text-[#30264f] hover:text-[#1f1635]",
                  )}
                >
                  Login
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className={cx(
                    "cta-shell h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] text-white shadow-[0_18px_38px_rgba(123,77,255,0.24)] hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestPrimaryAction}
                  className={cx(
                    "cta-shell h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] text-white shadow-[0_18px_38px_rgba(123,77,255,0.24)] hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              )}
            </div>

            <button
              type="button"
              className={cx(
                "inline-flex h-11 w-11 items-center justify-center shadow-sm lg:hidden",
                isDarkGlass
                  ? "rounded-full border border-white/14 bg-white/[0.08] text-white"
                  : "rounded-full border border-[#eadfff] bg-white text-[#31264f]",
              )}
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
          <div
            className={cx(
              "pointer-events-auto ml-auto w-full max-w-[20rem] p-3 backdrop-blur-xl",
              isDarkGlass
                ? "rounded-[1.75rem] border border-white/12 bg-[#150b29]/82 shadow-[0_24px_54px_rgba(0,0,0,0.26)]"
                : "rounded-[1.75rem] border border-[#efe6ff] bg-white/98 shadow-[0_24px_54px_rgba(87,67,157,0.16)]",
            )}
          >
            <nav
              className="flex flex-col items-end gap-1 text-right"
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}:mobile`}
                  href={link.href}
                  label={link.label}
                  className={cx(
                    "w-full rounded-2xl px-4 py-3 text-right text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white hover:bg-white/[0.06]"
                      : "text-[#433865] hover:bg-[#f8f4ff]",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>

            <div
              className={cx(
                "mt-3 flex items-center justify-end gap-3 rounded-[1.4rem] px-4 py-4",
                isDarkGlass
                  ? "border border-white/10 bg-white/[0.04]"
                  : "border border-[#eee3ff] bg-[#fcfbff]",
              )}
            >
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className={cx(
                    "text-right text-sm font-semibold",
                    isDarkGlass ? "text-white" : "text-[#30264f]",
                  )}
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
                  className={cx(
                    "text-right text-sm font-semibold",
                    isDarkGlass ? "text-white" : "text-[#30264f]",
                  )}
                >
                  Login
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className={cx(
                    "cta-shell h-11 rounded-full px-5 text-sm font-semibold",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                      : "bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] text-white shadow-[0_16px_32px_rgba(123,77,255,0.22)]",
                  )}
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
                  className={cx(
                    "cta-shell h-11 rounded-full px-5 text-sm font-semibold",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                      : "bg-[linear-gradient(135deg,#7b4dff_0%,#9d63ff_100%)] text-white shadow-[0_16px_32px_rgba(123,77,255,0.22)]",
                  )}
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
