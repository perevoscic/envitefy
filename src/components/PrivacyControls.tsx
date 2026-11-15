"use client";

import Script from "next/script";
import { useSession } from "next-auth/react";
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
  const { status } = useSession();
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
  const showInitialNotice = status === "authenticated" && hasLoaded && preferences === null;

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
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 font-sans text-slate-900 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="privacy-choices-title"
              className="!font-sans text-sm font-semibold tracking-tight"
            >
              Privacy choices
            </h2>
            <a
              href="/privacy"
              className="shrink-0 rounded-sm text-xs text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-violet-300"
            >
              Privacy policy
            </a>
          </div>
          <p id="privacy-choices-description" className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
            Essential storage keeps Envitefy running. Optional analytics is off until you allow it.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => choose(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => choose(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-violet-600 bg-violet-600 px-2 text-xs font-semibold text-white transition hover:border-violet-700 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Allow analytics
            </button>
          </div>
          {isOpen && preferences && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 rounded-sm text-xs font-medium text-slate-600 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:text-slate-300"
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
