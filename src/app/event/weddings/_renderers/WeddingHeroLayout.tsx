"use client";

import type { ReactNode } from "react";
import EventPageHero from "@/components/events/EventPageHero";
import { useEventPageComposition } from "@/components/events/EventPageCompositionContext";
import { pickTextColor, type EventData, type ThemeConfig } from "./content-sections";

/** Legacy wedding pages retain their body while using the shared hero controls. */
export default function WeddingHeroLayout({
  theme, event, image, description, children,
}: {
  theme: ThemeConfig;
  event: EventData;
  image?: string;
  description?: string;
  children: ReactNode;
}) {
  const artwork = image || event.customHeroImage || event.gallery?.[0]?.url ||
    event.gallery?.[0]?.src || event.gallery?.[0]?.preview || theme.decorations?.heroImage;
  const title = event.headlineTitle || [event.couple?.partner1, event.couple?.partner2].filter(Boolean).join(" & ") || "Your Names";
  const paper = theme.colors.background || theme.colors.primary;
  return (
    <EventPageHero
      artwork={artwork ? <img src={artwork} alt="Wedding event artwork" className="template-hero-image" /> : null}
      copy={<div style={{ fontFamily: theme.fonts.headline }}>
        <h1 className="text-4xl leading-tight sm:text-6xl">{title}</h1>
        {event.date && <p className="mt-5">{event.date}</p>}
        {event.location && <p className="mt-3">{event.location}</p>}
        {event.tagline && <p className="mt-5">{event.tagline}</p>}
        {description && <p className="mt-5 leading-relaxed">{description}</p>}
        {event.rsvpEnabled && <a className="mt-6 inline-flex min-h-11 items-center border border-current px-6 py-3" href={event.rsvpLink || event.rsvp?.url || "#rsvp"}>RSVP</a>}
      </div>}
      style={{ background: paper, color: pickTextColor(paper) }}
    >{children}</EventPageHero>
  );
}

/** Decorative hero art is supplied through the explicit shared artwork slot after a layout choice. */
export function OriginalWeddingHero({ children }: { children: ReactNode }) {
  const hero = useEventPageComposition()?.value?.hero;
  return hero ? null : <>{children}</>;
}
