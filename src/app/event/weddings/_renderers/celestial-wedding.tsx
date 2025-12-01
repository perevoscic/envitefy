import React from "react";
import {
  Moon,
  Star,
  Sun,
  Cloud,
  Users,
  MapPin,
  Coffee,
  Gift,
  Clock,
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
          {match[1]}{" "}
          <span className="text-[#D4AF37] text-4xl align-middle mx-4">&</span>{" "}
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
          {names[0]}{" "}
          <span className="text-[#D4AF37] text-4xl align-middle mx-4">&</span>{" "}
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Luna & Sol";
  }
  return (
    <>
      Luna <span className="text-[#D4AF37] text-4xl align-middle mx-4">&</span>{" "}
      Sol
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr)
    return { month: "Oct", day: "14th", year: "2025", weekday: "Sunday" };
  try {
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
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
    return {
      month: months[d.getMonth()],
      day: `${day}${suffix}`,
      year: String(d.getFullYear()),
      weekday: weekdays[d.getDay()],
    };
  } catch {
    return { month: "Oct", day: "14th", year: "2025", weekday: "Sunday" };
  }
};

const getLocationParts = (location?: string) => {
  if (!location) return { city: "NYC", venue: "Planetarium" };
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    return { city: parts[0], venue: parts.slice(1).join(", ") };
  }
  return { city: location, venue: "Planetarium" };
};

const getScheduleEvents = (
  schedule?: Array<{ title: string; time?: string }>
) => {
  if (!schedule || schedule.length === 0) {
    return [
      { time: "5:30 PM", label: "Arrival", icon: Sun },
      { time: "6:00 PM", label: "Ceremony", icon: Moon },
      { time: "7:30 PM", label: "Dinner", icon: Star },
      { time: "11:00 PM", label: "Exit", icon: Cloud },
    ];
  }

  const iconMap: Record<string, typeof Sun> = {
    arrival: Sun,
    ceremony: Moon,
    dinner: Star,
    reception: Star,
    exit: Cloud,
    departure: Cloud,
  };

  return schedule.slice(0, 4).map((item, idx) => {
    const titleLower = item.title?.toLowerCase() || "";
    let icon = Star;
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (titleLower.includes(key)) {
        icon = iconType;
        break;
      }
    }
    // Fallback to icon based on index if no match
    if (icon === Star && idx === 0) icon = Sun;
    if (icon === Star && idx === schedule.length - 1) icon = Cloud;

    return {
      time: item.time || "TBD",
      label: item.title || "Event",
      icon,
    };
  });
};

