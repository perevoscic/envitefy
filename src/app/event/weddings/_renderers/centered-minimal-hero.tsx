import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function CenteredMinimalHero({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const overlayText = pickTextColor(theme.colors.primary);
  const accent = ensureContrast(theme.colors.secondary, theme.colors.primary);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section
        className="relative h-[360px] flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />

        <div className="relative max-w-xl mx-auto px-8 py-6 rounded-3xl bg-black/35 backdrop-blur-sm border border-white/20 text-center">
          <p
            className="text-[10px] tracking-[0.35em] uppercase mb-3"
            style={{ color: accent }}
          >
            The Wedding Of
          </p>
          <h1
            className="text-4xl md:text-5xl font-semibold leading-tight"
            style={{ fontFamily: theme.fonts.headline, color: overlayText }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-4 text-xs md:text-sm space-y-1 text-white/80">
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs">
                {event.location}
              </p>
            )}
          </div>
        </div>
      </section>

      <ContentSections theme={theme} event={event} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
