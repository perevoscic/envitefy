import SignatureWeddingLayout from "@/app/event/weddings/_renderers/signature-wedding-layouts";
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
import ScannedWeddingInviteView, {
  type ScannedWeddingRegistryCard,
} from "@/components/weddings/ScannedWeddingInviteView";
import {
  ContentSections,
  Footer,
  type EventData,
  type ThemeConfig,
} from "@/app/event/weddings/_renderers/content-sections";
import { attachAmazonAffiliateTag } from "@/lib/affiliate/amazon";
import { buildWeddingScanSchedule } from "@/lib/wedding-scan";
import { getRegistryBrandByUrl } from "@/utils/registry-links";

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
  renderMode?: "default" | "scanned-invite-preview";
}

function buildPreviewRegistryCards(
  registry: Array<{ label?: string; url?: string }>,
): ScannedWeddingRegistryCard[] {
  return registry
    .filter((item) => typeof item?.url === "string" && item.url.trim())
    .map((item) => {
      const url = attachAmazonAffiliateTag(item.url!.trim());
      const brand = getRegistryBrandByUrl(url);
      let host = "";
      try {
        host = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        host = url;
      }
      return {
        label: item.label?.trim() || brand?.defaultLabel || "Registry",
        url,
        host,
        badgeText: (brand?.defaultLabel || item.label || host || "R")
          .trim()
          .slice(0, 1)
          .toUpperCase(),
        accentColor: brand?.accentColor || "#334155",
        textColor: brand?.foregroundColor || "#FFFFFF",
        brandLabel: brand?.defaultLabel || null,
      };
    });
}

function withAmazonAffiliateRegistryLinks(event: EventData): EventData {
  if (!Array.isArray(event.registry) || event.registry.length === 0) return event;
  return {
    ...event,
    registry: event.registry.map((item) => ({
      ...item,
      url: attachAmazonAffiliateTag(item.url),
    })),
  };
}

export default function WeddingRenderer({ template, event, renderMode = "default" }: Props) {
  const { layout, theme } = template;
  const eventWithAffiliateRegistries = withAmazonAffiliateRegistryLinks(event);

  if (renderMode === "scanned-invite-preview") {
    const registryCards = buildPreviewRegistryCards(
      Array.isArray((event as any).registry) ? (event as any).registry : [],
    );
    const schedule = Array.isArray((event as any).schedule) ? (event as any).schedule : [];
    const firstScheduleTime =
      typeof schedule[0]?.time === "string" && schedule[0].time.trim()
        ? schedule[0].time.trim()
        : null;
    const previewScheduleRows = buildWeddingScanSchedule({
      title: event.headlineTitle || "Your Names",
      schedule,
      timeLabel: firstScheduleTime,
    });
    const previewLocation =
      (typeof (event as any).venue?.address === "string" && (event as any).venue.address) ||
      (typeof event.location === "string" && event.location) ||
      (typeof (event as any).venue?.name === "string" && (event as any).venue.name) ||
      null;

    return (
      <ScannedWeddingInviteView
        title={event.headlineTitle || "Your Names"}
        location={previewLocation}
        dateLabel={typeof event.date === "string" ? event.date : null}
        timeLabel={firstScheduleTime}
        imageUrl={
          (typeof (event as any).customHeroImage === "string" && (event as any).customHeroImage) ||
          (typeof (event as any).gallery?.[0]?.url === "string" && (event as any).gallery[0].url) ||
          null
        }
        shareUrl="#preview"
        calendarLinks={null}
        flyerColors={{
          background: theme.colors.background,
          primary: theme.colors.secondary,
          secondary: theme.colors.primary,
          accent: theme.colors.accent,
          text: theme.colors.text,
        }}
        registryCards={registryCards}
        scheduleRows={previewScheduleRows}
        previewMode
        showRsvpPreview={Boolean((event as any).rsvpEnabled)}
        rsvpPreviewText={
          (event as any).rsvp?.deadline
            ? `RSVP by ${(event as any).rsvp.deadline}.`
            : "RSVP is enabled for this wedding."
        }
      />
    );
  }

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{
        fontFamily: theme.fonts.body,
        backgroundColor: "transparent",
      }}
    >
      {renderLayout(layout, theme, eventWithAffiliateRegistries)}
    </div>
  );
}

function renderLayout(layout: string, theme: ThemeConfig, event: EventData) {
  switch (layout) {
    case "split-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "floral-frame":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "two-column":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "crest-header":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "botanical-borders":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "soft-pastel-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "arched-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "parchment-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "full-width-luxury":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "starry-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "centered-minimal-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "split-texture-banner":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "crest-centered-ribbon":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "deep-overlay-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "cascading-floral-top":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "airy-horizontal-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "marble-slab-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "botanical-arch-border":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "silver-gradient-hero":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
    case "warm-leaf-header":
      return <SignatureWeddingLayout layout={layout} theme={theme} event={event} />;
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

function SplitHeroLayout({ theme, event }: { theme: ThemeConfig; event: EventData }) {
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
          {event.date && <p className="mt-2 text-sm tracking-wide opacity-90">{event.date}</p>}
          {event.location && (
            <p className="text-xs mt-1 opacity-80 uppercase tracking-[0.25em]">{event.location}</p>
          )}
        </div>
      </section>
      <ContentSections theme={theme} event={event} />
      <Footer theme={theme} event={event} backgroundColor={theme.colors.primary} />
    </>
  );
}
