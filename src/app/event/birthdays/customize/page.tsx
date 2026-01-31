// @ts-nocheck
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Heart,
  Users,
  Image as ImageIcon,
  Type,
  Palette,
  CheckSquare,
  Gift,
  Menu,
  Upload,
  Trash2,
  Cake,
  Calendar as CalendarIcon,
  Share2,
  Apple,
} from "lucide-react";
import {
  type BirthdayTemplateDefinition,
  birthdayTemplateCatalog,
} from "@/components/event-create/BirthdayTemplateGallery";
import ScrollHandoffContainer from "@/components/ScrollHandoffContainer";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";
import BirthdayRenderer, { type EventData } from "@/components/birthdays/BirthdayRenderer";
import BirthdayDesignThemes from "./_components/BirthdayDesignThemes";
import { BIRTHDAY_THEMES } from "./birthdayThemes";

function getTemplateById(
  id?: string | null
): BirthdayTemplateDefinition | null {
  if (!birthdayTemplateCatalog || birthdayTemplateCatalog.length === 0) {
    return null;
  }
  if (!id) return birthdayTemplateCatalog[0];

  return (
    birthdayTemplateCatalog.find((template) => template.id === id) ??
    birthdayTemplateCatalog[0]
  );
}

// Simplified constants - we'll expand these
const FONTS = {
  playfair: { name: "Playfair Display", preview: "var(--font-playfair)" },
  montserrat: { name: "Montserrat", preview: "var(--font-montserrat)" },
  poppins: { name: "Poppins", preview: "var(--font-poppins)" },
  dancing: { name: "Dancing Script", preview: "var(--font-dancing)" },
  allura: { name: "Allura", preview: "var(--font-allura)" },
  parisienne: { name: "Parisienne", preview: "var(--font-parisienne)" },
  indieFlower: { name: "Indie Flower", preview: "var(--font-indie-flower)" },
  shadowsIntoLight: {
    name: "Shadows Into Light",
    preview: "var(--font-shadows-into-light)",
  },
  kalam: { name: "Kalam", preview: "var(--font-kalam)" },
  sofia: { name: "Sofia", preview: "var(--font-sofia)" },
  sonsieOne: { name: "Sonsie One", preview: "var(--font-sonsie-one)" },
  styleScript: { name: "Style Script", preview: "var(--font-style-script)" },
  tangerine: { name: "Tangerine", preview: "var(--font-tangerine)" },
  yellowtail: { name: "Yellowtail", preview: "var(--font-yellowtail)" },
  alexBrush: { name: "Alex Brush", preview: "var(--font-alex-brush)" },
  cookie: { name: "Cookie", preview: "var(--font-cookie)" },
  courgette: { name: "Courgette", preview: "var(--font-courgette)" },
  redressed: { name: "Redressed", preview: "var(--font-redressed)" },
  satisfy: { name: "Satisfy", preview: "var(--font-satisfy)" },
  sacramento: { name: "Sacramento", preview: "var(--font-sacramento)" },
  amita: { name: "Amita", preview: "var(--font-amita)" },
  arizonia: { name: "Arizonia", preview: "var(--font-arizonia)" },
  euphoriaScript: {
    name: "Euphoria Script",
    preview: "var(--font-euphoria-script)",
  },
  laBelleAurore: {
    name: "La Belle Aurore",
    preview: "var(--font-la-belle-aurore)",
  },
  kaushanScript: {
    name: "Kaushan Script",
    preview: "var(--font-kaushan-script)",
  },
  monteCarlo: { name: "MonteCarlo", preview: "var(--font-monte-carlo)" },
};

const FONT_SIZES = {
  small: {
    h1: "text-2xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    body: "text-sm",
  },
  medium: {
    h1: "text-3xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    body: "text-base",
  },
  large: {
    h1: "text-4xl md:text-6xl",
    h2: "text-4xl md:text-5xl",
    body: "text-lg",
  },
};

const PROFESSIONAL_THEMES = BIRTHDAY_THEMES;

type SimpleTemplateThemeSnapshot = {
  id: string;
  name: string;
  bg: string;
  text: string;
  accent: string;
  preview: string;
};

const PROFESSIONAL_THEME_CLASSES: Record<string, SimpleTemplateThemeSnapshot> =
  {
    construction_zone_party: {
      id: "construction_zone_party",
      name: "Construction Zone",
      bg: "bg-gradient-to-br from-yellow-200 via-amber-200 to-amber-400",
      text: "text-slate-900",
      accent: "text-amber-900",
      preview: "bg-amber-300",
    },
    rainbow_confetti_splash: {
      id: "rainbow_confetti_splash",
      name: "Rainbow Confetti",
      bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
      text: "text-slate-900",
      accent: "text-pink-600",
      preview: "bg-pink-200",
    },
    sparkle_starburst: {
      id: "sparkle_starburst",
      name: "Sparkle Starburst",
      bg: "bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-200",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-amber-200",
    },
    balloon_bouquet_arch: {
      id: "balloon_bouquet_arch",
      name: "Balloon Bouquet",
      bg: "bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-sky-200",
    },
    default: {
      id: "default",
      name: "Default",
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
      text: "text-white",
      accent: "text-white",
      preview: "bg-slate-800",
    },
  };

