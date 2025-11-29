import React from "react";
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

type ThemeConfig = {
  colors: {
    primary: string;
    secondary: string;
    background: string; // we will NOT apply this to body
  };
  fonts: {
    headline: string;
    body: string;
  };
  decorations: {
    heroImage?: string;
  };
};

type TemplateConfig = {
  id: string;
  name: string;
  family: string;
  layout: string;
  theme: ThemeConfig;
};

type EventData = {
  headlineTitle?: string;
  date?: string;
  location?: string;
  story?: string;
  schedule?: { title: string; time: string; location: string }[];
  party?: { name: string; role: string }[];
  travel?: string;
  thingsToDo?: string;
  photos?: string[];
  rsvpEnabled?: boolean;
  rsvpLink?: string;
  registry?: { label: string; url: string }[];
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
    </div>
  );
}

const getLuminance = (hex: string): number => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const pickTextColor = (bg: string) => (getLuminance(bg) > 0.6 ? "#1f2937" : "#F9FAFB");

const ensureContrast = (color: string, bg: string) => {
  const bgLum = getLuminance(bg);
  const cLum = getLuminance(color);
  return Math.abs(bgLum - cLum) < 0.25 ? pickTextColor(bg) : color;
};

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
    default:
      return <SplitHeroLayout theme={theme} event={event} />;
  }
}

function ContentSections({
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
          <p className="leading-relaxed" style={{ color: baseText, opacity: 0.85 }}>
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
          <p className="leading-relaxed" style={{ color: baseText, opacity: 0.85 }}>
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
          <p className="leading-relaxed" style={{ color: baseText, opacity: 0.85 }}>
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
                <a href={r.url} className="text-sm underline" style={{ color: accent }}>
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

function SplitHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section
        className="relative w-full h-[380px] flex items-end justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
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
            <p className="mt-2 text-sm tracking-wide opacity-90">{event.date}</p>
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

function FloralFrameLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
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
            {event.date && <p className="mt-2 text-sm text-slate-500">{event.date}</p>}
            {event.location && (
              <p className="text-xs mt-1 uppercase tracking-[0.25em] text-slate-400">
                {event.location}
              </p>
            )}
          </div>
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function TwoColumnLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section className="w-full bg-white" style={{ backgroundColor: theme.colors.secondary }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 px-6 py-10 items-center">
          <div>
            <h1
              className="text-4xl font-semibold text-slate-800"
              style={{ fontFamily: theme.fonts.headline }}
            >
              {event.headlineTitle || "Your Names"}
            </h1>
            {event.date && <p className="mt-2 text-sm text-slate-600">{event.date}</p>}
            {event.location && (
              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
                {event.location}
              </p>
            )}
          </div>
          <div className="h-56 rounded-xl overflow-hidden">
            {theme.decorations.heroImage && (
              <img
                src={theme.decorations.heroImage}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function CrestHeaderLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section
        className="w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="max-w-xl w-full bg-white/90 rounded-full border px-10 py-6 text-center shadow-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Wedding of</div>
          <h1
            className="text-3xl md:text-4xl font-semibold text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && <p className="mt-2 text-sm text-slate-600">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function BotanicalBordersLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
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
            <p className="mt-2 text-sm text-slate-600 text-center">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500 text-center">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function SoftPastelHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section className="w-full py-12" style={{ backgroundColor: theme.colors.secondary }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl font-semibold text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && <p className="mt-2 text-sm text-slate-600">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-500">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function ArchedHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section
        className="w-full py-10 flex justify-center"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="max-w-3xl w-full flex flex-col items-center">
          <div className="w-full max-w-xl h-64 rounded-[2.5rem] overflow-hidden mb-6 border border-white/20">
            {theme.decorations.heroImage && (
              <img
                src={theme.decorations.heroImage}
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
          {event.date && <p className="mt-2 text-sm text-white/80">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-white/70">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function ParchmentHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
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
          {event.date && <p className="mt-2 text-sm text-[#6b4e33]">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#7a5b3a]">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function FullWidthLuxuryLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section
        className="relative w-full h-[340px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
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
          {event.date && <p className="mt-2 text-sm text-slate-800">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-700">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }} className="text-slate-900">
        <ContentSections theme={theme} event={event} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function StarryHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <>
      <section
        className="relative w-full h-[360px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations.heroImage && (
          <img
            src={theme.decorations.heroImage}
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
          {event.date && <p className="mt-2 text-sm text-slate-200">{event.date}</p>}
          {event.location && (
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-300">
              {event.location}
            </p>
          )}
        </div>
      </section>
      <div style={{ backgroundColor: theme.colors.primary }}>
        <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
        <Footer theme={theme} event={event} />
      </div>
    </>
  );
}

function Footer({ theme, event }: { theme: ThemeConfig; event: EventData }) {
  return (
    <footer
      className="py-6 text-center text-xs opacity-70 mt-auto"
      style={{ backgroundColor: theme.colors.primary, color: "#ffffff" }}
    >
      © {new Date().getFullYear()} {event.headlineTitle || "Your Names"}
    </footer>
  );
}
