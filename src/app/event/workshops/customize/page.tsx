// @ts-nocheck
"use client";
import EventPageSections from "@/components/events/EventPageSections";

import { EventEditorInput as InputGroup, EventEditorMenuCard as MenuCard, EventEditorSection as EditorLayout } from "@/components/events/EventEditorFields";
import EventEditorWorkspace from "@/components/events/EventEditorWorkspace";
import { useEventPageEditor } from "@/components/events/useEventPageEditor";
import { useEventHistoryClient } from "@/lib/event-history-client";
import TemplateImageTone from "@/components/events/TemplateImageTone";

import HeroImageEditor from "@/components/events/HeroImageEditor";
import EventCanvas from "@/components/EventCanvas";

import { useProgressNavigation } from "@/components/UnsavedProgressProvider";

import { normalizeEventGuestActions } from "@/lib/event-guest-actions";
import EventGuestActions from "@/components/event-templates/EventGuestActions";
import EventGuestPlanningEditor from "@/components/event-templates/EventGuestPlanningEditor";
import EventGuestPlanningNotes from "@/components/event-templates/EventGuestPlanningNotes";
import { type EventGuestPlanning, getEventEndLocal, normalizeEventGuestPlanning, eventLocalDateParts, parseEventGuestDate } from "@/lib/event-guest-planning";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import React, { useCallback, useEffect, useMemo, useState, } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Palette,
  Type,
  CheckSquare,
} from "lucide-react";
import ScrollHandoffContainer from "@/components/ScrollHandoffContainer";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { persistImageMediaValue } from "@/utils/media-upload-client";

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


