import React, { useEffect, useState } from "react";
import { Star, GlassWater, Music, Utensils } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = { theme: ThemeConfig; event: EventData };

const getNames = (event: EventData) =>
  event.headlineTitle ||
  [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") ||
  "Alexander & Elizabeth";

const getDate = (event: EventData) =>
  event.date || event.when || event.schedule?.[0]?.date || "December 14, 2025";

const getVenue = (event: EventData) =>
  event.location || event.venue?.name || "The Grand Hall";

const getCity = (event: EventData) =>
  event.venue?.city || event.city || event.venue?.address || "New York City";

export default function NoirLuxury({ theme, event }: Props) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const names = getNames(event);
  const dateLabel = getDate(event);
  const venue = getVenue(event);
  const city = getCity(event);

  const timeline = [
    { time: event.schedule?.[0]?.time || "18:00", title: event.schedule?.[0]?.title || "Ceremony", icon: Star },
    { time: event.schedule?.[1]?.time || "19:00", title: event.schedule?.[1]?.title || "Cocktail Hour", icon: GlassWater },
    { time: event.schedule?.[2]?.time || "20:30", title: event.schedule?.[2]?.title || "Grand Dinner", icon: Utensils },
    { time: event.schedule?.[3]?.time || "22:00", title: event.schedule?.[3]?.title || "Dancing", icon: Music },
  ];

  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-neutral-900 text-neutral-300 font-serif selection:bg-[#D4AF37] selection:text-black overflow-x-hidden"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div className="fixed inset-4 border border-[#D4AF37]/20 pointer-events-none z-50 mix-blend-screen"></div>
      <div className="fixed inset-6 border border-[#D4AF37]/10 pointer-events-none z-50 mix-blend-screen"></div>

      <header className="min-h-screen flex items-center justify-center relative px-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-50"></div>

        <div
          className="text-center z-10 border-y-4 border-double border-[#D4AF37] py-16 px-4 md:px-24 bg-neutral-900/80 backdrop-blur-sm max-w-4xl transition-transform duration-100"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <div className="mb-6 flex justify-center gap-4 text-[#D4AF37]">
            <Star size={16} fill="currentColor" />
            <Star size={24} fill="currentColor" />
            <Star size={16} fill="currentColor" />
          </div>

          <p className="tracking-[0.4em] text-xs text-[#D4AF37] uppercase mb-8">
            Cordially Inviting You To
          </p>
          <h1
            className="text-5xl md:text-8xl mb-6 text-[#F5E6C4] font-light tracking-wide leading-tight"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names.split("&")[0]?.trim()} <br />
            <span className="text-[#D4AF37] text-4xl md:text-6xl align-middle mx-4">
              &
            </span>
            {names.split("&")[1]?.trim() || ""}
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 mt-12 text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
            <span>{dateLabel}</span>
            <span className="hidden md:block text-[8px] opacity-50">✦</span>
            <span>{venue}</span>
            <span className="hidden md:block text-[8px] opacity-50">✦</span>
            <span>{city}</span>
          </div>
        </div>
      </header>

      <section className="grid md:grid-cols-2 min-h-[80vh] border-t border-[#D4AF37]/20">
        <BioCard
          title={event.couple?.partner1 || "The Groom"}
          defaultTitle="The Groom"
          copy={
            event.couple?.story ||
            "Lover of scotch, jazz vinyls, and late-night architecture drafts."
          }
          img={
            event.gallery?.[0]?.url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
          }
          align="right"
        />
        <BioCard
          title={event.couple?.partner2 || "The Bride"}
          defaultTitle="The Bride"
          copy={
            event.story ||
            "A force of nature wrapped in silk. Connoisseur of vintage literature, spicy food, and keeping her partner in check."
          }
          img={
            event.gallery?.[1]?.url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
          }
          align="left"
        />
      </section>

      <section className="py-32 px-6 relative bg-neutral-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl text-[#D4AF37] mb-16 uppercase tracking-widest border-b border-[#D4AF37]/20 pb-8 inline-block">
            The Evening&apos;s Program
          </h2>

          <div className="space-y-16 relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent"></div>

            {timeline.map((item, i) => (
              <div key={i} className="relative z-10 bg-neutral-900 p-4">
                <div className="w-12 h-12 mx-auto bg-[#0F0F0F] border border-[#D4AF37] rounded-full flex items-center justify-center text-[#D4AF37] mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <item.icon size={18} />
                </div>
                <h3 className="text-xl text-[#F5E6C4] uppercase tracking-widest">
                  {item.title}
                </h3>
                <p className="text-[#D4AF37] font-mono text-sm mt-2">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Dress Code",
              desc: event.dressCode ||
                "Black Tie Strict. Gentlemen in tuxedos, ladies in floor-length gowns. Noir aesthetics encouraged.",
            },
            {
              title: "Accommodations",
              desc:
                event.travel?.hotels?.[0]?.name ||
                "A block of rooms has been reserved at The Plaza. Mention the couple for the preferred rate.",
            },
            {
              title: "Transportation",
              desc:
                event.travel?.shuttle ||
                "Valet parking available. Shuttle service provided from The Plaza.",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="border border-[#D4AF37]/20 p-8 text-center hover:bg-[#D4AF37]/5 transition-colors duration-500"
            >
              <h3 className="text-[#D4AF37] uppercase tracking-widest mb-4 text-sm font-bold">
                {card.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-7">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-32 px-6 flex justify-center">
        <div className="w-full max-w-2xl border-2 border-[#D4AF37] p-2 relative">
          <div className="absolute top-0 left-0 w-4 h-4 bg-[#D4AF37]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 bg-[#D4AF37]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#D4AF37]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#D4AF37]"></div>

          <div className="border border-[#D4AF37]/50 p-8 md:p-12 bg-[#0A0A0A] text-center">
            <h2 className="text-3xl text-[#F5E6C4] mb-2 uppercase tracking-widest">
              Request for Entry
            </h2>
            <p className="text-[#D4AF37] text-xs mb-12 uppercase tracking-[0.2em]">
              {event.rsvp?.deadline || "Respond by November 1st"}
            </p>

            <form className="space-y-8" action={rsvpUrl}>
              <div className="group">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-[#D4AF37]/30 py-3 text-[#F5E6C4] text-center focus:outline-none focus:border-[#D4AF37] transition-colors"
                  placeholder="ENTER YOUR NAME"
                />
              </div>
              <div className="flex justify-center gap-12 text-sm">
                <label className="flex items-center gap-3 cursor-pointer text-neutral-400 hover:text-[#D4AF37] transition-colors">
                  <input type="radio" name="rsvp" className="accent-[#D4AF37]" /> ACCEPT
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-neutral-400 hover:text-[#D4AF37] transition-colors">
                  <input type="radio" name="rsvp" className="accent-[#D4AF37]" /> DECLINE
                </label>
              </div>
              <button className="bg-[#D4AF37] text-black px-12 py-3 uppercase tracking-widest font-bold text-xs hover:bg-[#F5E6C4] transition-colors mt-8">
                Confirm Attendance
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="text-center py-12 border-t border-[#D4AF37]/20 text-neutral-600 text-xs tracking-widest uppercase">
        <p>{event.footer || "Est. 2025 • New York City"}</p>
      </footer>
    </div>
  );
}

function BioCard({
  title,
  defaultTitle,
  copy,
  img,
  align = "left",
}: {
  title: string | undefined;
  defaultTitle: string;
  copy: string;
  img: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`bg-[#0A0A0A] p-12 md:p-24 flex flex-col justify-center text-center ${
        align === "right" ? "md:text-right border-b md:border-b-0 md:border-r" : "md:text-left"
      } border-[#D4AF37]/20`}
    >
      <h2 className="text-4xl text-[#F5E6C4] mb-8">
        {title || defaultTitle}
      </h2>
      <p className="leading-8 text-neutral-400 mb-8">{copy}</p>
      <div className="w-full h-64 bg-neutral-800 grayscale overflow-hidden border border-[#D4AF37]/30">
        <img
          src={img}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
        />
      </div>
    </div>
  );
}
