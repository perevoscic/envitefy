"use client";

import React, { useMemo } from "react";
import EventActions from "@/components/EventActions";
import EventEditModal from "@/components/EventEditModal";
import EventDeleteModal from "@/components/EventDeleteModal";
import LocationLink from "@/components/LocationLink";
import EventMap from "@/components/EventMap";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import {
  CalendarIconApple,
  CalendarIconGoogle,
  CalendarIconOutlook,
} from "@/components/CalendarIcons";
import { combineVenueAndLocation } from "@/lib/mappers";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { cleanRsvpContactLabel } from "@/utils/rsvp";
import { Plane, Navigation, Bus } from "lucide-react";

// Import constants from the customize page
// We'll need to extract these to a shared file later, but for now we'll duplicate them
const FONTS = {
  playfair: {
    name: "Playfair Display",
    title: '[font-family:var(--font-playfair),_"Times_New_Roman",_serif]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-playfair)",
  },
  montserrat: {
    name: "Montserrat",
    title: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-montserrat)",
  },
  poppins: {
    name: "Poppins",
    title: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]',
    preview: "var(--font-poppins)",
  },
  raleway: {
    name: "Raleway",
    title: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-raleway)",
  },
  geist: {
    name: "Geist Sans",
    title: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]',
    preview: "var(--font-geist-sans)",
  },
  dancing: {
    name: "Dancing Script",
    title: '[font-family:var(--font-dancing),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-dancing)",
  },
  greatVibes: {
    name: "Great Vibes",
    title: '[font-family:var(--font-great-vibes),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-great-vibes)",
  },
  allura: {
    name: "Allura",
    title: '[font-family:var(--font-allura),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-allura)",
  },
  parisienne: {
    name: "Parisienne",
    title: '[font-family:var(--font-parisienne),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-parisienne)",
  },
};

const FONT_SIZES = {
  small: {
    h1: "text-2xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    body: "text-sm",
    nav: "text-xs",
  },
  medium: {
    h1: "text-3xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    body: "text-base",
    nav: "text-sm",
  },
  large: {
    h1: "text-4xl md:text-6xl",
    h2: "text-4xl md:text-5xl",
    body: "text-lg",
    nav: "text-base",
  },
};

const DESIGN_THEMES = [
  {
    id: "blush_peony_arch",
    name: "Blush Peony Arch",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#f9ecec]",
    text: "text-[#6f4b57]",
    accent: "text-[#e5b3c2]",
    previewColor: "bg-[#f9ecec]",
  },
  {
    id: "sage_eucalyptus_sweep",
    name: "Sage Eucalyptus Sweep",
    category: "Pastel",
    graphicType: "leaves-drape",
    bg: "bg-[#dfe7df]",
    text: "text-[#2f3f34]",
    accent: "text-[#9fb4a4]",
    previewColor: "bg-[#dfe7df]",
  },
  {
    id: "ivory_gold_crest",
    name: "Ivory Gold Crest",
    category: "Classic",
    graphicType: "frame-double",
    bg: "bg-[#fbf7f0]",
    text: "text-[#4b3b24]",
    accent: "text-[#c9b68a]",
    previewColor: "bg-[#fbf7f0]",
  },
  {
    id: "navy_rose_gold_frame",
    name: "Navy Rose-Gold Frame",
    category: "Modern",
    graphicType: "geometric",
    bg: "bg-[#0c1a32]",
    text: "text-white drop-shadow-md",
    accent: "text-[#d6a6a0]",
    previewColor: "bg-[#0c1a32]",
  },
];

// Simplified ThemeGraphics - we'll need to import the full version later
const ThemeGraphics = ({ themeId }: { themeId: string }) => {
  // This is a placeholder - we need the full ThemeGraphics component
  return null;
};

type Props = {
  eventId: string;
  eventData: any;
  eventTitle: string;
  templateId: string;
  variationId: string;
  isOwner: boolean;
  isReadOnly: boolean;
  viewerKind: "owner" | "guest" | "readonly";
  shareUrl: string;
  sessionEmail: string | null;
};

