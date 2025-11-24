// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const SpecialEventsPage = createSimpleCustomizePage({
  slug: "special-event",
  displayName: "Special Event",
  category: "special_events",
  defaultHero:
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "occasion", label: "Occasion", placeholder: "Gala, fundraiser, ceremony" },
    { key: "host", label: "Host / Organization", placeholder: "Envitefy Foundation" },
    { key: "dress", label: "Dress Code", placeholder: "Black tie / cocktail" },
    { key: "schedule", label: "Program / Schedule", placeholder: "Reception, dinner, awards", type: "textarea" },
    { key: "parking", label: "Parking / Arrival", placeholder: "Valet at main entrance" },
    { key: "contact", label: "Contact", placeholder: "events@envitefy.com" },
  ],
  themes: [
    {
      id: "gala_night",
      name: "Gala Night",
      bg: "bg-gradient-to-br from-slate-900 via-neutral-800 to-amber-700",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-900 via-neutral-800 to-amber-700",
    },
    {
      id: "pearl",
      name: "Pearl",
      bg: "bg-gradient-to-br from-white via-slate-50 to-rose-50",
      text: "text-slate-900",
      accent: "text-rose-700",
      preview: "bg-gradient-to-r from-white via-slate-50 to-rose-50",
    },
    {
      id: "aurora",
      name: "Aurora",
      bg: "bg-gradient-to-br from-purple-900 via-indigo-700 to-cyan-500",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-purple-900 via-indigo-700 to-cyan-500",
    },
  ],
});

export default SpecialEventsPage;
