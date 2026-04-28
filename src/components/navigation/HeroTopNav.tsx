"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
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
  loginSuccessRedirectUrl?: string;
  onGuestLoginAction: () => void;
  onGuestPrimaryAction: () => void;
  variant?: "default" | "glass-dark";
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const glassGhostLoginClass =
  "cta-shell nav-chrome-motion h-11 shrink-0 rounded-full border border-white/18 bg-white/[0.12] px-6 text-sm font-bold text-white transition-all hover:bg-white/[0.18]";
const lightNavPillClass =
  "hero-top-nav-pill-light";

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
  loginSuccessRedirectUrl = dashboardHref,
  onGuestLoginAction,
  onGuestPrimaryAction,
  variant = "default",
}: HeroTopNavProps) {
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLoginExpanded, setMobileLoginExpanded] = useState(false);
  const mobileMenuCardRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement | null>(null);
  const isDarkGlass = variant === "glass-dark";
  const showMobileGuestActions =
    status !== "authenticated" && !mobileLoginExpanded;

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
    if (!mobileMenuOpen) {
      setMobileLoginExpanded(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (status === "authenticated") {
      setMobileLoginExpanded(false);
    }
  }, [status]);

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

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 px-4 pt-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8",
      )}
    >
      <div className="relative mx-auto max-w-[1400px]">
        <div
          className={cx(
            "nav-chrome-glass-header px-4 py-3 sm:px-6",
            isDarkGlass
              ? cx(
                  "theme-glass-nav rounded-[1.8rem] border-white/14 shadow-[0_18px_40px_rgba(3,1,10,0.24)]",
                )
              : "hero-top-nav-shell-light rounded-[1.8rem]",
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
                className={cx(
                  "max-w-full text-[2.05rem] leading-none transition-transform duration-300 group-hover:scale-[1.02] sm:text-[2.28rem] md:text-[2.52rem]",
                  !isDarkGlass && "hero-top-nav-brand-light",
                )}
              />
            </Link>

            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}`}
                  href={link.href}
                  label={link.label}
                  className={cx(
                    "nav-chrome-motion rounded-full px-4 py-2 text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white hover:bg-white/[0.12]"
                      : lightNavPillClass,
                  )}
                />
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className={cx(
                    "nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white"
                      : lightNavPillClass,
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestLoginAction}
                  className={cx(
                    isDarkGlass
                      ? glassGhostLoginClass
                      : "nav-chrome-motion rounded-full px-3 py-2 text-sm font-semibold transition",
                    !isDarkGlass && lightNavPillClass,
                  )}
                >
                  Login
                </button>
              )}

              {status === "authenticated" ? (
                <Link
                  href={authenticatedPrimaryHref}
                  className={cx(
                    "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onGuestPrimaryAction}
                  className={cx(
                    "cta-shell nav-chrome-motion h-11 rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:bg-[#f3ecff]"
                      : "nav-chrome-pill-primary text-white hover:shadow-[0_22px_44px_rgba(123,77,255,0.28)]",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              )}
            </div>

            <button
              ref={mobileMenuToggleRef}
              type="button"
              className={cx(
                "nav-chrome-motion inline-flex h-11 w-11 items-center justify-center shadow-sm lg:hidden",
                isDarkGlass
                  ? "rounded-full border border-white/14 bg-white/[0.08] text-white"
                  : "nav-chrome-pill-secondary rounded-full text-[#31264f]",
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
          className={`pointer-events-none absolute right-0 top-[calc(100%-0.55rem)] z-10 w-full pt-0 transition-[opacity,transform] duration-300 lg:hidden ${
            mobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
        >
          <div
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute right-5 top-0 h-10 w-[8.75rem]",
              !mobileMenuOpen && "opacity-0",
            )}
          >
            <div
              className={cx(
                "absolute inset-x-0 bottom-0 h-8 rounded-[1.35rem] border shadow-[0_16px_34px_rgba(11,6,24,0.12)] backdrop-blur-[18px]",
                isDarkGlass
                  ? "border-white/10 bg-[linear-gradient(180deg,rgba(21,12,41,0.86),rgba(21,12,41,0.72))]"
                  : "border-[rgba(120,104,197,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,244,255,0.9))]",
              )}
            />
            <div
              className={cx(
                "absolute left-4 right-4 top-1 h-5 rounded-b-full blur-md",
                isDarkGlass ? "bg-white/10" : "bg-white/70",
              )}
            />
          </div>

          <div
            ref={mobileMenuCardRef}
            className={cx(
              "nav-chrome-menu-card relative ml-auto mt-2 w-full max-w-[20rem] p-3",
              mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
              isDarkGlass
                ? "theme-glass-menu rounded-[1.75rem] border border-white/12 shadow-[0_24px_54px_rgba(0,0,0,0.26)]"
                : "rounded-[1.75rem]",
            )}
          >
            <nav
              className="flex flex-col items-end gap-0.5 text-right"
              aria-label="Hero navigation"
            >
              {navLinks.map((link) => (
                <NavLinkItem
                  key={`${link.label}:${link.href}:mobile`}
                  href={link.href}
                  label={link.label}
                  className={cx(
                    "nav-chrome-motion w-full rounded-2xl px-4 py-2.5 text-right text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white hover:bg-white/[0.06]"
                      : lightNavPillClass,
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}

              {status === "authenticated" ? (
                <Link
                  href={dashboardHref}
                  className={cx(
                    "nav-chrome-motion mt-1.5 w-full rounded-2xl px-4 py-2.5 text-right text-sm font-semibold transition",
                    isDarkGlass
                      ? "text-white hover:bg-white/[0.06]"
                      : lightNavPillClass,
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  {showMobileGuestActions ? (
                    <button
                      type="button"
                      aria-expanded={mobileLoginExpanded}
                      aria-controls="hero-top-nav-mobile-login"
                      onClick={() => setMobileLoginExpanded((value) => !value)}
                      className={cx(
                        "mt-1.5 self-end nav-chrome-motion rounded-2xl px-6 py-2.5 text-center text-sm font-semibold transition",
                        isDarkGlass
                          ? glassGhostLoginClass
                          : lightNavPillClass,
                      )}
                    >
                      Login
                    </button>
                  ) : null}

                  <div
                    id="hero-top-nav-mobile-login"
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
                          "rounded-[1.35rem] px-4 py-4",
                          isDarkGlass
                            ? "border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "border border-[#e7dcff] bg-white/92 shadow-[0_18px_44px_rgba(89,70,171,0.12)]",
                        )}
                      >
                        <LoginForm
                          variant="inline"
                          inlineTone={isDarkGlass ? "dark" : "light"}
                          successRedirectUrl={loginSuccessRedirectUrl}
                          onInlineCancel={() => setMobileLoginExpanded(false)}
                          onSwitchMode={() => {
                            setMobileLoginExpanded(false);
                            setMobileMenuOpen(false);
                            onGuestPrimaryAction();
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
                <Link
                  href={authenticatedPrimaryHref}
                  className={cx(
                    "mt-1.5 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                      : "nav-chrome-pill-primary text-white",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </Link>
              ) : showMobileGuestActions ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileLoginExpanded(false);
                    onGuestPrimaryAction();
                  }}
                  className={cx(
                    "mt-2 cta-shell nav-chrome-motion h-11 rounded-full px-5 text-sm font-semibold",
                    isDarkGlass
                      ? "bg-white text-[#140a27] shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
                      : "nav-chrome-pill-primary text-white",
                  )}
                >
                  <AnimatedButtonLabel label={primaryCtaLabel} />
                </button>
              ) : null}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
