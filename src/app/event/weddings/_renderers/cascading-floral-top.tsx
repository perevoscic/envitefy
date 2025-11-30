import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function CascadingFloralTop({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const bg = theme.colors.secondary;
  const titleColor = pickTextColor(bg);
  const accent = ensureContrast(theme.colors.primary, bg);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section className="relative w-full pt-32 pb-10 flex justify-center" style={{ backgroundColor: bg }}>
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-x-0 top-0 h-40 w-full object-cover"
            alt=""
          />
        )}
        <div className="absolute inset-x-6 top-24 mx-auto max-w-3xl h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center px-6">
          <h1
            className="text-4xl md:text-5xl font-semibold"
            style={{ fontFamily: theme.fonts.headline, color: titleColor }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-3 text-xs md:text-sm space-y-1" style={{ color: accent }}>
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs opacity-80">
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
