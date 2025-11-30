import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function SplitTextureBanner({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const baseText = pickTextColor(theme.colors.secondary);
  const accent = ensureContrast(theme.colors.primary, theme.colors.secondary);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section className="relative h-[320px] flex items-end overflow-hidden">
        {theme.decorations?.heroImage && (
          <img
            src={theme.decorations.heroImage}
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div
          className="relative w-full px-8 py-6 bg-white/85 backdrop-blur-md border-t border-black/5"
          style={{ color: baseText }}
        >
          <h1
            className="text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-2 text-xs md:text-sm flex flex-wrap items-center gap-3 opacity-85">
            {event.date && <span>{event.date}</span>}
            {event.location && (
              <>
                {event.date && (
                  <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                )}
                <span className="uppercase tracking-[0.25em] text-[10px] md:text-xs text-slate-500">
                  {event.location}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <ContentSections theme={theme} event={event} backgroundColor={theme.colors.secondary} />
      <Footer theme={theme} event={event} />
    </div>
  );
}
