"use client";

import React, { useMemo } from "react";
import EventActions from "@/components/EventActions";
import EventDeleteModal from "@/components/EventDeleteModal";
import EventRsvpPrompt from "@/components/EventRsvpPrompt";
import Link from "next/link";
import { buildEditLink } from "@/utils/event-edit-route";
import { findFirstEmail } from "@/utils/contact";
import { extractFirstPhoneNumber } from "@/utils/phone";
import WeddingRenderer from "@/components/weddings/WeddingRenderer";
import type {
  EventData,
  ThemeConfig,
} from "@/app/event/weddings/_renderers/content-sections";

// Import all template configs
import etherealClassic from "../../templates/weddings/ethereal-classic/config.json" assert { type: "json" };
import modernEditorial from "../../templates/weddings/modern-editorial/config.json" assert { type: "json" };
import rusticBoho from "../../templates/weddings/rustic-boho/config.json" assert { type: "json" };
import cinematicWedding from "../../templates/weddings/cinematic-wedding/config.json" assert { type: "json" };
import celestialWedding from "../../templates/weddings/celestial-wedding/config.json" assert { type: "json" };
import gildedWedding from "../../templates/weddings/gilded-wedding/config.json" assert { type: "json" };
import museumWedding from "../../templates/weddings/museum-wedding/config.json" assert { type: "json" };
import etherealWedding from "../../templates/weddings/ethereal-wedding/config.json" assert { type: "json" };
import noirLuxury from "../../templates/weddings/noir-luxury/config.json" assert { type: "json" };
import retro70s from "../../templates/weddings/retro-70s/config.json" assert { type: "json" };
import newspaperWedding from "../../templates/weddings/newspaper-wedding/config.json" assert { type: "json" };
import bauhausWedding from "../../templates/weddings/bauhaus-wedding/config.json" assert { type: "json" };
import europeCoastalWedding from "../../templates/weddings/europe-coastal-wedding/config.json" assert { type: "json" };
import floridaCoastalWedding from "../../templates/weddings/florida-coastal-wedding/config.json" assert { type: "json" };
import californiaCoastalWedding from "../../templates/weddings/california-coastal-wedding/config.json" assert { type: "json" };
import winterWedding from "../../templates/weddings/winter-wedding/config.json" assert { type: "json" };
import industrialWedding from "../../templates/weddings/industrial-wedding/config.json" assert { type: "json" };
import libraryWedding from "../../templates/weddings/library-wedding/config.json" assert { type: "json" };
import gardenWedding from "../../templates/weddings/garden-wedding/config.json" assert { type: "json" };

const TEMPLATE_CONFIGS: Record<string, any> = {
  "ethereal-classic": etherealClassic,
  "modern-editorial": modernEditorial,
  "rustic-boho": rusticBoho,
  "cinematic-wedding": cinematicWedding,
  "celestial-wedding": celestialWedding,
  "gilded-wedding": gildedWedding,
  "museum-wedding": museumWedding,
  "ethereal-wedding": etherealWedding,
  "noir-luxury": noirLuxury,
  "retro-70s": retro70s,
  "newspaper-wedding": newspaperWedding,
  "bauhaus-wedding": bauhausWedding,
  "europe-coastal-wedding": europeCoastalWedding,
  "florida-coastal-wedding": floridaCoastalWedding,
  "california-coastal-wedding": californiaCoastalWedding,
  "winter-wedding": winterWedding,
  "industrial-wedding": industrialWedding,
  "library-wedding": libraryWedding,
  "garden-wedding": gardenWedding,
};

