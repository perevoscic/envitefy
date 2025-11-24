// @ts-nocheck
"use client";

import React, { useCallback, useMemo, useState, useRef, memo } from "react";
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
} from "lucide-react";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";

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
  // Elegant
  {
    id: "midnight_velvet",
    name: "Midnight Velvet",
    category: "Elegant",
    bg: "bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950",
    text: "text-white",
    accent: "text-purple-200",
    previewColor:
      "bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-950",
  },
  {
    id: "champagne_elegance",
    name: "Champagne Elegance",
    category: "Elegant",
    bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50",
    text: "text-amber-900",
    accent: "text-amber-700",
    previewColor: "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50",
  },
  {
    id: "royal_emerald",
    name: "Royal Emerald",
    category: "Elegant",
    bg: "bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-800",
    text: "text-white",
    accent: "text-emerald-200",
    previewColor: "bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-800",
  },
  {
    id: "obsidian_gold",
    name: "Obsidian Gold",
    category: "Elegant",
    bg: "bg-gradient-to-br from-black via-slate-900 to-amber-900",
    text: "text-white",
    accent: "text-amber-300",
    previewColor: "bg-gradient-to-r from-black via-slate-900 to-amber-900",
  },
  {
    id: "sapphire_night",
    name: "Sapphire Night",
    category: "Elegant",
    bg: "bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950",
    text: "text-white",
    accent: "text-blue-200",
    previewColor: "bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950",
  },
  {
    id: "crimson_velvet",
    name: "Crimson Velvet",
    category: "Elegant",
    bg: "bg-gradient-to-br from-red-950 via-rose-900 to-pink-900",
    text: "text-white",
    accent: "text-red-200",
    previewColor: "bg-gradient-to-r from-red-950 via-rose-900 to-pink-900",
  },
  {
    id: "twilight_purple",
    name: "Twilight Purple",
    category: "Elegant",
    bg: "bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900",
    text: "text-white",
    accent: "text-violet-200",
    previewColor:
      "bg-gradient-to-r from-violet-950 via-purple-900 to-fuchsia-900",
  },
  // Modern
  {
    id: "aurora",
    name: "Aurora",
    category: "Modern",
    bg: "bg-gradient-to-br from-purple-900 via-indigo-700 to-cyan-500",
    text: "text-white",
    accent: "text-cyan-100",
    previewColor: "bg-gradient-to-r from-purple-900 via-indigo-700 to-cyan-500",
  },
  {
    id: "platinum_smoke",
    name: "Platinum Smoke",
    category: "Modern",
    bg: "bg-gradient-to-br from-slate-800 via-gray-700 to-slate-600",
    text: "text-white",
    accent: "text-slate-200",
    previewColor: "bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600",
  },
  {
    id: "moonlight_silver",
    name: "Moonlight Silver",
    category: "Modern",
    bg: "bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100",
    text: "text-slate-900",
    accent: "text-slate-700",
    previewColor: "bg-gradient-to-r from-slate-100 via-gray-100 to-zinc-100",
  },
  {
    id: "emerald_forest",
    name: "Emerald Forest",
    category: "Modern",
    bg: "bg-gradient-to-br from-green-950 via-emerald-900 to-teal-800",
    text: "text-white",
    accent: "text-green-200",
    previewColor: "bg-gradient-to-r from-green-950 via-emerald-900 to-teal-800",
  },
  // Classic
  {
    id: "gala_night",
    name: "Gala Night",
    category: "Classic",
    bg: "bg-gradient-to-br from-slate-900 via-neutral-800 to-amber-700",
    text: "text-white",
    accent: "text-amber-200",
    previewColor:
      "bg-gradient-to-r from-slate-900 via-neutral-800 to-amber-700",
  },
  {
    id: "pearl",
    name: "Pearl",
    category: "Classic",
    bg: "bg-gradient-to-br from-white via-slate-50 to-rose-50",
    text: "text-slate-900",
    accent: "text-rose-700",
    previewColor: "bg-gradient-to-r from-white via-slate-50 to-rose-50",
  },
  {
    id: "ivory_lace",
    name: "Ivory Lace",
    category: "Classic",
    bg: "bg-gradient-to-br from-stone-50 via-neutral-50 to-amber-50",
    text: "text-stone-800",
    accent: "text-stone-600",
    previewColor: "bg-gradient-to-r from-stone-50 via-neutral-50 to-amber-50",
  },
  {
    id: "pearl_white",
    name: "Pearl White",
    category: "Classic",
    bg: "bg-gradient-to-br from-white via-neutral-50 to-stone-50",
    text: "text-neutral-900",
    accent: "text-neutral-700",
    previewColor: "bg-gradient-to-r from-white via-neutral-50 to-stone-50",
  },
  // Soft
  {
    id: "silk_rose",
    name: "Silk Rose",
    category: "Soft",
    bg: "bg-gradient-to-br from-rose-100 via-pink-50 to-fuchsia-50",
    text: "text-rose-900",
    accent: "text-rose-700",
    previewColor: "bg-gradient-to-r from-rose-100 via-pink-50 to-fuchsia-50",
  },
  {
    id: "blush_satin",
    name: "Blush Satin",
    category: "Soft",
    bg: "bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50",
    text: "text-pink-900",
    accent: "text-pink-700",
    previewColor: "bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50",
  },
  {
    id: "golden_hour",
    name: "Golden Hour",
    category: "Soft",
    bg: "bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-100",
    text: "text-orange-900",
    accent: "text-orange-700",
    previewColor:
      "bg-gradient-to-r from-orange-200 via-amber-100 to-yellow-100",
  },
  {
    id: "ruby_royale",
    name: "Ruby Royale",
    category: "Elegant",
    bg: "bg-gradient-to-br from-red-900 via-rose-800 to-red-700",
    text: "text-white",
    accent: "text-red-100",
    previewColor: "bg-gradient-to-r from-red-900 via-rose-800 to-red-700",
  },
  {
    id: "bronze_glory",
    name: "Bronze Glory",
    category: "Elegant",
    bg: "bg-gradient-to-br from-amber-900 via-orange-800 to-amber-700",
    text: "text-white",
    accent: "text-amber-100",
    previewColor: "bg-gradient-to-r from-amber-900 via-orange-800 to-amber-700",
  },
  {
    id: "neon_nights",
    name: "Neon Nights",
    category: "Modern",
    bg: "bg-gradient-to-br from-fuchsia-900 via-pink-700 to-rose-600",
    text: "text-white",
    accent: "text-fuchsia-200",
    previewColor: "bg-gradient-to-r from-fuchsia-900 via-pink-700 to-rose-600",
  },
  {
    id: "cyber_blue",
    name: "Cyber Blue",
    category: "Modern",
    bg: "bg-gradient-to-br from-cyan-900 via-blue-800 to-indigo-700",
    text: "text-white",
    accent: "text-cyan-200",
    previewColor: "bg-gradient-to-r from-cyan-900 via-blue-800 to-indigo-700",
  },
  {
    id: "vintage_gold",
    name: "Vintage Gold",
    category: "Classic",
    bg: "bg-gradient-to-br from-yellow-700 via-amber-600 to-yellow-500",
    text: "text-white",
    accent: "text-yellow-100",
    previewColor:
      "bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-500",
  },
  {
    id: "navy_formal",
    name: "Navy Formal",
    category: "Classic",
    bg: "bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-800",
    text: "text-white",
    accent: "text-blue-200",
    previewColor: "bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-800",
  },
  {
    id: "lavender_cloud",
    name: "Lavender Cloud",
    category: "Soft",
    bg: "bg-gradient-to-br from-violet-200 via-purple-100 to-violet-50",
    text: "text-slate-900",
    accent: "text-violet-800",
    previewColor:
      "bg-gradient-to-r from-violet-200 via-purple-100 to-violet-50",
  },
  {
    id: "mint_fresh",
    name: "Mint Fresh",
    category: "Soft",
    bg: "bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-50",
    text: "text-slate-900",
    accent: "text-emerald-800",
    previewColor:
      "bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-50",
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
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.onChange === nextProps.onChange
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
    title: "Special Event",
    date: initialDate,
    time: "14:00",
    city: "Chicago",
    state: "IL",
    venue: "",
    address: "",
    details: "",
    hero: "",
    rsvpEnabled: true,
    rsvpDeadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().split("T")[0];
    })(),
    extra: {
      occasion: "",
      host: "",
      dress: "",
      schedule: "",
      parking: "",
      contact: "",
    },
    theme: {
      themeId: DESIGN_THEMES[0]?.id || "midnight_velvet",
      font: "playfair",
      fontSize: "medium",
    },
  }));

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
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

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
      "950",
      "900",
    ];
    return darkTokens.some((token) => bg.includes(token));
  }, [currentTheme]);

  const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;
  const textClass = currentTheme?.text || "text-white";
  const accentClass = currentTheme?.accent || textClass;

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
          heroImage:
            data.hero ||
            "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80",
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
        router.push(`/event/${id}${editEventId ? "?updated=1" : "?created=1"}`);
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

  // Group themes by category
  const themesByCategory = useMemo(() => {
    const grouped: Record<string, typeof DESIGN_THEMES> = {};
    DESIGN_THEMES.forEach((theme) => {
      if (!grouped[theme.category]) {
        grouped[theme.category] = [];
      }
      grouped[theme.category].push(theme);
    });
    return grouped;
  }, []);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your special event website.
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
          desc="Occasion, host, schedule."
          onClick={() => setActiveView("details")}
        />
        <MenuCard
          title="RSVP"
          icon={<CheckSquare size={18} />}
          desc="RSVP settings."
          onClick={() => setActiveView("rsvp")}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={handlePublish}
          disabled={submitting}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Publishing..." : "PREVIEW AND PUBLISH"}
        </button>
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
          label="Venue"
          value={data.venue}
          onChange={(v) => updateData("venue", v)}
          placeholder="Venue name (optional)"
        />
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
                ? "max-h-[350px] opacity-100"
                : "max-h-0 opacity-0 hidden"
            }`}
          >
            {Object.entries(themesByCategory).map(([category, themes]) => (
              <div key={category} className="col-span-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
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
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                        {theme.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
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

  const renderDetailsEditor = () => (
    <EditorLayout title="Details" onBack={() => setActiveView("main")}>
      <div className="space-y-6 pb-8">
        <InputGroup
          label="Description"
          type="textarea"
          value={data.details}
          onChange={(v) => updateData("details", v)}
          placeholder="Tell guests what to expect."
        />
        <InputGroup
          label="Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="Street address (optional)"
        />
        <InputGroup
          label="Occasion"
          value={data.extra.occasion}
          onChange={(v) => updateExtra("occasion", v)}
          placeholder="Gala, fundraiser, ceremony"
        />
        <InputGroup
          label="Host / Organization"
          value={data.extra.host}
          onChange={(v) => updateExtra("host", v)}
          placeholder="Envitefy Foundation"
        />
        <InputGroup
          label="Dress Code"
          value={data.extra.dress}
          onChange={(v) => updateExtra("dress", v)}
          placeholder="Black tie / cocktail"
        />
        <InputGroup
          label="Program / Schedule"
          type="textarea"
          value={data.extra.schedule}
          onChange={(v) => updateExtra("schedule", v)}
          placeholder="Reception, dinner, awards"
        />
        <InputGroup
          label="Parking / Arrival"
          value={data.extra.parking}
          onChange={(v) => updateExtra("parking", v)}
          placeholder="Valet at main entrance"
        />
        <InputGroup
          label="Contact"
          value={data.extra.contact}
          onChange={(v) => updateExtra("contact", v)}
          placeholder="events@envitefy.com"
        />
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
      {locationParts && (
        <>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-current opacity-50"></span>
          <span className="md:truncate">{locationParts}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        {...previewTouchHandlers}
        className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div
            className={`min-h-[800px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${
              currentTheme.bg || "bg-white"
            } ${currentFont.body} transition-colors duration-500 relative z-0`}
          >
            <div className="relative z-10">
              <div
                className={`p-6 md:p-8 border-b border-white/10 ${textClass}`}
              >
                <div className="cursor-pointer hover:opacity-80 transition-opacity group">
                  <h1
                    className={`${currentSize.h1} mb-2 ${currentFont.title} leading-tight flex items-center gap-2`}
                    style={titleColor}
                  >
                    {data.title || "Special Event"}
                    <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <Edit2 size={22} />
                    </span>
                  </h1>
                  {infoLine}
                </div>
              </div>

              <div className="relative w-full h-64 md:h-96">
                {data.hero ? (
                  <img
                    src={data.hero}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80"
                    alt="Hero"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1000px"
                  />
                )}
              </div>

              <section className="py-10 border-t border-white/10 px-6 md:px-10">
                <h2
                  className={`${currentSize.h2} mb-3 ${currentFont.title} ${accentClass}`}
                  style={titleColor}
                >
                  Details
                </h2>
                {data.details ? (
                  <p
                    className={`${currentSize.body} leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`}
                  >
                    {data.details}
                  </p>
                ) : (
                  <p className={`${currentSize.body} opacity-70 ${textClass}`}>
                    Add a short description so guests know what to expect.
                  </p>
                )}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.extra).map(([key, val]) => {
                    if (!val) return null;
                    const fieldLabels: Record<string, string> = {
                      occasion: "Occasion",
                      host: "Host / Organization",
                      dress: "Dress Code",
                      schedule: "Program / Schedule",
                      parking: "Parking / Arrival",
                      contact: "Contact",
                    };
                    return (
                      <div
                        key={key}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                      >
                        <div
                          className={`text-xs uppercase tracking-wide opacity-80 ${textClass}`}
                        >
                          {fieldLabels[key] || key}
                        </div>
                        <div
                          className={`mt-2 ${currentSize.body} font-semibold opacity-90 ${textClass}`}
                        >
                          {val || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {data.rsvpEnabled && (
                <section className="max-w-xl mx-auto text-center p-6 md:p-8">
                  <h2
                    className={`${currentSize.h2} mb-6 ${currentFont.title} ${accentClass}`}
                    style={titleColor}
                  >
                    RSVP
                  </h2>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-left">
                    {!rsvpSubmitted ? (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <p className="opacity-80">
                            {data.rsvpDeadline
                              ? `Kindly respond by ${new Date(
                                  data.rsvpDeadline
                                ).toLocaleDateString()}`
                              : "Please RSVP"}
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
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
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
                              <div className="p-5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-start gap-3 peer-checked:border-current peer-checked:bg-white/25">
                                <div className="mt-0.5">
                                  <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-current opacity-0 peer-checked:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                                <div className="text-left">
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
                          className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg"
                        >
                          Send RSVP
                        </button>

                        <div className="mt-4">
                          <div className="text-sm font-semibold uppercase tracking-wide opacity-80 mb-3">
                            Share & Add to Calendar
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center">
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
                              <CalendarIcon size={16} />
                              <span className="hidden sm:inline">
                                Google Cal
                              </span>
                            </button>
                            <button
                              onClick={handleAppleCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Apple size={16} />
                              <span className="hidden sm:inline">
                                Apple Cal
                              </span>
                            </button>
                            <button
                              onClick={handleOutlookCalendar}
                              className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <CalendarIcon size={16} />
                              <span className="hidden sm:inline">Outlook</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🎉</div>
                        <h3
                          className={`${currentSize.h2} ${currentFont.title} mb-2`}
                        >
                          Thank you!
                        </h3>
                        <p className="opacity-70">Your RSVP has been sent.</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRsvpSubmitted(false);
                            setRsvpAttending("yes");
                          }}
                          className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                        >
                          Send another response
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <footer className="text-center py-8 border-t border-white/10 mt-1">
                <a
                  href="https://envitefy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="space-y-1 inline-block no-underline"
                >
                  <p className={`${currentSize.body} opacity-60`}>
                    Powered By Envitefy. Creat. Share. Enjoy.
                  </p>
                  <p className="text-xs opacity-50">Create yours now.</p>
                </a>
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
        <div
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
            {activeView === "rsvp" && renderRsvpEditor()}
          </div>
        </div>
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
