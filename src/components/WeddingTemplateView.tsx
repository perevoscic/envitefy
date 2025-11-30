"use client";

import React, { useMemo } from "react";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import LocationLink from "@/components/LocationLink";
import EventMap from "@/components/EventMap";
import EventRsvpDashboard from "@/components/EventRsvpDashboard";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import {
  CalendarIconApple,
  CalendarIconGoogle,
  CalendarIconOutlook,
} from "@/components/CalendarIcons";
import { combineVenueAndLocation } from "@/lib/mappers";
import { buildCalendarLinks, ensureEndIso } from "@/utils/calendar-links";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import { cleanRsvpContactLabel } from "@/utils/rsvp";
import Link from "next/link";
import { buildEditLink } from "@/utils/event-edit-route";
import { Plane, Navigation, Bus } from "lucide-react";
import weddingTemplates from "../../templates/weddings/index.json";

// Import constants from the customize page
// We'll need to extract these to a shared file later, but for now we'll duplicate them
const FONTS = {
  playfair: {
    name: "Playfair Display",
    title: '[font-family:var(--font-playfair),_"Times_New_Roman",_serif]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-playfair)",
  },
  montserrat: {
    name: "Montserrat",
    title: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-montserrat)",
  },
  poppins: {
    name: "Poppins",
    title: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]',
    preview: "var(--font-poppins)",
  },
  raleway: {
    name: "Raleway",
    title: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-raleway)",
  },
  geist: {
    name: "Geist Sans",
    title: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]',
    body: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]',
    preview: "var(--font-geist-sans)",
  },
  dancing: {
    name: "Dancing Script",
    title: '[font-family:var(--font-dancing),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-dancing)",
  },
  greatVibes: {
    name: "Great Vibes",
    title: '[font-family:var(--font-great-vibes),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-great-vibes)",
  },
  allura: {
    name: "Allura",
    title: '[font-family:var(--font-allura),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-allura)",
  },
  parisienne: {
    name: "Parisienne",
    title: '[font-family:var(--font-parisienne),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-parisienne)",
  },
};

const FONT_SIZES = {
  small: {
    h1: "text-2xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    body: "text-sm",
    nav: "text-xs",
  },
  medium: {
    h1: "text-3xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    body: "text-base",
    nav: "text-sm",
  },
  large: {
    h1: "text-4xl md:text-6xl",
    h2: "text-4xl md:text-5xl",
    body: "text-lg",
    nav: "text-base",
  },
};

const DESIGN_THEMES = [
  {
    id: "blush_peony_arch",
    name: "Blush Peony Arch",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#f9ecec]",
    text: "text-[#6f4b57]",
    accent: "text-[#e5b3c2]",
    previewColor: "bg-[#f9ecec]",
  },
  {
    id: "sage_eucalyptus_sweep",
    name: "Sage Eucalyptus Sweep",
    category: "Pastel",
    graphicType: "leaves-drape",
    bg: "bg-[#dfe7df]",
    text: "text-[#2f3f34]",
    accent: "text-[#9fb4a4]",
    previewColor: "bg-[#dfe7df]",
  },
  {
    id: "ivory_gold_crest",
    name: "Ivory Gold Crest",
    category: "Classic",
    graphicType: "frame-double",
    bg: "bg-[#fbf7f0]",
    text: "text-[#4b3b24]",
    accent: "text-[#c9b68a]",
    previewColor: "bg-[#fbf7f0]",
  },
  {
    id: "navy_rose_gold_frame",
    name: "Navy Rose-Gold Frame",
    category: "Modern",
    graphicType: "geometric",
    bg: "bg-[#0c1a32]",
    text: "text-white drop-shadow-md",
    accent: "text-[#d6a6a0]",
    previewColor: "bg-[#0c1a32]",
  },
];

// Simplified ThemeGraphics - we'll need to import the full version later
const ThemeGraphics = ({ themeId }: { themeId: string }) => {
  // This is a placeholder - we need the full ThemeGraphics component
  return null;
};

