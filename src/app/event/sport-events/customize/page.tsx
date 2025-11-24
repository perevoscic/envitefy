// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const SportEventsPage = createSimpleCustomizePage({
  slug: "sport-event",
  displayName: "Sport Event",
  category: "sport_events",
  defaultHero:
    "https://images.unsplash.com/photo-1502877828070-33bc4f1b8a6e?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "opponent", label: "Opponent", placeholder: "vs Central City" },
    { key: "league", label: "League / Division", placeholder: "Conference play" },
    { key: "tickets", label: "Tickets / Link", placeholder: "https://tickets.example.com" },
    { key: "broadcast", label: "Broadcast", placeholder: "ESPN+, Live stream link" },
    { key: "parking", label: "Parking / Arrival", placeholder: "Gate B, Lot C" },
  ],
  themes: [
    {
      id: "stadium_nights",
      name: "Stadium Nights",
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700",
      text: "text-white",
      accent: "text-indigo-200",
      preview: "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700",
    },
    {
      id: "electric_field",
      name: "Electric Field",
      bg: "bg-gradient-to-br from-emerald-900 via-lime-700 to-emerald-500",
      text: "text-white",
      accent: "text-lime-100",
      preview: "bg-gradient-to-r from-emerald-900 via-lime-700 to-emerald-500",
    },
    {
      id: "sunset_court",
      name: "Sunset Court",
      bg: "bg-gradient-to-br from-orange-900 via-amber-700 to-rose-600",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-orange-900 via-amber-700 to-rose-600",
    },
  ],
});

export default SportEventsPage;
