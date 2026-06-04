"use client";

import { useCallback, useEffect, useState } from "react";

type GrecaptchaClient = {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

declare global {
  interface Window {
    ___grecaptcha_cfg?: {
      render?: string[];
    };
    grecaptcha?: GrecaptchaClient;
    envitefyRecaptchaScriptPromise?: Promise<void>;
    envitefyRecaptchaScriptSiteKey?: string;
  }
}

const RECAPTCHA_SCRIPT_ID = "envitefy-recaptcha-v3";
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

  if (window.envitefyRecaptchaScriptSiteKey === siteKey && window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.envitefyRecaptchaScriptSiteKey === siteKey && window.envitefyRecaptchaScriptPromise) {
    return window.envitefyRecaptchaScriptPromise;
  }

  removeMismatchedRecaptchaScripts(siteKey);

  window.envitefyRecaptchaScriptPromise = new Promise((resolve, reject) => {
    const existingScript = getRecaptchaScripts().find(
      (script) => getRecaptchaRenderKey(script) === siteKey,
    );
    if (existingScript) {
      window.envitefyRecaptchaScriptSiteKey = siteKey;
      if (window.grecaptcha) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          window.envitefyRecaptchaScriptPromise = undefined;
          window.envitefyRecaptchaScriptSiteKey = undefined;
          reject(new Error("Failed to load reCAPTCHA."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    window.envitefyRecaptchaScriptSiteKey = siteKey;
    script.onload = () => resolve();
    script.onerror = () => {
      window.envitefyRecaptchaScriptPromise = undefined;
      window.envitefyRecaptchaScriptSiteKey = undefined;
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

function validateRecaptchaRenderKey(siteKey: string) {
  if (window.___grecaptcha_cfg?.render?.includes(siteKey)) return;

  throw new Error(
    "Configured reCAPTCHA site key was not accepted by api.js. Use a valid reCAPTCHA v3 site key for this domain.",
  );
}

export function useRecaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  const recaptchaConfigured = recaptchaEnabled && siteKey.length > 0;
  const [recaptchaReady, setRecaptchaReady] = useState(!recaptchaConfigured || !recaptchaRequired);

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
      .then(() => validateRecaptchaRenderKey(siteKey))
      .then(() => {
        if (!cancelled) setRecaptchaReady(true);
      })
      .catch((error: unknown) => {
        if (recaptchaRequired) {
          console.error("[recaptcha] Failed to initialize", error);
          if (!cancelled) setRecaptchaReady(false);
          return;
        }

        console.warn("[recaptcha] Skipping reCAPTCHA in development", error);
        if (!cancelled) setRecaptchaReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [recaptchaConfigured, siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string) => {
      if (!recaptchaConfigured) return null;

      try {
        await loadRecaptchaScript(siteKey);
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) throw new Error("reCAPTCHA is unavailable.");

        await waitForGrecaptchaReady(grecaptcha);
        validateRecaptchaRenderKey(siteKey);
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
  };
}
