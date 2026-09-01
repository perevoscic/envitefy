"use client";

import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCallback, useEffect, useState } from "react";
import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "@/lib/google-analytics";
import {
  ANALYTICS_READY_EVENT,
  PRIVACY_CHOICES_OPEN_EVENT,
  readPrivacyPreferences,
  savePrivacyPreferences,
  type PrivacyPreferences,
} from "@/lib/privacy-preferences";

function removeGoogleAnalyticsCookies() {
  for (const rawCookie of document.cookie.split(";")) {
    const name = rawCookie.split("=")[0]?.trim();
    if (name === "_ga" || name?.startsWith("_ga_")) {
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks broad support; expire legacy GA cookies best-effort.
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }
}

export default function PrivacyControls() {
  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setPreferences(readPrivacyPreferences());
    setHasLoaded(true);
    const openChoices = () => setIsOpen(true);
    window.addEventListener(PRIVACY_CHOICES_OPEN_EVENT, openChoices);
    return () => window.removeEventListener(PRIVACY_CHOICES_OPEN_EVENT, openChoices);
  }, []);

  const choose = useCallback((analytics: boolean) => {
    const next = savePrivacyPreferences(analytics);
    if (!analytics) removeGoogleAnalyticsCookies();
    setPreferences(next);
    setIsOpen(false);
  }, []);

  const initializeAnalytics = useCallback(() => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
  }, []);

  const analyticsEnabled = preferences?.analytics === true;
  const showInitialNotice = hasLoaded && preferences === null;

  return (
    <>
      {analyticsEnabled && (
        <>
          <Script
            id="envitefy-ga4"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ANALYTICS_MEASUREMENT_ID)}`}
            strategy="afterInteractive"
            onLoad={initializeAnalytics}
          />
          <SpeedInsights />
        </>
      )}

      {(showInitialNotice || isOpen) && (
        <section
          aria-labelledby="privacy-choices-title"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-[#d7c5a5] bg-[#fcfbf7] p-5 text-[#241c2b] shadow-[0_24px_70px_rgba(33,26,35,0.24)] sm:bottom-5 sm:p-6"
        >
          <h2 id="privacy-choices-title" className="text-lg font-semibold">
            Your privacy choices
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#665d68]">
            Envitefy uses necessary storage for login, security, and core features. Optional analytics
            helps us measure product performance and stays off unless you allow it. Analytics page
            paths exclude URL query strings.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => choose(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#203137] bg-white px-5 text-sm font-semibold text-[#203137] transition hover:bg-[#edf9f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6f64] focus-visible:ring-offset-2"
            >
              Use necessary only
            </button>
            <button
              type="button"
              onClick={() => choose(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#203137] bg-[#203137] px-5 text-sm font-semibold text-white transition hover:bg-[#2b4148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6f64] focus-visible:ring-offset-2"
            >
              Allow analytics
            </button>
          </div>
          {isOpen && preferences && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 text-sm font-semibold text-[#52605c] underline underline-offset-4"
            >
              Keep current choice
            </button>
          )}
        </section>
      )}
    </>
  );
}

export function PrivacyChoicesButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(PRIVACY_CHOICES_OPEN_EVENT))}
      className={className}
    >
      Privacy choices
    </button>
  );
}
