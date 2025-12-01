import React, { useState } from "react";
import { Anchor, Sun, MapPin, Coffee, Wine, Utensils } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) {
    // Try to split "Name1 & Name2" format
    const match = event.headlineTitle.match(/(\w+)\s*&\s*(\w+)/i);
    if (match) {
      return (
        <>
          {match[1]} & <br />
          {match[2]}
        </>
      );
    }
    return event.headlineTitle;
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    const names = [partner1, partner2].filter(Boolean);
    if (names.length === 2) {
      return (
        <>
          {names[0]} & <br />
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Leo & Alessia";
  }
  return (
    <>
      Leo & <br />
      Alessia
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "August 24th";
  try {
    const d = new Date(dateStr);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = d.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";
    return `${months[d.getMonth()]} ${day}${suffix}`;
  } catch {
    return dateStr;
  }
};

const getLocationParts = (location?: string) => {
  if (!location) return "Amalfi Coast";
  // Try to extract city/region from location
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1] || "Amalfi Coast";
  }
  return location;
};

const getScheduleItems = (
  schedule?: Array<{ title: string; time?: string; location?: string }>
) => {
  if (!schedule || schedule.length === 0) {
    return [
      {
        title: "Welcome Breakfast",
        day: "Friday",
        time: "10:00 AM",
        location: "Piazza Centrale",
        icon: Coffee,
      },
      {
        title: "The Ceremony",
        day: "Saturday",
        time: "5:00 PM",
        location: "Villa Cimbrone",
        icon: Anchor,
        featured: true,
      },
      {
        title: "Sunset Aperitivo",
        day: "Saturday",
        time: "6:30 PM",
        location: "Terrazza dell'Infinito",
        icon: Wine,
      },
    ];
  }

  const iconMap: Record<string, typeof Coffee> = {
    breakfast: Coffee,
    welcome: Coffee,
    ceremony: Anchor,
    reception: Wine,
    dinner: Utensils,
    aperitivo: Wine,
    cocktail: Wine,
  };

  return schedule.slice(0, 3).map((item, idx) => {
    const titleLower = item.title?.toLowerCase() || "";
    let icon = Coffee;
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (titleLower.includes(key)) {
        icon = iconType;
        break;
      }
    }
    // Default to Anchor for middle item (ceremony)
    if (idx === 1) icon = Anchor;

    // Try to extract day from date or use default
    let day = "Saturday";
    if (item.time) {
      // Could parse date if available
    }

    return {
      title: item.title || "Event",
      day,
      time: item.time || "TBD",
      location: item.location || "TBD",
      icon,
      featured: idx === 1, // Middle item is featured
    };
  });
};

