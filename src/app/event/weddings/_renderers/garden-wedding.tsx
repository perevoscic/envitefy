import React from "react";
import {
  Cloud,
  Flower,
  Heart,
  ArrowDown,
  Clock,
  Users,
  MapPin,
  Coffee,
  Gift,
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
          <span className="not-italic text-4xl text-green-700/50">&</span>{" "}
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
          <span className="not-italic text-4xl text-green-700/50">&</span>{" "}
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Flora & Henry";
  }
  return (
    <>
      Flora <span className="not-italic text-4xl text-green-700/50">&</span>{" "}
      Henry
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "May 15th";
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

const getSeason = (dateStr?: string) => {
  if (!dateStr) return "Spring 2025";
  try {
    const d = new Date(dateStr);
    const month = d.getMonth();
    const year = d.getFullYear();
    let season = "Spring";
    if (month >= 2 && month <= 4) season = "Spring";
    else if (month >= 5 && month <= 7) season = "Summer";
    else if (month >= 8 && month <= 10) season = "Fall";
    else season = "Winter";
    return `${season} ${year}`;
  } catch {
    return "Spring 2025";
  }
};

const getLocationParts = (location?: string, venue?: { name?: string }) => {
  const venueName = venue?.name || location || "The Botanical Conservatory";
  return venueName;
};

const getScheduleDetails = (
  schedule?: Array<{ title: string; time?: string; location?: string }>
) => {
  const ceremony = schedule?.find((s) =>
    s.title?.toLowerCase().includes("ceremony")
  ) || {
    title: "Ceremony",
    time: "3:00 PM",
    location: "East Lawn",
    description:
      "Please join us at 3:00 PM on the East Lawn. We recommend comfortable shoes for the grass. Parasols will be provided.",
  };
  const reception = schedule?.find(
    (s) =>
      s.title?.toLowerCase().includes("reception") ||
      s.title?.toLowerCase().includes("dinner")
  ) || {
    title: "Reception",
    time: "5:00 PM",
    location: "Main Conservatory",
    description:
      "Dinner to follow in the Main Conservatory. Surrounded by orchids and starlight. Cocktails begin at 5:00 PM.",
  };

  return { ceremony, reception };
};

export default function GardenWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const season = getSeason(event.date);
  const venueName = getLocationParts(event.location, event.venue);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=2000&auto=format&fit=crop";
  const quote = event.story || '"Love is the flower you\'ve got to let grow."';
  const scheduleDetails = getScheduleDetails(event.schedule);
  const galleryImages =
    event.gallery?.slice(0, 3) || event.photos?.slice(0, 3) || [];
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-white font-serif text-slate-600 relative overflow-hidden"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* CSS Gradient Blobs for Watercolor effect */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-pink-200 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-green-100 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>

      {/* Hero with Full Background Image */}
      <header className="relative h-screen flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-90"
            alt="Garden Hero"
          />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 text-center bg-white/70 backdrop-blur-md p-12 md:p-20 rounded-[3rem] shadow-xl border border-white max-w-3xl">
          <p className="text-sm uppercase tracking-[0.4em] text-pink-500 mb-6 font-bold">
            {season}
          </p>
          <h1
            className="text-6xl md:text-8xl font-thin text-slate-800 mb-6 italic tracking-tight"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <p className="text-xl text-slate-600 font-light">
            {dateFormatted} • {venueName}
          </p>
        </div>

        <div className="absolute bottom-10 animate-bounce text-slate-800 z-10">
          <ArrowDown size={32} strokeWidth={1} />
        </div>
      </header>

      {/* Quote */}
      <section className="py-24 px-8 text-center relative z-10">
        <div className="max-w-2xl mx-auto">
          <Heart className="w-10 h-10 mx-auto mb-6 text-pink-300 fill-current" />
          <p className="text-3xl md:text-4xl italic leading-relaxed text-slate-700 font-light">
            {quote}
          </p>
        </div>
      </section>

      {/* Details Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-green-50/80 backdrop-blur-sm p-12 rounded-[3rem] hover:bg-green-100/50 transition-colors shadow-sm">
            <h3
              className="text-4xl text-green-800 mb-8 font-thin italic"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Garden Ceremony
            </h3>
            <p className="leading-loose text-lg text-green-900/70 font-light">
              {scheduleDetails.ceremony.description ||
                `Please join us at ${
                  scheduleDetails.ceremony.time || "3:00 PM"
                } on the ${
                  scheduleDetails.ceremony.location || "East Lawn"
                }. We recommend comfortable shoes for the grass. Parasols will be provided.`}
            </p>
          </div>
          <div className="bg-pink-50/80 backdrop-blur-sm p-12 rounded-[3rem] hover:bg-pink-100/50 transition-colors shadow-sm">
            <h3
              className="text-4xl text-pink-800 mb-8 font-thin italic"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Glasshouse Dinner
            </h3>
            <p className="leading-loose text-lg text-pink-900/70 font-light">
              {scheduleDetails.reception.description ||
                `Dinner to follow in the ${
                  scheduleDetails.reception.location || "Main Conservatory"
                }. Surrounded by orchids and starlight. Cocktails begin at ${
                  scheduleDetails.reception.time || "5:00 PM"
                }.`}
            </p>
          </div>
        </div>
      </section>

      {/* Full Schedule List */}
      {event.schedule && event.schedule.length > 0 && (
        <section className="py-20 px-4 max-w-4xl mx-auto relative z-10">
          <h2
            className="text-5xl mb-12 text-center font-thin text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Schedule of Events
          </h2>
          <div className="space-y-6">
            {event.schedule.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border-l-4 border-green-400 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3
                  className="text-2xl font-light text-slate-800 mb-2"
                  style={{ fontFamily: theme.fonts.headline }}
                >
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-slate-600">
                  {item.time && (
                    <span className="flex items-center gap-2">
                      <Clock size={18} className="text-pink-400" />
                      {item.time}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-2">
                      <Flower size={18} className="text-green-400" />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image Parallax Strip */}
      {galleryImages.length > 0 && (
        <section className="py-24 overflow-hidden relative z-10">
          <div className="flex justify-center gap-8 md:gap-16 opacity-90">
            {galleryImages.slice(0, 3).map((img, i) => {
              const imageUrl = img.url || img.src || img.preview || img;
              const fallbackImages = [
                "https://images.unsplash.com/photo-1490750967868-58cb75069ed6?q=80&w=600",
                "https://images.unsplash.com/photo-1522673607200-1645062cd495?q=80&w=600",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
              ];
              return (
                <div
                  key={i}
                  className={`w-64 h-80 md:w-80 md:h-96 rounded-[4rem] overflow-hidden shadow-2xl transform ${
                    i % 2 === 0 ? "rotate-3 translate-y-8" : "-rotate-3"
                  } border-4 border-white`}
                >
                  <img
                    src={imageUrl || fallbackImages[i]}
                    className="w-full h-full object-cover"
                    alt="Flower detail"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Wedding Party */}
      {event.party && event.party.length > 0 && (
        <section className="py-20 px-4 max-w-4xl mx-auto relative z-10">
          <h2
            className="text-5xl mb-12 text-center font-thin text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Wedding Party
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {event.party.map((member, idx) => (
              <div
                key={idx}
                className="bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <Users className="w-8 h-8 mx-auto mb-3 text-pink-400" />
                <h3 className="text-xl font-light text-slate-800 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-green-600 italic">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Travel */}
      {event.travel && (
        <section className="py-20 px-4 max-w-4xl mx-auto relative z-10">
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[3rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-8 h-8 text-green-500" />
              <h2
                className="text-4xl font-thin text-slate-800"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Travel & Stay
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-slate-700 font-light whitespace-pre-wrap">
              {event.travel}
            </p>
          </div>
        </section>
      )}

      {/* Things To Do */}
      {event.thingsToDo && (
        <section className="py-20 px-4 max-w-4xl mx-auto relative z-10">
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[3rem] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Coffee className="w-8 h-8 text-pink-400" />
              <h2
                className="text-4xl font-thin text-slate-800"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Things To Do
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-slate-700 font-light whitespace-pre-wrap">
              {event.thingsToDo}
            </p>
          </div>
        </section>
      )}

      {/* Registry */}
      {event.registry && event.registry.length > 0 && (
        <section className="py-20 px-4 max-w-4xl mx-auto relative z-10">
          <div className="bg-white/60 backdrop-blur-sm p-12 rounded-[3rem] shadow-sm text-center">
            <Gift className="w-12 h-12 mx-auto mb-6 text-pink-400" />
            <h2
              className="text-4xl mb-8 font-thin text-slate-800"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Registry
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {event.registry.map((reg, idx) => (
                <a
                  key={idx}
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors font-light"
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
        <section className="py-32 px-4 text-center relative z-10">
          <h2
            className="text-5xl mb-12 font-thin text-slate-800"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Bloom With Us
          </h2>
          <div className="flex justify-center gap-6">
            <a
              href={rsvpUrl}
              className="px-16 py-5 rounded-full bg-slate-800 text-white hover:bg-green-700 transition-colors shadow-xl shadow-green-900/20 uppercase text-sm tracking-widest font-bold"
            >
              RSVP Yes
            </a>
            <a
              href={rsvpUrl}
              className="px-16 py-5 rounded-full bg-white text-slate-800 border border-slate-200 hover:bg-pink-50 transition-colors uppercase text-sm tracking-widest font-bold"
            >
              RSVP No
            </a>
          </div>
        </section>
      )}

      <footer className="py-12 text-center text-slate-400 text-sm italic relative z-10">
        <p>With love, {event.headlineTitle || "Flora & Henry"}</p>
      </footer>
    </div>
  );
}
