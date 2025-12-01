import React from "react";
import Image from "next/image";
import { Share2 } from "lucide-react";
import CenteredMinimalHero from "@/app/event/weddings/_renderers/centered-minimal-hero";
import SplitTextureBanner from "@/app/event/weddings/_renderers/split-texture-banner";
import CrestCenteredRibbon from "@/app/event/weddings/_renderers/crest-centered-ribbon";
import DeepOverlayHero from "@/app/event/weddings/_renderers/deep-overlay-hero";
import CascadingFloralTop from "@/app/event/weddings/_renderers/cascading-floral-top";
import AiryHorizontalHero from "@/app/event/weddings/_renderers/airy-horizontal-hero";
import MarbleSlabHero from "@/app/event/weddings/_renderers/marble-slab-hero";
import BotanicalArchBorder from "@/app/event/weddings/_renderers/botanical-arch-border";
import SilverGradientHero from "@/app/event/weddings/_renderers/silver-gradient-hero";
import WarmLeafHeader from "@/app/event/weddings/_renderers/warm-leaf-header";
import EtherealClassic from "@/app/event/weddings/_renderers/ethereal-classic";
import ModernEditorial from "@/app/event/weddings/_renderers/modern-editorial";
import RusticBoho from "@/app/event/weddings/_renderers/rustic-boho";
import NoirLuxury from "@/app/event/weddings/_renderers/noir-luxury";
import CinematicWedding from "@/app/event/weddings/_renderers/cinematic-wedding";
import CelestialWedding from "@/app/event/weddings/_renderers/celestial-wedding";
import GildedWedding from "@/app/event/weddings/_renderers/gilded-wedding";
import MuseumWedding from "@/app/event/weddings/_renderers/museum-wedding";
import EtherealWedding from "@/app/event/weddings/_renderers/ethereal-wedding";
import Retro70s from "@/app/event/weddings/_renderers/retro-70s";
import NewspaperWedding from "@/app/event/weddings/_renderers/newspaper-wedding";
import BauhausWedding from "@/app/event/weddings/_renderers/bauhaus-wedding";
import EuropeCoastalWedding from "@/app/event/weddings/_renderers/europe-coastal-wedding";
import FloridaCoastalWedding from "@/app/event/weddings/_renderers/florida-coastal-wedding";
import CaliforniaCoastalWedding from "@/app/event/weddings/_renderers/california-coastal-wedding";
import WinterWedding from "@/app/event/weddings/_renderers/winter-wedding";
import IndustrialWedding from "@/app/event/weddings/_renderers/industrial-wedding";
import LibraryWedding from "@/app/event/weddings/_renderers/library-wedding";
import GardenWedding from "@/app/event/weddings/_renderers/garden-wedding";
import SkylineWedding from "@/app/event/weddings/_renderers/skyline-wedding";
import {
  ContentSections,
  Footer,
  type EventData,
  type ThemeConfig,
  pickTextColor,
  getLuminance,
} from "@/app/event/weddings/_renderers/content-sections";

type TemplateConfig = {
  id: string;
  name: string;
  family: string;
  layout: string;
  theme: ThemeConfig;
};

interface Props {
  template: TemplateConfig;
  event: EventData;
}

export default function WeddingRenderer({ template, event }: Props) {
  const { layout, theme } = template;

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{
        fontFamily: theme.fonts.body,
        backgroundColor: "transparent",
      }}
    >
      {renderLayout(layout, theme, event)}
      <BrandedEventFooter theme={theme} event={event} />
    </div>
  );
}

