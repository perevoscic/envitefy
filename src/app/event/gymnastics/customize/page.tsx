// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const GymnasticsSchedulePage = createSimpleCustomizePage({
  slug: "gymnastics-schedule",
  displayName: "Gymnastics Schedule",
  category: "sport_events",
  defaultHero:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "team", label: "Team", placeholder: "NIU Gymnastics" },
    { key: "season", label: "Season", placeholder: "2025 Season" },
    { key: "venue", label: "Primary Venue", placeholder: "Main Gym" },
    { key: "meets", label: "Meets / Events", placeholder: "List key meets or invitationals", type: "textarea" },
    { key: "coach", label: "Coach", placeholder: "Coach Rivera" },
    { key: "notes", label: "Notes", placeholder: "Travel details, attire, arrival time" },
  ],
  themes: [
    {
      id: "lilac_ribbon",
      name: "Lilac Ribbon",
      bg: "bg-gradient-to-br from-purple-900 via-fuchsia-700 to-sky-500",
      text: "text-white",
      accent: "text-sky-100",
      preview: "bg-gradient-to-r from-purple-900 via-fuchsia-700 to-sky-500",
    },
    {
      id: "ice_blue",
      name: "Ice Blue",
      bg: "bg-gradient-to-br from-slate-900 via-blue-800 to-cyan-600",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600",
    },
    {
      id: "rose_gold",
      name: "Rose Gold",
      bg: "bg-gradient-to-br from-rose-900 via-amber-600 to-rose-400",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-rose-900 via-amber-600 to-rose-400",
    },
  ],
});

export default GymnasticsSchedulePage;
