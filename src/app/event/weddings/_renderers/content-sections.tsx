import React from "react";
import Image from "next/image";
import { Share2 } from "lucide-react";

export type ThemeConfig = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  decorations?: {
    heroImage?: string;
    [key: string]: unknown;
  };
};

export type EventData = {
  headlineTitle?: string;
  couple?: {
    partner1?: string;
    partner2?: string;
    story?: string;
  };
  date?: string;
  location?: string;
  tagline?: string;
  footer?: string;
  story?: string;
  schedule?: Array<{
    title: string;
    time?: string;
    date?: string;
    location: string;
  }>;
  party?: { name: string; role: string }[];
  travel?: string;
  thingsToDo?: string;
  photos?: string[];
  rsvpEnabled?: boolean;
  rsvpLink?: string;
  registry?: { label?: string; url: string }[];
  venue?: {
    name?: string;
    address?: string;
  };
  when?: string;
  locationUrl?: string;
  registryNote?: string;
  rsvp?: {
    url?: string;
    deadline?: string;
  };
  gallery?: Array<{ url?: string; src?: string; preview?: string }>;
};

export const getLuminance = (hex: string): number => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const pickTextColor = (bg: string) =>
  getLuminance(bg) > 0.6 ? "#1f2937" : "#F9FAFB";

export const ensureContrast = (color: string, bg: string) => {
  const bgLum = getLuminance(bg);
  const cLum = getLuminance(color);
  return Math.abs(bgLum - cLum) < 0.25 ? pickTextColor(bg) : color;
};

