import React from "react";
import { BookOpen, PenTool, Feather, Bookmark } from "lucide-react";
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
          {match[1]} <br />
          <span className="text-[#5D2E2E] text-4xl italic">&</span>
          <br />
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
          {names[0]} <br />
          <span className="text-[#5D2E2E] text-4xl italic">&</span>
          <br />
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Arthur & Eleanor";
  }
  return (
    <>
      Arthur <br />
      <span className="text-[#5D2E2E] text-4xl italic">&</span>
      <br />
      Eleanor
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "October 28, 2025";
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

const getLocationParts = (location?: string, venue?: { name?: string }) => {
  const venueName = venue?.name || location || "The Boston Public Library";
  return venueName;
};

const getScheduleDetails = (
  schedule?: Array<{ title: string; time?: string; location?: string }>
) => {
  const ceremony = schedule?.find((s) =>
    s.title?.toLowerCase().includes("ceremony")
  ) || {
    title: "Ceremony",
    time: "4:00 PM",
    location: "Bates Hall Reading Room",
  };
  const reception = schedule?.find((s) =>
    s.title?.toLowerCase().includes("reception")
  ) || {
    title: "Reception",
    time: "6:00 PM",
    location: "The Courtyard Tea Room",
  };

  return { ceremony, reception };
};

export default function LibraryWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateFormatted = formatDate(event.date);
  const venueName = getLocationParts(event.location, event.venue);
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1507842217153-e21f2010903d?q=80&w=2000&auto=format&fit=crop";
  const story =
    event.story ||
    "It was a rainy Tuesday in Cambridge when their paths first crossed in the philosophy aisle. What began as a debate over Stoicism evolved into a shared coffee, then a shared dinner, and eventually, a shared life. Now, we invite you to turn the page with us as we start our next volume together.";
  const scheduleDetails = getScheduleDetails(event.schedule);
  const rsvpUrl = event.rsvp?.url || "#rsvp";
  const rsvpDeadline = event.rsvp?.deadline
    ? new Date(event.rsvp.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "September 1st";

  return (
    <div
      className="bg-[#2B211E] text-[#D4C5B0] font-serif min-h-screen selection:bg-[#5D2E2E] selection:text-[#D4C5B0] relative"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Background Texture */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'url("https://www.transparenttextures.com/patterns/paper.png")',
        }}
      ></div>

      {/* Book Cover / Hero with Visible Image */}
      <header className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            alt="Library"
          />
          <div className="absolute inset-0 bg-[#2B211E]/50 radial-gradient(circle, transparent 20%, #2B211E 100%)"></div>
        </div>

        <div className="relative z-10 border-[3px] border-[#D4C5B0] p-2 max-w-lg w-full shadow-2xl">
          <div className="border border-[#D4C5B0] p-12 text-center bg-[#2B211E]/90 backdrop-blur-sm">
            <span className="uppercase tracking-[0.3em] text-[10px] mb-6 block border-b border-[#D4C5B0]/30 pb-4">
              Vol. I — The Beginning
            </span>
            <h1
              className="text-5xl md:text-7xl mb-4 font-normal leading-none text-[#E6DCCF]"
              style={{ fontFamily: theme.fonts.headline }}
            >
              {names}
            </h1>
            <div className="flex justify-center my-6">
              <Feather className="text-[#D4C5B0] opacity-50 rotate-45" />
            </div>
            <p className="text-lg uppercase tracking-widest">{dateFormatted}</p>
            <p className="text-xs italic mt-2 opacity-70">{venueName}</p>
          </div>
        </div>
      </header>

      {/* Chapter I: The Story */}
      <section className="max-w-2xl mx-auto px-8 py-24 text-justify relative z-10">
        <div className="text-center mb-12">
          <h2
            className="text-3xl text-[#5D2E2E] mb-2 font-bold"
            style={{ fontFamily: theme.fonts.headline }}
          >
            Chapter I
          </h2>
          <span className="italic opacity-60">
            In which two scholars find common ground
          </span>
        </div>
        <p className="text-lg leading-loose mb-8 drop-cap">
          <span className="float-left text-6xl pr-2 pt-2 font-bold text-[#D4C5B0]">
            I
          </span>
          {story.startsWith("I") || story.startsWith("It")
            ? story.substring(story.indexOf(" ") + 1)
            : story}
        </p>
      </section>

      {/* Chapter II: The Details */}
      <section className="bg-[#E6DCCF] text-[#2B211E] py-24 px-8 relative z-10 border-y-8 border-[#2B211E] double-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl mb-2 font-bold"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Chapter II
            </h2>
            <span className="italic opacity-70">Logistics & Itinerary</span>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="text-center md:text-right border-r-0 md:border-r border-[#2B211E]/20 pr-0 md:pr-8">
              <BookOpen className="w-8 h-8 mx-auto md:ml-auto md:mr-0 mb-4 text-[#5D2E2E]" />
              <h3 className="font-bold uppercase tracking-widest mb-2">
                The Ceremony
              </h3>
              <p className="text-lg mb-1">
                {scheduleDetails.ceremony.time || "4:00 PM"}
              </p>
              <p className="italic text-sm opacity-80">
                {scheduleDetails.ceremony.location || "Bates Hall Reading Room"}
              </p>
            </div>
            <div className="text-center md:text-left pl-0 md:pl-8">
              <Bookmark className="w-8 h-8 mx-auto md:mr-auto md:ml-0 mb-4 text-[#5D2E2E]" />
              <h3 className="font-bold uppercase tracking-widest mb-2">
                The Reception
              </h3>
              <p className="text-lg mb-1">
                {scheduleDetails.reception.time || "6:00 PM"}
              </p>
              <p className="italic text-sm opacity-80">
                {scheduleDetails.reception.location || "The Courtyard Tea Room"}
              </p>
            </div>
          </div>

          <div className="mt-16 text-center text-sm italic opacity-80 leading-relaxed max-w-lg mx-auto">
            "I cannot fix on the hour, or the spot, or the look or the words,
            which laid the foundation. I was in the middle before I knew that I
            had begun." — Jane Austen
          </div>
        </div>
      </section>

      {/* Epilogue / RSVP */}
      {event.rsvpEnabled && (
        <section className="py-24 px-8 text-center relative z-10">
          <div className="max-w-lg mx-auto border-t border-b border-[#D4C5B0]/30 py-12">
            <h2
              className="text-3xl font-bold mb-8"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Epilogue
            </h2>
            <p className="mb-8 opacity-70">
              Kindly add your name to our guest ledger by {rsvpDeadline}.
            </p>

            <a
              href={rsvpUrl}
              className="group relative inline-block px-8 py-3 bg-transparent overflow-hidden rounded-sm border border-[#D4C5B0] text-[#D4C5B0] transition-colors hover:border-[#5D2E2E]"
            >
              <div className="absolute inset-0 w-0 bg-[#5D2E2E] transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
              <span className="relative group-hover:text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <PenTool size={16} /> Sign the Ledger
              </span>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
