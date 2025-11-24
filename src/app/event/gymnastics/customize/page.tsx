// @ts-nocheck
"use client";

import React, { useCallback, useMemo, useState, memo } from "react";
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

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const InputGroup = memo(
  ({
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
  ),
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.readOnly === nextProps.readOnly
    );
  }
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

function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
    const search = useSearchParams();
    const router = useRouter();
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
    const [themesExpanded, setThemesExpanded] = useState(
      config.themesExpandedByDefault ?? false
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

    const locationParts = [data.venue, data.address, data.city, data.state]
      .filter(Boolean)
      .join(", ");

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
            heroImage: data.hero || config.defaultHero,
            themeId,
            theme: currentTheme,
            time: data.time,
            date: data.date,
          },
        };

        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        const id = (json as any)?.id as string | undefined;
        if (!id) throw new Error("Failed to create event");
        router.push(`/event/${id}?created=1`);
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
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
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
      <div className="space-y-4 animate-fade-in pb-8">
        <div className="mb-2">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
            Add your details
          </h2>
          <p className="text-slate-500 text-sm">
            Customize every aspect of your {config.displayName.toLowerCase()}{" "}
            site.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <MenuCard
            title="Headline"
            desc="Title, date, location."
            icon={<Type size={18} />}
            onClick={() => setActiveView("headline")}
          />
          <MenuCard
            title="Design"
            desc="Theme presets."
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

    const renderHeadlineEditor = () => (
      <EditorLayout
        title="Headline"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-6">
          <InputGroup
            label="Headline"
            value={data.title}
            onChange={(v) => setData((p) => ({ ...p, title: v }))}
            placeholder={`${config.displayName} title`}
          />

          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="Date"
              type="date"
              value={data.date}
              onChange={(v) => setData((p) => ({ ...p, date: v }))}
            />
            <InputGroup
              label="Time"
              type="time"
              value={data.time}
              onChange={(v) => setData((p) => ({ ...p, time: v }))}
            />
          </div>

          <InputGroup
            label="Venue"
            value={data.venue}
            onChange={(v) => setData((p) => ({ ...p, venue: v }))}
            placeholder="Venue name (optional)"
          />
          <InputGroup
            label="Address"
            value={data.address}
            onChange={(v) => setData((p) => ({ ...p, address: v }))}
            placeholder="Street address (optional)"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup
              label="City"
              value={data.city}
              onChange={(v) => setData((p) => ({ ...p, city: v }))}
            />
            <InputGroup
              label="State"
              value={data.state}
              onChange={(v) => setData((p) => ({ ...p, state: v }))}
            />
          </div>
        </div>
      </EditorLayout>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[1000px] overflow-y-auto pr-1">
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
            onChange={(v) => setData((p) => ({ ...p, details: v }))}
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
            onChange={(v) => setData((p) => ({ ...p, rsvpDeadline: v }))}
            placeholder="Set a deadline"
          />

          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <strong>Preview:</strong> {rsvpCopy.helperText}
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
                  <div
                    className="cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => {}}
                  >
                    <h1
                      className={`text-3xl md:text-5xl font-serif mb-2 leading-tight flex items-center gap-2 ${textClass}`}
                      style={{
                        fontFamily: "var(--font-playfair)",
                        ...(headingShadow || {}),
                        ...(titleColor || {}),
                      }}
                    >
                      {data.title || config.displayName}
                      <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity">
                        <Edit2 size={22} />
                      </span>
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
                      src={config.defaultHero}
                      alt="Hero"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1000px"
                    />
                  )}
                </div>

                <section className="py-10 border-t border-white/10 px-6 md:px-10">
                  <h2
                    className={`text-2xl mb-3 ${accentClass}`}
                    style={{ ...headingShadow, ...(titleColor || {}) }}
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
                      className="py-8 border-t border-white/10 px-6 md:px-10"
                    >
                      {section.renderPreview({
                        state: advancedState?.[section.id],
                        textClass,
                        accentClass,
                        headingShadow,
                        bodyShadow,
                        titleColor,
                      })}
                    </section>
                  ) : null
                )}

                {data.rsvpEnabled && (
                  <section className="max-w-2xl mx-auto text-center p-6 md:p-10">
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
                        <CalendarIcon size={16} />
                        <span className="hidden sm:inline">Google Cal</span>
                      </button>
                      <button
                        onClick={() => handleAppleCalendar()}
                        className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Apple size={16} />
                        <span className="hidden sm:inline">Apple Cal</span>
                      </button>
                      <button
                        onClick={() => handleOutlookCalendar()}
                        className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <CalendarIcon size={16} />
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

            <div className="p-6 pt-4 md:pt-6">
              {activeView === "main" && renderMainMenu()}
              {activeView === "headline" && renderHeadlineEditor()}
              {activeView === "images" && renderImagesEditor()}
              {activeView === "design" && renderDesignEditor()}
              {activeView === "details" && renderDetailsEditor()}
              {activeView === "rsvp" && renderRsvpEditor()}
              {config.advancedSections?.map((section) =>
                activeView === section.id ? (
                  <React.Fragment key={section.id}>
                    {renderAdvancedEditor(section)}
                  </React.Fragment>
                ) : null
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
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

type AthleteStatus = "going" | "not_going" | "maybe" | "late" | "pending";

type Athlete = {
  id: string;
  name: string;
  level: string;
  primaryEvents: string[];
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  medicalNotes: string;
  status: AthleteStatus;
};

type MeetInfo = {
  sessionNumber: string;
  warmUpTime: string;
  marchInTime: string;
  startApparatus: string;
  rotationOrder: string[];
  judgingNotes: string;
  scoresLink: string;
};

type PracticeBlock = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  focus: string[];
  skillGoals: string;
  equipment: string;
  assignments: string;
};

type LogisticsInfo = {
  travelMode: "bus" | "parent_drive" | "carpool" | "other";
  callTime: string;
  pickupWindow: string;
  hotelName: string;
  hotelAddress: string;
  hotelCheckIn: string;
  mealPlan: string;
  feeDueDate: string;
  feeAmount: string;
  paymentLink: string;
  waiverLinks: string[];
};

type GearItem = {
  id: string;
  name: string;
  required: boolean;
  acknowledged: boolean;
};

type VolunteerSlot = {
  id: string;
  role: string;
  name: string;
  filled: boolean;
};

type CarpoolOffer = {
  id: string;
  driverName: string;
  phone: string;
  seatsAvailable: number;
  departureLocation: string;
  departureTime: string;
};

// Helper to generate unique IDs
const genId = () => Math.random().toString(36).substring(2, 9);

// Apparatus options
const APPARATUS = ["Vault", "Bars", "Beam", "Floor"];
const LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Level 9",
  "Level 10",
  "Xcel Bronze",
  "Xcel Silver",
  "Xcel Gold",
  "Xcel Platinum",
  "Xcel Diamond",
];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const VOLUNTEER_ROLES = [
  "Timer",
  "Score Flasher",
  "Line Judge",
  "Chaperone",
  "Check-in",
  "Hospitality",
  "Photography",
  "Setup/Teardown",
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: ROSTER & ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════

const rosterSection = {
  id: "roster",
  menuTitle: "Roster & Attendance",
  menuDesc: "Athletes, levels, parent contacts, attendance tracking.",
  initialState: {
    athletes: [
      {
        id: "ath1",
        name: "Emma Rodriguez",
        level: "Level 6",
        primaryEvents: ["Bars", "Beam"],
        parentName: "Sofia Rodriguez",
        parentPhone: "(815) 555-0189",
        parentEmail: "sofia.rodriguez@email.com",
        medicalNotes: "Mild peanut allergy - carries EpiPen",
        status: "going" as AthleteStatus,
      },
      {
        id: "ath2",
        name: "Olivia Chen",
        level: "Level 5",
        primaryEvents: ["Vault", "Floor"],
        parentName: "Jennifer Chen",
        parentPhone: "(815) 555-0234",
        parentEmail: "jchen@email.com",
        medicalNotes: "",
        status: "going" as AthleteStatus,
      },
      {
        id: "ath3",
        name: "Ava Mitchell",
        level: "Level 6",
        primaryEvents: ["Bars", "Beam", "Floor"],
        parentName: "Sarah Mitchell",
        parentPhone: "(815) 555-0167",
        parentEmail: "smitchell@email.com",
        medicalNotes: "Asthma - inhaler in bag",
        status: "maybe" as AthleteStatus,
      },
      {
        id: "ath4",
        name: "Sophia Williams",
        level: "Level 5",
        primaryEvents: ["Vault", "Bars"],
        parentName: "Michael Williams",
        parentPhone: "(815) 555-0298",
        parentEmail: "mwilliams@email.com",
        medicalNotes: "",
        status: "pending" as AthleteStatus,
      },
      {
        id: "ath5",
        name: "Isabella Martinez",
        level: "Level 7",
        primaryEvents: ["Beam", "Floor"],
        parentName: "Carmen Martinez",
        parentPhone: "(815) 555-0345",
        parentEmail: "carmen.m@email.com",
        medicalNotes: "",
        status: "late" as AthleteStatus,
      },
    ] as Athlete[],
    showMedical: false,
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const athletes: Athlete[] = state?.athletes || [];
    const addAthlete = () => {
      setState((s: any) => ({
        ...s,
        athletes: [
          ...(s?.athletes || []),
          {
            id: genId(),
            name: "",
            level: "Level 4",
            primaryEvents: [],
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            medicalNotes: "",
            status: "pending" as AthleteStatus,
          },
        ],
      }));
    };
    const updateAthlete = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).map((a: Athlete) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    };
    const removeAthlete = (id: string) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).filter((a: Athlete) => a.id !== id),
      }));
    };
    const toggleEvent = (id: string, event: string) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).map((a: Athlete) => {
          if (a.id !== id) return a;
          const events = a.primaryEvents || [];
          return {
            ...a,
            primaryEvents: events.includes(event)
              ? events.filter((e) => e !== event)
              : [...events, event],
          };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-purple-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-purple-900">Team Roster</h4>
              <p className="text-sm text-purple-700">
                Add athletes with their levels, events, and parent contact info
                for attendance tracking.
              </p>
            </div>
          </div>
        </div>

        {athletes.map((athlete, idx) => (
          <div
            key={athlete.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Athlete #{idx + 1}
              </span>
              <button
                onClick={() => removeAthlete(athlete.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Athlete Name *
                </label>
                <input
                  className={inputClass}
                  placeholder="Sarah Johnson"
                  value={athlete.name}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Level
                </label>
                <select
                  className={inputClass}
                  value={athlete.level}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "level", e.target.value)
                  }
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  className={`${inputClass} ${
                    athlete.status === "going"
                      ? "bg-green-50 border-green-300"
                      : athlete.status === "not_going"
                      ? "bg-red-50 border-red-300"
                      : athlete.status === "maybe"
                      ? "bg-yellow-50 border-yellow-300"
                      : athlete.status === "late"
                      ? "bg-orange-50 border-orange-300"
                      : ""
                  }`}
                  value={athlete.status}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "status", e.target.value)
                  }
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="going">✓ Going</option>
                  <option value="not_going">✗ Not Going</option>
                  <option value="maybe">? Maybe</option>
                  <option value="late">⏰ Late Arrival</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Primary Events
              </label>
              <div className="flex flex-wrap gap-2">
                {APPARATUS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(athlete.id, event)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (athlete.primaryEvents || []).includes(event)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Parent/Guardian Contact
              </label>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className={inputClass}
                  placeholder="Parent Name"
                  value={athlete.parentName}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "parentName", e.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Phone"
                    type="tel"
                    value={athlete.parentPhone}
                    onChange={(e) =>
                      updateAthlete(athlete.id, "parentPhone", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Email"
                    type="email"
                    value={athlete.parentEmail}
                    onChange={(e) =>
                      updateAthlete(athlete.id, "parentEmail", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Medical Notes (optional)
              </label>
              <textarea
                className={textareaClass}
                placeholder="Allergies, injuries, restrictions..."
                value={athlete.medicalNotes}
                onChange={(e) =>
                  updateAthlete(athlete.id, "medicalNotes", e.target.value)
                }
                rows={2}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAthlete}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Athlete
        </button>

        {athletes.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">
              Attendance Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                {
                  status: "going",
                  label: "Going",
                  color: "bg-green-100 text-green-700",
                },
                {
                  status: "not_going",
                  label: "Not Going",
                  color: "bg-red-100 text-red-700",
                },
                {
                  status: "maybe",
                  label: "Maybe",
                  color: "bg-yellow-100 text-yellow-700",
                },
                {
                  status: "late",
                  label: "Late",
                  color: "bg-orange-100 text-orange-700",
                },
                {
                  status: "pending",
                  label: "Pending",
                  color: "bg-slate-100 text-slate-700",
                },
              ].map(({ status, label, color }) => (
                <div key={status} className={`${color} rounded-lg p-2`}>
                  <div className="text-lg font-bold">
                    {athletes.filter((a) => a.status === status).length}
                  </div>
                  <div className="text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const athletes: Athlete[] = state?.athletes || [];
    if (athletes.length === 0) return null;

    const statusIcon = (s: AthleteStatus) => {
      switch (s) {
        case "going":
          return "✓";
        case "not_going":
          return "✗";
        case "maybe":
          return "?";
        case "late":
          return "⏰";
        default:
          return "⏳";
      }
    };
    const statusColor = (s: AthleteStatus) => {
      switch (s) {
        case "going":
          return "bg-green-500/20 text-green-200";
        case "not_going":
          return "bg-red-500/20 text-red-200";
        case "maybe":
          return "bg-yellow-500/20 text-yellow-200";
        case "late":
          return "bg-orange-500/20 text-orange-200";
        default:
          return "bg-white/10 text-white/60";
      }
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Team Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={`font-semibold ${textClass}`}
                    style={bodyShadow}
                  >
                    {athlete.name || "Unnamed"}
                  </div>
                  <div
                    className={`text-sm opacity-70 ${textClass}`}
                    style={bodyShadow}
                  >
                    {athlete.level} •{" "}
                    {(athlete.primaryEvents || []).join(", ") || "All events"}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                    athlete.status
                  )}`}
                >
                  {statusIcon(athlete.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-4 flex items-center gap-4 text-sm opacity-70"
          style={bodyShadow}
        >
          <span className={textClass}>
            {athletes.filter((a) => a.status === "going").length} confirmed
          </span>
          <span className={textClass}>
            {athletes.filter((a) => a.status === "pending").length} pending
          </span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: MEET SPECIFICS
// ═══════════════════════════════════════════════════════════════════════════

const meetSection = {
  id: "meet",
  menuTitle: "Meet Details",
  menuDesc: "Warm-up, march-in, rotation order, judging notes.",
  initialState: {
    sessionNumber: "Session 2 - Level 5-7",
    warmUpTime: "10:30",
    marchInTime: "11:15",
    startApparatus: "Bars",
    rotationOrder: ["Bars", "Beam", "Floor", "Vault"],
    judgingNotes:
      "This is a sanctioned USAG meet. Judges are from Region 5. Remember: salute before and after each routine. Deductions for steps on dismounts. No chalk on beam except hands. Good luck, team!",
    scoresLink: "https://meetscoresonline.com/results/2025-illinois-state-inv",
  } as MeetInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const meet: MeetInfo = state || {};

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    const moveApparatus = (from: number, to: number) => {
      const order = [...(meet.rotationOrder || APPARATUS)];
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      updateField("rotationOrder", order);
    };

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900">Meet Day Details</h4>
              <p className="text-sm text-amber-700">
                Competition specifics to share with athletes and parents.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Session Number
            </label>
            <input
              className={inputClass}
              placeholder="Session 2"
              value={meet.sessionNumber || ""}
              onChange={(e) => updateField("sessionNumber", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Start Apparatus
            </label>
            <select
              className={inputClass}
              value={meet.startApparatus || "Vault"}
              onChange={(e) => updateField("startApparatus", e.target.value)}
            >
              {APPARATUS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Warm-up Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={meet.warmUpTime || ""}
              onChange={(e) => updateField("warmUpTime", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              March-in Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={meet.marchInTime || ""}
              onChange={(e) => updateField("marchInTime", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Rotation Order
          </label>
          <div className="space-y-2">
            {(meet.rotationOrder || APPARATUS).map((apparatus, idx) => (
              <div
                key={apparatus}
                className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200"
              >
                <GripVertical size={16} className="text-slate-400" />
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-slate-700">
                  {apparatus}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveApparatus(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => idx < 3 && moveApparatus(idx, idx + 1)}
                    disabled={idx === 3}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Judging Panel / Notes
          </label>
          <textarea
            className={textareaClass}
            placeholder="Head judge expectations, deduction reminders, presentation tips..."
            value={meet.judgingNotes || ""}
            onChange={(e) => updateField("judgingNotes", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Live Scores Link
          </label>
          <input
            className={inputClass}
            placeholder="https://meetscoresonline.com/..."
            type="url"
            value={meet.scoresLink || ""}
            onChange={(e) => updateField("scoresLink", e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Link to live scoring (MeetScoresOnline, MyUSAGym, etc.)
          </p>
        </div>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const meet: MeetInfo = state || {};
    const hasData =
      meet.sessionNumber ||
      meet.warmUpTime ||
      meet.marchInTime ||
      meet.judgingNotes;
    if (!hasData) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Meet Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {meet.sessionNumber && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Session
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {meet.sessionNumber}
              </div>
            </div>
          )}
          {meet.warmUpTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Warm-up
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(meet.warmUpTime)}
              </div>
            </div>
          )}
          {meet.marchInTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                March-in
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(meet.marchInTime)}
              </div>
            </div>
          )}
          {meet.startApparatus && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Start
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {meet.startApparatus}
              </div>
            </div>
          )}
        </div>
        {(meet.rotationOrder?.length || 0) > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`text-sm opacity-70 ${textClass}`}
              style={bodyShadow}
            >
              Rotation:
            </span>
            {(meet.rotationOrder || APPARATUS).map((a, i) => (
              <React.Fragment key={a}>
                <span
                  className={`px-2 py-1 bg-white/10 rounded text-sm ${textClass}`}
                >
                  {a}
                </span>
                {i < 3 && <span className={`opacity-50 ${textClass}`}>→</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        {meet.judgingNotes && (
          <div
            className={`text-sm opacity-80 whitespace-pre-wrap ${textClass}`}
            style={bodyShadow}
          >
            {meet.judgingNotes}
          </div>
        )}
        {meet.scoresLink && (
          <a
            href={meet.scoresLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
          >
            <ExternalLink size={16} />
            View Live Scores
          </a>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: PRACTICE PLANNER
// ═══════════════════════════════════════════════════════════════════════════

const practiceSection = {
  id: "practice",
  menuTitle: "Practice Planner",
  menuDesc: "Weekly schedule, apparatus focus, skill goals.",
  initialState: {
    blocks: [
      {
        id: "prac1",
        day: "Tuesday",
        startTime: "16:30",
        endTime: "19:30",
        focus: ["Vault", "Bars"],
        skillGoals:
          "Vault: Handspring drills, board work. Bars: Giants, clear hip to handstand, release moves for Level 6+",
        equipment: "Grips, panel mats, vault board",
        assignments: "10 min conditioning circuit at end",
      },
      {
        id: "prac2",
        day: "Thursday",
        startTime: "16:30",
        endTime: "19:30",
        focus: ["Beam", "Floor"],
        skillGoals:
          "Beam: Series connections, back walkover, dismounts. Floor: Tumbling passes, dance through, leap series",
        equipment: "Beam shoes optional, floor music USB",
        assignments: "Full routines x3 each apparatus",
      },
      {
        id: "prac3",
        day: "Saturday",
        startTime: "09:00",
        endTime: "12:00",
        focus: ["Vault", "Bars", "Beam", "Floor"],
        skillGoals:
          "Mock meet format - full routines on all apparatus. Judges present for feedback.",
        equipment: "Competition leos, grips, all equipment",
        assignments: "Competition simulation - treat like meet day",
      },
    ] as PracticeBlock[],
    excusedAthletes: [] as string[],
    modifiedTraining: [] as { athleteId: string; notes: string }[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const blocks: PracticeBlock[] = state?.blocks || [];

    const addBlock = () => {
      setState((s: any) => ({
        ...s,
        blocks: [
          ...(s?.blocks || []),
          {
            id: genId(),
            day: "Monday",
            startTime: "16:00",
            endTime: "19:00",
            focus: [],
            skillGoals: "",
            equipment: "",
            assignments: "",
          },
        ],
      }));
    };

    const updateBlock = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      }));
    };

    const removeBlock = (id: string) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).filter((b: PracticeBlock) => b.id !== id),
      }));
    };

    const toggleFocus = (id: string, apparatus: string) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) => {
          if (b.id !== id) return b;
          const focus = b.focus || [];
          return {
            ...b,
            focus: focus.includes(apparatus)
              ? focus.filter((f) => f !== apparatus)
              : [...focus, apparatus],
          };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="text-emerald-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-emerald-900">
                Weekly Practice Plan
              </h4>
              <p className="text-sm text-emerald-700">
                Define practice blocks with apparatus focus and skill
                objectives.
              </p>
            </div>
          </div>
        </div>

        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Practice Block #{idx + 1}
              </span>
              <button
                onClick={() => removeBlock(block.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Day
                </label>
                <select
                  className={inputClass}
                  value={block.day}
                  onChange={(e) => updateBlock(block.id, "day", e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Start
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={block.startTime}
                  onChange={(e) =>
                    updateBlock(block.id, "startTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  End
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={block.endTime}
                  onChange={(e) =>
                    updateBlock(block.id, "endTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Apparatus Focus
              </label>
              <div className="flex flex-wrap gap-2">
                {APPARATUS.map((apparatus) => (
                  <button
                    key={apparatus}
                    type="button"
                    onClick={() => toggleFocus(block.id, apparatus)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (block.focus || []).includes(apparatus)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {apparatus}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Skill Goals
              </label>
              <textarea
                className={textareaClass}
                placeholder="Back walkover on beam, giants on bars, Yurchenko drills..."
                value={block.skillGoals}
                onChange={(e) =>
                  updateBlock(block.id, "skillGoals", e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Required Equipment
                </label>
                <input
                  className={inputClass}
                  placeholder="Grips, panel mats..."
                  value={block.equipment}
                  onChange={(e) =>
                    updateBlock(block.id, "equipment", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Special Assignments
                </label>
                <input
                  className={inputClass}
                  placeholder="Conditioning, flexibility..."
                  value={block.assignments}
                  onChange={(e) =>
                    updateBlock(block.id, "assignments", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Practice Block
        </button>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const blocks: PracticeBlock[] = state?.blocks || [];
    if (blocks.length === 0) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Practice Schedule
        </h2>
        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  {block.day}
                </div>
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </div>
              </div>
              {(block.focus?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {block.focus.map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 bg-white/10 rounded text-xs"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {block.skillGoals && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  {block.skillGoals}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: LOGISTICS
// ═══════════════════════════════════════════════════════════════════════════

const logisticsSection = {
  id: "logistics",
  menuTitle: "Logistics & Travel",
  menuDesc: "Transport, hotel, meals, fees, waivers.",
  initialState: {
    travelMode: "carpool",
    callTime: "07:30",
    pickupWindow: "5:00 - 5:30 PM",
    hotelName: "Hampton Inn Normal",
    hotelAddress: "310 S Greenbriar Dr, Normal, IL 61761",
    hotelCheckIn: "15:00",
    mealPlan:
      "Team dinner at Olive Garden, 6:00 PM Friday. Breakfast at hotel included Saturday.",
    feeDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    feeAmount: "$125 per athlete",
    paymentLink: "https://niugymnastics.teamsnap.com/payments",
    waiverLinks: [
      "https://usagym.org/waiver/2025",
      "https://forms.gle/travel-permission-2025",
    ],
  } as LogisticsInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const logistics: LogisticsInfo = state || {};

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    const addWaiverLink = () => {
      setState((s: any) => ({
        ...s,
        waiverLinks: [...(s?.waiverLinks || []), ""],
      }));
    };

    const updateWaiverLink = (idx: number, value: string) => {
      setState((s: any) => ({
        ...s,
        waiverLinks: (s?.waiverLinks || []).map((l: string, i: number) =>
          i === idx ? value : l
        ),
      }));
    };

    const removeWaiverLink = (idx: number) => {
      setState((s: any) => ({
        ...s,
        waiverLinks: (s?.waiverLinks || []).filter(
          (_: string, i: number) => i !== idx
        ),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bus className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">
                Travel & Logistics
              </h4>
              <p className="text-sm text-blue-700">
                Transportation, accommodations, and administrative details.
              </p>
            </div>
          </div>
        </div>

        {/* Travel */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Car size={18} /> Transportation
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Travel Mode
              </label>
              <select
                className={inputClass}
                value={logistics.travelMode || "parent_drive"}
                onChange={(e) => updateField("travelMode", e.target.value)}
              >
                <option value="bus">Team Bus</option>
                <option value="parent_drive">Parent Drive</option>
                <option value="carpool">Carpool</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Call Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={logistics.callTime || ""}
                  onChange={(e) => updateField("callTime", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pickup Window
                </label>
                <input
                  className={inputClass}
                  placeholder="5:00-5:30 PM"
                  value={logistics.pickupWindow || ""}
                  onChange={(e) => updateField("pickupWindow", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hotel */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={18} /> Accommodations
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              className={inputClass}
              placeholder="Hotel Name"
              value={logistics.hotelName || ""}
              onChange={(e) => updateField("hotelName", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Hotel Address"
              value={logistics.hotelAddress || ""}
              onChange={(e) => updateField("hotelAddress", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Check-in Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={logistics.hotelCheckIn || ""}
                  onChange={(e) => updateField("hotelCheckIn", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Meal Plan
                </label>
                <input
                  className={inputClass}
                  placeholder="Team dinner at 6 PM"
                  value={logistics.mealPlan || ""}
                  onChange={(e) => updateField("mealPlan", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText size={18} /> Fees & Forms
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fee Amount
              </label>
              <input
                className={inputClass}
                placeholder="$125"
                value={logistics.feeAmount || ""}
                onChange={(e) => updateField("feeAmount", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Due Date
              </label>
              <input
                type="date"
                className={inputClass}
                value={logistics.feeDueDate || ""}
                onChange={(e) => updateField("feeDueDate", e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Payment Link
            </label>
            <input
              className={inputClass}
              placeholder="https://payment.link/..."
              type="url"
              value={logistics.paymentLink || ""}
              onChange={(e) => updateField("paymentLink", e.target.value)}
            />
          </div>

          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Waiver / Form Links
          </label>
          {(logistics.waiverLinks || []).map((link: string, idx: number) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                className={inputClass}
                placeholder="https://form.link/..."
                value={link}
                onChange={(e) => updateWaiverLink(idx, e.target.value)}
              />
              <button
                onClick={() => removeWaiverLink(idx)}
                className="text-red-400 hover:text-red-600 p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addWaiverLink}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus size={14} /> Add waiver link
          </button>
        </div>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const logistics: LogisticsInfo = state || {};
    const hasData =
      logistics.travelMode || logistics.hotelName || logistics.feeAmount;
    if (!hasData) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    const travelLabels: Record<string, string> = {
      bus: "Team Bus",
      parent_drive: "Parent Drive",
      carpool: "Carpool",
      other: "Other",
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Logistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logistics.travelMode && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Transportation
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {travelLabels[logistics.travelMode] || logistics.travelMode}
              </div>
              {logistics.callTime && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Call time: {formatTime(logistics.callTime)}
                </div>
              )}
            </div>
          )}
          {logistics.hotelName && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Hotel
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {logistics.hotelName}
              </div>
              {logistics.hotelAddress && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  {logistics.hotelAddress}
                </div>
              )}
            </div>
          )}
          {logistics.feeAmount && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Fee
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {logistics.feeAmount}
              </div>
              {logistics.feeDueDate && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Due: {new Date(logistics.feeDueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          {logistics.mealPlan && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Meals
                </span>
              </div>
              <div className={`text-sm ${textClass}`} style={bodyShadow}>
                {logistics.mealPlan}
              </div>
            </div>
          )}
        </div>
        {(logistics.paymentLink ||
          (logistics.waiverLinks?.length || 0) > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {logistics.paymentLink && (
              <a
                href={logistics.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
              >
                <LinkIcon size={16} />
                Pay Fees
              </a>
            )}
            {(logistics.waiverLinks || []).map(
              (link: string, idx: number) =>
                link && (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
                  >
                    <FileText size={16} />
                    Form #{idx + 1}
                  </a>
                )
            )}
          </div>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: GEAR & UNIFORM CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const gearSection = {
  id: "gear",
  menuTitle: "Gear & Uniform",
  menuDesc: "Leotard, grips, equipment checklist.",
  initialState: {
    leotardOfDay:
      "Navy blue competition leotard with silver accents. Team warm-up jacket and black leggings for march-in.",
    hairMakeupNotes:
      "High bun secured with navy scrunchie. Light natural makeup allowed - no glitter. Remove all jewelry including stud earrings.",
    musicFileLink:
      "https://drive.google.com/drive/folders/niu-floor-music-2025",
    items: [
      {
        id: "gear1",
        name: "Competition Leotard (Navy/Silver)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear2",
        name: "Team Warm-up Jacket",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear3",
        name: "Black Leggings",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear4",
        name: "Dowel Grips (bars)",
        required: false,
        acknowledged: false,
      },
      { id: "gear5", name: "Beam Shoes", required: false, acknowledged: false },
      {
        id: "gear6",
        name: "Pre-wrap & Athletic Tape",
        required: false,
        acknowledged: false,
      },
      {
        id: "gear7",
        name: "Hair Kit (bobby pins, gel, hairspray)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear8",
        name: "White Ankle Socks",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear9",
        name: "Water Bottle (labeled)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear10",
        name: "Snacks (nothing messy)",
        required: false,
        acknowledged: false,
      },
    ] as GearItem[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const items: GearItem[] = state?.items || [];

    const addItem = () => {
      setState((s: any) => ({
        ...s,
        items: [
          ...(s?.items || []),
          { id: genId(), name: "", required: false, acknowledged: false },
        ],
      }));
    };

    const updateItem = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).map((item: GearItem) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    };

    const removeItem = (id: string) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).filter((item: GearItem) => item.id !== id),
      }));
    };

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shirt className="text-pink-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-pink-900">Gear & Uniform</h4>
              <p className="text-sm text-pink-700">
                Equipment checklist and uniform requirements for meet day.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Leotard of the Day
          </label>
          <input
            className={inputClass}
            placeholder="Red competition leo, Team warm-ups..."
            value={state?.leotardOfDay || ""}
            onChange={(e) => updateField("leotardOfDay", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Hair & Makeup Notes
          </label>
          <textarea
            className={textareaClass}
            placeholder="High bun with team scrunchie, natural makeup, no glitter..."
            value={state?.hairMakeupNotes || ""}
            onChange={(e) => updateField("hairMakeupNotes", e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Floor Music Link
          </label>
          <input
            className={inputClass}
            placeholder="https://drive.google.com/..."
            type="url"
            value={state?.musicFileLink || ""}
            onChange={(e) => updateField("musicFileLink", e.target.value)}
          />
        </div>

        <div className="border-t pt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Equipment Checklist
          </label>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200"
              >
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    updateItem(item.id, "required", e.target.checked)
                  }
                  className="w-4 h-4 text-pink-600"
                />
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                />
                <span className="text-xs text-slate-400">
                  {item.required ? "Required" : "Optional"}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-sm text-pink-600 hover:text-pink-800 flex items-center gap-1"
          >
            <Plus size={14} /> Add item
          </button>
        </div>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const items: GearItem[] = state?.items || [];
    const hasData = state?.leotardOfDay || items.length > 0;
    if (!hasData) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Gear Checklist
        </h2>
        {state?.leotardOfDay && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 mb-1 ${textClass}`}
              style={bodyShadow}
            >
              Uniform
            </div>
            <div className={`font-semibold ${textClass}`} style={bodyShadow}>
              {state.leotardOfDay}
            </div>
            {state.hairMakeupNotes && (
              <div
                className={`text-sm opacity-70 mt-1 ${textClass}`}
                style={bodyShadow}
              >
                {state.hairMakeupNotes}
              </div>
            )}
          </div>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {items
              .filter((i) => i.name)
              .map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    item.required ? "bg-pink-500/20" : "bg-white/5"
                  }`}
                >
                  <CheckSquare size={14} className="opacity-70" />
                  <span className={`text-sm ${textClass}`} style={bodyShadow}>
                    {item.name}
                  </span>
                  {item.required && (
                    <span className="text-xs bg-pink-500/30 px-1.5 py-0.5 rounded">
                      *
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
        {state?.musicFileLink && (
          <a
            href={state.musicFileLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
          >
            <Download size={16} />
            Download Floor Music
          </a>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: VOLUNTEERS & CARPOOL
// ═══════════════════════════════════════════════════════════════════════════

const volunteersSection = {
  id: "volunteers",
  menuTitle: "Volunteers & Carpool",
  menuDesc: "Sign up for roles, coordinate rides.",
  initialState: {
    volunteerSlots: [
      { id: "vol1", role: "Timer", name: "Sofia Rodriguez", filled: true },
      { id: "vol2", role: "Timer", name: "", filled: false },
      {
        id: "vol3",
        role: "Score Flasher",
        name: "Jennifer Chen",
        filled: true,
      },
      { id: "vol4", role: "Score Flasher", name: "", filled: false },
      { id: "vol5", role: "Chaperone", name: "Sarah Mitchell", filled: true },
      { id: "vol6", role: "Check-in", name: "", filled: false },
      {
        id: "vol7",
        role: "Hospitality",
        name: "Carmen Martinez",
        filled: true,
      },
      { id: "vol8", role: "Photography", name: "", filled: false },
    ] as VolunteerSlot[],
    carpoolOffers: [
      {
        id: "cp1",
        driverName: "Michael Williams",
        phone: "(815) 555-0298",
        seatsAvailable: 3,
        departureLocation: "NIU Recreation Center parking lot",
        departureTime: "07:00",
      },
      {
        id: "cp2",
        driverName: "Sofia Rodriguez",
        phone: "(815) 555-0189",
        seatsAvailable: 2,
        departureLocation: "Target parking lot, DeKalb",
        departureTime: "07:15",
      },
    ] as CarpoolOffer[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const slots: VolunteerSlot[] = state?.volunteerSlots || [];
    const carpools: CarpoolOffer[] = state?.carpoolOffers || [];

    const addSlot = () => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: [
          ...(s?.volunteerSlots || []),
          { id: genId(), role: "Timer", name: "", filled: false },
        ],
      }));
    };

    const updateSlot = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: (s?.volunteerSlots || []).map((slot: VolunteerSlot) =>
          slot.id === id ? { ...slot, [field]: value } : slot
        ),
      }));
    };

    const removeSlot = (id: string) => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: (s?.volunteerSlots || []).filter(
          (slot: VolunteerSlot) => slot.id !== id
        ),
      }));
    };

    const addCarpool = () => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: [
          ...(s?.carpoolOffers || []),
          {
            id: genId(),
            driverName: "",
            phone: "",
            seatsAvailable: 2,
            departureLocation: "",
            departureTime: "",
          },
        ],
      }));
    };

    const updateCarpool = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: (s?.carpoolOffers || []).map((cp: CarpoolOffer) =>
          cp.id === id ? { ...cp, [field]: value } : cp
        ),
      }));
    };

    const removeCarpool = (id: string) => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: (s?.carpoolOffers || []).filter(
          (cp: CarpoolOffer) => cp.id !== id
        ),
      }));
    };

    return (
      <div className="space-y-6">
        {/* Volunteers */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-orange-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-orange-900">
                Volunteer Sign-ups
              </h4>
              <p className="text-sm text-orange-700">
                Timer, score flasher, chaperone, and other meet roles.
              </p>
            </div>
          </div>
        </div>

        {slots.map((slot, idx) => (
          <div
            key={slot.id}
            className="border border-slate-200 rounded-lg p-3 bg-white flex items-center gap-3"
          >
            <select
              className={`${inputClass} flex-shrink-0 w-36`}
              value={slot.role}
              onChange={(e) => updateSlot(slot.id, "role", e.target.value)}
            >
              {VOLUNTEER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              className={`${inputClass} flex-1`}
              placeholder="Volunteer name"
              value={slot.name}
              onChange={(e) => updateSlot(slot.id, "name", e.target.value)}
            />
            <button
              type="button"
              onClick={() => updateSlot(slot.id, "filled", !slot.filled)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                slot.filled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {slot.filled ? "✓ Filled" : "Open"}
            </button>
            <button
              onClick={() => removeSlot(slot.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSlot}
          className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Volunteer Slot
        </button>

        {/* Carpool */}
        <div className="border-t pt-6">
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Car className="text-cyan-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-cyan-900">
                  Carpool Coordination
                </h4>
                <p className="text-sm text-cyan-700">
                  Offers from drivers with available seats.
                </p>
              </div>
            </div>
          </div>

          {carpools.map((cp) => (
            <div
              key={cp.id}
              className="border border-slate-200 rounded-xl p-4 mb-3 bg-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Carpool Offer
                </span>
                <button
                  onClick={() => removeCarpool(cp.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="Driver Name"
                  value={cp.driverName}
                  onChange={(e) =>
                    updateCarpool(cp.id, "driverName", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Phone"
                  type="tel"
                  value={cp.phone}
                  onChange={(e) =>
                    updateCarpool(cp.id, "phone", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    className={inputClass}
                    value={cp.seatsAvailable}
                    onChange={(e) =>
                      updateCarpool(
                        cp.id,
                        "seatsAvailable",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">
                    Departure
                  </label>
                  <input
                    type="time"
                    className={inputClass}
                    value={cp.departureTime}
                    onChange={(e) =>
                      updateCarpool(cp.id, "departureTime", e.target.value)
                    }
                  />
                </div>
              </div>
              <input
                className={inputClass}
                placeholder="Departure location"
                value={cp.departureLocation}
                onChange={(e) =>
                  updateCarpool(cp.id, "departureLocation", e.target.value)
                }
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addCarpool}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Carpool Offer
          </button>
        </div>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const slots: VolunteerSlot[] = state?.volunteerSlots || [];
    const carpools: CarpoolOffer[] = state?.carpoolOffers || [];
    if (slots.length === 0 && carpools.length === 0) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return (
      <>
        {slots.length > 0 && (
          <>
            <h2
              className={`text-2xl mb-4 ${accentClass}`}
              style={{ ...headingShadow, ...(titleColor || {}) }}
            >
              Volunteers Needed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                    slot.filled
                      ? "bg-green-500/20"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span
                    className={`font-medium ${textClass}`}
                    style={bodyShadow}
                  >
                    {slot.role}
                  </span>
                  {slot.filled ? (
                    <span
                      className={`text-sm opacity-80 ${textClass}`}
                      style={bodyShadow}
                    >
                      ✓ {slot.name || "Filled"}
                    </span>
                  ) : (
                    <span className="text-sm px-2 py-1 bg-orange-500/30 rounded text-orange-200">
                      Open
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {carpools.length > 0 && (
          <>
            <h2
              className={`text-2xl mb-4 ${accentClass}`}
              style={{ ...headingShadow, ...(titleColor || {}) }}
            >
              Carpool Offers
            </h2>
            <div className="space-y-3">
              {carpools
                .filter((c) => c.driverName)
                .map((cp) => (
                  <div
                    key={cp.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`font-semibold ${textClass}`}
                        style={bodyShadow}
                      >
                        {cp.driverName}
                      </div>
                      <span className="px-2 py-1 bg-cyan-500/30 rounded text-cyan-200 text-sm">
                        {cp.seatsAvailable} seat
                        {cp.seatsAvailable !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className={`text-sm opacity-70 ${textClass}`}
                      style={bodyShadow}
                    >
                      {cp.departureLocation && (
                        <span>{cp.departureLocation}</span>
                      )}
                      {cp.departureTime && (
                        <span> • {formatTime(cp.departureTime)}</span>
                      )}
                    </div>
                    {cp.phone && (
                      <a
                        href={`tel:${cp.phone}`}
                        className={`inline-flex items-center gap-1 text-sm mt-2 opacity-80 hover:opacity-100 ${textClass}`}
                      >
                        <Phone size={14} /> {cp.phone}
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: ANNOUNCEMENTS & REMINDERS
// ═══════════════════════════════════════════════════════════════════════════

const announcementsSection = {
  id: "announcements",
  menuTitle: "Announcements",
  menuDesc: "Updates, reminders, schedule changes.",
  initialState: {
    announcements: [
      {
        id: "ann1",
        text: "SCHEDULE CHANGE: Our session has been moved from 9:00 AM to 11:15 AM due to the Level 3-4 session running long. Please adjust your arrival time accordingly. New warm-up time is 10:30 AM.",
        priority: "urgent" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ann2",
        text: "Reminder: All athletes must have their competition hair and makeup done BEFORE arriving at the venue. We will not have time for touch-ups. Please arrive with hair secured in a high bun with the navy scrunchie.",
        priority: "normal" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ann3",
        text: "We still need 2 more timers and 1 score flasher for this meet. Please sign up using the Volunteers section above if you can help! Training will be provided on-site.",
        priority: "normal" as const,
        createdAt: new Date().toISOString(),
      },
    ] as {
      id: string;
      text: string;
      priority: "normal" | "urgent";
      createdAt: string;
    }[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const announcements = state?.announcements || [];

    const addAnnouncement = () => {
      setState((s: any) => ({
        ...s,
        announcements: [
          ...(s?.announcements || []),
          {
            id: genId(),
            text: "",
            priority: "normal",
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    };

    const updateAnnouncement = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        announcements: (s?.announcements || []).map((a: any) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    };

    const removeAnnouncement = (id: string) => {
      setState((s: any) => ({
        ...s,
        announcements: (s?.announcements || []).filter((a: any) => a.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-red-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-900">Announcements</h4>
              <p className="text-sm text-red-700">
                Important updates, schedule changes, reminders for parents.
              </p>
            </div>
          </div>
        </div>

        {announcements.map((ann: any, idx: number) => (
          <div
            key={ann.id}
            className={`border rounded-xl p-4 space-y-3 ${
              ann.priority === "urgent"
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Announcement #{idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateAnnouncement(
                      ann.id,
                      "priority",
                      ann.priority === "urgent" ? "normal" : "urgent"
                    )
                  }
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    ann.priority === "urgent"
                      ? "bg-red-200 text-red-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ann.priority === "urgent" ? "🚨 Urgent" : "Normal"}
                </button>
                <button
                  onClick={() => removeAnnouncement(ann.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <textarea
              className={textareaClass}
              placeholder="Type your announcement..."
              value={ann.text}
              onChange={(e) =>
                updateAnnouncement(ann.id, "text", e.target.value)
              }
              rows={3}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAnnouncement}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Announcement
        </button>
      </div>
    );
  },
  renderPreview: ({
    state,
    textClass,
    accentClass,
    headingShadow,
    bodyShadow,
    titleColor,
  }) => {
    const announcements =
      state?.announcements?.filter((a: any) => a.text) || [];
    if (announcements.length === 0) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Announcements
        </h2>
        <div className="space-y-3">
          {announcements.map((ann: any) => (
            <div
              key={ann.id}
              className={`rounded-lg p-4 ${
                ann.priority === "urgent"
                  ? "bg-red-500/20 border border-red-400/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {ann.priority === "urgent" && (
                <div className="flex items-center gap-2 mb-2 text-red-200">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold uppercase">Urgent</span>
                </div>
              )}
              <p
                className={`whitespace-pre-wrap ${textClass}`}
                style={bodyShadow}
              >
                {ann.text}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const config = {
  slug: "gymnastics-schedule",
  displayName: "Gymnastics Schedule",
  category: "sport_gymnastics_schedule",
  categoryLabel: "Gymnastics",
  themesExpandedByDefault: false,
  defaultHero:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1800&q=80",
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Response settings for athletes.",
    editorTitle: "Confirm Attendance",
    toggleLabel: "Enable Attendance RSVP",
    deadlineLabel: "Response Deadline",
    helperText: "Athletes/parents can confirm attendance status.",
  },
  prefill: {
    title: "Illinois State Invitational",
    venue: "Redbird Arena",
    address: "200 N University St, Normal, IL 61761",
    city: "Normal",
    state: "IL",
    details:
      "Level 4-7 compulsory and optional competition. Athletes should arrive 90 minutes before session start for team warm-up. Parents are welcome to watch from the stands. Concessions available.",
    extra: {
      team: "Northern Illinois Gymnastics",
      season: "2025 Season",
      primaryVenue: "Redbird Arena, Normal IL",
      coach: "Coach Maria Rivera",
      assistantCoach: "Coach Jessica Thompson",
      coachPhone: "(815) 555-0142",
    },
  },
  detailFields: [
    { key: "team", label: "Team", placeholder: "NIU Gymnastics" },
    { key: "season", label: "Season", placeholder: "2025 Season" },
    { key: "primaryVenue", label: "Primary Venue", placeholder: "Main Gym" },
    { key: "coach", label: "Head Coach", placeholder: "Coach Rivera" },
    {
      key: "assistantCoach",
      label: "Assistant Coach",
      placeholder: "Coach Thompson",
    },
    {
      key: "coachPhone",
      label: "Coach Contact",
      placeholder: "(555) 123-4567",
    },
  ],
  themes: [
    {
      id: "lilac_ribbon",
      name: "Lilac Ribbon",
      bg: "bg-gradient-to-br from-purple-900 via-fuchsia-700 to-sky-500",
      text: "text-white",
      accent: "text-sky-100",
      preview: "bg-gradient-to-r from-purple-900 via-fuchsia-700 to-sky-500",
    },
    {
      id: "ice_blue",
      name: "Ice Blue",
      bg: "bg-gradient-to-br from-slate-900 via-blue-800 to-cyan-600",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600",
    },
    {
      id: "rose_gold",
      name: "Rose Gold",
      bg: "bg-gradient-to-br from-rose-900 via-amber-600 to-rose-400",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-rose-900 via-amber-600 to-rose-400",
    },
    {
      id: "champion_gold",
      name: "Champion Gold",
      bg: "bg-gradient-to-br from-yellow-600 via-amber-500 to-orange-500",
      text: "text-white",
      accent: "text-yellow-100",
      preview: "bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500",
    },
    {
      id: "power_purple",
      name: "Power Purple",
      bg: "bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-600",
      text: "text-white",
      accent: "text-pink-200",
      preview: "bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-600",
    },
    {
      id: "electric_cyan",
      name: "Electric Cyan",
      bg: "bg-gradient-to-br from-cyan-900 via-teal-700 to-cyan-400",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-cyan-900 via-teal-700 to-cyan-400",
    },
    {
      id: "fire_red",
      name: "Fire Red",
      bg: "bg-gradient-to-br from-red-900 via-rose-700 to-red-500",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-red-900 via-rose-700 to-red-500",
    },
    {
      id: "neon_green",
      name: "Neon Green",
      bg: "bg-gradient-to-br from-emerald-900 via-green-600 to-lime-400",
      text: "text-white",
      accent: "text-lime-100",
      preview: "bg-gradient-to-r from-emerald-900 via-green-600 to-lime-400",
    },
    {
      id: "midnight_blue",
      name: "Midnight Blue",
      bg: "bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-700",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-700",
    },
    {
      id: "sunset_orange",
      name: "Sunset Orange",
      bg: "bg-gradient-to-br from-orange-900 via-red-600 to-pink-500",
      text: "text-white",
      accent: "text-orange-100",
      preview: "bg-gradient-to-r from-orange-900 via-red-600 to-pink-500",
    },
    {
      id: "vibrant_violet",
      name: "Vibrant Violet",
      bg: "bg-gradient-to-br from-violet-900 via-purple-700 to-fuchsia-600",
      text: "text-white",
      accent: "text-violet-100",
      preview: "bg-gradient-to-r from-violet-900 via-purple-700 to-fuchsia-600",
    },
    {
      id: "titanium_silver",
      name: "Titanium Silver",
      bg: "bg-gradient-to-br from-slate-800 via-gray-700 to-slate-600",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600",
    },
  ],
  advancedSections: [
    rosterSection,
    meetSection,
    practiceSection,
    logisticsSection,
    gearSection,
    volunteersSection,
    announcementsSection,
  ],
};

const Page = createSimpleCustomizePage(config);
export default Page;