// Decorative divider component - different styles per theme
const DecorativeDivider = ({ themeId }: { themeId: string }) => {
  const getDividerStyle = () => {
    const dividers: Record<string, React.ReactElement> = {
      blush_peony_arch: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M195 15 L200 20 L195 25 M205 15 L200 20 L205 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M195 18 L200 20 L195 22 M205 18 L200 20 L205 22"
            stroke="currentColor"
            strokeWidth="1"
            fill="currentColor"
          />
        </svg>
      ),
      sage_eucalyptus_sweep: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      ivory_gold_crest: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="380" cy="20" r="3" fill="currentColor" />
          <circle
            cx="200"
            cy="20"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
      dusty_blue_horizon: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M15 20 L20 15 M15 20 L20 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M385 20 L380 15 M385 20 L380 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="200" cy="20" r="3" fill="currentColor" />
        </svg>
      ),
      champagne_linen_frame: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
          <circle cx="200" cy="20" r="2" fill="currentColor" />
        </svg>
      ),
      lavender_garden_halo: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="200" cy="20" r="4" fill="currentColor" />
        </svg>
      ),
      rosewater_filigree: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M15 20 L20 15 L20 25 M385 20 L380 15 L380 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      botanical_vellum_veil: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q100 15, 200 20 T380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" />
          <circle cx="380" cy="20" r="2.5" fill="currentColor" />
          <circle cx="200" cy="20" r="2.5" fill="currentColor" />
        </svg>
      ),
      peony_ranunculus_corners: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M195 15 L200 20 L195 25 M205 15 L200 20 L205 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ),
      bluebells_wash: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <path
            d="M195 20 L200 15 L205 20 L200 25 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      ),
      minimal_gold_geometry: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M15 20 L20 15 M15 20 L20 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M385 20 L380 15 M385 20 L380 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      sage_botanical_shadow: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
          <circle cx="380" cy="20" r="2" fill="currentColor" />
          <circle cx="200" cy="20" r="3" fill="currentColor" />
        </svg>
      ),
      pearl_dust_elegance: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="380" cy="20" r="3" fill="currentColor" />
          <circle
            cx="200"
            cy="20"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="200" cy="20" r="1.5" fill="currentColor" />
        </svg>
      ),
      rose_gold_floral_ribbon: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M195 15 L200 20 L195 25 M205 15 L200 20 L205 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M195 18 L200 20 L195 22 M205 18 L200 20 L205 22"
            stroke="currentColor"
            strokeWidth="1"
            fill="currentColor"
          />
        </svg>
      ),
      linen_wildflower_set: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <circle cx="200" cy="20" r="3" fill="currentColor" />
        </svg>
      ),
      emerald_garden_crest: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
          <circle cx="200" cy="20" r="2" fill="currentColor" />
        </svg>
      ),
      terracotta_grove: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" />
          <circle cx="380" cy="20" r="2.5" fill="currentColor" />
          <circle cx="200" cy="20" r="3.5" fill="currentColor" />
        </svg>
      ),
      fig_plum_velvet: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q100 15, 200 20 T380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M15 20 L20 15 M15 20 L20 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M385 20 L380 15 M385 20 L380 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      navy_rose_gold_frame: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q100 15, 200 20 T380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M15 20 L20 15 M15 20 L20 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M385 20 L380 15 M385 20 L380 25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      champagne_pampas_halo: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="20" cy="20" r="3" fill="currentColor" />
          <circle cx="380" cy="20" r="3" fill="currentColor" />
          <circle
            cx="200"
            cy="20"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="200" cy="20" r="2" fill="currentColor" />
        </svg>
      ),
      olive_branch_horizon: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M195 15 L200 20 L195 25 M205 15 L200 20 L205 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="200" cy="20" r="2" fill="currentColor" />
        </svg>
      ),
      blue_porcelain_bloom: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <circle cx="200" cy="20" r="4" fill="currentColor" />
        </svg>
      ),
      pampas_blush_horizon: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="20" cy="20" r="2.5" fill="currentColor" />
          <circle cx="380" cy="20" r="2.5" fill="currentColor" />
          <circle cx="200" cy="20" r="3" fill="currentColor" />
        </svg>
      ),
      eucalyptus_crest_emblem: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <line
            x1="20"
            y1="20"
            x2="380"
            y2="20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M15 20 L20 15 L25 20 L20 25 Z" fill="currentColor" />
          <path d="M375 20 L380 15 L385 20 L380 25 Z" fill="currentColor" />
          <path d="M195 20 L200 15 L205 20 L200 25 Z" fill="currentColor" />
        </svg>
      ),
      ranunculus_ribbon: (
        <svg
          width="100%"
          height="40"
          viewBox="0 0 400 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M20 20 Q200 10, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M20 20 Q200 30, 380 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M195 15 L200 20 L195 25 M205 15 L200 20 L205 25"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ),
    };

    return dividers[themeId] || dividers["blush_peony_arch"];
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-md">{getDividerStyle()}</div>
    </div>
  );
};