const INITIAL_DATA = {
  childName: "Emma",
  age: 5,
  date: (() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  })(),
  time: "14:00",
  city: "Chicago",
  state: "IL",
  address: "123 Main Street",
  venue: "Fun Zone Playground",
  partyDetails: {
    theme: "Princess Party",
    activities:
      "Face painting, bouncy castle, magic show, piñata, arts & crafts",
    notes:
      "Join us for an amazing birthday celebration! We'll have games, cake, and lots of fun activities. Can't wait to celebrate with you!",
  },
  hosts: [
    { id: 1, name: "Sarah & Michael", role: "Parents" },
    { id: 2, name: "Grandma Linda", role: "Grandmother" },
  ],
  theme: {
    font: "playfair",
    fontSize: "medium",
    professionalThemeId: "rainbow_confetti_splash",
  },
  themePalette:
    PROFESSIONAL_THEMES.find((t) => t.id === "rainbow_confetti_splash")
      ?.recommendedColorPalette || [],
  images: {
    hero: null,
    headlineBg: null,
  },
  registries: [
    {
      id: 1,
      label: "Amazon Registry",
      url: "https://www.amazon.com/wishlist/emma-5th-birthday",
    },
    {
      id: 2,
      label: "Target Registry",
      url: "https://www.target.com/wishlist/emma-party",
    },
  ],
  rsvp: {
    isEnabled: true,
    deadline: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date.toISOString().split("T")[0];
    })(),
  },
  gallery: [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800",
      caption: "Last year's party",
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800",
      caption: "Birthday cake",
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800",
      caption: "Party decorations",
    },
  ],
};

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
    <div className="sticky top-0 z-10 bg-white flex items-center mb-6 pb-4 border-b border-slate-100 relative">
      <button
        onClick={onBack}
        className="mr-3 p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <h2 className="text-lg font-serif font-bold text-slate-800 absolute left-1/2 transform -translate-x-1/2 w-full text-center pointer-events-none">
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

// Helper function to calculate luminance from hex color (0-1, higher = lighter)
const getLuminance = (hex: string): number => {
  const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!rgb) return 0.5; // Default to medium if invalid

  const r = parseInt(rgb[1], 16) / 255;
  const g = parseInt(rgb[2], 16) / 255;
  const b = parseInt(rgb[3], 16) / 255;

  // Relative luminance formula
  const [rLinear, gLinear, bLinear] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

// Determine if a palette is dark (average luminance < 0.5)
const isPaletteDark = (palette: string[]): boolean => {
  if (!palette || palette.length === 0) return false;
  const colors = palette.filter(Boolean).slice(0, 3); // Use first 3 colors (gradient)
  if (colors.length === 0) return false;

  const luminances = colors.map(getLuminance);
  const avgLuminance =
    luminances.reduce((a, b) => a + b, 0) / luminances.length;
  return avgLuminance < 0.5; // Dark if average luminance < 0.5
};

