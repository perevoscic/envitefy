import React from "react";
import { ArrowRight } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildInitials = (event: EventData) => {
  if (event.headlineTitle) {
    const match = event.headlineTitle.match(/(\w)\w*\s*&\s*(\w)\w*/i);
    if (match) {
      return `${match[1]} & ${match[2]}`.toUpperCase();
    }
    // Try to get first letters
    const parts = event.headlineTitle.split(/\s*&\s*/);
    if (parts.length >= 2) {
      return `${parts[0][0]} & ${parts[1][0]}`.toUpperCase();
    }
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 && partner2) {
    return `${partner1[0]} & ${partner2[0]}`.toUpperCase();
  }
  return "M & D";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "09.21.25";
  try {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${month}.${day}.${year}`;
  } catch {
    return dateStr;
  }
};

const getLocationParts = (location?: string, venue?: { name?: string; address?: string }) => {
  const venueName = venue?.name || location || "The Broad";
  const address = venue?.address || location || "221 S Grand Ave, Los Angeles, CA 90012";
  return { venueName, address };
};

const getScheduleItems = (schedule?: Array<{ title: string; time?: string }>) => {
  if (!schedule || schedule.length === 0) {
    return [
      { title: "Ceremony", time: "16:00" },
      { title: "Cocktails", time: "17:30" },
      { title: "Reception", time: "19:00" },
    ];
  }
  return schedule.slice(0, 3).map((item) => ({
    title: item.title || "Event",
    time: item.time?.replace(/\s*(AM|PM)/i, "") || "TBD",
  }));
};

const getLocationCity = (location?: string) => {
  if (!location) return "LOS ANGELES";
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1].toUpperCase();
  }
  return location.toUpperCase();
};

export default function MuseumWedding({ theme, event }: Props) {
  const initials = buildInitials(event);
  const dateFormatted = formatDate(event.date);
  const locationParts = getLocationParts(event.location, event.venue);
  const locationCity = getLocationCity(event.location);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "An immersive celebration of love, art, and open bars. Curated by " +
      (event.headlineTitle || "Maya & David") +
      ".";
  const scheduleItems = getScheduleItems(event.schedule);
  const galleryImages = event.gallery?.slice(1, 3) || event.photos?.slice(1, 3) || [];
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Header */}
      <header className="px-6 py-6 border-b border-black flex justify-between items-center sticky top-0 bg-white z-50">
        <div className="text-xl font-bold tracking-tighter">{initials}</div>
        <div className="text-xs font-mono hidden md:block">
          EST. {new Date().getFullYear()} — {locationCity}
        </div>
        <button className="text-xs uppercase font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
          Info
        </button>
      </header>

      {/* Main Exhibition Area */}
      <main>
        {/* Title Block with Hero Image */}
        <section className="min-h-[90vh] flex flex-col justify-end p-6 border-b border-black relative overflow-hidden">
          <img
            src={heroImage}
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 z-0"
            alt="Hero Art"
          />

          <div className="relative z-10">
            <h1
              className="text-[12vw] leading-[0.8] font-bold tracking-tighter uppercase mb-8 mix-blend-multiply"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The<br />
              Union
            </h1>
            <div className="flex flex-col md:flex-row justify-between items-end border-t border-black pt-4">
              <div className="max-w-md">
                <p className="text-lg leading-tight font-medium">{story}</p>
              </div>
              <div className="text-right mt-8 md:mt-0">
                <p className="font-mono text-sm">FIG. 1: THE DATE</p>
                <p className="text-4xl font-bold">{dateFormatted}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="grid md:grid-cols-2 border-b border-black">
          <div className="border-r border-black p-6 md:p-12 flex flex-col justify-between h-full min-h-[50vh]">
            <div>
              <span className="font-mono text-xs border border-black px-2 py-1 rounded-full">
                LOCATION
              </span>
              <h2
                className="text-5xl font-bold mt-6 mb-4"
                style={{ fontFamily: theme.fonts.headline }}
              >
                {locationParts.venueName}
              </h2>
              <p className="text-gray-600 max-w-xs">{locationParts.address}</p>
            </div>
            <div className="mt-12">
              <a
                href={event.locationUrl || "#"}
                className="inline-flex items-center gap-2 font-bold hover:gap-4 transition-all"
              >
                GET DIRECTIONS <ArrowRight size={16} />
              </a>
            </div>
          </div>
          <div className="h-full min-h-[50vh] relative overflow-hidden group">
            <img
              src={
                galleryImages[0]?.url ||
                galleryImages[0] ||
                "https://images.unsplash.com/photo-1544211181-7027582b137d?q=80&w=1600&auto=format&fit=crop"
              }
              className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              alt="Gallery"
            />
          </div>
        </section>

        <section className="grid md:grid-cols-2 border-b border-black">
          <div className="h-full min-h-[50vh] relative overflow-hidden group order-2 md:order-1">
            <img
              src={
                galleryImages[1]?.url ||
                galleryImages[1] ||
                "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1600&auto=format&fit=crop"
              }
              className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              alt="Gallery"
            />
          </div>
          <div className="p-6 md:p-12 flex flex-col justify-between h-full min-h-[50vh] order-1 md:order-2">
            <div>
              <span className="font-mono text-xs border border-black px-2 py-1 rounded-full">
                ITINERARY
              </span>
              <ul className="mt-12 space-y-8">
                {scheduleItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-end border-b border-gray-200 pb-2"
                  >
                    <span className="text-2xl font-bold">{item.title}</span>
                    <span className="font-mono">{item.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Footer RSVP */}
        {event.rsvpEnabled && (
          <section className="p-6 md:p-24 text-center bg-black text-white">
            <h2
              className="text-[8vw] font-bold leading-none mb-8"
              style={{ fontFamily: theme.fonts.headline }}
            >
              RSVP
            </h2>
            <p className="font-mono mb-12 max-w-md mx-auto">
              Attendance is mandatory. Just kidding. But please let us know by{" "}
              {event.rsvp?.deadline
                ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })
                : "August 1st"}
              .
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <a
                href={rsvpUrl}
                className="bg-white text-black px-12 py-4 font-bold text-xl hover:bg-gray-200 transition-colors"
              >
                ACCEPT
              </a>
              <a
                href={rsvpUrl}
                className="border border-white text-white px-12 py-4 font-bold text-xl hover:bg-white hover:text-black transition-colors"
              >
                DECLINE
              </a>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
