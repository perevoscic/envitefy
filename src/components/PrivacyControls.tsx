"use client";

import Script from "next/script";
import { ShieldCheck } from "lucide-react";
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
    window.gtag = function gtag() {
      // Google interprets Arguments objects as gtag commands; plain arrays are ignored.
      // biome-ignore lint/complexity/noArguments: Google's command queue requires the native Arguments object.
      window.dataLayer?.push(arguments);
    };
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
          aria-describedby="privacy-choices-description"
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 font-sans text-slate-900 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.2)] sm:bottom-6 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </span>
            <h2
              id="privacy-choices-title"
              className="!font-sans text-base font-semibold tracking-tight sm:text-lg"
            >
              Your privacy choices
            </h2>
          </div>
          <p id="privacy-choices-description" className="mt-4 text-sm leading-6 text-slate-600">
            We use essential storage to keep you signed in and Envitefy running securely.
            Optional analytics helps us improve your experience and is off unless you allow it.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            You can update your choice anytime.{" "}
            <a
              href="/privacy"
              className="rounded-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Privacy policy
            </a>
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => choose(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold sm:px-5 sm:text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => choose(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-violet-600 bg-violet-600 px-2 text-xs font-semibold sm:px-5 sm:text-sm text-white transition hover:border-violet-700 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Allow analytics
            </button>
          </div>
          {isOpen && preferences && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 rounded-sm text-xs font-medium text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
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
