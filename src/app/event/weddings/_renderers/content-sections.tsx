import React from "react";

export type ThemeConfig = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  decorations?: {
    heroImage?: string;
    [key: string]: unknown;
  };
};

export type EventData = {
  headlineTitle?: string;
  couple?: {
    partner1?: string;
    partner2?: string;
    story?: string;
  };
  date?: string;
  location?: string;
  tagline?: string;
  footer?: string;
  story?: string;
  schedule?: Array<{
    title: string;
    time?: string;
    date?: string;
    location: string;
  }>;
  party?: { name: string; role: string }[];
  travel?: string;
  thingsToDo?: string;
  photos?: string[];
  rsvpEnabled?: boolean;
  rsvpLink?: string;
  registry?: { label?: string; url: string }[];
  venue?: {
    name?: string;
    address?: string;
  };
  when?: string;
  locationUrl?: string;
  registryNote?: string;
  rsvp?: {
    url?: string;
    deadline?: string;
  };
  gallery?: Array<{ url?: string; src?: string; preview?: string }>;
};

const getLuminance = (hex: string): number => {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const pickTextColor = (bg: string) =>
  getLuminance(bg) > 0.6 ? "#1f2937" : "#F9FAFB";

export const ensureContrast = (color: string, bg: string) => {
  const bgLum = getLuminance(bg);
  const cLum = getLuminance(color);
  return Math.abs(bgLum - cLum) < 0.25 ? pickTextColor(bg) : color;
};

export function ContentSections({
  theme,
  event,
  backgroundColor,
}: {
  theme: ThemeConfig;
  event: EventData;
  backgroundColor?: string;
}) {
  const bg = backgroundColor || theme.colors.primary;
  const baseText = pickTextColor(bg);
  const accent = ensureContrast(theme.colors.secondary, bg);

  return (
    <main
      className="w-full max-w-3xl mx-auto px-6 py-12 space-y-16"
      style={{ color: baseText, backgroundColor: bg }}
    >
      {event.story && (
        <section>
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Our Story
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.story}
          </p>
        </section>
      )}

      {event.schedule && event.schedule.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Wedding Schedule
          </h2>
          <div className="space-y-4">
            {event.schedule.map((item, idx) => (
              <div
                key={idx}
                className="border-l-4 pl-4"
                style={{ borderColor: accent }}
              >
                <h3 className="font-medium text-lg">{item.title}</h3>
                <p className="text-sm opacity-80">
                  {item.time} — {item.location}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {event.party && event.party.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Wedding Party
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {event.party.map((p, idx) => (
              <div key={idx}>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm opacity-70">{p.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {event.travel && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Travel
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.travel}
          </p>
        </section>
      )}

      {event.thingsToDo && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Things To Do
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: baseText, opacity: 0.85 }}
          >
            {event.thingsToDo}
          </p>
        </section>
      )}

      {event.photos && event.photos.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {event.photos.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                className="w-full h-32 object-cover rounded-md"
              />
            ))}
          </div>
        </section>
      )}

      {event.registry && event.registry.length > 0 && (
        <section>
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: theme.fonts.headline, color: accent }}
          >
            Registry
          </h2>
          <ul className="space-y-2">
            {event.registry.map((r, idx) => (
              <li key={idx}>
                <a
                  href={r.url}
                  className="text-sm underline"
                  style={{ color: accent }}
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.rsvpEnabled && (
        <section className="text-center pt-4">
          <a
            href={event.rsvpLink}
            className="inline-block px-8 py-3 text-sm font-semibold rounded-md"
            style={{
              backgroundColor: accent,
              color: pickTextColor(accent),
            }}
          >
            RSVP
          </a>
        </section>
      )}
    </main>
  );
}

export function Footer({
  theme,
  event,
}: {
  theme: ThemeConfig;
  event: EventData;
}) {
  return (
    <footer
      className="py-6 text-center text-xs opacity-70 mt-auto"
      style={{ backgroundColor: theme.colors.primary, color: "#ffffff" }}
    >
      © {new Date().getFullYear()} {event.headlineTitle || "Your Names"}
    </footer>
  );
}