function BrandedEventFooter({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const bg =
    theme.colors?.background || theme.colors?.primary || "#0f766e";
  const textColor = pickTextColor(bg);
  const isDark = getLuminance(bg) < 0.5;
  const borderColor = isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(15,23,42,0.12)";
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
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      url
    ) {
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
      className="text-center py-8 mt-4 md:mt-6"
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

function renderLayout(layout: string, theme: ThemeConfig, event: EventData) {
  switch (layout) {
    case "split-hero":
      return <SplitHeroLayout theme={theme} event={event} />;
    case "floral-frame":
      return <FloralFrameLayout theme={theme} event={event} />;
    case "two-column":
      return <TwoColumnLayout theme={theme} event={event} />;
    case "crest-header":
      return <CrestHeaderLayout theme={theme} event={event} />;
    case "botanical-borders":
      return <BotanicalBordersLayout theme={theme} event={event} />;
    case "soft-pastel-hero":
      return <SoftPastelHeroLayout theme={theme} event={event} />;
    case "arched-hero":
      return <ArchedHeroLayout theme={theme} event={event} />;
    case "parchment-hero":
      return <ParchmentHeroLayout theme={theme} event={event} />;
    case "full-width-luxury":
      return <FullWidthLuxuryLayout theme={theme} event={event} />;
    case "starry-hero":
      return <StarryHeroLayout theme={theme} event={event} />;
    case "centered-minimal-hero":
      return <CenteredMinimalHero theme={theme} event={event} />;
    case "split-texture-banner":
      return <SplitTextureBanner theme={theme} event={event} />;
    case "crest-centered-ribbon":
      return <CrestCenteredRibbon theme={theme} event={event} />;
    case "deep-overlay-hero":
      return <DeepOverlayHero theme={theme} event={event} />;
    case "cascading-floral-top":
      return <CascadingFloralTop theme={theme} event={event} />;
    case "airy-horizontal-hero":
      return <AiryHorizontalHero theme={theme} event={event} />;
    case "marble-slab-hero":
      return <MarbleSlabHero theme={theme} event={event} />;
    case "botanical-arch-border":
      return <BotanicalArchBorder theme={theme} event={event} />;
    case "silver-gradient-hero":
      return <SilverGradientHero theme={theme} event={event} />;
    case "warm-leaf-header":
      return <WarmLeafHeader theme={theme} event={event} />;
    case "ethereal-classic":
      return <EtherealClassic theme={theme} event={event} />;
    case "modern-editorial":
      return <ModernEditorial theme={theme} event={event} />;
    case "rustic-boho":
      return <RusticBoho theme={theme} event={event} />;
    case "noir-luxury":
      return <NoirLuxury theme={theme} event={event} />;
    case "cinematic-wedding":
      return <CinematicWedding theme={theme} event={event} />;
    case "celestial-wedding":
      return <CelestialWedding theme={theme} event={event} />;
    case "gilded-wedding":
      return <GildedWedding theme={theme} event={event} />;
    case "museum-wedding":
      return <MuseumWedding theme={theme} event={event} />;
    case "ethereal-wedding":
      return <EtherealWedding theme={theme} event={event} />;
    case "retro-70s":
      return <Retro70s theme={theme} event={event} />;
    case "newspaper-wedding":
      return <NewspaperWedding theme={theme} event={event} />;
    case "bauhaus-wedding":
      return <BauhausWedding theme={theme} event={event} />;
    case "europe-coastal-wedding":
      return <EuropeCoastalWedding theme={theme} event={event} />;
    case "florida-coastal-wedding":
      return <FloridaCoastalWedding theme={theme} event={event} />;
    case "california-coastal-wedding":
      return <CaliforniaCoastalWedding theme={theme} event={event} />;
    case "winter-wedding":
      return <WinterWedding theme={theme} event={event} />;
    case "industrial-wedding":
      return <IndustrialWedding theme={theme} event={event} />;
    case "library-wedding":
      return <LibraryWedding theme={theme} event={event} />;
    case "garden-wedding":
      return <GardenWedding theme={theme} event={event} />;
    case "skyline-wedding":
      return <SkylineWedding theme={theme} event={event} />;
    default:
      return <SplitHeroLayout theme={theme} event={event} />;
  }
}

function SplitHeroLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="relative w-full h-[380px] flex items-end justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations?.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="relative pb-10 text-center text-white">
          <h1
            className="text-4xl md:text-5xl font-semibold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm tracking-wide opacity-90">
              {event.date}
            </p>
          )}
          {event.location && (
            <p className="text-xs mt-1 opacity-80 uppercase tracking-[0.25em]">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <ContentSections theme={theme} event={event} />
      <Footer theme={theme} event={event} />
    </>
  );
}

function FloralFrameLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="relative w-full py-10 flex flex-col items-center"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="relative max-w-3xl w-full rounded-3xl border p-6 bg-white/90">
          {/* imagine PNG florals in corners via CSS or pseudo-elements */}
          <div className="text-center">
            <h1
              className="text-4xl font-semibold text-slate-800"
              style={{ fontFamily: theme.fonts.headline }}
            >
              {event.headlineTitle || "Your Names"}
            </h1>
            {event.date && (
              <p className="mt-2 text-sm text-slate-500">{event.date}</p>
            )}
            {event.location && (
              <p className="text-xs mt-1 uppercase tracking-[0.25em] text-slate-400">
                {event.location}
              </p>
            )}
          </div>
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function TwoColumnLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="w-full bg-white"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 px-6 py-10 items-center">
          <div>
            <h1
              className="text-4xl font-semibold text-slate-800"
              style={{ fontFamily: theme.fonts.headline }}
            >
              {event.headlineTitle || "Your Names"}
            </h1>
            {event.date && (
              <p className="mt-2 text-sm text-slate-600">{event.date}</p>
            )}
            {event.location && (
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                {event.location}
              </p>
            )}
          </div>
          <div className="h-56 rounded-xl overflow-hidden">
            {theme.decorations?.heroImage && (
              <img
                src={theme.decorations?.heroImage}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function CrestHeaderLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="max-w-xl w-full bg-white/90 rounded-full border px-10 py-6 text-center shadow-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
            Wedding of
          </div>
          <h1
            className="text-3xl md:text-4xl font-semibold text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-slate-600">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function BotanicalBordersLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="relative w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="relative max-w-3xl w-full bg-white/90 rounded-3xl border px-10 py-8">
          {/* You can later add decorative PNG edges via CSS */}
          <h1
            className="text-4xl font-semibold text-slate-800 text-center"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-slate-600 text-center">
              {event.date}
            </p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 text-center">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function SoftPastelHeroLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="w-full py-12"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl font-semibold text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-slate-600">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function ArchedHeroLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="max-w-3xl w-full flex flex-col items-center">
          <div className="w-full max-w-xl h-64 rounded-[2.5rem] overflow-hidden mb-6 border border-white/20">
            {theme.decorations?.heroImage && (
              <img
                src={theme.decorations?.heroImage}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h1
            className="text-4xl font-semibold text-white text-center"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-white/80">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/70">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function ParchmentHeroLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="max-w-3xl w-full bg-[#f7ecdd] rounded-3xl border border-[#e0c8a3] px-10 py-8 text-center shadow-sm">
          <h1
            className="text-3xl md:text-4xl font-semibold text-[#4b3423]"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-[#6b4e33]">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7a5b3a]">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function FullWidthLuxuryLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="relative w-full h-[340px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations?.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="relative text-center text-slate-900">
          <h1
            className="text-4xl md:text-5xl font-semibold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-slate-800">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-700">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div
        style={{ backgroundColor: theme.colors.primary }}
        className="text-slate-900"
      >
        <ContentSections theme={theme} event={event} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function StarryHeroLayout({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <>
      <section
        className="relative w-full h-[360px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations?.heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
        <div className="relative text-center text-slate-100">
          <h1
            className="text-4xl md:text-5xl font-semibold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-sm text-slate-200">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-300">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections
          theme={theme}
          event={event}
          backgroundColor={theme.colors.primary}
        />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}
