import React, { useState, useEffect } from "react";
import {
  Snowflake,
  Thermometer,
  Calendar,
  MapPin,
  Wine,
  Heart,
  ChevronDown,
} from "lucide-react";
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
    const parts = event.headlineTitle.split(/\s*&\s*/);
    if (parts.length >= 2) {
      return `${parts[0][0]} & ${parts[1][0]}`.toUpperCase();
    }
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 && partner2) {
    return `${partner1[0]} & ${partner2[0]}`.toUpperCase();
  }
  return "E & T";
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) {
    const match = event.headlineTitle.match(/(\w+)\s*&\s*(\w+)/i);
    if (match) {
      return (
        <>
          Winter <span className="italic font-serif text-[#B7410E]">&</span>{" "}
          Warmth
        </>
      );
    }
    return event.headlineTitle;
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return (
      <>
        Winter <span className="italic font-serif text-[#B7410E]">&</span>{" "}
        Warmth
      </>
    );
  }
  return (
    <>
      Winter <span className="italic font-serif text-[#B7410E]">&</span> Warmth
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "December 21, 2025";
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
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const getLocationParts = (location?: string) => {
  if (!location) return "Aspen, Colorado";
  return location;
};

const getScheduleItems = (
  schedule?: Array<{ title: string; time?: string; location?: string }>
) => {
  if (!schedule || schedule.length === 0) {
    return [
      {
        icon: Wine,
        title: "Welcome Drinks",
        time: "Fri, 7:00 PM",
        desc: "Fireside cocktails at the Lodge.",
      },
      {
        icon: Calendar,
        title: "The Ceremony",
        time: "Sat, 4:00 PM",
        desc: "Outdoor ceremony (heated). Black Tie.",
      },
      {
        icon: Wine,
        title: "Après Ski",
        time: "Sun, 11:00 AM",
        desc: "Brunch and recovery before departure.",
      },
    ];
  }

  const iconMap: Record<string, typeof Wine> = {
    welcome: Wine,
    drinks: Wine,
    ceremony: Calendar,
    reception: Wine,
    brunch: Wine,
    après: Wine,
  };

  return schedule.slice(0, 3).map((item, idx) => {
    const titleLower = item.title?.toLowerCase() || "";
    let icon = Wine;
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (titleLower.includes(key)) {
        icon = iconType;
        break;
      }
    }
    // Default to Calendar for middle item (ceremony)
    if (idx === 1) icon = Calendar;

    // Try to extract day from date or use default
    let day = idx === 0 ? "Fri" : idx === 1 ? "Sat" : "Sun";

    return {
      icon,
      title: item.title || "Event",
      time: item.time ? `${day}, ${item.time}` : `${day}, TBD`,
      desc: item.location || "TBD",
    };
  });
};

