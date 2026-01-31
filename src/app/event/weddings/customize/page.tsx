// @ts-nocheck
"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  Share2,
  Apple,
} from "lucide-react";
import ScrollHandoffContainer from "@/components/ScrollHandoffContainer";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";
import WeddingRenderer from "@/components/weddings/WeddingRenderer";
import Link from "next/link";
import etherealClassic from "../../../../../templates/weddings/ethereal-classic/config.json" assert { type: "json" };
import modernEditorial from "../../../../../templates/weddings/modern-editorial/config.json" assert { type: "json" };
import rusticBoho from "../../../../../templates/weddings/rustic-boho/config.json" assert { type: "json" };
import cinematicWedding from "../../../../../templates/weddings/cinematic-wedding/config.json" assert { type: "json" };
import celestialWedding from "../../../../../templates/weddings/celestial-wedding/config.json" assert { type: "json" };
import gildedWedding from "../../../../../templates/weddings/gilded-wedding/config.json" assert { type: "json" };
import museumWedding from "../../../../../templates/weddings/museum-wedding/config.json" assert { type: "json" };
import etherealWedding from "../../../../../templates/weddings/ethereal-wedding/config.json" assert { type: "json" };
import noirLuxury from "../../../../../templates/weddings/noir-luxury/config.json" assert { type: "json" };
import retro70s from "../../../../../templates/weddings/retro-70s/config.json" assert { type: "json" };
import newspaperWedding from "../../../../../templates/weddings/newspaper-wedding/config.json" assert { type: "json" };
import bauhausWedding from "../../../../../templates/weddings/bauhaus-wedding/config.json" assert { type: "json" };
import europeCoastalWedding from "../../../../../templates/weddings/europe-coastal-wedding/config.json" assert { type: "json" };
import floridaCoastalWedding from "../../../../../templates/weddings/florida-coastal-wedding/config.json" assert { type: "json" };
import californiaCoastalWedding from "../../../../../templates/weddings/california-coastal-wedding/config.json" assert { type: "json" };
import winterWedding from "../../../../../templates/weddings/winter-wedding/config.json" assert { type: "json" };
import industrialWedding from "../../../../../templates/weddings/industrial-wedding/config.json" assert { type: "json" };
import libraryWedding from "../../../../../templates/weddings/library-wedding/config.json" assert { type: "json" };
import gardenWedding from "../../../../../templates/weddings/garden-wedding/config.json" assert { type: "json" };
import skylineWedding from "../../../../../templates/weddings/skyline-wedding/config.json" assert { type: "json" };
import DesignThemes from "./_components/DesignThemes";
import weddingTemplateCatalog from "../../../../../templates/weddings/index.json" assert { type: "json" };
import RegistryPanel from "./[id]/RegistryPanel";

const NAV_ITEMS = [
  "Home",
  "Schedule",
  "Our Story",
  "Wedding Party",
  "Photos",
  "Things To Do",
  "Travel",
  "RSVP",
  "Registry",
] as const;

const NAV_SCROLL_TARGETS: Record<(typeof NAV_ITEMS)[number], string> = {
  Home: "wedding-home",
  Schedule: "wedding-schedule",
  "Our Story": "wedding-story",
  "Wedding Party": "wedding-party",
  Photos: "wedding-photos",
  "Things To Do": "wedding-things",
  Travel: "wedding-travel",
  RSVP: "wedding-rsvp",
  Registry: "wedding-registry",
};

const NAV_EDIT_TARGETS: Record<(typeof NAV_ITEMS)[number], string> = {
  Home: "headline",
  Schedule: "schedule",
  "Our Story": "story",
  "Wedding Party": "party",
  Photos: "photos",
  "Things To Do": "thingsToDo",
  Travel: "travel",
  RSVP: "rsvp",
  Registry: "registry",
};

const NAV_VISIBILITY_CHECKS: Record<
  (typeof NAV_ITEMS)[number],
  (data: any) => boolean
> = {
  Home: () => true,
  Schedule: (data) => Array.isArray(data.schedule) && data.schedule.length > 0,
  "Our Story": (data) => Boolean(data.story),
  "Wedding Party": (data) =>
    Array.isArray(data.weddingParty) && data.weddingParty.length > 0,
  Photos: (data) => Array.isArray(data.gallery) && data.gallery.length > 0,
  "Things To Do": (data) =>
    Array.isArray(data.thingsToDo) && data.thingsToDo.length > 0,
  Travel: (data) => {
    const travel = data.travel || {};
    return (
      (Array.isArray(travel.hotels) && travel.hotels.length > 0) ||
      (Array.isArray(travel.airports) && travel.airports.length > 0) ||
      Boolean(travel.directions) ||
      Boolean(travel.shuttle)
    );
  },
  RSVP: (data) => Boolean(data.rsvp?.isEnabled),
  Registry: (data) =>
    Array.isArray((data as any).registry) && (data as any).registry.length > 0,
};

// --- Constants & Data ---

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
  "skyline-wedding": skylineWedding,
};

const TEMPLATE_LIBRARY = (Array.isArray(weddingTemplateCatalog)
  ? weddingTemplateCatalog
  : []) as Array<{ id?: string; name?: string }>;
const DEFAULT_TEMPLATE_ID =
  TEMPLATE_LIBRARY.find((template) => typeof template?.id === "string")?.id ||
  "ethereal-classic";

const getTemplateTitle = (themeId?: string | null) => {
  const id = themeId || DEFAULT_TEMPLATE_ID;
  const fromConfig = (TEMPLATE_CONFIGS[id] as any)?.name;
  if (typeof fromConfig === "string" && fromConfig.trim()) return fromConfig;
  const fromLibrary = TEMPLATE_LIBRARY.find((template) => template?.id === id);
  if (fromLibrary && typeof fromLibrary.name === "string") {
    return fromLibrary.name.trim() || "Wedding";
  }
  return "Wedding";
};

const getCoupleNames = (partner1?: string, partner2?: string) => {
  const names = [partner1, partner2].filter(Boolean).join(" & ").trim();
  return names || "";
};

const buildDisplayTitle = (themeId?: string | null, partner1?: string, partner2?: string) => {
  const templateName = getTemplateTitle(themeId);
  const coupleNames = getCoupleNames(partner1, partner2);
  return coupleNames ? `${templateName} — ${coupleNames}` : templateName;
};

