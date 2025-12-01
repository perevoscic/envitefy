import React from "react";
import { Camera } from "lucide-react";
import { EventData, ThemeConfig } from "./content-sections";

type Props = {
  theme: ThemeConfig;
  event: EventData;
};

const buildNames = (event: EventData) => {
  if (event.headlineTitle) return event.headlineTitle;
  const { partner1, partner2 } = event.couple || {};
  if (partner1 || partner2) {
    return [partner1, partner2].filter(Boolean).join(" & ") || "Your Names";
  }
  return "Your Names";
};

const firstImage = (event: EventData, fallback?: string) =>
  event.photos?.[0] ||
  event.gallery?.[0]?.url ||
  event.travel ||
  event.story ||
  fallback ||
  "/templates/wedding-placeholders/midnight-bloom-hero.jpeg";

export default function NewspaperWedding({ theme, event }: Props) {
  const coupleNames = buildNames(event);
  const weddingDate = event.date || event.when || "July 21, 2025";
  const venueName = event.venue?.name || event.location || "City Hall";
  const details = event.schedule?.length
    ? event.schedule.slice(0, 3)
    : [
        { title: "Ceremony", time: "4:00 PM", location: venueName },
        { title: "Reception", time: "6:00 PM", location: "Reception Hall" },
      ];

  const heroImage =
    event.photos?.[0] ||
    event.gallery?.[0]?.url ||
    theme.decorations?.heroImage ||
    "/templates/wedding-placeholders/midnight-bloom-hero.jpeg";

  return (
    <div
      className="min-h-screen bg-[#f4f4f4] text-black font-serif p-4 md:p-8 flex items-center justify-center"
      style={{ fontFamily: theme.fonts.body }}
    >
      <div className="max-w-4xl w-full mx-auto bg-white p-6 md:p-12 shadow-xl border border-neutral-200">
        <header className="border-b-4 border-black pb-4 mb-4 text-center">
          <div className="flex justify-between items-center border-b border-black pb-2 mb-2 text-xs uppercase font-sans font-bold tracking-[0.18em]">
            <span>Vol. 1</span>
            <span>The Daily Union</span>
            <span>Free Copy</span>
          </div>
          <h1
            className="text-5xl md:text-7xl font-black uppercase tracking-tighter"
            style={{ fontFamily: theme.fonts.headline }}
          >
            The Gazette
          </h1>
        </header>

        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <h2 className="text-3xl md:text-5xl font-bold leading-none mb-4 uppercase tracking-tight">
              EXTRA! EXTRA! {coupleNames} MAKE IT OFFICIAL
            </h2>
            <div className="h-64 bg-neutral-100 mb-4 grayscale flex items-center justify-center border border-neutral-300 overflow-hidden">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={coupleNames}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-12 h-12 opacity-20" />
              )}
            </div>
            <p className="text-justify leading-snug text-sm md:text-base">
              <span className="text-4xl float-left mr-2 font-bold">
                {event.story ? event.story[0] : "I"}
              </span>
              {event.story
                ? event.story.slice(1)
                : `n a stunning turn of events, ${coupleNames} have announced their intention to wed this coming ${weddingDate}. Sources close to the couple say the ceremony will be delightful and full of cake. Citizens are advised to save the date immediately.`}
            </p>
          </div>
          <div className="md:col-span-4 border-l border-black pl-8 flex flex-col gap-8">
            <div className="border-b border-black pb-8">
              <h3 className="font-bold uppercase text-xl mb-2">Weather</h3>
              <p className="text-sm">
                Sunny with a 100% chance of champagne showers.
              </p>
            </div>
            <div>
              <h3 className="font-bold uppercase text-xl mb-2">Details</h3>
              <ul className="text-sm list-disc pl-4 space-y-2">
                <li>{weddingDate}</li>
                <li>{venueName}</li>
                {details.map((d, idx) => (
                  <li key={idx}>
                    {d.title}
                    {d.time ? ` — ${d.time}` : ""}
                    {d.location ? ` (${d.location})` : ""}
                  </li>
                ))}
              </ul>
            </div>
            {event.rsvp?.url && (
              <div className="border-t border-black pt-6">
                <a
                  href={event.rsvp.url}
                  className="block text-center font-bold uppercase tracking-wide border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
                >
                  RSVP Online
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