export default function EuropeCoastalWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const location = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "We invite you to join us for a weekend of sun, sea, and spritzes as we exchange vows overlooking the Tyrrhenian Sea. Pack your linen, leave your worries, and get ready for a true Italian summer.";
  const scheduleItems = getScheduleItems(event.schedule);
  const travelImage =
    event.gallery?.[1]?.url ||
    event.gallery?.[1]?.src ||
    event.gallery?.[1]?.preview ||
    (typeof event.gallery?.[1] === "string" ? event.gallery[1] : undefined) ||
    event.photos?.[1] ||
    "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?q=80&w=1600&auto=format&fit=crop";
  const travelInfo = event.travel || "";
  const rsvpUrl = event.rsvp?.url || "#rsvp";
  const rsvpDeadline = event.rsvp?.deadline
    ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "May 1st";

  return (
    <div
      className="bg-white text-[#004B8D] font-serif min-h-screen selection:bg-[#FFFACD] selection:text-[#004B8D]"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Top Border Pattern (CSS Tile Effect) */}
      <div className="h-4 w-full bg-[repeating-linear-gradient(45deg,#004B8D,#004B8D_10px,white_10px,white_20px)] sticky top-0 z-50"></div>

      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white/95 backdrop-blur sticky top-4 z-40 border-b border-blue-100">
        <span className="text-2xl font-bold tracking-tight">
          {location} {new Date().getFullYear()}
        </span>
        <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-[#004B8D]/70">
          <a href="#itinerary" className="hover:text-[#004B8D]">
            Itinerary
          </a>
          <a href="#travel" className="hover:text-[#004B8D]">
            Travel
          </a>
          <a href="#rsvp" className="hover:text-[#004B8D]">
            RSVP
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative h-[90vh] flex items-center justify-center p-8">
        <div className="absolute inset-0 m-4 border border-[#004B8D]/20 rounded-t-[10rem]">
          <img
            src={heroImage}
            className="w-full h-full object-cover rounded-t-[10rem] opacity-90"
            alt="Coastal View"
          />
          <div className="absolute inset-0 bg-blue-900/10 rounded-t-[10rem]"></div>
        </div>

        <div className="relative z-10 bg-white p-12 md:p-16 text-center shadow-2xl max-w-2xl rounded-t-[5rem]">
          <span className="text-[#F4D03F] text-4xl mb-4 block">☼</span>
          <p className="uppercase tracking-[0.3em] text-xs font-bold mb-4 text-blue-400">
            The Wedding Of
          </p>
          <h1
            className="text-6xl md:text-8xl mb-6 text-[#004B8D]"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <div className="w-16 h-1 bg-[#F4D03F] mx-auto mb-6"></div>
          <p className="text-lg uppercase tracking-widest">
            {dateFormatted} • {location}
          </p>
        </div>
      </header>

      {/* Intro Text */}
      <section className="py-24 px-8 text-center max-w-4xl mx-auto">
        <h2
          className="text-4xl italic mb-8 text-[#004B8D]"
          style={{ fontFamily: theme.fonts.headline }}
        >
          La Dolce Vita
        </h2>
        <p className="text-xl leading-relaxed text-blue-800/60 font-light">
          {story}
        </p>
      </section>

      {/* Itinerary Grid */}
      <section id="itinerary" className="py-20 bg-[#F0F8FF] px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-xs font-bold tracking-[0.4em] uppercase mb-16 text-blue-400">
            The Weekend
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {scheduleItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white p-10 text-center rounded-2xl shadow-sm border-b-4 ${
                    item.featured
                      ? "border-[#004B8D] shadow-lg md:-mt-8 relative z-10"
                      : "border-[#F4D03F] hover:-translate-y-2 transition-transform"
                  }`}
                >
                  <IconComponent className="w-10 h-10 mx-auto mb-6 text-[#F4D03F]" />
                  <h3 className="text-2xl mb-2 text-[#004B8D]">{item.title}</h3>
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-4">
                    {item.day} • {item.time}
                  </p>
                  <p className="text-blue-900/60">{item.location}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Travel Info */}
      {(travelInfo || event.travel) && (
        <section id="travel" className="grid md:grid-cols-2 min-h-[60vh]">
          <div className="bg-[#004B8D] text-white p-12 md:p-24 flex flex-col justify-center">
            <MapPin className="w-12 h-12 mb-6 text-[#F4D03F]" />
            <h2
              className="text-4xl md:text-5xl mb-6"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Getting There
            </h2>
            <p className="leading-loose opacity-80 text-lg mb-8">
              {typeof travelInfo === "string"
                ? travelInfo
                : "Fly into Naples International Airport (NAP). From there, we have arranged private shuttles to the coast. Alternatively, enjoy a scenic ferry ride from Naples to Amalfi."}
            </p>
            {event.locationUrl && (
              <a
                href={event.locationUrl}
                className="self-start border border-white px-8 py-3 uppercase tracking-widest hover:bg-white hover:text-[#004B8D] transition-colors"
              >
                View Shuttle Schedule
              </a>
            )}
          </div>
          <div className="h-full min-h-[400px]">
            <img
              src={travelImage}
              className="w-full h-full object-cover"
              alt="Boats"
            />
          </div>
        </section>
      )}

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section id="rsvp" className="py-32 text-center px-4">
          <div className="max-w-xl mx-auto border-2 border-[#004B8D] p-8 md:p-12 outline outline-4 outline-[#F0F8FF] -outline-offset-8">
            <h2
              className="text-4xl mb-4 text-[#004B8D]"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Andiamo!
            </h2>
            <p className="mb-8 text-blue-400 font-bold uppercase tracking-widest text-xs">
              RSVP by {rsvpDeadline}
            </p>
            <div className="space-y-4">
              <a
                href={rsvpUrl}
                className="block w-full bg-[#004B8D] text-white py-4 font-bold uppercase tracking-widest hover:bg-[#F4D03F] hover:text-[#004B8D] transition-colors"
              >
                I will be there
              </a>
              <a
                href={rsvpUrl}
                className="block w-full bg-transparent border border-[#004B8D] text-[#004B8D] py-4 font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
              >
                I cannot make it
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#004B8D] text-white py-12 text-center text-xs font-bold uppercase tracking-[0.2em]">
        <p>Made with Amore • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
