import React from "react";
import {
  ContentSections,
  Footer,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function DeepOverlayHero({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section className="relative h-[380px] flex items-center justify-center overflow-hidden">
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />

        <div className="relative max-w-2xl mx-auto px-8 py-6 text-center">
          <h1
            className="text-4xl md:text-5xl font-semibold text-white tracking-wide"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-3 text-xs md:text-sm text-slate-100/85 space-y-1">
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs text-slate-200/85">
                {event.location}
              </p>
            )}
          </div>
        </div>
      </section>

      <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
