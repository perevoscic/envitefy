"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface SnapWindow extends Window {
  __snapInstallDeferredPrompt?: BeforeInstallPromptEvent | null;
  __snapInstallBridgeReady?: boolean;
}

type OSKey = "windows" | "macos" | "android" | "ios" | "ipados" | "unknown";
type BrowserKey = "chrome" | "safari" | "edge" | "firefox" | "unknown";

interface PlatformInfo {
  os: OSKey;
  osLabel: string;
  browser: BrowserKey;
  browserLabel: string;
}

interface InstallGuide extends PlatformInfo {
  supported: boolean;
  steps: string[];
  note?: string;
  unsupportedMessage?: string;
}

const OS_LABELS: Record<OSKey, string> = {
  windows: "Windows",
  macos: "macOS",
  android: "Android",
  ios: "iOS",
  ipados: "iPadOS",
  unknown: "your device",
};

const BROWSER_LABELS: Record<BrowserKey, string> = {
  chrome: "Chrome",
  safari: "Safari",
  edge: "Edge",
  firefox: "Firefox",
  unknown: "your browser",
};

const getPlatformInfo = (win: Window): PlatformInfo => {
  const nav = win.navigator;
  const vendor = nav.vendor ?? "";
  const uaSource = `${nav.userAgent ?? ""} ${vendor}`.toLowerCase();
  const maxTouchPoints =
    typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : 0;
  const isTouchMac =
    (uaSource.includes("macintosh") || uaSource.includes("mac os x")) &&
    maxTouchPoints > 1;

  let os: OSKey = "unknown";
  if (uaSource.includes("windows")) {
    os = "windows";
  } else if (uaSource.includes("android")) {
    os = "android";
  } else if (uaSource.includes("ipad") || isTouchMac) {
    os = "ipados";
  } else if (uaSource.includes("iphone") || uaSource.includes("ipod")) {
    os = "ios";
  } else if (uaSource.includes("mac os x") || uaSource.includes("macintosh")) {
    os = "macos";
  }

  let browser: BrowserKey = "unknown";
  const isEdge =
    uaSource.includes("edg/") ||
    uaSource.includes("edgios") ||
    uaSource.includes("edga/");
  const isFirefox = uaSource.includes("fxios") || uaSource.includes("firefox/");
  const isChromeLike =
    (uaSource.includes("chrome/") ||
      uaSource.includes("chromium/") ||
      uaSource.includes("crios") ||
      uaSource.includes("crmo/")) &&
    !isEdge;
  const isSafariLike =
    uaSource.includes("safari/") &&
    !uaSource.includes("chrome/") &&
    !uaSource.includes("crios") &&
    !uaSource.includes("chromium/") &&
    !uaSource.includes("crmo/") &&
    !isFirefox &&
    !isEdge;

  if (isEdge) {
    browser = "edge";
  } else if (isFirefox) {
    browser = "firefox";
  } else if (isChromeLike) {
    browser = "chrome";
  } else if (isSafariLike) {
    browser = "safari";
  }

  return {
    os,
    osLabel: OS_LABELS[os],
    browser,
    browserLabel: BROWSER_LABELS[browser],
  };
};

