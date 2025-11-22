// @ts-nocheck
"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Heart,
  MapPin,
  Users,
  Image as ImageIcon,
  Type,
  Palette,
  CheckSquare,
  Gift,
  Coffee,
  Upload,
  Trash2,
  Plane,
  Navigation,
  Building,
  Star,
  Check,
  X as XIcon,
  Calendar as CalendarIcon,
  Clock,
  Bus,
  Menu,
} from "lucide-react";

// --- Constants & Data ---

const FONTS = {
  playfair: { name: "Playfair Display", title: '[font-family:var(--font-playfair),_"Times_New_Roman",_serif]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-playfair)" },
  montserrat: { name: "Montserrat", title: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]', body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]', preview: "var(--font-montserrat)" },
  poppins: { name: "Poppins", title: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]', body: '[font-family:var(--font-poppins),_"Helvetica",_sans-serif]', preview: "var(--font-poppins)" },
  raleway: { name: "Raleway", title: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-raleway)" },
  geist: { name: "Geist Sans", title: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]', body: '[font-family:var(--font-geist-sans),_"Helvetica",_sans-serif]', preview: "var(--font-geist-sans)" },
  dancing: { name: "Dancing Script", title: '[font-family:var(--font-dancing),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]', preview: "var(--font-dancing)" },
  pacifico: { name: "Pacifico", title: '[font-family:var(--font-pacifico),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-pacifico)" },
  greatVibes: { name: "Great Vibes", title: '[font-family:var(--font-great-vibes),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-great-vibes)" },
  allura: { name: "Allura", title: '[font-family:var(--font-allura),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]', preview: "var(--font-allura)" },
  parisienne: { name: "Parisienne", title: '[font-family:var(--font-parisienne),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-parisienne)" },
  alexBrush: { name: "Alex Brush", title: '[font-family:var(--font-alex-brush),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-alex-brush)" },
  amita: { name: "Amita", title: '[font-family:var(--font-amita),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]', preview: "var(--font-amita)" },
  arizonia: { name: "Arizonia", title: '[font-family:var(--font-arizonia),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-arizonia)" },
  bilbo: { name: "Bilbo Swash Caps", title: '[font-family:var(--font-bilbo-swash-caps),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-bilbo-swash-caps)" },
  cookie: { name: "Cookie", title: '[font-family:var(--font-cookie),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-cookie)" },
  courgette: { name: "Courgette", title: '[font-family:var(--font-courgette),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-courgette)" },
  euphoria: { name: "Euphoria Script", title: '[font-family:var(--font-euphoria-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-euphoria-script)" },
  herrVon: { name: "Herr Von Muellerhoff", title: '[font-family:var(--font-herr-von-muellerhoff),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-herr-von-muellerhoff)" },
  indieFlower: { name: "Indie Flower", title: '[font-family:var(--font-indie-flower),_"Comic_Sans_MS",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-indie-flower)" },
  italianno: { name: "Italianno", title: '[font-family:var(--font-italianno),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-italianno)" },
  kaushan: { name: "Kaushan Script", title: '[font-family:var(--font-kaushan-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-kaushan-script)" },
  kalam: { name: "Kalam", title: '[font-family:var(--font-kalam),_"Comic_Sans_MS",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-kalam)" },
  laBelleAurore: { name: "La Belle Aurore", title: '[font-family:var(--font-la-belle-aurore),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-la-belle-aurore)" },
  marckScript: { name: "Marck Script", title: '[font-family:var(--font-marck-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-marck-script)" },
  meieScript: { name: "Meie Script", title: '[font-family:var(--font-meie-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-meie-script)" },
  meddon: { name: "Meddon", title: '[font-family:var(--font-meddon),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-meddon)" },
  monsieur: { name: "Monsieur La Doulaise", title: '[font-family:var(--font-monsieur-la-doulaise),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-monsieur-la-doulaise)" },
  mrDeHaviland: { name: "Mr De Haviland", title: '[font-family:var(--font-mr-de-haviland),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-mr-de-haviland)" },
  mrsSaint: { name: "Mrs Saint Delafield", title: '[font-family:var(--font-mrs-saint-delafield),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-mrs-saint-delafield)" },
  mySoul: { name: "My Soul", title: '[font-family:var(--font-my-soul),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-my-soul)" },
  niconne: { name: "Niconne", title: '[font-family:var(--font-niconne),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-niconne)" },
  pinyon: { name: "Pinyon Script", title: '[font-family:var(--font-pinyon-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-pinyon-script)" },
  petitFormal: { name: "Petit Formal", title: '[font-family:var(--font-petit-formal-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-petit-formal-script)" },
  redressed: { name: "Redressed", title: '[font-family:var(--font-redressed),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-redressed)" },
  rouge: { name: "Rouge Script", title: '[font-family:var(--font-rouge-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-rouge-script)" },
  satisfy: { name: "Satisfy", title: '[font-family:var(--font-satisfy),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-satisfy)" },
  sacramento: { name: "Sacramento", title: '[font-family:var(--font-sacramento),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-sacramento)" },
  shadows: { name: "Shadows Into Light", title: '[font-family:var(--font-shadows-into-light),_"Comic_Sans_MS",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-shadows-into-light)" },
  sofia: { name: "Sofia", title: '[font-family:var(--font-sofia),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-sofia)" },
  sonsie: { name: "Sonsie One", title: '[font-family:var(--font-sonsie-one),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-sonsie-one)" },
  styleScript: { name: "Style Script", title: '[font-family:var(--font-style-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-style-script)" },
  tangerine: { name: "Tangerine", title: '[font-family:var(--font-tangerine),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-tangerine)" },
  yesteryear: { name: "Yesteryear", title: '[font-family:var(--font-yesteryear),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-yesteryear)" },
  yellowtail: { name: "Yellowtail", title: '[font-family:var(--font-yellowtail),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-yellowtail)" },
  zhiMang: { name: "Zhi Mang Xing", title: '[font-family:var(--font-zhi-mang-xing),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-zhi-mang-xing)" },
  missFajardose: { name: "Miss Fajardose", title: '[font-family:var(--font-miss-fajardose),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-miss-fajardose)" },
  stalemate: { name: "Stalemate", title: '[font-family:var(--font-stalemate),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-stalemate)" },
  drSugiyama: { name: "Dr Sugiyama", title: '[font-family:var(--font-dr-sugiyama),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-dr-sugiyama)" },
  caramel: { name: "Caramel", title: '[font-family:var(--font-caramel),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-caramel)" },
  kolkerBrush: { name: "Kolker Brush", title: '[font-family:var(--font-kolker-brush),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-kolker-brush)" },
  loveLight: { name: "Love Light", title: '[font-family:var(--font-love-light),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-love-light)" },
  luxuriousScript: { name: "Luxurious Script", title: '[font-family:var(--font-luxurious-script),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-luxurious-script)" },
  monteCarlo: { name: "Monte Carlo", title: '[font-family:var(--font-monte-carlo),_"Brush_Script_MT",_cursive]', body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]', preview: "var(--font-monte-carlo)" },
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

// --- EXPANDED THEME LIBRARY (50+ Styles) ---
const DESIGN_THEMES = [
  // --- CLASSIC ---
  {
    id: "classic_cream",
    name: "Classic Cream",
    category: "Classic",
    graphicType: "minimal-border",
    bg: "bg-[#fdfbf7]",
    text: "text-slate-900",
    accent: "text-slate-600",
    previewColor: "bg-[#fdfbf7]",
  },
  {
    id: "timeless_pearl",
    name: "Timeless Pearl",
    category: "Classic",
    graphicType: "soft-gradient",
    bg: "bg-white",
    text: "text-slate-800",
    accent: "text-slate-500",
    previewColor: "bg-gray-50",
  },
  {
    id: "black_tie",
    name: "Black Tie",
    category: "Classic",
    graphicType: "frame-double",
    bg: "bg-white",
    text: "text-black",
    accent: "text-black",
    previewColor: "bg-white border-2 border-black",
  },
  {
    id: "champagne",
    name: "Champagne Toast",
    category: "Classic",
    graphicType: "sparkle",
    bg: "bg-[#fffbf0]",
    text: "text-[#4a3b32]",
    accent: "text-[#b49b57]",
    previewColor: "bg-[#faebd7]",
  },
  {
    id: "navy_gold",
    name: "Navy & Gold",
    category: "Classic",
    graphicType: "geometric",
    bg: "bg-[#0f172a]",
    text: "text-white drop-shadow-md",
    accent: "text-[#fbbf24]",
    previewColor: "bg-[#0f172a]",
  },

  // --- BOTANICAL ---
  {
    id: "greenery",
    name: "Lush Greenery",
    category: "Botanical",
    graphicType: "leaves-corner",
    bg: "bg-white",
    text: "text-slate-900",
    accent: "text-emerald-800",
    previewColor: "bg-[#e8f5e9]",
  },
  {
    id: "eucalyptus",
    name: "Eucalyptus Dream",
    category: "Botanical",
    graphicType: "leaves-drape",
    bg: "bg-[#f0fdf4]",
    text: "text-[#1e293b]",
    accent: "text-[#3f6212]",
    previewColor: "bg-[#dcfce7]",
  },
  {
    id: "blush_peony",
    name: "Blush Peony",
    category: "Botanical",
    graphicType: "watercolor-flower",
    bg: "bg-[#fff1f2]",
    text: "text-[#881337]",
    accent: "text-[#e11d48]",
    previewColor: "bg-[#ffe4e6]",
  },
  {
    id: "lavender",
    name: "Lavender Field",
    category: "Botanical",
    graphicType: "watercolor-wash",
    bg: "bg-[#fdf4ff]",
    text: "text-[#581c87]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#f3e8ff]",
  },
  {
    id: "tropical",
    name: "Tropical Palm",
    category: "Botanical",
    graphicType: "palm-leaves",
    bg: "bg-[#ecfdf5]",
    text: "text-[#064e3b]",
    accent: "text-[#059669]",
    previewColor: "bg-[#10b981]",
  },
  {
    id: "sunflower",
    name: "Rustic Sunflower",
    category: "Botanical",
    graphicType: "sunflower",
    bg: "bg-[#fffbeb]",
    text: "text-[#451a03]",
    accent: "text-[#d97706]",
    previewColor: "bg-[#fef08a]",
  },
  {
    id: "cherry_blossom",
    name: "Kyoto Blossom",
    category: "Botanical",
    graphicType: "sakura",
    bg: "bg-[#fff5f7]",
    text: "text-[#831843]",
    accent: "text-[#fbcfe8]",
    previewColor: "bg-[#fce7f3]",
  },

  // --- BOHO & RUSTIC ---
  {
    id: "boho",
    name: "Boho Terracotta",
    category: "Boho",
    graphicType: "arch-sun",
    bg: "bg-[#fff7ed]",
    text: "text-[#7c2d12]",
    accent: "text-[#c2410c]",
    previewColor: "bg-[#ffedd5]",
  },
  {
    id: "pampas",
    name: "Pampas Grass",
    category: "Boho",
    graphicType: "dried-grass",
    bg: "bg-[#f5f5dc]",
    text: "text-[#44403c]",
    accent: "text-[#a8a29e]",
    previewColor: "bg-[#e7e5e4]",
  },
  {
    id: "rustic_wood",
    name: "Rustic Barn",
    category: "Boho",
    graphicType: "wood-texture",
    bg: "bg-[#fffbef]",
    text: "text-[#451a03]",
    accent: "text-[#92400e]",
    previewColor: "bg-[#b45309]",
  },
  {
    id: "vintage_lace",
    name: "Vintage Lace",
    category: "Boho",
    graphicType: "lace-pattern",
    bg: "bg-[#fafaf9]",
    text: "text-[#292524]",
    accent: "text-[#57534e]",
    previewColor: "bg-[#d6d3d1]",
  },
  {
    id: "sage_sand",
    name: "Sage & Sand",
    category: "Boho",
    graphicType: "organic-shapes",
    bg: "bg-[#f2fce2]",
    text: "text-[#1a2e05]",
    accent: "text-[#4d7c0f]",
    previewColor: "bg-[#ecfccb]",
  },
  {
    id: "desert",
    name: "Desert Mirage",
    category: "Boho",
    graphicType: "desert-dunes",
    bg: "bg-[#ffedd5]",
    text: "text-[#7c2d12]",
    accent: "text-[#fdba74]",
    previewColor: "bg-[#fdba74]",
  },

  // --- MODERN & INDUSTRIAL ---
  {
    id: "minimal_dark",
    name: "Midnight Minimal",
    category: "Modern",
    graphicType: "minimal-lines",
    bg: "bg-zinc-900",
    text: "text-white drop-shadow-md",
    accent: "text-zinc-300",
    previewColor: "bg-zinc-900",
  },
  {
    id: "modern_slate",
    name: "Modern Slate",
    category: "Modern",
    graphicType: "block-color",
    bg: "bg-slate-100",
    text: "text-slate-900",
    accent: "text-slate-600",
    previewColor: "bg-slate-300",
  },
  {
    id: "urban_concrete",
    name: "Industrial Chic",
    category: "Modern",
    graphicType: "texture-grit",
    bg: "bg-[#e5e7eb]",
    text: "text-gray-900",
    accent: "text-gray-600",
    previewColor: "bg-gray-200",
  },
  {
    id: "geometric",
    name: "Geometric Gold",
    category: "Modern",
    graphicType: "geo-frame",
    bg: "bg-slate-50",
    text: "text-slate-900",
    accent: "text-amber-700",
    previewColor: "bg-[#fff8e1]",
  },
  {
    id: "marble",
    name: "Carrara Marble",
    category: "Modern",
    graphicType: "marble",
    bg: "bg-[#f8f9fa]",
    text: "text-slate-900",
    accent: "text-slate-500",
    previewColor: "bg-gray-100",
  },
  {
    id: "pop_art",
    name: "Abstract Pop",
    category: "Modern",
    graphicType: "pop-shapes",
    bg: "bg-white",
    text: "text-black",
    accent: "text-[#ef4444]",
    previewColor: "bg-red-50",
  },
  {
    id: "cyberpunk",
    name: "Neon Nights",
    category: "Modern",
    graphicType: "neon-grid",
    bg: "bg-black",
    text: "text-[#22d3ee] drop-shadow-lg",
    accent: "text-[#d946ef]",
    previewColor: "bg-black border border-cyan-400",
  },

  // --- GLAMOUR & VINTAGE ---
  {
    id: "gatsby",
    name: "Great Gatsby",
    category: "Glamour",
    graphicType: "art-deco-fan",
    bg: "bg-[#1a1a1a]",
    text: "text-[#fbbf24] drop-shadow-md",
    accent: "text-white",
    previewColor: "bg-black border border-yellow-500",
  },
  {
    id: "rose_gold",
    name: "Rose Gold Lux",
    category: "Glamour",
    graphicType: "sparkle-corner",
    bg: "bg-[#fff1f2]",
    text: "text-[#881337]",
    accent: "text-[#be123c]",
    previewColor: "bg-[#fda4af]",
  },
  {
    id: "silver_lining",
    name: "Silver Lining",
    category: "Glamour",
    graphicType: "metallic-gradient",
    bg: "bg-[#f8fafc]",
    text: "text-[#0f172a]",
    accent: "text-[#64748b]",
    previewColor: "bg-slate-200",
  },
  {
    id: "victorian",
    name: "Victorian Goth",
    category: "Glamour",
    graphicType: "ornate-frame",
    bg: "bg-[#2e1065]",
    text: "text-[#e9d5ff]",
    accent: "text-[#a855f7]",
    previewColor: "bg-[#2e1065]",
  },
  {
    id: "royal",
    name: "Royal Blue",
    category: "Glamour",
    graphicType: "damask",
    bg: "bg-[#172554]",
    text: "text-[#fef08a]",
    accent: "text-[#fbbf24]",
    previewColor: "bg-[#172554]",
  },

  // --- SEASONAL ---
  {
    id: "winter",
    name: "Winter Wonderland",
    category: "Seasonal",
    graphicType: "snowflakes",
    bg: "bg-[#f0f9ff]",
    text: "text-[#0c4a6e]",
    accent: "text-[#0284c7]",
    previewColor: "bg-[#e0f2fe]",
  },
  {
    id: "autumn",
    name: "Autumn Harvest",
    category: "Seasonal",
    graphicType: "leaves-fall",
    bg: "bg-[#fff7e6]",
    text: "text-[#451a03]",
    accent: "text-[#c2410c]",
    previewColor: "bg-[#d35400]",
  },
  {
    id: "spring",
    name: "Spring Garden",
    category: "Seasonal",
    graphicType: "floral-ring",
    bg: "bg-[#fdf2f8]",
    text: "text-[#831843]",
    accent: "text-[#db2777]",
    previewColor: "bg-[#fbcfe8]",
  },
  {
    id: "summer",
    name: "Summer Citrus",
    category: "Seasonal",
    graphicType: "citrus-pop",
    bg: "bg-[#fefce8]",
    text: "text-[#713f12]",
    accent: "text-[#d97706]",
    previewColor: "bg-[#fef08a]",
  },

  // --- DESTINATION ---
  {
    id: "beach",
    name: "Ocean Breeze",
    category: "Destination",
    graphicType: "waves",
    bg: "bg-[#f0f8ff]",
    text: "text-[#0c4a6e]",
    accent: "text-[#0ea5e9]",
    previewColor: "bg-[#b3e5fc]",
  },
  {
    id: "mountain",
    name: "Mountain Mist",
    category: "Destination",
    graphicType: "mountain-outline",
    bg: "bg-[#f1f5f9]",
    text: "text-[#1e293b]",
    accent: "text-[#475569]",
    previewColor: "bg-[#cbd5e1]",
  },
  {
    id: "vineyard",
    name: "Vineyard Green",
    category: "Destination",
    graphicType: "vines",
    bg: "bg-[#fcfce5]",
    text: "text-[#1a2e05]",
    accent: "text-[#4d7c0f]",
    previewColor: "bg-[#d9f99d]",
  },
  {
    id: "santorini",
    name: "Santorini Blue",
    category: "Destination",
    graphicType: "dome-shape",
    bg: "bg-white",
    text: "text-[#1e3a8a]",
    accent: "text-[#3b82f6]",
    previewColor: "bg-blue-100",
  },
  {
    id: "safari",
    name: "African Safari",
    category: "Destination",
    graphicType: "animal-print",
    bg: "bg-[#fffbeb]",
    text: "text-[#78350f]",
    accent: "text-[#92400e]",
    previewColor: "bg-[#d97706]",
  },

  // --- WHIMSICAL & FUN ---
  {
    id: "magic",
    name: "Celestial Magic",
    category: "Whimsical",
    graphicType: "stars-moon",
    bg: "bg-[#1e1b4b]",
    text: "text-white drop-shadow-md",
    accent: "text-purple-300",
    previewColor: "bg-[#1e1b4b]",
  },
  {
    id: "fairy",
    name: "Fairy Tale",
    category: "Whimsical",
    graphicType: "sparkle-dust",
    bg: "bg-[#fff0f5]",
    text: "text-[#831843]",
    accent: "text-[#ec4899]",
    previewColor: "bg-[#fce7f3]",
  },
  {
    id: "cinematic",
    name: "Vintage Cinematic",
    category: "Whimsical",
    graphicType: "art-deco-corner",
    bg: "bg-[#0f3931]",
    text: "text-[#fef3c7] drop-shadow-sm",
    accent: "text-[#8bc4b5]",
    previewColor: "bg-[#0f3931]",
  },
  {
    id: "library",
    name: "Love Story Books",
    category: "Whimsical",
    graphicType: "books",
    bg: "bg-[#fdfbf7]",
    text: "text-[#451a03]",
    accent: "text-[#78350f]",
    previewColor: "bg-[#fef3c7]",
  },
  {
    id: "retro_70s",
    name: "Retro 70s",
    category: "Whimsical",
    graphicType: "retro-lines",
    bg: "bg-[#fff7ed]",
    text: "text-[#9a3412]",
    accent: "text-[#f97316]",
    previewColor: "bg-[#ffedd5]",
  },
];

const INITIAL_DATA = {
  partner1: "Ava",
  partner2: "Mason",
  date: "2028-09-21",
  time: "16:30",
  city: "New York",
  state: "NY",
  story:
    "We met at a coffee shop in Brooklyn on a rainy Tuesday. Mason offered to share his umbrella, and the rest is history. Five years, two dogs, and countless coffees later, we're ready to start our forever.",
  weddingParty: [
    { id: 1, name: "Sarah Jenkins", role: "Maid of Honor", side: "partner1" },
    { id: 2, name: "Mike Ross", role: "Best Man", side: "partner2" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    themeId: "classic_cream",
  },
  images: {
    hero: null,
    headlineBg: null,
  },
  travel: {
    hotels: [],
    airports: [],
    directions: "",
    shuttle: "", // New field
  },
  schedule: [
    {
      id: 1,
      title: "Welcome Drinks",
      date: "2028-09-20",
      time: "19:00",
      location: "The Rooftop Bar",
      description: "Join us for cocktails to kick off the weekend!",
    },
    {
      id: 2,
      title: "Ceremony",
      date: "2028-09-21",
      time: "16:30",
      location: "Grand Garden",
      description: "The main event. Please arrive 15 minutes early.",
    },
    {
      id: 3,
      title: "Reception",
      date: "2028-09-21",
      time: "18:00",
      location: "Ballroom",
      description: "Dinner, dancing, and celebration.",
    },
  ],
  thingsToDo: [
    {
      id: 1,
      title: "Central Park Stroll",
      description: "Our favorite place for a morning walk. Enter at 72nd St.",
      category: "Activity",
    },
    {
      id: 2,
      title: "Joe's Pizza",
      description: "Best slice in the city. Don't miss it!",
      category: "Food",
    },
  ],
  rsvp: {
    isEnabled: true,
    deadline: "2028-08-22",
  },
  gallery: [],
};
// --- Graphical Components (Smart Renderer) ---

const ThemeGraphics = ({ themeId, isThumbnail = false }) => {
  const theme = DESIGN_THEMES.find((t) => t.id === themeId) || DESIGN_THEMES[0];
  const type = theme.graphicType;
  const opacity = isThumbnail ? "opacity-100" : "opacity-100"; // Ensure visibility in thumbnail
  const strokeWidth = isThumbnail ? "2" : "0.5";

  const containerClass = isThumbnail
    ? "absolute inset-0 overflow-hidden"
    : "absolute inset-0 pointer-events-none overflow-hidden z-0";

  // 1. LEAVES & BOTANICALS
  if (type.includes("leaves")) {
    return (
      <div className={containerClass}>
        {type === "leaves-corner" && (
          <>
            <svg
              className={`absolute top-0 right-0 ${
                isThumbnail
                  ? "w-full h-full text-emerald-700/30"
                  : "w-64 h-64 opacity-10"
              } `}
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M0 0 Q 50 50 100 0 V 100 H 0 Z" />
            </svg>
            <svg
              className={`absolute bottom-0 left-0 ${
                isThumbnail
                  ? "w-full h-full text-emerald-700/30"
                  : "w-80 h-80 text-emerald-900/10"
              } transform rotate-180`}
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path
                d="M50 100 Q 20 50 0 0"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="none"
              />
            </svg>
          </>
        )}
        {type === "leaves-drape" && (
          <svg
            className={`absolute top-0 w-full ${
              isThumbnail
                ? "h-full text-green-800/30"
                : "h-40 text-green-800/10"
            }`}
            preserveAspectRatio="none"
            viewBox="0 0 100 20"
          >
            <path
              d="M0 0 Q 25 20 50 5 T 100 0 V 20 H 0 Z"
              fill="currentColor"
            />
          </svg>
        )}
        {type === "palm-leaves" && (
          <>
            <svg
              className={`absolute top-0 right-0 ${
                isThumbnail ? "w-full h-full" : "w-96 h-96"
              } text-emerald-600/10`}
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M100 100 L 50 0 L 0 100 Z" opacity="0.5" />
              <path d="M100 100 L 80 0 L 60 100 Z" opacity="0.3" />
            </svg>
          </>
        )}
      </div>
    );
  }

  // 2. GEOMETRIC & FRAMES
  if (type.includes("frame") || type === "geo-frame" || type === "geometric") {
    return (
      <div className={containerClass}>
        {type === "frame-double" && (
          <div className="absolute inset-1 border-2 border-current opacity-20">
            <div className="absolute inset-1 border border-current opacity-40"></div>
          </div>
        )}
        {type === "minimal-border" && (
          <div
            className={`absolute top-0 left-0 w-full ${
              isThumbnail
                ? "h-full border-t-8 border-slate-800"
                : "h-2 bg-current opacity-20"
            }`}
          ></div>
        )}
        {(type === "geo-frame" || type === "geometric") && (
          <>
            <svg
              className={`absolute top-0 w-full ${
                isThumbnail ? "h-full" : "h-32"
              } text-amber-500/30`}
              preserveAspectRatio="none"
              viewBox="0 0 100 20"
            >
              <path
                d="M50 20 L 0 0 L 100 0 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth={isThumbnail ? "2" : "0.2"}
              />
            </svg>
            {!isThumbnail && (
              <>
                <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-amber-500/30"></div>
                <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-amber-500/30"></div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // 3. ART DECO & GLAM
  if (type.includes("art-deco") || type === "sparkle") {
    return (
      <div className={containerClass}>
        {type === "art-deco-fan" && (
          <>
            {!isThumbnail && (
              <div className="absolute inset-4 border border-[#e5c100] opacity-20"></div>
            )}
            <svg
              className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${
                isThumbnail ? "w-full h-full" : "w-48 h-24"
              } text-[#e5c100] opacity-60`}
              viewBox="0 0 100 50"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M50 50 L 0 50 A 50 50 0 0 1 100 50 Z"
                opacity="0.2"
                fill="currentColor"
              />
              <path d="M50 50 L 10 50 A 40 40 0 0 1 90 50 Z" strokeWidth="2" />
              <path d="M50 50 L 20 50 A 30 30 0 0 1 80 50 Z" strokeWidth="2" />
            </svg>
          </>
        )}
        {type === "art-deco-corner" && (
          <svg
            className={`absolute top-0 left-0 ${
              isThumbnail ? "w-full h-full" : "w-24 h-24"
            } opacity-60 text-[#8bc4b5]`}
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
          >
            <path d="M0 0 L 40 0 Q 60 0 60 20 L 60 40" strokeWidth="3" />
          </svg>
        )}
        {type === "sparkle" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-200/40 via-transparent to-transparent"></div>
        )}
      </div>
    );
  }

  // 4. BOHO & TEXTURES
  if (
    [
      "arch-sun",
      "dried-grass",
      "wood-texture",
      "organic-shapes",
      "desert-dunes",
      "lace-pattern",
    ].includes(type)
  ) {
    return (
      <div className={containerClass}>
        {type === "arch-sun" && (
          <div
            className={`absolute top-0 left-1/2 transform -translate-x-1/2 ${
              isThumbnail ? "w-10 h-10" : "w-full max-w-md h-48"
            } bg-current opacity-20 rounded-b-full`}
          ></div>
        )}
        {type === "dried-grass" && (
          <svg
            className="absolute bottom-0 left-0 w-full h-full text-stone-500/20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 Q 20 50 10 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M10 100 Q 30 40 20 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        )}
        {type === "wood-texture" && (
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-10"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <path
                key={i}
                d={`M0 ${i * 20} Q 50 ${i * 20 + 10} 100 ${i * 20}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            ))}
          </svg>
        )}
        {type === "organic-shapes" && (
          <div className="absolute top-0 left-0 w-full h-full bg-current opacity-20 rounded-full blur-xl transform scale-150"></div>
        )}
        {type === "lace-pattern" && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
              backgroundSize: "10px 10px",
            }}
          ></div>
        )}
      </div>
    );
  }

  // 5. WATERCOLOR & PAINT
  if (type.includes("watercolor") || type === "marble") {
    return (
      <div className={containerClass}>
        {type === "watercolor-wash" && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300/40 via-transparent to-blue-200/40 filter blur-lg"></div>
        )}
        {type === "watercolor-flower" && (
          <div className="absolute top-0 right-0 w-full h-full bg-rose-300/40 rounded-full filter blur-xl"></div>
        )}
        {type === "marble" && (
          <svg
            className="w-full h-full opacity-30"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <path
              d="M0 20 Q 30 40 50 20 T 100 30"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M0 80 Q 40 60 70 80 T 100 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        )}
      </div>
    );
  }

  // 6. WHIMSICAL & SEASONAL & DESTINATION
  if (
    [
      "stars-moon",
      "snowflakes",
      "sparkle-dust",
      "waves",
      "mountain-outline",
      "tile-pattern",
      "vines",
      "citrus-pop",
      "sakura",
      "sunflower",
    ].includes(type)
  ) {
    return (
      <div className={containerClass}>
        {type === "stars-moon" && (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: Math.random() * 100 + "%",
                  left: Math.random() * 100 + "%",
                }}
              ></div>
            ))}
            <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full opacity-50 blur-sm"></div>
          </>
        )}
        {type === "snowflakes" &&
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute text-sky-300 opacity-80"
              style={{
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                fontSize: isThumbnail ? "10px" : "20px",
              }}
            >
              ❄
            </div>
          ))}
        {type === "waves" && (
          <svg
            className="absolute bottom-0 w-full h-1/2 text-blue-300/50"
            preserveAspectRatio="none"
            viewBox="0 0 100 20"
          >
            <path
              d="M0 20 L 0 10 Q 25 20 50 10 T 100 10 L 100 20 Z"
              fill="currentColor"
            />
          </svg>
        )}
        {type === "mountain-outline" && (
          <svg
            className="absolute bottom-0 w-full h-1/2 text-slate-400/40"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 L 30 40 L 60 80 L 80 50 L 100 100 Z"
              fill="currentColor"
            />
          </svg>
        )}
        {type === "tile-pattern" && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor)`,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px",
            }}
          ></div>
        )}
        {type === "citrus-pop" && (
          <div className="absolute top-0 right-0 w-10 h-10 bg-yellow-400 rounded-full opacity-60"></div>
        )}
      </div>
    );
  }

  // Default fallback
  return null;
};

// --- Components ---

const App = () => {
  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const designGridRef = useRef<HTMLDivElement | null>(null);

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const selectTheme = (themeId: string) => {
    const previewTop = previewRef.current?.scrollTop ?? null;
    const designTop = designGridRef.current?.scrollTop ?? null;
    updateTheme("themeId", themeId);
    requestAnimationFrame(() => {
      if (previewTop !== null && previewRef.current) {
        previewRef.current.scrollTo({ top: previewTop });
      }
      if (designTop !== null && designGridRef.current) {
        designGridRef.current.scrollTo({ top: designTop });
      }
    });
  };

  const updateTravel = (field, value) => {
    setData((prev) => ({
      ...prev,
      travel: { ...prev.travel, [field]: value },
    }));
  };

  const handleImageUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setData((prev) => ({
        ...prev,
        images: { ...prev.images, [field]: imageUrl },
      }));
    }
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      url: URL.createObjectURL(file),
    }));
    setData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newImages],
    }));
  };

  const removeGalleryImage = (id) => {
    setData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((img) => img.id !== id),
    }));
  };

  const currentTheme =
    DESIGN_THEMES.find((c) => c.id === data.theme.themeId) || DESIGN_THEMES[0];
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

  const MainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your wedding website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Names, date, location."
          onClick={() => setActiveView("headline")}
        />
        <MenuCard
          title="Design"
          icon={<Palette size={18} />}
          desc="Theme, fonts, colors."
          onClick={() => setActiveView("design")}
        />
        <MenuCard
          title="Images"
          icon={<ImageIcon size={18} />}
          desc="Hero & background photos."
          onClick={() => setActiveView("images")}
        />
        <MenuCard
          title="Schedule"
          icon={<CalendarIcon size={18} />}
          desc="Events, times, and locations."
          onClick={() => setActiveView("schedule")}
        />
        <MenuCard
          title="Our Story"
          icon={<Heart size={18} />}
          desc="How you met."
          onClick={() => setActiveView("story")}
        />
        <MenuCard
          title="Wedding Party"
          icon={<Users size={18} />}
          desc="VIPs and roles."
          onClick={() => setActiveView("party")}
        />
        <MenuCard
          title="Travel"
          icon={<MapPin size={18} />}
          desc="Hotels, shuttles & airports."
          onClick={() => setActiveView("travel")}
        />
        <MenuCard
          title="Things To Do"
          icon={<Coffee size={18} />}
          desc="Local recommendations."
          onClick={() => setActiveView("thingsToDo")}
        />
        <MenuCard
          title="Photos"
          icon={<ImageIcon size={18} />}
          desc="Photo gallery."
          onClick={() => setActiveView("photos")}
        />
        <MenuCard
          title="RSVP"
          icon={<CheckSquare size={18} />}
          desc="RSVP settings."
          onClick={() => setActiveView("rsvp")}
        />
        <MenuCard
          title="Registry"
          icon={<Gift size={18} />}
          desc="Gift registries."
          onClick={() => setActiveView("registry")}
        />
      </div>
    </div>
  );

  const HeadlineEditor = () => (
    <EditorLayout title="Headline" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <InputGroup
          label="Partner One"
          value={data.partner1}
          onChange={(v) => updateData("partner1", v)}
        />
        <InputGroup
          label="Partner Two"
          value={data.partner2}
          onChange={(v) => updateData("partner2", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="Event Date"
            type="date"
            value={data.date}
            onChange={(v) => updateData("date", v)}
          />
          <InputGroup
            label="Start Time"
            type="time"
            value={data.time}
            onChange={(v) => updateData("time", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputGroup
            label="City"
            value={data.city}
            onChange={(v) => updateData("city", v)}
          />
          <InputGroup
            label="State"
            value={data.state}
            onChange={(v) => updateData("state", v)}
          />
        </div>
      </div>
    </EditorLayout>
  );

  const ImagesEditor = () => (
    <EditorLayout title="Images" onBack={() => setActiveView("main")}>
      <div className="space-y-8">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Hero Image
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.hero ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={data.images.hero}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, hero: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Upload size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">Upload main photo</p>
                <p className="text-xs text-slate-400">
                  Recommended: 1600x900px
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("hero", e)}
                />
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">
            Headline Background
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            {data.images.headlineBg ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={data.images.headlineBg}
                  alt="Headline Bg"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      images: { ...prev.images, headlineBg: null },
                    }))
                  }
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ImageIcon size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Upload header texture
                </p>
                <p className="text-xs text-slate-400">
                  Optional pattern behind names
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload("headlineBg", e)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const DesignEditor = () => (
    <EditorLayout title="Design" onBack={() => setActiveView("main")}>
      <div className="space-y-8">
        <div className="border-b border-slate-100 pb-6">
          <button
            onClick={() => setDesignOpen(!designOpen)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block cursor-pointer mb-1">
                Professional Themes
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <div
                  className={`w-3 h-3 rounded-full border shadow-sm ${
                    currentTheme.previewColor.split(" ")[0]
                  }`}
                ></div>
                {currentTheme.name || "Select a theme"}
              </div>
            </div>
            <div
              className={`p-2 rounded-full bg-slate-50 text-slate-500 group-hover:bg-slate-100 transition-all ${
                designOpen ? "rotate-180 text-indigo-600 bg-indigo-50" : ""
              }`}
            >
              <ChevronDown size={16} />
            </div>
          </button>

          <div
            ref={designGridRef}
            className={`grid grid-cols-2 gap-3 mt-4 overflow-y-auto transition-all duration-300 ease-in-out ${
              designOpen
                ? "max-h-[600px] opacity-100"
                : "max-h-0 opacity-0 hidden"
            }`}
          >
            {DESIGN_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectTheme(theme.id);
                }}
                className={`relative overflow-hidden p-3 border rounded-lg text-left transition-all group ${
                  data.theme.themeId === theme.id
                    ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
                    : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
                }`}
              >
                <div
                  className={`h-12 w-full rounded-md mb-3 ${theme.previewColor} border border-black/5 shadow-inner flex items-center justify-center relative overflow-hidden text-current`}
                >
                  <div
                    className={`${theme.accent} w-full h-full absolute inset-0`}
                  >
                    <ThemeGraphics themeId={theme.id} isThumbnail={true} />
                  </div>
                </div>

                <span className="text-sm font-medium text-slate-700 block truncate">
                  {theme.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {theme.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Typography
          </label>
          <div className="relative">
            <select
              value={data.theme.font}
              onChange={(e) => updateTheme("font", e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg appearance-none text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
            >
              {Object.entries(FONTS).map(([key, font]) => (
                <option
                  key={key}
                  value={key}
                  style={{ fontFamily: font.preview }}
                >
                  {font.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
            Text Size
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                onClick={() => updateTheme("fontSize", size)}
                className={`py-2 text-sm font-medium rounded-md transition-all capitalize ${
                  data.theme.fontSize === size
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </EditorLayout>
  );

  const ScheduleEditor = () => {
    const [newEvent, setNewEvent] = useState({
      title: "",
      date: "",
      time: "",
      location: "",
    });

    const addEvent = () => {
      if (newEvent.title) {
        updateData("schedule", [
          ...(data.schedule || []),
          { ...newEvent, id: Date.now() },
        ]);
        setNewEvent({ title: "", date: "", time: "", location: "" });
      }
    };

    return (
      <EditorLayout title="Schedule" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Event
            </h4>
            <InputGroup
              label="Event Name"
              value={newEvent.title}
              onChange={(v) => setNewEvent({ ...newEvent, title: v })}
              placeholder="e.g. Welcome Drinks"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Date"
                type="date"
                value={newEvent.date}
                onChange={(v) => setNewEvent({ ...newEvent, date: v })}
              />
              <InputGroup
                label="Time"
                type="time"
                value={newEvent.time}
                onChange={(v) => setNewEvent({ ...newEvent, time: v })}
              />
            </div>
            <InputGroup
              label="Location"
              value={newEvent.location}
              onChange={(v) => setNewEvent({ ...newEvent, location: v })}
              placeholder="Hotel Lobby"
            />
            <button
              onClick={addEvent}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add to Schedule
            </button>
          </div>

          <div className="space-y-3">
            {data.schedule?.map((event) => (
              <div
                key={event.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">{event.title}</div>
                  <div className="text-xs text-slate-500">
                    {event.date} at {event.time}
                  </div>
                  <div className="text-xs text-slate-500">{event.location}</div>
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "schedule",
                      data.schedule.filter((e) => e.id !== event.id)
                    )
                  }
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  const StoryEditor = () => (
    <EditorLayout title="Our Story" onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm mb-4">
          <strong>Tip:</strong> Keep it short and sweet! Guests love hearing how
          you met.
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            How it all began
          </span>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 leading-relaxed"
            value={data.story}
            onChange={(e) => updateData("story", e.target.value)}
            placeholder="Once upon a time..."
          />
        </label>
      </div>
    </EditorLayout>
  );

  const PhotosEditor = () => (
    <EditorLayout title="Photos" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Upload Photos
          </h3>
          <p className="text-xs text-slate-500">JPG or PNG up to 5MB</p>
        </div>
      </div>
    </EditorLayout>
  );

  const ThingsToDoEditor = () => {
    const [newItem, setNewItem] = useState({
      title: "",
      description: "",
      category: "Activity",
    });

    const addItem = () => {
      if (newItem.title) {
        updateData("thingsToDo", [
          ...data.thingsToDo,
          { ...newItem, id: Date.now() },
        ]);
        setNewItem({ title: "", description: "", category: "Activity" });
      }
    };

    const removeItem = (id) => {
      updateData(
        "thingsToDo",
        data.thingsToDo.filter((i) => i.id !== id)
      );
    };

    return (
      <EditorLayout title="Things To Do" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add New Item
            </h4>
            <InputGroup
              label="Name of Place"
              value={newItem.title}
              onChange={(v) => setNewItem({ ...newItem, title: v })}
              placeholder="e.g. Central Park"
            />
            <InputGroup
              label="Description"
              value={newItem.description}
              onChange={(v) => setNewItem({ ...newItem, description: v })}
              placeholder="Why you love it..."
            />
            <div className="flex justify-end">
              <button
                onClick={addItem}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
              >
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {data.thingsToDo.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start p-3 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors bg-white"
              >
                <div>
                  <div className="font-medium text-slate-800 text-sm">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    {item.description}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </EditorLayout>
    );
  };

  const RSVPEditor = () => (
    <EditorLayout title="RSVP Settings" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <span className="font-medium text-slate-700 text-sm">
            Enable RSVP
          </span>
          <button
            onClick={() =>
              updateData("rsvp", {
                ...data.rsvp,
                isEnabled: !data.rsvp.isEnabled,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative ${
              data.rsvp.isEnabled ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                data.rsvp.isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            ></span>
          </button>
        </div>

        <InputGroup
          label="RSVP Deadline"
          type="date"
          value={data.rsvp.deadline}
          onChange={(v) => updateData("rsvp", { ...data.rsvp, deadline: v })}
        />

        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
          <strong>Preview:</strong> Check the preview pane to see the RSVP form
          that your guests will see.
        </div>
      </div>
    </EditorLayout>
  );

  const RegistryEditor = () => (
    <EditorLayout title="Registry" onBack={() => setActiveView("main")}>
      <div className="space-y-6 text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mb-4">
          <Gift size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-800">
          Registry Coming Soon
        </h3>
        <p className="text-slate-500 text-sm px-4">
          We are working on the ability to link your external registries (Zola,
          Amazon, Target, etc.) directly here. For now, the Registry section
          will show a "Coming Soon" message on your site.
        </p>
      </div>
    </EditorLayout>
  );

  const TravelEditor = () => {
    const [subView, setSubView] = useState("main");
    const [tempHotel, setTempHotel] = useState({
      name: "",
      address: "",
      link: "",
      deadline: "",
    });
    const [tempAirport, setTempAirport] = useState({
      name: "",
      code: "",
      distance: "",
    });

    const saveHotel = () => {
      if (tempHotel.name) {
        updateTravel("hotels", [
          ...data.travel.hotels,
          { ...tempHotel, id: Date.now() },
        ]);
        setTempHotel({ name: "", address: "", link: "", deadline: "" });
        setSubView("main");
      }
    };

    const saveAirport = () => {
      if (tempAirport.name) {
        updateTravel("airports", [
          ...data.travel.airports,
          { ...tempAirport, id: Date.now() },
        ]);
        setTempAirport({ name: "", code: "", distance: "" });
        setSubView("main");
      }
    };

    const removeHotel = (id) => {
      updateTravel(
        "hotels",
        data.travel.hotels.filter((h) => h.id !== id)
      );
    };
    const removeAirport = (id) => {
      updateTravel(
        "airports",
        data.travel.airports.filter((a) => a.id !== id)
      );
    };

    if (subView === "addHotel") {
      return (
        <EditorLayout title="Add Hotel" onBack={() => setSubView("main")}>
          <div className="space-y-4">
            <InputGroup
              label="Hotel Name"
              value={tempHotel.name}
              onChange={(v) => setTempHotel({ ...tempHotel, name: v })}
              placeholder="e.g. The Grand Plaza"
            />
            <InputGroup
              label="Address"
              value={tempHotel.address}
              onChange={(v) => setTempHotel({ ...tempHotel, address: v })}
              placeholder="123 Main St"
            />
            <InputGroup
              label="Booking Link"
              value={tempHotel.link}
              onChange={(v) => setTempHotel({ ...tempHotel, link: v })}
              placeholder="https://..."
            />
            <InputGroup
              label="Book By Deadline"
              type="date"
              value={tempHotel.deadline}
              onChange={(v) => setTempHotel({ ...tempHotel, deadline: v })}
            />
            <button
              onClick={saveHotel}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 mt-4"
            >
              Add Hotel
            </button>
          </div>
        </EditorLayout>
      );
    }

    if (subView === "addAirport") {
      return (
        <EditorLayout title="Add Airport" onBack={() => setSubView("main")}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <InputGroup
                  label="Airport Name"
                  value={tempAirport.name}
                  onChange={(v) => setTempAirport({ ...tempAirport, name: v })}
                  placeholder="e.g. Kennedy International"
                />
              </div>
              <InputGroup
                label="Code"
                value={tempAirport.code}
                onChange={(v) => setTempAirport({ ...tempAirport, code: v })}
                placeholder="JFK"
              />
            </div>
            <InputGroup
              label="Distance / Drive Time"
              value={tempAirport.distance}
              onChange={(v) => setTempAirport({ ...tempAirport, distance: v })}
              placeholder="45 mins away"
            />
            <button
              onClick={saveAirport}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 mt-4"
            >
              Add Airport
            </button>
          </div>
        </EditorLayout>
      );
    }

    if (subView === "addDirections") {
      return (
        <EditorLayout title="Directions" onBack={() => setSubView("main")}>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Instructions & Parking
              </span>
              <textarea
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
                value={data.travel.directions}
                onChange={(e) => updateTravel("directions", e.target.value)}
                placeholder="Share shuttle times, parking locations, or driving directions..."
              />
            </label>
          </div>
        </EditorLayout>
      );
    }

    return (
      <EditorLayout title="Travel" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <p className="text-slate-500 text-sm leading-relaxed">
            Share arrival guidance, airport tips, shuttles, and parking info so
            guests travel with confidence.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSubView("addHotel")}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all gap-2 bg-white shadow-sm h-32"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Building size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">
                Add Hotel
              </span>
            </button>
            <button
              onClick={() => setSubView("addAirport")}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all gap-2 bg-white shadow-sm h-32"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Plane size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">
                Add Airport
              </span>
            </button>
            <button
              onClick={() => setSubView("addDirections")}
              className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all gap-2 bg-white shadow-sm h-32"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Navigation size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">
                Add Directions
              </span>
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
              <Bus size={14} /> Shuttle & Transportation
            </h4>
            <textarea
              className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
              placeholder="Add shuttle schedule or details here..."
              value={data.travel.shuttle || ""}
              onChange={(e) => updateTravel("shuttle", e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {data.travel.hotels.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hotels
                </h4>
                <div className="space-y-2">
                  {data.travel.hotels.map((h) => (
                    <div
                      key={h.id}
                      className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {h.name}
                      </span>
                      <button
                        onClick={() => removeHotel(h.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.travel.airports.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Airports
                </h4>
                <div className="space-y-2">
                  {data.travel.airports.map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-600">
                          {a.code}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {a.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeAirport(a.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </EditorLayout>
    );
  };

  const PartyEditor = () => {
    const [newRole, setNewRole] = useState("");

    const addMember = (role, side) => {
      const newMember = {
        id: Date.now(),
        name: "Name Here",
        role: role,
        side: side,
      };
      updateData("weddingParty", [...data.weddingParty, newMember]);
    };

    const updateMemberName = (id, name) => {
      const updated = data.weddingParty.map((m) =>
        m.id === id ? { ...m, name } : m
      );
      updateData("weddingParty", updated);
    };

    const removeMember = (id) => {
      updateData(
        "weddingParty",
        data.weddingParty.filter((m) => m.id !== id)
      );
    };

    const SideColumn = ({ label, sideKey, buttonLabel }) => (
      <div className="space-y-3">
        <h3 className="font-medium text-slate-900 uppercase text-xs tracking-wider">
          {label}
        </h3>
        <div className="space-y-3">
          {data.weddingParty
            .filter((m) => m.side === sideKey)
            .map((member) => (
              <div
                key={member.id}
                className="group flex items-center gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-indigo-600 uppercase mb-0.5">
                    {member.role}
                  </div>
                  <input
                    className="w-full text-sm border-none p-0 focus:ring-0 font-medium text-slate-800 placeholder:text-slate-300"
                    value={member.name}
                    onChange={(e) =>
                      updateMemberName(member.id, e.target.value)
                    }
                    placeholder="Enter Name"
                  />
                </div>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-slate-300 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
        <div className="pt-2 grid grid-cols-2 gap-2">
          {[
            "Maid of Honor",
            "Best Man",
            "Bridesmaid",
            "Groomsman",
            "Flower Girl",
            "Ring Bearer",
          ].map((role) => (
            <button
              key={role}
              onClick={() => addMember(role, sideKey)}
              className="text-xs border border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600 text-slate-500 py-2 rounded text-center transition-colors"
            >
              + {role}
            </button>
          ))}
        </div>
      </div>
    );

    return (
      <EditorLayout title="Wedding Party" onBack={() => setActiveView("main")}>
        <p className="text-sm text-slate-500 mb-6">
          Add attendants to each side of the party. Click on a name to edit it.
        </p>
        <div className="space-y-8">
          <SideColumn label={`${data.partner1}'s Side`} sideKey="partner1" />
          <div className="h-px bg-slate-100 w-full"></div>
          <SideColumn label={`${data.partner2}'s Side`} sideKey="partner2" />
        </div>
      </EditorLayout>
    );
  };

  // --- Main App Structure ---

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div ref={previewRef} className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center">
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            className={`min-h-[800px] w-full bg-white shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${currentFont.body} transition-colors duration-500 relative z-0`}
          >
            <ThemeGraphics themeId={data.theme.themeId} />

            {data.images.headlineBg && (
              <div
                className="absolute inset-0 opacity-30 pointer-events-none z-0 bg-repeat"
                style={{
                  backgroundImage: `url(${data.images.headlineBg})`,
                  backgroundSize: "300px",
                }}
              ></div>
            )}

            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b border-white/10 flex justify-between items-start ${currentTheme.text}`}
              >
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => setActiveView("headline")}
                >
                  <h1
                    className={`${currentSize.h1} mb-2 ${currentFont.title} leading-tight`}
                  >
                    {data.partner1} & {data.partner2}
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={24} />
                    </span>
                  </h1>
                  <div
                    className={`flex items-center gap-4 ${currentSize.body} font-medium opacity-90 ${currentFont.body} tracking-wide`}
                  >
                    <span>
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>{data.time}</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>
                      {data.city}, {data.state}
                    </span>
                  </div>
                </div>
              </div>

              <nav
                className={`px-6 md:px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 ${currentSize.nav} uppercase tracking-widest font-semibold border-b border-white/5 ${currentTheme.accent} ${currentFont.title}`}
              >
                {[
                  "Home",
                  "Schedule",
                  "Our Story",
                  "Wedding Party",
                  "Photos",
                  "Things To Do",
                  "Travel",
                  "RSVP",
                  "Registry",
                ].map((item) => (
                  <span
                    key={item}
                    className="cursor-pointer hover:underline decoration-2 underline-offset-4 opacity-90 hover:opacity-100"
                    onClick={() => {
                      const idMap = {
                        "Things To Do": "thingsToDo",
                        RSVP: "rsvp",
                        Registry: "registry",
                        Schedule: "schedule",
                      };
                      if (idMap[item])
                        setActiveView(
                          idMap[item].replace(/^[A-Z]/, (c) => c.toLowerCase())
                        );
                    }}
                  >
                    {item}
                  </span>
                ))}
              </nav>

              <div className="relative h-[400px] md:h-[500px] w-full group cursor-default">
                <img
                  src={
                    data.images.hero ||
                    "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                  }
                  alt="Couple"
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
                />
                <div
                  className={`absolute bottom-0 left-0 w-full h-32 ${
                    currentTheme.text.includes("slate-900") ||
                    currentTheme.text.includes("black")
                      ? "bg-gradient-to-t from-white/90 to-transparent"
                      : data.theme.themeId === "navy_gold"
                        ? "bg-gradient-to-t from-[#0f172a]/90 to-transparent"
                        : "bg-gradient-to-t from-black/70 to-transparent"
                  }`}
                ></div>
              </div>

              <div className={`p-8 md:p-16 space-y-24 ${currentTheme.text}`}>
                <section
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("schedule")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                  >
                    Schedule of Events
                  </h2>
                  <div className="space-y-8 relative">
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-current opacity-20"></div>
                    {(data.schedule || []).map((event, i) => (
                      <div
                        key={event.id}
                        className={`relative flex flex-col md:flex-row gap-8 ${
                          i % 2 === 0
                            ? "md:text-right"
                            : "md:flex-row-reverse md:text-left"
                        }`}
                      >
                        <div className="flex-1 pt-2">
                          <h3 className="text-xl font-bold">{event.title}</h3>
                          <p className="opacity-70 text-sm mb-2">
                            {event.location}
                          </p>
                          <p className="opacity-80 leading-relaxed text-sm">
                            {event.description}
                          </p>
                        </div>
                        <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-current ring-4 ring-white/20 mt-3"></div>
                        <div
                          className={`flex-1 pt-2 pl-10 md:pl-0 ${
                            i % 2 === 0 ? "md:text-left" : "md:text-right"
                          }`}
                        >
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-current opacity-70`}
                          >
                            {event.time}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!data.schedule || data.schedule.length === 0) && (
                      <div className="text-center opacity-50 italic">
                        Click to add events...
                      </div>
                    )}
                  </div>
                </section>

                <section
                  className="max-w-2xl mx-auto text-center cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors -mx-4"
                  onClick={() => setActiveView("story")}
                >
                  <h2
                    className={`${currentSize.h2} mb-8 ${currentFont.title} ${currentTheme.accent}`}
                  >
                    Our Story
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 ${currentFont.body} whitespace-pre-wrap`}
                  >
                    {data.story}
                  </p>
                </section>

                <section
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("party")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                  >
                    Wedding Party
                  </h2>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {data.partner1}'s Side
                      </h3>
                      {data.weddingParty
                        .filter((m) => m.side === "partner1")
                        .map((member) => (
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
                      {data.weddingParty.filter((m) => m.side === "partner1")
                        .length === 0 && (
                        <div className="italic opacity-40">
                          No members added yet
                        </div>
                      )}
                    </div>

                    <div className="text-center space-y-6">
                      <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-6 pb-2 border-b border-white/20 inline-block px-4">
                        {data.partner2}'s Side
                      </h3>
                      {data.weddingParty
                        .filter((m) => m.side === "partner2")
                        .map((member) => (
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
                      {data.weddingParty.filter((m) => m.side === "partner2")
                        .length === 0 && (
                        <div className="italic opacity-40">
                          No members added yet
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("thingsToDo")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentFont.title} ${currentTheme.accent}`}
                  >
                    Things To Do
                  </h2>
                  {data.thingsToDo.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {data.thingsToDo.map((item) => (
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
                  ) : (
                    <div className="text-center italic opacity-40">
                      Click to add recommendations for your guests...
                    </div>
                  )}
                </section>

                <section
                  className="max-w-3xl mx-auto cursor-pointer hover:bg-white/5 p-6 rounded-lg transition-colors -mx-6"
                  onClick={() => setActiveView("travel")}
                >
                  <h2
                    className={`${currentSize.h2} mb-10 text-center ${currentFont.title} ${currentTheme.accent}`}
                  >
                    Travel & Stay
                  </h2>
                  {data.travel.hotels.length > 0 && (
                    <div className="mb-12">
                      <h3 className="text-center uppercase tracking-widest text-sm font-bold opacity-70 mb-6">
                        Where to Stay
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {data.travel.hotels.map((hotel) => (
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
                    {data.travel.airports.length > 0 && (
                      <div className="text-left">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20">
                          Flying In
                        </h3>
                        <ul className="space-y-4">
                          {data.travel.airports.map((airport) => (
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

                    {data.travel.directions && (
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
                            {data.travel.directions}
                          </p>
                        </div>
                      </div>
                    )}

                    {data.travel.shuttle && (
                      <div className="text-left col-span-2 border-t border-white/10 pt-6 mt-6">
                        <h3 className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 pb-2 border-b border-white/20 flex items-center gap-2">
                          <Bus size={16} /> Shuttle Service
                        </h3>
                        <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                          {data.travel.shuttle}
                        </p>
                      </div>
                    )}
                  </div>
                  {data.travel.hotels.length === 0 &&
                    data.travel.airports.length === 0 &&
                    !data.travel.directions &&
                    !data.travel.shuttle && (
                      <div className="mt-8 bg-white/5 border border-white/15 rounded-xl p-6 text-center">
                        <p className="text-sm opacity-80 leading-relaxed">
                          Add lodging, airport tips, parking notes, or shuttle times so guests know exactly how to arrive and where to stay.
                        </p>
                      </div>
                    )}
                </section>

                <section
                  className="max-w-xl mx-auto text-center"
                  onClick={() => setActiveView("rsvp")}
                >
                  <h2
                    className={`${currentSize.h2} mb-6 ${currentFont.title} ${currentTheme.accent}`}
                  >
                    RSVP
                  </h2>
                  {data.rsvp.isEnabled ? (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-left">
                      {!rsvpSubmitted ? (
                        <div className="space-y-6">
                          <div className="text-center mb-4">
                            <p className="opacity-80">
                              Kindly respond by{" "}
                              {new Date(
                                data.rsvp.deadline
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                              Full Name
                            </label>
                            <input
                              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30"
                              placeholder="Guest Name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-3">
                              Attending?
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              <label className="relative cursor-pointer group">
                                <input
                                  type="radio"
                                  name="attending"
                                  className="peer sr-only"
                                  defaultChecked
                                />
                                <div
                                  className={`p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20`}
                                >
                                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="font-semibold">
                                    Joyfully Accept
                                  </span>
                                </div>
                              </label>
                              <label className="relative cursor-pointer group">
                                <input
                                  type="radio"
                                  name="attending"
                                  className="peer sr-only"
                                />
                                <div
                                  className={`p-6 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3 peer-checked:border-current peer-checked:bg-white/20`}
                                >
                                  <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="font-semibold">
                                    Regretfully Decline
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRsvpSubmitted(true);
                            }}
                            className={`w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg`}
                          >
                            Send RSVP
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">🎉</div>
                          <h3 className="text-2xl font-serif mb-2">
                            Thank you!
                          </h3>
                          <p className="opacity-70">Your RSVP has been sent.</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRsvpSubmitted(false);
                            }}
                            className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                          >
                            Send another response
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                      <p className="italic opacity-50">
                        RSVP is currently closed.
                      </p>
                    </div>
                  )}
                </section>

                <section
                  className="text-center py-12 border-t border-white/10"
                  onClick={() => setActiveView("registry")}
                >
                  <h2
                    className={`text-2xl mb-4 ${currentFont.title} opacity-80`}
                  >
                    Registry
                  </h2>
                  <div className="inline-block px-8 py-3 bg-white/5 border border-white/20 rounded-full">
                    <span className="uppercase tracking-widest text-sm font-semibold opacity-80">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-4 text-sm opacity-50 max-w-md mx-auto">
                    We are currently registering for gifts to help kickstart our
                    new life together! Check back soon for details.
                  </p>
                </section>
              </div>
            </div>
          </div>
          <div className="h-20"></div>
        </div>
      </div>

      <div
        className="w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative h-full transition-transform duration-300 transform md:translate-x-0 translate-x-full"
        style={{ transform: `translateX(${mobileMenuOpen ? "0" : ""})` }}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeView === "main" && <MainMenu />}
            {activeView === "headline" && <HeadlineEditor />}
            {activeView === "images" && <ImagesEditor />}
            {activeView === "design" && <DesignEditor />}
            {activeView === "schedule" && <ScheduleEditor />}
            {activeView === "story" && <StoryEditor />}
            {activeView === "party" && <PartyEditor />}
            {activeView === "photos" && <PhotosEditor />}
            {activeView === "travel" && <TravelEditor />}
            {activeView === "thingsToDo" && <ThingsToDoEditor />}
            {activeView === "rsvp" && <RSVPEditor />}
            {activeView === "registry" && <RegistryEditor />}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
          <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg">
            PREVIEW AND PUBLISH
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-4 right-4 z-50"></div>
    </div>
  );
};

const MenuCard = ({ title, icon, desc, onClick, opacity = "opacity-100" }) => (
  <div
    onClick={onClick}
    className={`group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4 ${opacity}`}
  >
    <div className="bg-slate-50 p-3 rounded-lg text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <ChevronRight
          size={16}
          className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all"
        />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const EditorLayout = ({ title, onBack, children }) => (
  <div className="animate-fade-in-right">
    <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
      <button
        onClick={onBack}
        className="mr-3 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-auto">
        Customize
      </span>
      <h2 className="text-lg font-serif font-bold text-slate-800 absolute left-1/2 transform -translate-x-1/2">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

const InputGroup = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
    />
  </div>
);

export default App;
