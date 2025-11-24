// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const FootballPracticePage = createSimpleCustomizePage({
  slug: "football-practice",
  displayName: "Football Practice",
  category: "sport_football_practice",
  categoryLabel: "Football",
  defaultHero:
    "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "team", label: "Team / Squad", placeholder: "Varsity Panthers" },
    { key: "coach", label: "Coach", placeholder: "Coach Martinez" },
    { key: "field", label: "Field", placeholder: "Practice Field A" },
    { key: "focus", label: "Focus / Plan", placeholder: "Red zone reps, conditioning" },
    { key: "equipment", label: "Equipment", placeholder: "Shells, mouthguard, cleats" },
    { key: "contact", label: "Contact", placeholder: "coach@email.com" },
  ],
  themes: [
    {
      id: "gridiron_sunset",
      name: "Gridiron Sunset",
      bg: "bg-gradient-to-br from-slate-900 via-amber-800 to-orange-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-900 via-amber-800 to-orange-500",
    },
    {
      id: "turf_lights",
      name: "Turf Lights",
      bg: "bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-800",
      text: "text-white",
      accent: "text-emerald-200",
      preview: "bg-gradient-to-r from-emerald-900 to-slate-800",
    },
    {
      id: "chalkboard",
      name: "Chalkboard",
      bg: "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600",
      text: "text-white",
      accent: "text-cyan-200",
      preview: "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600",
    },
  ],
});

export default FootballPracticePage;
