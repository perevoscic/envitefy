import React from "react";
import {
  ContentSections,
  Footer,
  ensureContrast,
  pickTextColor,
  type EventData,
  type ThemeConfig,
} from "./content-sections";

export default function MarbleSlabHero({
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
        className="h-[320px] flex items-center justify-center text-center"
        style={{
          backgroundImage: theme.decorations?.heroImage
            ? `url(${theme.decorations.heroImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: bg,
        }}
      >
        <div className="px-10 py-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60">
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-2"
            style={{ color: accent }}
          >
            Wedding Celebration
          </p>
          <h1
            className="text-3xl md:text-4xl font-semibold"
            style={{ fontFamily: theme.fonts.headline, color: titleColor }}
          >
            {event.headlineTitle || "Your Names"}
          </h1>
          <div className="mt-2 text-xs md:text-sm space-y-1 text-slate-600">
            {event.date && <p>{event.date}</p>}
            {event.location && (
              <p className="uppercase tracking-[0.2em] text-[10px] md:text-xs">
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