const resolveInstallGuide = (win: Window): InstallGuide => {
  const platform = getPlatformInfo(win);

  const withSteps = (steps: string[], note?: string): InstallGuide => ({
    ...platform,
    supported: true,
    steps,
    note,
    unsupportedMessage: undefined,
  });

  const unsupported = (message: string, note?: string): InstallGuide => ({
    ...platform,
    supported: false,
    steps: [],
    unsupportedMessage: message,
    note,
  });

  switch (platform.os) {
    case "windows": {
      switch (platform.browser) {
        case "chrome":
          return withSteps(
            [
              "Click the install icon (computer with a down arrow) in the Chrome address bar.",
              'When the dialog opens, choose "Install" to create the Envitefy app.',
            ],
            'If you do not see the icon, open the Chrome menu (three dots) and choose "Install Envitefy".'
          );
        case "edge":
          return withSteps(
            [
              "Open the Edge menu (three dots) on the toolbar.",
              'Choose "Apps" and then "Install this site as an app".',
              "Click Install to confirm.",
            ],
            'Newer versions may show "Install Envitefy" directly in the menu.'
          );
        case "firefox":
          return unsupported(
            "Firefox on Windows does not support installing Envitefy as a progressive web app.",
            "Open Envitefy in Chrome or Edge if you want an installable app experience."
          );
        case "safari":
          return unsupported(
            "Safari is not available on Windows, so installation is not supported.",
            "Try Chrome or Edge on Windows to install Envitefy."
          );
        default:
          break;
      }
      break;
    }
    case "macos": {
      switch (platform.browser) {
        case "safari":
          return withSteps(
            [
              "In Safari, open the File menu.",
              'Choose "Add to Dock".',
              'Click "Add" when the confirmation dialog appears.',
            ],
            "Requires macOS Sonoma 14 or later. Earlier macOS releases cannot install web apps from Safari."
          );
        case "chrome":
          return withSteps(
            [
              "Click the install icon (computer with a down arrow) in Chrome's address bar.",
              'Select "Install" to confirm.',
            ],
            'You can also open the Chrome menu (three dots) and choose "Install Envitefy".'
          );
        case "edge":
          return withSteps(
            [
              "Open the Edge menu (three dots).",
              'Select "Apps" and then "Install this site as an app".',
              "Click Install.",
            ],
            "Edge places Envitefy inside your Applications folder after installation."
          );
        case "firefox":
          return unsupported(
            "Firefox on macOS does not support installing Envitefy as an app.",
            "Use Safari on macOS Sonoma or Chrome to install Envitefy."
          );
        default:
          break;
      }
      break;
    }
    case "android": {
      switch (platform.browser) {
        case "chrome":
          return withSteps(
            [
              "Tap the Chrome menu (three dots) in the top-right corner.",
              'Choose "Install app" or "Add to Home screen".',
              "Tap Install to finish.",
            ],
            "Envitefy will appear as its own app icon on your home screen."
          );
        case "edge":
          return withSteps(
            [
              "Tap the Edge menu (three dots).",
              'Select "Add to phone".',
              "Tap Install when prompted.",
            ],
            "Edge pins Envitefy to your Android home screen and app drawer."
          );
        case "firefox":
          return withSteps(
            [
              "Tap the Firefox menu (three dots).",
              'Choose "Add to Home screen".',
              "Tap Add to confirm.",
            ],
            "Firefox creates a shortcut that launches Envitefy fullscreen."
          );
        case "safari":
          return unsupported(
            "Safari is not available on Android, so installation is not supported.",
            "Use Chrome, Edge, or Firefox on Android to add Envitefy to your device."
          );
        default:
          break;
      }
      break;
    }
    case "ios":
    case "ipados": {
      const deviceLabel = platform.os === "ios" ? "iPhone" : "iPad";
      const noteSuffix =
        platform.browser === "safari"
          ? "The Envitefy icon will appear on your home screen."
          : 'If the option is missing, open the share menu and choose "Open in Safari" to finish the install.';

      switch (platform.browser) {
        case "safari":
          return withSteps(
            [
              `Tap the share icon (square with an arrow) in Safari on your ${deviceLabel}.`,
              'Scroll and choose "Add to Home Screen".',
              'Tap "Add" in the top-right corner.',
            ],
            noteSuffix
          );
        case "chrome":
        case "edge":
        case "firefox":
          return withSteps(
            [
              `Tap the share icon in ${platform.browserLabel} on your ${deviceLabel}.`,
              'Select "Add to Home Screen".',
              'Tap "Add" to confirm.',
            ],
            noteSuffix
          );
        default:
          break;
      }
      break;
    }
    default:
      break;
  }

  return withSteps(
    [
      "Open your browser menu.",
      'Choose the option labelled "Install app" or "Add to Home Screen".',
      "Confirm the install prompt.",
    ],
    "If no install option appears, try opening Envitefy in Chrome or Safari."
  );
};

