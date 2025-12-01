import React, { useState } from "react";
import {
  Palmtree,
  Sun,
  Citrus,
  GlassWater,
  Umbrella,
  MapPin,
} from "lucide-react";
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
          {match[1]} <br /> <span className="text-emerald-500 text-5xl">&</span>{" "}
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
          {names[0]} <br /> <span className="text-emerald-500 text-5xl">&</span>{" "}
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Julianne & Patrick";
  }
  return (
    <>
      Julianne <br /> <span className="text-emerald-500 text-5xl">&</span>{" "}
      Patrick
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return { month: "April", day: "12", year: "2025" };
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
    return {
      month: months[d.getMonth()],
      day: String(d.getDate()),
      year: String(d.getFullYear()),
    };
  } catch {
    return { month: "April", day: "12", year: "2025" };
  }
};

const getLocationParts = (location?: string) => {
  if (!location) return "Palm Beach, Florida";
  // Try to extract city/state from location
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return parts.join(", ");
  }
  return location || "Palm Beach, Florida";
};

const getScheduleItems = (
  schedule?: Array<{ title: string; time?: string; location?: string }>
) => {
  if (!schedule || schedule.length === 0) {
    return [
      {
        title: "Welcome Party",
        day: "Friday",
        time: "6:00 PM",
        location: "Poolside at The Colony",
        icon: GlassWater,
        borderColor: "border-pink-400",
        bgColor: "bg-pink-100",
        iconColor: "text-pink-500",
      },
      {
        title: "The Ceremony",
        day: "Saturday",
        time: "5:00 PM",
        location: "The Courtyard Garden",
        icon: Palmtree,
        borderColor: "border-emerald-500",
        bgColor: "bg-emerald-100",
        iconColor: "text-emerald-600",
        featured: true,
      },
      {
        title: "Farewell Brunch",
        day: "Sunday",
        time: "11:00 AM",
        location: "Ocean Terrace",
        icon: Umbrella,
        borderColor: "border-yellow-400",
        bgColor: "bg-yellow-100",
        iconColor: "text-yellow-500",
      },
    ];
  }

  const iconMap: Record<string, typeof GlassWater> = {
    welcome: GlassWater,
    party: GlassWater,
    ceremony: Palmtree,
    reception: Umbrella,
    brunch: Umbrella,
    farewell: Umbrella,
  };

  const colorMap: Record<string, { border: string; bg: string; icon: string }> =
    {
      welcome: {
        border: "border-pink-400",
        bg: "bg-pink-100",
        icon: "text-pink-500",
      },
      party: {
        border: "border-pink-400",
        bg: "bg-pink-100",
        icon: "text-pink-500",
      },
      ceremony: {
        border: "border-emerald-500",
        bg: "bg-emerald-100",
        icon: "text-emerald-600",
      },
      reception: {
        border: "border-yellow-400",
        bg: "bg-yellow-100",
        icon: "text-yellow-500",
      },
      brunch: {
        border: "border-yellow-400",
        bg: "bg-yellow-100",
        icon: "text-yellow-500",
      },
      farewell: {
        border: "border-yellow-400",
        bg: "bg-yellow-100",
        icon: "text-yellow-500",
      },
    };

  return schedule.slice(0, 3).map((item, idx) => {
    const titleLower = item.title?.toLowerCase() || "";
    let icon = GlassWater;
    let colors = colorMap.welcome;
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (titleLower.includes(key)) {
        icon = iconType;
        colors = colorMap[key] || colorMap.welcome;
        break;
      }
    }
    // Default to ceremony for middle item
    if (idx === 1) {
      icon = Palmtree;
      colors = colorMap.ceremony;
    }

    // Try to extract day from date or use default
    let day = idx === 0 ? "Friday" : idx === 1 ? "Saturday" : "Sunday";

    return {
      title: item.title || "Event",
      day,
      time: item.time || "TBD",
      location: item.location || "TBD",
      icon,
      borderColor: colors.border,
      bgColor: colors.bg,
      iconColor: colors.icon,
      featured: idx === 1, // Middle item is featured
    };
  });
};

