import React from "react";
import { Clock, Users, MapPin, Coffee, Gift, ImageIcon } from "lucide-react";
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
          {match[1]}
          <br />
          <span className="text-4xl italic text-[#D4AF37]">&</span>
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
          {names[0]}
          <br />
          <span className="text-4xl italic text-[#D4AF37]">&</span>
          <br />
          {names[1]}
        </>
      );
    }
    return names.join(" & ") || "Katherine & William";
  }
  return (
    <>
      Katherine
      <br />
      <span className="text-4xl italic text-[#D4AF37]">&</span>
      <br />
      William
    </>
  );
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) {
    return {
      dayName: "Saturday",
      day: "The Fifth",
      month: "June",
      year: "Two Thousand Twenty Five",
    };
  }
  try {
    const d = new Date(dateStr);
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
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
    const dayNames = [
      "",
      "First",
      "Second",
      "Third",
      "Fourth",
      "Fifth",
      "Sixth",
      "Seventh",
      "Eighth",
      "Ninth",
      "Tenth",
      "Eleventh",
      "Twelfth",
      "Thirteenth",
      "Fourteenth",
      "Fifteenth",
      "Sixteenth",
      "Seventeenth",
      "Eighteenth",
      "Nineteenth",
      "Twentieth",
      "Twenty-First",
      "Twenty-Second",
      "Twenty-Third",
      "Twenty-Fourth",
      "Twenty-Fifth",
      "Twenty-Sixth",
      "Twenty-Seventh",
      "Twenty-Eighth",
      "Twenty-Ninth",
      "Thirtieth",
      "Thirty-First",
    ];
    const year = d.getFullYear();
    const yearWords = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
      "Twenty",
    ];
    const thousands = Math.floor(year / 1000);
    const hundreds = Math.floor((year % 1000) / 100);
    const tens = Math.floor((year % 100) / 10);
    const ones = year % 10;
    let yearText = "";
    if (thousands > 0) {
      yearText += yearWords[thousands] + " Thousand ";
    }
    if (hundreds > 0) {
      yearText += yearWords[hundreds] + " Hundred ";
    }
    if (tens >= 2) {
      yearText += ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"][tens] + " ";
    }
    if (tens === 1) {
      yearText += yearWords[10 + ones] + " ";
    } else if (ones > 0) {
      yearText += yearWords[ones] + " ";
    }
    yearText = yearText.trim() || "Two Thousand Twenty Five";

    return {
      dayName: weekdays[d.getDay()],
      day: `The ${dayNames[day] || day}`,
      month: months[d.getMonth()],
      year: yearText,
    };
  } catch {
    return {
      dayName: "Saturday",
      day: "The Fifth",
      month: "June",
      year: "Two Thousand Twenty Five",
    };
  }
};

const getScheduleDetails = (schedule?: Array<{ title: string; time?: string; location?: string }>) => {
  const ceremony = schedule?.find((s) =>
    s.title?.toLowerCase().includes("ceremony")
  ) || { title: "Ceremony", time: "5:00 PM", location: "The Grand Ballroom" };
  const reception = schedule?.find((s) =>
    s.title?.toLowerCase().includes("reception")
  ) || { title: "Reception", time: "7:00 PM", location: "The Terrace Room" };

  return { ceremony, reception };
};

