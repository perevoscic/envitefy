"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";
import EnvitefyWordmark from "@/components/branding/EnvitefyWordmark";

export default function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Gymnastics", href: "#gymnastics-hero" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      {!mobileMenuOpen && (
        <header className="fixed inset-x-0 top-0 z-[6500] flex items-center justify-between px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-[#F8F5FF]/95 backdrop-blur-md shadow-sm md:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center text-slate-700 touch-manipulation cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-drawer"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4" cy="5" r="2" />
              <rect x="9" y="3" width="13" height="4" rx="2" />
              <circle cx="4" cy="12" r="2" />
              <rect x="9" y="10" width="13" height="4" rx="2" />
              <circle cx="4" cy="19" r="2" />
              <rect x="9" y="17" width="13" height="4" rx="2" />
            </svg>
          </button>
          <Link
            href="/"
            className="flex h-11 min-w-0 flex-1 items-center justify-end pr-1"
          >
            <EnvitefyWordmark className="text-[1.55rem] leading-none drop-shadow-sm sm:text-[1.65rem]" />
          </Link>
          <div className="h-10 w-10" aria-hidden="true" />
        </header>
      )}

      <div
        className={`fixed inset-0 z-[5999] bg-black/20 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="landing-mobile-drawer"
        className={`fixed left-0 top-0 z-[6000] flex h-full w-[20rem] max-w-[calc(100vw-1.5rem)] flex-col border-r border-slate-200 bg-[#f8f9fb] shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="relative z-10 flex-shrink-0 px-5 pb-3 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.75rem))]">
          <div className="relative rounded-[26px] border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex w-full justify-end pr-24">
              <Link
                href="/"
                className="inline-flex max-w-[190px] translate-y-1 items-center -translate-x-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <EnvitefyWordmark className="text-[1.75rem] leading-none" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
          <div className="mx-1 h-px bg-slate-200" />
          <div className="flex min-h-0 flex-1 flex-col justify-between pt-4">
            <nav className="space-y-2" aria-label="Landing navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-[22px] border border-transparent px-4 py-3 text-[15px] font-semibold text-slate-600 transition hover:border-indigo-100 hover:bg-white hover:text-indigo-600 hover:shadow-[0_16px_30px_rgba(99,102,241,0.14)]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-indigo-200 bg-indigo-50" />
                  <span className="flex-1">{link.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6 space-y-3 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              {status === "authenticated" ? (
                <Link
                  href="/"
                  className="flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("login")}
                    className="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 hidden bg-white transition-all duration-300 ease-in-out md:block ${
          isScrolled
            ? "border-b border-white/60 pt-6 pb-3 shadow-sm backdrop-blur-md"
            : "pt-8 pb-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 flex-1 items-center justify-center overflow-hidden md:flex-none md:justify-start"
          >
            <EnvitefyWordmark
              scaled={false}
              className="max-w-full text-[1.5rem] leading-none transition-transform duration-300 group-hover:scale-105 sm:text-[1.75rem] md:text-[2.2rem]"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button
                  onClick={() => openAuth("login")}
                  className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        open={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthMode}
      />
    </>
  );
}