// Font definitions (matching customize page)
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
    themeId: "garden-wedding",
  };
  // Prioritize theme.themeId from saved data over variationId prop
  const themeId = theme.themeId || variationId || "garden-wedding";

  // Build the template config with saved fonts
  const selectedTemplate = useMemo(() => {
    const fromMap =
      TEMPLATE_CONFIGS[themeId] ||
      TEMPLATE_CONFIGS["garden-wedding"] ||
      gardenWedding;
    const chosenFont = FONTS[theme.font as keyof typeof FONTS];
    const appliedFonts = {
      headline:
        chosenFont?.name ||
        fromMap?.theme?.fonts?.headline ||
        "Playfair Display",
      body: chosenFont?.name || fromMap?.theme?.fonts?.body || "Inter",
    };
    return {
      ...fromMap,
      theme: {
        ...fromMap.theme,
        fonts: appliedFonts,
      },
    };
  }, [themeId, theme.font]);

  // Transform event data to match EventData format (same as preview)
  const event: EventData = useMemo(() => {
    const location =
      weddingData.city && weddingData.state
        ? `${weddingData.city}, ${weddingData.state}`
        : weddingData.location || "";

    // Transform schedule
    const schedule = Array.isArray(weddingData.schedule)
      ? weddingData.schedule.map((item: any) => ({
          title: item.title || "",
          time: item.time || item.date || "",
          location: item.location || "",
        }))
      : [];

    // Transform party
    const party = Array.isArray(weddingData.party)
      ? weddingData.party.map((p: any) => ({
          name: p.name || "",
          role: p.role || "",
        }))
      : Array.isArray(weddingData.weddingParty)
      ? weddingData.weddingParty.map((p: any) => ({
          name: p.name || "",
          role: p.role || "",
        }))
      : [];

    // Transform travel (directions string)
    const travel = weddingData.travel?.directions || "";

    // Transform thingsToDo (join array items)
    const thingsToDo = Array.isArray(weddingData.thingsToDo)
      ? weddingData.thingsToDo
          .map((t: any) => t.title || t.description || "")
          .filter(Boolean)
          .join(" • ")
      : "";

    // Transform gallery
    const gallery = Array.isArray(weddingData.gallery)
      ? weddingData.gallery.map((g: any) => ({
          url: g.url || g.src || g.preview || "",
        }))
      : [];

    // Transform registry
    const registry = Array.isArray(weddingData.registries)
      ? weddingData.registries
          .filter((r: any) => r?.url?.trim())
          .map((r: any) => ({
            label: r.label?.trim() || "Registry",
            url: r.url?.trim(),
          }))
      : [];

    return {
      headlineTitle:
        `${weddingData.partner1 || ""}${
          weddingData.partner2 ? ` & ${weddingData.partner2}` : ""
        }`.trim() || "Your Names",
      couple: {
        partner1: weddingData.partner1 || "",
        partner2: weddingData.partner2 || "",
      },
      date: weddingData.date || "",
      location,
      story:
        weddingData.story ||
        (typeof weddingData.story === "object" ? weddingData.story?.text : ""),
      schedule,
      party,
      travel,
      thingsToDo,
      gallery,
      rsvpEnabled: Boolean(
        weddingData.rsvp?.isEnabled !== false &&
          (weddingData.rsvp || eventData?.rsvp !== undefined)
      ),
      rsvpLink: weddingData.rsvp?.link || "",
      rsvp: {
        url: weddingData.rsvp?.link || "#rsvp",
        deadline: weddingData.rsvp?.deadline || undefined,
      },
      registry,
      customHeroImage: weddingData.customHeroImage || undefined,
      venue: {
        name: location,
        address: weddingData.address || undefined,
      },
    };
  }, [weddingData, eventData]);

  const startISO = weddingData.startISO || null;
  const endISO = weddingData.endISO || null;

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] mx-auto my-4 md:my-8">
        {/* Edit/Delete buttons overlay */}
        {isOwner && !isReadOnly && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Link
              href={buildEditLink(eventId, eventData, eventTitle)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white/90 backdrop-blur-sm text-neutral-800/80 hover:text-neutral-900 hover:bg-white transition-colors rounded-lg shadow-md"
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

        {/* Render the template using WeddingRenderer (same as preview) */}
        <div className="shadow-2xl md:rounded-xl overflow-hidden">
          <WeddingRenderer template={selectedTemplate} event={event} />
        </div>
      </div>

      {/* Event Actions for owner */}
      {isOwner && (
        <div className="max-w-3xl mx-auto px-5 sm:px-10 py-6">
          <EventActions
            shareUrl={shareUrl}
            historyId={eventId}
            event={{
              title: eventTitle,
              start: startISO || undefined,
              end: endISO || undefined,
              location: event.location || "",
              venue: null,
              description: event.story || "",
              timezone: null,
              rsvp: weddingData.rsvp || null,
            }}
          />
        </div>
      )}
    </div>
  );
}
