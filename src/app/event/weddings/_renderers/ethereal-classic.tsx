import React, { useEffect, useState } from "react";
import {
  Heart,
  MapPin,
  Calendar,
  Clock,
  Gift,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = { theme: ThemeConfig; event: EventData };

const buildNames = (event: EventData) =>
  event.headlineTitle ||
  [event.couple?.partner1, event.couple?.partner2]
    .filter(Boolean)
    .join(" & ") ||
  "Your Names";

const buildDateLine = (event: EventData) =>
  event.date ||
  event.when ||
  event.schedule?.[0]?.date ||
  "September 14, 2025 • Florence, Italy";

const buildLocation = (event: EventData) =>
  event.location || event.venue?.name || event.travel?.hotels?.[0]?.name;

export default function EtherealClassic({
  theme,
  event,
}: Props): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const names = buildNames(event);
  const dateLine = buildDateLine(event);
  const locationLine = buildLocation(event);
  const story =
    event.story ||
    "It started with a spilled coffee in a crowded bookstore. Five years later, we're ready for our greatest chapter.";
  const registry = Array.isArray(event.registry) ? event.registry : [];
  const schedule = Array.isArray(event.schedule) ? event.schedule : [];

  return (
    <div
      className="font-serif text-slate-800 bg-stone-50 selection:bg-rose-200"
      style={{ fontFamily: theme.fonts.body }}
    >
      <nav
        className={`fixed w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <button
            className="text-2xl tracking-widest uppercase"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names
              .split("&")
              .map((s) => s.trim())
              .slice(0, 2)
              .join(" & ")}
          </button>
          <div className="hidden md:flex space-x-8 text-sm tracking-widest uppercase">
            {["story", "details", "registry"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="hover:text-rose-400 transition-colors"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => setRsvpOpen(true)}
              className="border border-slate-800 px-6 py-2 hover:bg-slate-800 hover:text-white transition-all"
            >
              RSVP
            </button>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t border-gray-100 flex flex-col items-center py-8 space-y-6 md:hidden shadow-xl">
            {["story", "details", "registry"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className="text-lg tracking-widest uppercase"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => {
                setRsvpOpen(true);
                setIsMenuOpen(false);
              }}
              className="bg-slate-800 text-white px-8 py-3 uppercase tracking-widest"
            >
              RSVP
            </button>
          </div>
        )}
      </nav>

      <header className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${theme.decorations.heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-sm md:text-lg tracking-[0.3em] uppercase mb-4">
            {event.tagline || "The Wedding Of"}
          </p>
          <h1
            className="text-6xl md:text-8xl mb-6 font-light italic"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>
          <div className="w-16 h-px bg-white mx-auto mb-6" />
          <p className="text-lg md:text-xl tracking-widest uppercase font-light">
            {dateLine}
          </p>
        </div>
        <button
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white animate-bounce"
          onClick={() => scrollToSection("story")}
        >
          <ChevronDown size={32} />
        </button>
      </header>

      <section id="story" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <Heart className="mx-auto text-rose-300 w-8 h-8 mb-8" />
        <h2 className="text-4xl mb-12 italic" style={{ fontFamily: theme.fonts.headline }}>
          Our Story
        </h2>
        <p className="text-lg leading-relaxed text-slate-600">{story}</p>
        {event.gallery?.length ? (
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            {event.gallery.slice(0, 3).map((src, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden group">
                <img
                  src={src.url || src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div
        className="h-64 bg-fixed bg-center bg-cover"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop")',
        }}
      />

      <section id="details" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl italic mb-4"
              style={{ fontFamily: theme.fonts.headline }}
            >
              The Details
            </h2>
            <p className="text-slate-500 uppercase tracking-widest text-sm">
              Join us for a celebration of love
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="text-center p-8 border border-stone-200 hover:border-rose-200 transition-colors duration-300">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-400">
                <Clock />
              </div>
              <h3 className="text-xl uppercase tracking-widest mb-4">Timeline</h3>
              <ul className="space-y-4 text-slate-600">
                {(schedule.length ? schedule : [
                  { time: "4:00 PM", title: "Ceremony" },
                  { time: "5:00 PM", title: "Cocktail Hour" },
                  { time: "6:30 PM", title: "Dinner & Dancing" },
                  { time: "11:00 PM", title: "Send Off" },
                ]).map((item, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-800">{item.time}</strong> —{" "}
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center p-8 border border-stone-200 hover:border-rose-200 transition-colors duration-300">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-400">
                <MapPin />
              </div>
              <h3 className="text-xl uppercase tracking-widest mb-4">Location</h3>
              <p className="text-slate-600 mb-2">
                {locationLine || "Venue To Be Announced"}
              </p>
              {event.venue?.address && (
                <p className="text-slate-500 italic mb-6">{event.venue.address}</p>
              )}
              {event.locationUrl && (
                <a
                  href={event.locationUrl}
                  className="text-xs uppercase border-b border-slate-800 pb-1 hover:text-rose-400 hover:border-rose-400 transition-colors"
                >
                  View Map
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="registry" className="py-24 bg-stone-100 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <Gift className="mx-auto w-8 h-8 mb-6 text-rose-300" />
          <h2
            className="text-3xl italic mb-6"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Registry
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {event.registryNote ||
              "Your presence at our wedding is the greatest gift of all. If you wish to bless us with a gift, we have registered below."}
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            {(registry.length ? registry : ["Zola", "Crate & Barrel", "Target"]).map(
              (store, idx) => (
                <a
                  key={idx}
                  href={typeof store === "string" ? "#" : store.url}
                  className="bg-white px-6 py-3 shadow-sm hover:shadow-md transition-shadow text-sm tracking-widest uppercase"
                >
                  {typeof store === "string" ? store : store.name}
                </a>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <h2
          className="text-2xl font-serif italic text-white mb-4"
          style={{ fontFamily: theme.fonts.headline }}
        >
          {names}
        </h2>
        <p className="text-xs uppercase tracking-widest">
          {event.footer || "Est. 2025"}
        </p>
      </footer>

      {rsvpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full p-8 relative shadow-2xl animate-fade-in-up">
            <button
              onClick={() => setRsvpOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"
            >
              <X size={20} />
            </button>
            <h3
              className="text-2xl italic text-center mb-6"
              style={{ fontFamily: theme.fonts.headline }}
            >
              RSVP
            </h3>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setRsvpOpen(false);
              }}
            >
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 text-slate-500">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-rose-400 transition-colors"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border-b border-stone-300 py-2 focus:outline-none focus:border-rose-400 transition-colors"
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="pt-4">
                <label className="block text-xs uppercase tracking-widest mb-4 text-slate-500">
                  Will you be attending?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="attending" className="accent-rose-400" />
                    <span className="text-sm">Joyfully Accept</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="attending" className="accent-rose-400" />
                    <span className="text-sm">Regretfully Decline</span>
                  </label>
                </div>
              </div>
              <button className="w-full bg-slate-800 text-white py-3 uppercase tracking-widest hover:bg-rose-400 transition-colors mt-6">
                Send RSVP
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