const buildDraftTitle = (themeId?: string | null, partner1?: string, partner2?: string) => {
  const base = buildDisplayTitle(themeId, partner1, partner2);
  return `${base} (draft)`;
};

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
  pacifico: {
    name: "Pacifico",
    title: '[font-family:var(--font-pacifico),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-pacifico)",
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
  alexBrush: {
    name: "Alex Brush",
    title: '[font-family:var(--font-alex-brush),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-alex-brush)",
  },
  amita: {
    name: "Amita",
    title: '[font-family:var(--font-amita),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-montserrat),_"Helvetica",_sans-serif]',
    preview: "var(--font-amita)",
  },
  arizonia: {
    name: "Arizonia",
    title: '[font-family:var(--font-arizonia),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-arizonia)",
  },
  bilbo: {
    name: "Bilbo Swash Caps",
    title:
      '[font-family:var(--font-bilbo-swash-caps),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-bilbo-swash-caps)",
  },
  cookie: {
    name: "Cookie",
    title: '[font-family:var(--font-cookie),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-cookie)",
  },
  courgette: {
    name: "Courgette",
    title: '[font-family:var(--font-courgette),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-courgette)",
  },
  euphoria: {
    name: "Euphoria Script",
    title:
      '[font-family:var(--font-euphoria-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-euphoria-script)",
  },
  herrVon: {
    name: "Herr Von Muellerhoff",
    title:
      '[font-family:var(--font-herr-von-muellerhoff),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-herr-von-muellerhoff)",
  },
  indieFlower: {
    name: "Indie Flower",
    title: '[font-family:var(--font-indie-flower),_"Comic_Sans_MS",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-indie-flower)",
  },
  italianno: {
    name: "Italianno",
    title: '[font-family:var(--font-italianno),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-italianno)",
  },
  kaushan: {
    name: "Kaushan Script",
    title:
      '[font-family:var(--font-kaushan-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-kaushan-script)",
  },
  kalam: {
    name: "Kalam",
    title: '[font-family:var(--font-kalam),_"Comic_Sans_MS",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-kalam)",
  },
  laBelleAurore: {
    name: "La Belle Aurore",
    title:
      '[font-family:var(--font-la-belle-aurore),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-la-belle-aurore)",
  },
  marckScript: {
    name: "Marck Script",
    title: '[font-family:var(--font-marck-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-marck-script)",
  },
  meieScript: {
    name: "Meie Script",
    title: '[font-family:var(--font-meie-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-meie-script)",
  },
  meddon: {
    name: "Meddon",
    title: '[font-family:var(--font-meddon),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-meddon)",
  },
  monsieur: {
    name: "Monsieur La Doulaise",
    title:
      '[font-family:var(--font-monsieur-la-doulaise),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-monsieur-la-doulaise)",
  },
  mrDeHaviland: {
    name: "Mr De Haviland",
    title:
      '[font-family:var(--font-mr-de-haviland),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-mr-de-haviland)",
  },
  mrsSaint: {
    name: "Mrs Saint Delafield",
    title:
      '[font-family:var(--font-mrs-saint-delafield),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-mrs-saint-delafield)",
  },
  mySoul: {
    name: "My Soul",
    title: '[font-family:var(--font-my-soul),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-my-soul)",
  },
  niconne: {
    name: "Niconne",
    title: '[font-family:var(--font-niconne),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-niconne)",
  },
  pinyon: {
    name: "Pinyon Script",
    title:
      '[font-family:var(--font-pinyon-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-pinyon-script)",
  },
  petitFormal: {
    name: "Petit Formal",
    title:
      '[font-family:var(--font-petit-formal-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-petit-formal-script)",
  },
  redressed: {
    name: "Redressed",
    title: '[font-family:var(--font-redressed),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-redressed)",
  },
  rouge: {
    name: "Rouge Script",
    title: '[font-family:var(--font-rouge-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-rouge-script)",
  },
  satisfy: {
    name: "Satisfy",
    title: '[font-family:var(--font-satisfy),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-satisfy)",
  },
  sacramento: {
    name: "Sacramento",
    title: '[font-family:var(--font-sacramento),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-sacramento)",
  },
  shadows: {
    name: "Shadows Into Light",
    title:
      '[font-family:var(--font-shadows-into-light),_"Comic_Sans_MS",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-shadows-into-light)",
  },
  sofia: {
    name: "Sofia",
    title: '[font-family:var(--font-sofia),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-sofia)",
  },
  sonsie: {
    name: "Sonsie One",
    title: '[font-family:var(--font-sonsie-one),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-sonsie-one)",
  },
  styleScript: {
    name: "Style Script",
    title: '[font-family:var(--font-style-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-style-script)",
  },
  tangerine: {
    name: "Tangerine",
    title: '[font-family:var(--font-tangerine),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-tangerine)",
  },
  yesteryear: {
    name: "Yesteryear",
    title: '[font-family:var(--font-yesteryear),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-yesteryear)",
  },
  yellowtail: {
    name: "Yellowtail",
    title: '[font-family:var(--font-yellowtail),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-yellowtail)",
  },
  zhiMang: {
    name: "Zhi Mang Xing",
    title:
      '[font-family:var(--font-zhi-mang-xing),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-zhi-mang-xing)",
  },
  missFajardose: {
    name: "Miss Fajardose",
    title:
      '[font-family:var(--font-miss-fajardose),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-miss-fajardose)",
  },
  stalemate: {
    name: "Stalemate",
    title: '[font-family:var(--font-stalemate),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-stalemate)",
  },
  drSugiyama: {
    name: "Dr Sugiyama",
    title: '[font-family:var(--font-dr-sugiyama),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-dr-sugiyama)",
  },
  caramel: {
    name: "Caramel",
    title: '[font-family:var(--font-caramel),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-caramel)",
  },
  kolkerBrush: {
    name: "Kolker Brush",
    title: '[font-family:var(--font-kolker-brush),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-kolker-brush)",
  },
  loveLight: {
    name: "Love Light",
    title: '[font-family:var(--font-love-light),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-love-light)",
  },
  luxuriousScript: {
    name: "Luxurious Script",
    title:
      '[font-family:var(--font-luxurious-script),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-luxurious-script)",
  },
  monteCarlo: {
    name: "Monte Carlo",
    title: '[font-family:var(--font-monte-carlo),_"Brush_Script_MT",_cursive]',
    body: '[font-family:var(--font-raleway),_"Helvetica",_sans-serif]',
    preview: "var(--font-monte-carlo)",
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

// --- EXPANDED THEME LIBRARY (Premium Wedding Styles) ---
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
    id: "dusty_blue_horizon",
    name: "Dusty Blue Horizon",
    category: "Pastel",
    graphicType: "watercolor-wash",
    bg: "bg-[#dce5ef]",
    text: "text-[#2d3c57]",
    accent: "text-[#8ba4c2]",
    previewColor: "bg-[#dce5ef]",
  },
  {
    id: "champagne_linen_frame",
    name: "Champagne Linen Frame",
    category: "Classic",
    graphicType: "frame-double",
    bg: "bg-[#f4ecde]",
    text: "text-[#4b3b26]",
    accent: "text-[#d1bd8f]",
    previewColor: "bg-[#f4ecde]",
  },
  {
    id: "lavender_garden_halo",
    name: "Lavender Garden Halo",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#eee9f7]",
    text: "text-[#4f3a6a]",
    accent: "text-[#bca9d9]",
    previewColor: "bg-[#eee9f7]",
  },
  {
    id: "rosewater_filigree",
    name: "Rosewater Filigree",
    category: "Classic",
    graphicType: "art-deco-corner",
    bg: "bg-[#f7e4e8]",
    text: "text-[#704856]",
    accent: "text-[#d3aab9]",
    previewColor: "bg-[#f7e4e8]",
  },
  {
    id: "botanical_vellum_veil",
    name: "Botanical Vellum Veil",
    category: "Pastel",
    graphicType: "leaves-corner",
    bg: "bg-[#f7f7f7]",
    text: "text-[#3a4a43]",
    accent: "text-[#8fa198]",
    previewColor: "bg-[#f7f7f7]",
  },
  {
    id: "peony_ranunculus_corners",
    name: "Peony Ranunculus Corners",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#faeee9]",
    text: "text-[#7a5143]",
    accent: "text-[#e7b7aa]",
    previewColor: "bg-[#faeee9]",
  },
  {
    id: "bluebells_wash",
    name: "Bluebells Wash",
    category: "Pastel",
    graphicType: "watercolor-wash",
    bg: "bg-[#e9f1fa]",
    text: "text-[#365072]",
    accent: "text-[#a8bede]",
    previewColor: "bg-[#e9f1fa]",
  },
  {
    id: "minimal_gold_geometry",
    name: "Minimal Gold Geometry",
    category: "Classic",
    graphicType: "geometric",
    bg: "bg-[#faf7f2]",
    text: "text-[#3b3427]",
    accent: "text-[#d5c7a8]",
    previewColor: "bg-[#faf7f2]",
  },
  {
    id: "sage_botanical_shadow",
    name: "Sage Botanical Shadow",
    category: "Pastel",
    graphicType: "vines",
    bg: "bg-[#e3e9e4]",
    text: "text-[#415044]",
    accent: "text-[#a7b6aa]",
    previewColor: "bg-[#e3e9e4]",
  },
  {
    id: "pearl_dust_elegance",
    name: "Pearl Dust Elegance",
    category: "Classic",
    graphicType: "sparkle",
    bg: "bg-[#fbfbfc]",
    text: "text-[#3b3b3d]",
    accent: "text-[#b5a894]",
    previewColor: "bg-[#fbfbfc]",
  },
  {
    id: "rose_gold_floral_ribbon",
    name: "Rose-Gold Floral Ribbon",
    category: "Pastel",
    graphicType: "sparkle-dust",
    bg: "bg-[#f7f2f1]",
    text: "text-[#7a4d46]",
    accent: "text-[#e4b8b1]",
    previewColor: "bg-[#f7f2f1]",
  },
  {
    id: "linen_wildflower_set",
    name: "Linen Wildflower Set",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#f3ede5]",
    text: "text-[#514332]",
    accent: "text-[#c1ad92]",
    previewColor: "bg-[#f3ede5]",
  },
  {
    id: "emerald_garden_crest",
    name: "Emerald Garden Crest",
    category: "Modern",
    graphicType: "frame-double",
    bg: "bg-[#0d3b32]",
    text: "text-white drop-shadow-md",
    accent: "text-[#c7b17a]",
    previewColor: "bg-[#0d3b32]",
  },
  {
    id: "terracotta_grove",
    name: "Terracotta Grove",
    category: "Modern",
    graphicType: "arch-sun",
    bg: "bg-[#e7c7b1]",
    text: "text-[#5a3826]",
    accent: "text-[#c28164]",
    previewColor: "bg-[#e7c7b1]",
  },
  {
    id: "fig_plum_velvet",
    name: "Fig & Plum Velvet",
    category: "Modern",
    graphicType: "watercolor-wash",
    bg: "bg-[#3a1f32]",
    text: "text-white drop-shadow-md",
    accent: "text-[#7d476a]",
    previewColor: "bg-[#3a1f32]",
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
  {
    id: "champagne_pampas_halo",
    name: "Champagne Pampas Halo",
    category: "Modern",
    graphicType: "dried-grass",
    bg: "bg-[#f5eee3]",
    text: "text-[#4b4033]",
    accent: "text-[#c7b596]",
    previewColor: "bg-[#f5eee3]",
  },
  {
    id: "olive_branch_horizon",
    name: "Olive Branch Horizon",
    category: "Pastel",
    graphicType: "leaves-drape",
    bg: "bg-[#efe9e0]",
    text: "text-[#4a4234]",
    accent: "text-[#bda982]",
    previewColor: "bg-[#efe9e0]",
  },
  {
    id: "blue_porcelain_bloom",
    name: "Blue Porcelain Bloom",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#f8f8fb]",
    text: "text-[#2f3f5f]",
    accent: "text-[#8193b5]",
    previewColor: "bg-[#f8f8fb]",
  },
  {
    id: "pampas_blush_horizon",
    name: "Pampas & Blush Horizon",
    category: "Pastel",
    graphicType: "dried-grass",
    bg: "bg-[#faeded]",
    text: "text-[#6e4c48]",
    accent: "text-[#ddb8b3]",
    previewColor: "bg-[#faeded]",
  },
  {
    id: "eucalyptus_crest_emblem",
    name: "Eucalyptus Crest Emblem",
    category: "Pastel",
    graphicType: "leaves-corner",
    bg: "bg-[#e7f1ec]",
    text: "text-[#3b4a44]",
    accent: "text-[#a7c4b8]",
    previewColor: "bg-[#e7f1ec]",
  },
  {
    id: "ranunculus_ribbon",
    name: "Ranunculus Ribbon",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#fdeee9]",
    text: "text-[#7c4b3f]",
    accent: "text-[#efb7a7]",
    previewColor: "bg-[#fdeee9]",
  },
  {
    id: "frosted_silver_pine",
    name: "Frosted Silver Pine",
    category: "Modern",
    graphicType: "snowflakes",
    bg: "bg-[#f4f6f8]",
    text: "text-[#2f3c4b]",
    accent: "text-[#7a8fa1]",
    previewColor: "bg-[#f4f6f8]",
  },
  {
    id: "champagne_botanical_frame",
    name: "Champagne Botanical Frame",
    category: "Classic",
    graphicType: "frame-double",
    bg: "bg-[#f7f4ed]",
    text: "text-[#4a3b2c]",
    accent: "text-[#ccb88d]",
    previewColor: "bg-[#f7f4ed]",
  },
  {
    id: "soft_blue_laurel",
    name: "Soft Blue Laurel",
    category: "Pastel",
    graphicType: "leaves-corner",
    bg: "bg-[#e8eff6]",
    text: "text-[#3f4f6a]",
    accent: "text-[#a9bed8]",
    previewColor: "bg-[#e8eff6]",
  },
  {
    id: "blush_wild_rose",
    name: "Blush Wild Rose",
    category: "Pastel",
    graphicType: "watercolor-flower",
    bg: "bg-[#f9ecec]",
    text: "text-[#7a4f4f]",
    accent: "text-[#e2b0ad]",
    previewColor: "bg-[#f9ecec]",
  },
  {
    id: "featherlight_pampas",
    name: "Featherlight Pampas",
    category: "Pastel",
    graphicType: "dried-grass",
    bg: "bg-[#f7f4f0]",
    text: "text-[#4b3c2f]",
    accent: "text-[#cebaa0]",
    previewColor: "bg-[#f7f4f0]",
  },
  {
    id: "midnight-elegance",
    name: "Midnight Elegance",
    category: "Luxury",
    graphicType: "geometric",
    bg: "bg-[#0d0f2c]",
    text: "text-white",
    accent: "text-[#c7a26b]",
    previewColor: "bg-[#0d0f2c]",
    swatchColor: "#0d0f2c",
  },
  {
    id: "newspaper-wedding",
    name: "Newspaper Wedding",
    category: "Vintage",
    graphicType: "editorial",
    bg: "bg-[#f4f4f4]",
    text: "text-black",
    accent: "text-[#000000]",
    previewColor: "bg-[#f4f4f4]",
    swatchColor: "#f4f4f4",
  },
  {
    id: "bauhaus-wedding",
    name: "Bauhaus Wedding",
    category: "Modern",
    graphicType: "geometric",
    bg: "bg-[#F0F0F0]",
    text: "text-black",
    accent: "text-[#000000]",
    previewColor: "bg-[#F0F0F0]",
    swatchColor: "#F0F0F0",
  },
  {
    id: "europe-coastal-wedding",
    name: "Europe Coastal Wedding",
    category: "Destination",
    graphicType: "waves",
    bg: "bg-white",
    text: "text-[#004B8D]",
    accent: "text-[#F4D03F]",
    previewColor: "bg-white",
    swatchColor: "#004B8D",
  },
  {
    id: "florida-coastal-wedding",
    name: "Florida Coastal Wedding",
    category: "Destination",
    graphicType: "waves",
    bg: "bg-white",
    text: "text-emerald-900",
    accent: "text-pink-500",
    previewColor: "bg-white",
    swatchColor: "#065f46",
  },
  {
    id: "california-coastal-wedding",
    name: "California Coastal Wedding",
    category: "Destination",
    graphicType: "waves",
    bg: "bg-[#F5F2EB]",
    text: "text-[#4A4A4A]",
    accent: "text-[#D4A373]",
    previewColor: "bg-[#F5F2EB]",
    swatchColor: "#D4A373",
  },
  {
    id: "winter-wedding",
    name: "Winter Wedding",
    category: "Seasonal",
    graphicType: "snowflakes",
    bg: "bg-[#1A2F25]",
    text: "text-[#E8ECEB]",
    accent: "text-[#B7410E]",
    previewColor: "bg-[#1A2F25]",
    swatchColor: "#B7410E",
  },
  {
    id: "industrial-wedding",
    name: "Industrial Wedding",
    category: "Modern",
    graphicType: "geometric",
    bg: "bg-[#1a1a1a]",
    text: "text-[#e0e0e0]",
    accent: "text-[#cd7f32]",
    previewColor: "bg-[#1a1a1a]",
    swatchColor: "#cd7f32",
  },
  {
    id: "library-wedding",
    name: "Library Wedding",
    category: "Vintage",
    graphicType: "editorial",
    bg: "bg-[#2B211E]",
    text: "text-[#D4C5B0]",
    accent: "text-[#5D2E2E]",
    previewColor: "bg-[#2B211E]",
    swatchColor: "#5D2E2E",
  },
  {
    id: "garden-wedding",
    name: "Garden Wedding",
    category: "Romantic",
    graphicType: "organic-shapes",
    bg: "bg-white",
    text: "text-slate-600",
    accent: "text-pink-500",
    previewColor: "bg-white",
    swatchColor: "#ec4899",
  },
  {
    id: "skyline-wedding",
    name: "Skyline Wedding",
    category: "Modern",
    graphicType: "city",
    bg: "bg-slate-900",
    text: "text-slate-100",
    accent: "text-orange-400",
    previewColor: "bg-slate-900",
    swatchColor: "#f97316",
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
    themeId: DEFAULT_TEMPLATE_ID,
  },
  images: {
    hero: "/templates/wedding-placeholders/midnight-bloom-hero.jpeg",
    headlineBg: "/templates/wedding-placeholders/ivory-ink-hero.jpeg",
  },
  travel: {
    hotels: [
      {
        id: 1,
        name: "The Grand Plaza Hotel",
        address: "123 Main Street, Chicago, IL 60601",
        link: "https://example.com/book",
        deadline: "2028-08-15",
      },
    ],
    airports: [
      {
        id: 1,
        name: "O'Hare International Airport",
        code: "ORD",
        distance: "25 minutes away",
      },
    ],
    directions:
      "From downtown Chicago, take Lake Shore Drive north. The venue is located on the right side, just past the marina. Free parking is available in the lot adjacent to the building. Valet parking is also available at the main entrance.",
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
  gallery: [
    {
      id: 1,
      url: "/templates/wedding-placeholders/coastal-pearl-hero.jpeg",
    },
    {
      id: 2,
      url: "/templates/wedding-placeholders/sunset-vineyard-hero.jpeg",
    },
    {
      id: 3,
      url: "/templates/wedding-placeholders/garden-atelier-hero.jpeg",
    },
  ],
  registry: [
    {
      id: 1,
      label: "Zola – Ava & Mason",
      url: "https://www.zola.com/",
    },
    {
      id: 2,
      label: "Crate & Barrel Registry",
      url: "https://www.crateandbarrel.com/",
    },
    {
      id: 3,
      label: "Honeyfund (Honeymoon)",
      url: "https://www.honeyfund.com/",
    },
  ],
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
  const search = useSearchParams();
  const router = useRouter();
  const editEventId = search?.get("edit") ?? undefined;
  const templateIdParam = search?.get("templateId") ?? undefined;
  const variationIdParam = search?.get("variationId") ?? undefined;
  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState<boolean | null>(null);
  const {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    previewTouchHandlers,
    drawerTouchHandlers,
  } = useMobileDrawer();
  const [designOpen, setDesignOpen] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const designGridRef = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
  });
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    category: "Activity",
  });
  const [activeDesignView, setActiveDesignView] = useState("themes");
  const [travelSubView, setTravelSubView] = useState("main");
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
  const [creatingDraft, setCreatingDraft] = useState(false);

  // When no editEventId is present, create a draft event_history row
  // so the builder always has an id to attach nested data (registry, etc.).
  useEffect(() => {
    if (editEventId || creatingDraft) return;

    let cancelled = false;

    (async () => {
      try {
        setCreatingDraft(true);
        const draftThemeId =
          (templateIdParam && TEMPLATE_CONFIGS[templateIdParam]
            ? templateIdParam
            : null) ||
          INITIAL_DATA.theme.themeId ||
          DEFAULT_TEMPLATE_ID;
        const draftTitle = buildDraftTitle(
          draftThemeId,
          INITIAL_DATA.partner1,
          INITIAL_DATA.partner2
        );
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: draftTitle,
            data: {
              category: "Weddings",
              createdVia: "template",
              createdManually: true,
              status: "draft",
              templateId: "wedding",
              variationId: draftThemeId,
              title: draftTitle,
              templateName: getTemplateTitle(draftThemeId),
              coupleNames: getCoupleNames(INITIAL_DATA.partner1, INITIAL_DATA.partner2),
              theme: { ...INITIAL_DATA.theme, themeId: draftThemeId },
            },
          }),
        });
        if (!res.ok) {
          return;
        }
        const row = await res.json().catch(() => null);
        const id = (row as any)?.id as string | undefined;
        if (!id || cancelled) return;

        const params = new URLSearchParams(search?.toString() || "");
        params.set("edit", id);
        // templateId/variationId are baked into the draft; keep URL clean
        params.delete("templateId");
        params.delete("variationId");
        const qs = params.toString();
        router.replace(`/event/weddings/customize${qs ? `?${qs}` : ""}`);
      } catch {
        // If draft creation fails, fall back to old behavior (create on publish)
      } finally {
        if (!cancelled) {
          setCreatingDraft(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editEventId, creatingDraft, templateIdParam, variationIdParam, search, router]);

  // When an editEventId is present, hydrate the builder from the
  // corresponding event_history row so drafts and published weddings
  // reopen with their saved content.
  useEffect(() => {
    if (!editEventId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/history/${editEventId}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const row = await res.json().catch(() => null);
        if (!row || cancelled) return;
        const payload = (row as any).data || {};

        setData((prev) => ({
          ...prev,
          partner1: payload.partner1 ?? prev.partner1,
          partner2: payload.partner2 ?? prev.partner2,
          date: payload.date ?? prev.date,
          time: payload.time ?? prev.time,
          city: payload.city ?? prev.city,
          state: payload.state ?? prev.state,
          story: payload.story ?? prev.story,
          weddingParty:
            (Array.isArray(payload.weddingParty)
              ? payload.weddingParty
              : Array.isArray(payload.party)
              ? payload.party
              : prev.weddingParty) || prev.weddingParty,
          schedule: Array.isArray(payload.schedule)
            ? payload.schedule
            : prev.schedule,
          travel: {
            ...prev.travel,
            ...(payload.travel || {}),
          },
          thingsToDo: Array.isArray(payload.thingsToDo)
            ? payload.thingsToDo
            : prev.thingsToDo,
          hosts: payload.hosts ?? prev.hosts,
          images: {
            ...prev.images,
            hero:
              payload.customHeroImage ??
              payload.images?.hero ??
              prev.images?.hero,
            headlineBg:
              payload.headlineBg ??
              payload.images?.headlineBg ??
              prev.images?.headlineBg,
          },
          gallery: Array.isArray(payload.gallery)
            ? payload.gallery
            : prev.gallery,
          registry: Array.isArray(payload.registry)
            ? payload.registry
            : Array.isArray(payload.registries)
            ? payload.registries
            : prev.registry,
          theme: {
            ...prev.theme,
            ...(payload.theme || {}),
          },
        }));
      } catch {
        // If hydration fails, keep using INITIAL_DATA defaults
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editEventId]);

  const selectedTemplate = useMemo(() => {
    const templateId = data.theme.themeId || DEFAULT_TEMPLATE_ID;
    const fromMap =
      TEMPLATE_CONFIGS[templateId] ||
      TEMPLATE_CONFIGS[DEFAULT_TEMPLATE_ID] ||
      etherealClassic;
    const chosenFont = FONTS[data.theme.font];
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
  }, [data.theme.themeId, data.theme.font]);

  const fallbackHeroImage =
    (selectedTemplate as any)?.theme?.decorations?.heroImage ||
    "/templates/wedding-placeholders/ivory-ink-hero.jpeg";

  const previewEvent = useMemo(() => {
    const location = [data.city, data.state].filter(Boolean).join(", ");
    return {
      headlineTitle:
        `${data.partner1 || ""}${
          data.partner2 ? ` & ${data.partner2}` : ""
        }`.trim() || "Your Names",
      date: data.date || "",
      location,
      story: data.story || "",
      schedule: Array.isArray(data.schedule)
        ? data.schedule.map((item) => ({
            title: item.title,
            time: item.time || item.date || "",
            location: item.location || "",
          }))
        : [],
      party: Array.isArray(data.weddingParty)
        ? data.weddingParty.map((p) => ({ name: p.name, role: p.role }))
        : [],
      travel: data.travel?.directions || "",
      thingsToDo: Array.isArray(data.thingsToDo)
        ? data.thingsToDo
            .map((t) => t.title || t.description || "")
            .filter(Boolean)
            .join(" • ")
        : "",
      photos: Array.isArray(data.gallery)
        ? data.gallery.map((g) => g.url || g.src || g.preview || "")
        : [],
      gallery: Array.isArray(data.gallery)
        ? data.gallery.map((g) => ({ url: g.url || g.src || g.preview || "" }))
        : [],
      rsvpEnabled: Boolean(
        (data as any).rsvp?.isEnabled !== false && (data as any).rsvp
      ),
      rsvpLink: (data as any).rsvp?.link || "",
      rsvp: {
        url: (data as any).rsvp?.link || "#rsvp",
        deadline: (data as any).rsvp?.deadline || undefined,
      },
      registry: Array.isArray((data as any).registry)
        ? (data as any).registry.map((r: any) => ({
            label: r.label || "Registry",
            url: r.url || "#",
          }))
        : [],
      customHeroImage: data.images?.hero || undefined,
      venue: {
        name: location,
      },
    };
  }, [data]);

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
    const items = Array.isArray(data.schedule) ? [...data.schedule] : [];
    return items.sort(
      (a, b) => parseTimeValue(a?.time) - parseTimeValue(b?.time)
    );
  }, [data.schedule]);

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = useCallback((field, value) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  }, []);

  useEffect(() => {
    if (editEventId) return;
    if (!templateIdParam) return;
    if (!TEMPLATE_CONFIGS[templateIdParam]) return;
    updateTheme("themeId", templateIdParam);
  }, [editEventId, templateIdParam, updateTheme]);

  const themeLocked = Boolean(editEventId);

  const selectTheme = useCallback(
    async (themeId: string) => {
      if (themeLocked) return;
      const previewTop = previewRef.current?.scrollTop ?? null;
      const designTop = designGridRef.current?.scrollTop ?? null;
      updateTheme("themeId", themeId);

      if (editEventId) {
        try {
          await fetch(`/api/events/${editEventId}/update-theme`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId: themeId }),
          });
        } catch (err) {
          console.error("Failed to save theme selection", err);
        }
      }

      requestAnimationFrame(() => {
        if (previewTop !== null && previewRef.current) {
          previewRef.current.scrollTo({ top: previewTop });
        }
        if (designTop !== null && designGridRef.current) {
          designGridRef.current.scrollTo({ top: designTop });
        }
      });
    },
    [editEventId]
  );

  const updateTravel = (field, value) => {
    setData((prev) => ({
      ...prev,
      travel: { ...prev.travel, [field]: value },
    }));
  };

  const buildCalendarDetails = useCallback(() => {
    const title = data.title || "Wedding Event";
    let start: Date | null = null;
    if (data.date) {
      const tentative = new Date(`${data.date}T${data.time || "16:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const location = [data.city, data.state].filter(Boolean).join(", ");
    const description = data.story || data.headline || "";
    return { title, start, end, location, description };
  }, [
    data.city,
    data.date,
    data.headline,
    data.state,
    data.story,
    data.time,
    data.title,
  ]);

  const toGoogleDate = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const buildIcsUrl = (details: ReturnType<typeof buildCalendarDetails>) => {
    const params = new URLSearchParams();
    params.set("title", details.title);
    params.set("start", details.start.toISOString());
    params.set("end", details.end.toISOString());
    if (details.location) params.set("location", details.location);
    if (details.description) params.set("description", details.description);
    params.set("disposition", "inline");
    return `/api/ics?${params.toString()}`;
  };

  const openWithAppFallback = (appUrl: string, webUrl: string) => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 700);
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", clear);
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") clear();
    });
    try {
      window.location.href = appUrl;
    } catch {
      clearTimeout(timer);
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    if (
      typeof navigator !== "undefined" &&
      (navigator as any).share &&
      shareUrl
    ) {
      (navigator as any)
        .share({
          title: details.title,
          text: details.description || details.location || details.title,
          url: shareUrl,
        })
        .catch(() => {
          window.open(shareUrl, "_blank", "noopener,noreferrer");
        });
    } else if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleGoogleCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const start = toGoogleDate(details.start);
    const end = toGoogleDate(details.end);
    const query = `action=TEMPLATE&text=${encodeURIComponent(
      details.title
    )}&dates=${start}/${end}&location=${encodeURIComponent(
      details.location
    )}&details=${encodeURIComponent(details.description || "")}`;
    const webUrl = `https://calendar.google.com/calendar/render?${query}`;
    const appUrl = `comgooglecalendar://?${query}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleOutlookCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const details = buildCalendarDetails();
    const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
      details.title
    )}&body=${encodeURIComponent(
      details.description || ""
    )}&location=${encodeURIComponent(
      details.location
    )}&startdt=${encodeURIComponent(
      details.start.toISOString()
    )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
    openWithAppFallback(appUrl, webUrl);
  };

  const handleAppleCalendar = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const icsPath = buildIcsUrl(buildCalendarDetails());
    const absolute =
      typeof window !== "undefined"
        ? `${window.location.origin}${icsPath}`
        : icsPath;
    window.location.href = absolute;
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

  // Helper to get font-family CSS value from title string
  const getTitleFontFamily = () => {
    // Extract font-family value from the title string format: [font-family:var(--font-name),_"fallback",_serif]
    const titleStr = currentFont.title;
    const match = titleStr.match(/var\(--font-[^,)]+\)/);
    if (match) {
      // Get fallback fonts from the title string (quoted font names)
      const quotedFonts =
        titleStr
          .match(/"([^"]+)"/g)
          ?.map((f) => f.replace(/"/g, "").replace(/_/g, " ")) || [];
      // Get generic font families (serif, sans-serif, cursive, etc.)
      const genericMatch = titleStr.match(/_([a-z-]+)(?:[,\]]|$)/i);
      const generic = genericMatch ? genericMatch[1] : null;

      const parts = [match[0]];
      if (quotedFonts.length > 0) {
        parts.push(...quotedFonts);
      }
      if (generic) {
        parts.push(generic);
      }
      return parts.join(", ");
    }
    // Fallback to preview if parsing fails
    return currentFont.preview;
  };

  const titleFontFamily = getTitleFontFamily();

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

  const buildHistoryPayload = useCallback(
    (status: "draft" | "published") => {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 3);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const location =
        data.city && data.state ? `${data.city}, ${data.state}` : undefined;

      const variationId = data.theme.themeId || DEFAULT_TEMPLATE_ID;
      const templateName = getTemplateTitle(variationId);
      const title =
        status === "draft"
          ? buildDraftTitle(variationId, data.partner1, data.partner2)
          : buildDisplayTitle(variationId, data.partner1, data.partner2);
      const coupleNames = getCoupleNames(data.partner1, data.partner2);

      const payload: any = {
        title,
        data: {
          category: "Weddings",
          createdVia: "template",
          createdManually: true,
          status,
          startISO,
          endISO,
          location,
          description: data.story?.text || undefined,
          rsvp: data.rsvp?.isEnabled ? data.rsvp?.deadline || "" : undefined,
          numberOfGuests: 0,
          templateId: "wedding",
          variationId,
          templateName,
          coupleNames,
          // Customization data
          partner1: data.partner1,
          partner2: data.partner2,
          date: data.date,
          time: data.time,
          city: data.city,
          state: data.state,
          story: data.story,
          party: data.party,
          schedule: data.schedule,
          travel: data.travel,
          thingsToDo: data.thingsToDo,
          hosts: data.hosts,
          theme: { ...data.theme, name: templateName },
          registries:
            data.registries
              ?.filter((r) => r?.url?.trim())
              .map((r) => ({
                label: r.label?.trim() || "Registry",
                url: r.url?.trim(),
              })) || [],
          customHeroImage: data.images?.hero || undefined,
          headlineBg: data.images?.headlineBg || undefined,
          gallery: data.gallery || [],
        },
      };

      return payload;
    },
    [data]
  );

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = buildHistoryPayload("published");
      let id: string | undefined;

      if (editEventId) {
        await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        id = editEventId;
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        const params = editEventId ? { updated: true } : { created: true };
        router.push(buildEventPath(id, payload.title, params));
      } else {
        throw new Error(
          editEventId ? "Failed to update event" : "Failed to create event"
        );
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to create event");
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }, [buildHistoryPayload, editEventId, router, submitting]);

  const handleSaveDraft = useCallback(async () => {
    if (savingDraft || submitting) return;
    setSavingDraft(true);
    try {
      const payload = buildHistoryPayload("draft");
      let id: string | undefined = editEventId;

      if (id) {
        await fetch(`/api/history/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
      } else {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        id = (body as any)?.id as string | undefined;
        if (id) {
          const params = new URLSearchParams(search?.toString() || "");
          params.set("edit", id);
          params.delete("templateId");
          params.delete("variationId");
          const qs = params.toString();
          router.replace(`/event/weddings/customize${qs ? `?${qs}` : ""}`);
        }
      }

      if (!id) {
        throw new Error("Failed to save draft");
      }
    } catch (err: any) {
      const msg = String(err?.message || err || "Failed to save draft");
      alert(msg);
    } finally {
      setSavingDraft(false);
    }
  }, [buildHistoryPayload, editEventId, router, savingDraft, search, submitting]);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6 w-full max-w-sm text-center flex-shrink-0">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your wedding website.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-sm min-h-0">
        <div className="grid grid-cols-1 gap-3 pb-4">
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

      <div className="pt-6 border-t border-slate-200 w-full max-w-sm flex-shrink-0">
        <div className="flex gap-3">
          {editEventId && (
            <button
              onClick={() => router.push(`/event/${editEventId}`)}
              className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-sm tracking-wide transition-colors shadow-sm"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-sm tracking-wide transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingDraft ? "Saving draft..." : "Save draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={submitting}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? editEventId
                ? "Saving..."
                : "Publishing..."
              : editEventId
              ? "Save"
              : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHeadlineEditor = () => (
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
      </div>
    </EditorLayout>
  );

  const renderImagesEditor = () => (
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
      </div>
    </EditorLayout>
  );

  const renderDesignEditor = () => (
    <EditorLayout title="Design" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveDesignView("themes")}
            className={`px-3 py-2 text-sm rounded-t-md ${
              activeDesignView === "themes"
                ? "bg-white border border-slate-200 border-b-white font-medium"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveDesignView("style")}
            className={`px-3 py-2 text-sm rounded-t-md ${
              activeDesignView === "style"
                ? "bg-white border border-slate-200 border-b-white font-medium"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Typography
          </button>
        </div>

        {activeDesignView === "themes" && (
          <div className="border border-slate-100 rounded-xl shadow-sm">
            {themeLocked && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50 text-slate-600 text-sm">
                <span>Theme locked after draft creation.</span>
                <Link
                  href="/event/weddings/customize"
                  className="text-indigo-600 font-semibold text-xs hover:underline"
                >
                  Create new event to try another theme
                </Link>
              </div>
            )}
            <DesignThemes
              selectedTemplateId={data.theme.themeId}
              onSelect={(id) => selectTheme(id)}
              disabled={themeLocked}
            />
          </div>
        )}

        {activeDesignView === "style" && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Typography
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(FONTS).map(([key, font]) => (
                  <button
                    key={key}
                    onClick={() => updateTheme("font", key)}
                    className={`border rounded-lg p-3 text-left transition-colors ${
                      data.theme.font === key
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div
                      className="text-base font-semibold"
                      style={{ fontFamily: font.preview }}
                    >
                      {font.name}
                    </div>
                  </button>
                ))}
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
        )}
      </div>
    </EditorLayout>
  );

  const renderScheduleEditor = () => {
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

  const renderStoryEditor = () => (
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

  const renderPhotosEditor = () => (
    <EditorLayout title="Photos" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative">
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Upload Photos
          </h3>
          <p className="text-xs text-slate-500">JPG or PNG up to 5MB</p>
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleGalleryUpload}
          />
        </div>

        {data.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {data.gallery.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url}
                  alt="Gallery"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeGalleryImage(img.id)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </EditorLayout>
  );

  const renderThingsToDoEditor = () => {
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

  const renderRsvpEditor = () => (
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

  const renderRegistryEditor = () => (
    <EditorLayout title="Registry" onBack={() => setActiveView("main")}>
      {editEventId ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-lg p-3">
            Add Amazon-style registry items to this wedding. Guests will see them on your live page.
          </div>
          <RegistryPanel eventId={editEventId} />
        </div>
      ) : (
        <div className="space-y-6 text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full mb-4">
            <Gift size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-800">
            Registry activates after your draft is created
          </h3>
          <p className="text-slate-500 text-sm px-4">
            We’ll create a draft automatically when this builder loads. If you’re seeing this message, please wait a moment and ensure your draft ID is set.
          </p>
        </div>
      )}
    </EditorLayout>
  );

  const renderTravelEditor = () => {
    const saveHotel = () => {
      if (tempHotel.name) {
        updateTravel("hotels", [
          ...data.travel.hotels,
          { ...tempHotel, id: Date.now() },
        ]);
        setTempHotel({ name: "", address: "", link: "", deadline: "" });
        setTravelSubView("main");
      }
    };

    const saveAirport = () => {
      if (tempAirport.name) {
        updateTravel("airports", [
          ...data.travel.airports,
          { ...tempAirport, id: Date.now() },
        ]);
        setTempAirport({ name: "", code: "", distance: "" });
        setTravelSubView("main");
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

    if (travelSubView === "addHotel") {
      return (
        <EditorLayout title="Add Hotel" onBack={() => setTravelSubView("main")}>
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

    if (travelSubView === "addAirport") {
      return (
        <EditorLayout
          title="Add Airport"
          onBack={() => setTravelSubView("main")}
        >
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

    if (travelSubView === "addDirections") {
      return (
        <EditorLayout
          title="Directions"
          onBack={() => setTravelSubView("main")}
        >
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
              onClick={() => setTravelSubView("addHotel")}
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
              onClick={() => setTravelSubView("addAirport")}
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
              onClick={() => setTravelSubView("addDirections")}
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

  const renderPartyEditor = () => {
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
    <div className="relative flex min-h-screen h-[100dvh] w-full bg-[#F8F5FF] font-sans text-slate-900 overflow-hidden">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-420px)] xl:max-w-[1000px] my-4 md:my-8 md:ml-auto md:mr-[420px] transition-all duration-500 ease-in-out">
          <div className="mb-6 shadow-2xl md:rounded-xl overflow-hidden">
            <WeddingRenderer template={selectedTemplate} event={previewEvent} />
          </div>
          <div
            className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${
              currentTheme.bg || "bg-white"
            } ${currentFont.body} transition-colors duration-500 relative z-0`}
            style={{ display: "none" }}
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
                <div>
                  <h1
                    className={`${currentSize.h1} mb-2 leading-tight`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
                  >
                    {data.partner1} & {data.partner2}
                  </h1>
                  <div
                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ${currentSize.body} font-medium opacity-90 ${currentFont.body} tracking-wide`}
                  >
                    <span>
                      {new Date(data.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span>{data.time}</span>
                    {(data.city || data.state) && (
                      <>
                        <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
                        <span className="md:truncate">
                          {[data.city, data.state].filter(Boolean).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const items = NAV_ITEMS.filter((item) =>
                  NAV_VISIBILITY_CHECKS[item](data)
                );
                return (
                  <nav
                    className={`px-6 md:px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 ${currentSize.nav} uppercase tracking-widest font-semibold border-b border-white/5 ${currentTheme.accent}`}
                  >
                    {items.map((item) => (
                      <span
                        key={item}
                        className="cursor-pointer hover:underline decoration-2 underline-offset-4 opacity-90 hover:opacity-100"
                        onClick={() => {
                          const editTarget = NAV_EDIT_TARGETS[item];
                          if (editTarget) setActiveView(editTarget);
                          const anchor = NAV_SCROLL_TARGETS[item];
                          if (anchor && typeof document !== "undefined") {
                            document.getElementById(anchor)?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </nav>
                );
              })()}

              <div
                id="wedding-home"
                className="relative h-[460px] md:h-[620px] w-full group cursor-default"
              >
                <img
                  src={data.images.hero || fallbackHeroImage}
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
                  id="wedding-schedule"
                  className="w-full"
                  onClick={() => setActiveView("schedule")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
                  >
                    Schedule of Events
                  </h2>
                  <div className="relative space-y-8 md:space-y-12 max-w-5xl mx-auto">
                    <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-current/30 pointer-events-none hidden md:block"></div>
                    {sortedSchedule.map((event, index) => {
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
                                className={`text-2xl md:text-3xl font-bold mb-2`}
                                style={{ fontFamily: titleFontFamily }}
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
                    {sortedSchedule.length === 0 && (
                      <div className="text-center opacity-50 italic">
                        Click to add events...
                      </div>
                    )}
                  </div>
                </section>

                {sortedSchedule.length > 0 && data.story && (
                  <DecorativeDivider themeId={data.theme.themeId} />
                )}

                <section
                  id="wedding-story"
                  className="max-w-2xl mx-auto text-center cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors -mx-4"
                  onClick={() => setActiveView("story")}
                >
                  <h2
                    className={`${currentSize.h2} mb-8 ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
                  >
                    Our Story
                  </h2>
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 ${currentFont.body} whitespace-pre-wrap`}
                  >
                    {data.story}
                  </p>
                </section>

                {data.story && data.weddingParty.length > 0 && (
                  <DecorativeDivider themeId={data.theme.themeId} />
                )}

                <section
                  id="wedding-party"
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("party")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
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

                {data.weddingParty.length > 0 && data.gallery.length > 0 && (
                  <DecorativeDivider themeId={data.theme.themeId} />
                )}

                <section
                  id="wedding-photos"
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("photos")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
                  >
                    Photos
                  </h2>
                  {data.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {data.gallery.map((img) => (
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
                  ) : (
                    <div className="text-center italic opacity-40">
                      Tap to add your favorite engagement or wedding photos.
                    </div>
                  )}
                </section>

                {data.gallery.length > 0 && data.thingsToDo.length > 0 && (
                  <DecorativeDivider themeId={data.theme.themeId} />
                )}

                <section
                  id="wedding-things"
                  className="max-w-4xl mx-auto"
                  onClick={() => setActiveView("thingsToDo")}
                >
                  <h2
                    className={`${currentSize.h2} mb-12 text-center ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
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

                {data.thingsToDo.length > 0 &&
                  (data.travel.hotels.length > 0 ||
                    data.travel.airports.length > 0 ||
                    data.travel.directions ||
                    data.travel.shuttle) && (
                    <DecorativeDivider themeId={data.theme.themeId} />
                  )}

                <section
                  id="wedding-travel"
                  className="max-w-3xl mx-auto cursor-pointer hover:bg-white/5 p-6 rounded-lg transition-colors -mx-6"
                  onClick={() => setActiveView("travel")}
                >
                  <h2
                    className={`${currentSize.h2} mb-10 text-center ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
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
                          Add lodging, airport tips, parking notes, or shuttle
                          times so guests know exactly how to arrive and where
                          to stay.
                        </p>
                      </div>
                    )}
                </section>

                <section
                  id="wedding-registry"
                  className="text-center pt-4 mt-6 border-t border-white/10 mb-5"
                  onClick={() => setActiveView("registry")}
                >
                  <h2
                    className={`text-2xl mb-4 opacity-80`}
                    style={{ fontFamily: titleFontFamily }}
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

                <section
                  id="wedding-rsvp"
                  className="w-full text-center px-3"
                  onClick={() => setActiveView("rsvp")}
                >
                  <h2
                    className={`${currentSize.h2} mb-6 ${currentTheme.accent}`}
                    style={{ ...titleColor, fontFamily: titleFontFamily }}
                  >
                    RSVP
                  </h2>
                  {data.rsvp.isEnabled ? (
                    <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
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
                              Will you be attending?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <label className="group relative cursor-pointer">
                                <input
                                  type="radio"
                                  name="wedding-rsvp"
                                  className="peer sr-only"
                                  checked={rsvpAttending === true}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setRsvpAttending(true);
                                  }}
                                />
                                <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                  <div className="mt-0.5">
                                    <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                      <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="flex items-center gap-2 font-semibold text-base">
                                      <Check
                                        size={18}
                                        className="text-current"
                                      />
                                      Yes, I'll be there!
                                    </div>
                                    <p className="text-sm opacity-70">
                                      Ready to celebrate with you.
                                    </p>
                                  </div>
                                </div>
                              </label>
                              <label className="group relative cursor-pointer">
                                <input
                                  type="radio"
                                  name="wedding-rsvp"
                                  className="peer sr-only"
                                  checked={rsvpAttending === false}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setRsvpAttending(false);
                                  }}
                                />
                                <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                  <div className="mt-0.5">
                                    <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                      <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                  <div className="text-left">
                                    <div className="flex items-center gap-2 font-semibold text-base">
                                      <XIcon
                                        size={18}
                                        className="text-current"
                                      />
                                      Sorry, can't make it
                                    </div>
                                    <p className="text-sm opacity-70">
                                      Sending love from afar.
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (rsvpAttending !== null) {
                                setRsvpSubmitted(true);
                              }
                            }}
                            disabled={rsvpAttending === null}
                            className={`w-full py-4 mt-2 font-bold uppercase tracking-widest text-sm rounded-lg transition-colors shadow-lg ${
                              rsvpAttending !== null
                                ? "bg-white text-slate-900 hover:bg-slate-200"
                                : "bg-white/20 text-white/50 cursor-not-allowed"
                            }`}
                          >
                            Send RSVP
                          </button>

                          <div className="mt-4 flex flex-wrap gap-3 justify-center">
                            <button
                              onClick={handleShare}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Share2 size={16} />
                              <span className="hidden sm:inline">
                                Share link
                              </span>
                            </button>
                            <button
                              onClick={handleGoogleCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Image
                                src="/brands/google-white.svg"
                                alt="Google"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                              <span className="hidden sm:inline">
                                Google Cal
                              </span>
                            </button>
                            <button
                              onClick={handleAppleCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Image
                                src="/brands/apple-white.svg"
                                alt="Apple"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                              <span className="hidden sm:inline">
                                Apple Cal
                              </span>
                            </button>
                            <button
                              onClick={handleOutlookCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Image
                                src="/brands/microsoft-white.svg"
                                alt="Microsoft"
                                width={16}
                                height={16}
                                className="w-4 h-4"
                              />
                              <span className="hidden sm:inline">Outlook</span>
                            </button>
                          </div>
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
                              setRsvpAttending(null);
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

                <footer className="text-center py-8 border-t border-white/10 mt-1">
                  <a
                    href="https://envitefy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="space-y-1 inline-block no-underline"
                  >
                    <p className="text-sm opacity-60">
                      Powered By Envitefy. Creat. Share. Enjoy.
                    </p>
                    <p className="text-xs opacity-50">Create yours now.</p>
                  </a>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <a
                      href="https://www.facebook.com/envitefy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Facebook"
                    >
                      <Image
                        src="/email/social-facebook.svg"
                        alt="Facebook"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </a>
                    <a
                      href="https://www.instagram.com/envitefy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="Instagram"
                    >
                      <Image
                        src="/email/social-instagram.svg"
                        alt="Instagram"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </a>
                    <a
                      href="https://www.tiktok.com/@envitefy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="TikTok"
                    >
                      <Image
                        src="/email/social-tiktok.svg"
                        alt="TikTok"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </a>
                    <a
                      href="https://www.youtube.com/@Envitefy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      aria-label="YouTube"
                    >
                      <Image
                        src="/email/social-youtube.svg"
                        alt="YouTube"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                    </a>
                  </div>
                </footer>
              </div>
            </div>
          </div>
          <div className="h-20"></div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
          onClick={closeMobileMenu}
          role="presentation"
        ></div>
      )}

      <div
        className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:fixed top-0 right-0 h-screen transition-transform duration-300 transform md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        {...drawerTouchHandlers}
      >
        <ScrollHandoffContainer className="flex-1">
          {mobileMenuOpen && (
            <div className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
              <button
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1"
              >
                <ChevronLeft size={14} />
                Back to preview
              </button>
              <span className="text-sm font-semibold text-slate-700">
                Customize
              </span>
            </div>
          )}
          <div
            className={`p-6 pt-4 md:pt-6 ${
              activeView === "main" ? "h-full flex flex-col" : ""
            }`}
          >
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "schedule" && renderScheduleEditor()}
            {activeView === "story" && renderStoryEditor()}
            {activeView === "party" && renderPartyEditor()}
            {activeView === "photos" && renderPhotosEditor()}
            {activeView === "travel" && renderTravelEditor()}
            {activeView === "thingsToDo" && renderThingsToDoEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "registry" && renderRegistryEditor()}
          </div>
        </ScrollHandoffContainer>
      </div>

      {!mobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg"
          >
            <Edit2 size={18} />
            Edit
          </button>
        </div>
      )}
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

// Decorative divider component - different styles per theme
const DecorativeDivider = ({ themeId }) => {
  const getDividerStyle = () => {
    const dividers = {
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
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
      />
    </div>
  );
};

export default App;