// Helper function to create preview gradient from color palette (like football-season)
const getPreviewStyle = (palette: string[]) => {
  if (!palette || palette.length === 0) {
    return { backgroundColor: "#e2e8f0" };
  }
  const colors = palette.filter(Boolean);
  if (colors.length === 1) {
    return { backgroundColor: colors[0] };
  }
  if (colors.length === 2) {
    return {
      backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`,
    };
  }
  // Use first 3 colors for gradient (like football-season uses 3 colors)
  return {
    backgroundImage: `linear-gradient(to right, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
  };
};

const ThemeSwatch = ({
  theme,
  active,
  onClick,
}: {
  theme: (typeof PROFESSIONAL_THEMES)[0];
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
    <div
      className="h-12 w-full border-b border-black/5"
      style={getPreviewStyle(theme.recommendedColorPalette)}
    />
    <div className="p-3">
      <div className="text-sm font-semibold text-slate-700">
        {theme.themeName}
      </div>
      <div className="text-xs text-slate-400">Palette preset</div>
    </div>
  </button>
);

export default function BirthdayTemplateCustomizePage() {
  const search = useSearchParams();
  const router = useRouter();
  const defaultDate = search?.get("d") ?? undefined;
  const editEventId = search?.get("edit") ?? undefined;
  const templateId = search?.get("templateId");
  const variationIdParam = search?.get("variationId") ?? undefined;
  const [activeTemplateId, setActiveTemplateId] = useState<string | undefined>(
    templateId || birthdayTemplateCatalog[0]?.id
  );
  const [activeVariationId, setActiveVariationId] = useState<
    string | undefined
  >(
    variationIdParam ||
      birthdayTemplateCatalog.find((t) => t.id === (templateId || ""))
        ?.variations?.[0]?.id ||
      birthdayTemplateCatalog[0]?.variations?.[0]?.id
  );
  const [loadingExisting, setLoadingExisting] = useState(false);
  const template = getTemplateById(activeTemplateId);
  const [activeView, setActiveView] = useState("main");
  const [data, setData] = useState(INITIAL_DATA);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpAttending, setRsvpAttending] = useState("yes");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    previewTouchHandlers,
    drawerTouchHandlers,
  } = useMobileDrawer();
  const [themesExpanded, setThemesExpanded] = useState(true);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const fontListRef = useRef<HTMLDivElement | null>(null);
  const [fontScrollTop, setFontScrollTop] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("details");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const assetUploadCounterRef = useRef(0);
  const bumpAssetUploadCounter = useCallback((delta: number) => {
    assetUploadCounterRef.current = Math.max(
      0,
      assetUploadCounterRef.current + delta
    );
    setUploadingAssets(assetUploadCounterRef.current > 0);
  }, []);
  const [newHost, setNewHost] = useState({ name: "", role: "" });
  const [newRegistry, setNewRegistry] = useState({ label: "", url: "" });
  const buildCalendarDetails = () => {
    const title = data.title || "Birthday Event";
    let start: Date | null = null;
    if (data.date) {
      const tentative = new Date(`${data.date}T${data.time || "17:00"}`);
      if (!Number.isNaN(tentative.getTime())) start = tentative;
    }
    if (!start) start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const location = [data.address, data.city, data.state]
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

  const updateData = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTheme = (field, value) => {
    if (field === "professionalThemeId") {
      const match =
        BIRTHDAY_THEMES.find((t) => t.id === value) ||
        BIRTHDAY_THEMES[0];
      // Keep variation in lockstep with the chosen theme so saves reflect the same palette
      setActiveVariationId(value);
      setData((prev) => ({
        ...prev,
        theme: { ...prev.theme, [field]: value },
        // themePalette: match?.recommendedColorPalette || prev.themePalette, // No longer used this way
      }));
      return;
    }
    setData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const updatePartyDetails = (field, value) => {
    setData((prev) => ({
      ...prev,
      partyDetails: { ...prev.partyDetails, [field]: value },
    }));
  };

  const uploadBirthdayAsset = useCallback(
    async (file: File) => {
      if (!file) return null;
      bumpAssetUploadCounter(1);
      try {
        const formData = new FormData();
        formData.append("file", file, file.name);
        const res = await fetch("/api/uploads/birthday-asset", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Upload failed");
        }
        const payload = await res.json().catch(() => null);
        return payload?.url || null;
      } catch (err) {
        console.error("[Birthday] asset upload failed", err);
        return null;
      } finally {
        bumpAssetUploadCounter(-1);
      }
    },
    [bumpAssetUploadCounter]
  );

  const handleImageUpload = useCallback(
    async (field, e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      setData((prev) => ({
        ...prev,
        images: { ...prev.images, [field]: previewUrl },
      }));
      const uploadedUrl = await uploadBirthdayAsset(file);
      if (!uploadedUrl) return;
      setData((prev) => {
        if (prev.images[field] !== previewUrl) return prev;
        if (previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        return {
          ...prev,
          images: { ...prev.images, [field]: uploadedUrl },
        };
      });
    },
    [uploadBirthdayAsset]
  );

  const handleGalleryUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const entries = files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          previewUrl,
        };
      });
      setData((prev) => ({
        ...prev,
        gallery: [
          ...prev.gallery,
          ...entries.map(({ id, previewUrl }) => ({ id, url: previewUrl })),
        ],
      }));
      for (const entry of entries) {
        const uploadedUrl = await uploadBirthdayAsset(entry.file);
        if (!uploadedUrl) continue;
        setData((prev) => ({
          ...prev,
          gallery: prev.gallery.map((item) => {
            if (item.id !== entry.id || item.url !== entry.previewUrl)
              return item;
            if (entry.previewUrl.startsWith("blob:")) {
              URL.revokeObjectURL(entry.previewUrl);
            }
            return { ...item, url: uploadedUrl };
          }),
        }));
      }
    },
    [uploadBirthdayAsset]
  );

  const removeGalleryImage = useCallback((id) => {
    setData((prev) => {
      const removed = prev.gallery.find((img) => img.id === id);
      if (removed?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.url);
      }
      return {
        ...prev,
        gallery: prev.gallery.filter((img) => img.id !== id),
      };
    });
  }, []);

  // Default theme fallback for CSS classes (styling is primarily handled by professional theme inline styles)
  const currentTheme = {
    bg: "",
    text: "text-slate-800",
    accent: "",
    previewDot: "bg-slate-200",
    previewColor: "bg-slate-200",
  };
  const currentThemeDot = currentTheme.previewDot;

  const currentProfessionalTheme =
    PROFESSIONAL_THEMES.find(
      (theme) => theme.id === data.theme.professionalThemeId
    ) || PROFESSIONAL_THEMES[0];
  const professionalPalette =
    (Array.isArray(data.themePalette) && data.themePalette.length > 0
      ? data.themePalette
      : currentProfessionalTheme.recommendedColorPalette) || [];

  // Analyze palette to determine if it's dark or light
  const isDarkPalette = React.useMemo(
    () => isPaletteDark(professionalPalette),
    [professionalPalette]
  );

  // Set text colors based on palette darkness
  const textColorStyle = isDarkPalette
    ? { color: "#ffffff" } // White text on dark backgrounds
    : { color: "#1e293b" }; // Dark slate text on light backgrounds

  const accentColorStyle = isDarkPalette
    ? { color: "#f1f5f9" } // Light accent on dark
    : { color: "#475569" }; // Medium accent on light

  const professionalAccentColor =
    professionalPalette[3] ??
    professionalPalette[2] ??
    professionalPalette[0] ??
    undefined;

  // Create gradient like football-season (using first 3 colors for smooth gradient)
  const professionalBackgroundStyle =
    professionalPalette.length >= 3
      ? {
          backgroundImage: `linear-gradient(to bottom right, ${professionalPalette[0]}, ${professionalPalette[1]}, ${professionalPalette[2]})`,
        }
      : professionalPalette.length === 2
      ? {
          backgroundImage: `linear-gradient(to bottom right, ${professionalPalette[0]}, ${professionalPalette[1]})`,
        }
      : professionalPalette[0]
      ? { backgroundColor: professionalPalette[0] }
      : {};

  // Use accent color from palette if available, otherwise use computed accent
  const professionalAccentStyle = professionalAccentColor
    ? { color: professionalAccentColor }
    : accentColorStyle;

  // Text shadow for better contrast on dark backgrounds
  const textShadowStyle = isDarkPalette
    ? { textShadow: "0 1px 3px rgba(0,0,0,0.5)" }
    : undefined;
  const currentFont = FONTS[data.theme.font] || FONTS.playfair;
  const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;

  // Navigation items for birthday template
  const navItems = React.useMemo(() => {
    const items = [
      { id: "details", label: "Details", enabled: true },
      { id: "hosts", label: "Hosts", enabled: data.hosts.length > 0 },
      {
        id: "location",
        label: "Location",
        enabled: !!(data.address || data.venue),
      },
      {
        id: "party",
        label: "Party Details",
        enabled: !!data.partyDetails.notes,
      },
      { id: "gallery", label: "Gallery", enabled: data.gallery.length > 0 },
      {
        id: "registry",
        label: "Registry",
        enabled: data.registries.length > 0,
      },
      { id: "rsvp", label: "RSVP", enabled: data.rsvp.isEnabled },
    ];
    return items.filter((item) => item.enabled);
  }, [
    data.hosts.length,
    data.address,
    data.venue,
    data.partyDetails.notes,
    data.gallery.length,
    data.registries.length,
    data.rsvp.isEnabled,
  ]);

  // Sync activeSection with navItems
  React.useEffect(() => {
    if (!navItems.length) return;
    if (!navItems.some((i) => i.id === activeSection)) {
      setActiveSection(navItems[0].id);
    }
  }, [activeSection, navItems]);

  // Handle hash navigation
  React.useEffect(() => {
    if (typeof window === "undefined" || !navItems.length) return;
    const hash = window.location.hash.replace("#", "");
    if (hash && navItems.some((i) => i.id === hash)) {
      setActiveSection(hash);
    }
  }, [navItems]);

  // Intersection observer for auto-scroll detection
  React.useEffect(() => {
    if (!navItems.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id && navItems.some((i) => i.id === id)) {
              setActiveSection(id);
              if (
                typeof window !== "undefined" &&
                window.location.hash !== `#${id}`
              ) {
                window.history.replaceState(null, "", `#${id}`);
              }
            }
          }
        });
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    const targets = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

  // When template changes, reset variation to first for that template (or keep existing matching variation)
  useEffect(() => {
    if (!activeTemplateId) return;
    const nextTemplate = getTemplateById(activeTemplateId);
    const availableVariations = nextTemplate?.variations || [];
    if (!availableVariations.length) return;
    setActiveVariationId((prev) => {
      if (prev && availableVariations.some((v) => v.id === prev)) return prev;
      return availableVariations[0]?.id;
    });
  }, [activeTemplateId]);

  // Keep theme + palette in sync with the active variation (especially when coming from URL)
  useEffect(() => {
    if (!activeVariationId) return;
    const matchedTheme = PROFESSIONAL_THEMES.find(
      (t) => t.id === activeVariationId
    );
    if (!matchedTheme) return;
    setData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        professionalThemeId: activeVariationId,
      },
      themePalette: matchedTheme.recommendedColorPalette || prev.themePalette,
    }));
  }, [activeVariationId]);

  const heroImageSrc =
    template?.heroImageName &&
    typeof template.heroImageName === "string" &&
    template.heroImageName.trim()
      ? `/templates/birthdays/${template.heroImageName}`
      : "/templates/birthdays/rainbow-bash.webp";
  const activeRenderTheme =
    PROFESSIONAL_THEMES.find(
      (theme) => theme.id === data.theme.professionalThemeId
    ) || PROFESSIONAL_THEMES[0];
  const activeGalleryItem =
    data.gallery.length > 0
      ? data.gallery[Math.min(galleryIndex, data.gallery.length - 1)]
      : null;

  const getAgeSuffix = (age: number | string) => {
    const n = typeof age === 'string' ? parseInt(age) : age;
    if (isNaN(n)) return "";
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // Load existing birthday event data when editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!editEventId) return;
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/history/${editEventId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("[Birthday Edit] Failed to load event:", res.status);
          setLoadingExisting(false);
          return;
        }
        const json = await res.json();
        const existing = json?.data || {};

        // Infer date/time from startISO/start/startIso
        const startIso =
          existing.start || existing.startISO || existing.startIso || null;
        let loadedDate: string | undefined;
        let loadedTime: string | undefined;
        if (startIso) {
          const d = new Date(startIso);
          if (!Number.isNaN(d.getTime())) {
            loadedDate = d.toISOString().split("T")[0];
            loadedTime = d.toISOString().slice(11, 16);
          }
        }

        const templateIdFromData =
          existing.templateId || existing.template?.id || existing.variationId;
        if (templateIdFromData) {
          setActiveTemplateId(String(templateIdFromData));
        }
        const variationFromData =
          existing.variationId ||
          existing.theme?.professionalThemeId ||
          variationIdParam ||
          null;
        if (variationFromData) {
          setActiveVariationId(String(variationFromData));
        }

        const paletteFromThemeId =
          existing.themePalette ||
          (() => {
            const tid =
              (existing.theme && existing.theme.professionalThemeId) ||
              existing.variationId ||
              null;
            const match = tid
              ? PROFESSIONAL_THEMES.find((t) => t.id === tid)
              : null;
            return match?.recommendedColorPalette || (match ? [match.primaryColor, match.secondaryColor] : null);
          })() ||
          null;
        const existingThemeKey =
          (existing.theme &&
            (existing.theme.id || existing.theme.professionalThemeId)) ||
          existing.variationId ||
          variationIdParam ||
          null;
        
        const matchedProfessionalTheme = PROFESSIONAL_THEMES.find(t => t.id === existingThemeKey);
        const existingThemeClasses =
          (existingThemeKey && PROFESSIONAL_THEME_CLASSES[existingThemeKey]) ||
          null;

        setData((prev) => {
          const resolvedFont =
            existing.theme?.font || existing.fontId || prev.theme.font;
          const resolvedFontSize =
            existing.theme?.fontSize || existing.fontSize || prev.theme.fontSize;

          return {
            ...prev,
            childName:
              existing.birthdayName ||
              existing.childName ||
              existing.name ||
              prev.childName,
            age: typeof existing.age === "number" ? existing.age : prev.age,
            date: existing.date || loadedDate || prev.date,
            time: existing.time || loadedTime || prev.time,
            city: existing.city || prev.city,
            state: existing.state || prev.state,
            address: existing.address || prev.address,
            venue: existing.venue || existing.location || prev.venue,
            partyDetails: existing.partyDetails || prev.partyDetails,
            hosts: existing.hosts || prev.hosts,
            images: {
              ...prev.images,
              hero:
                existing.customHeroImage ||
                existing.heroImage ||
                prev.images.hero,
              headlineBg: existing.images?.headlineBg || prev.images.headlineBg,
            },
            theme: {
              ...prev.theme,
              ...(matchedProfessionalTheme || {}),
              ...(existing.theme || {}),
              ...(existingThemeClasses
                ? {
                    ...existingThemeClasses,
                    id: existingThemeClasses.id,
                    name: existingThemeClasses.name,
                  }
                : {}),
              professionalThemeId: existingThemeKey || prev.theme.professionalThemeId,
              font: resolvedFont,
              fontSize: resolvedFontSize,
            },
            themePalette: paletteFromThemeId || prev.themePalette,
            registries: existing.registries || prev.registries,
            rsvp: existing.rsvp
              ? {
                  ...prev.rsvp,
                  ...existing.rsvp,
                  isEnabled:
                    typeof existing.rsvp.isEnabled === "boolean"
                      ? existing.rsvp.isEnabled
                      : prev.rsvp.isEnabled,
                }
              : prev.rsvp,
            gallery: existing.gallery || prev.gallery,
          };
        });

        setLoadingExisting(false);
      } catch (err) {
        console.error("[Birthday Edit] Error loading event:", err);
        setLoadingExisting(false);
        alert("Failed to load event data. Please refresh the page.");
      }
    };

    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEventId]);

  const handlePublish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (uploadingAssets) {
      alert("Still uploading images—please wait for the uploads to finish.");
      setSubmitting(false);
      return;
    }
    try {
      const toDataUrlIfBlob = async (
        input: string | null | undefined
      ): Promise<string | null> => {
        if (!input) return null;
        if (!/^blob:/i.test(input)) return input;
        try {
          const response = await fetch(input);
          const blob = await response.blob();
          const reader = new FileReader();
          return await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string) || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("[Birthday] Failed to convert blob URL", err);
          return null;
        }
      };

      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const end = new Date(start);
        end.setHours(end.getHours() + 3);
        startISO = start.toISOString();
        endISO = end.toISOString();
      }

      const locationParts = [data.venue, data.city, data.state].filter(Boolean);
      const location =
        locationParts.length > 0 ? locationParts.join(", ") : undefined;

      // Convert hero/background/gallery uploads so they persist
      const heroToSave =
        (await toDataUrlIfBlob(data.images.hero)) ||
        (template?.heroImageName
          ? `/templates/birthdays/${template.heroImageName}`
          : null);
      const headlineBgToSave = await toDataUrlIfBlob(data.images.headlineBg);
      const galleryToSave = await Promise.all(
        (data.gallery || []).map(async (item) => ({
          ...item,
          url: (await toDataUrlIfBlob(item.url)) || item.url,
        }))
      );

      const currentProfessionalTheme =
        PROFESSIONAL_THEMES.find(
          (theme) => theme.id === data.theme.professionalThemeId
        ) || PROFESSIONAL_THEMES[0];
      
      const professionalPalette =
        currentProfessionalTheme.recommendedColorPalette || 
        [currentProfessionalTheme.primaryColor, currentProfessionalTheme.secondaryColor].filter(Boolean);

      const currentFont = FONTS[data.theme.font] || FONTS.playfair;
      const currentSize = FONT_SIZES[data.theme.fontSize] || FONT_SIZES.medium;
      const templateIdForSave = template?.id || activeTemplateId || "party-pop";
      const variationIdForSave =
        data.theme?.professionalThemeId ||
        activeVariationId ||
        template?.variations?.[0]?.id ||
        templateIdForSave;
      const themeClasses =
        PROFESSIONAL_THEME_CLASSES[variationIdForSave] ||
        PROFESSIONAL_THEME_CLASSES[data.theme?.professionalThemeId || ""] ||
        null;

      const payload: any = {
        title: `${data.childName}'s ${data.age}${getAgeSuffix(
          data.age
        )} Birthday`,
        data: {
          category: "Birthdays",
          createdVia: "birthday-renderer",
          createdManually: true,
          startISO,
          endISO,
          location,
          venue: data.venue || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          description: data.partyDetails?.notes || undefined,
          rsvp: data.rsvp.isEnabled
            ? data.rsvp.deadline || undefined
            : undefined,
          rsvpEnabled: data.rsvp.isEnabled,
          rsvpDeadline: data.rsvp.deadline || undefined,
          numberOfGuests: 0,
          templateId: templateIdForSave,
          variationId: variationIdForSave,
          // Customization data
          birthdayName: data.childName,
          childName: data.childName,
          age: data.age,
          partyDetails: data.partyDetails,
          hosts: data.hosts,
          theme: {
            ...themeClasses,
            ...currentProfessionalTheme,
            ...data.theme,
            id: variationIdForSave,
            name: currentProfessionalTheme.name || themeClasses?.name || "Birthday Theme",
            fontFamily: currentFont.preview,
            fontSizeH1: currentSize.h1,
            fontSizeH2: currentSize.h2,
            fontSizeBody: currentSize.body,
          },
          fontId: data.theme.font,
          fontSize: data.theme.fontSize,
          fontFamily: currentFont.preview,
          fontSizeClass: currentSize.h1,
          themePalette: professionalPalette,
          registries: data.registries
            .filter((r) => r.url.trim())
            .map((r) => ({
              label: r.label.trim() || "Registry",
              url: r.url.trim(),
            })),
          customHeroImage: heroToSave || undefined,
          heroImage: heroToSave || undefined,
          images: {
            ...data.images,
            hero: heroToSave || undefined,
            headlineBg: headlineBgToSave || undefined,
          },
          gallery: galleryToSave,
        },
      };

      let id: string | undefined;

      if (editEventId) {
        const res = await fetch(`/api/history/${editEventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: payload.title,
            data: payload.data,
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            errorText || "Failed to update event. Please try again."
          );
        }
        id = editEventId;
      } else {
        const r = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const errorText = await r.text();
          throw new Error(
            errorText || "Failed to create event. Please try again."
          );
        }
        const j = await r.json().catch(() => ({}));
        id = (j as any)?.id as string | undefined;
      }

      if (id) {
        const params = editEventId
          ? { updated: true, t: Date.now() }
          : { created: true };
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
  }, [
    submitting,
    uploadingAssets,
    data,
    template?.id,
    template?.heroImageName,
    template?.variations,
    activeTemplateId,
    activeVariationId,
    editEventId,
    router,
  ]);

  useEffect(() => {
    if (galleryIndex >= data.gallery.length) {
      setGalleryIndex(Math.max(0, data.gallery.length - 1));
    }
  }, [data.gallery.length, galleryIndex]);

  // Expand themes when Design view is opened
  useEffect(() => {
    if (activeView === "design") {
      setThemesExpanded(true);
    }
  }, [activeView]);

  // Restore scroll position in font list after selection
  useEffect(() => {
    if (fontListRef.current && fontScrollTop > 0) {
      fontListRef.current.scrollTop = fontScrollTop;
    }
  }, [fontScrollTop, data.theme.font]);

  // Render helpers instead of nested components so inputs keep focus across state updates.
  const renderMainMenu = () => (
    <div className="space-y-4 animate-fade-in pb-8 flex flex-col items-center">
      <div className="mb-6 w-full max-w-sm text-center">
        <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
          Add your details
        </h2>
        <p className="text-slate-500 text-sm">
          Customize every aspect of your birthday party website.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        <MenuCard
          title="Headline"
          icon={<Type size={18} />}
          desc="Child's name, age, date, location."
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
          title="Party Details"
          icon={<Cake size={18} />}
          desc="Theme, activities, notes."
          onClick={() => setActiveView("partyDetails")}
        />
        <MenuCard
          title="Hosts"
          icon={<Users size={18} />}
          desc="Who's organizing the party."
          onClick={() => setActiveView("hosts")}
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
          desc="Gift registry links."
          onClick={() => setActiveView("registry")}
        />
      </div>
    </div>
  );

  const renderHeadlineEditor = () => (
    <EditorLayout title="Headline" onBack={() => setActiveView("main")}>
      <div className="space-y-6">
        <InputGroup
          label="Child's Name"
          value={data.childName}
          onChange={(v) => updateData("childName", v)}
          placeholder="Child's name"
        />
        <InputGroup
          label="Age"
          type="number"
          value={data.age}
          onChange={(v) => updateData("age", Number.parseInt(v, 10) || 0)}
          placeholder="5"
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
          placeholder="Party venue (optional)"
        />
        <InputGroup
          label="Address"
          value={data.address}
          onChange={(v) => updateData("address", v)}
          placeholder="Street address (optional)"
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


  const renderDesignEditor = () => {
    return (
      <EditorLayout title="Design & Theme" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Choose a Theme
            </h4>
            <BirthdayDesignThemes
              selectedTemplateId={data.theme.professionalThemeId}
              onSelect={(id) => updateTheme("professionalThemeId", id)}
            />
          </div>
        </div>
      </EditorLayout>
    );
  };

  const renderPartyDetailsEditor = () => (
    <EditorLayout title="Party Details" onBack={() => setActiveView("main")}>
      <div className="space-y-4">
        <InputGroup
          label="Party Theme"
          value={data.partyDetails.theme}
          onChange={(v) => updatePartyDetails("theme", v)}
          placeholder="e.g. Princess, Superhero, Unicorn"
        />
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Activities
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] text-slate-700 text-sm"
            value={data.partyDetails.activities}
            onChange={(e) => updatePartyDetails("activities", e.target.value)}
            placeholder="Games, activities, special events..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
            Notes
          </label>
          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] text-slate-700 text-sm"
            value={data.partyDetails.notes}
            onChange={(e) => updatePartyDetails("notes", e.target.value)}
            placeholder="Share details about the party..."
          />
        </div>
      </div>
    </EditorLayout>
  );

  const renderHostsEditor = () => {
    const addHost = () => {
      if (newHost.name) {
        updateData("hosts", [...data.hosts, { ...newHost, id: Date.now() }]);
        setNewHost({ name: "", role: "" });
      }
    };

    return (
      <EditorLayout title="Hosts" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Host
            </h4>
            <InputGroup
              label="Name"
              value={newHost.name}
              onChange={(v) => setNewHost({ ...newHost, name: v })}
              placeholder="Host name"
            />
            <InputGroup
              label="Role"
              value={newHost.role}
              onChange={(v) => setNewHost({ ...newHost, role: v })}
              placeholder="e.g. Parents, Grandparents"
            />
            <button
              onClick={addHost}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Host
            </button>
          </div>

          <div className="space-y-3">
            {data.hosts.map((host) => (
              <div
                key={host.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">{host.name}</div>
                  {host.role && (
                    <div className="text-xs text-slate-500">{host.role}</div>
                  )}
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "hosts",
                      data.hosts.filter((h) => h.id !== host.id)
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

        {data.rsvp.isEnabled && (
          <InputGroup
            label="RSVP Deadline"
            type="date"
            value={data.rsvp.deadline}
            onChange={(v) => updateData("rsvp", { ...data.rsvp, deadline: v })}
          />
        )}

        <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
          <strong>Preview:</strong> Check the preview pane to see the RSVP form
          that your guests will see.
        </div>
      </div>
    </EditorLayout>
  );

  const renderRegistryEditor = () => {
    const addRegistry = () => {
      if (newRegistry.url) {
        updateData("registries", [
          ...data.registries,
          { ...newRegistry, id: Date.now() },
        ]);
        setNewRegistry({ label: "", url: "" });
      }
    };

    return (
      <EditorLayout title="Registry" onBack={() => setActiveView("main")}>
        <div className="space-y-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase">
              Add Registry
            </h4>
            <InputGroup
              label="Registry Name"
              value={newRegistry.label}
              onChange={(v) => setNewRegistry({ ...newRegistry, label: v })}
              placeholder="e.g. Amazon, Target, Toys R Us"
            />
            <InputGroup
              label="Registry URL"
              type="url"
              value={newRegistry.url}
              onChange={(v) => setNewHost({ ...newRegistry, url: v })}
              placeholder="https://www.example.com/registry"
            />
            <button
              onClick={addRegistry}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-md font-medium hover:bg-indigo-700"
            >
              Add Registry
            </button>
          </div>

          <div className="space-y-3">
            {data.registries.map((registry) => (
              <div
                key={registry.id}
                className="bg-white p-3 border border-slate-200 rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-800">
                    {registry.label || "Registry"}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">
                    {registry.url}
                  </div>
                </div>
                <button
                  onClick={() =>
                    updateData(
                      "registries",
                      data.registries.filter((r) => r.id !== registry.id)
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

  if (editEventId && loadingExisting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your birthday...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen h-[100dvh] w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <div
        ref={previewRef}
        {...previewTouchHandlers}
        className="flex-1 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 transition-all duration-500 ease-in-out">
          <div className="shadow-2xl md:rounded-xl overflow-hidden relative z-0">
            <BirthdayRenderer
              template={activeRenderTheme}
              event={{
                headlineTitle: data.headlineTitle,
                date: data.date && data.time ? `${data.date}T${data.time}` : data.date,
                location: data.location || [data.venue, data.address, data.city, data.state].filter(Boolean).join(", "),
                story: data.partyDetails.notes,
                schedule: data.schedule,
                registries: data.registries,
                rsvpEnabled: data.rsvp.isEnabled,
                rsvpLink: "#rsvp",
                birthdayName: data.childName || "Birthday Star",
                age: data.age,
                party: data.partyDetails,
                thingsToDo: data.partyDetails.activities,
                hosts: data.hosts,
                gallery: data.gallery.map(item => item.url),
                rsvpDeadline: data.rsvp.deadline
              }}
            />
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
        <ScrollHandoffContainer className="flex-1">
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
          <div className="p-6 pt-4 md:pt-6">
            {activeView === "main" && renderMainMenu()}
            {activeView === "headline" && renderHeadlineEditor()}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "partyDetails" && renderPartyDetailsEditor()}
            {activeView === "hosts" && renderHostsEditor()}
            {activeView === "photos" && renderPhotosEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "registry" && renderRegistryEditor()}
          </div>
        </ScrollHandoffContainer>

        <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
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
              disabled={submitting || uploadingAssets}
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
          {uploadingAssets && (
            <p className="mt-2 text-xs text-slate-500">
              Uploading one or more images—publish will finish once the upload
              completes.
            </p>
          )}
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
