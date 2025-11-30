import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function CrestCenteredRibbon({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const bg = theme.colors.primary;
  const crestText = pickTextColor(bg);
  const accent = ensureContrast(theme.colors.secondary, bg);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section
        className="relative py-14 flex justify-center"
        style={{ backgroundColor: bg }}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-white/10" />
        <div className="relative max-w-xl w-full bg-white/10 backdrop-blur-md rounded-full border border-white/30 px-10 py-6 flex flex-col items-center shadow-lg">
          {theme.decorations?.heroImage && (
            <img
              src={theme.decorations.heroImage}
              className="w-20 h-20 object-contain mb-4"
              alt=""
            />
          )}
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ color: accent }}
          >
            The Wedding Of
          </p>
          <h1
            className="text-3xl md:text-4xl font-semibold text-center"
            style={{ fontFamily: theme.fonts.headline, color: crestText }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          {event.date && (
            <p className="mt-2 text-xs md:text-sm text-white/80">{event.date}</p>
          )}
          {event.location && (
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
              {event.location}
            </p>
          )}
        </div>
      </section>

      <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
