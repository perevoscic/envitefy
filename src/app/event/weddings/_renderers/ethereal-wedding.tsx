import React, { useEffect, useState } from "react";
import { ChevronDown, Heart } from "lucide-react";
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
  return "S & J";
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) {
    return event.headlineTitle;
  }
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return [partner1, partner2].filter(Boolean).join(" & ") || "Sarah & James";
  }
  return "Sarah & James";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "September 14, 2025";
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

const getScheduleDetails = (schedule?: Array<{ title: string; time?: string; location?: string }>) => {
  const ceremony = schedule?.find((s) =>
    s.title?.toLowerCase().includes("ceremony")
  ) || { title: "Ceremony", time: "4:00 PM", location: "Villa Medicea" };
  const reception = schedule?.find((s) =>
    s.title?.toLowerCase().includes("reception")
  ) || { title: "Reception", time: "6:30 PM", location: "Grand Hall" };

  return { ceremony, reception };
};

export default function EtherealWedding({ theme, event }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initials = buildInitials(event);
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const location = event.location || event.venue?.name || "Florence";
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=2000&auto=format&fit=crop";
  const parallaxImage =
    event.gallery?.[1]?.url ||
    event.gallery?.[1] ||
    event.photos?.[1] ||
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    '"Whatever our souls are made of, his and mine are the same."';
  const scheduleDetails = getScheduleDetails(event.schedule);
  const detailImage =
    event.gallery?.[2]?.url ||
    event.gallery?.[2] ||
    event.photos?.[2] ||
    "https://images.unsplash.com/photo-1522673607200-1645062cd495?q=80&w=800&auto=format&fit=crop";
  const rsvpUrl = event.rsvp?.url || "#rsvp";
  const rsvpDeadline = event.rsvp?.deadline
    ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "the first of August";

  return (
    <div
      className="font-serif text-slate-800 bg-white"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Nav */}
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl tracking-widest uppercase italic">{initials}</div>
          <div className="hidden md:flex space-x-12 text-xs tracking-[0.2em] uppercase font-medium">
            <a href="#story" className="hover:text-rose-400 transition-colors">
              Story
            </a>
            <a href="#details" className="hover:text-rose-400 transition-colors">
              Details
            </a>
            <a href="#rsvp" className="hover:text-rose-400 transition-colors">
              RSVP
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${heroImage}")`,
          }}
        >
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 text-center px-4 animate-fade-in-up">
          <p className="text-sm tracking-[0.4em] uppercase mb-6 text-slate-800">The Wedding Of</p>
          <h1
            className="text-7xl md:text-9xl mb-8 font-light italic text-slate-900"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <p className="text-lg tracking-[0.2em] uppercase font-light text-slate-800">
            {dateFormatted} • {location}
          </p>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-slate-600" />
        </div>
      </header>

      {/* Quote Section */}
      <section id="story" className="py-32 px-6 text-center max-w-3xl mx-auto">
        <Heart className="w-6 h-6 mx-auto mb-8 text-rose-300" />
        <p className="text-3xl md:text-4xl leading-relaxed font-light text-slate-600 italic">
          {story}
        </p>
        <p className="mt-6 text-sm uppercase tracking-widest text-slate-400">— Emily Brontë</p>
      </section>

      {/* Parallax Divider */}
      <div
        className="h-[60vh] bg-fixed bg-center bg-cover relative"
        style={{
          backgroundImage: `url("${parallaxImage}")`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Details Section */}
      <section id="details" className="py-32 bg-stone-50">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-20">
          <div className="space-y-12">
            <div>
              <h2
                className="text-3xl italic mb-6 text-slate-800"
                style={{ fontFamily: theme.fonts.headline }}
              >
                The Ceremony
              </h2>
              <p className="text-slate-500 leading-loose">
                Join us at {scheduleDetails.ceremony.time || "4:00 PM"} in{" "}
                {scheduleDetails.ceremony.location || "the garden of Villa Medicea"}. The ceremony
                will be held outdoors, followed by aperitivo on the terrace.
              </p>
            </div>
            <div>
              <h2
                className="text-3xl italic mb-6 text-slate-800"
                style={{ fontFamily: theme.fonts.headline }}
              >
                The Reception
              </h2>
              <p className="text-slate-500 leading-loose">
                Dinner and dancing will commence at {scheduleDetails.reception.time || "6:30 PM"} in{" "}
                {scheduleDetails.reception.location || "the Grand Hall"}. Please bring your dancing
                shoes and appetite.
              </p>
            </div>
          </div>
          <div className="relative h-full min-h-[400px]">
            <img
              src={detailImage}
              className="absolute inset-0 w-full h-full object-cover shadow-xl"
              alt="Venue"
            />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-rose-100 -z-10"></div>
          </div>
        </div>
      </section>

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section id="rsvp" className="py-32 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2
              className="text-5xl italic mb-8"
              style={{ fontFamily: theme.fonts.headline }}
            >
              R.S.V.P.
            </h2>
            <p className="mb-12 text-slate-500">Kindly respond by {rsvpDeadline}</p>

            <div className="space-y-6">
              <a
                href={rsvpUrl}
                className="block w-full bg-slate-800 text-white py-4 uppercase tracking-[0.2em] text-xs mt-8 hover:bg-rose-400 transition-colors text-center"
              >
                Send Response
              </a>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-white py-12 text-center text-slate-400 text-xs uppercase tracking-widest border-t border-slate-100">
        <p>
          {names} • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
