import React from "react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildNames = (event: EventData) => {
  // Try to extract initials from headlineTitle (e.g., "Ava & Mason" -> "A&M")
  if (event.headlineTitle) {
    const match = event.headlineTitle.match(/(\w+)\s*&\s*(\w+)/i);
    if (match) {
      return `${match[1][0]}&${match[2][0]}`.toUpperCase();
    }
    // If it's already initials format, return as is
    if (event.headlineTitle.match(/^[A-Z]&[A-Z]$/)) {
      return event.headlineTitle;
    }
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    const names = [partner1, partner2].filter(Boolean) as string[];
    if (names.length === 2 && names[0] && names[1]) {
      return `${names[0][0]}&${names[1][0]}`.toUpperCase();
    }
    return names.join(" & ") || "K&M";
  }
  return "K&M";
};

const buildDate = (event: EventData) => {
  if (event.date) {
    // Try to format date as MM.DD.YY
    try {
      const d = new Date(event.date);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${month}.${day}.${year}`;
    } catch {
      return event.date;
    }
  }
  return event.when || "09.15.25";
};

const buildLocation = (event: EventData) => {
  return event.location || event.venue?.name || "Berlin, DE";
};

export default function BauhausWedding({ theme, event }: Props) {
  const coupleInitials = buildNames(event);
  const dateFormatted = buildDate(event);
  const location = buildLocation(event);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-[#F0F0F0] font-sans p-4 flex flex-col items-center justify-center gap-8"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div className="w-full max-w-2xl bg-[#EAEAEA] aspect-[3/4] md:aspect-square relative overflow-hidden shadow-2xl">
        {/* Top Left Red Block */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#D93025] z-10 flex items-end p-8">
          <span className="text-white text-4xl font-bold">SAVE</span>
        </div>

        {/* Top Right Blue Block */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1A73E8] z-0"></div>

        {/* Bottom Left Yellow Block */}
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#F9AB00] z-0"></div>

        {/* Bottom Right White Block */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-white z-20 flex items-start p-8 flex-col justify-between">
          <div
            className="text-4xl font-bold text-black text-right w-full"
            style={{ fontFamily: theme.fonts.headline }}
          >
            DATE
          </div>
          <div className="space-y-1">
            <p className="font-bold">{dateFormatted}</p>
            <p>{location}</p>
          </div>
        </div>

        {/* Circle Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[20px] border-black rounded-full z-30 pointer-events-none mix-blend-multiply opacity-50"></div>

        {/* Text Overlay */}
        <div className="absolute top-1/4 left-1/4 w-full text-center z-40 pointer-events-none">
          <h1
            className="text-8xl font-black text-black -ml-12 mix-blend-overlay opacity-50"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {coupleInitials}
          </h1>
        </div>
      </div>

      {/* Story Section */}
      {event.story && (
        <div className="w-full max-w-2xl bg-white p-8 md:p-12 border-4 border-black">
          <h2
            className="text-3xl md:text-4xl font-bold mb-6 uppercase tracking-wider text-center"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Our Story
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed text-center max-w-2xl mx-auto"
            style={{ fontFamily: theme.fonts.body }}
          >
            {event.story}
          </p>
        </div>
      )}

      {/* RSVP Section */}
      {event.rsvpEnabled && (
        <div className="w-full max-w-2xl bg-white p-8 border-4 border-black">
          <div className="text-center">
            <h2
              className="text-3xl font-bold mb-4 uppercase tracking-wider"
              style={{ fontFamily: theme.fonts.headline }}
            >
              RSVP
            </h2>
            <a
              href={rsvpUrl}
              className="inline-block bg-[#D93025] text-white px-12 py-4 font-bold uppercase tracking-wider hover:bg-[#1A73E8] transition-colors"
            >
              RESPOND
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
