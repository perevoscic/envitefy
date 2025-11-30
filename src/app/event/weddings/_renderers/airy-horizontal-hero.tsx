import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function AiryHorizontalHero({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const bg = theme.colors.primary;
  const overlayText = pickTextColor(bg);
  const accent = ensureContrast(theme.colors.secondary, bg);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section className="relative h-[280px] flex items-center px-6 overflow-hidden">
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />

        <div className="relative max-w-xl text-left">
          <p
            className="text-[10px] uppercase tracking-[0.35em] mb-2"
            style={{ color: accent }}
          >
            Wedding Invitation
          </p>
          <h1
            className="text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: theme.fonts.headline, color: overlayText }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-2 text-xs md:text-sm text-white/85 space-y-1">
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs">
                {event.location}
              </p>
            )}
          </div>
        </div>
      </section>

      <ContentSections theme={theme} event={event} backgroundColor={theme.colors.secondary} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