function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
  const eventHistoryClient = useEventHistoryClient();
    const search = useSearchParams();
    const router = useRouter();
  const { allowNavigation } = useProgressNavigation();
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

    const [savedEventData, setSavedEventData] = useState<Record<string, any>>({});
    const [loadingExisting, setLoadingExisting] = useState(Boolean(editEventId));
    const [loadError, setLoadError] = useState("");
    const [data, setData] = useState(() => ({
      guestActions: normalizeEventGuestActions(null),
      guestPlanning: {} as EventGuestPlanning,
      endTime: "",
      endDate: "",
      title: config.prefill?.title || `${config.displayName}`,
      date: config.prefill?.date || initialDate,
      time: config.prefill?.time || "14:00",
      city: config.prefill?.city || "Chicago",
      state: config.prefill?.state || "IL",
      venue: config.prefill?.venue || "",
      details: config.prefill?.details || "Tell guests what to expect.",
      heroImageFilterEnabled: true,
      hero: config.prefill?.hero || "",
      rsvpEnabled: config.prefill?.rsvpEnabled ?? true,
      rsvpDeadline:
        config.prefill?.rsvpDeadline ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 10);
          return d.toISOString().split("T")[0];
        })(),
      fontSize: config.prefill?.fontSize || "medium",
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
      dismissMobileMenu, previewTouchHandlers,
      drawerTouchHandlers,
    } = useMobileDrawer(true, "event-actions", true);
    const updateData = useCallback((field: string, value: any) => {
      setData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const setAdvancedSectionState = useCallback((id: string, updater: any) => {
      setAdvancedState((prev: Record<string, any>) => {
        const current = prev?.[id];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [id]: next };
      });
    }, []);

  useEffect(() => {
    if (!editEventId) { setLoadingExisting(false); return; }
    let cancelled = false;
    setLoadingExisting(true);
    setLoadError("");
    void (async () => {
      try {
        const response = await eventHistoryClient.fetch(`/api/history/${editEventId}`, { credentials: "include", cache: "no-store" });
        if (!response.ok) throw new Error("Could not load this event. Reload the page before making changes.");
        const row = await response.json();
        if (cancelled) return;
        const existing = row.data || {};
          if (existing.manualEditor?.snapshot) {
            const saved = existing.manualEditor.snapshot;
            if (saved.data !== undefined) setData(saved.data);
            if (saved.advancedState !== undefined) setAdvancedState(saved.advancedState);
            if (saved.themeId !== undefined) setThemeId(saved.themeId);
            setLoadingExisting(false);
            return;
          }

        const start = eventLocalDateParts(existing.startISO || existing.startAt || existing.start);
        const end = eventLocalDateParts(existing.endISO || existing.endAt || existing.end);
        setSavedEventData(existing);
        setData((prev) => ({
          ...prev,
          title: row.title ?? existing.title ?? prev.title,
          date: existing.date ?? start.date,
          time: existing.time ?? start.time,
          endTime: existing.endTime ?? end.time,
          endDate: existing.endDate ?? end.date,
          guestActions: normalizeEventGuestActions(existing.guestActions),
          guestPlanning: normalizeEventGuestPlanning(existing.guestPlanning),
          city: existing.city ?? "",
          state: existing.state ?? "",
          venue: existing.venue ?? existing.location ?? "",
          details: existing.description ?? existing.details ?? "",
          heroImageFilterEnabled: existing.heroImageFilterEnabled !== false,
          hero: existing.heroImage ?? existing.hero ?? "",
          rsvpEnabled: typeof existing.rsvpEnabled === "boolean" ? existing.rsvpEnabled : typeof existing.rsvp?.isEnabled === "boolean" ? existing.rsvp.isEnabled : Boolean(existing.rsvp),
          rsvpDeadline: existing.rsvpDeadline ?? (typeof existing.rsvp === "string" ? existing.rsvp : existing.rsvp?.deadline) ?? "",

            fontSize: existing.fontSize ?? prev.fontSize,
            extra: { ...prev.extra, ...(existing.customFields || {}) },
        }));
          setAdvancedState(existing.advancedSections || existing.customFields?.advancedSections || {});
          setThemeId(existing.themeId || existing.theme?.id || existing.theme?.themeId || config.themes[0]?.id);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load this event.");
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editEventId]);

    const currentTheme = useMemo(() => {
      const base = config.themes.find((theme) => theme.id === themeId) || config.themes[0];
      return (savedEventData.themeId || savedEventData.theme?.id || savedEventData.theme?.themeId) === themeId
        ? { ...base, ...(savedEventData.theme || {}) }
        : base;
    }, [themeId, savedEventData]);

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

    const updateExtra = useCallback((key: string, value: string) => {
      setData((prev) => ({
        ...prev,
        extra: { ...prev.extra, [key]: value },
      }));
    }, []);


    const buildEventPayload = useCallback(async () => {
      if (data.endTime && !getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate)) {
        throw new Error("End time must be after the start. For an overnight event, choose the next end date.");
      }
      const heroImageUrl =
        (await persistImageMediaValue({
          value: data.hero,
          fileName: `${config.slug}-hero.png`,
          fallbackValue: config.defaultHero,
        })) || config.defaultHero;
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date) {
        const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
        const endLocal = getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate);
        const end = endLocal ? new Date(endLocal) : null;
        startISO = start.toISOString();
        endISO = end?.toISOString() || null;
      }
      const payload: any = {
        title: data.title || config.displayName,
        data: {
          ...savedEventData,
          category: config.category,
          createdVia: "template",
          createdManually: true,
          startISO,
          startAt: startISO,
          start: startISO,
          date: data.date,
          time: data.time,
          city: data.city,
          state: data.state,
          endISO,
          endAt: endISO,
          end: endISO,
          endTime: data.endTime,
          endDate: data.endDate,
          guestActions: data.guestActions,
          guestPlanning: data.guestPlanning,
          location: editEventId && data.venue === (savedEventData.venue ?? savedEventData.location ?? "") && data.city === (savedEventData.city ?? "") && data.state === (savedEventData.state ?? "") ? savedEventData.location || locationParts : locationParts || undefined,
          venue: data.venue || undefined,
          description: data.details || undefined,
          rsvp: data.rsvpEnabled ? data.rsvpDeadline || null : null,
          rsvpEnabled: data.rsvpEnabled,
          rsvpDeadline: data.rsvpDeadline,
          numberOfGuests: savedEventData.numberOfGuests ?? 0,
          templateId: config.slug,
          customFields: {
            ...data.extra,
            advancedSections: advancedState,
          },
          advancedSections: advancedState,
          heroImageFilterEnabled: data.heroImageFilterEnabled !== false,
          heroImage: heroImageUrl,
          fontSize: data.fontSize,
          themeId,
          theme: (savedEventData.themeId || savedEventData.theme?.id || savedEventData.theme?.themeId) === themeId ? savedEventData.theme || currentTheme : currentTheme,
        },
      };
      return payload;
    }, [data.heroImageFilterEnabled,
      submitting,
      editEventId,
      savedEventData,
      loadingExisting,
      loadError,
      themeId,
      currentTheme,
    data.date,
    data.time,
    data.title,
    data.details,
    data.guestActions,
    data.guestPlanning,
    data.endTime,
    data.endDate,
    data.venue,
    data.hero,
    data.rsvpEnabled,
    data.rsvpDeadline,
    data.extra,
    data.fontSize,
      advancedState,
      locationParts,
    config.category,
    config.displayName,
    config.slug,
    config.defaultHero,
      router,
    ]);

    const editor = useEventPageEditor({ snapshot: { data, advancedState, themeId }, category: config.category, templateId: config.slug, eventId: editEventId, historyClient: eventHistoryClient, ready: !loadingExisting, busy: false, onBusyChange: setSubmitting, buildPayload: buildEventPayload });

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
      const endLocal = getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate);
          const end = endLocal ? new Date(endLocal) : start;
      const location = [data.venue, data.city, data.state]
        .filter(Boolean)
        .join(", ");
      const description = data.details || "";
      return { title, start, end, location, description };
    };

    const _handleShare = () => {
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

    const handleBackToMain = useCallback(() => {
      setActiveView("main");
    }, []);

    const renderHeadlineEditor = useMemo(
      () => (
        <EditorLayout title="Headline" onBack={handleBackToMain} showBack>
          <div className="space-y-6">
            <InputGroup
              key="title"
              label="Headline"
              value={data.title}
              onChange={(v) => updateData("title", v)}
              placeholder={`${config.displayName} title`}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                key="date"
                label="Date"
                type="date"
                value={data.date}
                onChange={(v) => updateData("date", v)}
              />
              <InputGroup
                key="time"
                label="Time"
                type="time"
                value={data.time}
                onChange={(v) => updateData("time", v)}
              />
            </div>

            <InputGroup
              key="venue"
              label="Venue"
              value={data.venue}
              onChange={(v) => updateData("venue", v)}
              placeholder="Venue name (optional)"
            />
          </div>
        </EditorLayout>
      ),
      [
        data.title,
        data.date,
        data.time,
        data.venue,
        data.city,
        data.state,
        updateData,
        handleBackToMain,
        config.displayName,
      ]
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-none overflow-visible pr-1">
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-700">
              End time (optional)
              <input type="time" value={data.endTime} onChange={(event) => setData((prev) => ({ ...prev, endTime: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              End date (if different)
              <input type="date" min={data.date || undefined} value={data.endDate} onChange={(event) => setData((prev) => ({ ...prev, endDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900" />
            </label>
          </div>
          {data.endTime && !getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate) ? (
            <p role="alert" className="text-sm text-red-700">End time must be after the start. For an overnight event, choose the next end date.</p>
          ) : null}
          <EventGuestPlanningEditor category="workshops" value={data.guestPlanning} onChange={(guestPlanning) => setData((prev) => ({ ...prev, guestPlanning }))} />

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
          {parseEventGuestDate(data.date).toLocaleDateString("en-US", {
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

    if (loadingExisting || loadError) return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-700">
        <p role={loadError ? "alert" : "status"}>{loadError || "Loading your event…"}</p>
      </div>
    );

    return (
      <EventEditorWorkspace sectionEditors={{ "headline": () => renderHeadlineEditor, "design": renderDesignEditor, "details": renderDetailsEditor, "rsvp": renderRsvpEditor, ...Object.fromEntries((config.advancedSections || []).map((section) => [section.id, () => renderAdvancedEditor(section)])) }} artwork={data.hero} editor={editor} templatesHref={"/event/workshops"} drawer={{ mobileMenuOpen, openMobileMenu, dismissMobileMenu, previewTouchHandlers, drawerTouchHandlers }}
 preview={<EventCanvas
          className="flex-1 min-w-0 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="w-full min-w-0 mb-12 md:mb-16 transition-all duration-500 ease-in-out">
            <div
              className={`min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden flex flex-col ${currentTheme.bg} ${textClass} transition-all duration-500 relative z-0`}
            >
              <div className="relative z-10">
                <TemplateImageTone enabled={data.heroImageFilterEnabled !== false} color={currentTheme.accent || currentTheme.bg}>
<div className="relative w-full aspect-video">
                  {data.hero ? (
                    <img
                      src={data.hero}
                      alt="Hero"
                      className="template-hero-image w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={config.defaultHero}
                      alt="Hero"
                      fill
                      className="template-hero-image object-cover"
                      sizes="100vw"
                    />
                  )}
                <HeroImageEditor value={data.hero} onChange={(hero) => setData((prev) => ({ ...prev, hero }))} className="absolute inset-x-4 bottom-4 z-10 flex justify-center" />
</div>
</TemplateImageTone>

                <div
                  className={`p-6 md:p-8 border-b border-white/10 ${textClass}`}
                >
                  <div>
                    <h1
                      className={`text-3xl md:text-5xl font-serif mb-2 leading-tight ${textClass}`}
                      style={{
                        fontFamily: "var(--font-playfair)",
                        ...(headingShadow || {}),
                        ...(titleColor || {}),
                      }}
                    >
                      {data.title || config.displayName}
                    </h1>
                    {infoLine}
                  </div>
                </div>

                <EventPageSections>
<section id="details" className="py-10 border-t border-white/10 px-6 md:px-10">
                  <h2
                    className={`text-2xl mb-3 ${accentClass}`}
                    style={{ ...headingShadow, ...(titleColor || {}) }}
                  >
                    Details
                  </h2>

                  <EventGuestActions
                    visibility={data.guestActions}
                    onVisibilityChange={(guestActions) => setData((prev) => ({ ...prev, guestActions }))}
                    title={data.title}
                    start={data.date ? `${data.date}T${data.time || "14:00"}` : undefined}
                    end={getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate)}
                    description={data.details}
                    location={[data.venue, data.city, data.state].filter(Boolean).join(", ")}
                    preview
                  />
                  <EventGuestPlanningNotes value={data.guestPlanning} />
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
                      if (typeof val !== "string" || !val.trim()) return null;
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
                      })}
                    </section>
                  ) : null
                )}

                {data.rsvpEnabled && (
                  <section id="rsvp" className="max-w-2xl mx-auto text-center p-6 md:p-10">
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
                                ? `Kindly respond by ${parseEventGuestDate(
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
                            RSVP preview
                          </h3>
                          <p className="opacity-70">This is a preview. Publish your event to collect guest responses.</p>
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
</EventPageSections>

                <footer
                  className={`text-center py-8 border-t border-white/10 mt-1 ${textClass}`}
                >
                  <EnvitefyEventBranding category="Appointments" inverse={isDarkBackground} />
                </footer>
              </div>
            </div>
          </div>
        </EventCanvas>}
 controls={<><ScrollHandoffContainer className="min-h-full">


            <div className="p-6 pt-4 md:pt-6">
              {(activeView === "main" || activeView === "images") && renderMainMenu()}
              {activeView === "headline" && renderHeadlineEditor}

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
          </ScrollHandoffContainer></>}
></EventEditorWorkspace>
    );
  };
}

import { config } from "@/components/event-templates/WorkshopsTemplate";

const Page = createSimpleCustomizePage(config);
export default Page;
