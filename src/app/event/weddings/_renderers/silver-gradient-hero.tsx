import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function SilverGradientHero({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  const gradientBg = `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
  const titleColor = pickTextColor(theme.colors.primary);
  const accent = ensureContrast(theme.colors.secondary, theme.colors.primary);

  return (
    <div
      className="w-full min-h-screen flex flex-col"
      style={{ fontFamily: theme.fonts.body }}
    >
      <section
        className="h-[320px] flex items-center justify-center text-center relative overflow-hidden"
        style={{ background: gradientBg }}
      >
        <div className="absolute inset-[-40%] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />
        <div className="relative px-8 py-6 rounded-3xl bg-white/55 backdrop-blur-sm shadow-lg border border-white/70">
          <p
            className="text-[10px] uppercase tracking-[0.35em] mb-2"
            style={{ color: accent }}
          >
            Wedding Reception
          </p>
          <h1
            className="text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: theme.fonts.headline, color: titleColor }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-2 text-xs md:text-sm text-slate-700 space-y-1">
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.25em] text-[10px] md:text-xs">
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
