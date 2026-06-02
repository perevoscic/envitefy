"use client";

import { useCallback, useEffect, useState } from "react";

type GrecaptchaClient = {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: GrecaptchaClient;
    envitefyRecaptchaScriptPromise?: Promise<void>;
  }
}

const RECAPTCHA_SCRIPT_ID = "envitefy-recaptcha-v3";

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (window.envitefyRecaptchaScriptPromise) return window.envitefyRecaptchaScriptPromise;

  window.envitefyRecaptchaScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load reCAPTCHA.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      window.envitefyRecaptchaScriptPromise = undefined;
      reject(new Error("Failed to load reCAPTCHA."));
    };
    document.head.appendChild(script);
  });

  return window.envitefyRecaptchaScriptPromise;
}

function waitForGrecaptchaReady(grecaptcha: GrecaptchaClient) {
  return new Promise<void>((resolve) => {
    grecaptcha.ready(resolve);
  });
}

export function useRecaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const recaptchaConfigured = siteKey.length > 0;
  const [recaptchaReady, setRecaptchaReady] = useState(!recaptchaConfigured);

  useEffect(() => {
    if (!recaptchaConfigured) {
      setRecaptchaReady(true);
      return;
    }

    let cancelled = false;
    setRecaptchaReady(false);
    loadRecaptchaScript(siteKey)
      .then(() => {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) throw new Error("reCAPTCHA is unavailable.");
        return waitForGrecaptchaReady(grecaptcha);
      })
      .then(() => {
        if (!cancelled) setRecaptchaReady(true);
      })
      .catch((error: unknown) => {
        console.error("[recaptcha] Failed to initialize", error);
        if (!cancelled) setRecaptchaReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recaptchaConfigured, siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string) => {
      if (!recaptchaConfigured) return null;

      await loadRecaptchaScript(siteKey);
      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) throw new Error("reCAPTCHA is unavailable.");

      await waitForGrecaptchaReady(grecaptcha);
      return grecaptcha.execute(siteKey, { action });
    },
    [recaptchaConfigured, siteKey],
  );

  return {
    executeRecaptcha,
    recaptchaConfigured,
    recaptchaReady,
  };
}