export default function FloridaCoastalWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateInfo = formatDate(event.date);
  const location = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1535262412227-85541e9109f3?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "Join us for a weekend of old-school glamour and tropical breezes. Think pink umbrellas, poolside cocktails, and dancing under the palms.";
  const scheduleItems = getScheduleItems(event.schedule);
  const hotelImage =
    event.gallery?.[1]?.url ||
    event.gallery?.[1]?.src ||
    event.gallery?.[1]?.preview ||
    (typeof event.gallery?.[1] === "string" ? event.gallery[1] : undefined) ||
    event.photos?.[1] ||
    "https://images.unsplash.com/photo-1574236170880-640fb3c633a4?q=80&w=1600&auto=format&fit=crop";
  const travelInfo = event.travel || "";
  const rsvpUrl = event.rsvp?.url || "#rsvp";
  const rsvpDeadline = event.rsvp?.deadline
    ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "February 1st";

  return (
    <div
      className="bg-white text-emerald-900 font-serif min-h-screen selection:bg-pink-200 selection:text-emerald-900 overflow-x-hidden"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Decorative Top Border - Bamboo/Trellis Feel */}
      <div className="h-3 w-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-600"></div>

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-pink-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Palmtree className="text-pink-400" size={24} />
          <span className="text-xl font-bold tracking-tight uppercase text-emerald-800">
            {location.split(",")[0] || "The Colony"}
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-emerald-600/70">
          <a href="#events" className="hover:text-pink-500 transition-colors">
            Events
          </a>
          <a href="#stay" className="hover:text-pink-500 transition-colors">
            Stay
          </a>
          <a href="#rsvp" className="hover:text-pink-500 transition-colors">
            RSVP
          </a>
        </div>
        {event.locationUrl && (
          <a
            href={event.locationUrl}
            className="bg-pink-400 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-pink-500 transition-colors shadow-lg shadow-pink-200"
          >
            Book
          </a>
        )}
      </nav>

      {/* Hero */}
      <header className="relative min-h-[90vh] flex items-center justify-center p-6 md:p-12">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-90"
            alt="Florida Palm Trees"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/90"></div>
        </div>

        {/* Hero Card */}
        <div className="relative z-10 bg-white/80 backdrop-blur-md p-12 md:p-20 text-center border-4 border-double border-pink-300 shadow-2xl max-w-3xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <Citrus className="text-orange-400 w-8 h-8" />
          </div>

          <p className="uppercase tracking-[0.3em] text-xs font-bold mb-4 text-emerald-600">
            {location}
          </p>
          <h1
            className="text-6xl md:text-8xl mb-6 text-pink-500 font-bold drop-shadow-sm"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <div className="flex items-center justify-center gap-4 text-emerald-700 font-bold uppercase tracking-widest text-sm">
            <span>
              {dateInfo.month} {dateInfo.day}
            </span>
            <span className="w-2 h-2 rounded-full bg-pink-400"></span>
            <span>{dateInfo.year}</span>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="py-20 px-8 text-center max-w-4xl mx-auto">
        <Sun className="w-12 h-12 mx-auto mb-6 text-yellow-400 animate-spin-slow" />
        <h2
          className="text-4xl md:text-5xl text-emerald-800 mb-8 font-bold"
          style={{ fontFamily: theme.fonts.headline }}
        >
          Sunshine & Champagne
        </h2>
        <p className="text-xl leading-relaxed text-emerald-800/70 font-medium">
          {story}
        </p>
        <div className="mt-12 flex justify-center gap-4">
          <span className="px-4 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold uppercase">
            Black Tie Optional
          </span>
          <span className="px-4 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold uppercase">
            Adults Only
          </span>
        </div>
      </section>

      {/* Events Grid */}
      <section
        id="events"
        className="py-20 bg-pink-50 px-4 relative overflow-hidden"
      >
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-200 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <h2
            className="text-center text-emerald-800 text-3xl font-bold mb-16 italic"
            style={{ fontFamily: theme.fonts.headline }}
          >
            The Weekend Itinerary
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {scheduleItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white p-8 rounded-t-[3rem] border-b-8 ${
                    item.borderColor
                  } shadow-lg hover:-translate-y-2 transition-transform ${
                    item.featured ? "md:-mt-8" : ""
                  }`}
                >
                  <div
                    className={`w-16 h-16 ${item.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 ${item.iconColor}`}
                  >
                    <IconComponent size={32} />
                  </div>
                  <h3 className="text-2xl text-emerald-900 font-bold mb-2">
                    {item.title}
                  </h3>
                  <p
                    className={`${item.iconColor} font-bold uppercase text-xs tracking-widest mb-4`}
                  >
                    {item.day} • {item.time}
                  </p>
                  <p className="text-emerald-700/80">{item.location}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location / Stay */}
      {(travelInfo || event.travel) && (
        <section id="stay" className="grid md:grid-cols-2">
          <div className="bg-emerald-800 text-white p-12 md:p-24 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <MapPin className="w-12 h-12 mb-6 text-pink-300" />
              <h2
                className="text-4xl md:text-5xl mb-6 font-bold"
                style={{ fontFamily: theme.fonts.headline }}
              >
                {event.venue?.name || "The Colony Hotel"}
              </h2>
              <p className="leading-loose opacity-90 text-lg mb-8 font-light">
                {typeof travelInfo === "string"
                  ? travelInfo
                  : "A block of rooms has been reserved at this historic pink paradise. Mention the 'Florida Wedding' for our special rate."}
              </p>
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  className="inline-block self-start bg-white text-emerald-900 px-8 py-3 uppercase font-bold tracking-widest hover:bg-pink-300 transition-colors"
                >
                  Reserve Your Room
                </a>
              )}
            </div>
            {/* Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 2px, transparent 2px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>
          <div className="h-[500px] md:h-auto bg-pink-200">
            <img
              src={hotelImage}
              className="w-full h-full object-cover mix-blend-multiply"
              alt="Pink Hotel"
            />
          </div>
        </section>
      )}

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section id="rsvp" className="py-24 text-center px-4">
          <div className="max-w-2xl mx-auto border-4 border-pink-200 p-12 rounded-[2rem]">
            <h2
              className="text-5xl mb-6 text-emerald-800 font-bold"
              style={{ fontFamily: theme.fonts.headline }}
            >
              RSVP
            </h2>
            <p className="mb-8 text-pink-500 font-bold uppercase tracking-widest text-xs">
              Kindly Respond by {rsvpDeadline}
            </p>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <a
                href={rsvpUrl}
                className="block bg-emerald-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg"
              >
                Yes!
              </a>
              <a
                href={rsvpUrl}
                className="block bg-pink-100 text-pink-600 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-pink-200 transition-colors"
              >
                No
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-pink-500 text-white py-12 text-center text-xs font-bold uppercase tracking-[0.2em]">
        <p>See you in the Sunshine State</p>
      </footer>
    </div>
  );
}
