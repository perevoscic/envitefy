"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import GuestChatWidget from "@/components/guest-chat/GuestChatWidget";
import AnimatedButtonLabel from "@/components/ui/AnimatedButtonLabel";
import CompanyTopNav from "./CompanyTopNav";

type CompanyHighlight = {
  label: string;
  value: string;
};

type CompanyPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  highlights?: readonly CompanyHighlight[];
  children: ReactNode;
};

export default function CompanyPageShell({
  children,
  description,
  eyebrow,
  highlights = [],
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref = "/contact",
  secondaryLabel = "Contact us",
  title,
}: CompanyPageShellProps) {
  return (
    <>
      <CompanyTopNav />
      <main className="min-h-screen overflow-hidden bg-[#f7f8f3] text-[#202124]">
        <section className="relative min-h-[70svh] overflow-hidden bg-[#f7f8f3] px-4 pb-16 pt-[calc(8.5rem+env(safe-area-inset-top))] sm:px-6 lg:px-8">
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.42] lg:opacity-[0.56]"
            src="/images/about/hero/envitefy-about-hero-poster.webp"
            style={{ objectPosition: "62% 58%" }}
          />
          <div
            className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#f7f8f3] via-[#f7f8f3]/92 to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,243,0.98)_0%,rgba(247,248,243,0.88)_48%,rgba(247,248,243,0.62)_78%,rgba(247,248,243,0.42)_100%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7f8f3] to-transparent"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase text-[#2f6f64]">
                {eyebrow}
              </p>
              <h1
                className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] text-[#202124] sm:text-6xl lg:text-7xl"
                style={{
                  fontFamily: "var(--font-montserrat), var(--font-sans), system-ui, sans-serif",
                }}
              >
                {title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#52605c] sm:text-lg">
                {description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="cta-shell h-14 rounded-full bg-[#203137] px-7 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(32,49,55,0.18)] transition hover:-translate-y-0.5 hover:bg-[#2b4148]"
                >
                  <AnimatedButtonLabel label={primaryLabel} icon={ArrowRight} />
                </Link>
                <Link
                  href={secondaryHref}
                  className="cta-shell h-14 rounded-full border border-white/80 bg-white/62 px-7 text-sm font-semibold text-[#202124] shadow-[0_14px_36px_rgba(32,49,55,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/82"
                >
                  <AnimatedButtonLabel label={secondaryLabel} />
                </Link>
              </div>
            </div>

            {highlights.length > 0 ? (
              <div className="hidden rounded-lg border border-white/70 bg-white/58 p-5 shadow-[0_24px_70px_rgba(32,49,55,0.12)] backdrop-blur-xl sm:block">
                <div className="grid gap-3">
                  {highlights.map((item) => (
                    <div
                      key={`${item.value}-${item.label}`}
                      className="rounded-lg border border-[#d9ded3] bg-white/70 px-4 py-3"
                    >
                      <p className="text-2xl font-semibold text-[#203137]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase text-[#6f7b75]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {children}
      </main>
      <GuestChatWidget />
    </>
  );
}
