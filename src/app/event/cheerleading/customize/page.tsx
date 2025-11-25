// @ts-nocheck
"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  memo,
  useRef,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Edit2,
  Image as ImageIcon,
  Menu,
  Palette,
  Type,
  CheckSquare,
  ChevronRight,
  Share2,
  Calendar as CalendarIcon,
  Apple,
  Upload,
  ClipboardList,
  Users,
  Home,
  Plane,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shirt,
} from "lucide-react";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

type FieldSpec = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
};

type ThemeSpec = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview: string;
};

type AdvancedSectionRenderContext = {
  state: any;
  setState: (updater: any) => void;
  setActiveView: (view: string) => void;
  inputClass: string;
  textareaClass: string;
};

type AdvancedSectionPreviewContext = {
  state: any;
  textClass: string;
  accentClass: string;
  headingShadow?: React.CSSProperties;
  bodyShadow?: React.CSSProperties;
  titleColor?: React.CSSProperties;
  headingFontStyle?: React.CSSProperties;
};

type AdvancedSectionSpec = {
  id: string;
  menuTitle: string;
  menuDesc: string;
  initialState: any;
  renderEditor: (ctx: AdvancedSectionRenderContext) => React.ReactNode;
  renderPreview?: (ctx: AdvancedSectionPreviewContext) => React.ReactNode;
};

type SimpleTemplateConfig = {
  slug: string;
  displayName: string;
  category: string;
  categoryLabel?: string;
  defaultHero: string;
  detailFields: FieldSpec[];
  themes: ThemeSpec[];
  themesExpandedByDefault?: boolean;
  rsvpCopy?: {
    menuTitle?: string;
    menuDesc?: string;
    editorTitle?: string;
    toggleLabel?: string;
    deadlineLabel?: string;
    helperText?: string;
  };
  prefill?: {
    title?: string;
    date?: string;
    time?: string;
    city?: string;
    state?: string;
    venue?: string;
    details?: string;
    hero?: string;
    rsvpEnabled?: boolean;
    rsvpDeadline?: string;
    extra?: Record<string, string>;
    fontId?: string;
  };
  advancedSections?: AdvancedSectionSpec[];
};

const CHEER_FONTS = [
  {
    id: "playfair",
    name: "Playfair Display",
    css: "'Playfair Display', 'Times New Roman', serif",
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    css: "'Cormorant Garamond', 'Garamond', serif",
  },
  {
    id: "great-vibes",
    name: "Great Vibes",
    css: "'Great Vibes', 'Lucida Calligraphy', cursive",
  },
  {
    id: "parisienne",
    name: "Parisienne",
    css: "'Parisienne', 'Brush Script MT', cursive",
  },
  { id: "allura", name: "Allura", css: "'Allura', 'Brush Script MT', cursive" },
  {
    id: "dancing-script",
    name: "Dancing Script",
    css: "'Dancing Script', 'Comic Sans MS', cursive",
  },
  {
    id: "cinzel-decorative",
    name: "Cinzel Decorative",
    css: "'Cinzel Decorative', 'Cinzel', serif",
  },
  { id: "fraunces", name: "Fraunces", css: "'Fraunces', 'Georgia', serif" },
  {
    id: "libre-baskerville",
    name: "Libre Baskerville",
    css: "'Libre Baskerville', 'Baskerville', serif",
  },
  {
    id: "marcellus",
    name: "Marcellus",
    css: "'Marcellus', 'Times New Roman', serif",
  },
  {
    id: "quattrocento",
    name: "Quattrocento",
    css: "'Quattrocento', 'Garamond', serif",
  },
  { id: "petrona", name: "Petrona", css: "'Petrona', 'Georgia', serif" },
  {
    id: "pinyon-script",
    name: "Pinyon Script",
    css: "'Pinyon Script', 'Edwardian Script ITC', cursive",
  },
  {
    id: "dm-serif-display",
    name: "DM Serif Display",
    css: "'DM Serif Display', 'Times New Roman', serif",
  },
  {
    id: "sorts-mill-goudy",
    name: "Sorts Mill Goudy",
    css: "'Sorts Mill Goudy', 'Goudy Old Style', serif",
  },
  { id: "gloock", name: "Gloock", css: "'Gloock', 'Georgia', serif" },
  { id: "italiana", name: "Italiana", css: "'Italiana', 'Didot', serif" },
  {
    id: "la-belle-aurore",
    name: "La Belle Aurore",
    css: "'La Belle Aurore', 'Bradley Hand', cursive",
  },
  {
    id: "meddon",
    name: "Meddon",
    css: "'Meddon', 'Lucida Handwriting', cursive",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    css: "'Tangerine', 'Brush Script MT', cursive",
  },
];

const CHEER_GOOGLE_FONT_FAMILIES = [
  "Playfair+Display:wght@400;600;700",
  "Cormorant+Garamond:wght@400;500;600",
  "Great+Vibes",
  "Parisienne",
  "Allura",
  "Dancing+Script:wght@400;600;700",
  "Cinzel+Decorative:wght@400;700",
  "Fraunces:wght@400;600;700",
  "Libre+Baskerville:wght@400;700",
  "Marcellus",
  "Quattrocento:wght@400;700",
  "Petrona:wght@400;600;700",
  "Pinyon+Script",
  "DM+Serif+Display",
  "Sorts+Mill+Goudy",
  "Gloock",
  "Italiana",
  "La+Belle+Aurore",
  "Meddon",
  "Tangerine:wght@400;700",
];

const CHEER_GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${CHEER_GOOGLE_FONT_FAMILIES.join(
  "&family="
)}&display=swap`;

const FONT_SIZE_OPTIONS = [
  { id: "small", label: "Small", className: "text-3xl md:text-4xl" },
  { id: "medium", label: "Medium", className: "text-4xl md:text-5xl" },
  { id: "large", label: "Large", className: "text-5xl md:text-6xl" },
];

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        className={baseTextareaClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    ) : (
      <input
        type={type}
        className={baseInputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    )}
  </div>
);

InputGroup.displayName = "InputGroup";

const ThemeSwatch = ({
  theme,
  active,
  onClick,
}: {
  theme: ThemeSpec;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`relative overflow-hidden rounded-lg border text-left transition-all ${
      active
        ? "border-indigo-600 ring-1 ring-indigo-600 shadow-md"
        : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
    }`}
  >
    <div className={`h-12 w-full ${theme.preview} border-b border-black/5`} />
    <div className="p-3">
      <div className="text-sm font-semibold text-slate-700">{theme.name}</div>
      <div className="text-xs text-slate-400">Palette preset</div>
    </div>
  </button>
);

const MenuCard = ({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left group bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-start gap-4"
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
  </button>
);

import {
  config,
  eventsSection,
  practiceSection,
  rosterSection,
  logisticsSection,
  gearSection,
} from "@/components/event-templates/CheerleadingTemplate";

// Note: createSimpleCustomizePage function needs to be added here
// For now, importing from gymnastics template structure
// TODO: Extract createSimpleCustomizePage to shared location

const Page = createSimpleCustomizePage(config);
export default Page;