export default function WinterWedding({ theme, event }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = buildInitials(event);
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const location = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1518182170546-0766ce6fec93?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "We met during a blizzard in Chicago. The trains were stopped, the cabs were scarce, and we both ducked into the same jazz bar to escape the wind. Three years later, on top of a mountain in Vail, we decided to brave every storm together. We invite you to join us where we love being most: surrounded by snow, fire, and family.";
  const scheduleItems = getScheduleItems(event.schedule);
  const storyImage =
    event.gallery?.[1]?.url ||
    event.gallery?.[1] ||
    event.photos?.[1] ||
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop";
  const travelInfo = event.travel || "";
  const registry = event.registry || [];
  const rsvpUrl = event.rsvp?.url || "#rsvp";
  const rsvpDeadline = event.rsvp?.deadline
    ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "November 1st";

  return (
    <div
      className="bg-[#1A2F25] text-[#E8ECEB] font-serif min-h-screen relative selection:bg-[#B7410E] selection:text-white scroll-smooth"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Background with texture */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none z-0"
        style={{
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/black-linen.png")',
        }}
      ></div>

      {/* Nav */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 px-6 py-4 flex justify-between items-center ${
          scrolled
            ? "bg-[#1A2F25]/90 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="text-xl font-bold tracking-widest uppercase">
          {initials}
        </div>
        <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-300">
          <a href="#story" className="hover:text-white transition-colors">
            Our Story
          </a>
          <a href="#weekend" className="hover:text-white transition-colors">
            The Weekend
          </a>
          <a href="#details" className="hover:text-white transition-colors">
            Details
          </a>
          <a
            href="#rsvp"
            className="border border-white/30 px-4 py-2 hover:bg-[#B7410E] hover:border-[#B7410E] transition-all"
          >
            RSVP
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-70"
            alt="Snowy Mountains"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A2F25] via-transparent to-[#1A2F25]/40"></div>
        </div>

        <div className="relative z-10 text-center border-y border-white/20 py-16 px-12 backdrop-blur-md bg-[#1A2F25]/40 max-w-4xl shadow-2xl">
          <Snowflake
            className="w-10 h-10 mx-auto mb-8 text-white animate-spin-slow"
            strokeWidth={1}
          />
          <h1
            className="text-5xl md:text-8xl font-light mb-6 tracking-wide text-white drop-shadow-lg leading-tight"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <p className="text-sm md:text-lg uppercase tracking-[0.3em] font-light text-gray-200 mb-8">
            {dateFormatted} • {location}
          </p>
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <ChevronDown className="animate-bounce text-white/50" />
          </div>
        </div>
      </header>

      {/* Our Story */}
      <section
        id="story"
        className="py-24 px-8 max-w-6xl mx-auto relative z-10"
      >
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 border border-white/20 translate-x-4 translate-y-4 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
            <img
              src={storyImage}
              alt="Couple in Snow"
              className="relative z-10 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 shadow-xl"
            />
          </div>
          <div>
            <Heart className="w-8 h-8 text-[#B7410E] mb-6" />
            <h2
              className="text-4xl italic mb-6"
              style={{ fontFamily: theme.fonts.headline }}
            >
              A Cold Night, A Warm Fire
            </h2>
            <p className="text-lg leading-relaxed font-light opacity-80 mb-6">
              {story}
            </p>
          </div>
        </div>
      </section>

      {/* The Weekend Cards */}
      <section
        id="weekend"
        className="py-20 px-4 relative z-10 bg-[#0F1C15]/50 border-y border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-xs font-bold tracking-[0.4em] uppercase mb-16 text-[#B7410E]">
            Itinerary
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {scheduleItems.map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={i}
                  className="bg-[#1A2F25] p-10 border border-white/10 hover:border-[#B7410E]/50 transition-colors text-center group"
                >
                  <IconComponent className="w-8 h-8 mx-auto mb-6 text-white group-hover:text-[#B7410E] transition-colors" />
                  <h3 className="text-xl italic mb-2">{item.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B7410E] mb-4">
                    {item.time}
                  </p>
                  <p className="text-gray-400 font-light">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Details (Registry & Stay) */}
      <section id="details" className="py-24 px-4 relative z-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {(travelInfo || event.travel) && (
            <div className="border border-white/10 p-8 md:p-12 text-center bg-[#0F1C15] relative overflow-hidden">
              <MapPin className="w-8 h-8 mx-auto mb-6 text-gray-400" />
              <h3
                className="text-2xl italic mb-4"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Accommodations
              </h3>
              <p className="text-gray-300 font-light leading-relaxed mb-6">
                {typeof travelInfo === "string"
                  ? travelInfo
                  : `We have secured a block of rooms at ${
                      event.venue?.name || "The Little Nell"
                    }. Please mention the '${
                      event.headlineTitle || "Evans-Thompson"
                    }' wedding for the preferred rate.`}
              </p>
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  className="text-xs font-bold uppercase border-b border-[#B7410E] pb-1 text-[#B7410E]"
                >
                  Book Room
                </a>
              )}
            </div>
          )}
          {registry.length > 0 && (
            <div className="border border-white/10 p-8 md:p-12 text-center bg-[#0F1C15]">
              <Thermometer className="w-8 h-8 mx-auto mb-6 text-gray-400" />
              <h3
                className="text-2xl italic mb-4"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Registry
              </h3>
              <p className="text-gray-300 font-light leading-relaxed mb-6">
                Your presence is present enough. However, if you wish to
                celebrate with a gift, we are registered at{" "}
                {registry[0]?.label || "Zola"}.
              </p>
              {registry[0]?.url && (
                <a
                  href={registry[0].url}
                  className="text-xs font-bold uppercase border-b border-[#B7410E] pb-1 text-[#B7410E]"
                >
                  View Registry
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section
          id="rsvp"
          className="py-32 bg-[#B7410E] text-[#0F1C15] px-6 text-center relative z-10"
        >
          <div className="max-w-xl mx-auto">
            <h2
              className="text-5xl font-light mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Join the Warmth
            </h2>
            <p className="mb-12 font-bold uppercase tracking-widest text-xs opacity-80">
              Please RSVP by {rsvpDeadline}
            </p>
            <div className="bg-[#0F1C15] p-8 shadow-2xl space-y-6">
              <a
                href={rsvpUrl}
                className="block flex-1 bg-[#B7410E] text-white py-4 hover:bg-white hover:text-[#B7410E] transition-colors font-bold uppercase text-xs text-center"
              >
                Accept
              </a>
              <a
                href={rsvpUrl}
                className="block flex-1 border border-[#B7410E] text-[#B7410E] py-4 hover:bg-[#B7410E] hover:text-white transition-colors font-bold uppercase text-xs text-center"
              >
                Decline
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#0F1C15] py-12 text-center text-xs text-gray-500 uppercase tracking-widest border-t border-white/5">
        <p>
          Est. {new Date().getFullYear()} • {location.split(",")[0] || "Aspen"}
        </p>
      </footer>
    </div>
  );
}
