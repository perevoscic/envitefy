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
      submitting,
      data.date,
      data.time,
      data.title,
      data.details,
      data.venue,
      data.hero,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      advancedState,
      locationParts,
      config.category,
      config.displayName,
      config.slug,
      config.defaultHero,
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
      <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
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

const config = {
  slug: "doctor-appointment",
  displayName: "Doctor Appointment",
  category: "doctor_appointment",
  categoryLabel: "Doctor Appointment",
  defaultHero:
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1800&q=80",
  rsvpCopy: {
    menuTitle: "Reminders",
    menuDesc: "Confirmations, follow-ups, and deadlines.",
    editorTitle: "Reminders",
    toggleLabel: "Enable reminders",
    deadlineLabel: "Confirm by",
    helperText:
      "Patients see the confirmation deadline and can respond in the preview card.",
  },
  prefill: {
    title: "Office Visit with Dr. Ramirez",
    time: "10:30",
    city: "Chicago",
    state: "IL",
    venue: "Downtown Family Care",
    details:
      "Please arrive a few minutes early to complete intake. Bring your medication list and recent labs for a thorough review.",
    rsvpDeadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split("T")[0];
    })(),
    extra: {
      provider: "Dr. Elena Ramirez, MD",
      specialty: "Primary Care / Preventive Medicine",
      practice: "Downtown Family Care",
      visitType: "Annual checkup + follow-up",
      reason: "Blood pressure follow-up, medication review",
      prep: "Arrive 15 minutes early. Fasting not required. Bring your current meds list and home BP readings.",
      insurance: "BlueCross PPO #8472930, photo ID required",
      copay: "$25 copay due at check-in (card accepted)",
      documents: "Recent labs, imaging reports, referral letter if available",
      telehealth: "https://practice.example.com/visit",
      portal: "https://portal.example.com",
      contact: "(555) 123-4567",
      address: "123 Main St, Suite 400",
      parking:
        "Garage P2, validated parking; take elevator to 4th floor and check in at front desk",
      notes:
        "Masks optional. Please reschedule if you have fever or respiratory symptoms.",
    },
  },
  detailFields: [
    { key: "provider", label: "Provider", placeholder: "Dr. Ramirez, MD" },
    {
      key: "specialty",
      label: "Specialty",
      placeholder: "Primary Care / Cardiology",
    },
    {
      key: "practice",
      label: "Practice / Clinic",
      placeholder: "Downtown Family Care",
    },
    {
      key: "visitType",
      label: "Visit Type",
      placeholder: "Annual checkup / Follow-up",
    },
    {
      key: "reason",
      label: "Reason for Visit",
      placeholder: "Chest discomfort, med review",
    },
    {
      key: "prep",
      label: "Preparation",
      placeholder: "Arrive 15 min early, fasting, bring meds list",
      type: "textarea",
    },
    {
      key: "insurance",
      label: "Insurance / ID",
      placeholder: "BlueCross #1234567, photo ID required",
    },
    {
      key: "copay",
      label: "Copay / Payment",
      placeholder: "$25 copay, card accepted",
    },
    {
      key: "documents",
      label: "Documents to Bring",
      placeholder: "Lab results, imaging CDs, referral letter",
    },
    {
      key: "telehealth",
      label: "Telehealth Link",
      placeholder: "https://practice.example.com/visit",
    },
    {
      key: "portal",
      label: "Patient Portal",
      placeholder: "https://portal.example.com",
    },
    { key: "contact", label: "Office Phone", placeholder: "(555) 123-4567" },
    {
      key: "address",
      label: "Office Address / Suite",
      placeholder: "123 Main St, Suite 400",
    },
    {
      key: "parking",
      label: "Parking & Arrival",
      placeholder: "Garage P2, validated parking, check in at 4th floor",
    },
    {
      key: "notes",
      label: "Additional Notes",
      placeholder: "Masks optional; reschedule if symptomatic",
      type: "textarea",
    },
  ],
  themes: [
    {
      id: "sterile_white",
      name: "Sterile White",
      bg: "bg-gradient-to-br from-white via-slate-50 to-blue-50",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-gradient-to-r from-white via-slate-50 to-blue-50",
    },
    {
      id: "calm_clinic",
      name: "Calm Clinic",
      bg: "bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-200",
      text: "text-slate-900",
      accent: "text-cyan-700",
      preview: "bg-gradient-to-r from-slate-100 via-cyan-50 to-slate-200",
    },
    {
      id: "deep_care",
      name: "Deep Care",
      bg: "bg-gradient-to-br from-slate-900 via-blue-900 to-sky-700",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-slate-900 via-blue-900 to-sky-700",
    },
    {
      id: "navy_trust",
      name: "Navy Trust",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-800",
      text: "text-white",
      accent: "text-sky-100",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-blue-800",
    },
    {
      id: "mint_fresh",
      name: "Mint Fresh",
      bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-white",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-50 via-teal-50 to-white",
    },
    {
      id: "slate_minimal",
      name: "Slate Minimal",
      bg: "bg-gradient-to-br from-slate-100 via-slate-50 to-white",
      text: "text-slate-900",
      accent: "text-indigo-700",
      preview: "bg-gradient-to-r from-slate-100 via-slate-50 to-white",
    },
    {
      id: "skyline_clinic",
      name: "Skyline Clinic",
      bg: "bg-gradient-to-br from-sky-100 via-white to-slate-50",
      text: "text-slate-900",
      accent: "text-sky-700",
      preview: "bg-gradient-to-r from-sky-100 via-white to-slate-50",
    },
    {
      id: "lavender_relief",
      name: "Lavender Relief",
      bg: "bg-gradient-to-br from-indigo-50 via-purple-50 to-white",
      text: "text-slate-900",
      accent: "text-indigo-700",
      preview: "bg-gradient-to-r from-indigo-50 via-purple-50 to-white",
    },
    {
      id: "teal_trust",
      name: "Teal Trust",
      bg: "bg-gradient-to-br from-teal-900 via-emerald-800 to-teal-600",
      text: "text-white",
      accent: "text-emerald-200",
      preview: "bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-600",
    },
    {
      id: "soft_sand",
      name: "Soft Sand",
      bg: "bg-gradient-to-br from-amber-50 via-amber-100 to-white",
      text: "text-amber-900",
      accent: "text-amber-700",
      preview: "bg-gradient-to-r from-amber-50 via-amber-100 to-white",
    },
    {
      id: "graphite_focus",
      name: "Graphite Focus",
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700",
      text: "text-white",
      accent: "text-cyan-200",
      preview: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700",
    },
    {
      id: "seafoam_calm",
      name: "Seafoam Calm",
      bg: "bg-gradient-to-br from-emerald-50 via-teal-100 to-white",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-50 via-teal-100 to-white",
    },
    {
      id: "copper_warmth",
      name: "Copper Warmth",
      bg: "bg-gradient-to-br from-amber-200 via-orange-100 to-rose-50",
      text: "text-amber-950",
      accent: "text-rose-800",
      preview: "bg-gradient-to-r from-amber-200 via-orange-100 to-rose-50",
    },
    {
      id: "charcoal_blue",
      name: "Charcoal Blue",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900",
    },
    {
      id: "misty_green",
      name: "Misty Green",
      bg: "bg-gradient-to-br from-green-50 via-slate-50 to-white",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-green-50 via-slate-50 to-white",
    },
    {
      id: "clinical_gray",
      name: "Clinical Gray",
      bg: "bg-gradient-to-br from-gray-50 via-gray-100 to-white",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-gradient-to-r from-gray-50 via-gray-100 to-white",
    },
    {
      id: "soft_blue",
      name: "Soft Blue",
      bg: "bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50",
      text: "text-slate-900",
      accent: "text-blue-700",
      preview: "bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50",
    },
    {
      id: "warm_peach",
      name: "Warm Peach",
      bg: "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
      text: "text-slate-900",
      accent: "text-orange-700",
      preview: "bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50",
    },
    {
      id: "lavender_calm",
      name: "Lavender Calm",
      bg: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
      text: "text-slate-900",
      accent: "text-violet-700",
      preview: "bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50",
    },
    {
      id: "ocean_serenity",
      name: "Ocean Serenity",
      bg: "bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-50",
      text: "text-slate-900",
      accent: "text-cyan-800",
      preview: "bg-gradient-to-r from-cyan-100 via-teal-50 to-blue-50",
    },
    {
      id: "sage_wellness",
      name: "Sage Wellness",
      bg: "bg-gradient-to-br from-emerald-100 via-green-50 to-teal-50",
      text: "text-slate-900",
      accent: "text-emerald-800",
      preview: "bg-gradient-to-r from-emerald-100 via-green-50 to-teal-50",
    },
    {
      id: "rose_comfort",
      name: "Rose Comfort",
      bg: "bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100",
      text: "text-slate-900",
      accent: "text-rose-700",
      preview: "bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100",
    },
    {
      id: "professional_navy",
      name: "Professional Navy",
      bg: "bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-800",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-800",
    },
    {
      id: "trust_teal",
      name: "Trust Teal",
      bg: "bg-gradient-to-br from-teal-800 via-cyan-700 to-teal-600",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-teal-800 via-cyan-700 to-teal-600",
    },
    {
      id: "healing_green",
      name: "Healing Green",
      bg: "bg-gradient-to-br from-emerald-700 via-green-600 to-emerald-500",
      text: "text-white",
      accent: "text-emerald-100",
      preview: "bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-500",
    },
    {
      id: "soothing_purple",
      name: "Soothing Purple",
      bg: "bg-gradient-to-br from-purple-800 via-violet-700 to-purple-600",
      text: "text-white",
      accent: "text-purple-200",
      preview: "bg-gradient-to-r from-purple-800 via-violet-700 to-purple-600",
    },
    {
      id: "calm_indigo",
      name: "Calm Indigo",
      bg: "bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-700",
      text: "text-white",
      accent: "text-indigo-200",
      preview: "bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-700",
    },
    {
      id: "gentle_slate",
      name: "Gentle Slate",
      bg: "bg-gradient-to-br from-slate-200 via-gray-100 to-slate-50",
      text: "text-slate-900",
      accent: "text-slate-700",
      preview: "bg-gradient-to-r from-slate-200 via-gray-100 to-slate-50",
    },
    {
      id: "warm_ivory",
      name: "Warm Ivory",
      bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-white",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-gradient-to-r from-amber-50 via-yellow-50 to-white",
    },
    {
      id: "crisp_white",
      name: "Crisp White",
      bg: "bg-gradient-to-br from-white via-slate-50 to-gray-50",
      text: "text-slate-900",
      accent: "text-indigo-600",
      preview: "bg-gradient-to-r from-white via-slate-50 to-gray-50",
    },
    {
      id: "peaceful_blue",
      name: "Peaceful Blue",
      bg: "bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-50",
      text: "text-slate-900",
      accent: "text-sky-700",
      preview: "bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-50",
    },
  ],
};
const Page = createSimpleCustomizePage(config);
export default Page;
