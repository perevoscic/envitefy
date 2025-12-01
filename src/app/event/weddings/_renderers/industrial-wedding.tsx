import React from "react";
import { ArrowRight, CornerDownRight } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildInitials = (event: EventData) => {
  if (event.headlineTitle) {
    const match = event.headlineTitle.match(/(\w)\w*\s*&\s*(\w)\w*/i);
    if (match) {
      return `${match[1]}+${match[2]}`.toUpperCase();
    }
    const parts = event.headlineTitle.split(/\s*&\s*/);
    if (parts.length >= 2) {
      return `${parts[0][0]}+${parts[1][0]}`.toUpperCase();
    }
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 && partner2) {
    return `${partner1[0]}+${partner2[0]}`.toUpperCase();
  }
  return "M+K";
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) {
    const match = event.headlineTitle.match(/(\w+)\s*&\s*(\w+)/i);
    if (match) {
      return (
        <>
          Concrete <br />
          <span className="text-transparent stroke-white" style={{ WebkitTextStroke: "2px #cd7f32" }}>
            &
          </span>{" "}
          Copper
        </>
      );
    }
    return event.headlineTitle;
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return (
      <>
        Concrete <br />
        <span className="text-transparent stroke-white" style={{ WebkitTextStroke: "2px #cd7f32" }}>
          &
        </span>{" "}
        Copper
      </>
    );
  }
  return (
    <>
      Concrete <br />
      <span className="text-transparent stroke-white" style={{ WebkitTextStroke: "2px #cd7f32" }}>
        &
      </span>{" "}
      Copper
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "10.14.25";
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

const formatDateLong = (dateStr?: string) => {
  if (!dateStr) return "October 14th";
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
  if (!location) return { city: "BROOKLYN, NY", coords: "40.6782° N, 73.9442° W" };
  const parts = location.split(",").map((p) => p.trim());
  return {
    city: parts.length >= 2 ? `${parts[0].toUpperCase()}, ${parts[1].toUpperCase()}` : location.toUpperCase(),
    coords: "40.6782° N, 73.9442° W", // Default, could be enhanced with geocoding
  };
};

const getScheduleItems = (schedule?: Array<{ title: string; time?: string; location?: string }>) => {
  if (!schedule || schedule.length === 0) {
    return [
      { time: "18:00", title: "Arrival", desc: "Valet Parking Available" },
      { time: "18:30", title: "Vows", desc: "Short & Sweet" },
      { time: "19:30", title: "Party", desc: "Until they kick us out" },
    ];
  }

  return schedule.slice(0, 3).map((item, idx) => {
    // Convert time to 24-hour format if needed
    let time24 = item.time || "18:00";
    if (time24.includes("PM") || time24.includes("pm")) {
      const match = time24.match(/(\d{1,2}):?(\d{2})?/);
      if (match) {
        let hours = parseInt(match[1]);
        if (hours < 12) hours += 12;
        const minutes = match[2] || "00";
        time24 = `${hours}:${minutes}`;
      }
    }

    const defaultTitles = ["Arrival", "Vows", "Party"];
    const defaultDescs = ["Valet Parking Available", "Short & Sweet", "Until they kick us out"];

    return {
      time: time24,
      title: item.title || defaultTitles[idx] || "Event",
      desc: item.location || defaultDescs[idx] || "",
    };
  });
};

const buildMarqueeText = (event: EventData, schedule?: Array<{ title: string; time?: string; location?: string }>) => {
  const dateLong = formatDateLong(event.date);
  const venue = event.venue?.name || event.location || "The Foundry";
  const location = event.location || "Long Island City";
  const items = schedule || [];
  const parts = [
    dateLong,
    venue,
    location,
    items.length > 0 ? `${items[0].title} at ${items[0].time || "6"}` : "Cocktails at 6",
    items.length > 1 ? `${items[1].title} at ${items[1].time || "8"}` : "Dinner at 8",
    "Dancing til late",
  ];
  return parts.join(" • ") + " • ";
};

export default function IndustrialWedding({ theme, event }: Props) {
  const initials = buildInitials(event);
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const locationParts = getLocationParts(event.location || event.venue?.name);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "We're keeping it simple. Good food, strong drinks, and our favorite people in a warehouse. No stuffy speeches, no assigned seating, just a really good party.";
  const scheduleItems = getScheduleItems(event.schedule);
  const marqueeText = buildMarqueeText(event, event.schedule);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="bg-[#1a1a1a] text-[#e0e0e0] font-mono min-h-screen flex flex-col md:flex-row"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 md:h-screen md:fixed top-0 left-0 border-r border-[#404040] p-8 flex flex-col justify-between bg-[#1a1a1a] z-50">
        <div>
          <h1
            className="text-4xl font-bold uppercase leading-none mb-1"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {initials}
          </h1>
          <p className="text-xs text-[#808080]">EST. {new Date().getFullYear()}</p>
        </div>

        <nav className="flex flex-col gap-4 mt-8 md:mt-0">
          {["Manifesto", "Logistics", "Registry", "RSVP"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm uppercase hover:text-[#cd7f32] transition-colors flex items-center gap-2 group"
            >
              <span className="w-2 h-2 bg-[#404040] group-hover:bg-[#cd7f32]"></span>
              {item}
            </a>
          ))}
        </nav>

        <div className="hidden md:block text-[10px] text-[#505050]">
          <p>{locationParts.city}</p>
          <p>{locationParts.coords}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {/* Hero with Visible Image */}
        <header className="h-[85vh] relative border-b border-[#404040]">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-80 grayscale contrast-125"
            alt="Loft Venue"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-90"></div>

          <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full">
            <div className="bg-[#cd7f32] text-[#1a1a1a] inline-block px-4 py-1 text-xs mb-6 uppercase font-bold transform -rotate-2">
              Save The Date — {dateFormatted}
            </div>
            <h2
              className="text-5xl md:text-8xl font-bold uppercase leading-[0.85] text-white mix-blend-difference"
              style={{ fontFamily: theme.fonts.headline }}
            >
              {names}
            </h2>
          </div>
        </header>

        {/* Marquee */}
        <div className="border-b border-[#404040] py-4 overflow-hidden whitespace-nowrap bg-[#cd7f32] text-[#1a1a1a]">
          <p className="animate-marquee inline-block text-xl font-bold uppercase">{marqueeText}</p>
        </div>

        {/* Manifesto */}
        <section id="manifesto" className="grid md:grid-cols-2 border-b border-[#404040]">
          <div className="p-12 md:p-24 border-b md:border-b-0 md:border-r border-[#404040]">
            <h3 className="text-xl uppercase mb-8 text-[#cd7f32] flex items-center gap-2">
              <CornerDownRight size={16} /> 01. The Plan
            </h3>
            <p className="text-lg leading-relaxed text-[#a0a0a0]">{story}</p>
          </div>
          <div className="p-12 md:p-24 bg-[#202020]">
            <h3 className="text-xl uppercase mb-8 text-[#cd7f32] flex items-center gap-2">
              <CornerDownRight size={16} /> 02. The Vibe
            </h3>
            <p className="text-lg leading-relaxed text-[#a0a0a0]">
              Industrial Formal. Wear what makes you feel cool. Sneakers allowed, dancing required.
            </p>
          </div>
        </section>

        {/* Logistics Grid */}
        <section id="logistics" className="grid grid-cols-1 md:grid-cols-3 border-b border-[#404040] h-auto md:h-96">
          {scheduleItems.map((item, idx) => (
            <div
              key={idx}
              className="p-8 border-b md:border-b-0 md:border-r border-[#404040] last:border-r-0 hover:bg-[#202020] transition-colors flex flex-col justify-between"
            >
              <span className="text-4xl font-bold text-[#303030]">{item.time}</span>
              <div>
                <h4 className="text-xl font-bold uppercase text-[#e0e0e0]">{item.title}</h4>
                <p className="text-sm text-[#808080] mt-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Registry */}
        {event.registry && event.registry.length > 0 && (
          <section id="registry" className="p-12 md:p-24 border-b border-[#404040]">
            <h2
              className="text-6xl md:text-8xl font-bold uppercase text-[#303030] mb-8"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Registry
            </h2>
            <div className="max-w-xl space-y-4">
              {event.registry.map((reg, idx) => (
                <a
                  key={idx}
                  href={reg.url}
                  className="block bg-transparent border border-[#404040] p-4 hover:border-[#cd7f32] transition-colors flex items-center justify-between group"
                >
                  <span className="text-xl font-bold uppercase">{reg.label || "Registry"}</span>
                  <ArrowRight className="text-[#808080] group-hover:text-[#cd7f32] transition-colors" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* RSVP */}
        {event.rsvpEnabled && (
          <section id="rsvp" className="p-12 md:p-24">
            <h2
              className="text-6xl md:text-8xl font-bold uppercase text-[#303030] mb-8"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Confirm
            </h2>
            <div className="max-w-xl space-y-8">
              <a
                href={rsvpUrl}
                className="inline-block bg-[#cd7f32] text-[#1a1a1a] px-8 py-4 font-bold uppercase flex items-center gap-4 hover:bg-white transition-colors"
              >
                Proceed to RSVP <ArrowRight />
              </a>
            </div>
          </section>
        )}
      </main>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