export default function GildedWedding({ theme, event }: Props) {
  const names = buildNames(event);
  const dateInfo = formatDate(event.date);
  const location = event.location || event.venue?.name || "The Plaza Hotel • New York";
  const heroImage =
    (event as any)?.customHeroImage ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1600&auto=format&fit=crop";
  const scheduleDetails = getScheduleDetails(event.schedule);
  const rsvpUrl = event.rsvp?.url || "#rsvp";

  return (
    <div
      className="min-h-screen bg-[#FDFBF7] text-[#4A403A] font-serif p-4 md:p-8"
      style={{ fontFamily: theme.fonts.body }}
    >
      {/* Main Card Container */}
      <div className="max-w-5xl mx-auto bg-white min-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col">
        {/* Gold Border Frame */}
        <div className="absolute inset-4 border-2 border-[#D4AF37] pointer-events-none z-10"></div>
        <div className="absolute inset-6 border border-[#D4AF37] pointer-events-none z-10"></div>

        {/* Corner Ornaments (CSS Shapes) */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#D4AF37] z-20"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37] z-20"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37] z-20"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#D4AF37] z-20"></div>

        {/* Hero Background Image */}
        <div className="absolute top-0 left-0 w-full h-[700px] z-0 pointer-events-none">
          <img
            src={heroImage}
            alt="Venue"
            className="w-full h-full object-cover opacity-20 sepia-[.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/10 via-white/50 to-white"></div>
        </div>

        {/* Nav */}
        <nav className="relative z-30 pt-12 pb-8 flex justify-center gap-12 text-[10px] uppercase tracking-[0.3em] text-[#8C7B75]">
          <a href="#ceremony" className="hover:text-[#D4AF37]">
            Ceremony
          </a>
          <a href="#reception" className="hover:text-[#D4AF37]">
            Reception
          </a>
          <a href="#accommodations" className="hover:text-[#D4AF37]">
            Stay
          </a>
        </nav>

        {/* Hero Content */}
        <header className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-16 relative z-30">
          <div className="mb-8 w-px h-16 bg-[#D4AF37]"></div>
          <p className="uppercase tracking-[0.2em] text-xs text-[#8C7B75] mb-6">
            The honour of your presence is requested at the marriage of
          </p>

          <h1
            className="text-6xl md:text-8xl text-[#2C2420] mb-4 font-normal"
            style={{ fontFamily: theme.fonts.headline }}
          >
            {names}
          </h1>

          <div className="flex items-center gap-4 my-8 w-full max-w-xs justify-center">
            <div className="h-px bg-[#D4AF37] flex-1"></div>
            <span className="text-2xl text-[#D4AF37]">❦</span>
            <div className="h-px bg-[#D4AF37] flex-1"></div>
          </div>

          <p className="text-xl uppercase tracking-[0.2em] text-[#2C2420] mb-2">
            {dateInfo.dayName}, {dateInfo.day} of {dateInfo.month}
          </p>
          <p className="text-sm italic text-[#8C7B75]">{dateInfo.year}</p>
          <p className="text-sm uppercase tracking-[0.2em] text-[#2C2420] mt-8">{location}</p>
        </header>

        {/* Info Section */}
        <section
          id="ceremony"
          className="bg-[#F8F5F0] py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20"
        >
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-3xl text-[#2C2420] mb-12"
              style={{ fontFamily: theme.fonts.headline }}
            >
              Wedding Details
            </h2>

            <div className="grid md:grid-cols-2 gap-16 text-left">
              <div id="ceremony">
                <h3 className="uppercase tracking-[0.2em] text-[#D4AF37] text-xs mb-4 border-b border-[#D4AF37]/20 pb-2">
                  The Ceremony
                </h3>
                <p className="text-2xl mb-2">{scheduleDetails.ceremony.time || "5:00 PM"}</p>
                <p className="text-[#8C7B75] italic">
                  {scheduleDetails.ceremony.location || "The Grand Ballroom"}
                </p>
                <p className="text-[#8C7B75] text-sm mt-4 leading-relaxed">
                  Please arrive thirty minutes prior to the start of the ceremony. Black Tie attire
                  is strictly required.
                </p>
              </div>
              <div id="reception">
                <h3 className="uppercase tracking-[0.2em] text-[#D4AF37] text-xs mb-4 border-b border-[#D4AF37]/20 pb-2">
                  The Reception
                </h3>
                <p className="text-2xl mb-2">{scheduleDetails.reception.time || "7:00 PM"}</p>
                <p className="text-[#8C7B75] italic">
                  {scheduleDetails.reception.location || "The Terrace Room"}
                </p>
                <p className="text-[#8C7B75] text-sm mt-4 leading-relaxed">
                  Cocktails, dinner, and dancing to follow immediately after the ceremony.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Full Schedule List */}
        {event.schedule && event.schedule.length > 0 && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-white">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-3xl text-[#2C2420] mb-12"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Complete Schedule
              </h2>
              <div className="space-y-6 text-left">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-[#D4AF37]/30 pl-6 py-4">
                    <h3 className="text-xl text-[#2C2420] mb-2 font-normal">{item.title}</h3>
                    <div className="flex flex-wrap gap-6 text-[#8C7B75] text-sm">
                      {item.time && (
                        <span className="flex items-center gap-2">
                          <Clock size={16} className="text-[#D4AF37]" />
                          {item.time}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-2">
                          <MapPin size={16} className="text-[#D4AF37]" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Story */}
        {event.story && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-[#F8F5F0]">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-3xl text-[#2C2420] mb-8"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Our Story
              </h2>
              <p className="text-[#8C7B75] leading-relaxed text-lg italic">{event.story}</p>
            </div>
          </section>
        )}

        {/* Wedding Party */}
        {event.party && event.party.length > 0 && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-white">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-3xl text-[#2C2420] mb-12"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Wedding Party
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {event.party.map((member, idx) => (
                  <div key={idx} className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-3 text-[#D4AF37]" />
                    <h3 className="text-lg text-[#2C2420] mb-1 font-normal">{member.name}</h3>
                    <p className="text-sm text-[#8C7B75] italic">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {event.gallery && event.gallery.length > 0 && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-[#F8F5F0]">
            <div className="max-w-4xl mx-auto">
              <h2
                className="text-3xl text-[#2C2420] mb-12"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {event.gallery.slice(0, 6).map((img, idx) => {
                  const imageUrl = img.url || img.src || img.preview || img;
                  return (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-[#D4AF37]/20">
                      <img src={imageUrl} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" alt="" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Travel/Accommodations Section */}
        {event.travel && (
          <section
            id="accommodations"
            className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-white"
          >
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-3xl text-[#2C2420] mb-12"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Accommodations
              </h2>
              {typeof event.travel === "string" && event.travel && (
                <p className="text-[#8C7B75] leading-relaxed whitespace-pre-wrap">{event.travel}</p>
              )}
            </div>
          </section>
        )}

        {/* Things To Do */}
        {event.thingsToDo && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-[#F8F5F0]">
            <div className="max-w-3xl mx-auto">
              <Coffee className="w-8 h-8 mx-auto mb-6 text-[#D4AF37]" />
              <h2
                className="text-3xl text-[#2C2420] mb-8"
                style={{ fontFamily: theme.fonts.headline }}
              >
                Things To Do
              </h2>
              <p className="text-[#8C7B75] leading-relaxed text-lg">{event.thingsToDo}</p>
            </div>
          </section>
        )}

        {/* Registry */}
        {event.registry && event.registry.length > 0 && (
          <section className="py-20 px-12 text-center relative z-20 border-y border-[#D4AF37]/20 bg-white">
            <div className="max-w-3xl mx-auto">
              <Gift className="w-10 h-10 mx-auto mb-6 text-[#D4AF37]" />
              <h2
                className="text-3xl text-[#2C2420] mb-8"
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
                    className="border border-[#D4AF37] px-8 py-3 text-[#2C2420] hover:bg-[#D4AF37] hover:text-white transition-colors uppercase tracking-[0.2em] text-xs"
                  >
                    {reg.label || "Registry"}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP Button */}
        {event.rsvpEnabled && (
          <div className="py-16 text-center relative z-30">
            <a
              href={rsvpUrl}
              className="inline-block bg-[#2C2420] text-white px-12 py-4 uppercase tracking-[0.2em] text-xs hover:bg-[#D4AF37] transition-colors duration-500"
            >
              Respond
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
