"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

type LandingNavProps = {
  gymnasticsHref?: string;
};

export default function LandingNav({
  gymnasticsHref = "#gymnastics",
}: LandingNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { status } = useSession();

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

  const navLinks = [
    { name: "Gymnastics", href: gymnasticsHref },
    { name: "Snap", href: "#snap" },
    { name: "Features", href: "#features" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-[#eadfff] bg-[#fcfbff]/82 backdrop-blur-xl transition-shadow duration-300 ${
          isScrolled ? "shadow-[0_14px_42px_rgba(108,78,199,0.08)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-[max(0.9rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 flex-1 items-center justify-center overflow-hidden md:flex-none md:justify-start"
          >
            <EnvitefyWordmark
              scaled={false}
              className="max-w-full text-[1.45rem] leading-none transition-transform duration-300 group-hover:scale-105 sm:text-[1.65rem] md:text-[1.9rem]"
            />
          </Link>

          <nav
            className="hidden items-center gap-1 rounded-full border border-[#e9deff] bg-white/78 px-2 py-2 shadow-[0_12px_32px_rgba(112,84,198,0.08)] md:flex"
            aria-label="Landing navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#5d547a] transition hover:bg-[#f6f1ff] hover:text-[#251c45]"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            {status === "authenticated" ? (
              <Link
                href="/"
                className="text-sm font-semibold text-[#584f79] transition hover:text-[#241b45]"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-sm font-semibold text-[#584f79] transition hover:text-[#241b45]"
              >
                Log in
              </button>
            )}
            <Link
              href="/gymnastics"
              className="rounded-full bg-[linear-gradient(135deg,#7650ff_0%,#9b73ff_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(118,80,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_44px_rgba(118,80,255,0.28)]"
            >
              Start with Gymnastics
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e9deff] bg-white text-[#31264f] shadow-sm md:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          id="landing-mobile-nav"
          className={`overflow-hidden border-t border-[#f0e8ff] bg-white/92 transition-[max-height,opacity] duration-300 md:hidden ${
            mobileMenuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6">
            <nav className="flex flex-col gap-1" aria-label="Landing navigation">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#433865] transition hover:bg-[#f7f2ff]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-[#eee3ff] bg-[#fbf8ff] px-4 py-4">
              {status === "authenticated" ? (
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#4e4371]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-semibold text-[#4e4371]"
                >
                  Log in
                </button>
              )}
              <Link
                href="/gymnastics"
                className="rounded-full bg-[linear-gradient(135deg,#7650ff_0%,#9b73ff_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(118,80,255,0.2)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start with Gymnastics
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        open={authModalOpen}
        mode="login"
        onClose={() => setAuthModalOpen(false)}
        allowSignupSwitch={false}
      />
    </>
  );
}
