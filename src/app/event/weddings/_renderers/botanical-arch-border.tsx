import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function BotanicalArchBorder({
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
      <section
        className="relative py-16 flex justify-center"
        style={{ backgroundColor: bg }}
      >
        <div className="relative max-w-3xl w-full px-8">
          <div className="absolute inset-0 rounded-[2.25rem] border border-emerald-900/20" />
          {theme.decorations?.heroImage && (
            <img
              src={theme.decorations.heroImage}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 max-w-full opacity-90 pointer-events-none"
              alt=""
            />
          )}
          <div className="relative rounded-[2rem] bg-white/90 px-10 py-10 text-center shadow-md">
            <p
              className="text-[10px] uppercase tracking-[0.3em] mb-3"
              style={{ color: accent }}
            >
              Together With Their Families
            </p>
            <h1
              className="text-3xl md:text-4xl font-semibold"
              style={{ fontFamily: theme.fonts.headline, color: titleColor }}
            >
              {event.headlineTitle || "Your Names"}
            </h1>
            <div className="mt-3 text-xs md:text-sm text-emerald-900/80 space-y-1">
              {event.date && <p>{event.date}</p>}
              {event.location && (
                <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs">
                  {event.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <ContentSections theme={theme} event={event} backgroundColor={theme.colors.primary} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
