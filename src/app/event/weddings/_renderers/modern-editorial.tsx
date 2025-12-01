import React from "react";
import { ArrowRight, Calendar, MapPin, Heart } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = { theme: ThemeConfig; event: EventData };

const getNames = (event: EventData) =>
  event.headlineTitle ||
  [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") ||
  "Kai & Thomas";

const getDateLabel = (event: EventData) =>
  event.date ||
  event.when ||
  event.schedule?.[0]?.date ||
  "December 10, 2025";

const getLocation = (event: EventData) =>
  event.location || event.venue?.name || "New York City";

export default function ModernEditorial({ theme, event }: Props) {
  const names = getNames(event);
  const dateLabel = getDateLabel(event);
  const location = getLocation(event);
  const schedule = Array.isArray(event.schedule)
    ? event.schedule.slice(0, 3)
    : [];

  const timeline = schedule.length
    ? schedule.map((item) => ({
        time: item.time || item.label || "",
        title: item.title || item.label || item.activity || "Event",
        desc: item.description || item.details || "",
      }))
    : [
        { time: "16:00", title: "Ceremony", desc: "Short, sweet, and legally binding." },
        { time: "17:30", title: "Aperitivo", desc: "Cocktails and tiny food on trays." },
        { time: "19:00", title: "Dinner & Disco", desc: "Family style feast then DJ." },
      ];

  const venueLine =
    event.venue?.address ||
    "215 Chrystie St, New York, NY 10002";

  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="font-sans text-black bg-white selection:bg-lime-300 selection:text-black"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div className="fixed top-0 left-0 w-full z-50 mix-blend-difference text-white px-4 py-4 md:px-8 flex justify-between items-center">
        <span className="font-bold text-lg tracking-tight">
          {names.split("&").map((s) => s.trim()[0]).join(" & ")}
        </span>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#schedule" className="hover:underline decoration-2 underline-offset-4">
            SCHEDULE
          </a>
          <a href="#location" className="hover:underline decoration-2 underline-offset-4">
            LOCATION
          </a>
          <a href="#rsvp" className="hover:underline decoration-2 underline-offset-4">
            RSVP
          </a>
        </div>
        <span className="text-sm font-mono border border-white px-2 py-0.5 rounded-full">
          {dateLabel}
        </span>
      </div>

      <section className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="relative h-[60vh] md:h-screen bg-neutral-900 overflow-hidden">
          {theme.decorations.heroImage && (
            <img
              src={theme.decorations.heroImage}
              className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-[2s]"
              alt="Hero"
            />
          )}
        </div>
        <div className="h-[40vh] md:h-screen flex flex-col justify-center px-4 md:px-12 bg-lime-300 relative">
          <h1
            className="text-6xl md:text-9xl font-black leading-[0.85] tracking-tighter uppercase mb-6"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Just
            <br />
            Married
            <br />
            <span className="text-white text-stroke-black">(Almost)</span>
          </h1>
          <p className="font-mono text-sm md:text-lg border-t-2 border-black pt-4 max-w-md">
            {names.toUpperCase()} ARE TYING THE KNOT.
            <br />
            {location.toUpperCase()}. {dateLabel.toUpperCase()}.
          </p>

          <a
            href={rsvpUrl}
            className="absolute bottom-8 right-8 bg-black text-white rounded-full p-8 md:p-12 hover:scale-110 transition-transform flex items-center justify-center group"
          >
            <span className="group-hover:hidden font-bold">RSVP</span>
            <ArrowRight className="hidden group-hover:block w-8 h-8" />
          </a>
        </div>
      </section>

      <div className="bg-black text-white py-4 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="text-2xl md:text-4xl font-black mx-4 uppercase"
            >
              Let&apos;s Party • Drinks on Us • Bad Dancing Welcome •
            </span>
          ))}
        </div>
      </div>

      <section id="schedule" className="grid grid-cols-1 md:grid-cols-12 gap-0 border-b-2 border-black">
        <div className="md:col-span-4 p-8 md:p-16 border-r-2 border-black bg-neutral-50 flex flex-col justify-between">
          <h2 className="text-5xl font-black uppercase mb-8" style={{ fontFamily: theme.fonts.headline }}>
            The
            <br />
            Plan
          </h2>
          <Calendar className="w-16 h-16 text-lime-500 mb-4" />
        </div>
        <div className="md:col-span-8 p-8 md:p-16">
          <div className="space-y-12">
            {timeline.map((item, idx) => (
              <React.Fragment key={idx}>
                <div className="flex gap-6 items-start group">
                  <span className="font-mono text-xl bg-black text-white px-2 py-1">
                    {item.time || "TBD"}
                  </span>
                  <div>
                    <h3 className="text-3xl font-bold uppercase mb-2 group-hover:text-lime-600 transition-colors">
                      {item.title || "Event"}
                    </h3>
                    {item.desc && (
                      <p className="text-neutral-600 max-w-md">{item.desc}</p>
                    )}
                  </div>
                </div>
                {idx < timeline.length - 1 && (
                  <div className="w-full h-0.5 bg-neutral-200"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section id="location" className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-black">
        <div className="order-2 md:order-1 p-8 md:p-16 flex flex-col justify-center bg-lime-300">
          <MapPin className="w-12 h-12 mb-6" />
          <h2
            className="text-4xl md:text-6xl font-black uppercase mb-6 leading-none"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {event.venue?.name || "Public Hotels"}
          </h2>
          <p className="font-mono text-lg mb-8">
            {venueLine}
          </p>
          <a
            href={event.locationUrl || "#"}
            className="inline-block bg-black text-white font-bold py-4 px-8 w-max hover:bg-white hover:text-black transition-colors border-2 border-black"
          >
            GET DIRECTIONS
          </a>
        </div>
        <div className="order-1 md:order-2 h-[50vh] md:h-auto overflow-hidden relative border-l-2 border-black">
          <img
            src={
              event.gallery?.[0]?.url ||
              "https://images.unsplash.com/photo-1544211181-7027582b137d?q=80&w=1600&auto=format&fit=crop"
            }
            className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
            alt="Venue"
          />
        </div>
      </section>

      <section id="rsvp" className="bg-black text-white py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <Heart className="w-24 h-24 mx-auto mb-8 text-lime-300 animate-pulse" />
          <h2
            className="text-5xl md:text-8xl font-black uppercase mb-8 tracking-tighter"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Are you in?
          </h2>
          <p className="font-mono text-neutral-400 mb-12">
            {event.rsvp?.deadline || "PLEASE RESPOND BY NOVEMBER 1ST"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href={rsvpUrl}
              className="bg-lime-300 text-black py-4 px-8 font-bold text-xl uppercase hover:bg-white transition-colors text-center"
            >
              Hell Yes
            </a>
            <a
              href={rsvpUrl}
              className="bg-neutral-800 text-white py-4 px-8 font-bold text-xl uppercase hover:bg-neutral-700 transition-colors border border-neutral-700 text-center"
            >
              Can't Make It
            </a>
          </div>
        </div>

        <div className="mt-24 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center font-mono text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} {names}</p>
          <p>DESIGNED IN NYC</p>
        </div>
      </section>

      <style>{`
        .text-stroke-black {
          -webkit-text-stroke: 2px black;
          color: transparent;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