export default function CelestialWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateInfo = formatDate(event.date);
  const locationParts = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "Like two stars orbiting in the vast expanse, we found our gravity in one another. Join us under the dome of the Hayden Planetarium as we celebrate a love that is infinite and expanding.";
  const scheduleEvents = getScheduleEvents(event.schedule);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-[#0B1026] text-[#E2D8C0] font-serif relative overflow-x-hidden"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Stars Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.15,
        }}
      ></div>

      {/* Decorative Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#435078] blur-[150px] opacity-20 pointer-events-none"></div>

      {/* Hero Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroImage}
          alt="Starry Sky"
          className="w-full h-full object-cover opacity-30 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[#0B1026]/60"></div>
      </div>

      {/* Content Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Hero */}
        <div className="min-h-[80vh] flex flex-col items-center justify-center border-b border-[#E2D8C0]/20 mb-20">
          <div className="mb-8 animate-pulse text-[#D4AF37]">
            <Star size={24} fill="#D4AF37" />
          </div>

          <p className="uppercase tracking-[0.4em] text-xs text-[#D4AF37] mb-8">
            Written in the Stars
          </p>

          <h1
            className="text-6xl md:text-8xl font-light mb-6 leading-tight"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>

          <p className="text-lg md:text-xl italic font-light opacity-80 mb-12">
            Invite you to witness their alignment
          </p>

          <div className="grid grid-cols-3 gap-12 text-xs uppercase tracking-[0.2em] border-t border-[#E2D8C0]/20 pt-12">
            <div>
              <span className="block text-[#D4AF37] text-lg mb-2">
                {dateInfo.month}
              </span>
              {dateInfo.day}
            </div>
            <div>
              <span className="block text-[#D4AF37] text-lg mb-2">
                {dateInfo.year}
              </span>
              {dateInfo.weekday}
            </div>
            <div>
              <span className="block text-[#D4AF37] text-lg mb-2">
                {locationParts.city}
              </span>
              {locationParts.venue}
            </div>
          </div>
        </div>

        {/* Story */}
        <section className="py-20">
          <div className="w-px h-24 bg-gradient-to-b from-transparent via-[#D4AF37] to-transparent mx-auto mb-12"></div>
          <h2
            className="text-4xl italic mb-8 text-[#D4AF37]"
            style={{ fontFamily: theme.fonts.headline }}
          >
            The Alignment
          </h2>
          <p className="text-lg leading-relaxed opacity-70 max-w-2xl mx-auto">
            {story}
          </p>
        </section>

        {/* Timeline */}
        <section className="py-20 border-y border-[#E2D8C0]/10 bg-[#0B1026]/50">
          <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-16">
            The Constellation of Events
          </h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-0">
            {scheduleEvents.map((eventItem, i) => {
              const IconComponent = eventItem.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center relative group"
                >
                  <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-4 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all bg-[#0F152E]">
                    <IconComponent size={20} strokeWidth={1} />
                  </div>
                  <span className="text-xl italic mb-1">{eventItem.time}</span>
                  <span className="text-xs uppercase tracking-widest opacity-60">
                    {eventItem.label}
                  </span>

                  {/* Connector Line */}
                  {i < scheduleEvents.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-24 h-px bg-[#D4AF37]/20"></div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Full Schedule List */}
        {event.schedule && event.schedule.length > 0 && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-12 text-center">
              Complete Schedule
            </h2>
            <div className="space-y-6 max-w-2xl mx-auto">
              {event.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-[#D4AF37]/30 pl-6 py-4 hover:border-[#D4AF37]/60 transition-colors"
                >
                  <h3 className="text-xl italic mb-2 text-[#E2D8C0]">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-6 text-sm opacity-70">
                    {item.time && (
                      <span className="flex items-center gap-2">
                        <Clock size={16} className="text-[#D4AF37]" />
                        {item.time}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-2">
                        <Star size={16} className="text-[#D4AF37]" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wedding Party */}
        {event.party && event.party.length > 0 && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-12 text-center">
              The Constellation
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {event.party.map((member, idx) => (
                <div
                  key={idx}
                  className="bg-[#0F152E] p-6 rounded-lg border border-[#D4AF37]/20 text-center"
                >
                  <Users className="w-8 h-8 mx-auto mb-3 text-[#D4AF37]" />
                  <h3 className="text-lg italic mb-1 text-[#E2D8C0]">
                    {member.name}
                  </h3>
                  <p className="text-sm uppercase tracking-widest opacity-60 text-[#D4AF37]">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {event.gallery && event.gallery.length > 0 && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-12 text-center">
              Moments in Time
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {event.gallery.slice(0, 6).map((img, idx) => {
                const imageUrl =
                  img.url ||
                  img.src ||
                  img.preview ||
                  (typeof img === "string" ? img : undefined) ||
                  "";
                return (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border border-[#D4AF37]/20"
                  >
                    <img
                      src={imageUrl}
                      className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                      alt=""
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Travel */}
        {event.travel && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <div className="max-w-2xl mx-auto text-center">
              <MapPin className="w-10 h-10 mx-auto mb-6 text-[#D4AF37]" />
              <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-8">
                Travel & Stay
              </h2>
              <p className="text-lg leading-relaxed opacity-70 whitespace-pre-wrap">
                {event.travel}
              </p>
            </div>
          </section>
        )}

        {/* Things To Do */}
        {event.thingsToDo && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <div className="max-w-2xl mx-auto text-center">
              <Coffee className="w-10 h-10 mx-auto mb-6 text-[#D4AF37]" />
              <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-8">
                Things To Do
              </h2>
              <p className="text-lg leading-relaxed opacity-70">
                {event.thingsToDo}
              </p>
            </div>
          </section>
        )}

        {/* Registry */}
        {event.registry && event.registry.length > 0 && (
          <section className="py-20 border-y border-[#E2D8C0]/10">
            <div className="max-w-2xl mx-auto text-center">
              <Gift className="w-10 h-10 mx-auto mb-6 text-[#D4AF37]" />
              <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-8">
                Registry
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {event.registry.map((reg, idx) => (
                  <a
                    key={idx}
                    href={reg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#D4AF37]/40 px-6 py-3 text-[#E2D8C0] hover:bg-[#D4AF37] hover:text-[#0B1026] transition-colors uppercase tracking-widest text-sm"
                  >
                    {reg.label || "Registry"}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP */}
        {event.rsvpEnabled && (
          <section className="py-32">
            <div className="border border-[#D4AF37] p-2 rotate-1 max-w-lg mx-auto">
              <div className="border border-[#D4AF37] p-12 -rotate-1 bg-[#0F152E]">
                <h2
                  className="text-3xl italic text-[#D4AF37] mb-8"
                  style={{ fontFamily: theme.fonts.headline }}
                >
                  RSVP
                </h2>
                <div className="space-y-8">
                  <a
                    href={rsvpUrl}
                    className="block w-full bg-[#D4AF37] text-[#0B1026] py-3 uppercase tracking-widest text-xs font-bold hover:bg-white transition-colors mt-8 text-center"
                  >
                    Confirm Orbit
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
