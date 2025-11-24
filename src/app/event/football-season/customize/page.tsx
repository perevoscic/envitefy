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
  Home,
  Plane,
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
        "black", "slate-9", "stone-9", "neutral-9", "gray-9", "grey-9",
        "indigo-9", "purple-9", "violet-9", "emerald-9", "teal-9", "blue-9",
        "navy", "midnight",
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
    const titleColor = isDarkBackground
      ? { color: "#f5e6d3" }
      : undefined;

    const locationParts = [data.venue, data.city, data.state]
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
            createdVia: "template",
            createdManually: true,
            startISO,
            endISO,
            location: locationParts || undefined,
            venue: data.venue || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
            numberOfGuests: 0,
            templateId: config.slug,
            customFields: {
              ...data.extra,
              advancedSections: advancedState,
            },
            advancedSections: advancedState,
            heroImage: data.hero || config.defaultHero,
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
      submitting, data.date, data.time, data.title, data.details, data.venue,
      data.hero, data.rsvpEnabled, data.rsvpDeadline, data.extra, advancedState,
      locationParts, config.category, config.displayName, config.slug,
      config.defaultHero, router,
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
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

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
      <EditorLayout title="Headline" onBack={() => setActiveView("main")} showBack>
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
      <EditorLayout title="Images" onBack={() => setActiveView("main")} showBack>
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            Hero Image
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-50 transition-colors relative">
            {data.hero ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
                <img src={data.hero} alt="Hero" className="w-full h-full object-cover" />
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
                <p className="text-sm text-slate-600 mb-1">Upload header photo</p>
                <p className="text-xs text-slate-400">Recommended: 1600x900px</p>
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
      <EditorLayout title="Design" onBack={() => setActiveView("main")} showBack>
        <div className="space-y-3">
          <button
            onClick={() => setThemesExpanded(!themesExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Palette size={16} /> Theme ({config.themes.length})
            </div>
            {themesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
              <div className={`w-3 h-3 rounded-full border shadow-sm ${currentTheme.preview?.split(" ")[0] || "bg-slate-200"}`}></div>
              <span>Current theme: {currentTheme.name}</span>
            </div>
          )}
        </div>
      </EditorLayout>
    );

    const renderDetailsEditor = () => (
      <EditorLayout title="Details" onBack={() => setActiveView("main")} showBack>
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
      <EditorLayout title={rsvpCopy.editorTitle} onBack={() => setActiveView("main")} showBack>
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-medium text-slate-700 text-sm">{rsvpCopy.toggleLabel}</span>
            <button
              onClick={() => setData((p) => ({ ...p, rsvpEnabled: !p.rsvpEnabled }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${data.rsvpEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.rsvpEnabled ? "translate-x-5" : "translate-x-0"}`}></span>
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
      <EditorLayout title={section.menuTitle} onBack={() => setActiveView("main")} showBack>
        {section.renderEditor({
          state: advancedState?.[section.id],
          setState: (updater: any) => setAdvancedSectionState(section.id, updater),
          setActiveView,
          inputClass: baseInputClass,
          textareaClass: baseTextareaClass,
        })}
      </EditorLayout>
    );

    const infoLine = (
      <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-base font-medium opacity-90 ${textClass}`} style={bodyShadow}>
        <span>
          {new Date(data.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
        <div {...previewTouchHandlers} className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
          <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 mb-20 md:mb-24 pb-8 transition-all duration-500 ease-in-out">
            <div className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${textClass} transition-all duration-500 relative z-0`}>
              <div className="relative z-10">
                <div className={`p-6 md:p-8 border-b border-white/10 ${textClass}`}>
                  <div className="cursor-pointer hover:opacity-80 transition-opacity group" onClick={() => {}}>
                    <h1 className={`text-3xl md:text-5xl font-serif mb-2 leading-tight flex items-center gap-2 ${textClass}`} style={{ fontFamily: "var(--font-playfair)", ...(headingShadow || {}), ...(titleColor || {}) }}>
                      {data.title || config.displayName}
                      <span className="inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity"><Edit2 size={22} /></span>
                    </h1>
                    {infoLine}
                  </div>
                </div>

                <div className="relative w-full h-64 md:h-96">
                  {data.hero ? (
                    <img src={data.hero} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <Image src={config.defaultHero} alt="Hero" fill className="object-cover" sizes="(max-width: 768px) 100vw, 1000px" />
                  )}
                </div>

                <section className="py-10 border-t border-white/10 px-6 md:px-10">
                  <h2 className={`text-2xl mb-3 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Details</h2>
                  {data.details ? (
                    <p className={`text-base leading-relaxed opacity-90 whitespace-pre-wrap ${textClass}`} style={bodyShadow}>{data.details}</p>
                  ) : (
                    <p className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>Add a short description so guests know what to expect.</p>
                  )}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.detailFields.map((field) => {
                      const val = data.extra[field.key];
                      return (
                        <div key={field.key} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className={`text-xs uppercase tracking-wide opacity-80 ${textClass}`} style={bodyShadow}>{field.label}</div>
                          <div className={`mt-2 text-base font-semibold opacity-90 ${textClass}`} style={bodyShadow}>{val || "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {config.advancedSections?.map((section) =>
                  section.renderPreview ? (
                    <section key={section.id} className="py-8 border-t border-white/10 px-6 md:px-10">
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
                    <h2 className={`text-2xl mb-6 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>{rsvpCopy.editorTitle}</h2>
                    <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-xl text-left">
                      {!rsvpSubmitted ? (
                        <div className="space-y-6">
                          <div className="text-center mb-4">
                            <p className="opacity-80">{data.rsvpDeadline ? `Kindly respond by ${new Date(data.rsvpDeadline).toLocaleDateString()}` : "Please RSVP"}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Full Name</label>
                            <input className="w-full p-4 rounded-lg bg-white/10 border border-white/20 focus:border-white/50 outline-none transition-colors text-inherit placeholder:text-inherit/30" placeholder="Guest Name" />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setRsvpSubmitted(true); }} className="w-full py-4 mt-2 bg-white text-slate-900 font-bold uppercase tracking-widest text-sm rounded-lg hover:bg-slate-200 transition-colors shadow-lg">
                            Send RSVP
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-4xl mb-4">🎉</div>
                          <h3 className="text-2xl font-serif mb-2">Thank you!</h3>
                          <p className="opacity-70">Your RSVP has been sent.</p>
                          <button onClick={(e) => { e.stopPropagation(); setRsvpSubmitted(false); setRsvpAttending("yes"); }} className="text-sm underline mt-6 opacity-50 hover:opacity-100">
                            Send another response
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 justify-center">
                      <button onClick={() => handleShare()} className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        <Share2 size={16} /><span className="hidden sm:inline">Share link</span>
                      </button>
                      <button onClick={() => handleGoogleCalendar()} className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        <CalendarIcon size={16} /><span className="hidden sm:inline">Google Cal</span>
                      </button>
                      <button onClick={() => handleAppleCalendar()} className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        <Apple size={16} /><span className="hidden sm:inline">Apple Cal</span>
                      </button>
                      <button onClick={() => handleOutlookCalendar()} className="flex items-center justify-center gap-2 sm:gap-2 px-3 py-2 text-sm border border-white/20 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
                        <CalendarIcon size={16} /><span className="hidden sm:inline">Outlook</span>
                      </button>
                    </div>
                  </section>
                )}

                <footer className={`text-center py-8 border-t border-white/10 mt-1 ${textClass}`}>
                  <a href="https://envitefy.com" target="_blank" rel="noopener noreferrer" className="space-y-1 inline-block no-underline">
                    <p className="text-sm opacity-60" style={bodyShadow}>Powered By Envitefy. Create. Share. Enjoy.</p>
                    <p className="text-xs opacity-50" style={bodyShadow}>Create yours now.</p>
                  </a>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && <div className="md:hidden fixed inset-0 bg-slate-900/50 z-10" onClick={closeMobileMenu} role="presentation"></div>}

        <div className={`w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`} {...drawerTouchHandlers}>
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
            <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
              <button onClick={closeMobileMenu} className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1">
                <ChevronLeft size={14} />Back to preview
              </button>
              <span className="text-sm font-semibold text-slate-700">Customize</span>
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
                  <React.Fragment key={section.id}>{renderAdvancedEditor(section)}</React.Fragment>
                ) : null
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <button onClick={handlePublish} disabled={submitting} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-sm tracking-wide transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>

        {!mobileMenuOpen && (
          <div className="md:hidden fixed bottom-4 right-4 z-30">
            <button type="button" onClick={openMobileMenu} className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-3 text-sm font-semibold shadow-lg">
              <Menu size={18} />Edit
            </button>
          </div>
        )}
      </div>
    );
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL SEASON MANAGEMENT - TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type PlayerStatus = "active" | "injured" | "ineligible" | "pending";

type Player = {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  medicalNotes: string;
  status: PlayerStatus;
};

type Game = {
  id: string;
  opponent: string;
  date: string;
  time: string;
  homeAway: "home" | "away";
  venue: string;
  address: string;
  conference: boolean;
  broadcast: string;
  ticketsLink: string;
  result: "W" | "L" | "T" | null;
  score: string;
};

type PracticeBlock = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  arrivalTime: string;
  type: "full_pads" | "shells" | "helmets" | "no_contact" | "walk_through";
  positionGroups: string[];
  focus: string;
  film: boolean;
};

type LogisticsInfo = {
  travelMode: "bus" | "parent_drive" | "carpool" | "other";
  callTime: string;
  departureTime: string;
  pickupWindow: string;
  hotelName: string;
  hotelAddress: string;
  mealPlan: string;
  weatherPolicy: string;
};

type GearItem = {
  id: string;
  name: string;
  required: boolean;
  forGames: boolean;
  forPractice: boolean;
};

type VolunteerSlot = {
  id: string;
  role: string;
  name: string;
  filled: boolean;
  gameDate: string;
};

const genId = () => Math.random().toString(36).substring(2, 9);

const POSITIONS = [
  "QB", "RB", "FB", "WR", "TE", "OT", "OG", "C",
  "DE", "DT", "NT", "OLB", "MLB", "ILB", "CB", "FS", "SS",
  "K", "P", "LS", "KR", "PR"
];
const GRADES = ["Freshman", "Sophomore", "Junior", "Senior"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PRACTICE_TYPES = [
  { value: "full_pads", label: "Full Pads" },
  { value: "shells", label: "Shells (Shoulder Pads Only)" },
  { value: "helmets", label: "Helmets Only" },
  { value: "no_contact", label: "No Contact / Shorts" },
  { value: "walk_through", label: "Walk-Through" },
];
const POSITION_GROUPS = ["Offense", "Defense", "Special Teams", "O-Line", "D-Line", "Skill", "Linebackers", "Secondary"];
const VOLUNTEER_ROLES = ["Chain Gang", "Clock Operator", "Concessions", "Gate/Tickets", "Team Mom", "Water/Gatorade", "Equipment", "Film/Video", "First Aid", "Announcer"];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: GAME SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

const gameScheduleSection = {
  id: "games",
  menuTitle: "Game Schedule",
  menuDesc: "Home/away games, opponents, dates, times, results.",
  initialState: {
    games: [] as Game[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const games: Game[] = state?.games || [];
    const addGame = () => {
      setState((s: any) => ({
        ...s,
        games: [...(s?.games || []), {
          id: genId(), opponent: "", date: "", time: "19:00",
          homeAway: "home", venue: "", address: "", conference: true,
          broadcast: "", ticketsLink: "", result: null, score: "",
        }],
      }));
    };
    const updateGame = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        games: (s?.games || []).map((g: Game) => g.id === id ? { ...g, [field]: value } : g),
      }));
    };
    const removeGame = (id: string) => {
      setState((s: any) => ({ ...s, games: (s?.games || []).filter((g: Game) => g.id !== id) }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900">Season Schedule</h4>
              <p className="text-sm text-amber-700">Add all games for the season with home/away details.</p>
            </div>
          </div>
        </div>

        {games.map((game, idx) => (
          <div key={game.id} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Game #{idx + 1}</span>
                {game.homeAway === "home" ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1"><Home size={12} />HOME</span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1"><Plane size={12} />AWAY</span>
                )}
              </div>
              <button onClick={() => removeGame(game.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Opponent *</label>
                <input className={inputClass} placeholder="Central High Tigers" value={game.opponent} onChange={(e) => updateGame(game.id, "opponent", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                <input type="date" className={inputClass} value={game.date} onChange={(e) => updateGame(game.id, "date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Kickoff</label>
                <input type="time" className={inputClass} value={game.time} onChange={(e) => updateGame(game.id, "time", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Home/Away</label>
                <select className={inputClass} value={game.homeAway} onChange={(e) => updateGame(game.id, "homeAway", e.target.value)}>
                  <option value="home">🏠 Home</option>
                  <option value="away">✈️ Away</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Conference Game</label>
                <select className={inputClass} value={game.conference ? "yes" : "no"} onChange={(e) => updateGame(game.id, "conference", e.target.value === "yes")}>
                  <option value="yes">Yes - Conference</option>
                  <option value="no">No - Non-Conference</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Venue</label>
              <input className={inputClass} placeholder="Panthers Stadium" value={game.venue} onChange={(e) => updateGame(game.id, "venue", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Address</label>
              <input className={inputClass} placeholder="123 Stadium Way, City, ST 12345" value={game.address} onChange={(e) => updateGame(game.id, "address", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Result</label>
                <select className={`${inputClass} ${game.result === "W" ? "bg-green-50 border-green-300" : game.result === "L" ? "bg-red-50 border-red-300" : game.result === "T" ? "bg-yellow-50 border-yellow-300" : ""}`} value={game.result || ""} onChange={(e) => updateGame(game.id, "result", e.target.value || null)}>
                  <option value="">Upcoming</option>
                  <option value="W">✓ Win</option>
                  <option value="L">✗ Loss</option>
                  <option value="T">— Tie</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Score</label>
                <input className={inputClass} placeholder="28-14" value={game.score} onChange={(e) => updateGame(game.id, "score", e.target.value)} />
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addGame} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />Add Game
        </button>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const games: Game[] = state?.games || [];
    if (games.length === 0) return null;

    const formatDate = (d: string) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
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
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Game Schedule</h2>
        <div className="space-y-3">
          {games.map((game) => (
            <div key={game.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${game.homeAway === "home" ? "bg-green-500/20 text-green-200" : "bg-blue-500/20 text-blue-200"}`}>
                    {game.homeAway === "home" ? "HOME" : "AWAY"}
                  </span>
                  {game.conference && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs">CONF</span>}
                </div>
                {game.result && (
                  <span className={`px-2 py-1 rounded text-sm font-bold ${game.result === "W" ? "bg-green-500/20 text-green-200" : game.result === "L" ? "bg-red-500/20 text-red-200" : "bg-yellow-500/20 text-yellow-200"}`}>
                    {game.result} {game.score}
                  </span>
                )}
              </div>
              <div className={`font-semibold text-lg ${textClass}`} style={bodyShadow}>
                vs {game.opponent || "TBD"}
              </div>
              <div className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>
                {formatDate(game.date)} • {formatTime(game.time)} • {game.venue || "TBD"}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm opacity-70" style={bodyShadow}>
          <span className={textClass}>{games.filter((g) => g.result === "W").length}W</span>
          <span className={textClass}>{games.filter((g) => g.result === "L").length}L</span>
          <span className={textClass}>{games.filter((g) => !g.result).length} Upcoming</span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: TEAM ROSTER
// ═══════════════════════════════════════════════════════════════════════════

const rosterSection = {
  id: "roster",
  menuTitle: "Team Roster",
  menuDesc: "Players, positions, jersey numbers, parent contacts.",
  initialState: { players: [] as Player[] },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const players: Player[] = state?.players || [];
    const addPlayer = () => {
      setState((s: any) => ({
        ...s,
        players: [...(s?.players || []), {
          id: genId(), name: "", jerseyNumber: "", position: "QB",
          grade: "Junior", parentName: "", parentPhone: "", parentEmail: "",
          medicalNotes: "", status: "active" as PlayerStatus,
        }],
      }));
    };
    const updatePlayer = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        players: (s?.players || []).map((p: Player) => p.id === id ? { ...p, [field]: value } : p),
      }));
    };
    const removePlayer = (id: string) => {
      setState((s: any) => ({ ...s, players: (s?.players || []).filter((p: Player) => p.id !== id) }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-purple-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-purple-900">Team Roster</h4>
              <p className="text-sm text-purple-700">Add players with positions, jersey numbers, and parent contact info.</p>
            </div>
          </div>
        </div>

        {players.map((player, idx) => (
          <div key={player.id} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Player #{idx + 1}</span>
              <button onClick={() => removePlayer(player.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Player Name *</label>
                <input className={inputClass} placeholder="John Smith" value={player.name} onChange={(e) => updatePlayer(player.id, "name", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Jersey #</label>
                <input className={inputClass} placeholder="12" value={player.jerseyNumber} onChange={(e) => updatePlayer(player.id, "jerseyNumber", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Position</label>
                <select className={inputClass} value={player.position} onChange={(e) => updatePlayer(player.id, "position", e.target.value)}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Grade</label>
                <select className={inputClass} value={player.grade} onChange={(e) => updatePlayer(player.id, "grade", e.target.value)}>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                <select className={`${inputClass} ${player.status === "active" ? "bg-green-50 border-green-300" : player.status === "injured" ? "bg-red-50 border-red-300" : player.status === "ineligible" ? "bg-yellow-50 border-yellow-300" : ""}`} value={player.status} onChange={(e) => updatePlayer(player.id, "status", e.target.value)}>
                  <option value="active">✓ Active</option>
                  <option value="injured">🤕 Injured</option>
                  <option value="ineligible">⚠️ Ineligible</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Parent/Guardian Contact</label>
              <div className="grid grid-cols-1 gap-3">
                <input className={inputClass} placeholder="Parent Name" value={player.parentName} onChange={(e) => updatePlayer(player.id, "parentName", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Phone" type="tel" value={player.parentPhone} onChange={(e) => updatePlayer(player.id, "parentPhone", e.target.value)} />
                  <input className={inputClass} placeholder="Email" type="email" value={player.parentEmail} onChange={(e) => updatePlayer(player.id, "parentEmail", e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Medical Notes (optional)</label>
              <textarea className={textareaClass} placeholder="Allergies, injuries, restrictions..." value={player.medicalNotes} onChange={(e) => updatePlayer(player.id, "medicalNotes", e.target.value)} rows={2} />
            </div>
          </div>
        ))}

        <button type="button" onClick={addPlayer} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />Add Player
        </button>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const players: Player[] = state?.players || [];
    if (players.length === 0) return null;

    const statusIcon = (s: PlayerStatus) => {
      switch (s) {
        case "active": return "✓";
        case "injured": return "🤕";
        case "ineligible": return "⚠️";
        default: return "⏳";
      }
    };
    const statusColor = (s: PlayerStatus) => {
      switch (s) {
        case "active": return "bg-green-500/20 text-green-200";
        case "injured": return "bg-red-500/20 text-red-200";
        case "ineligible": return "bg-yellow-500/20 text-yellow-200";
        default: return "bg-white/10 text-white/60";
      }
    };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Team Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player) => (
            <div key={player.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold opacity-50">#{player.jerseyNumber || "?"}</span>
                    <div>
                      <div className={`font-semibold ${textClass}`} style={bodyShadow}>{player.name || "Unnamed"}</div>
                      <div className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>{player.position} • {player.grade}</div>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor(player.status)}`}>{statusIcon(player.status)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm opacity-70" style={bodyShadow}>
          <span className={textClass}>{players.filter((p) => p.status === "active").length} Active</span>
          <span className={textClass}>{players.filter((p) => p.status === "injured").length} Injured</span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: PRACTICE SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

const practiceSection = {
  id: "practice",
  menuTitle: "Practice Schedule",
  menuDesc: "Weekly practice blocks, times, focus areas, equipment.",
  initialState: {
    blocks: [
      { id: "p1", day: "Monday", startTime: "15:30", endTime: "18:00", arrivalTime: "15:15", type: "full_pads" as const, positionGroups: ["Offense", "Defense"], focus: "Install new plays, team run/pass", film: false },
      { id: "p2", day: "Wednesday", startTime: "15:30", endTime: "18:00", arrivalTime: "15:15", type: "shells" as const, positionGroups: ["Offense", "Defense"], focus: "Opponent prep, situational football", film: true },
      { id: "p3", day: "Thursday", startTime: "15:30", endTime: "17:00", arrivalTime: "15:15", type: "helmets" as const, positionGroups: ["Offense", "Defense", "Special Teams"], focus: "Walk-through, special teams, light contact", film: false },
    ] as PracticeBlock[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const blocks: PracticeBlock[] = state?.blocks || [];
    const addBlock = () => {
      setState((s: any) => ({
        ...s,
        blocks: [...(s?.blocks || []), {
          id: genId(), day: "Tuesday", startTime: "15:30", endTime: "18:00",
          arrivalTime: "15:15", type: "full_pads" as const, positionGroups: [], focus: "", film: false,
        }],
      }));
    };
    const updateBlock = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) => b.id === id ? { ...b, [field]: value } : b),
      }));
    };
    const removeBlock = (id: string) => {
      setState((s: any) => ({ ...s, blocks: (s?.blocks || []).filter((b: PracticeBlock) => b.id !== id) }));
    };
    const toggleGroup = (id: string, group: string) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) => {
          if (b.id !== id) return b;
          const groups = b.positionGroups || [];
          return { ...b, positionGroups: groups.includes(group) ? groups.filter((g) => g !== group) : [...groups, group] };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="text-emerald-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-emerald-900">Weekly Practice Plan</h4>
              <p className="text-sm text-emerald-700">Define practice blocks with equipment level, focus areas, and arrival times.</p>
            </div>
          </div>
        </div>

        {blocks.map((block, idx) => (
          <div key={block.id} className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Practice #{idx + 1}</span>
              <button onClick={() => removeBlock(block.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Day</label>
                <select className={inputClass} value={block.day} onChange={(e) => updateBlock(block.id, "day", e.target.value)}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Practice Type</label>
                <select className={inputClass} value={block.type} onChange={(e) => updateBlock(block.id, "type", e.target.value)}>
                  {PRACTICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Arrive By</label>
                <input type="time" className={inputClass} value={block.arrivalTime} onChange={(e) => updateBlock(block.id, "arrivalTime", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Start</label>
                <input type="time" className={inputClass} value={block.startTime} onChange={(e) => updateBlock(block.id, "startTime", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">End</label>
                <input type="time" className={inputClass} value={block.endTime} onChange={(e) => updateBlock(block.id, "endTime", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Position Groups</label>
              <div className="flex flex-wrap gap-2">
                {POSITION_GROUPS.map((group) => (
                  <button key={group} type="button" onClick={() => toggleGroup(block.id, group)} className={`px-3 py-1.5 text-sm rounded-full border transition-all ${(block.positionGroups || []).includes(group) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"}`}>
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Focus / Plan</label>
              <textarea className={textareaClass} placeholder="Red zone offense, 7-on-7, conditioning..." value={block.focus} onChange={(e) => updateBlock(block.id, "focus", e.target.value)} rows={2} />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id={`film-${block.id}`} checked={block.film} onChange={(e) => updateBlock(block.id, "film", e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
              <label htmlFor={`film-${block.id}`} className="text-sm text-slate-600">Pre-practice film session</label>
            </div>
          </div>
        ))}

        <button type="button" onClick={addBlock} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />Add Practice Block
        </button>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
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
    const typeLabel = (t: string) => PRACTICE_TYPES.find((pt) => pt.value === t)?.label || t;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Practice Schedule</h2>
        <div className="space-y-3">
          {blocks.map((block) => (
            <div key={block.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`font-semibold ${textClass}`} style={bodyShadow}>{block.day}</div>
                <span className="px-2 py-0.5 bg-white/10 rounded text-xs">{typeLabel(block.type)}</span>
              </div>
              <div className={`text-sm opacity-80 ${textClass}`} style={bodyShadow}>
                {formatTime(block.startTime)} - {formatTime(block.endTime)} (arrive {formatTime(block.arrivalTime)})
              </div>
              {block.focus && <div className={`text-sm opacity-70 mt-2 ${textClass}`} style={bodyShadow}>{block.focus}</div>}
              {block.film && <div className="mt-2 px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs inline-block">📹 Film Session Before</div>}
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: TRAVEL & LOGISTICS
// ═══════════════════════════════════════════════════════════════════════════

const logisticsSection = {
  id: "logistics",
  menuTitle: "Travel & Logistics",
  menuDesc: "Away game travel, bus times, weather policy.",
  initialState: {
    travelMode: "bus" as const,
    callTime: "14:00",
    departureTime: "14:30",
    pickupWindow: "Return approx 11:00 PM - text sent when bus is 20 min out",
    hotelName: "",
    hotelAddress: "",
    mealPlan: "Pre-game meal provided. Bring snacks for the bus.",
    weatherPolicy: "Lightning: Players go to locker room. 30-min delay clock starts. Practice continues if no lightning for 30 min. Heavy rain: Moved indoors or cancelled (check GroupMe).",
  } as LogisticsInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const info: LogisticsInfo = state || {};
    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bus className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">Away Game Travel</h4>
              <p className="text-sm text-blue-700">Transportation details for away games.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Travel Mode</label>
            <select className={inputClass} value={info.travelMode || "bus"} onChange={(e) => updateField("travelMode", e.target.value)}>
              <option value="bus">🚌 Team Bus</option>
              <option value="parent_drive">🚗 Parent Drive</option>
              <option value="carpool">🚙 Carpool</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Call Time</label>
            <input type="time" className={inputClass} value={info.callTime || ""} onChange={(e) => updateField("callTime", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Bus Departure</label>
            <input type="time" className={inputClass} value={info.departureTime || ""} onChange={(e) => updateField("departureTime", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Pickup / Return Info</label>
          <textarea className={textareaClass} placeholder="Return time, where to pick up players..." value={info.pickupWindow || ""} onChange={(e) => updateField("pickupWindow", e.target.value)} rows={2} />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Meal Plan</label>
          <input className={inputClass} placeholder="Pre-game meal info, bring snacks..." value={info.mealPlan || ""} onChange={(e) => updateField("mealPlan", e.target.value)} />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-yellow-900">Weather Policy</h4>
                <p className="text-sm text-yellow-700">Important for parents to know what happens in bad weather.</p>
              </div>
            </div>
          </div>
          <textarea className={textareaClass} placeholder="Lightning protocol, rain policy, cancellation procedure..." value={info.weatherPolicy || ""} onChange={(e) => updateField("weatherPolicy", e.target.value)} rows={3} />
        </div>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const info: LogisticsInfo = state || {};
    const hasData = info.travelMode || info.callTime || info.weatherPolicy;
    if (!hasData) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };
    const modeIcon = { bus: "🚌", parent_drive: "🚗", carpool: "🚙", other: "🚐" };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Travel & Logistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {info.travelMode && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl">{modeIcon[info.travelMode] || "🚐"}</div>
              <div className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>{info.travelMode === "bus" ? "Team Bus" : info.travelMode === "parent_drive" ? "Parent Drive" : info.travelMode === "carpool" ? "Carpool" : "Other"}</div>
            </div>
          )}
          {info.callTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`} style={bodyShadow}>Call Time</div>
              <div className={`text-lg font-bold ${textClass}`} style={bodyShadow}>{formatTime(info.callTime)}</div>
            </div>
          )}
          {info.departureTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`} style={bodyShadow}>Departure</div>
              <div className={`text-lg font-bold ${textClass}`} style={bodyShadow}>{formatTime(info.departureTime)}</div>
            </div>
          )}
        </div>
        {info.pickupWindow && <div className={`text-sm opacity-80 mb-3 ${textClass}`} style={bodyShadow}>📍 {info.pickupWindow}</div>}
        {info.mealPlan && <div className={`text-sm opacity-80 mb-3 ${textClass}`} style={bodyShadow}>🍽️ {info.mealPlan}</div>}
        {info.weatherPolicy && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
            <h3 className={`font-semibold mb-2 ${textClass}`} style={bodyShadow}>⛈️ Weather Policy</h3>
            <p className={`text-sm opacity-80 whitespace-pre-wrap ${textClass}`} style={bodyShadow}>{info.weatherPolicy}</p>
          </div>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: EQUIPMENT CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const gearSection = {
  id: "gear",
  menuTitle: "Equipment Checklist",
  menuDesc: "Required gear for games and practices.",
  initialState: {
    items: [
      { id: "g1", name: "Helmet", required: true, forGames: true, forPractice: true },
      { id: "g2", name: "Shoulder Pads", required: true, forGames: true, forPractice: true },
      { id: "g3", name: "Mouthguard", required: true, forGames: true, forPractice: true },
      { id: "g4", name: "Cleats", required: true, forGames: true, forPractice: true },
      { id: "g5", name: "Game Jersey", required: true, forGames: true, forPractice: false },
      { id: "g6", name: "Practice Jersey (Dark)", required: true, forGames: false, forPractice: true },
      { id: "g7", name: "Practice Jersey (Light)", required: true, forGames: false, forPractice: true },
      { id: "g8", name: "Game Pants", required: true, forGames: true, forPractice: false },
      { id: "g9", name: "Practice Shorts", required: true, forGames: false, forPractice: true },
      { id: "g10", name: "2 Water Bottles", required: true, forGames: true, forPractice: true },
    ] as GearItem[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const items: GearItem[] = state?.items || [];
    const addItem = () => {
      setState((s: any) => ({
        ...s,
        items: [...(s?.items || []), { id: genId(), name: "", required: false, forGames: true, forPractice: true }],
      }));
    };
    const updateItem = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).map((i: GearItem) => i.id === id ? { ...i, [field]: value } : i),
      }));
    };
    const removeItem = (id: string) => {
      setState((s: any) => ({ ...s, items: (s?.items || []).filter((i: GearItem) => i.id !== id) }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shirt className="text-orange-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-orange-900">Equipment Checklist</h4>
              <p className="text-sm text-orange-700">What players need to bring for games and practices.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <input className={`flex-1 ${inputClass} !p-2`} placeholder="Item name" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={item.required} onChange={(e) => updateItem(item.id, "required", e.target.checked)} className="w-4 h-4 rounded" />
                Required
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={item.forGames} onChange={(e) => updateItem(item.id, "forGames", e.target.checked)} className="w-4 h-4 rounded" />
                Games
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={item.forPractice} onChange={(e) => updateItem(item.id, "forPractice", e.target.checked)} className="w-4 h-4 rounded" />
                Practice
              </label>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />Add Item
        </button>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const items: GearItem[] = state?.items || [];
    if (items.length === 0) return null;
    const gameGear = items.filter((i) => i.forGames);
    const practiceGear = items.filter((i) => i.forPractice);

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Equipment Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className={`font-semibold mb-3 ${textClass}`} style={bodyShadow}>🏈 Game Day</h3>
            <ul className="space-y-1">
              {gameGear.map((item) => (
                <li key={item.id} className={`flex items-center gap-2 text-sm ${textClass}`} style={bodyShadow}>
                  <span>{item.required ? "✓" : "○"}</span>
                  <span className={item.required ? "" : "opacity-70"}>{item.name}</span>
                  {item.required && <span className="text-xs bg-red-500/20 text-red-200 px-1 rounded">REQ</span>}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className={`font-semibold mb-3 ${textClass}`} style={bodyShadow}>🏃 Practice</h3>
            <ul className="space-y-1">
              {practiceGear.map((item) => (
                <li key={item.id} className={`flex items-center gap-2 text-sm ${textClass}`} style={bodyShadow}>
                  <span>{item.required ? "✓" : "○"}</span>
                  <span className={item.required ? "" : "opacity-70"}>{item.name}</span>
                  {item.required && <span className="text-xs bg-red-500/20 text-red-200 px-1 rounded">REQ</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: VOLUNTEERS
// ═══════════════════════════════════════════════════════════════════════════

const volunteersSection = {
  id: "volunteers",
  menuTitle: "Parent Volunteers",
  menuDesc: "Chain gang, concessions, and other game day help.",
  initialState: { slots: [] as VolunteerSlot[] },
  renderEditor: ({ state, setState, inputClass }) => {
    const slots: VolunteerSlot[] = state?.slots || [];
    const addSlot = () => {
      setState((s: any) => ({
        ...s,
        slots: [...(s?.slots || []), { id: genId(), role: "Chain Gang", name: "", filled: false, gameDate: "" }],
      }));
    };
    const updateSlot = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        slots: (s?.slots || []).map((sl: VolunteerSlot) => sl.id === id ? { ...sl, [field]: value } : sl),
      }));
    };
    const removeSlot = (id: string) => {
      setState((s: any) => ({ ...s, slots: (s?.slots || []).filter((sl: VolunteerSlot) => sl.id !== id) }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-pink-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-pink-900">Volunteer Sign-ups</h4>
              <p className="text-sm text-pink-700">Game day volunteer positions for parents.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <select className={`${inputClass} !p-2 !w-auto`} value={slot.role} onChange={(e) => updateSlot(slot.id, "role", e.target.value)}>
                {VOLUNTEER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type="date" className={`${inputClass} !p-2 !w-auto`} value={slot.gameDate} onChange={(e) => updateSlot(slot.id, "gameDate", e.target.value)} />
              <input className={`flex-1 ${inputClass} !p-2`} placeholder="Volunteer name" value={slot.name} onChange={(e) => updateSlot(slot.id, "name", e.target.value)} />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={slot.filled} onChange={(e) => updateSlot(slot.id, "filled", e.target.checked)} className="w-4 h-4 rounded" />
                Filled
              </label>
              <button onClick={() => removeSlot(slot.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <button type="button" onClick={addSlot} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-pink-400 hover:text-pink-600 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} />Add Volunteer Slot
        </button>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const slots: VolunteerSlot[] = state?.slots || [];
    if (slots.length === 0) return null;
    const filledCount = slots.filter((s) => s.filled).length;
    const neededCount = slots.filter((s) => !s.filled).length;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={{ ...headingShadow, ...(titleColor || {}) }}>Volunteers Needed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots.filter((s) => !s.filled).map((slot) => (
            <div key={slot.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className={`font-medium ${textClass}`} style={bodyShadow}>{slot.role}</div>
                <div className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>{slot.gameDate ? new Date(slot.gameDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</div>
              </div>
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded text-xs">NEEDED</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm opacity-70" style={bodyShadow}>
          <span className={textClass}>✓ {filledCount} Filled</span>
          <span className={textClass}>⚠️ {neededCount} Needed</span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION & EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const config: SimpleTemplateConfig = {
  slug: "football-season",
  displayName: "Football Season",
  category: "sport_football_season",
  categoryLabel: "Football Season",
  themesExpandedByDefault: true,
  defaultHero: "https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "team", label: "Team Name", placeholder: "Varsity Panthers" },
    { key: "season", label: "Season", placeholder: "Fall 2025" },
    { key: "league", label: "League / Conference", placeholder: "Metro Conference" },
    { key: "headCoach", label: "Head Coach", placeholder: "Coach Johnson" },
    { key: "stadium", label: "Home Stadium", placeholder: "Panthers Field" },
    { key: "stadiumAddress", label: "Stadium Address", placeholder: "123 Main St, Anytown, IL 60000" },
    { key: "athleticTrainer", label: "Athletic Trainer", placeholder: "Available at all games and practices" },
    { key: "contact", label: "Contact", placeholder: "coach@school.edu or 555-123-4567" },
  ],
  prefill: {
    title: "Panthers Football 2025",
    details: "Welcome to the 2025 Football Season! This page has everything players and parents need - game schedule, practice times, equipment list, travel info, and volunteer sign-ups. Go Panthers! 🏈",
    hero: "https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?auto=format&fit=crop&w=1800&q=80",
    date: "2025-11-30",
    time: "14:00",
    city: "Chicago",
    state: "IL",
    venue: "Panthers Field",
    rsvpEnabled: false,
    extra: {
      team: "Varsity Panthers",
      season: "Fall 2025",
      league: "Metro Conference",
      headCoach: "Coach Johnson",
      stadium: "Panthers Field",
      stadiumAddress: "123 Main St, Chicago, IL 60601",
      athleticTrainer: "Athletic Trainer on-site every game and practice",
      contact: "coach@school.edu • 555-123-4567",
    },
  },
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Track attendance and commitments.",
    editorTitle: "Attendance",
    toggleLabel: "Enable attendance tracking",
    deadlineLabel: "Response deadline",
    helperText: "Players and parents can confirm attendance.",
  },
  themes: [
    {
      id: "friday_night",
      name: "Friday Night Lights",
      bg: "bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800",
      text: "text-white",
      accent: "text-emerald-200",
      preview: "bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-800",
    },
    {
      id: "gridiron_sunset",
      name: "Gridiron Sunset",
      bg: "bg-gradient-to-br from-slate-900 via-amber-800 to-orange-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-900 via-amber-800 to-orange-500",
    },
    {
      id: "crimson_pride",
      name: "Crimson Pride",
      bg: "bg-gradient-to-br from-red-900 via-red-800 to-red-700",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-red-900 to-red-700",
    },
    {
      id: "blue_steel",
      name: "Blue Steel",
      bg: "bg-gradient-to-br from-blue-900 via-slate-800 to-blue-800",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-900 to-blue-800",
    },
    {
      id: "gold_rush",
      name: "Gold Rush",
      bg: "bg-gradient-to-br from-yellow-700 via-amber-700 to-yellow-800",
      text: "text-white",
      accent: "text-yellow-100",
      preview: "bg-gradient-to-r from-yellow-700 to-yellow-800",
    },
    {
      id: "purple_reign",
      name: "Purple Reign",
      bg: "bg-gradient-to-br from-purple-900 via-violet-800 to-purple-700",
      text: "text-white",
      accent: "text-purple-200",
      preview: "bg-gradient-to-r from-purple-900 to-purple-700",
    },
    {
      id: "forest_green",
      name: "Forest Green",
      bg: "bg-gradient-to-br from-green-900 via-emerald-800 to-green-700",
      text: "text-white",
      accent: "text-green-200",
      preview: "bg-gradient-to-r from-green-900 to-green-700",
    },
    {
      id: "orange_crush",
      name: "Orange Crush",
      bg: "bg-gradient-to-br from-orange-800 via-red-700 to-orange-600",
      text: "text-white",
      accent: "text-orange-100",
      preview: "bg-gradient-to-r from-orange-800 to-orange-600",
    },
    {
      id: "navy_gold",
      name: "Navy & Gold",
      bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-amber-700",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-blue-950 via-blue-900 to-amber-700",
    },
    {
      id: "black_silver",
      name: "Black & Silver",
      bg: "bg-gradient-to-br from-slate-900 via-gray-800 to-slate-700",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-slate-900 via-gray-800 to-slate-700",
    },
    {
      id: "maroon_white",
      name: "Maroon & White",
      bg: "bg-gradient-to-br from-rose-900 via-rose-800 to-rose-700",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-900 to-rose-700",
    },
    {
      id: "teal_pride",
      name: "Teal Pride",
      bg: "bg-gradient-to-br from-teal-900 via-cyan-800 to-teal-700",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-teal-900 to-teal-700",
    },
  ],
  advancedSections: [
    gameScheduleSection,
    practiceSection,
    rosterSection,
    logisticsSection,
    gearSection,
    volunteersSection,
  ],
};

const Page = createSimpleCustomizePage(config);
export default Page;
