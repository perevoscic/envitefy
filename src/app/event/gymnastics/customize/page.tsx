// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Users,
  Trophy,
  ClipboardList,
  Bus,
  Shirt,
  Car,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  Link as LinkIcon,
  Check,
  X,
  HelpCircle,
  Bell,
  Download,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import ScrollBoundary from "@/components/ScrollBoundary";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";

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
    address?: string;
    venue?: string;
    details?: string;
    hero?: string;
    rsvpEnabled?: boolean;
    rsvpDeadline?: string;
    extra?: Record<string, string>;
  };
  advancedSections?: AdvancedSectionSpec[];
};

const GYM_FONTS = [
  { id: "anton", name: "Anton", css: "'Anton', Impact, sans-serif" },
  {
    id: "bebas",
    name: "Bebas Neue",
    css: "'Bebas Neue', 'Oswald', sans-serif",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    css: "'Montserrat', 'Inter', sans-serif",
  },
  {
    id: "oswald",
    name: "Oswald",
    css: "'Oswald', 'Roboto Condensed', sans-serif",
  },
  { id: "teko", name: "Teko", css: "'Teko', 'Bebas Neue', sans-serif" },
  {
    id: "chakra-petch",
    name: "Chakra Petch",
    css: "'Chakra Petch', 'Rajdhani', sans-serif",
  },
  {
    id: "russo-one",
    name: "Russo One",
    css: "'Russo One', 'Montserrat', sans-serif",
  },
  {
    id: "barlow-condensed",
    name: "Barlow Condensed",
    css: "'Barlow Condensed', 'Roboto Condensed', sans-serif",
  },
  {
    id: "rajdhani",
    name: "Rajdhani",
    css: "'Rajdhani', 'Roboto Condensed', sans-serif",
  },
  {
    id: "league-spartan",
    name: "League Spartan",
    css: "'League Spartan', 'Montserrat', sans-serif",
  },
  { id: "exo2", name: "Exo 2", css: "'Exo 2', 'Manrope', sans-serif" },
  {
    id: "saira-condensed",
    name: "Saira Condensed",
    css: "'Saira Condensed', 'Oswald', sans-serif",
  },
  {
    id: "kanit",
    name: "Kanit",
    css: "'Kanit', 'Barlow Condensed', sans-serif",
  },
  {
    id: "archivo-black",
    name: "Archivo Black",
    css: "'Archivo Black', 'Arial Black', sans-serif",
  },
  {
    id: "orbitron",
    name: "Orbitron",
    css: "'Orbitron', 'Audiowide', sans-serif",
  },
  { id: "righteous", name: "Righteous", css: "'Righteous', 'Baloo', cursive" },
  {
    id: "syncopate",
    name: "Syncopate",
    css: "'Syncopate', 'Montserrat', sans-serif",
  },
  { id: "poppins", name: "Poppins", css: "'Poppins', 'Inter', sans-serif" },
  {
    id: "playfair",
    name: "Playfair Display",
    css: "'Playfair Display', 'Times New Roman', serif",
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    css: "'Cormorant Garamond', 'Garamond', serif",
  },
];

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
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state when value prop changes (from external updates)
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
      {type === "textarea" ? (
        <textarea
          className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

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

function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
    const search = useSearchParams();
    const router = useRouter();
    const editEventId = search?.get("edit") ?? undefined;
    const defaultDate = search?.get("d") ?? undefined;
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
      title: config.prefill?.title || `${config.displayName}`,
      date: config.prefill?.date || initialDate,
      time: config.prefill?.time || "14:00",
      city: config.prefill?.city || "Chicago",
      state: config.prefill?.state || "IL",
      address: config.prefill?.address || "",
      venue: config.prefill?.venue || "",
      details: config.prefill?.details || "Tell guests what to expect.",
      hero: config.prefill?.hero || "",
      rsvpEnabled: config.prefill?.rsvpEnabled ?? true,
      rsvpDeadline:
        config.prefill?.rsvpDeadline ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 10);
          return d.toISOString().split("T")[0];
        })(),
      fontId: (config as any)?.prefill?.fontId || GYM_FONTS[0]?.id || "inter",
      fontSize: (config as any)?.prefill?.fontSize || "medium",
      passcodeRequired: false,
      passcode: "",
      extra: Object.fromEntries(
        config.detailFields.map((f) => [
          f.key,
          config.prefill?.extra?.[f.key] ?? (f.placeholder || ""),
        ])
      ),
    }));
    const [advancedState, setAdvancedState] = useState(() => {
      const entries =
        config.advancedSections?.map((section) => [
          section.id,
          section.initialState,
        ]) || [];
      return Object.fromEntries(entries);
    });
    const [themeId, setThemeId] = useState(
      config.themes[0]?.id ?? "default-theme"
    );
    const [activeView, setActiveView] = useState<string>("main");
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
    const [rsvpAttending, setRsvpAttending] = useState("yes");
    const [submitting, setSubmitting] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [themesExpanded, setThemesExpanded] = useState(
      config.themesExpandedByDefault ?? true
    );
    const {
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      previewTouchHandlers,
      drawerTouchHandlers,
    } = useMobileDrawer();
    const setAdvancedSectionState = useCallback((id: string, updater: any) => {
      setAdvancedState((prev: Record<string, any>) => {
        const current = prev?.[id];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [id]: next };
      });
    }, []);

    const currentTheme =
      config.themes.find((t) => t.id === themeId) || config.themes[0];

    const selectedFont =
      GYM_FONTS.find((f) => f.id === data.fontId) || GYM_FONTS[0];
    const selectedSize =
      FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize) ||
      FONT_SIZE_OPTIONS[1];

    const isDarkBackground = useMemo(() => {
      const bg = currentTheme?.bg?.toLowerCase() ?? "";
      const id = currentTheme?.id?.toLowerCase() ?? "";
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
      const hasDarkHex = /#0[0-9a-f]{5,}/i.test(bg);
      const idHintsDark = /(night|dark)/i.test(id);
      return hasDarkToken || hasDarkHex || idHintsDark;
    }, [currentTheme]);

    const EditorLayout = ({
      title,
      children,
      onBack,
      showBack = true,
    }: {
      title: string;
      children: React.ReactNode;
      onBack: () => void;
      showBack?: boolean;
    }) => (
      <div className="animate-fade-in-right">
        <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
          <div className="mr-3 w-8">
            {showBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
          </div>
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

    const rawTextClass = currentTheme?.text || "";
    const forceLightText =
      isDarkBackground && !rawTextClass.toLowerCase().includes("text-white");
    const textClass = forceLightText
      ? "text-white"
      : rawTextClass || "text-white";
    const accentClass = forceLightText
      ? "text-white"
      : currentTheme?.accent || textClass;
    const usesLightText = /text-(white|slate-50|neutral-50|gray-50)/.test(
      textClass
    );
    const headingShadow = usesLightText
      ? { textShadow: "0 2px 6px rgba(0,0,0,0.55)" }
      : undefined;
    const bodyShadow = usesLightText
      ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" }
      : undefined;
    // Title color for dark backgrounds - light gold/beige
    const titleColor = isDarkBackground
      ? { color: "#f5e6d3" } // Light beige/gold
      : undefined;
    const headingFontStyle = {
      fontFamily: selectedFont?.css,
      ...(headingShadow || {}),
      ...(titleColor || {}),
    };
    const headingSizeClass =
      selectedSize?.className || FONT_SIZE_OPTIONS[1].className;

    const locationParts = data.venue || "";
    const addressLine = data.address || "";

    const hasRoster = (advancedState?.roster?.athletes?.length ?? 0) > 0;
    const hasMeet = Boolean(advancedState?.meet);
    const hasPractice = (advancedState?.practice?.blocks?.length ?? 0) > 0;
    const hasLogistics = Boolean(
      advancedState?.logistics?.travelMode ||
        advancedState?.logistics?.callTime ||
        advancedState?.logistics?.pickupWindow ||
        advancedState?.logistics?.hotelName
    );
    const hasGear = (advancedState?.gear?.items?.length ?? 0) > 0;
    const hasVolunteers = (advancedState?.volunteers?.slots?.length ?? 0) > 0;
    const hasAnnouncements =
      (advancedState?.announcements?.items?.length ?? 0) > 0;
    const navItems = useMemo(
      () =>
        [
          { id: "details", label: "Details", enabled: true },
          { id: "roster", label: "Roster", enabled: hasRoster },
          { id: "meet", label: "Meet", enabled: hasMeet },
          { id: "practice", label: "Practice", enabled: hasPractice },
          { id: "logistics", label: "Logistics", enabled: hasLogistics },
          { id: "gear", label: "Gear", enabled: hasGear },
          { id: "volunteers", label: "Volunteers", enabled: hasVolunteers },
          {
            id: "announcements",
            label: "Announcements",
            enabled: hasAnnouncements,
          },
          { id: "rsvp", label: "RSVP", enabled: data.rsvpEnabled },
          { id: "passcode", label: "Passcode", enabled: true },
        ].filter((item) => item.enabled),
      [
        hasAnnouncements,
        hasGear,
        hasLogistics,
        hasMeet,
        hasPractice,
        hasRoster,
        hasVolunteers,
        data.rsvpEnabled,
      ]
    );

    const [activeSection, setActiveSection] = useState<string>(
      navItems[0]?.id || "details"
    );

    useEffect(() => {
      if (!navItems.length) return;
      if (!navItems.some((i) => i.id === activeSection)) {
        setActiveSection(navItems[0].id);
      }
    }, [activeSection, navItems]);

    useEffect(() => {
      if (typeof window === "undefined" || !navItems.length) return;
      const hash = window.location.hash.replace("#", "");
      if (hash && navItems.some((i) => i.id === hash)) {
        setActiveSection(hash);
      }
    }, [navItems]);

    // Load existing event data when editing
    useEffect(() => {
      const loadExisting = async () => {
        if (!editEventId) return;
        setLoadingExisting(true);
        try {
          const res = await fetch(`/api/history/${editEventId}`, {
            cache: "no-store",
          });
          if (!res.ok) {
            console.error("[Edit] Failed to load event:", res.status);
            setLoadingExisting(false);
            return;
          }
          const json = await res.json();
          const existing = json?.data || {};

          console.log("[Edit] Loaded event data:", {
            title: json?.title,
            heroImage: existing.heroImage,
            themeId: existing.themeId,
            theme: existing.theme,
            fontId: existing.fontId,
            fontSize: existing.fontSize,
            fontFamily: existing.fontFamily,
            fontSizeClass: existing.fontSizeClass,
            existing,
          });

          const startIso =
            existing.start || existing.startISO || existing.startIso;
          let loadedDate: string | undefined = undefined;
          let loadedTime: string | undefined = undefined;
          if (startIso) {
            const d = new Date(startIso);
            if (!Number.isNaN(d.getTime())) {
              loadedDate = d.toISOString().split("T")[0];
              loadedTime = d.toISOString().slice(11, 16);
            }
          }

          // Load all data fields, prioritizing existing values
          const accessControl = existing.accessControl || {};
          const hasPasscode = Boolean(
            accessControl?.passcodeHash || accessControl?.requirePasscode
          );

          setData((prev) => ({
            ...prev,
            title: json?.title || existing.title || prev.title,
            date: existing.date || loadedDate || prev.date,
            time: existing.time || loadedTime || prev.time,
            city: existing.city || prev.city,
            state: existing.state || prev.state,
            address: existing.address || prev.address,
            venue: existing.venue || existing.location || prev.venue,
            details: existing.details || existing.description || prev.details,
            hero: existing.heroImage || existing.hero || prev.hero,
            rsvpEnabled:
              typeof existing.rsvpEnabled === "boolean"
                ? existing.rsvpEnabled
                : prev.rsvpEnabled,
            rsvpDeadline: existing.rsvpDeadline || prev.rsvpDeadline,
            fontId:
              existing.fontId != null
                ? existing.fontId
                : prev.fontId || GYM_FONTS[0]?.id || "inter",
            fontSize:
              existing.fontSize != null
                ? existing.fontSize
                : prev.fontSize || "medium",
            passcodeRequired: hasPasscode,
            passcode: "", // Never load plain passcode for security
            extra: {
              ...prev.extra,
              ...(existing.extra || {}),
              ...(existing.customFields || {}),
            },
          }));

          const incomingAdvanced =
            existing.advancedSections ||
            existing.customFields?.advancedSections ||
            existing.advanced ||
            {};
          if (incomingAdvanced && Object.keys(incomingAdvanced).length) {
            setAdvancedState((prev) => ({ ...prev, ...incomingAdvanced }));
          }

          // Load theme - this is critical!
          if (existing.themeId) {
            // Validate themeId exists in config
            const themeExists = config.themes.find(
              (t) => t.id === existing.themeId
            );
            if (themeExists) {
              console.log("[Edit] Setting themeId:", existing.themeId);
              setThemeId(existing.themeId);
            } else {
              console.warn(
                "[Edit] ThemeId not found in config, using default:",
                existing.themeId
              );
              setThemeId(config.themes[0]?.id || "default-theme");
            }
          } else if (existing.theme?.id) {
            const themeExists = config.themes.find(
              (t) => t.id === existing.theme.id
            );
            if (themeExists) {
              console.log(
                "[Edit] Setting themeId from theme object:",
                existing.theme.id
              );
              setThemeId(existing.theme.id);
            } else {
              console.warn(
                "[Edit] Theme from object not found in config, using default"
              );
              setThemeId(config.themes[0]?.id || "default-theme");
            }
          } else {
            console.warn(
              "[Edit] No themeId found in existing data, using default"
            );
            setThemeId(config.themes[0]?.id || "default-theme");
          }

          // Validate fontId and fontSize after state updates
          setTimeout(() => {
            setData((prev) => {
              const fontExists = GYM_FONTS.find((f) => f.id === prev.fontId);
              const sizeExists = FONT_SIZE_OPTIONS.find(
                (o) => o.id === prev.fontSize
              );
              if (!fontExists || !sizeExists) {
                console.warn("[Edit] Invalid fontId or fontSize, fixing:", {
                  fontId: prev.fontId,
                  fontSize: prev.fontSize,
                  fontExists: !!fontExists,
                  sizeExists: !!sizeExists,
                });
                return {
                  ...prev,
                  fontId: fontExists
                    ? prev.fontId
                    : GYM_FONTS[0]?.id || "inter",
                  fontSize: sizeExists ? prev.fontSize : "medium",
                };
              }
              return prev;
            });
          }, 100);

          setLoadingExisting(false);
        } catch (err) {
          console.error("[Edit] Error loading event:", err);
          setLoadingExisting(false);
          // Don't silently fail - show error to user
          alert("Failed to load event data. Please refresh the page.");
        }
      };
      loadExisting();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editEventId]);

    useEffect(() => {
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
        {
          root: null,
          rootMargin: "-25% 0px -60% 0px",
          threshold: 0,
        }
      );

      const targets = navItems
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];
      targets.forEach((el) => observer.observe(el));

      return () => observer.disconnect();
    }, [navItems]);

    useEffect(() => {
      if (activeView === "design") {
        setThemesExpanded(true);
      }
    }, [activeView]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setData((prev) => ({ ...prev, hero: url }));
      }
    };

    const updateExtra = useCallback((key: string, value: string) => {
      setData((prev) => ({
        ...prev,
        extra: { ...prev.extra, [key]: value },
      }));
    }, []);

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

        // Convert blob URLs to data URLs for saving
        let heroToSave = config.defaultHero;
        if (data.hero) {
          if (/^blob:/i.test(data.hero)) {
            // Convert blob URL to data URL
            try {
              const response = await fetch(data.hero);
              const blob = await response.blob();
              const reader = new FileReader();
              heroToSave = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result || config.defaultHero);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (err) {
              console.error("Failed to convert blob URL:", err);
              heroToSave = config.defaultHero;
            }
          } else if (/^data:/i.test(data.hero)) {
            // Already a data URL, use as-is
            heroToSave = data.hero;
          } else {
            // Regular URL (http/https), use as-is
            heroToSave = data.hero;
          }
        }

        // Get current font and size for saving
        const currentSelectedFont =
          GYM_FONTS.find((f) => f.id === data.fontId) || GYM_FONTS[0];
        const currentSelectedSize =
          FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize) ||
          FONT_SIZE_OPTIONS[1];

        // Ensure themeId is valid and find matching theme
        const validThemeId =
          themeId && config.themes.find((t) => t.id === themeId)
            ? themeId
            : config.themes[0]?.id || "default-theme";
        const themeToSave =
          config.themes.find((t) => t.id === validThemeId) || config.themes[0];

        // Ensure fontId and fontSize are valid
        const validFontId =
          data.fontId && GYM_FONTS.find((f) => f.id === data.fontId)
            ? data.fontId
            : GYM_FONTS[0]?.id || "inter";
        const validFontSize =
          data.fontSize && FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize)
            ? data.fontSize
            : "medium";

        console.log("[Publish] Saving theme and font:", {
          themeId: validThemeId,
          theme: themeToSave?.name,
          fontId: validFontId,
          fontSize: validFontSize,
          currentThemeId: themeId,
          currentFontId: data.fontId,
          currentFontSize: data.fontSize,
          editEventId,
        });

        const payload: any = {
          title: data.title || config.displayName,
          data: {
            category: config.category,
            createdVia: "simple-template",
            createdManually: true,
            startISO,
            endISO,
            location: locationParts || undefined,
            address: data.address || undefined,
            venue: data.venue || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
            rsvpEnabled: data.rsvpEnabled,
            rsvpDeadline: data.rsvpDeadline || undefined,
            numberOfGuests: 0,
            templateId: config.slug,
            templateConfig: {
              displayName: config.displayName,
              categoryLabel: config.categoryLabel || config.displayName,
              detailFields: config.detailFields,
              rsvpCopy: config.rsvpCopy,
            },
            customFields: {
              ...data.extra,
              advancedSections: advancedState,
            },
            advancedSections: advancedState,
            heroImage: heroToSave,
            themeId: validThemeId,
            theme: themeToSave,
            fontId: validFontId,
            fontSize: validFontSize,
            fontFamily: currentSelectedFont?.css,
            fontSizeClass: currentSelectedSize?.className,
            time: data.time,
            date: data.date,
            ...(data.passcodeRequired && data.passcode
              ? {
                  accessControl: {
                    mode: "access-code",
                    passcodePlain: data.passcode,
                    requirePasscode: true,
                  },
                }
              : data.passcodeRequired === false
              ? {
                  accessControl: {
                    mode: "public",
                    requirePasscode: false,
                  },
                }
              : {}),
          },
        };

        if (editEventId) {
          // When updating, send the full data object with theme and font
          const updatePayload = {
            title: payload.title,
            data: payload.data,
          };

          console.log("[Publish] Sending update payload:", {
            themeId: payload.data.themeId,
            theme: payload.data.theme?.name,
            fontId: payload.data.fontId,
            fontSize: payload.data.fontSize,
            hasTheme: !!payload.data.theme,
            hasAdvancedSections: !!payload.data.advancedSections,
          });

          const res = await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updatePayload),
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[Publish] Update failed:", res.status, errorText);
            throw new Error("Failed to update event");
          }

          const result = await res.json().catch(() => ({}));
          console.log("[Publish] Update successful, response:", {
            themeId: result?.data?.themeId,
            theme: result?.data?.theme?.name,
            fontId: result?.data?.fontId,
            fontSize: result?.data?.fontSize,
          });

          // Force a hard refresh to ensure we get the latest data
          router.push(
            buildEventPath(editEventId, payload.title, {
              updated: true,
              t: Date.now(),
            })
          );
        } else {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          const id = (json as any)?.id as string | undefined;
          if (!id) throw new Error("Failed to create event");
          router.push(buildEventPath(id, payload.title, { created: true }));
        }
      } catch (err: any) {
        alert(String(err?.message || err || "Failed to create event"));
      } finally {
        setSubmitting(false);
      }
    }, [
      submitting,
      data.date,
      data.time,
      data.title,
      data.details,
      data.venue,
      data.address,
      data.city,
      data.state,
      data.hero,
      data.fontId,
      data.fontSize,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      data.passcodeRequired,
      data.passcode,
      advancedState,
      locationParts,
      config.category,
      config.categoryLabel,
      config.displayName,
      config.slug,
      config.defaultHero,
      config.detailFields,
      config.rsvpCopy,
      themeId,
      currentTheme,
      editEventId,
      router,
    ]);

    const rsvpCopy = {
      menuTitle: config.rsvpCopy?.menuTitle || "RSVP",
      menuDesc: config.rsvpCopy?.menuDesc || "RSVP settings.",
      editorTitle: config.rsvpCopy?.editorTitle || "RSVP",
      toggleLabel: config.rsvpCopy?.toggleLabel || "Enable RSVP",
      deadlineLabel: config.rsvpCopy?.deadlineLabel || "RSVP Deadline",
      helperText:
        config.rsvpCopy?.helperText ||
        "The RSVP card in the preview updates with these settings.",
    };

    const buildEventDetails = () => {
      const title = data.title || config.displayName;
      let start: Date | null = null;
      if (data.date) {
        const tentative = new Date(`${data.date}T${data.time || "14:00"}`);
        if (!Number.isNaN(tentative.getTime())) start = tentative;
      }
      if (!start) start = new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const location = data.venue || "";
      const description = data.details || "";
      return { title, start, end, location, description };
    };

    const toGoogleDate = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");

    const buildIcsUrl = (details: ReturnType<typeof buildEventDetails>) => {
      const params = new URLSearchParams();
      params.set("title", details.title);
      if (details.start) params.set("start", details.start.toISOString());
      if (details.end) params.set("end", details.end.toISOString());
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

    const handleShare = () => {
      const details = buildEventDetails();
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

    const handleGoogleCalendar = () => {
      const details = buildEventDetails();
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

    const handleOutlookCalendar = () => {
      const details = buildEventDetails();
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

    const handleAppleCalendar = () => {
      const details = buildEventDetails();
      const icsPath = buildIcsUrl(details);
      const absoluteIcs =
        typeof window !== "undefined"
          ? `${window.location.origin}${icsPath}`
          : icsPath;
      window.location.href = absoluteIcs;
    };

    const renderMainMenu = () => (
      <div className="space-y-4 animate-fade-in pb-8 flex flex-col items-center">
        <div className="mb-2 w-full max-w-sm text-center">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
            Add your details
          </h2>
          <p className="text-slate-500 text-sm">
            Customize every aspect of your {config.displayName.toLowerCase()}{" "}
            site.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          <MenuCard
            title="Headline"
            desc="Title, date, location."
            icon={<Type size={18} />}
            onClick={() => setActiveView("headline")}
          />
          <MenuCard
            title="Design"
            desc="Theme presets and typography."
            icon={<Palette size={18} />}
            onClick={() => setActiveView("design")}
          />
          <MenuCard
            title="Images"
            desc="Hero & header photo."
            icon={<ImageIcon size={18} />}
            onClick={() => setActiveView("images")}
          />
          <MenuCard
            title="Details"
            desc="Description and category specifics."
            icon={<Edit2 size={18} />}
            onClick={() => setActiveView("details")}
          />
          <MenuCard
            title={rsvpCopy.menuTitle}
            desc={rsvpCopy.menuDesc}
            icon={<CheckSquare size={18} />}
            onClick={() => setActiveView("rsvp")}
          />
          <MenuCard
            title="Passcode"
            desc="Require access code to view event."
            icon={<LinkIcon size={18} />}
            onClick={() => setActiveView("passcode")}
          />
          {config.advancedSections?.map((section) => (
            <MenuCard
              key={section.id}
              title={section.menuTitle}
              desc={section.menuDesc}
              icon={<Edit2 size={18} />}
              onClick={() => setActiveView(section.id)}
            />
          ))}
        </div>
      </div>
    );

    const updateData = useCallback((field: string, value: any) => {
      setData((prev) => {
        // Only update if the value actually changed to prevent unnecessary re-renders
        if (prev[field] === value) return prev;
        return { ...prev, [field]: value };
      });
    }, []);

    const handleBackToMain = useCallback(() => {
      setActiveView("main");
    }, []);

    const renderHeadlineEditor = useMemo(
      () => (
        <EditorLayout title="Headline" onBack={handleBackToMain} showBack>
          <div className="space-y-6">
            <InputGroup
              label="Headline"
              value={data.title}
              onChange={(v) => updateData("title", v)}
              placeholder={`${config.displayName} title`}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                label="Date"
                type="date"
                value={data.date}
                onChange={(v) => updateData("date", v)}
              />
              <InputGroup
                label="Time"
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
            <InputGroup
              label="Address"
              value={data.address}
              onChange={(v) => updateData("address", v)}
              placeholder="Street address (optional)"
            />
          </div>
        </EditorLayout>
      ),
      [
        data.title,
        data.date,
        data.time,
        data.venue,
        data.address,
        data.city,
        data.state,
        handleBackToMain,
        config.displayName,
      ]
    );

    const renderImagesEditor = () => (
      <EditorLayout
        title="Images"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Hero Image
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors relative">
            {data.hero ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <img
                  src={data.hero}
                  alt="Hero"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setData((p) => ({ ...p, hero: "" }))}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-white rounded-full shadow hover:bg-red-50 text-red-500"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ImageIcon size={20} />
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Upload header photo
                </p>
                <p className="text-xs text-slate-400">
                  Recommended: 1600x900px
                </p>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </EditorLayout>
    );

    const renderDesignEditor = () => (
      <EditorLayout
        title="Design"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-3">
          <button
            onClick={() => setThemesExpanded(!themesExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette size={16} /> Theme ({config.themes.length})
            </div>
            {themesExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {themesExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1">
              {config.themes.map((theme) => (
                <ThemeSwatch
                  key={theme.id}
                  theme={theme}
                  active={themeId === theme.id}
                  onClick={() => setThemeId(theme.id)}
                />
              ))}
            </div>
          )}
          {!themesExpanded && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div
                className={`w-3 h-3 rounded-full border shadow-sm ${
                  currentTheme.preview?.split(" ")[0] || "bg-slate-200"
                }`}
              ></div>
              <span>Current theme: {currentTheme.name}</span>
            </div>
          )}

          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Typography
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {GYM_FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setData((p) => ({ ...p, fontId: f.id }))}
                  className={`border rounded-lg p-3 text-left transition-colors ${
                    data.fontId === f.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  <div
                    className="text-base font-semibold"
                    style={{ fontFamily: f.css }}
                  >
                    {f.name}
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
                  onClick={() => setData((p) => ({ ...p, fontSize: size }))}
                  className={`py-2 text-sm font-medium rounded-md transition-all capitalize ${
                    data.fontSize === size
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
      <EditorLayout
        title="Details"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-4">
          <InputGroup
            label="Description"
            type="textarea"
            value={data.details}
            onChange={(v) => updateData("details", v)}
            placeholder="Tell guests what to expect."
          />

          <InputGroup
            label="Category"
            value={config.categoryLabel || config.displayName}
            onChange={() => {}}
            readOnly
          />

          <div className="grid grid-cols-1 gap-4">
            {config.detailFields.map((field) => (
              <InputGroup
                key={field.key}
                label={field.label}
                type={field.type === "textarea" ? "textarea" : "text"}
                value={data.extra[field.key] || ""}
                onChange={(v) => updateExtra(field.key, v)}
                placeholder={field.placeholder}
              />
            ))}
          </div>
        </div>
      </EditorLayout>
    );

    const renderRsvpEditor = () => (
      <EditorLayout
        title={rsvpCopy.editorTitle}
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium text-slate-700 text-sm">
              {rsvpCopy.toggleLabel}
            </span>
            <button
              onClick={() =>
                setData((p) => ({ ...p, rsvpEnabled: !p.rsvpEnabled }))
              }
              className={`w-11 h-6 rounded-full transition-colors relative ${
                data.rsvpEnabled ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  data.rsvpEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              ></span>
            </button>
          </div>

          <InputGroup
            label={rsvpCopy.deadlineLabel}
            type="date"
            value={data.rsvpDeadline}
            onChange={(v) => updateData("rsvpDeadline", v)}
            placeholder="Set a deadline"
          />

          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <strong>Preview:</strong> {rsvpCopy.helperText}
          </div>
        </div>
      </EditorLayout>
    );

    const renderPasscodeEditor = () => (
      <EditorLayout
        title="Passcode"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <span className="font-medium text-slate-700 text-sm block mb-1">
                Passcode Required
              </span>
              <p className="text-xs text-slate-600">
                Only people with the link and access code can view this event.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={data.passcodeRequired}
                onChange={(e) =>
                  updateData("passcodeRequired", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {data.passcodeRequired && (
            <InputGroup
              label="Access Code"
              type="text"
              value={data.passcode}
              onChange={(v) => updateData("passcode", v)}
              placeholder="Cardinals2025"
            />
          )}

          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <strong>How it works:</strong> Your event stays unlisted. Only
            people with the link and access code can view it. Perfect for team
            events - share the link and code in your team group chat.
          </div>
        </div>
      </EditorLayout>
    );

    const renderAdvancedEditor = (section: AdvancedSectionSpec) => (
      <EditorLayout
        title={section.menuTitle}
        onBack={() => setActiveView("main")}
        showBack
      >
        {section.renderEditor({
          state: advancedState?.[section.id],
          setState: (updater: any) =>
            setAdvancedSectionState(section.id, updater),
          setActiveView,
          inputClass: baseInputClass,
          textareaClass: baseTextareaClass,
        })}
      </EditorLayout>
    );

    const infoLine = (
      <div
        className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-base font-medium opacity-90 ${textClass}`}
        style={bodyShadow}
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
      <div className="relative flex min-h-screen w-full bg-slate-100 overflow-y-auto font-sans text-slate-900">
        <div
          {...previewTouchHandlers}
          className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 mb-12 md:mb-16 transition-all duration-500 ease-in-out">
            <div
              className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${textClass} transition-all duration-500 relative z-0`}
            >
              <div className="relative z-10">
                <div
                  className={`p-6 md:p-8 border-b border-white/10 ${textClass}`}
                >
                  <div>
                    <h1
                      className={`${headingSizeClass} font-serif mb-2 leading-tight ${textClass}`}
                      style={headingFontStyle}
                    >
                      {data.title || config.displayName}
                    </h1>
                    {infoLine}
                    {data.address && (
                      <div
                        className={`mt-2 text-sm opacity-80 flex items-center gap-2 ${textClass}`}
                        style={bodyShadow}
                      >
                        <MapPin size={14} />
                        <span>{data.address}</span>
                      </div>
                    )}
                    {navItems.length > 1 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {navItems.map((item) => {
                          const isActive = activeSection === item.id;
                          return (
                            <a
                              key={item.id}
                              href={`#${item.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                if (el) {
                                  el.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                  setActiveSection(item.id);
                                  window.history.replaceState(
                                    null,
                                    "",
                                    `#${item.id}`
                                  );
                                }
                              }}
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition border ${
                                isActive
                                  ? "bg-white/85 text-slate-900 border-white shadow"
                                  : "bg-white/10 text-inherit border-white/20 hover:bg-white/20"
                              }`}
                            >
                              {item.label}
                            </a>
                          );
                        })}
                      </div>
                    )}
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
                      src={config.defaultHero}
                      alt="Hero"
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  )}
                </div>

                <section
                  id="details"
                  className="py-10 border-t border-white/10 px-6 md:px-10"
                >
                  <h2
                    className={`text-2xl mb-3 ${accentClass}`}
                    style={headingFontStyle}
                  >
                    Details
                  </h2>
                  {data.details ? (
                    <p
                      className={`text-base leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`}
                      style={bodyShadow}
                    >
                      {data.details}
                    </p>
                  ) : (
                    <p
                      className={`text-sm opacity-70 ${textClass}`}
                      style={bodyShadow}
                    >
                      Add a short description so guests know what to expect.
                    </p>
                  )}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.detailFields.map((field) => {
                      const val = data.extra[field.key];
                      return (
                        <div
                          key={field.key}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <div
                            className={`text-xs uppercase tracking-wide opacity-80 ${textClass}`}
                            style={bodyShadow}
                          >
                            {field.label}
                          </div>
                          <div
                            className={`mt-2 text-base font-semibold opacity-90 ${textClass}`}
                            style={bodyShadow}
                          >
                            {val || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {config.advancedSections?.map((section) =>
                  section.renderPreview ? (
                    <section
                      key={section.id}
                      id={section.id}
                      className="py-8 border-t border-white/10 px-6 md:px-10"
                    >
                      {section.renderPreview({
                        state: advancedState?.[section.id],
                        textClass,
                        accentClass,
                        headingShadow,
                        bodyShadow,
                        titleColor,
                        headingFontStyle,
                      })}
                    </section>
                  ) : null
                )}

                {data.rsvpEnabled && (
                  <section
                    id="rsvp"
                    className="max-w-2xl mx-auto text-center p-6 md:p-10"
                  >
                    <h2
                      className={`text-2xl mb-6 ${accentClass}`}
                      style={{ ...headingShadow, ...(titleColor || {}) }}
                    >
                      {rsvpCopy.editorTitle}
                    </h2>
                    <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
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
                                      We’ll be there.
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
                              setRsvpAttending("yes");
                            }}
                            className="text-sm underline mt-6 opacity-50 hover:opacity-100"
                          >
                            Send another response
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={() => handleShare()}
                        className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Share2 size={16} />
                        <span className="hidden sm:inline">Share link</span>
                      </button>
                      <button
                        onClick={() => handleGoogleCalendar()}
                        className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Image
                          src="/brands/google-white.svg"
                          alt="Google"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        <span className="hidden sm:inline">Google Cal</span>
                      </button>
                      <button
                        onClick={() => handleAppleCalendar()}
                        className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Image
                          src="/brands/apple-white.svg"
                          alt="Apple"
                          width={16}
                          height={16}
                          className="w-4 h-4"
                        />
                        <span className="hidden sm:inline">Apple Cal</span>
                      </button>
                      <button
                        onClick={() => handleOutlookCalendar()}
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
                  </section>
                )}

                <footer
                  className={`text-center py-8 border-t border-white/10 mt-1 ${textClass}`}
                >
                  <a
                    href="https://envitefy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="space-y-1 inline-block no-underline"
                  >
                    <p className="text-sm opacity-60" style={bodyShadow}>
                      Powered By Envitefy. Create. Share. Enjoy.
                    </p>
                    <p className="text-xs opacity-50" style={bodyShadow}>
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
        >
          <ScrollBoundary
            className="flex-1 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
            {...drawerTouchHandlers}
          >
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

            <div className="p-6 pt-4 md:pt-6" style={{ pointerEvents: "auto" }}>
              {activeView === "main" && renderMainMenu()}
              {activeView === "headline" && renderHeadlineEditor}
              {activeView === "images" && renderImagesEditor()}
              {activeView === "design" && renderDesignEditor()}
              {activeView === "details" && renderDetailsEditor()}
              {activeView === "rsvp" && renderRsvpEditor()}
              {activeView === "passcode" && renderPasscodeEditor()}
              {config.advancedSections?.map((section) =>
                activeView === section.id ? (
                  <React.Fragment key={section.id}>
                    {renderAdvancedEditor(section)}
                  </React.Fragment>
                ) : null
              )}
            </div>
          </ScrollBoundary>

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
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GYMNASTICS TEAM MANAGEMENT - TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

import {
  config,
  rosterSection,
  meetSection,
  practiceSection,
  logisticsSection,
  gearSection,
  volunteersSection,
  announcementsSection,
} from "@/components/event-templates/GymnasticsTemplate";

const Page = createSimpleCustomizePage(config);
export default Page;
