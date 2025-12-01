import React, { useEffect, useState } from "react";
import {
  Play,
  MapPin,
  Calendar,
  Clock,
  ArrowDown,
  Users,
  Plane,
  Coffee,
  Gift,
} from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) return event.headlineTitle;
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return [partner1, partner2].filter(Boolean).join(" & ") || "James & Sofia";
  }
  return "James & Sofia";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "12.14.2025";
  try {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}.${day}.${year}`;
  } catch {
    return dateStr;
  }
};

const formatTime = (schedule?: Array<{ title: string; time?: string }>) => {
  if (!schedule || schedule.length === 0) return "5:00 PM";
  const ceremony = schedule.find((s) =>
    s.title?.toLowerCase().includes("ceremony")
  );
  if (ceremony?.time) {
    // Try to format time nicely
    return ceremony.time;
  }
  return schedule[0]?.time || "5:00 PM";
};

export default function CinematicWedding({ theme, event }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const location = event.location || event.venue?.name || "The Beacon Theatre";
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "From the coffee shops of Brooklyn to the streets of Paris, their journey has been nothing short of cinematic. Join us for the climax of act one as they exchange vows.";
  const galleryImages =
    event.gallery?.slice(0, 2) || event.photos?.slice(0, 2) || [];
  const showtime = formatTime(event.schedule);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="bg-black text-white font-sans min-h-screen selection:bg-white selection:text-black relative"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Sticky Nav */}
      <nav className="sticky top-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference bg-transparent">
        <div className="text-xs font-bold tracking-[0.3em] uppercase">
          The Premiere
        </div>
        <div className="hidden md:flex gap-8 text-xs font-bold tracking-[0.2em] uppercase">
          <a href="#plot" className="hover:opacity-50 transition-opacity">
            The Plot
          </a>
          <a href="#set" className="hover:opacity-50 transition-opacity">
            The Set
          </a>
          <a href="#cast" className="hover:opacity-50 transition-opacity">
            The Cast
          </a>
        </div>
        <a
          href={rsvpUrl}
          className="border border-white px-6 py-2 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
        >
          Ticket Info
        </a>
      </nav>

      {/* Hero */}
      <header className="h-screen relative flex flex-col justify-between p-8 md:p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className={`w-full h-full object-cover transition-transform duration-[10s] ease-out ${
              visible ? "scale-100 opacity-60" : "scale-110 opacity-0"
            }`}
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
        </div>

        <div className="relative z-10 pt-20">
          <p className="text-xs md:text-sm font-bold tracking-[0.5em] uppercase text-gray-400 mb-4 animate-fade-in-up">
            Based on a True Story
          </p>
        </div>

        <div className="relative z-10 max-w-4xl">
          <h1
            className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8 mix-blend-overlay opacity-90"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Forever
            <br />
            Starts
            <br />
            Now
          </h1>
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-t border-white/20 pt-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">
                <Play size={16} fill="white" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">
                  {names}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Director's Cut
                </p>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                Release Date
              </p>
              <p className="text-xl font-bold uppercase tracking-widest">
                {dateFormatted}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Scroller */}
      <section
        id="plot"
        className="py-32 px-8 md:px-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center"
      >
        <div>
          <h2
            className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-8 leading-none"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Two Lives.
            <br />
            <span className="text-gray-600">One Destiny.</span>
          </h2>
          <p className="text-gray-400 leading-relaxed text-lg mb-8 max-w-md">
            {story}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {galleryImages.length > 0 ? (
            <>
              <img
                src={
                  (typeof galleryImages[0] === "object" &&
                    galleryImages[0]?.url) ||
                  (typeof galleryImages[0] === "object" &&
                    galleryImages[0]?.src) ||
                  (typeof galleryImages[0] === "object" &&
                    galleryImages[0]?.preview) ||
                  (typeof galleryImages[0] === "string"
                    ? galleryImages[0]
                    : undefined) ||
                  "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=600"
                }
                className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700"
                alt=""
              />
              {galleryImages.length > 1 ? (
                <img
                  src={
                    (typeof galleryImages[1] === "object" &&
                      galleryImages[1]?.url) ||
                    (typeof galleryImages[1] === "object" &&
                      galleryImages[1]?.src) ||
                    (typeof galleryImages[1] === "object" &&
                      galleryImages[1]?.preview) ||
                    (typeof galleryImages[1] === "string"
                      ? galleryImages[1]
                      : undefined) ||
                    "https://images.unsplash.com/photo-1623771799757-55030ee08c2a?q=80&w=600"
                  }
                  className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700 mt-12"
                  alt=""
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1623771799757-55030ee08c2a?q=80&w=600"
                  className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700 mt-12"
                  alt=""
                />
              )}
            </>
          ) : (
            <>
              <img
                src="https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=600"
                className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700"
                alt=""
              />
              <img
                src="https://images.unsplash.com/photo-1623771799757-55030ee08c2a?q=80&w=600"
                className="w-full aspect-[3/4] object-cover grayscale hover:grayscale-0 transition-all duration-700 mt-12"
                alt=""
              />
            </>
          )}
        </div>
      </section>

      {/* Production Details */}
      <section
        id="set"
        className="py-24 bg-neutral-900 border-y border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500 mb-16 text-center">
            Production Details
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="group p-8 border border-neutral-800 hover:bg-neutral-800 transition-colors">
              <Calendar className="w-8 h-8 mx-auto mb-6 text-white group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                The Date
              </h3>
              <p className="text-gray-400">
                {event.date || "December 14, 2025"}
              </p>
            </div>
            <div className="group p-8 border border-neutral-800 hover:bg-neutral-800 transition-colors">
              <Clock className="w-8 h-8 mx-auto mb-6 text-white group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                Showtime
              </h3>
              <p className="text-gray-400">Ceremony: {showtime}</p>
            </div>
            <div className="group p-8 border border-neutral-800 hover:bg-neutral-800 transition-colors">
              <MapPin className="w-8 h-8 mx-auto mb-6 text-white group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                Location
              </h3>
              <p className="text-gray-400">{location}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Full Schedule List */}
      {event.schedule && event.schedule.length > 0 && (
        <section className="py-24 px-8 md:px-24 max-w-7xl mx-auto border-y border-neutral-800">
          <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500 mb-16 text-center">
            Full Schedule
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {event.schedule.map((item, idx) => (
              <div
                key={idx}
                className="border-l-4 border-white/20 pl-6 py-4 hover:border-white/40 transition-colors"
              >
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                  {item.title}
                </h3>
                <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
                  {item.time && (
                    <span className="flex items-center gap-2">
                      <Clock size={16} />
                      {item.time}
                    </span>
                  )}
                  {item.location && (
                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wedding Party / Cast */}
      {event.party && event.party.length > 0 && (
        <section id="cast" className="py-24 px-8 md:px-24 max-w-7xl mx-auto">
          <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500 mb-16 text-center">
            The Cast
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {event.party.map((member, idx) => (
              <div
                key={idx}
                className="border border-neutral-800 p-6 hover:bg-neutral-900 transition-colors"
              >
                <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
                  {member.name}
                </h3>
                <p className="text-gray-400 text-sm uppercase tracking-widest">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Travel */}
      {event.travel && (
        <section className="py-24 px-8 md:px-24 max-w-7xl mx-auto border-y border-neutral-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Plane className="w-8 h-8 text-white" />
              <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500">
                Travel & Accommodations
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
              {event.travel}
            </p>
          </div>
        </section>
      )}

      {/* Things To Do */}
      {event.thingsToDo && (
        <section className="py-24 px-8 md:px-24 max-w-7xl mx-auto border-y border-neutral-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Coffee className="w-8 h-8 text-white" />
              <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500">
                Local Recommendations
              </h2>
            </div>
            <p className="text-gray-400 leading-relaxed text-lg">
              {event.thingsToDo}
            </p>
          </div>
        </section>
      )}

      {/* Registry */}
      {event.registry && event.registry.length > 0 && (
        <section className="py-24 px-8 md:px-24 max-w-7xl mx-auto border-y border-neutral-800">
          <div className="max-w-3xl mx-auto text-center">
            <Gift className="w-12 h-12 mx-auto mb-8 text-white" />
            <h2 className="text-xs font-bold tracking-[0.5em] uppercase text-gray-500 mb-8">
              Registry
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {event.registry.map((reg, idx) => (
                <a
                  key={idx}
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-neutral-800 px-8 py-3 text-white hover:bg-white hover:text-black transition-colors uppercase tracking-widest text-sm font-bold"
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
        <section
          id="rsvp"
          className="min-h-[70vh] flex items-center justify-center px-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-900 to-black opacity-50 z-0"></div>
          <div className="relative z-10 max-w-xl w-full text-center">
            <h2
              className="text-5xl font-black uppercase tracking-tighter mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Save Your Seat
            </h2>
            <p className="text-gray-400 mb-12 uppercase tracking-widest text-xs">
              Limited Capacity Event
            </p>

            <div className="space-y-4">
              <a
                href={rsvpUrl}
                className="block bg-white text-black px-12 py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                RSVP Now
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="py-12 border-t border-neutral-900 text-center">
        <div className="text-[10px] font-bold tracking-[0.5em] text-gray-600 uppercase">
          Start A Life Production • Est {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
