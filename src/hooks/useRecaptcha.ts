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
    envitefyRecaptchaScriptSiteKey?: string;
  }
}

const RECAPTCHA_SCRIPT_ID = "envitefy-recaptcha-v3";
const RECAPTCHA_INIT_TIMEOUT_MS = 15_000;
const recaptchaRequired = process.env.NODE_ENV === "production";
const recaptchaEnabled =
  recaptchaRequired || process.env.NEXT_PUBLIC_RECAPTCHA_ENABLE_IN_DEV === "true";

function getRecaptchaRenderKey(script: HTMLScriptElement): string | null {
  try {
    return new URL(script.src).searchParams.get("render");
  } catch {
    return null;
  }
}

function getRecaptchaScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script[src*="recaptcha/api.js"]'));
}

function removeMismatchedRecaptchaScripts(siteKey: string) {
  let removed = false;

  for (const script of getRecaptchaScripts()) {
    if (getRecaptchaRenderKey(script) === siteKey) continue;
    script.remove();
    removed = true;
  }

  if (!removed) return;

  window.grecaptcha = undefined;
  window.envitefyRecaptchaScriptPromise = undefined;
  window.envitefyRecaptchaScriptSiteKey = undefined;
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  if (window.envitefyRecaptchaScriptSiteKey === siteKey && window.envitefyRecaptchaScriptPromise) {
    return window.envitefyRecaptchaScriptPromise;
  }

  removeMismatchedRecaptchaScripts(siteKey);

  window.envitefyRecaptchaScriptSiteKey = siteKey;
  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = getRecaptchaScripts().find(
      (script) => getRecaptchaRenderKey(script) === siteKey,
    );
    const script = existingScript || document.createElement("script");
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error("reCAPTCHA initialization timed out.")),
      RECAPTCHA_INIT_TIMEOUT_MS,
    );
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    const onError = () => finish(new Error("Failed to load reCAPTCHA."));
    const onLoad = () => {
      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) {
        finish(new Error("reCAPTCHA is unavailable."));
        return;
      }
      try {
        // Google's public readiness callback is the contract. Its internal
        // render queue is consumed during initialization and is not key validation.
        grecaptcha.ready(() => finish());
      } catch (error) {
        finish(error instanceof Error ? error : new Error("reCAPTCHA is unavailable."));
      }
    };

    if (existingScript && window.grecaptcha) {
      onLoad();
      return;
    }

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existingScript) {
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  window.envitefyRecaptchaScriptPromise = promise;
  void promise.catch(() => {
    if (window.envitefyRecaptchaScriptPromise !== promise) return;
    window.envitefyRecaptchaScriptPromise = undefined;
    window.envitefyRecaptchaScriptSiteKey = undefined;
    window.grecaptcha = undefined;
  });
  return promise;
}

export function useRecaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const recaptchaConfigured = recaptchaEnabled && siteKey.length > 0;
  const [recaptchaReady, setRecaptchaReady] = useState(!recaptchaConfigured || !recaptchaRequired);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retryRecaptcha = useCallback(() => {
    setRecaptchaError(null);
    setRecaptchaReady(false);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!recaptchaConfigured) {
      setRecaptchaReady(true);
      return;
    }

    let cancelled = false;
    setRecaptchaReady(false);
    setRecaptchaError(null);
    loadRecaptchaScript(siteKey)
      .then(() => {
        if (!cancelled) setRecaptchaReady(true);
      })
      .catch((error: unknown) => {
        if (recaptchaRequired) {
          console.error("[recaptcha] Failed to initialize", error);
          if (!cancelled) {
            setRecaptchaReady(false);
            setRecaptchaError("Security verification couldn't load. Please try again.");
          }
          return;
        }

        console.warn("[recaptcha] Skipping reCAPTCHA in development", error);
        if (!cancelled) setRecaptchaReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recaptchaConfigured, siteKey, attempt]);

  const executeRecaptcha = useCallback(
    async (action: string) => {
      if (!recaptchaConfigured) return null;

      try {
        await loadRecaptchaScript(siteKey);
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) throw new Error("reCAPTCHA is unavailable.");

        return await grecaptcha.execute(siteKey, { action });
      } catch (error) {
        if (recaptchaRequired) throw error;

        console.warn("[recaptcha] Skipping reCAPTCHA in development", error);
        return null;
      }
    },
    [recaptchaConfigured, siteKey],
  );

  return {
    executeRecaptcha,
    recaptchaConfigured,
    recaptchaReady,
    recaptchaError,
    retryRecaptcha,
  };
}