export function ContentSections({
  theme,
  event,
  backgroundColor,
}: {
  theme: ThemeConfig;
  event: EventData;
  backgroundColor?: string;
}) {
  const bg = backgroundColor || theme.colors.primary;
  const baseText = pickTextColor(bg);
  const accent = ensureContrast(theme.colors.secondary, bg);

  return (
    <main
      className="w-full max-w-3xl mx-auto px-6 py-12 space-y-16"
      style={{ color: baseText, backgroundColor: bg }}
    >
      {event.story && (
        <section>
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Our Story
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.story}
          </p>
        </section>
      )}

      {event.schedule && event.schedule.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Wedding Schedule
          </h2>
          <div className="space-y-4">
            {event.schedule.map((item, idx) => (
              <div
                key={idx}
                className="border-l-4 pl-4"
                style={{ borderColor: accent }}
              >
                <h3 className="font-medium text-lg">{item.title}</h3>
                <p className="text-sm opacity-80">
                  {item.time} — {item.location}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {event.party && event.party.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Wedding Party
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {event.party.map((p, idx) => (
              <div key={idx}>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm opacity-70">{p.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {event.travel && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Travel
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.travel}
          </p>
        </section>
      )}

      {event.thingsToDo && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Things To Do
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.thingsToDo}
          </p>
        </section>
      )}

      {event.photos && event.photos.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {event.photos.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                className="w-full h-32 object-cover rounded-md"
              />
            ))}
          </div>
        </section>
      )}

      {event.registry && event.registry.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Registry
          </h2>
          <ul className="space-y-2">
            {event.registry.map((r, idx) => (
              <li key={idx}>
                <a
                  href={r.url}
                  className="text-sm underline"
                  style={{ color: accent }}
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.rsvpEnabled && (
        <section className="text-center pt-4">
          <a
            href={event.rsvpLink}
            className="inline-block px-8 py-3 text-sm font-semibold rounded-md"
            style={{
              backgroundColor: accent,
              color: pickTextColor(accent),
            }}
          >
            RSVP
          </a>
        </section>
      )}
    </main>
  );
}

export function Footer({
  theme,
  event,
  backgroundColor,
}: {
  theme: ThemeConfig;
  event: EventData;
  backgroundColor?: string;
}) {
  const bg =
    backgroundColor ||
    theme.colors.background ||
    theme.colors.primary ||
    "#0f766e";
  const textColor = pickTextColor(bg);
  const isDark = getLuminance(bg) < 0.5;
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)";
  const buttonClasses = isDark
    ? "border border-white/20 bg-white/10 hover:bg-white/20 text-white"
    : "border border-slate-300 bg-white hover:bg-slate-50 text-slate-800";
  const googleIconSrc = isDark
    ? "/brands/google-white.svg"
    : "/brands/google.svg";
  const appleIconSrc = isDark
    ? "/brands/apple-white.svg"
    : "/brands/apple-black.svg";
  const outlookIconSrc = isDark
    ? "/brands/microsoft-white.svg"
    : "/brands/microsoft.svg";

  const buildEventDetails = () => {
    const title =
      event.headlineTitle ||
      event.couple?.partner1 ||
      event.couple?.partner2 ||
      "Your Names";

    const location =
      event.location || event.venue?.address || event.venue?.name || "";
    const description = event.story || event.tagline || "";

    let start: Date | null = null;
    if (event.date) {
      const tentative = new Date(event.date);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    return { title, start, end, location, description };
  };

  const buildIcsUrl = (details: ReturnType<typeof buildEventDetails>) => {
    const params = new URLSearchParams();
    params.set("title", details.title);
    if (details.start) params.set("start", details.start.toISOString());
    if (details.end) params.set("end", details.end.toISOString());
    if (details.location) params.set("location", details.location);
    if (details.description) params.set("description", details.description);
    params.set("disposition", "inline");
    return `/api/ics?${params.toString()}`;
  };

  const openWithAppFallback = (appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 700);
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", clear);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clear();
    });
    try {
      window.location.href = appUrl;
    } catch {
      clearTimeout(timer);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = () => {
    const details = buildEventDetails();
    const url =
      typeof window !== "undefined" ? window.location.href : undefined;
    if (typeof navigator !== "undefined" && (navigator as any).share && url) {
      (navigator as any)
        .share({
          title: details.title,
          text: details.description || details.location || details.title,
          url,
        })
        .catch(() => {
          window.open(url, "_blank", "noopener,noreferrer");
        });
    } else if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleGoogleCalendar = () => {
    const details = buildEventDetails();
    const toGoogleDate = (date: Date) =>
      date.toISOString().replace(/\.\d{3}Z$/, "Z");
    const start = toGoogleDate(details.start);
    const end = toGoogleDate(details.end);
    const query = `action=TEMPLATE&text=${encodeURIComponent(
      details.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(
      details.location
    )}&details=${encodeURIComponent(details.description || "")}`;
    const webUrl = `https://calendar.google.com/calendar/render?${query}`;
    const appUrl = `comgooglecalendar://?${query}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleOutlookCalendar = () => {
    const details = buildEventDetails();
    const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleAppleCalendar = () => {
    const details = buildEventDetails();
    const icsPath = buildIcsUrl(details);
    const absoluteIcs =
      typeof window !== "undefined"
        ? `${window.location.origin}${icsPath}`
        : icsPath;
    window.location.href = absoluteIcs;
  };

  return (
    <footer
      className="text-center py-8 mt-4"
      style={{
        backgroundColor: bg,
        color: textColor,
        borderTop: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex flex-wrap gap-3 justify-center mb-4">
        <button
          type="button"
          onClick={handleShare}
          className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors ${buttonClasses}`}
        >
          <Share2 size={16} />
          <span className="hidden sm:inline">Share link</span>
        </button>
        <button
          type="button"
          onClick={handleGoogleCalendar}
          className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors ${buttonClasses}`}
        >
          <Image
            src={googleIconSrc}
            alt="Google"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className="hidden sm:inline">Google Cal</span>
        </button>
        <button
          type="button"
          onClick={handleAppleCalendar}
          className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors ${buttonClasses}`}
        >
          <Image
            src={appleIconSrc}
            alt="Apple"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className="hidden sm:inline">Apple Cal</span>
        </button>
        <button
          type="button"
          onClick={handleOutlookCalendar}
          className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm rounded-md transition-colors ${buttonClasses}`}
        >
          <Image
            src={outlookIconSrc}
            alt="Microsoft Outlook"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className="hidden sm:inline">Outlook</span>
        </button>
      </div>

      <a
        href="https://envitefy.com"
        target="_blank"
        rel="noopener noreferrer"
        className="space-y-1 inline-block no-underline"
      >
        <p className="text-sm opacity-60">
          Powered By Envitefy. Create. Share. Enjoy.
        </p>
        <p className="text-xs opacity-50">Create yours now.</p>
      </a>
      <div className="flex items-center justify-center gap-4 mt-4">
        <a
          href="https://www.facebook.com/envitefy"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Facebook"
        >
          <Image
            src="/email/social-facebook.svg"
            alt="Facebook"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </a>
        <a
          href="https://www.instagram.com/envitefy/"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Instagram"
        >
          <Image
            src="/email/social-instagram.svg"
            alt="Instagram"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </a>
        <a
          href="https://www.tiktok.com/@envitefy"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="TikTok"
        >
          <Image
            src="/email/social-tiktok.svg"
            alt="TikTok"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </a>
        <a
          href="https://www.youtube.com/@Envitefy"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
          aria-label="YouTube"
        >
          <Image
            src="/email/social-youtube.svg"
            alt="YouTube"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </a>
      </div>
    </footer>
  );
}
