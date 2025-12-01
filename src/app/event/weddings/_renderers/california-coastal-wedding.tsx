import React from "react";
import { Waves, Mountain, Sun, Wind, ArrowDown, Map } from "lucide-react";
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
          {match[1]} & <br /> <span className="text-[#D4A373] italic font-serif">{match[2]}</span>
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
          {names[0]} & <br /> <span className="text-[#D4A373] italic font-serif">{names[1]}</span>
        </>
      );
    }
    return names.join(" & ") || "Maya & Kieran";
  }
  return (
    <>
      Maya & <br /> <span className="text-[#D4A373] italic font-serif">Kieran</span>
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "09.14.25";
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

const getLocationParts = (location?: string) => {
  if (!location) return "Big Sur";
  // Try to extract city/region from location
  const parts = location.split(",").map((p) => p.trim());
  return parts[0] || "Big Sur";
};

const getScheduleItems = (schedule?: Array<{ title: string; time?: string }>) => {
  if (!schedule || schedule.length === 0) {
    return [
      { time: "4:00 PM", title: "Arrival", icon: Map },
      { time: "4:30 PM", title: "Vows", icon: Mountain },
      { time: "5:30 PM", title: "Sunset", icon: Sun },
      { time: "7:00 PM", title: "Dinner", icon: Wind },
    ];
  }

  const iconMap: Record<string, typeof Map> = {
    arrival: Map,
    ceremony: Mountain,
    vows: Mountain,
    sunset: Sun,
    reception: Wind,
    dinner: Wind,
  };

  return schedule.slice(0, 4).map((item, idx) => {
    const titleLower = item.title?.toLowerCase() || "";
    let icon = Map;
    for (const [key, iconType] of Object.entries(iconMap)) {
      if (titleLower.includes(key)) {
        icon = iconType;
        break;
      }
    }
    // Default icons based on position
    if (idx === 0) icon = Map;
    if (idx === 1) icon = Mountain;
    if (idx === 2) icon = Sun;
    if (idx === 3) icon = Wind;

    return {
      time: item.time || "TBD",
      title: item.title || "Event",
      icon,
    };
  });
};

export default function CaliforniaCoastalWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const location = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "We're keeping things simple and organic. The backdrop does all the work. Expect neutral tones, dried florals, local wines, and the sound of the ocean.";
  const scheduleItems = getScheduleItems(event.schedule);
  const vibeImage =
    event.gallery?.[1]?.url ||
    event.gallery?.[1] ||
    event.photos?.[1] ||
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop";
  const locationImage =
    event.gallery?.[2]?.url ||
    event.gallery?.[2] ||
    event.photos?.[2] ||
    "https://images.unsplash.com/photo-1548566935-7737b3f7d432?q=80&w=1200&auto=format&fit=crop";
  const travelInfo = event.travel || "";
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="bg-[#F5F2EB] text-[#4A4A4A] font-sans min-h-screen selection:bg-[#D4A373] selection:text-white"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Nav */}
      <nav className="fixed w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-darken">
        <span className="text-xl font-bold tracking-tighter uppercase border-b-2 border-[#D4A373]">
          {location} • {new Date().getFullYear()}
        </span>
        <div className="hidden md:flex gap-12 text-xs font-bold uppercase tracking-[0.2em] text-[#6B705C]">
          <a href="#vibe" className="hover:text-[#D4A373] transition-colors">
            The Vibe
          </a>
          <a href="#location" className="hover:text-[#D4A373] transition-colors">
            Location
          </a>
          <a href="#rsvp" className="hover:text-[#D4A373] transition-colors">
            Confirm
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative h-screen w-full overflow-hidden flex flex-col justify-end p-8 md:p-16">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover"
            alt="Big Sur Coast"
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2A]/80 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 text-white max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-16 bg-[#D4A373]"></span>
            <span className="text-[#D4A373] uppercase tracking-[0.3em] text-xs font-bold">
              West Coast Love
            </span>
          </div>
          <h1
            className="text-6xl md:text-9xl font-bold tracking-tighter mb-8 leading-none"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-lg leading-relaxed">
            {story || "Celebrate with us where the mountains meet the sea. Golden hour ceremony followed by dinner under the stars."}
          </p>
        </div>

        <div className="absolute bottom-10 right-10 text-white animate-bounce hidden md:block">
          <ArrowDown size={32} />
        </div>
      </header>

      {/* The Vibe / Aesthetic */}
      <section id="vibe" className="py-24 px-6 bg-[#F5F2EB]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Waves className="w-12 h-12 text-[#6B705C]" />
            <h2
              className="text-4xl md:text-5xl font-bold text-[#2A2A2A] tracking-tight"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Pacific Calm
            </h2>
            <p className="text-lg leading-loose text-[#6B705C]">{story}</p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-[#E3D5CA] h-32 rounded-lg flex items-center justify-center">
                <span className="text-[#9A8C98] font-bold uppercase text-xs tracking-widest">Sand</span>
              </div>
              <div className="bg-[#6B705C] h-32 rounded-lg flex items-center justify-center">
                <span className="text-[#F5F2EB] font-bold uppercase text-xs tracking-widest">Sage</span>
              </div>
            </div>
          </div>
          <div className="relative h-[600px] rounded-[3rem] overflow-hidden">
            <img
              src={vibeImage}
              className="w-full h-full object-cover"
              alt="Couple"
            />
            <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white">
              <p className="font-serif italic text-2xl">{dateFormatted}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary Strip */}
      <section className="bg-[#2A2A2A] text-[#F5F2EB] py-20 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end border-b border-[#4A4A4A] pb-8 mb-12">
            <h2
              className="text-3xl font-serif italic"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The Flow
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4A373]">
              Saturday Schedule
            </span>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {scheduleItems.map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={i}
                  className="group hover:bg-[#333] p-6 rounded-xl transition-colors cursor-default"
                >
                  <IconComponent className="w-8 h-8 mb-6 text-[#D4A373] group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[#888] mb-2">
                    {item.time}
                  </p>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-white p-4 rounded-[2rem] shadow-sm">
          <div className="grid md:grid-cols-2 rounded-[1.5rem] overflow-hidden">
            <div className="bg-[#D4A373] p-12 md:p-16 flex flex-col justify-center text-[#F5F2EB]">
              <h2
                className="text-4xl font-bold mb-6 text-white"
                style={{ fontFamily: theme.fonts.headline }}
              >
                {event.venue?.name || "Ventana Big Sur"}
              </h2>
              <p className="text-lg leading-relaxed mb-8 opacity-90">
                {typeof travelInfo === "string"
                  ? travelInfo
                  : "Perched at the edge of the continent. Shuttles will depart from Carmel-by-the-Sea at 3:00 PM."}
              </p>
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  className="inline-block border-b border-white pb-1 w-max hover:opacity-70 transition-opacity uppercase text-xs font-bold tracking-widest"
                >
                  Get Directions
                </a>
              )}
            </div>
            <div className="h-64 md:h-auto">
              <img
                src={locationImage}
                className="w-full h-full object-cover"
                alt="Forest"
              />
            </div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section id="rsvp" className="py-32 px-6 text-center">
          <h2
            className="text-[10vw] font-bold text-[#E3D5CA] leading-none mb-8 select-none"
            style={{ fontFamily: theme.fonts.headline }}
          >
            RSVP
          </h2>
          <div className="max-w-md mx-auto -mt-12 md:-mt-20 relative z-10">
            <p className="text-[#6B705C] mb-8 font-serif italic text-xl">
              Will you join us on the edge of the world?
            </p>
            <div className="flex gap-4">
              <a
                href={rsvpUrl}
                className="flex-1 bg-[#2A2A2A] text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-[#D4A373] transition-colors text-center"
              >
                Yes
              </a>
              <a
                href={rsvpUrl}
                className="flex-1 border border-[#2A2A2A] text-[#2A2A2A] py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-[#F5F2EB] transition-colors text-center"
              >
                No
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="py-12 text-center text-[#999] text-xs uppercase tracking-widest">
        <p>
          {event.headlineTitle || "Maya & Kieran"} • {location}
        </p>
      </footer>
    </div>
  );
}

