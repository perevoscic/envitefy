import React from "react";
import { ArrowUpRight, Martini, Music, Building2 } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) return event.headlineTitle;
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return [partner1, partner2].filter(Boolean).join(" & ") || "Alex & Jordan";
  }
  return "Alex & Jordan";
};

const buildCityLine = (event: EventData) => {
  if (event.location) return event.location;
  if (event.venue?.name || event.venue?.address) {
    return [event.venue.name, event.venue.address].filter(Boolean).join(" • ");
  }
  return "Chicago, IL";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "09.18.2025";
  try {
    const d = new Date(dateStr);
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const year = d.getFullYear();
    return `${month}.${day}.${year}`;
  } catch {
    return dateStr;
  }
};

const getHeroImage = (event: EventData, theme: ThemeConfig) => {
  return (
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    event.gallery?.[0]?.src ||
    event.gallery?.[0]?.preview ||
    (typeof event.gallery?.[0] === "string" ? (event.gallery as any)[0] : "") ||
    event.photos?.[0] ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2000&auto=format&fit=crop"
  );
};

export default function SkylineWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const cityLine = buildCityLine(event);
  const date = formatDate(event.date);
  const heroImage = getHeroImage(event, theme);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Hero */}
      <header className="relative h-screen flex flex-col justify-end p-8 md:p-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-60"
            alt="City Skyline"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8 border-b border-white/20 pb-12">
          <div>
            <p className="text-orange-400 font-bold uppercase tracking-widest mb-2">
              {cityLine}
            </p>
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-none">
              {event.tagline || (
                <>
                  Top of
                  <br />
                  the World
                </>
              )}
            </h1>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-light text-right">
              {names}
              <br />
              <span className="text-gray-400 text-lg">{date}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Venue Info */}
      <section className="py-24 px-8 bg-slate-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-bold mb-6">The Venue</h2>
            <p className="text-xl text-slate-400 leading-relaxed whitespace-pre-wrap">
              {event.story ||
                "We're taking love to new heights. Join us for a ceremony above the city, followed by cocktails at sunset."}
            </p>
          </div>
          <div className="grid gap-6">
            <div className="flex items-center gap-6 p-6 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
              <div className="bg-orange-500/20 p-4 rounded-full text-orange-400">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {(event.schedule && event.schedule[0]?.title) ||
                    "The Rooftop"}
                </h3>
                <p className="text-sm text-slate-500">
                  {(event.schedule && event.schedule[0]?.time) ||
                    "Ceremony at 5:30 PM"}
                </p>
              </div>
              <ArrowUpRight className="ml-auto text-slate-600" />
            </div>
            <div className="flex items-center gap-6 p-6 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
              <div className="bg-purple-500/20 p-4 rounded-full text-purple-400">
                <Martini size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {(event.schedule && event.schedule[1]?.title) || "The Lounge"}
                </h3>
                <p className="text-sm text-slate-500">
                  {(event.schedule && event.schedule[1]?.time) ||
                    "Cocktails & Music at 6:30 PM"}
                </p>
              </div>
              <ArrowUpRight className="ml-auto text-slate-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Split Image Section */}
      <section className="grid md:grid-cols-3 h-[50vh] border-y border-white/10">
        <div className="bg-slate-800 p-12 flex flex-col justify-center items-center text-center">
          <div className="text-6xl font-black text-white/10 mb-4">01</div>
          <h3 className="text-2xl font-bold mb-2">Dress Code</h3>
          <p className="text-slate-400 text-sm">
            {event.thingsToDo ||
              "Black tie optional – think city chic and ready for photos."}
          </p>
        </div>
        <div className="bg-slate-800 p-12 flex flex-col justify-center items-center text-center border-l border-r border-white/10">
          <div className="text-6xl font-black text-white/10 mb-4">02</div>
          <h3 className="text-2xl font-bold mb-2">Open Bar</h3>
          <p className="text-slate-400 text-sm">
            Signature cocktails and skyline views all night.
          </p>
        </div>
        <div className="bg-slate-800 p-12 flex flex-col justify-center items-center text-center">
          <div className="text-6xl font-black text-white/10 mb-4">03</div>
          <h3 className="text-2xl font-bold mb-2">Live Band</h3>
          <p className="text-slate-400 text-sm">
            {event.travel ||
              "Bring your dancing shoes – we’ll be celebrating under the stars."}
          </p>
        </div>
      </section>

      {/* RSVP */}
      {event.rsvpEnabled && (
        <section className="py-32 px-8 text-center bg-gradient-to-b from-slate-900 to-black">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            The Guest List
          </h2>
          <p className="text-slate-400 mb-12">
            {event.rsvp?.deadline
              ? `Kindly respond by ${new Date(
                  event.rsvp.deadline
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}.`
              : "Space is limited on the roof."}
          </p>

          <div className="inline-flex rounded-full p-1 bg-white/10 backdrop-blur-sm">
            <a
              href={event.rsvp?.url || "#rsvp"}
              className="px-8 py-3 rounded-full bg-white text-black font-bold uppercase tracking-wider text-sm hover:bg-orange-400 hover:text-white transition-colors"
            >
              Accept
            </a>
            <a
              href={event.rsvp?.url || "#rsvp"}
              className="px-8 py-3 rounded-full text-white font-bold uppercase tracking-wider text-sm hover:text-orange-400 transition-colors"
            >
              Decline
            </a>
          </div>
        </section>
      )}

      <footer className="py-8 text-center text-slate-600 text-xs uppercase font-bold tracking-widest">
        <p>
          {names} • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
