import React from "react";
import { Music, Sun, Heart, MapPin } from "lucide-react";
import type { EventData, ThemeConfig } from "./content-sections";

type Props = { theme: ThemeConfig; event: EventData };

const getNames = (event: EventData) =>
  event.headlineTitle ||
  [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") ||
  "Jessica & Mike";

const getDate = (event: EventData) =>
  event.date || event.when || event.schedule?.[0]?.date || "October 12, 2025";

const getLocation = (event: EventData) =>
  event.location || event.venue?.name || "Palm Springs, CA";

export default function Retro70s({ theme, event }: Props) {
  const names = getNames(event);
  const date = getDate(event);
  const location = getLocation(event);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  const scoop = [
    {
      title: "When",
      icon: <Sun size={32} />,
      primary: date || "October 12th, 2025",
      detail: event.time || "Ceremony at 4pm sharp. Don't be a square.",
      bg: "#E9C46A",
      text: "#386641",
    },
    {
      title: "Where",
      icon: <MapPin size={32} />,
      primary:
        event.venue?.name || "The Palm Springs Ace",
      detail: event.venue?.address || "701 E Palm Canyon Dr, Palm Springs, CA",
      bg: "#6A994E",
      text: "#FEFAE0",
    },
    {
      title: "Vibe",
      icon: <Music size={32} />,
      primary: "Disco Cowgirl / Boy",
      detail: "Bring your dancing shoes. We're playing funk all night.",
      bg: "#BC4749",
      text: "#FEFAE0",
    },
  ];

  const gallery =
    event.gallery && event.gallery.length
      ? event.gallery.slice(0, 3).map((g) => g.url || g.src || g)
      : [
          "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=600&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542038782534-3675a483aa99?q=80&w=600&auto=format&fit=crop",
        ];

  return (
    <div
      className="min-h-screen bg-[#FEFAE0] text-[#BC4749] font-sans overflow-x-hidden selection:bg-[#BC4749] selection:text-[#FEFAE0]"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div
        className="fixed inset-0 opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#BC4749 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      <nav className="fixed top-4 left-0 w-full z-50 flex justify-center px-4">
        <div className="bg-[#FEFAE0]/90 backdrop-blur-md border-2 border-[#386641] rounded-full px-6 py-3 flex gap-4 md:gap-8 shadow-[4px_4px_0px_0px_#386641]">
          {["The Scoop", "The Digs", "RSVP"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="font-black uppercase text-xs md:text-sm tracking-wide text-[#386641] hover:text-[#BC4749] transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </nav>

      <header className="min-h-screen flex flex-col items-center justify-center p-4 relative pt-24">
        <div className="relative w-full max-w-4xl aspect-[4/3] md:aspect-[16/9] flex items-center justify-center">
          <div className="absolute inset-0 border-[3px] border-[#386641] rounded-[50%] animate-[spin_10s_linear_infinite] opacity-20 hidden md:block w-[120%] h-[120%] left-[-10%] top-[-10%] border-dashed"></div>

          <div className="bg-[#A7C957] p-8 md:p-16 rounded-[3rem] rotate-2 shadow-[10px_10px_0px_0px_#386641] w-full text-center border-4 border-[#386641] relative z-10 hover:rotate-1 transition-transform duration-500">
            <div className="bg-[#F2E8CF] p-8 md:p-12 rounded-[2rem] -rotate-2 border-4 border-[#BC4749] h-full flex flex-col justify-center items-center">
              <div className="bg-[#BC4749] text-[#F2E8CF] px-4 py-1 rounded-full font-bold text-xs uppercase mb-6 animate-bounce">
                We're Actually Doing It
              </div>
              <h1
                className="text-5xl md:text-8xl font-black uppercase leading-[0.9] mb-6 text-[#BC4749] drop-shadow-[4px_4px_0px_#386641]"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Groovy
                <br />
                Love
              </h1>
              <p className="font-mono text-[#386641] mb-8 text-lg">
                {names.toUpperCase()} • {date} • {location}
              </p>

              <div className="flex gap-4">
                <div className="w-3 h-3 rounded-full bg-[#E9C46A]"></div>
                <div className="w-3 h-3 rounded-full bg-[#6A994E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#BC4749]"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-[#386641] text-[#FEFAE0] py-4 overflow-hidden border-y-4 border-[#BC4749] rotate-[-1deg] scale-105 z-20 relative">
        <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap font-black text-2xl uppercase flex gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>Peace • Love • Tacos • Dancing • Good Vibes Only •</span>
          ))}
        </div>
      </div>

      <section id="the-scoop" className="py-24 px-4 max-w-6xl mx-auto relative">
        <div id="the-digs" className="absolute -top-16 left-0" aria-hidden="true" />
        <h2 className="text-5xl md:text-7xl font-black text-center text-[#BC4749] mb-16 uppercase drop-shadow-[3px_3px_0px_#E9C46A]">
          The Lowdown
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {scoop.map((card, i) => (
            <div
              key={card.title}
              className="rounded-3xl p-8 border-4 border-[#386641] shadow-[8px_8px_0px_0px_#BC4749] hover:-translate-y-2 transition-transform"
              style={{ backgroundColor: card.bg, color: card.text }}
            >
              <div className="bg-[#FEFAE0] w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#386641] mb-6 text-[#BC4749]">
                {card.icon}
              </div>
              <h3 className="text-2xl font-black uppercase text-[#386641] mb-2">
                {card.title}
              </h3>
              <p className="font-medium text-[#386641]">{card.primary}</p>
              <p className="text-sm text-[#386641]">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 overflow-x-hidden">
        <div className="flex justify-center gap-4 rotate-2 md:scale-110">
          {gallery.map((src, i) => (
            <div
              key={i}
              className="bg-white p-4 pb-12 shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300 first:rotate-[-4deg] last:rotate-[4deg]"
            >
              <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-200 overflow-hidden grayscale contrast-125 hover:grayscale-0 transition-all">
                <img src={src} alt="Gallery" className="w-full h-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="rsvp" className="py-24 px-4">
        <div className="max-w-2xl mx-auto bg-[#F2E8CF] rounded-[3rem] p-8 md:p-16 border-4 border-[#BC4749] shadow-[12px_12px_0px_0px_#386641]">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-[#BC4749] mx-auto mb-4 fill-current animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-black uppercase text-[#386641]">
              Can You Dig It?
            </h2>
            <p className="font-bold text-[#BC4749] mt-4">RSVP BY SEPTEMBER 1ST</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="font-black text-[#386641] uppercase ml-4">Your Name</label>
              <input
                type="text"
                className="w-full bg-white border-4 border-[#386641] rounded-full px-6 py-4 font-bold text-[#BC4749] focus:outline-none focus:shadow-[4px_4px_0px_0px_#BC4749] transition-shadow"
                placeholder="Foxy Lady / Cool Cat"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a
                href={rsvpUrl}
                className="bg-[#6A994E] border-4 border-[#386641] rounded-2xl py-4 font-black text-white uppercase hover:bg-[#386641] hover:translate-y-1 transition-all text-center"
              >
                I'm There
              </a>
              <a
                href={rsvpUrl}
                className="bg-[#BC4749] border-4 border-[#386641] rounded-2xl py-4 font-black text-white uppercase hover:bg-[#90292B] hover:translate-y-1 transition-all text-center"
              >
                Bummer, No
              </a>
            </div>
          </form>
        </div>
      </section>

      <footer className="bg-[#386641] text-[#FEFAE0] py-12 text-center font-black uppercase">
        <p className="text-2xl mb-2">Catch you on the flip side</p>
        <p className="text-sm opacity-70">© {new Date().getFullYear()} {names}</p>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
