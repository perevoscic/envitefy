// @ts-nocheck
"use client";

import { createSimpleCustomizePage } from "@/components/event-customize/createSimpleCustomizePage";

const AppointmentCustomizePage = createSimpleCustomizePage({
  slug: "doctor-appointment",
  displayName: "Doctor Appointment",
  category: "appointments",
  defaultHero:
    "https://images.unsplash.com/photo-1582719478248-54e9f2af4bfb?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "provider", label: "Provider", placeholder: "Dr. Ramirez" },
    { key: "practice", label: "Practice / Clinic", placeholder: "Downtown Family Care" },
    { key: "visitType", label: "Visit Type", placeholder: "Annual checkup" },
    { key: "prep", label: "Preparation", placeholder: "Arrive 15 min early, fasting" },
    { key: "insurance", label: "Insurance / ID", placeholder: "BlueCross #1234567" },
    { key: "notes", label: "Notes", placeholder: "Parking, elevator, suite number" },
  ],
  themes: [
    {
      id: "calm_clinic",
      name: "Calm Clinic",
      bg: "bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-200",
      text: "text-slate-900",
      accent: "text-cyan-700",
      preview: "bg-gradient-to-r from-slate-100 via-cyan-50 to-slate-200",
    },
    {
      id: "sterile_white",
      name: "Sterile White",
      bg: "bg-gradient-to-br from-white via-slate-50 to-blue-50",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-gradient-to-r from-white via-slate-50 to-blue-50",
    },
    {
      id: "deep_care",
      name: "Deep Care",
      bg: "bg-gradient-to-br from-slate-900 via-blue-900 to-sky-700",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700",
    },
  ],
});

export default AppointmentCustomizePage;