type Props = {
  eventId: string;
  eventData: any;
  eventTitle: string;
  templateId: string;
  variationId: string;
  isOwner: boolean;
  isReadOnly: boolean;
  viewerKind: "owner" | "guest" | "readonly";
  shareUrl: string;
  sessionEmail: string | null;
};

export default function WeddingTemplateView({
  eventId,
  eventData,
  eventTitle,
  templateId,
  variationId,
  isOwner,
  isReadOnly,
  viewerKind,
  shareUrl,
  sessionEmail,
}: Props) {
  const weddingData = eventData || {};
  const theme = weddingData.theme || {
    font: "playfair",
    fontSize: "medium",
    themeId: "blush_peony_arch",
  };
  // Prioritize theme.themeId from saved data over variationId prop
  const themeId = theme.themeId || variationId || "blush_peony_arch";
  const currentTheme =
    DESIGN_THEMES.find((t) => t.id === themeId) || DESIGN_THEMES[0];
  const currentFont = FONTS[theme.font as keyof typeof FONTS] || FONTS.playfair;
  const currentSize =
    FONT_SIZES[theme.fontSize as keyof typeof FONT_SIZES] || FONT_SIZES.medium;

  const templateMeta = useMemo(() => {
    if (!templateId) return null;
    return (weddingTemplates as any[]).find((t) => t.id === templateId) || null;
  }, [templateId]);

  const heroImageSrc =
    (weddingData as any)?.customHeroImage ||
    (templateMeta as any)?.heroImage ||
    "/templates/wedding-placeholders/ivory-ink-hero.jpeg";

  // Detect dark background for title color
  const isDarkBackground = useMemo(() => {
    const bg = currentTheme?.bg?.toLowerCase() ?? "";
    const darkTokens = [
      "black",
      "slate-9",
      "stone-9",
      "neutral-9",
      "gray-9",
      "grey-9",
      "indigo-9",
      "purple-9",
      "violet-9",
      "emerald-9",
      "teal-9",
      "blue-9",
      "navy",
      "midnight",
    ];
    const hasDarkToken = darkTokens.some((token) => bg.includes(token));
    const hasDarkHex =
      /#0[0-9a-f]{5,}/i.test(bg) ||
      /#1[0-3][0-9a-f]{4}/i.test(bg) ||
      /#2[0-3][0-9a-f]{4}/i.test(bg);
    return hasDarkToken || hasDarkHex;
  }, [currentTheme]);

  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;

  const partner1 = weddingData.partner1 || "";
  const partner2 = weddingData.partner2 || "";
  const date = weddingData.date;
  const time = weddingData.time;
  const city = weddingData.city || "";
  const state = weddingData.state || "";
  const story = weddingData.story || weddingData.story?.text || "";
  const schedule = Array.isArray(weddingData.schedule)
    ? weddingData.schedule
    : [];
  const weddingParty = Array.isArray(weddingData.party)
    ? weddingData.party
    : Array.isArray(weddingData.weddingParty)
    ? weddingData.weddingParty
    : [];
  const gallery = Array.isArray(weddingData.gallery) ? weddingData.gallery : [];
  const thingsToDo = Array.isArray(weddingData.thingsToDo)
    ? weddingData.thingsToDo
    : [];
  const travel = weddingData.travel || {};
  const registries = Array.isArray(weddingData.registries)
    ? weddingData.registries
    : [];

  const parseTimeValue = (value?: string | null) => {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const match = value
      .trim()
      .toLowerCase()
      .match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const meridiem = match[3];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const sortedSchedule = useMemo(() => {
    return [...schedule].sort(
      (a, b) => parseTimeValue(a?.time) - parseTimeValue(b?.time)
    );
  }, [schedule]);

  const startISO = weddingData.startISO || null;
  const endISO = weddingData.endISO || null;
  const location = city && state ? `${city}, ${state}` : undefined;
  const address = weddingData.address || "";
  const hasTravelSection =
    (travel.hotels?.length ?? 0) > 0 ||
    (travel.airports?.length ?? 0) > 0 ||
    Boolean(travel.directions) ||
    Boolean(travel.shuttle);

  const navigationItems = useMemo(
    () =>
      [
        { id: "home", label: "Home", enabled: true },
        {
          id: "schedule",
          label: "Schedule",
          enabled: sortedSchedule.length > 0,
        },
        { id: "our-story", label: "Our Story", enabled: Boolean(story) },
        {
          id: "wedding-party",
          label: "Wedding Party",
          enabled: weddingParty.length > 0,
        },
        { id: "photos", label: "Photos", enabled: gallery.length > 0 },
        {
          id: "things-to-do",
          label: "Things To Do",
          enabled: thingsToDo.length > 0,
        },
        { id: "travel", label: "Travel", enabled: hasTravelSection },
        { id: "location", label: "Location", enabled: Boolean(location) },
        { id: "rsvp", label: "RSVP", enabled: true },
        { id: "registry", label: "Registry", enabled: registries.length > 0 },
      ].filter((item) => item.enabled),
    [
      gallery.length,
      hasTravelSection,
      location,
      registries.length,
      sortedSchedule.length,
      story,
      thingsToDo.length,
      weddingParty.length,
    ]
  );

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] mx-auto my-4 md:my-8">
        <div
          className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${
            currentTheme.bg || "bg-white"
          } ${currentFont.body} transition-colors duration-500 relative z-0`}
        >
          <ThemeGraphics themeId={currentTheme.id} />

          {weddingData.headlineBg && (
            <div
              className="absolute inset-0 opacity-30 pointer-events-none z-0 bg-repeat"
              style={{
                backgroundImage: `url(${weddingData.headlineBg})`,
                backgroundSize: "300px",
              }}
            ></div>
          )}

          <div className="relative z-10">
            <div
              className={`p-6 md:p-8 border-b border-white/10 flex justify-between items-start ${currentTheme.text}`}
            >
              <div className="flex-1">
                <h1
                  className={`${currentSize.h1} mb-2 leading-tight`}
                  style={{
                    ...titleColor,
                    fontFamily: currentFont.preview,
                  }}
                >
                  {partner1} & {partner2}
                </h1>
                <div
                  className={`flex items-center gap-4 ${currentSize.body} font-medium opacity-90 ${currentFont.body} tracking-wide`}
                >
                  {date && (
                    <>
                      <span>
                        {new Date(date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    </>
                  )}
                  {time && <span>{time}</span>}
                  {location && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                      <span>{location}</span>
                    </>
                  )}
                </div>
                {address && (
                  <div
                    className={`${currentSize.body} font-medium opacity-80 ${currentFont.body} mt-1`}
                  >
                    {address}
                  </div>
                )}
              </div>
              {isOwner && !isReadOnly && (
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={buildEditLink(eventId, eventData, eventTitle)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-800/80 hover:text-neutral-900 hover:bg-black/5 transition-colors"
                    title="Edit event"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                  <EventDeleteModal eventId={eventId} eventTitle={eventTitle} />
                </div>
              )}
            </div>

            <nav
              className={`px-6 md:px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 ${currentSize.nav} uppercase tracking-widest font-semibold border-b border-white/5 ${currentTheme.accent} ${currentFont.title}`}
            >
              {navigationItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="hover:underline decoration-2 underline-offset-4 opacity-90 hover:opacity-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div id="home" className="relative h-[400px] md:h-[500px] w-full">
              <img
                src={heroImageSrc}
                alt="Couple"
                className="w-full h-full object-cover opacity-90"
              />
              <div
                className={`absolute bottom-0 left-0 w-full h-32 ${
                  currentTheme.text.includes("slate-900") ||
                  currentTheme.text.includes("black")
                    ? "bg-gradient-to-t from-white/90 to-transparent"
                    : currentTheme.id === "navy_rose_gold_frame"
                    ? "bg-gradient-to-t from-[#0f172a]/90 to-transparent"
                    : "bg-gradient-to-t from-black/70 to-transparent"
                }`}
              ></div>
            </div>

            <div className={`p-8 md:p-16 space-y-24 ${currentTheme.text}`}>
              {sortedSchedule.length > 0 && (
                <section id="schedule" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Schedule of Events
                  </h2>
                  <div className="relative space-y-8 md:space-y-12 max-w-4xl mx-auto">
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-current/30 pointer-events-none hidden md:block"></div>
                    {sortedSchedule.map((event: any, index: number) => {
                      const isLeft = index % 2 === 0;
                      return (
                        <div
                          key={event.id ?? index}
                          className="relative flex flex-col md:flex-row items-center gap-4 md:gap-6 min-h-[80px]"
                        >
                          {/* Timeline Circle - Absolutely positioned at center */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex-shrink-0">
                            <div className="w-3 h-3 rounded-full bg-current border-2 border-white shadow-lg"></div>
                          </div>

                          {/* Event Content */}
                          <div
                            className={`flex-1 flex flex-col w-full md:w-auto ${
                              isLeft
                                ? "text-center md:text-right md:items-end md:pr-8"
                                : "text-center md:text-left md:items-start md:pl-8 md:order-3"
                            }`}
                          >
                            <div className="w-full max-w-md mx-auto md:mx-0">
                              <h3
                                className={`text-2xl md:text-3xl font-bold mb-2 ${currentFont.title}`}
                              >
                                {event.title}
                              </h3>
                              {event.location && (
                                <p className="opacity-70 text-base mb-2 font-medium">
                                  {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="opacity-80 leading-relaxed text-base">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Time Bubble */}
                          <div
                            className={`flex-1 flex w-full md:w-auto ${
                              isLeft
                                ? "justify-center md:justify-start md:pl-8 md:order-3"
                                : "justify-center md:justify-end md:pr-8"
                            }`}
                          >
                            {event.time && (
                              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border border-current/30 bg-white/90 backdrop-blur-sm shadow-sm">
                                {event.time}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {sortedSchedule.length > 0 && story && (
                <DecorativeDivider themeId={currentTheme.id} />
              )}

              {story && (
                <section
                  id="our-story"
                  className="max-w-2xl mx-auto text-center"
                >
                  <h2
                    className={`${currentSize.h2} mb-8 ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Our Story
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 ${currentFont.body} whitespace-pre-wrap`}
                  >
                    {story}
                  </p>
                </section>
              )}

              {story && weddingParty.length > 0 && (
                <DecorativeDivider themeId={currentTheme.id} />
              )}

              {weddingParty.length > 0 && (
                <section id="wedding-party" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Wedding Party
                  </h2>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {partner1}'s Side
                      </h3>
                      {weddingParty
                        .filter((m: any) => m.side === "partner1")
                        .map((member: any) => (
                          <div key={member.id} className="group">
                            <div
                              className={`font-semibold ${currentSize.body} mb-1 ${currentFont.body}`}
                            >
                              {member.name}
                            </div>
                            <div
                              className={`text-sm uppercase tracking-wider opacity-60 ${currentTheme.accent}`}
                            >
                              {member.role}
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {partner2}'s Side
                      </h3>
                      {weddingParty
                        .filter((m: any) => m.side === "partner2")
                        .map((member: any) => (
                          <div key={member.id} className="group">
                            <div
                              className={`font-semibold ${currentSize.body} mb-1 ${currentFont.body}`}
                            >
                              {member.name}
                            </div>
                            <div
                              className={`text-sm uppercase tracking-wider opacity-60 ${currentTheme.accent}`}
                            >
                              {member.role}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              )}

              {weddingParty.length > 0 && gallery.length > 0 && (
                <DecorativeDivider themeId={currentTheme.id} />
              )}

              {gallery.length > 0 && (
                <section id="photos" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Photos
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((img: any) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-white/10"
                      >
                        <img
                          src={img.url}
                          alt="Wedding gallery"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {gallery.length > 0 && thingsToDo.length > 0 && (
                <DecorativeDivider themeId={currentTheme.id} />
              )}

              {thingsToDo.length > 0 && (
                <section id="things-to-do" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Things To Do
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {thingsToDo.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-white/5 p-6 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div
                          className={`text-xs font-bold uppercase tracking-wider mb-2 opacity-70 ${currentTheme.accent}`}
                        >
                          {item.category}
                        </div>
                        <h3 className={`text-xl font-semibold mb-2`}>
                          {item.title}
                        </h3>
                        <p className="opacity-80 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {thingsToDo.length > 0 &&
                (travel.hotels?.length > 0 ||
                  travel.airports?.length > 0 ||
                  travel.directions ||
                  travel.shuttle) && (
                  <DecorativeDivider themeId={currentTheme.id} />
                )}

              {(travel.hotels?.length > 0 ||
                travel.airports?.length > 0 ||
                travel.directions ||
                travel.shuttle) && (
                <section id="travel" className="max-w-3xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-10 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Travel & Stay
                  </h2>
                  {travel.hotels?.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-center uppercase tracking-widest text-sm font-bold opacity-70 mb-6">
                        Where to Stay
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {travel.hotels.map((hotel: any) => (
                          <div
                            key={hotel.id}
                            className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-white/30 transition-colors text-left"
                          >
                            <h4
                              className={`text-xl font-semibold mb-2 ${currentTheme.text}`}
                            >
                              {hotel.name}
                            </h4>
                            <p className="text-sm opacity-70 mb-4">
                              {hotel.address}
                            </p>
                            {hotel.deadline && (
                              <div className="inline-block bg-white/10 text-xs px-2 py-1 rounded mb-4">
                                Book by{" "}
                                {new Date(hotel.deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8">
                    {travel.airports?.length > 0 && (
                      <div className="text-left">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20">
                          Flying In
                        </h3>
                        <ul className="space-y-4">
                          {travel.airports.map((airport: any) => (
                            <li
                              key={airport.id}
                              className="flex items-start gap-3"
                            >
                              <Plane
                                size={20}
                                className={`mt-1 opacity-80 ${currentTheme.accent}`}
                              />
                              <div>
                                <div className="font-bold">
                                  {airport.code}{" "}
                                  <span className="font-normal opacity-70">
                                    - {airport.name}
                                  </span>
                                </div>
                                <div className="text-sm opacity-60">
                                  {airport.distance}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {travel.directions && (
                      <div className="text-left">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20">
                          Getting There
                        </h3>
                        <div className="flex items-start gap-3">
                          <Navigation
                            size={20}
                            className={`mt-1 opacity-80 ${currentTheme.accent}`}
                          />
                          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                            {travel.directions}
                          </p>
                        </div>
                      </div>
                    )}

                    {travel.shuttle && (
                      <div className="text-left col-span-2 border-t border-white/10 pt-6 mt-6">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20 flex items-center gap-2">
                          <Bus size={16} /> Shuttle Service
                        </h3>
                        <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                          {travel.shuttle}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(travel.hotels?.length > 0 ||
                travel.airports?.length > 0 ||
                travel.directions ||
                travel.shuttle) &&
                location && <DecorativeDivider themeId={currentTheme.id} />}

              {location && (
                <section id="location" className="max-w-4xl mx-auto">
                  <h2
                    className={`${currentSize.h2} mb-8 text-center ${currentFont.title} ${currentTheme.accent}`}
                    style={titleColor}
                  >
                    Location
                  </h2>
                  <div className="space-y-4">
                    <LocationLink location={location} />
                    <EventMap location={location} />
                  </div>
                </section>
              )}

              {location && <DecorativeDivider themeId={currentTheme.id} />}

              <section id="rsvp" className="max-w-xl mx-auto text-center">
                <h2
                  className={`${currentSize.h2} mb-6 ${currentFont.title} ${currentTheme.accent}`}
                  style={titleColor}
                >
                  RSVP
                </h2>
                {eventData?.rsvp !== undefined ? (
                  <EventRsvpPrompt
                    eventId={eventId}
                    rsvpName={findFirstEmail(eventData) || null}
                    rsvpPhone={extractFirstPhoneNumber(eventData) || null}
                    rsvpEmail={findFirstEmail(eventData) || null}
                    eventTitle={eventTitle}
                    shareUrl={shareUrl}
                  />
                ) : (
                  <div className="p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                    <p className="italic opacity-50">
                      RSVP is currently closed.
                    </p>
                  </div>
                )}
              </section>

              {registries.length > 0 && (
                <section
                  id="registry"
                  className="text-center py-5 border-t border-white/10 mb-5"
                >
                  <h2
                    className={`text-2xl mb-4 ${currentFont.title} opacity-80`}
                  >
                    Registry
                  </h2>
                  <div className="flex flex-wrap justify-center gap-4">
                    {registries.map((registry: any, idx: number) => (
                      <a
                        key={idx}
                        href={registry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-3 bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <span className="uppercase tracking-widest text-sm font-semibold opacity-80">
                          {registry.label || "Registry"}
                        </span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              <footer className="text-center py-8 border-t border-white/10 mt-1">
                <p className="text-sm opacity-60">
                  Powered by{" "}
                  <span className="font-semibold opacity-80">Envitefy</span>.
                  Create. Share. Enjoy
                </p>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="max-w-3xl mx-auto px-5 sm:px-10 py-6">
          <EventActions
            shareUrl={shareUrl}
            historyId={eventId}
            event={{
              title: eventTitle,
              start: startISO || undefined,
              end: endISO || undefined,
              location: location || "",
              venue: null,
              description: story || "",
              timezone: null,
              rsvp: weddingData.rsvp || null,
            }}
          />
        </div>
      )}
    </div>
  );
}
