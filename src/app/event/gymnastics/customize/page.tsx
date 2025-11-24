// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const GymnasticsSchedulePage = createSimpleCustomizePage({
  slug: "gymnastics-schedule",
  displayName: "Gymnastics Schedule",
  category: "sport_gymnastics_schedule",
  categoryLabel: "Gymnastics",
  themesExpandedByDefault: true,
  defaultHero:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "team", label: "Team", placeholder: "NIU Gymnastics" },
    { key: "season", label: "Season", placeholder: "2025 Season" },
    { key: "venue", label: "Primary Venue", placeholder: "Main Gym" },
    {
      key: "meets",
      label: "Meets / Events",
      placeholder: "List key meets or invitationals",
      type: "textarea",
    },
    { key: "coach", label: "Coach", placeholder: "Coach Rivera" },
    {
      key: "notes",
      label: "Notes",
      placeholder: "Travel details, attire, arrival time",
    },
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
    {
      id: "champion_gold",
      name: "Champion Gold",
      bg: "bg-gradient-to-br from-yellow-600 via-amber-500 to-orange-500",
      text: "text-white",
      accent: "text-yellow-100",
      preview: "bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500",
    },
    {
      id: "power_purple",
      name: "Power Purple",
      bg: "bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-600",
      text: "text-white",
      accent: "text-pink-200",
      preview: "bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-600",
    },
    {
      id: "electric_cyan",
      name: "Electric Cyan",
      bg: "bg-gradient-to-br from-cyan-900 via-teal-700 to-cyan-400",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-cyan-900 via-teal-700 to-cyan-400",
    },
    {
      id: "fire_red",
      name: "Fire Red",
      bg: "bg-gradient-to-br from-red-900 via-rose-700 to-red-500",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-red-900 via-rose-700 to-red-500",
    },
    {
      id: "neon_green",
      name: "Neon Green",
      bg: "bg-gradient-to-br from-emerald-900 via-green-600 to-lime-400",
      text: "text-white",
      accent: "text-lime-100",
      preview: "bg-gradient-to-r from-emerald-900 via-green-600 to-lime-400",
    },
    {
      id: "midnight_blue",
      name: "Midnight Blue",
      bg: "bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-700",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-700",
    },
    {
      id: "sunset_orange",
      name: "Sunset Orange",
      bg: "bg-gradient-to-br from-orange-900 via-red-600 to-pink-500",
      text: "text-white",
      accent: "text-orange-100",
      preview: "bg-gradient-to-r from-orange-900 via-red-600 to-pink-500",
    },
    {
      id: "vibrant_violet",
      name: "Vibrant Violet",
      bg: "bg-gradient-to-br from-violet-900 via-purple-700 to-fuchsia-600",
      text: "text-white",
      accent: "text-violet-100",
      preview: "bg-gradient-to-r from-violet-900 via-purple-700 to-fuchsia-600",
    },
    {
      id: "titanium_silver",
      name: "Titanium Silver",
      bg: "bg-gradient-to-br from-slate-800 via-gray-700 to-slate-600",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600",
    },
  ],
});

export default GymnasticsSchedulePage;
