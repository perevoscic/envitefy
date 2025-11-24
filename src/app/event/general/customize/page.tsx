// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const GeneralMeetupPage = createSimpleCustomizePage({
  slug: "general-event",
  displayName: "Meetup / Gathering",
  category: "general_event",
  categoryLabel: "General Event",
  defaultHero:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "host", label: "Host / Organizer", placeholder: "Community Guild" },
    { key: "agenda", label: "Agenda", placeholder: "Networking, lightning talks" },
    { key: "cost", label: "Cost", placeholder: "Free / $10 suggested" },
    { key: "dress", label: "Dress Code", placeholder: "Casual" },
    { key: "parking", label: "Parking / Arrival", placeholder: "Street parking, check-in at lobby" },
    { key: "contact", label: "Contact", placeholder: "organizer@email.com" },
  ],
  themes: [
    {
      id: "civic_blue",
      name: "Civic Blue",
      bg: "bg-gradient-to-br from-slate-900 via-blue-800 to-sky-600",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-slate-900 via-blue-800 to-sky-600",
    },
    {
      id: "urban_warmth",
      name: "Urban Warmth",
      bg: "bg-gradient-to-br from-amber-900 via-amber-700 to-rose-500",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-amber-900 via-amber-700 to-rose-500",
    },
    {
      id: "minimal_air",
      name: "Minimal Air",
      bg: "bg-gradient-to-br from-white via-slate-50 to-slate-100",
      text: "text-slate-900",
      accent: "text-indigo-600",
      preview: "bg-gradient-to-r from-white via-slate-50 to-slate-100",
    },
  ],
});

export default GeneralMeetupPage;
