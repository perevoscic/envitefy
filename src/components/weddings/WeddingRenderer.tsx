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
import {
  ContentSections,
  Footer,
  type EventData,
  type ThemeConfig,
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
    </div>
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
    default:
      return <SplitHeroLayout theme={theme} event={event} />;
  }
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
