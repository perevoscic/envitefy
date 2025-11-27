// @ts-nocheck
"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  memo,
  useEffect,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Image as ImageIcon,
  Menu,
  Palette,
  Type,
  Upload,
  CheckSquare,
  Share2,
  Calendar as CalendarIcon,
  Apple,
  MapPin,
  Clock,
  Users,
  Trash2,
} from "lucide-react";
import ScrollBoundary from "@/components/ScrollBoundary";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";

// Google Fonts URL for all special event fonts
const SPECIAL_EVENTS_GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@400;600;700&family=League+Spartan:wght@600;700&family=Inter+Tight:wght@500;600;700&family=Archivo+Black&family=Alfa+Slab+One&family=Bungee+Shade&family=Patua+One&family=Rubik+Mono+One&family=Exo+2:wght@500;600;700&family=Archivo:wght@500;600;700&family=Teko:wght@500;700&family=Barlow+Condensed:wght@500;600;700&family=Maven+Pro:wght@500;600;700&family=Righteous&family=Black+Ops+One&family=Press+Start+2P&family=Ultra&family=Comfortaa:wght@500;600;700&family=Varela+Round&family=Saira+Semi+Condensed:wght@500;600;700&family=Fjalla+One&family=Changa+One&family=Jomhuria&family=Russo+One&family=Titillium+Web:wght@600;700&family=Staatliches&family=Lilita+One&family=Amatic+SC:wght@700&display=swap`;

const FONTS = {
  bebasNeue: {
    name: "Bebas Neue",
    title: `'Bebas Neue', 'Impact', 'Arial Black', sans-serif`,
    body: `'Bebas Neue', 'Oswald', 'Arial Narrow', sans-serif`,
    preview: "'Bebas Neue', 'Impact', 'Arial Black', sans-serif",
  },
  anton: {
    name: "Anton",
    title: `'Anton', 'Impact', 'Arial Black', sans-serif`,
    body: `'Anton', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Anton', 'Impact', 'Arial Black', sans-serif",
  },
  oswald: {
    name: "Oswald",
    title: ` 'Oswald', 'Bebas Neue', 'Roboto Condensed', sans-serif`,
    body: ` 'Oswald', 'Bebas Neue', 'Roboto Condensed', sans-serif`,
    preview: "'Oswald', 'Bebas Neue', 'Roboto Condensed', sans-serif",
  },
  leagueSpartan: {
    name: "League Spartan",
    title: ` 'League Spartan', 'Montserrat', 'Arial Black', sans-serif`,
    body: ` 'League Spartan', 'Montserrat', 'Arial Black', sans-serif`,
    preview: "'League Spartan', 'Montserrat', 'Arial Black', sans-serif",
  },
  interTight: {
    name: "Inter Tight",
    title: ` 'Inter Tight', 'Inter', 'Helvetica', sans-serif`,
    body: ` 'Inter Tight', 'Inter', 'Helvetica', sans-serif`,
    preview: "'Inter Tight', 'Inter', 'Helvetica', sans-serif",
  },
  archivoBlack: {
    name: "Archivo Black",
    title: ` 'Archivo Black', 'Impact', 'Anton', sans-serif`,
    body: ` 'Archivo Black', 'Impact', 'Anton', sans-serif`,
    preview: "'Archivo Black', 'Impact', 'Anton', sans-serif",
  },
  alfaSlabOne: {
    name: "Alfa Slab One",
    title: ` 'Alfa Slab One', 'Impact', 'Arial Black', sans-serif`,
    body: ` 'Alfa Slab One', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Alfa Slab One', 'Impact', 'Arial Black', sans-serif",
  },
  bungeeShade: {
    name: "Bungee Shade",
    title: ` 'Bungee Shade', 'Bungee', 'Impact', sans-serif`,
    body: ` 'Bungee Shade', 'Bungee', 'Impact', sans-serif`,
    preview: "'Bungee Shade', 'Bungee', 'Impact', sans-serif",
  },
  patuaOne: {
    name: "Patua One",
    title: ` 'Patua One', 'Georgia', serif`,
    body: ` 'Patua One', 'Georgia', serif`,
    preview: "'Patua One', 'Georgia', serif",
  },
  rubikMonoOne: {
    name: "Rubik Mono One",
    title: ` 'Rubik Mono One', 'Courier New', monospace`,
    body: ` 'Rubik Mono One', 'Courier New', monospace`,
    preview: "'Rubik Mono One', 'Courier New', monospace",
  },
  exo2: {
    name: "Exo 2",
    title: ` 'Exo 2', 'Helvetica', sans-serif`,
    body: ` 'Exo 2', 'Helvetica', sans-serif`,
    preview: "'Exo 2', 'Helvetica', sans-serif",
  },
  archivo: {
    name: "Archivo",
    title: ` 'Archivo', 'Helvetica', sans-serif`,
    body: ` 'Archivo', 'Helvetica', sans-serif`,
    preview: "'Archivo', 'Helvetica', sans-serif",
  },
  teko: {
    name: "Teko",
    title: ` 'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif`,
    body: ` 'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif`,
    preview: "'Teko', 'Bebas Neue', 'Arial Narrow', sans-serif",
  },
  barlowCondensed: {
    name: "Barlow Condensed",
    title: ` 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif`,
    body: ` 'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif`,
    preview:
      "'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif",
  },
  mavenPro: {
    name: "Maven Pro",
    title: ` 'Maven Pro', 'Helvetica', sans-serif`,
    body: ` 'Maven Pro', 'Helvetica', sans-serif`,
    preview: "'Maven Pro', 'Helvetica', sans-serif",
  },
  righteous: {
    name: "Righteous",
    title: ` 'Righteous', 'Impact', 'Arial Black', sans-serif`,
    body: ` 'Righteous', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Righteous', 'Impact', 'Arial Black', sans-serif",
  },
  blackOpsOne: {
    name: "Black Ops One",
    title: ` 'Black Ops One', 'Russo One', 'Anton', sans-serif`,
    body: ` 'Black Ops One', 'Russo One', 'Anton', sans-serif`,
    preview: "'Black Ops One', 'Russo One', 'Anton', sans-serif",
  },
  pressStart2P: {
    name: "Press Start 2P",
    title: ` 'Press Start 2P', 'Courier New', monospace`,
    body: ` 'Press Start 2P', 'Courier New', monospace`,
    preview: "'Press Start 2P', 'Courier New', monospace",
  },
  ultra: {
    name: "Ultra",
    title: ` 'Ultra', 'Georgia', serif`,
    body: ` 'Ultra', 'Georgia', serif`,
    preview: "'Ultra', 'Georgia', serif",
  },
  comfortaa: {
    name: "Comfortaa",
    title: ` 'Comfortaa', 'Helvetica', sans-serif`,
    body: ` 'Comfortaa', 'Helvetica', sans-serif`,
    preview: "'Comfortaa', 'Helvetica', sans-serif",
  },
  varelaRound: {
    name: "Varela Round",
    title: ` 'Varela Round', 'Helvetica', sans-serif`,
    body: ` 'Varela Round', 'Helvetica', sans-serif`,
    preview: "'Varela Round', 'Helvetica', sans-serif",
  },
  sairaSemiCondensed: {
    name: "Saira Semi Condensed",
    title: ` 'Saira Semi Condensed', 'Helvetica', sans-serif`,
    body: ` 'Saira Semi Condensed', 'Helvetica', sans-serif`,
    preview: "'Saira Semi Condensed', 'Helvetica', sans-serif",
  },
  fjallaOne: {
    name: "Fjalla One",
    title: ` 'Fjalla One', 'Helvetica', sans-serif`,
    body: ` 'Fjalla One', 'Helvetica', sans-serif`,
    preview: "'Fjalla One', 'Helvetica', sans-serif",
  },
  changaOne: {
    name: "Changa One",
    title: ` 'Changa One', 'Impact', 'Arial Black', sans-serif`,
    body: ` 'Changa One', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Changa One', 'Impact', 'Arial Black', sans-serif",
  },
  jomhuria: {
    name: "Jomhuria",
    title: ` 'Jomhuria', 'Georgia', serif`,
    body: ` 'Jomhuria', 'Georgia', serif`,
    preview: "'Jomhuria', 'Georgia', serif",
  },
  russoOne: {
    name: "Russo One",
    title: ` 'Russo One', 'Anton', 'Impact', sans-serif`,
    body: ` 'Russo One', 'Anton', 'Impact', sans-serif`,
    preview: "'Russo One', 'Anton', 'Impact', sans-serif",
  },
  titilliumWeb: {
    name: "Titillium Web",
    title: ` 'Titillium Web', 'Helvetica', sans-serif`,
    body: ` 'Titillium Web', 'Helvetica', sans-serif`,
    preview: "'Titillium Web', 'Helvetica', sans-serif",
  },
  staatliches: {
    name: "Staatliches",
    title: ` 'Staatliches', 'Impact', 'Arial Black', sans-serif`,
    body: ` 'Staatliches', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Staatliches', 'Impact', 'Arial Black', sans-serif",
  },
  lilitaOne: {
    name: "Lilita One",
    title: ` 'Lilita One', 'Impact', 'Arial Black', sans-serif`,
    body: ` 'Lilita One', 'Impact', 'Arial Black', sans-serif`,
    preview: "'Lilita One', 'Impact', 'Arial Black', sans-serif",
  },
  amaticSC: {
    name: "Amatic SC",
    title: ` 'Amatic SC', 'Brush Script MT', cursive`,
    body: ` 'Amatic SC', 'Brush Script MT', cursive`,
    preview: "'Amatic SC', 'Brush Script MT', cursive",
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
    id: "bebas_vip",
    name: "VIP / Concert / Posters",
    category: "Bold",
    bg: "bg-[#1A1A1A]",
    text: "text-white",
    accent: "text-[#FFD369]",
    previewColor: "bg-gradient-to-r from-[#1A1A1A] via-[#EE5230] to-[#FFD369]",
  },
  {
    id: "anton_sports",
    name: "Sports / Strong Events",
    category: "Bold",
    bg: "bg-[#2C2C2C]",
    text: "text-white",
    accent: "text-[#FF4C29]",
    previewColor: "bg-gradient-to-r from-[#2C2C2C] via-[#F9D342] to-[#FF4C29]",
  },
  {
    id: "oswald_general",
    name: "General Purpose Event",
    category: "Modern",
    bg: "bg-[#111111]",
    text: "text-white",
    accent: "text-[#24A19C]",
    previewColor: "bg-gradient-to-r from-[#111111] via-[#F7E9D7] to-[#24A19C]",
  },
  {
    id: "league_corporate",
    name: "Corporate / Banquet",
    category: "Professional",
    bg: "bg-[#0F0F0F]",
    text: "text-white",
    accent: "text-[#B8B5FF]",
    previewColor: "bg-gradient-to-r from-[#0F0F0F] via-[#9381FF] to-[#FFD6FF]",
  },
  {
    id: "inter_modern",
    name: "Modern Special Events",
    category: "Modern",
    bg: "bg-[#1B1B1B]",
    text: "text-white",
    accent: "text-[#4D96FF]",
    previewColor: "bg-gradient-to-r from-[#1B1B1B] via-[#6BCB77] to-[#FFD93D]",
  },
  {
    id: "archivo_festival",
    name: "Block Party / Festival",
    category: "Festive",
    bg: "bg-[#202020]",
    text: "text-white",
    accent: "text-[#FFC75F]",
    previewColor: "bg-gradient-to-r from-[#202020] via-[#FF9671] to-[#FF6F91]",
  },
  {
    id: "alfa_oktoberfest",
    name: "BeerFest / Oktoberfest",
    category: "Festive",
    bg: "bg-[#2D1810]",
    text: "text-white",
    accent: "text-[#E3B23C]",
    previewColor: "bg-gradient-to-r from-[#2D1810] via-[#8A5A44] to-[#F2E9CE]",
  },
  {
    id: "bungee_carnival",
    name: "Carnival / Fun Fest",
    category: "Festive",
    bg: "bg-[#1A1A40]",
    text: "text-white",
    accent: "text-[#FFC300]",
    previewColor: "bg-gradient-to-r from-[#1A1A40] via-[#FF5733] to-[#C70039]",
  },
  {
    id: "patua_harvest",
    name: "Fall Events / Harvest Fest",
    category: "Seasonal",
    bg: "bg-[#382923]",
    text: "text-white",
    accent: "text-[#F4EBD0]",
    previewColor: "bg-gradient-to-r from-[#382923] via-[#D4A373] to-[#BC6C25]",
  },
  {
    id: "rubik_tech",
    name: "Tech Nights / STEM Events",
    category: "Modern",
    bg: "bg-[#212529]",
    text: "text-white",
    accent: "text-[#00E0FF]",
    previewColor: "bg-gradient-to-r from-[#212529] via-[#0081A7] to-[#FED9B7]",
  },
  {
    id: "exo_fundraiser",
    name: "Business & Fundraisers",
    category: "Professional",
    bg: "bg-[#1C1C1C]",
    text: "text-white",
    accent: "text-[#AA8F66]",
    previewColor: "bg-gradient-to-r from-[#1C1C1C] via-[#D9CAB3] to-[#F7F3E3]",
  },
  {
    id: "archivo_allpurpose",
    name: "All-Purpose Events",
    category: "Versatile",
    bg: "bg-[#0F0F0F]",
    text: "text-white",
    accent: "text-[#81B29A]",
    previewColor: "bg-gradient-to-r from-[#0F0F0F] via-[#F2CC8F] to-[#E07A5F]",
  },
  {
    id: "teko_races",
    name: "Races / Competitions",
    category: "Sports",
    bg: "bg-[#000000]",
    text: "text-white",
    accent: "text-[#FF1E00]",
    previewColor: "bg-gradient-to-r from-[#000000] via-[#FF8C32] to-[#D9D9D9]",
  },
  {
    id: "barlow_community",
    name: "Community Events",
    category: "Community",
    bg: "bg-[#222831]",
    text: "text-white",
    accent: "text-[#00ADB5]",
    previewColor: "bg-gradient-to-r from-[#222831] via-[#F8B500] to-[#F9F7F7]",
  },
  {
    id: "maven_senior",
    name: "Senior Center / Adult Events",
    category: "Community",
    bg: "bg-[#2F2F2F]",
    text: "text-white",
    accent: "text-[#FFCB77]",
    previewColor: "bg-gradient-to-r from-[#2F2F2F] via-[#94D2BD] to-[#EE9B00]",
  },
  {
    id: "righteous_retro",
    name: "Retro / School Dance / Neon Night",
    category: "Retro",
    bg: "bg-[#1B1F3B]",
    text: "text-white",
    accent: "text-[#E43F6F]",
    previewColor: "bg-gradient-to-r from-[#1B1F3B] via-[#FB8B24] to-[#E8E9EB]",
  },
  {
    id: "blackops_security",
    name: "Police Night / Military / Security Events",
    category: "Professional",
    bg: "bg-[#101820]",
    text: "text-white",
    accent: "text-[#FEE715]",
    previewColor: "bg-gradient-to-r from-[#101820] via-[#B2B1B9] to-[#666A86]",
  },
  {
    id: "pressstart_gaming",
    name: "Gaming Night / Arcade",
    category: "Gaming",
    bg: "bg-[#000000]",
    text: "text-white",
    accent: "text-[#00FF00]",
    previewColor: "bg-gradient-to-r from-[#000000] via-[#F72585] to-[#B5179E]",
  },
  {
    id: "ultra_heritage",
    name: "Heritage / Vintage / Local Fairs",
    category: "Vintage",
    bg: "bg-[#3D2F2F]",
    text: "text-white",
    accent: "text-[#D5A253]",
    previewColor: "bg-gradient-to-r from-[#3D2F2F] via-[#F2DDA4] to-[#F7E3C3]",
  },
  {
    id: "comfortaa_family",
    name: "Family Day / Open House",
    category: "Family",
    bg: "bg-[#303841]",
    text: "text-white",
    accent: "text-[#00ADB5]",
    previewColor: "bg-gradient-to-r from-[#303841] via-[#AAD8D3] to-[#EEEEEE]",
  },
  {
    id: "varela_school",
    name: "School / PTA Events",
    category: "Education",
    bg: "bg-[#2E2E2E]",
    text: "text-white",
    accent: "text-[#C4FFF9]",
    previewColor: "bg-gradient-to-r from-[#2E2E2E] via-[#9DFFF9] to-[#89DAFF]",
  },
  {
    id: "saira_theater",
    name: "Theater Night / Awards",
    category: "Arts",
    bg: "bg-[#1E1E1E]",
    text: "text-white",
    accent: "text-[#DAA520]",
    previewColor: "bg-gradient-to-r from-[#1E1E1E] via-[#F4EBD0] to-[#463F3A]",
  },
  {
    id: "fjalla_civic",
    name: "Town Hall / Civic Events",
    category: "Civic",
    bg: "bg-[#232931]",
    text: "text-white",
    accent: "text-[#4ECCA3]",
    previewColor: "bg-gradient-to-r from-[#232931] via-[#A6E3E9] to-[#F3FFE3]",
  },
  {
    id: "changa_parade",
    name: "Street Fair / Parade",
    category: "Festive",
    bg: "bg-[#2B2E4A]",
    text: "text-white",
    accent: "text-[#E84545]",
    previewColor: "bg-gradient-to-r from-[#2B2E4A] via-[#903749] to-[#53354A]",
  },
  {
    id: "jomhuria_cultural",
    name: "Cultural Nights / International Fest",
    category: "Cultural",
    bg: "bg-[#2C061F]",
    text: "text-white",
    accent: "text-[#F5B971]",
    previewColor: "bg-gradient-to-r from-[#2C061F] via-[#FFDD99] to-[#FCECC9]",
  },
  {
    id: "russo_auto",
    name: "Auto Show / Competition Events",
    category: "Competition",
    bg: "bg-[#1E1E1E]",
    text: "text-white",
    accent: "text-[#FF1B1C]",
    previewColor: "bg-gradient-to-r from-[#1E1E1E] via-[#F5F3F4] to-[#A4161A]",
  },
  {
    id: "titillium_academic",
    name: "Academic / Professional Events",
    category: "Academic",
    bg: "bg-[#1A1A1A]",
    text: "text-white",
    accent: "text-[#A8DADC]",
    previewColor: "bg-gradient-to-r from-[#1A1A1A] via-[#457B9D] to-[#E63946]",
  },
  {
    id: "staatliches_museum",
    name: "Museum / Art Exhibition",
    category: "Arts",
    bg: "bg-[#11151C]",
    text: "text-white",
    accent: "text-[#FFD447]",
    previewColor: "bg-gradient-to-r from-[#11151C] via-[#F7F4EA] to-[#7997A1]",
  },
  {
    id: "lilita_festival",
    name: "Festivals / Family Fun Days",
    category: "Festive",
    bg: "bg-[#2D3142]",
    text: "text-white",
    accent: "text-[#EF8354]",
    previewColor: "bg-gradient-to-r from-[#2D3142] via-[#F9DC5C] to-[#4F5D75]",
  },
  {
    id: "amatic_artfair",
    name: "Art Fair / Handmade Market",
    category: "Arts",
    bg: "bg-[#3D405B]",
    text: "text-white",
    accent: "text-[#F2CC8F]",
    previewColor: "bg-gradient-to-r from-[#3D405B] via-[#E07A5F] to-[#81B29A]",
  },
];

const InputGroup = memo(
  ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  ),
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // Note: onChange is excluded from comparison since parent creates new functions on each render
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.readOnly === nextProps.readOnly
    );
  }
);

InputGroup.displayName = "InputGroup";

const MenuCard = ({ title, icon, desc, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
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
        className="mr-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={20} className="text-slate-600" />
      </button>
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
    </div>
    {children}
  </div>
);

export default function SpecialEventsCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;

  const initialDate = useMemo(() => {
    if (!defaultDate) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    }
    try {
      const d = new Date(defaultDate);
      return Number.isNaN(d.getTime())
        ? new Date().toISOString().split("T")[0]
        : d.toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }, [defaultDate]);

  const [data, setData] = useState(() => ({
    title: "Father-Daughter Dance",
    date: initialDate,
    time: "18:00",
    city: "Chicago",
    state: "IL",
    venue: "",
    address: "",
    details:
      "Join us for an elegant evening celebrating the special bond between fathers and daughters. An unforgettable night of dancing, dining, and creating cherished memories.",
    hero: "",
    rsvpEnabled: true,
    rsvpDeadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().split("T")[0];
    })(),
    extra: {
      occasion: "VIP Father-Daughter Dance",
      host: "",
      dress: "Formal / Black Tie Optional",
      schedule:
        "6:00 PM - Photo Opportunities and Games\n7:00 PM - Dinner\n8:00 PM - Dancing\n9:30 PM - Dessert",
      parking: "Valet parking available at main entrance",
      contact: "",
      tickets: "",
    },
    sponsors: [],
    theme: {
      themeId: DESIGN_THEMES[0]?.id || "bebas_vip",
      font: "bebasNeue",
      fontSize: "medium",
    },
  }));

  // Load Google Fonts dynamically
  useEffect(() => {
    let link =
      document.querySelector<HTMLLinkElement>(
        'link[data-special-events-fonts="true"]'
      ) || null;
    let added = false;

    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-special-events-fonts", "true");
      added = true;
    }

    link.href = SPECIAL_EVENTS_GOOGLE_FONTS_URL;

    if (added) {
      document.head.appendChild(link);
    }

    return () => {
      if (added && link?.parentElement) {
        link.parentElement.removeChild(link);
      }
    };
  }, []);

  const [activeView, setActiveView] = useState("main");
  const [submitting, setSubmitting] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState("yes");
  const designGridRef = useRef<HTMLDivElement | null>(null);
  const {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    previewTouchHandlers,
    drawerTouchHandlers,
  } = useMobileDrawer();
  const buildCalendarDetails = () => {
    const title = data.title || "Special Event";
    let start: Date | null = null;
    if (data.date) {
      const tentative = new Date(`${data.date}T${data.time || "14:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const location = [data.venue, data.city, data.state]
      .filter(Boolean)
      .join(", ");
    const description = data.details || "";
    return { title, start, end, location, description };
  };

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

  const updateData = useCallback((field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateExtra = useCallback((key: string, value: string) => {
    setData((prev) => ({
      ...prev,
      extra: { ...prev.extra, [key]: value },
    }));
  }, []);

  const updateTheme = useCallback((field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  }, []);

  const selectTheme = (themeId: string) => {
    updateTheme("themeId", themeId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateData("hero", url);
    }
  };

  const currentTheme =
    DESIGN_THEMES.find((t) => t.id === data.theme.themeId) || DESIGN_THEMES[0];
  const currentFont = FONTS[data.theme.font] || FONTS.bebasNeue;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

  // Detect dark/light background for proper color contrast
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
      "cyan-9",
      "red-9",
      "rose-9",
      "pink-9",
      "fuchsia-9",
      "amber-9",
      "orange-9",
      "yellow-7",
      "navy",
      "midnight",
      "950",
      "900",
      "800",
      "700",
    ];
    const lightTokens = [
      "white",
      "slate-50",
      "slate-100",
      "stone-50",
      "stone-100",
      "neutral-50",
      "neutral-100",
      "gray-50",
      "gray-100",
      "amber-50",
      "amber-100",
      "yellow-50",
      "yellow-100",
      "orange-50",
      "orange-100",
      "rose-50",
      "rose-100",
      "pink-50",
      "pink-100",
      "violet-50",
      "violet-100",
      "purple-50",
      "purple-100",
      "emerald-50",
      "emerald-100",
      "teal-50",
      "teal-100",
    ];

    // If explicitly light, return false
    if (lightTokens.some((token) => bg.includes(token))) {
      return false;
    }
    // Otherwise check for dark tokens
    return darkTokens.some((token) => bg.includes(token));
  }, [currentTheme]);

  const isLightBackground = !isDarkBackground;

  // Title color: light cream for dark backgrounds, dark for light backgrounds
  const titleColor = isDarkBackground
    ? { color: "#f5e6d3" }
    : isLightBackground
    ? { color: "#1e293b" }
    : undefined;

  // Text class - ALWAYS ensure proper contrast based on background
  // Force correct text color regardless of theme setting
  const textClass = isDarkBackground ? "text-white" : "text-slate-900";
  // Use theme accent if available, but ensure it has proper contrast
  const accentClass = isDarkBackground
    ? currentTheme?.accent || "text-white"
    : currentTheme?.accent || "text-slate-700";

  // Adaptive styling for light/dark backgrounds
  const sectionBorder = isDarkBackground
    ? "border-white/10"
    : "border-slate-200/50";

  // Extract background color from theme - prioritize via color from gradient for better visual representation
  const backgroundColor = useMemo(() => {
    if (!currentTheme) return "#ffffff";

    // Try to extract the "via" color from previewColor gradient (middle color, usually the most vibrant)
    if (currentTheme.previewColor) {
      const viaMatch = currentTheme.previewColor.match(
        /via-\[#([0-9A-Fa-f]{3,6})\]/
      );
      if (viaMatch) {
        const hex = viaMatch[1];
        if (hex.length === 3) {
          return `#${hex
            .split("")
            .map((c) => c + c)
            .join("")}`;
        }
        return `#${hex}`;
      }
      // Fallback to "from" color if no "via" found
      const fromMatch = currentTheme.previewColor.match(
        /from-\[#([0-9A-Fa-f]{3,6})\]/
      );
      if (fromMatch) {
        const hex = fromMatch[1];
        if (hex.length === 3) {
          return `#${hex
            .split("")
            .map((c) => c + c)
            .join("")}`;
        }
        return `#${hex}`;
      }
    }

    // Fallback to bg property
    if (currentTheme.bg) {
      const match = currentTheme.bg.match(/bg-\[#([0-9A-Fa-f]{3,6})\]/);
      if (match) {
        const hex = match[1];
        if (hex.length === 3) {
          return `#${hex
            .split("")
            .map((c) => c + c)
            .join("")}`;
        }
        return `#${hex}`;
      }
    }

    return "#ffffff";
  }, [currentTheme?.id, currentTheme?.bg, currentTheme?.previewColor]);
  const detailsBoxBg = isDarkBackground
    ? "bg-white/5 border-white/10 hover:bg-white/10"
    : "bg-slate-900/5 border-slate-200/50 hover:bg-slate-900/10";
  const timelineCircleBorder = isDarkBackground
    ? "border-white"
    : "border-slate-900";
  const timeBubbleBg = isDarkBackground ? "bg-white/90" : "bg-slate-50/90";
  const timeBubbleBorder = isDarkBackground
    ? "border-current/30"
    : "border-slate-300/50";

  // RSVP box styling - adapt to light/dark backgrounds
  const rsvpBoxBg = isDarkBackground
    ? "bg-white/5 border-white/10"
    : "bg-slate-900/5 border-slate-200/50";
  const rsvpInputBg = isDarkBackground
    ? "bg-white/10 border-white/20 focus:border-white/50"
    : "bg-slate-900/10 border-slate-300/50 focus:border-slate-400";
  const rsvpCardBg = isDarkBackground
    ? "border-white/20 bg-white/10 hover:bg-white/20 peer-checked:bg-white/25"
    : "border-slate-300/50 bg-slate-900/10 hover:bg-slate-900/20 peer-checked:bg-slate-900/25";
  const rsvpButtonBg = isDarkBackground
    ? "bg-white text-slate-900 hover:bg-slate-200"
    : "bg-slate-900 text-white hover:bg-slate-800";
  const shareButtonBg = isDarkBackground
    ? "border-white/20 bg-white/10 hover:bg-white/20"
    : "border-slate-300/50 bg-slate-900/10 hover:bg-slate-900/20";

  const locationParts = [data.venue, data.address, data.city, data.state]
    .filter(Boolean)
    .join(", ");

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 2);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const payload: any = {
        title: data.title || "Special Event",
        data: {
          category: "special_events",
          createdVia: "template",
          createdManually: true,
          startISO,
          endISO,
          location: locationParts || undefined,
          venue: data.venue || undefined,
          address: data.address || undefined,
          description: data.details || undefined,
          rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
          numberOfGuests: 0,
          templateId: "special-event",
          customFields: data.extra,
          sponsors: data.sponsors || [],
          heroImage:
            data.hero || "/templates/hero-images/father-daughter-hero.jpeg",
          theme: data.theme,
        },
      };

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
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        id = (json as any)?.id as string | undefined;
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
  }, [submitting, data, editEventId, router, locationParts]);

  // Filter out unwanted categories and get flat list of themes
  const availableThemes = useMemo(() => {
    return DESIGN_THEMES.filter(
      (theme) => theme.category !== "Versatile" && theme.category !== "Sports"
    );
  }, []);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your VIP father-daughter dance event.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Title, date, location."
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
          title="Details"
          icon={<Edit2 size={18} />}
          desc="Venue, dress code, schedule, parking."
          onClick={() => setActiveView("details")}
        />
        <MenuCard
          title="Sponsors"
          icon={<Users size={18} />}
          desc="Add sponsor logos and categories."
          onClick={() => setActiveView("sponsors")}
        />
        <MenuCard
          title="RSVP"
          icon={<CheckSquare size={18} />}
          desc="RSVP settings."
          onClick={() => setActiveView("rsvp")}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
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
            onClick={handlePublish}
            disabled={submitting}
            className={`${
              editEventId ? "flex-1" : "w-full"
            } py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed`}
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
          label="Event Title"
          value={data.title}
          onChange={(v) => updateData("title", v)}
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
        <InputGroup
          label="Venue Name"
          value={data.venue}
          onChange={(v) => updateData("venue", v)}
          placeholder="Grand Ballroom / Elegant Venue Name"
        />
        <InputGroup
          label="Full Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="123 Main Street, Suite 100"
        />
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
            {data.hero ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={data.hero}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => updateData("hero", "")}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-red-50 text-red-500"
                >
                  <Upload size={16} />
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
                  onChange={handleFileUpload}
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
      <div className="space-y-8 pb-8">
        <div className="border-b border-slate-100 pb-6">
          <button
            onClick={() => setDesignOpen(!designOpen)}
            className="flex items-center justify-between w-full text-left group"
          >
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block cursor-pointer mb-1">
                Design Themes
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
            {availableThemes.map((theme) => (
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
                  className={`h-12 w-full rounded-md mb-3 ${theme.previewColor} border border-black/5 shadow-inner`}
                />
                <span className="text-sm font-medium text-slate-700 block truncate">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Typography
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
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
    </EditorLayout>
  );

  const renderDetailsEditor = () => (
    <EditorLayout title="Details" onBack={() => setActiveView("main")}>
      <div className="space-y-6 pb-8">
        <InputGroup
          label="Event Description"
          type="textarea"
          value={data.details}
          onChange={(v) => updateData("details", v)}
          placeholder="Join us for an elegant evening celebrating the special bond between fathers and daughters..."
        />
        <InputGroup
          label="Occasion / Event Type"
          value={data.extra.occasion}
          onChange={(v) => updateExtra("occasion", v)}
          placeholder="VIP Father-Daughter Dance"
        />
        <InputGroup
          label="Host / Organization"
          value={data.extra.host}
          onChange={(v) => updateExtra("host", v)}
          placeholder="School PTA / Organization Name"
        />
        <InputGroup
          label="Dress Code"
          value={data.extra.dress}
          onChange={(v) => updateExtra("dress", v)}
          placeholder="Formal / Black Tie Optional / Semi-Formal"
        />
        <InputGroup
          label="Event Schedule / Timeline"
          type="textarea"
          value={data.extra.schedule}
          onChange={(v) => updateExtra("schedule", v)}
          placeholder="6:00 PM - Cocktail Reception
7:00 PM - Dinner
8:00 PM - Dancing
9:30 PM - Dessert & Photo Opportunities"
        />
        <InputGroup
          label="Tickets / Admission"
          value={data.extra.tickets}
          onChange={(v) => updateExtra("tickets", v)}
          placeholder="$50 per couple / $25 per person / Free admission"
        />
        <InputGroup
          label="Parking & Arrival Instructions"
          value={data.extra.parking}
          onChange={(v) => updateExtra("parking", v)}
          placeholder="Valet parking available at main entrance / Free parking in lot"
        />
        <InputGroup
          label="Contact Information"
          value={data.extra.contact}
          onChange={(v) => updateExtra("contact", v)}
          placeholder="Email or phone for questions"
        />
      </div>
    </EditorLayout>
  );

  const [newSponsor, setNewSponsor] = useState({
    name: "",
    category: "",
    logo: "",
  });

  const addSponsor = () => {
    if (newSponsor.name) {
      updateData("sponsors", [
        ...(data.sponsors || []),
        { ...newSponsor, id: Date.now() },
      ]);
      setNewSponsor({ name: "", category: "", logo: "" });
    }
  };

  const removeSponsor = (id: number) => {
    updateData(
      "sponsors",
      (data.sponsors || []).filter((s: any) => s.id !== id)
    );
  };

  const handleSponsorLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    sponsorId?: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (sponsorId) {
        updateData(
          "sponsors",
          (data.sponsors || []).map((s: any) =>
            s.id === sponsorId ? { ...s, logo: url } : s
          )
        );
      } else {
        setNewSponsor((prev) => ({ ...prev, logo: url }));
      }
    }
  };

  const renderSponsorsEditor = () => (
    <EditorLayout title="Sponsors" onBack={() => setActiveView("main")}>
      <div className="space-y-6 pb-8">
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase">
            Add Sponsor
          </h4>
          <InputGroup
            label="Sponsor Name"
            value={newSponsor.name}
            onChange={(v) => setNewSponsor((prev) => ({ ...prev, name: v }))}
            placeholder="Company or Organization Name"
          />
          <InputGroup
            label="Category"
            value={newSponsor.category}
            onChange={(v) =>
              setNewSponsor((prev) => ({ ...prev, category: v }))
            }
            placeholder="e.g., Platinum Sponsor, Gold Sponsor, Community Partner"
          />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
              Logo
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center relative">
              {newSponsor.logo ? (
                <div>
                  <img
                    src={newSponsor.logo}
                    alt="Logo preview"
                    className="max-h-24 mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewSponsor((prev) => ({ ...prev, logo: "" }))
                    }
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                  <label className="mt-2 block text-xs text-slate-600 cursor-pointer hover:text-slate-800">
                    <span className="underline">Change logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSponsorLogoUpload(e)}
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload size={20} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-600 mb-1">Upload logo</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSponsorLogoUpload(e)}
                  />
                </label>
              )}
            </div>
          </div>
          <button
            onClick={addSponsor}
            className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
          >
            Add Sponsor
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase">
            Current Sponsors
          </h4>
          {(data.sponsors || []).map((sponsor: any) => (
            <div
              key={sponsor.id}
              className="bg-white p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{sponsor.name}</div>
                  {sponsor.category && (
                    <div className="text-xs text-slate-500">
                      {sponsor.category}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeSponsor(sponsor.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {sponsor.logo && (
                <div className="mt-2">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    className="max-h-16"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </EditorLayout>
  );

  const renderRsvpEditor = () => (
    <EditorLayout title="RSVP Settings" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="text-sm font-semibold text-slate-800">
              Enable RSVP
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Allow guests to RSVP to your event
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.rsvpEnabled}
              onChange={(e) => updateData("rsvpEnabled", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
        {data.rsvpEnabled && (
          <InputGroup
            label="RSVP Deadline"
            type="date"
            value={data.rsvpDeadline}
            onChange={(v) => updateData("rsvpDeadline", v)}
          />
        )}

        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
          <strong>Preview:</strong> Check the preview pane to see the RSVP form
          that your guests will see.
        </div>
      </div>
    </EditorLayout>
  );

  const infoLine = (
    <div
      className={`space-y-4 ${currentSize.body} ${textClass}`}
      style={{ fontFamily: currentFont.body }}
    >
      <div
        className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 font-medium opacity-90 tracking-wide ${textClass}`}
        style={{ fontFamily: currentFont.body }}
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="opacity-70" />
          <span>
            {new Date(data.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
          <span>{data.time}</span>
        </div>
      </div>
      {(data.venue || data.address || data.city) && (
        <div className="space-y-1 opacity-90">
          {data.venue && (
            <div
              className={`flex items-start gap-2 font-semibold ${currentSize.body} ${textClass}`}
              style={{ fontFamily: currentFont.body }}
            >
              <MapPin size={18} className="mt-0.5 opacity-70 flex-shrink-0" />
              <div>
                <div style={{ fontFamily: currentFont.body }}>{data.venue}</div>
                {(data.address || data.city || data.state) && (
                  <div
                    className={`opacity-75 ${textClass} text-sm font-normal mt-1`}
                    style={{ fontFamily: currentFont.body }}
                  >
                    {[data.address, data.city, data.state]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}
          {!data.venue && (data.address || data.city || data.state) && (
            <div
              className={`flex items-start gap-2 opacity-80 ${textClass} text-sm`}
              style={{ fontFamily: currentFont.body }}
            >
              <MapPin size={16} className="mt-0.5 opacity-70 flex-shrink-0" />
              <span>
                {[data.address, data.city, data.state]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        {...previewTouchHandlers}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center md:justify-end md:pr-25"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            key={currentTheme?.id}
            className="min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col transition-colors duration-500 relative z-0"
            style={{
              fontFamily: currentFont.body,
              backgroundColor: backgroundColor,
            }}
          >
            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b ${sectionBorder} ${textClass}`}
              >
                <div className="cursor-pointer hover:opacity-80 transition-opacity group">
                  <h1
                    className={`${currentSize.h1} mb-2 leading-tight flex items-center gap-2`}
                    style={{ ...titleColor, fontFamily: currentFont.title }}
                  >
                    {data.title || "Father-Daughter Dance"}
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={22} />
                    </span>
                  </h1>
                  {infoLine}
                </div>
              </div>

              <div className="relative w-full aspect-video">
                {data.hero ? (
                  <img
                    src={data.hero}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src="/templates/hero-images/father-daughter-hero.jpeg"
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                )}
              </div>

              {/* Venue Section - Above Details */}
              {(data.venue || data.address || data.city) && (
                <section
                  className={`py-10 border-t ${sectionBorder} px-6 md:px-10`}
                >
                  <h2
                    className={`${currentSize.h2} mb-6 ${accentClass}`}
                    style={{ ...titleColor, fontFamily: currentFont.title }}
                  >
                    Venue
                  </h2>
                  <div className={`space-y-2 ${textClass}`}>
                    {data.venue && (
                      <div
                        className={`${currentSize.body} font-semibold ${textClass}`}
                        style={{ fontFamily: currentFont.body }}
                      >
                        {data.venue}
                      </div>
                    )}
                    {(data.address || data.city || data.state) && (
                      <div
                        className={`${currentSize.body} opacity-80 ${textClass}`}
                        style={{ fontFamily: currentFont.body }}
                      >
                        {[data.address, data.city, data.state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section
                className={`py-10 border-t ${sectionBorder} px-6 md:px-10`}
              >
                <h2
                  className={`${currentSize.h2} mb-3 ${accentClass}`}
                  style={{ ...titleColor, fontFamily: currentFont.title }}
                >
                  Details
                </h2>
                {data.details ? (
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap ${textClass} mb-8`}
                  >
                    {data.details}
                  </p>
                ) : (
                  <p
                    className={`${currentSize.body} opacity-70 ${textClass} mb-8`}
                  >
                    Join us for an elegant evening celebrating the special bond
                    between fathers and daughters. An unforgettable night of
                    dancing, dining, and creating cherished memories.
                  </p>
                )}

                {/* Event Schedule Timeline - Wedding Style */}
                {data.extra.schedule && (
                  <div className="mb-8">
                    <h3
                      className={`${currentSize.h2} mb-12 text-center ${accentClass} opacity-90`}
                      style={{ ...titleColor, fontFamily: currentFont.title }}
                    >
                      Schedule of Events
                    </h3>
                    <div className="relative space-y-8 md:space-y-12 max-w-4xl mx-auto">
                      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-current/30 pointer-events-none hidden md:block"></div>
                      {data.extra.schedule
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, idx) => {
                          const match = line.match(
                            /^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*(.+)$/i
                          );
                          if (match) {
                            const [, time, activity] = match;
                            const isLeft = idx % 2 === 0;
                            // Try to extract location if present (e.g., "Activity - Location")
                            const activityMatch = activity.match(
                              /^(.+?)\s*[-–]\s*(.+)$/
                            );
                            const eventTitle = activityMatch
                              ? activityMatch[1].trim()
                              : activity.trim();
                            const eventLocation = activityMatch
                              ? activityMatch[2].trim()
                              : null;

                            return (
                              <div
                                key={idx}
                                className="relative flex flex-col md:flex-row items-center gap-4 md:gap-6 min-h-[80px]"
                              >
                                {/* Timeline Circle */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex-shrink-0">
                                  <div
                                    className={`w-3 h-3 rounded-full bg-current border-2 ${timelineCircleBorder} shadow-lg`}
                                  ></div>
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
                                    <h4
                                      className={`text-xl md:text-2xl font-bold mb-2`}
                                      style={{
                                        color: isDarkBackground
                                          ? "#ffffff"
                                          : "#1e293b",
                                        fontFamily: currentFont.title,
                                      }}
                                    >
                                      {eventTitle}
                                    </h4>
                                    {eventLocation && (
                                      <p
                                        className={`opacity-70 text-base mb-2 font-medium ${textClass}`}
                                      >
                                        {eventLocation}
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
                                  <span
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${timeBubbleBorder} ${timeBubbleBg} backdrop-blur-sm shadow-sm text-slate-900`}
                                  >
                                    {time.trim()}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          // Fallback for non-matching lines
                          return null;
                        })}
                    </div>
                  </div>
                )}

                {/* Other Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.extra).map(([key, val]) => {
                    if (!val || key === "schedule") return null;
                    const fieldLabels: Record<string, string> = {
                      occasion: "Occasion",
                      host: "Host / Organization",
                      dress: "Dress Code",
                      tickets: "Tickets / Admission",
                      parking: "Parking & Arrival",
                      contact: "Contact Information",
                    };
                    return (
                      <div
                        key={key}
                        className={`${detailsBoxBg} rounded-lg p-4 transition-colors`}
                      >
                        <div
                          className={`text-xs uppercase tracking-wide opacity-80 mb-2 ${textClass}`}
                        >
                          {fieldLabels[key] || key}
                        </div>
                        <div
                          className={`${currentSize.body} font-semibold opacity-90 ${textClass} whitespace-pre-wrap`}
                        >
                          {val || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {data.rsvpEnabled && (
                <section className="max-w-2xl mx-auto text-center p-6 md:p-10">
                  <h2
                    className={`${currentSize.h2} mb-6 ${accentClass}`}
                    style={{ ...titleColor, fontFamily: currentFont.title }}
                  >
                    RSVP
                  </h2>
                  <div
                    className={`${rsvpBoxBg} border p-8 md:p-10 rounded-xl text-left`}
                  >
                    {!rsvpSubmitted ? (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <p className={`opacity-80 ${textClass}`}>
                            {data.rsvpDeadline
                              ? `Kindly respond by ${new Date(
                                  data.rsvpDeadline
                                ).toLocaleDateString()}`
                              : "Please RSVP"}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-xs font-bold uppercase tracking-wider opacity-70 mb-2 ${textClass}`}
                          >
                            Full Name
                          </label>
                          <input
                            className={`w-full p-4 rounded-lg ${rsvpInputBg} border outline-none transition-colors ${textClass} placeholder:opacity-30`}
                            placeholder="Guest Name"
                          />
                        </div>
                        <div>
                          <label
                            className={`block text-xs font-bold uppercase tracking-wider opacity-70 mb-3 ${textClass}`}
                          >
                            Attending?
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                                checked={rsvpAttending === "yes"}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending("yes");
                                }}
                              />
                              <div
                                className={`p-5 rounded-xl border-2 ${rsvpCardBg} transition-all flex items-start gap-3 peer-checked:border-current`}
                              >
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className={`text-left ${textClass}`}>
                                  <div className="font-semibold">
                                    Joyfully Accept
                                  </div>
                                  <p className="text-sm opacity-70">
                                    We'll be there.
                                  </p>
                                </div>
                              </div>
                            </label>
                            <label className="group relative cursor-pointer">
                              <input
                                type="radio"
                                name="attending"
                                className="peer sr-only"
                                checked={rsvpAttending === "no"}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setRsvpAttending("no");
                                }}
                              />
                              <div
                                className={`p-5 rounded-xl border-2 ${rsvpCardBg} transition-all flex items-start gap-3 peer-checked:border-current`}
                              >
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className={`text-left ${textClass}`}>
                                  <div className="font-semibold">
                                    Regretfully Decline
                                  </div>
                                  <p className="text-sm opacity-70">
                                    Sending warm wishes.
                                  </p>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(true);
                          }}
                          className={`w-full py-4 mt-2 ${rsvpButtonBg} font-bold uppercase tracking-widest text-sm rounded-lg transition-colors shadow-lg`}
                        >
                          Send RSVP
                        </button>

                        <div className="mt-4">
                          <div
                            className={`text-sm font-semibold uppercase tracking-wide opacity-80 mb-3 ${textClass}`}
                          >
                            Share & Add to Calendar
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center">
                            <button
                              onClick={handleShare}
                              className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border ${shareButtonBg} rounded-md transition-colors ${textClass}`}
                            >
                              <Share2 size={16} />
                              <span className="hidden sm:inline">
                                Share link
                              </span>
                            </button>
                            <button
                              onClick={handleGoogleCalendar}
                              className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border ${shareButtonBg} rounded-md transition-colors ${textClass}`}
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
                              className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border ${shareButtonBg} rounded-md transition-colors ${textClass}`}
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
                              className={`flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border ${shareButtonBg} rounded-md transition-colors ${textClass}`}
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
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3
                          className={`${currentSize.h2} mb-2 ${textClass}`}
                          style={{ fontFamily: currentFont.title }}
                        >
                          Thank you!
                        </h3>
                        <p className={`opacity-70 ${textClass}`}>
                          Your RSVP has been sent.
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(false);
                            setRsvpAttending("yes");
                          }}
                          className={`text-sm underline mt-6 opacity-50 hover:opacity-100 ${textClass}`}
                        >
                          Send another response
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Sponsors Section */}
              {(data.sponsors || []).length > 0 && (
                <section
                  className={`py-10 border-t ${sectionBorder} px-6 md:px-10`}
                >
                  <h2
                    className={`${currentSize.h2} mb-6 text-center ${accentClass}`}
                    style={{ ...titleColor, fontFamily: currentFont.title }}
                  >
                    Our Sponsors
                  </h2>
                  <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                    {(data.sponsors || []).map((sponsor: any) => (
                      <div
                        key={sponsor.id}
                        className="flex flex-col items-center gap-2"
                      >
                        {sponsor.logo ? (
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            className="max-h-20 max-w-32 object-contain opacity-90 hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div
                            className={`${currentSize.body} font-semibold ${textClass} opacity-80`}
                          >
                            {sponsor.name}
                          </div>
                        )}
                        {sponsor.category && (
                          <div className={`text-xs ${textClass} opacity-60`}>
                            {sponsor.category}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <footer
                className={`text-center py-8 border-t ${sectionBorder} mt-1`}
              >
                <a
                  href="https://envitefy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="space-y-1 inline-block no-underline"
                >
                  <p className={`${currentSize.body} opacity-60 ${textClass}`}>
                    Powered By Envitefy. Creat. Share. Enjoy.
                  </p>
                  <p className={`text-xs opacity-50 ${textClass}`}>
                    Create yours now.
                  </p>
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
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
          onClick={closeMobileMenu}
          role="presentation"
        ></div>
      )}

      <div
        className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        {...drawerTouchHandlers}
      >
        <ScrollBoundary
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {mobileMenuOpen && (
            <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
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
          <div className="p-6 pt-4 md:pt-6 pb-8">
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "details" && renderDetailsEditor()}
            {activeView === "sponsors" && renderSponsorsEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
          </div>
        </ScrollBoundary>
      </div>

      {!mobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg"
          >
            <Menu size={18} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
