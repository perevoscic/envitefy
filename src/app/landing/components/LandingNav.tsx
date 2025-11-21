"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";

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

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "How it works", href: "#how-it-works" },
    { name: "Features", href: "#features" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out bg-[#F8F5FF] ${
          isScrolled || mobileMenuOpen
            ? "backdrop-blur-md border-b border-white/60 shadow-sm py-3"
            : "py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/navElogo.png"
              alt="Envitefy logo"
              width={156}
              height={64}
              priority
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href="/calendar"
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

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`absolute top-full left-0 right-0 bg-[#F8F5FF] border-b border-white/60 shadow-lg md:hidden transition-all duration-300 origin-top overflow-hidden ${
            mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-8 flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-gray-100 w-full my-2" />
            {status === "authenticated" ? (
              <Link
                href="/calendar"
                className="w-full py-3 rounded-xl bg-black text-white text-center font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => openAuth("login")}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-900 font-medium hover:bg-gray-50"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800"
                >
                  Sign up for free
                </button>
              </div>
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