const BRIDGE_EVENT_NAME = "snapmydate:beforeinstallprompt";
const DEBUG_STORE_KEY = "__snapInstallDebugLog";

if (typeof window !== "undefined") {
  const w = window as SnapWindow;
  if (!w.__snapInstallBridgeReady) {
    w.__snapInstallBridgeReady = true;
    window.addEventListener("beforeinstallprompt", (event: Event) => {
      const bip = event as BeforeInstallPromptEvent;
      bip.preventDefault?.();
      w.__snapInstallDeferredPrompt = bip;
      window.dispatchEvent(
        new CustomEvent<BeforeInstallPromptEvent | null>(BRIDGE_EVENT_NAME, {
          detail: bip,
        })
      );
      try {
        const dbg: any = window as any;
        if (!Array.isArray(dbg[DEBUG_STORE_KEY])) {
          dbg[DEBUG_STORE_KEY] = [];
        }
        dbg[DEBUG_STORE_KEY].push({
          message: "beforeinstallprompt intercepted (module)",
          ts: Date.now(),
        });
      } catch {
        // noop
      }
    });
  }
}

type PwaInstallButtonProps = {
  startExpanded?: boolean;
};

export default function PwaInstallButton({
  startExpanded = false,
}: PwaInstallButtonProps) {
  const pushDebug = useCallback(
    (message: string, meta?: Record<string, unknown>) => {
      if (typeof window === "undefined") return;
      try {
        const w = window as any;
        if (!Array.isArray(w[DEBUG_STORE_KEY])) {
          w[DEBUG_STORE_KEY] = [];
        }
        w[DEBUG_STORE_KEY].push({
          message,
          meta: meta ?? null,
          ts: Date.now(),
        });
      } catch {
        // noop
      }
    },
    []
  );

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [canInstall, setCanInstall] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [allowedDevice, setAllowedDevice] = useState(false);
  const [maybeInstallable, setMaybeInstallable] = useState(false);
  const [expanded, setExpanded] = useState(startExpanded);
  const [wasManuallyClosed, setWasManuallyClosed] = useState(false);
  const [heroOutOfView, setHeroOutOfView] = useState(false);
  const [recaptchaOffset, setRecaptchaOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [installGuide, setInstallGuide] = useState<InstallGuide | null>(null);
  const [guidePulse, setGuidePulse] = useState(false);

  // Hide if already installed or running in standalone
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone = () => {
      try {
        // iOS/iPadOS Safari exposes `navigator.standalone`
        if ((window.navigator as any).standalone === true) return true;
        if (!window.matchMedia) return false;
        const standaloneMatch = window.matchMedia(
          "(display-mode: standalone)"
        ).matches;
        const fullscreenMatch = window.matchMedia(
          "(display-mode: fullscreen)"
        ).matches;
        if (!standaloneMatch && !fullscreenMatch) return false;
        const isAndroid = /Android/i.test(navigator.userAgent || "");
        // Chrome on Android reports standalone for launched PWAs; check referrer to
        // avoid false positives when the page loads in a normal browser tab.
        const ref = document.referrer || "";
        const androidStandalone =
          ref.startsWith("android-app://") ||
          ref.startsWith("chrome-extension://");
        return isAndroid
          ? androidStandalone
          : standaloneMatch || fullscreenMatch;
      } catch {
        // best effort only
      }
      return false;
    };

    const standalone = isStandalone();
    if (standalone) {
      setCanInstall(false);
      pushDebug("display-mode standalone detected; hiding CTA", {
        referrer: document.referrer || "",
      });
      return;
    }

    // Listen for display-mode changes
    const mql = window.matchMedia
      ? window.matchMedia("(display-mode: standalone)")
      : null;
    const onChange = () => {
      if (isStandalone()) setCanInstall(false);
    };
    try {
      mql?.addEventListener("change", onChange);
    } catch {
      (mql as any)?.addListener?.(onChange);
    }

    // Optional: check for installed related apps (best-effort)
    const maybeCheckRelated = async () => {
      try {
        const anyNav = navigator as any;
        if (anyNav.getInstalledRelatedApps) {
          const related = await anyNav.getInstalledRelatedApps();
          if (Array.isArray(related) && related.length > 0) {
            setCanInstall(false);
          }
          pushDebug("checked installed related apps", {
            count: Array.isArray(related) ? related.length : null,
          });
        }
      } catch {}
    };
    maybeCheckRelated();

    // Heuristic: mark as maybe-installable for fallback flows on browsers
    // that don't expose beforeinstallprompt or haven't fired it yet
    try {
      const hasManifest = !!document.querySelector('link[rel="manifest"]');
      const isSecure =
        window.isSecureContext || location.hostname === "localhost";
      const hasSW = "serviceWorker" in navigator;
      const isStandaloneNow = isStandalone();
      if (hasManifest && isSecure && hasSW && !isStandaloneNow) {
        setMaybeInstallable(true);
        pushDebug("heuristic installable", { hasManifest, isSecure, hasSW });
      }
    } catch {}

    return () => {
      try {
        mql?.removeEventListener("change", onChange);
      } catch {
        (mql as any)?.removeListener?.(onChange);
      }
    };
  }, []);

  // Nudge the FAB above the reCAPTCHA badge when present
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0 as number;
    const compute = () => {
      try {
        const el = document.querySelector(
          ".grecaptcha-badge"
        ) as HTMLElement | null;
        if (!el) {
          setRecaptchaOffset(0);
          return;
        }
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        // Add a small gap above the badge
        setRecaptchaOffset(isVisible ? Math.ceil(rect.height) + 12 : 0);
      } catch {
        // best effort only
      }
    };
    compute();

    const mo = new MutationObserver(() => {
      try {
        cancelAnimationFrame(raf);
      } catch {}
      raf = window.requestAnimationFrame(compute);
    });
    try {
      mo.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    } catch {}
    window.addEventListener("resize", compute);
    const interval = window.setInterval(compute, 2000);
    return () => {
      try {
        mo.disconnect();
      } catch {}
      window.removeEventListener("resize", compute);
      window.clearInterval(interval);
      try {
        cancelAnimationFrame(raf);
      } catch {}
    };
  }, []);

  // Only show on iPads and smaller screens; hide on laptops/desktops
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const mql = window.matchMedia("(max-width: 1024px)");
    const update = () => {
      const allowed = isIOS || mql.matches;
      setAllowedDevice(allowed);
      pushDebug("allowed-device updated", {
        allowed,
        isIOS,
        widthMatch: mql.matches,
      });
    };
    update();
    try {
      mql.addEventListener("change", update);
    } catch {
      (mql as any).addListener?.(update);
    }
    return () => {
      try {
        mql.removeEventListener("change", update);
      } catch {
        (mql as any).removeListener?.(update);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const guide = resolveInstallGuide(window);
    setInstallGuide(guide);
    pushDebug("install guide resolved", {
      os: guide.os,
      browser: guide.browser,
      supported: guide.supported,
    });
  }, [pushDebug]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as SnapWindow;
    const adoptPrompt = (evt: BeforeInstallPromptEvent | null | undefined) => {
      if (!evt) return;
      pushDebug("beforeinstallprompt adopted", {
        hasPrompt: typeof evt.prompt === "function",
      });
      w.__snapInstallDeferredPrompt = evt;
      setDeferred(evt);
      setCanInstall(true);
      setShowIosTip(false);
    };
    adoptPrompt(w.__snapInstallDeferredPrompt ?? null);
    const onPromptReady = (event: Event) => {
      const detail =
        (event as CustomEvent<BeforeInstallPromptEvent | null>).detail ?? null;
      adoptPrompt(detail ?? w.__snapInstallDeferredPrompt ?? null);
    };
    window.addEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);
    // iOS/iPadOS Safari never fires beforeinstallprompt; show a clear fallback
    // Also surface the same fallback UI on macOS Safari for consistency
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) ||
      (/\bMacintosh\b/.test(ua) && "ontouchend" in document);
    const isMacSafari =
      /\bMacintosh\b/.test(ua) &&
      !("ontouchend" in document) &&
      /Safari\//.test(ua) &&
      !/Chrome|Chromium|Edg|OPR\//.test(ua);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      (window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches);
    let iosTimeout: number | undefined;
    const isAppleLike = isIOS || isMacSafari;
    if (isAppleLike && !isStandalone && !w.__snapInstallDeferredPrompt) {
      setShowIosTip(true);
      pushDebug("showing iOS fallback", { isIOS, isMacSafari });
      // Guard in case UA parsing runs before iOS paints toolbar
      iosTimeout = window.setTimeout(() => {
        if (!w.__snapInstallDeferredPrompt) setShowIosTip(true);
      }, 1200);
    }

    return () => {
      window.removeEventListener(BRIDGE_EVENT_NAME, onPromptReady as any);
      if (iosTimeout) window.clearTimeout(iosTimeout);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setCanInstall(false);
      setShowIosTip(false);
      setMaybeInstallable(false);
      setExpanded(false);
      pushDebug("appinstalled event observed");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // Observe hero visibility
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("landing-hero");
    if (!target) {
      setHeroOutOfView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio ?? 0;
        setHeroOutOfView(ratio <= 0.5);
      },
      { root: null, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    observer.observe(target);
    return () => {
      try {
        observer.disconnect();
      } catch {}
    };
  }, []);

  // Show native install button whenever eligible (regardless of viewport/device)
  // Show iOS fallback on all screen sizes; generic fallback when heuristically installable
  const showIosFallback = !canInstall && showIosTip;
  // Force-show generic fallback on localhost for dev/testing
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]");
  const showGenericFallback =
    !canInstall &&
    !showIosFallback &&
    (maybeInstallable || isLocalhost || installGuide !== null);
  const guideOs = installGuide?.os ?? "unknown";
  const guideBrowser = installGuide?.browser ?? "unknown";
  const guideSupported = installGuide?.supported ?? null;
  useEffect(() => {
    pushDebug("install UI flags", {
      canInstall,
      showIosFallback,
      showGenericFallback,
      maybeInstallable,
      heroOutOfView,
      guideOs,
      guideBrowser,
      guideSupported,
    });
  }, [
    canInstall,
    showIosFallback,
    showGenericFallback,
    maybeInstallable,
    heroOutOfView,
    guideOs,
    guideBrowser,
    guideSupported,
    pushDebug,
  ]);

  useEffect(() => {
    const hasAnyOption = canInstall || showIosFallback || showGenericFallback;
    if (!heroOutOfView || !hasAnyOption) {
      if (!startExpanded) {
        setExpanded(false);
      }
      return;
    }
    if (startExpanded && !wasManuallyClosed) {
      setExpanded(true);
    }
  }, [
    heroOutOfView,
    canInstall,
    showIosFallback,
    showGenericFallback,
    startExpanded,
    wasManuallyClosed,
  ]);

  useEffect(() => {
    if (!startExpanded) {
      setWasManuallyClosed(false);
    }
  }, [startExpanded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!guidePulse) return;
    const timer = window.setTimeout(() => setGuidePulse(false), 1400);
    return () => window.clearTimeout(timer);
  }, [guidePulse]);

  if (
    (!canInstall && !showIosFallback && !showGenericFallback) ||
    !heroOutOfView
  )
    return null;

  const fallbackGuide = !canInstall ? installGuide : null;
  const fallbackGuideActive = Boolean(
    !canInstall && (showIosFallback || showGenericFallback) && fallbackGuide
  );
  const showInstallCta =
    canInstall ||
    (fallbackGuideActive &&
      fallbackGuide?.supported &&
      fallbackGuide.os !== "ios" &&
      fallbackGuide.os !== "ipados");
  const headingText = (() => {
    if (canInstall) return "Install app";
    if (fallbackGuide) {
      if (fallbackGuide.supported) {
        return `Install with ${fallbackGuide.browserLabel} on ${fallbackGuide.osLabel}`;
      }
      return `Install not supported in ${fallbackGuide.browserLabel} on ${fallbackGuide.osLabel}`;
    }
    if (showIosFallback) return "Install to Home Screen";
    return "Install app";
  })();
  const subheadingText = (() => {
    if (canInstall) return "Keep Envitefy handy on your device.";
    if (fallbackGuide) {
      if (fallbackGuide.supported) {
        return `Follow the steps for ${fallbackGuide.browserLabel} on ${fallbackGuide.osLabel}.`;
      }
      return `We couldn't find an install option for ${fallbackGuide.browserLabel} on ${fallbackGuide.osLabel}.`;
    }
    return "Keep Envitefy handy on your device.";
  })();
  const fallbackGuideClassName = [
    "rounded-xl",
    "border",
    "border-border",
    "bg-surface/80",
    "p-3",
    "text-sm",
    "shadow-inner",
    guidePulse ? "ring-2 ring-primary/60 animate-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed right-4 z-[1000] pointer-events-auto flex flex-col items-end gap-2"
      style={{ bottom: 16 + recaptchaOffset }}
    >
      {!expanded && (
        <button
          type="button"
          onClick={() => {
            setWasManuallyClosed(false);
            setExpanded(true);
          }}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="Open install options"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 16V3" />
            <path d="M7 8l5-5 5 5" />
            <rect x="4" y="12" width="16" height="8" rx="2" ry="2" />
          </svg>
        </button>
      )}
      {expanded && (
        <div className="relative w-[min(92vw,320px)]">
          <div className="rounded-2xl bg-surface text-foreground border border-border shadow-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-base">{headingText}</div>
                <div className="text-xs opacity-70">{subheadingText}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setWasManuallyClosed(true);
                }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground transition"
                aria-label="Collapse install options"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {showInstallCta && (
              <button
                onClick={async () => {
                  if (deferred) {
                    await deferred.prompt();
                    try {
                      await deferred.userChoice;
                    } finally {
                      setDeferred(null);
                      setCanInstall(false);
                      setShowIosTip(false);
                      try {
                        (window as SnapWindow).__snapInstallDeferredPrompt =
                          null;
                      } catch {}
                    }
                    return;
                  }
                  if (fallbackGuideActive && fallbackGuide?.supported) {
                    setExpanded(true);
                    setGuidePulse(true);
                    pushDebug("install CTA fallback invoked", {
                      os: fallbackGuide.os,
                      browser: fallbackGuide.browser,
                    });
                  }
                }}
                className="w-full rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
              >
                Install app
              </button>
            )}
            {fallbackGuideActive && fallbackGuide && (
              <div className={fallbackGuideClassName}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M12 16V3" />
                      <path d="M7 8l5-5 5 5" />
                      <rect x="4" y="12" width="16" height="8" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium">
                      {fallbackGuide.browserLabel} on {fallbackGuide.osLabel}
                    </div>
                    {fallbackGuide.supported &&
                    fallbackGuide.steps.length > 0 ? (
                      <ol className="list-decimal ml-5 space-y-1">
                        {fallbackGuide.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <div className="opacity-80">
                        {fallbackGuide.unsupportedMessage ??
                          "We couldn't detect an install option for this combination."}
                      </div>
                    )}
                    {fallbackGuide.note && (
                      <div className="text-xs opacity-70">
                        {fallbackGuide.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
