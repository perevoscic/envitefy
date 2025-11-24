// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const WorkshopClassPage = createSimpleCustomizePage({
  slug: "workshop-class",
  displayName: "Workshop / Class",
  category: "workshop_class",
  categoryLabel: "Workshop / Class",
  defaultHero:
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "instructor", label: "Instructor", placeholder: "Alex Lee" },
    { key: "syllabus", label: "Agenda / Syllabus", placeholder: "Module overview, hands-on lab", type: "textarea" },
    { key: "materials", label: "Materials", placeholder: "Laptop, notebook, bring sample data" },
    { key: "prereqs", label: "Prerequisites", placeholder: "Basic Python, laptop charged" },
    { key: "price", label: "Price", placeholder: "$99 / Free for members" },
    { key: "registration", label: "Registration Link", placeholder: "https://register.example.com" },
  ],
  themes: [
    {
      id: "studio",
      name: "Studio",
      bg: "bg-gradient-to-br from-slate-900 via-indigo-800 to-purple-600",
      text: "text-white",
      accent: "text-indigo-200",
      preview: "bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-600",
    },
    {
      id: "paper",
      name: "Paper",
      bg: "bg-gradient-to-br from-white via-slate-50 to-amber-50",
      text: "text-slate-900",
      accent: "text-amber-600",
      preview: "bg-gradient-to-r from-white via-slate-50 to-amber-50",
    },
    {
      id: "creative_burst",
      name: "Creative Burst",
      bg: "bg-gradient-to-br from-rose-900 via-orange-700 to-yellow-500",
      text: "text-white",
      accent: "text-yellow-100",
      preview: "bg-gradient-to-r from-rose-900 via-orange-700 to-yellow-500",
    },
  ],
});

export default WorkshopClassPage;