export default function WeddingTemplateView({
  eventId,
  eventData,
  eventTitle,
  templateId,
  variationId,
  isOwner,
  isReadOnly,
  viewerKind,
  shareUrl,
  sessionEmail,
}: Props) {
  const weddingData = eventData || {};
  const theme = weddingData.theme || {
    font: "playfair",
    fontSize: "medium",
    themeId: "blush_peony_arch",
  };
  const currentTheme =
    DESIGN_THEMES.find((t) => t.id === (variationId || theme.themeId)) ||
    DESIGN_THEMES[0];
  const currentFont = FONTS[theme.font as keyof typeof FONTS] || FONTS.playfair;
  const currentSize =
    FONT_SIZES[theme.fontSize as keyof typeof FONT_SIZES] || FONT_SIZES.medium;

  // Detect dark background for title color
  const isDarkBackground = useMemo(() => {
    const bg = currentTheme?.bg?.toLowerCase() ?? "";
    const darkTokens = [
      "black",
      "slate-9",
      "stone-9",
      "neutral-9",
      "gray-9",
      "grey-9",
      "indigo-9",
      "purple-9",
      "violet-9",
      "emerald-9",
      "teal-9",
      "blue-9",
      "navy",
      "midnight",
    ];
    const hasDarkToken = darkTokens.some((token) => bg.includes(token));
    const hasDarkHex =
      /#0[0-9a-f]{5,}/i.test(bg) ||
      /#1[0-3][0-9a-f]{4}/i.test(bg) ||
      /#2[0-3][0-9a-f]{4}/i.test(bg);
    return hasDarkToken || hasDarkHex;
  }, [currentTheme]);

  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;

  const partner1 = weddingData.partner1 || "";
  const partner2 = weddingData.partner2 || "";
  const date = weddingData.date;
  const time = weddingData.time;
  const city = weddingData.city || "";
  const state = weddingData.state || "";
  const story = weddingData.story || weddingData.story?.text || "";
  const schedule = Array.isArray(weddingData.schedule)
    ? weddingData.schedule
    : [];
  const weddingParty = Array.isArray(weddingData.party)
    ? weddingData.party
    : Array.isArray(weddingData.weddingParty)
    ? weddingData.weddingParty
    : [];
  const gallery = Array.isArray(weddingData.gallery) ? weddingData.gallery : [];
  const thingsToDo = Array.isArray(weddingData.thingsToDo)
    ? weddingData.thingsToDo
    : [];
  const travel = weddingData.travel || {};
  const registries = Array.isArray(weddingData.registries)
    ? weddingData.registries
    : [];

  const parseTimeValue = (value?: string | null) => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const match = value
      .trim()
      .toLowerCase()
      .match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const meridiem = match[3];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const sortedSchedule = useMemo(() => {
    return [...schedule].sort(
      (a, b) => parseTimeValue(a?.time) - parseTimeValue(b?.time)
    );
  }, [schedule]);

  const startISO = weddingData.startISO || null;
  const endISO = weddingData.endISO || null;
  const location = city && state ? `${city}, ${state}` : undefined;

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] mx-auto my-4 md:my-8">
        <div
          className={`min-h-[800px] w-full bg-white shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.body} transition-colors duration-500 relative z-0`}
        >
          <ThemeGraphics themeId={currentTheme.id} />

          {weddingData.headlineBg && (
            <div
              className="absolute inset-0 opacity-30 pointer-events-none z-0 bg-repeat"
              style={{
                backgroundImage: `url(${weddingData.headlineBg})`,
                backgroundSize: "300px",
              }}
            ></div>
          )}

          <div className="relative z-10">
            <div
              className={`p-6 md:p-8 border-b border-white/10 flex justify-between items-start ${currentTheme.text}`}
            >
              <div className="flex-1">
                <h1
                  className={`${currentSize.h1} mb-2 ${currentFont.title} leading-tight`}
                  style={titleColor}
                >
                  {partner1} & {partner2}
                </h1>
                <div
                  className={`flex items-center gap-4 ${currentSize.body} font-medium opacity-90 ${currentFont.body} tracking-wide`}
                >
                  {date && (
                    <>
                      <span>
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    </>
                  )}
                  {time && <span>{time}</span>}
                  {location && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                      <span>{location}</span>
                    </>
                  )}
                </div>
              </div>
              {isOwner && !isReadOnly && (
                <div className="flex items-center gap-2 ml-4">
                  <EventEditModal
                    eventId={eventId}
                    eventData={eventData}
                    eventTitle={eventTitle}
                  />
                  <EventDeleteModal eventId={eventId} eventTitle={eventTitle} />
                </div>
              )}
            </div>

            <nav
              className={`px-6 md:px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 ${currentSize.nav} uppercase tracking-widest font-semibold border-b border-white/5 ${currentTheme.accent} ${currentFont.title}`}
            >
              {[
                "Home",
                "Schedule",
                "Our Story",
                "Wedding Party",
                "Photos",
                "Things To Do",
                "Travel",
                "RSVP",
                "Registry",
              ].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:underline decoration-2 underline-offset-4 opacity-90 hover:opacity-100"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div id="home" className="relative h-[400px] md:h-[500px] w-full">
              <img
                src={
                  weddingData.customHeroImage ||
                  "/templates/wedding-placeholders/ivory-ink-hero.jpeg"
                }
                alt="Couple"
                className="w-full h-full object-cover opacity-90"
              />
              <div
                className={`absolute bottom-0 left-0 w-full h-32 ${
                  currentTheme.text.includes("slate-900") ||
                  currentTheme.text.includes("black")
                    ? "bg-gradient-to-t from-white/90 to-transparent"
                    : currentTheme.id === "navy_rose_gold_frame"
                    ? "bg-gradient-to-t from-[#0f172a]/90 to-transparent"
                    : "bg-gradient-to-t from-black/70 to-transparent"
                }`}
              ></div>
            </div>

            <div className={`p-8 md:p-16 space-y-24 ${currentTheme.text}`}>
              {sortedSchedule.length > 0 && (
                <section id="schedule" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Schedule of Events
                  </h2>
                  <div className="relative space-y-6 md:space-y-8 max-w-4xl mx-auto">
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-current/20 pointer-events-none"></div>
                    {sortedSchedule.map((event: any, index: number) => {
                      const isLeft = index % 2 === 0;
                      return (
                        <div
                          key={event.id ?? index}
                          className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr),40px,minmax(0,1fr)] items-center gap-4 md:gap-6"
                        >
                          <div
                            className={`order-1 flex flex-col gap-2 text-center ${
                              isLeft
                                ? "md:order-1 md:text-right md:items-end md:pr-4 md:justify-self-end"
                                : "md:order-3 md:text-left md:items-start md:pl-4 md:justify-self-start"
                            }`}
                          >
                            <div className="w-full md:max-w-[420px]">
                              <h3 className="text-2xl font-bold">
                                {event.title}
                              </h3>
                              {event.location && (
                                <p className="opacity-70 text-base mb-2">
                                  {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="opacity-80 leading-relaxed text-base">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="order-2 flex flex-col items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_0_6px_rgba(255,255,255,0.4)]"></div>
                          </div>

                          <div
                            className={`order-3 flex justify-center ${
                              isLeft
                                ? "md:order-3 md:justify-start md:pl-4"
                                : "md:order-1 md:justify-end md:pr-4"
                            }`}
                          >
                            {event.time && (
                              <span className="relative inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-current/40 bg-white/80 backdrop-blur-sm">
                                {event.time}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {story && (
                <section
                  id="our-story"
                  className="max-w-2xl mx-auto text-center"
                >
                  <h2
                    className={`${currentSize.h2} mb-8 ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Our Story
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 ${currentFont.body} whitespace-pre-wrap`}
                  >
                    {story}
                  </p>
                </section>
              )}

              {weddingParty.length > 0 && (
                <section id="wedding-party" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Wedding Party
                  </h2>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {partner1}'s Side
                      </h3>
                      {weddingParty
                        .filter((m: any) => m.side === "partner1")
                        .map((member: any) => (
                          <div key={member.id} className="group">
                            <div
                              className={`font-semibold ${currentSize.body} mb-1 ${currentFont.body}`}
                            >
                              {member.name}
                            </div>
                            <div
                              className={`text-sm uppercase tracking-wider opacity-60 ${currentTheme.accent}`}
                            >
                              {member.role}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {partner2}'s Side
                      </h3>
                      {weddingParty
                        .filter((m: any) => m.side === "partner2")
                        .map((member: any) => (
                          <div key={member.id} className="group">
                            <div
                              className={`font-semibold ${currentSize.body} mb-1 ${currentFont.body}`}
                            >
                              {member.name}
                            </div>
                            <div
                              className={`text-sm uppercase tracking-wider opacity-60 ${currentTheme.accent}`}
                            >
                              {member.role}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              )}

              {gallery.length > 0 && (
                <section id="photos" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Photos
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((img: any) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                      >
                        <img
                          src={img.url}
                          alt="Wedding gallery"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {thingsToDo.length > 0 && (
                <section id="things-to-do" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Things To Do
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {thingsToDo.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div
                          className={`text-xs font-bold uppercase tracking-wider mb-2 opacity-70 ${currentTheme.accent}`}
                        >
                          {item.category}
                        </div>
                        <h3 className={`text-xl font-semibold mb-2`}>
                          {item.title}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(travel.hotels?.length > 0 ||
                travel.airports?.length > 0 ||
                travel.directions ||
                travel.shuttle) && (
                <section id="travel" className="max-w-3xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-10 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Travel & Stay
                  </h2>
                  {travel.hotels?.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-center uppercase tracking-widest text-sm font-bold opacity-70 mb-6">
                        Where to Stay
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {travel.hotels.map((hotel: any) => (
                          <div
                            key={hotel.id}
                            className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-white/30 transition-colors text-left"
                          >
                            <h4
                              className={`text-xl font-semibold mb-2 ${currentTheme.text}`}
                            >
                              {hotel.name}
                            </h4>
                            <p className="text-sm opacity-70 mb-4">
                              {hotel.address}
                            </p>
                            {hotel.deadline && (
                              <div className="inline-block bg-white/10 text-xs px-2 py-1 rounded mb-4">
                                Book by{" "}
                                {new Date(hotel.deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8">
                    {travel.airports?.length > 0 && (
                      <div className="text-left">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20">
                          Flying In
                        </h3>
                        <ul className="space-y-4">
                          {travel.airports.map((airport: any) => (
                            <li
                              key={airport.id}
                              className="flex items-start gap-3"
                            >
                              <Plane
                                size={20}
                                className={`mt-1 opacity-80 ${currentTheme.accent}`}
                              />
                              <div>
                                <div className="font-bold">
                                  {airport.code}{" "}
                                  <span className="font-normal opacity-70">
                                    - {airport.name}
                                  </span>
                                </div>
                                <div className="text-sm opacity-60">
                                  {airport.distance}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {travel.directions && (
                      <div className="text-left">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20">
                          Getting There
                        </h3>
                        <div className="flex items-start gap-3">
                          <Navigation
                            size={20}
                            className={`mt-1 opacity-80 ${currentTheme.accent}`}
                          />
                          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                            {travel.directions}
                          </p>
                        </div>
                      </div>
                    )}

                    {travel.shuttle && (
                      <div className="text-left col-span-2 border-t border-white/10 pt-6 mt-6">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20 flex items-center gap-2">
                          <Bus size={16} /> Shuttle Service
                        </h3>
                        <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                          {travel.shuttle}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {location && (
                <section id="location" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-8 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Location
                  </h2>
                  <div className="space-y-4">
                    <LocationLink location={location} />
                    <EventMap location={location} />
                  </div>
                </section>
              )}

              <section id="rsvp" className="max-w-xl mx-auto text-center">
                <h2
                  className={`${currentSize.h2} mb-6 ${currentFont.title} ${currentTheme.accent}`}
                  style={titleColor}
                >
                  RSVP
                </h2>
                {eventData?.rsvp !== undefined ? (
                  <EventRsvpPrompt
                    eventId={eventId}
                    rsvpName={findFirstEmail(eventData) || null}
                    rsvpPhone={extractFirstPhoneNumber(eventData) || null}
                    rsvpEmail={findFirstEmail(eventData) || null}
                    eventTitle={eventTitle}
                    shareUrl={shareUrl}
                  />
                ) : (
                  <div className="p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                    <p className="italic opacity-50">
                      RSVP is currently closed.
                    </p>
                  </div>
                )}
              </section>

              {registries.length > 0 && (
                <section
                  id="registry"
                  className="text-center py-5 border-t border-white/10 mb-5"
                >
                  <h2
                    className={`text-2xl mb-4 ${currentFont.title} opacity-80`}
                  >
                    Registry
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {registries.map((registry: any, idx: number) => (
                      <a
                        key={idx}
                        href={registry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-3 bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <span className="uppercase tracking-widest text-sm font-semibold opacity-80">
                          {registry.label || "Registry"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              <footer className="text-center py-8 border-t border-white/10 mt-1">
                <p className="text-sm opacity-60">
                  Powered by{" "}
                  <span className="font-semibold opacity-80">Envitefy</span>.
                  Create. Share. Enjoy
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="max-w-3xl mx-auto px-5 sm:px-10 py-6">
          <EventActions
            shareUrl={shareUrl}
            historyId={eventId}
            event={{
              title: eventTitle,
              start: startISO || undefined,
              end: endISO || undefined,
              location: location || "",
              venue: null,
              description: story || "",
              timezone: null,
              rsvp: weddingData.rsvp || null,
            }}
          />
        </div>
      )}
    </div>
  );
}
