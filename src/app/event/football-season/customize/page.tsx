// @ts-nocheck
"use client";

import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Menu,
  Palette,
  Share2,
  Type,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  getGymMeetTemplateMeta,
  isGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";
import TemplateSelector from "@/components/gym-meet-templates/TemplateSelector";
import ScrollHandoffContainer from "@/components/ScrollHandoffContainer";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { openAppleCalendarIcs } from "@/utils/calendar-open";
import { buildEventPath } from "@/utils/event-url";
import { persistImageMediaValue } from "@/utils/media-upload-client";
import { resolveFootballSeasonTemplateChrome } from "./footballSeasonTemplateTheme";

type FieldSpec = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
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
  titleTypographyClassName?: string;
  sectionTitleClass?: string;
  sectionTitleStyle?: React.CSSProperties;
  sectionCardClass?: string;
  sectionMutedClass?: string;
  summaryCardClass?: string;
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

const FONT_SIZE_OPTIONS = [
  { id: "small", label: "Small", className: "text-3xl md:text-4xl" },
  { id: "medium", label: "Medium", className: "text-4xl md:text-5xl" },
  { id: "large", label: "Large", className: "text-5xl md:text-6xl" },
];

const generateRosterPlayerId = () => `player-${Math.random().toString(36).slice(2, 9)}`;

const normalizeRosterSection = (section: any) => {
  if (!section || typeof section !== "object") return section;
  const normalizedPlayers = Array.isArray(section.players)
    ? section.players.map((player: any) => {
        if (player?.id) return player;
        return {
          ...(player || {}),
          id: player?.playerId || player?.athleteId || player?.name || generateRosterPlayerId(),
        };
      })
    : section.players;
  return { ...section, players: normalizedPlayers };
};

const normalizeAdvancedSectionsForStorage = (sections: any) => {
  if (!sections || typeof sections !== "object") return sections;
  return {
    ...sections,
    roster: normalizeRosterSection(sections.roster),
  };
};

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const cloneState = <T,>(value: T): T => {
  const sc = (globalThis as any).structuredClone;
  if (typeof sc === "function") {
    return sc(value);
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const safeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

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
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          className={baseTextareaClass}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          className={baseInputClass}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

InputGroup.displayName = "InputGroup";

const FootballSeasonMutedBadge = ({
  theme,
  children,
  className = "",
}: {
  theme: any;
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.sectionMutedClass} ${className}`}
  >
    {children}
  </span>
);

const FootballSeasonSectionCard = ({
  theme,
  className = "",
  children,
}: {
  theme: any;
  className?: string;
  children: React.ReactNode;
}) => <div className={`${theme.sectionCardClass} ${className}`}>{children}</div>;

const FootballSeasonSectionNav = ({
  theme,
  navItems,
  activeSection,
  onSelect,
}: {
  theme: any;
  navItems: Array<{ id: string; label: string }>;
  activeSection: string;
  onSelect: (sectionId: string) => void;
}) => (
  <div className={`${theme.navShellClass} backdrop-blur-2xl`}>
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center justify-center gap-2">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onSelect(item.id);
              }}
              className={`group relative inline-flex items-center gap-2 whitespace-nowrap ${
                isActive ? theme.navActiveClass : theme.navIdleClass
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  isActive ? "bg-current" : "bg-current opacity-40"
                }`}
              />
              {item.label}
            </a>
          );
        })}
      </div>
    </div>
  </div>
);

const FootballSeasonHeader = ({
  theme,
  title,
  infoLine,
  addressLine,
  heroSrc,
  headingSizeClass,
  headingFontStyle,
  bodyShadow,
  selectedSizeLabel,
  templateName,
  isDiscoveryEdit,
}: {
  theme: any;
  title: string;
  infoLine: React.ReactNode;
  addressLine: string;
  heroSrc: string;
  headingSizeClass: string;
  headingFontStyle?: React.CSSProperties;
  bodyShadow?: React.CSSProperties;
  selectedSizeLabel: string;
  templateName: string;
  isDiscoveryEdit: boolean;
}) => (
  <div className={`relative overflow-hidden px-5 py-6 md:px-8 md:py-8 ${theme.headerClass}`}>
    <div className={`absolute inset-0 opacity-60 ${theme.headerOverlayClass}`} />
    <div className="absolute -left-24 top-0 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />
    <div className="relative grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:items-stretch">
      <div className="space-y-4">
        <div className="space-y-3">
          <h1
            className={`${headingSizeClass} leading-[0.92] ${theme.titleTypography.cardClassName} ${theme.titleClass}`}
            style={headingFontStyle}
          >
            {title}
          </h1>
          <p
            className={`max-w-2xl text-sm leading-relaxed md:text-base ${theme.mutedClass}`}
            style={bodyShadow}
          >
            A gym-style builder shell with the same template selector pipeline and side-panel
            editing flow as the gymnastics builder.
          </p>
        </div>

        <div className="space-y-3">
          {infoLine}
          {addressLine && (
            <div
              className={`flex items-center gap-2 text-sm opacity-80 ${theme.mutedClass}`}
              style={bodyShadow}
            >
              <MapPin size={14} />
              <span className="truncate">{addressLine}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <FootballSeasonMutedBadge theme={theme}>Theme: {templateName}</FootballSeasonMutedBadge>
          <FootballSeasonMutedBadge theme={theme}>
            Size: {selectedSizeLabel}
          </FootballSeasonMutedBadge>
          <FootballSeasonMutedBadge theme={theme}>
            {isDiscoveryEdit ? "Discovery edit" : "Builder draft"}
          </FootballSeasonMutedBadge>
        </div>
      </div>

      <div className="relative">
        <div className={`${theme.summaryCardClass} p-3 shadow-2xl backdrop-blur-xl`}>
          <div
            className={`relative aspect-[4/5] overflow-hidden rounded-[22px] ${theme.shellClass}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-white/5" />
            {heroSrc ? (
              <img src={heroSrc} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/40">
                <div className="text-center">
                  <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-600">
                    Hero preview
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Upload a banner image to anchor the preview shell.
                  </div>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/55 to-transparent" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <FootballSeasonSectionCard
              theme={theme}
              className="px-3 py-3 text-center text-xs font-semibold"
            >
              Theme
              <div className="mt-1 text-[11px] font-medium text-slate-500">{templateName}</div>
            </FootballSeasonSectionCard>
            <FootballSeasonSectionCard
              theme={theme}
              className="px-3 py-3 text-center text-xs font-semibold"
            >
              Typography
              <div className="mt-1 text-[11px] font-medium text-slate-500">{selectedSizeLabel}</div>
            </FootballSeasonSectionCard>
            <FootballSeasonSectionCard
              theme={theme}
              className="px-3 py-3 text-center text-xs font-semibold"
            >
              Preview
              <div className="mt-1 text-[11px] font-medium text-slate-500">Live update</div>
            </FootballSeasonSectionCard>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FootballSeasonPreviewFrame = ({
  theme,
  children,
}: {
  theme: any;
  children: React.ReactNode;
}) => (
  <div
    className={`relative min-h-[780px] w-full overflow-hidden rounded-[32px] transition-all duration-500 ${theme.pageClass} ${theme.shellClass}`}
  >
    <div className={`absolute inset-0 opacity-20 ${theme.headerOverlayClass}`} />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_transparent_38%)]" />
    <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-white/80 blur-3xl" />
    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
    <div className="relative z-10">{children}</div>
  </div>
);

const FootballSeasonPreviewSection = ({
  theme,
  id,
  children,
}: {
  theme: any;
  id: string;
  children: React.ReactNode;
}) => (
  <section id={id} className={`relative overflow-hidden scroll-mt-28 ${theme.sectionClass}`}>
    <div className="relative">{children}</div>
  </section>
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
    const isEmbed = search?.get("embed") === "1";
    const isNewDraft = search?.get("new") === "1";
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
      fontSize: (config as any)?.prefill?.fontSize || "medium",
      passcodeRequired: false,
      passcode: "",
      extra: Object.fromEntries(
        config.detailFields.map((f) => [
          f.key,
          config.prefill?.extra?.[f.key] ?? (f.placeholder || ""),
        ]),
      ),
    }));
    const [advancedState, setAdvancedState] = useState(() => {
      const entries =
        config.advancedSections?.map((section) => [section.id, section.initialState]) || [];
      return Object.fromEntries(entries);
    });
    const [pageTemplateId, setPageTemplateId] = useState(DEFAULT_GYM_MEET_TEMPLATE_ID);
    const [activeView, setActiveView] = useState<string>("main");
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
    const [_rsvpAttending, setRsvpAttending] = useState("yes");
    const [submitting, setSubmitting] = useState(false);
    const [didExplicitSave, setDidExplicitSave] = useState(false);
    const [initializingEdit, setInitializingEdit] = useState(Boolean(editEventId));
    const [discoverFile, setDiscoverFile] = useState<File | null>(null);
    const [discoverBusy, setDiscoverBusy] = useState(false);
    const [discoverError, setDiscoverError] = useState("");
    const [loadedDiscoverySource, setLoadedDiscoverySource] = useState<Record<string, any> | null>(
      null,
    );
    const [isDiscoveryEdit, setIsDiscoveryEdit] = useState(false);
    const {
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      previewTouchHandlers,
      drawerTouchHandlers,
    } = useMobileDrawer();
    const updateData = useCallback((field: string, value: any) => {
      setData((prev) => {
        const next = cloneState(prev || {});
        next[field] = value;
        return next;
      });
    }, []);

    const setAdvancedSectionState = useCallback((id: string, updater: any) => {
      setAdvancedState((prev: Record<string, any>) => {
        const current = prev?.[id];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [id]: next };
      });
    }, []);

    // Load existing event data when editing
    useEffect(() => {
      const loadExisting = async () => {
        if (!editEventId) {
          setInitializingEdit(false);
          return;
        }
        try {
          const res = await fetch(`/api/history/${editEventId}`);
          if (!res.ok) return;
          const json = await res.json();
          const existing = json?.data || {};
          const existingCreatedVia = String(existing?.createdVia || "")
            .toLowerCase()
            .trim();
          const existingDiscoverySource =
            existing?.discoverySource && typeof existing.discoverySource === "object"
              ? (existing.discoverySource as Record<string, any>)
              : null;
          setLoadedDiscoverySource(existingDiscoverySource);
          setIsDiscoveryEdit(
            existingCreatedVia === "football-discovery" ||
              safeString(existingDiscoverySource?.workflow) === "football",
          );

          const startIso = existing.start || existing.startISO || existing.startIso;
          let loadedDate = data.date;
          let loadedTime = data.time;
          if (startIso) {
            const d = new Date(startIso);
            if (!Number.isNaN(d.getTime())) {
              loadedDate = d.toISOString().split("T")[0];
              loadedTime = d.toISOString().slice(11, 16);
            }
          }

          const accessControl = existing.accessControl || {};
          const hasPasscode = Boolean(
            accessControl?.passcodeHash || accessControl?.requirePasscode,
          );

          setData((prev) => ({
            ...prev,
            title: json?.title || existing.title || prev.title,
            date: existing.date || loadedDate,
            time: existing.time || loadedTime,
            city: existing.city || prev.city,
            state: existing.state || prev.state,
            venue: existing.venue || existing.location || prev.venue,
            details: existing.details || existing.description || prev.details,
            hero: existing.heroImage || existing.hero || prev.hero,
            rsvpEnabled:
              typeof existing.rsvpEnabled === "boolean" ? existing.rsvpEnabled : prev.rsvpEnabled,
            rsvpDeadline: existing.rsvpDeadline || prev.rsvpDeadline,
            fontSize: existing.fontSize || prev.fontSize,
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
          const normalizedAdvanced = normalizeAdvancedSectionsForStorage(incomingAdvanced);
          if (normalizedAdvanced && Object.keys(normalizedAdvanced).length) {
            setAdvancedState((prev) => ({
              ...prev,
              ...normalizedAdvanced,
            }));
          }

          const incomingTemplateId =
            existing.pageTemplateId ||
            existing.templateConfig?.pageTemplateId ||
            existing.templateConfig?.themeId ||
            existing.themeId;
          setPageTemplateId(
            isGymMeetTemplateId(incomingTemplateId)
              ? incomingTemplateId
              : DEFAULT_GYM_MEET_TEMPLATE_ID,
          );
        } catch {
          // ignore to keep edit usable
        } finally {
          setInitializingEdit(false);
        }
      };
      loadExisting();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editEventId]);

    const currentTemplate = useMemo(() => getGymMeetTemplateMeta(pageTemplateId), [pageTemplateId]);
    const templateTheme = useMemo(
      () => resolveFootballSeasonTemplateChrome(pageTemplateId),
      [pageTemplateId],
    );
    const templateTypography = templateTheme.titleTypography;
    const selectedSize =
      FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize) || FONT_SIZE_OPTIONS[1];

    useEffect(() => {
      if (!isEmbed || !editEventId) return;
      if (typeof window === "undefined") return;

      const normalizedAdvanced =
        normalizeAdvancedSectionsForStorage(advancedState) || advancedState;
      try {
        window.parent?.postMessage(
          {
            type: "envitefy:discovery-preview-patch",
            eventId: editEventId,
            patch: {
              title: data.title,
              description: data.details,
              details: data.details,
              heroImage: data.hero || undefined,
              hero: data.hero || undefined,
              venue: data.venue || data.extra?.stadium || data.extra?.stadiumAddress,
              date: data.date,
              time: data.time,
              rsvpEnabled: data.rsvpEnabled,
              rsvpDeadline: data.rsvpDeadline,
              pageTemplateId,
              themeId: pageTemplateId,
              theme: currentTemplate,
              fontId: templateTypography.id,
              fontSize: data.fontSize,
              fontFamily: templateTypography.fontFamilyName,
              fontSizeClass: selectedSize?.className,
              advancedSections: normalizedAdvanced,
              customFields: {
                ...(data.extra || {}),
                advancedSections: normalizedAdvanced,
              },
              extra: data.extra,
            },
          },
          "*",
        );
      } catch {
        // Best effort only for live preview.
      }
    }, [
      isEmbed,
      editEventId,
      advancedState,
      data.date,
      data.details,
      data.extra,
      data.fontSize,
      data.hero,
      data.rsvpDeadline,
      data.rsvpEnabled,
      data.time,
      data.title,
      data.venue,
      currentTemplate,
      templateTypography,
      selectedSize,
      pageTemplateId,
    ]);

    const isDarkBackground = templateTheme.isDark;

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

    const textClass = templateTheme.textClass;
    const accentClass =
      templateTheme.accentClass || (isDarkBackground ? "text-white" : "text-slate-700");
    const usesLightText =
      /text-(white|slate-50|neutral-50|gray-50|amber-50|cyan-50|indigo-50|emerald-50|sky-50|stone-50|zinc-50)/.test(
        textClass,
      ) || isDarkBackground;
    const headingShadow = usesLightText ? { textShadow: "0 2px 6px rgba(0,0,0,0.55)" } : undefined;
    const bodyShadow = usesLightText ? { textShadow: "0 1px 3px rgba(0,0,0,0.45)" } : undefined;
    const titleColor = isDarkBackground ? { color: "#f5e6d3" } : undefined;
    const heroHeadingFontStyle = {
      ...templateTypography.fontStyle,
      ...(templateTheme.titleStyle || {}),
      ...(headingShadow || {}),
      ...(titleColor || {}),
    };
    const sectionHeadingFontStyle = {
      ...templateTypography.fontStyle,
      ...(templateTheme.sectionTitleStyle || {}),
      ...(headingShadow || {}),
    };
    const headingSizeClass = selectedSize?.className || FONT_SIZE_OPTIONS[1].className;

    const advancedSectionPreviewContext = useMemo(
      () => ({
        textClass,
        accentClass,
        titleTypographyClassName: templateTypography.cardClassName,
        sectionTitleClass: templateTheme.sectionTitleClass || accentClass,
        sectionTitleStyle: templateTheme.sectionTitleStyle,
        sectionCardClass: templateTheme.sectionCardClass,
        sectionMutedClass: templateTheme.sectionMutedClass,
        summaryCardClass: templateTheme.summaryCardClass,
        headingShadow,
        bodyShadow,
        titleColor,
        headingFontStyle: sectionHeadingFontStyle,
      }),
      [
        accentClass,
        bodyShadow,
        headingShadow,
        sectionHeadingFontStyle,
        templateTheme.sectionCardClass,
        templateTheme.sectionMutedClass,
        templateTheme.sectionTitleClass,
        templateTheme.sectionTitleStyle,
        templateTheme.summaryCardClass,
        templateTypography.cardClassName,
        textClass,
        titleColor,
      ],
    );

    const advancedSectionPreviews = useMemo(
      () =>
        (config.advancedSections || [])
          .map((section) => {
            if (!section.renderPreview) return null;
            const previewNode = section.renderPreview({
              state: advancedState?.[section.id],
              ...advancedSectionPreviewContext,
            });
            if (previewNode == null) return null;
            return {
              section,
              previewNode,
            };
          })
          .filter(
            (
              entry,
            ): entry is {
              section: AdvancedSectionSpec;
              previewNode: React.ReactNode;
            } => entry !== null,
          ),
      [advancedSectionPreviewContext, advancedState, config.advancedSections],
    );

    const locationParts = [data.venue, data.city, data.state].filter(Boolean).join(", ");
    const addressLine = data.extra?.stadiumAddress || data.extra?.address || "";

    const hasGames = (advancedState?.games?.games?.length ?? 0) > 0;
    const hasPractice = (advancedState?.practice?.blocks?.length ?? 0) > 0;
    const hasRoster = (advancedState?.roster?.players?.length ?? 0) > 0;
    const hasLogistics = Boolean(
      advancedState?.logistics?.travelMode ||
        advancedState?.logistics?.callTime ||
        advancedState?.logistics?.weatherPolicy,
    );
    const hasGear = (advancedState?.gear?.items?.length ?? 0) > 0;
    const hasVolunteers = (advancedState?.volunteers?.slots?.length ?? 0) > 0;
    const hasRsvpSection = data.rsvpEnabled;

    const navItems = useMemo(
      () =>
        [
          { id: "details", label: "Details", enabled: true },
          { id: "games", label: "Game Schedule", enabled: hasGames },
          { id: "practice", label: "Practice", enabled: hasPractice },
          { id: "roster", label: "Roster", enabled: hasRoster },
          { id: "logistics", label: "Logistics", enabled: hasLogistics },
          { id: "gear", label: "Gear", enabled: hasGear },
          { id: "volunteers", label: "Volunteers", enabled: hasVolunteers },
          { id: "rsvp", label: "Attendance", enabled: hasRsvpSection },
          { id: "passcode", label: "Passcode", enabled: true },
        ].filter((item) => item.enabled),
      [hasGames, hasGear, hasLogistics, hasPractice, hasRoster, hasRsvpSection, hasVolunteers],
    );

    const [activeSection, setActiveSection] = useState<string>(navItems[0]?.id || "details");

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

    useEffect(() => {
      if (!navItems.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              if (id && navItems.some((i) => i.id === id)) {
                setActiveSection(id);
                if (typeof window !== "undefined" && window.location.hash !== `#${id}`) {
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
        },
      );

      const targets = navItems
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];
      targets.forEach((el) => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    }, [navItems]);

    const handleSectionSelect = useCallback((sectionId: string) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      setActiveSection(sectionId);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${sectionId}`);
      }
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setData((prev) => ({ ...prev, hero: url }));
      }
    };

    const updateExtra = useCallback((key: string, value: string) => {
      setData((prev) => {
        const next = cloneState(prev || {});
        const extra = next.extra && typeof next.extra === "object" ? next.extra : {};
        next.extra = { ...extra, [key]: value };
        return next;
      });
    }, []);

    const rsvpCopy = {
      menuTitle: config.rsvpCopy?.menuTitle || "Attendance",
      menuDesc: config.rsvpCopy?.menuDesc || "Attendance settings.",
      editorTitle: config.rsvpCopy?.editorTitle || "Attendance",
      toggleLabel: config.rsvpCopy?.toggleLabel || "Enable attendance tracking",
      deadlineLabel: config.rsvpCopy?.deadlineLabel || "Attendance response deadline",
      helperText:
        config.rsvpCopy?.helperText ||
        "The attendance card in the preview updates with these settings.",
    };

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

        const heroToSave =
          (await persistImageMediaValue({
            value: data.hero,
            eventId: editEventId || undefined,
            fileName: `${config.slug}-hero.png`,
            fallbackValue: config.defaultHero,
          })) || config.defaultHero;

        const currentSelectedSize =
          FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize) || FONT_SIZE_OPTIONS[1];
        const derivedFontId = templateTypography.id;
        const validFontSize = currentSelectedSize?.id || data.fontSize;
        const themeToSave = {
          id: pageTemplateId,
          name: currentTemplate?.name || "Launchpad Editorial",
          bg: currentTemplate?.previewClassName || "",
          text: currentTemplate?.previewAccentClassName || "",
          accent: currentTemplate?.previewAccentClassName || "",
          preview: currentTemplate?.previewClassName || "",
        };
        const addressToSave =
          data.extra?.stadiumAddress || data.extra?.address || locationParts || undefined;

        const templateConfigForSave = {
          slug: config.slug,
          displayName: config.displayName,
          category: config.category,
          detailFields: config.detailFields,
          advancedSectionIds: config.advancedSections?.map((s) => s.id) || [],
          rsvpCopy,
          pageTemplateId,
        };

        const normalizedAdvancedSections =
          normalizeAdvancedSectionsForStorage(advancedState) || advancedState;
        const isDiscoveryUpdate = Boolean(editEventId && isDiscoveryEdit);
        const payload: any = {
          title: data.title || config.displayName,
          data: {
            category: config.category,
            displayName: config.displayName,
            createdVia: isDiscoveryUpdate ? "football-discovery" : "template",
            createdManually: !isDiscoveryUpdate,
            startISO,
            endISO,
            date: data.date,
            time: data.time,
            city: data.city,
            state: data.state,
            location: locationParts || undefined,
            venue: data.venue || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
            rsvpEnabled: data.rsvpEnabled,
            rsvpDeadline: data.rsvpDeadline || undefined,
            numberOfGuests: 0,
            templateId: config.slug,
            templateConfig: templateConfigForSave,
            pageTemplateId,
            themeId: pageTemplateId,
            theme: themeToSave,
            fontId: derivedFontId,
            fontSize: validFontSize,
            fontFamily: templateTypography.fontFamilyName,
            fontSizeClass: currentSelectedSize?.className,
            ...(loadedDiscoverySource && {
              discoverySource: {
                ...loadedDiscoverySource,
                workflow: "football",
                updatedAt: new Date().toISOString(),
              },
            }),
            customFields: {
              ...data.extra,
              advancedSections: normalizedAdvancedSections,
            },
            advancedSections: normalizedAdvancedSections,
            heroImage: heroToSave,
            extra: data.extra,
            address: addressToSave,
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
          const res = await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: payload.title,
              data: payload.data,
              ...(isNewDraft ? { claim: true } : {}),
            }),
          });
          if (!res.ok) throw new Error("Failed to update event");
          setDidExplicitSave(true);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("history:updated", {
                detail: { id: editEventId },
              }),
            );
          }
          const redirectUrl = buildEventPath(editEventId, payload.title, {
            updated: true,
            t: Date.now(),
          });
          if (isEmbed && typeof window !== "undefined" && (window as any).parent !== window) {
            try {
              (window as any).parent.postMessage(
                {
                  type: "envitefy:discovery-edit-saved",
                  eventId: editEventId,
                  redirectUrl,
                },
                window.location.origin,
              );
            } catch {}
            return;
          }
          router.push(redirectUrl);
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
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("history:created", {
                detail: {
                  id,
                  title: payload.title,
                  created_at: (json as any)?.created_at || new Date().toISOString(),
                  data: payload.data,
                },
              }),
            );
          }
          router.push(buildEventPath(id, payload.title, { created: true }));
        }
      } catch (err: any) {
        alert(String(err?.message || err || "Failed to save event"));
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
      data.city,
      data.state,
      data.hero,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      data.fontSize,
      data.passcodeRequired,
      data.passcode,
      advancedState,
      pageTemplateId,
      templateTypography,
      locationParts,
      config.category,
      config.displayName,
      config.slug,
      config.defaultHero,
      rsvpCopy,
      editEventId,
      isDiscoveryEdit,
      loadedDiscoverySource,
      isEmbed,
      isNewDraft,
      router,
    ]);

    const buildEventDetails = () => {
      const title = data.title || config.displayName;
      let start: Date | null = null;
      if (data.date) {
        const tentative = new Date(`${data.date}T${data.time || "14:00"}`);
        if (!Number.isNaN(tentative.getTime())) start = tentative;
      }
      if (!start) start = new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const location = [data.venue, data.city, data.state].filter(Boolean).join(", ");
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
      const shareUrl = typeof window !== "undefined" ? window.location.href : undefined;
      if (typeof navigator !== "undefined" && (navigator as any).share && shareUrl) {
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
        details.title,
      )}&dates=${start}/${end}&location=${encodeURIComponent(
        details.location,
      )}&details=${encodeURIComponent(details.description || "")}`;
      const webUrl = `https://calendar.google.com/calendar/render?${query}`;
      const appUrl = `comgooglecalendar://?${query}`;
      openWithAppFallback(appUrl, webUrl);
    };

    const handleOutlookCalendar = () => {
      const details = buildEventDetails();
      const webUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
        details.title,
      )}&body=${encodeURIComponent(details.description || "")}&location=${encodeURIComponent(
        details.location,
      )}&startdt=${encodeURIComponent(
        details.start.toISOString(),
      )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
      const appUrl = `ms-outlook://events/new?subject=${encodeURIComponent(
        details.title,
      )}&body=${encodeURIComponent(details.description || "")}&location=${encodeURIComponent(
        details.location,
      )}&startdt=${encodeURIComponent(
        details.start.toISOString(),
      )}&enddt=${encodeURIComponent(details.end.toISOString())}`;
      openWithAppFallback(appUrl, webUrl);
    };

    const handleAppleCalendar = () => {
      const details = buildEventDetails();
      openAppleCalendarIcs(buildIcsUrl(details));
    };

    const renderMainMenu = () => (
      <div className="space-y-4 animate-fade-in pb-8 flex flex-col items-center">
        <div className="mb-2 w-full max-w-sm text-center">
          <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
            {isDiscoveryEdit ? "Edit your football page" : "Build your football page"}
          </h2>
          <p className="text-slate-500 text-sm">
            {isDiscoveryEdit
              ? "Update the prefilled sections from your uploaded football source."
              : `Customize every aspect of your ${config.displayName.toLowerCase()} site.`}
          </p>
        </div>

        {!isDiscoveryEdit && (
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Starter Mode
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveView("discover")}
                className="w-full rounded-lg border border-[#d44f19] bg-[#d44f19] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ba4313] flex items-center justify-center gap-2"
              >
                Upload & Prefill
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Recommended
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {!isDiscoveryEdit && (
            <MenuCard
              title="Upload & Prefill"
              desc="Prefill from a football packet, schedule, or roster file."
              icon={<Upload size={18} />}
              onClick={() => setActiveView("discover")}
            />
          )}
          <MenuCard
            title="Headline"
            desc="Title, date, location."
            icon={<Type size={18} />}
            onClick={() => setActiveView("headline")}
          />
          <MenuCard
            title="Design"
            desc="Gym page templates and title size."
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
          {config.advancedSections?.map((section) => (
            <MenuCard
              key={section.id}
              title={section.menuTitle}
              desc={section.menuDesc}
              icon={<Edit2 size={18} />}
              onClick={() => setActiveView(section.id)}
            />
          ))}
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
      ],
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
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setData((p) => ({ ...p, hero: "" }));
                  }}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-white rounded-full shadow hover:bg-red-50 text-red-500 z-10"
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
        <div className="space-y-4">
          <TemplateSelector value={pageTemplateId} onChange={setPageTemplateId} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Title Size
                </p>
                <p className="mt-1 text-sm text-slate-500">Controls the preview title hierarchy.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {selectedSize.label}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {FONT_SIZE_OPTIONS.map((option) => {
                const active = option.id === selectedSize.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateData("fontSize", option.id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
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

    const handleDiscoverParse = useCallback(async () => {
      if (discoverBusy) return;
      setDiscoverError("");
      if (!discoverFile) {
        setDiscoverError("Upload a file to continue.");
        return;
      }
      setDiscoverBusy(true);
      try {
        const formData = new FormData();
        formData.append("file", discoverFile);

        const ingestRes = await fetch("/api/ingest?mode=football_discovery", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const ingestJson = await ingestRes.json().catch(() => ({}));
        if (!ingestRes.ok || !ingestJson?.eventId) {
          throw new Error(ingestJson?.error || "Failed to ingest source");
        }

        const eventId = String(ingestJson.eventId);
        const parseBody = new FormData();
        parseBody.append("file", discoverFile);
        const parseRes = await fetch(`/api/parse/${eventId}`, {
          method: "POST",
          body: parseBody,
          credentials: "include",
        });
        const parseJson = await parseRes.json().catch(() => ({}));
        if (!parseRes.ok) {
          throw new Error(parseJson?.error || "Failed to parse source");
        }
        router.push(`/event/football/customize?edit=${eventId}&new=1`);
      } catch (err: any) {
        setDiscoverError(String(err?.message || err || "Failed to parse source"));
      } finally {
        setDiscoverBusy(false);
      }
    }, [discoverBusy, discoverFile, router]);

    const renderDiscoverEditor = () => (
      <EditorLayout title="Upload to Prefill" onBack={() => setActiveView("main")} showBack>
        <div className="space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
            Upload a football packet, season schedule, roster sheet, or parent memo. We will parse
            and prefill the football page builder.
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Upload File
            </label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                const picked = e.target.files?.[0] || null;
                setDiscoverFile(picked);
              }}
              className={baseInputClass}
            />
            {discoverFile ? (
              <p className="text-xs text-slate-500">Selected: {discoverFile.name}</p>
            ) : null}
          </div>
          {discoverError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {discoverError}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleDiscoverParse}
            disabled={discoverBusy}
            className="w-full py-3 rounded-lg bg-slate-900 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {discoverBusy ? "Parsing..." : "Parse and Build Football Page"}
          </button>
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
      <EditorLayout title="Passcode" onBack={() => setActiveView("main")} showBack>
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
                onChange={(e) => updateData("passcodeRequired", e.target.checked)}
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
            <strong>How it works:</strong> Your event stays unlisted. Only people with the link and
            access code can view it. Perfect for team events - share the link and code in your team
            group chat.
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

    if (initializingEdit) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="text-center px-4 py-6 bg-white shadow rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700">Loading your custom event…</p>
            <p className="text-xs text-slate-500 mt-1">
              Please wait while we restore your saved details.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative flex w-full bg-slate-100 font-sans text-slate-900 ${
          isEmbed ? "min-h-screen flex-col" : "min-h-screen h-[100dvh] overflow-hidden"
        }`}
      >
        {!isEmbed && (
          <div
            {...previewTouchHandlers}
            className="flex-1 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1120px] my-4 md:my-8 mb-20 md:mb-24 pb-8 transition-all duration-500 ease-in-out">
              <div className="mt-4 md:mt-6">
                <FootballSeasonPreviewFrame theme={templateTheme}>
                  <FootballSeasonHeader
                    theme={templateTheme}
                    title={data.title || config.displayName}
                    infoLine={infoLine}
                    addressLine={addressLine}
                    heroSrc={data.hero}
                    headingSizeClass={headingSizeClass}
                    headingFontStyle={heroHeadingFontStyle}
                    bodyShadow={bodyShadow}
                    selectedSizeLabel={selectedSize.label}
                    templateName={currentTemplate.name}
                    isDiscoveryEdit={isDiscoveryEdit}
                  />

                  <div className="px-5 pb-2 pt-5 md:px-8">
                    <FootballSeasonSectionNav
                      theme={templateTheme}
                      navItems={navItems}
                      activeSection={activeSection}
                      onSelect={handleSectionSelect}
                    />
                  </div>

                  <FootballSeasonPreviewSection theme={templateTheme} id="details">
                    <h2
                      className={`${templateTypography.cardClassName} mb-3 text-2xl ${templateTheme.sectionTitleClass || accentClass}`}
                      style={sectionHeadingFontStyle}
                    >
                      Details
                    </h2>
                    {data.details ? (
                      <p
                        className={`whitespace-pre-wrap text-base leading-relaxed opacity-90 ${textClass}`}
                        style={bodyShadow}
                      >
                        {data.details}
                      </p>
                    ) : (
                      <p className={`text-sm opacity-70 ${textClass}`} style={bodyShadow}>
                        Add a short description so guests know what to expect.
                      </p>
                    )}
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {config.detailFields.map((field) => {
                        const val = data.extra[field.key];
                        return (
                          <FootballSeasonSectionCard key={field.key} theme={templateTheme}>
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
                          </FootballSeasonSectionCard>
                        );
                      })}
                    </div>
                  </FootballSeasonPreviewSection>

                  {advancedSectionPreviews.map(({ section, previewNode }) => (
                    <FootballSeasonPreviewSection
                      theme={templateTheme}
                      key={section.id}
                      id={section.id}
                    >
                      {previewNode}
                    </FootballSeasonPreviewSection>
                  ))}

                  {data.rsvpEnabled && (
                    <FootballSeasonPreviewSection theme={templateTheme} id="rsvp">
                      <h2
                        className={`${templateTypography.cardClassName} mb-6 text-2xl ${templateTheme.sectionTitleClass || accentClass}`}
                        style={sectionHeadingFontStyle}
                      >
                        {rsvpCopy.editorTitle}
                      </h2>
                      <div className={`${templateTheme.sectionCardClass} p-8 text-left md:p-10`}>
                        {!rsvpSubmitted ? (
                          <div className="space-y-6">
                            <div className="mb-4 text-center">
                              <p className={`opacity-80 ${textClass}`}>
                                {data.rsvpDeadline
                                  ? `Kindly respond by ${new Date(
                                      data.rsvpDeadline,
                                    ).toLocaleDateString()}`
                                  : "Please confirm attendance"}
                              </p>
                            </div>
                            <div>
                              <label
                                className={`mb-2 block text-xs font-bold uppercase tracking-wider opacity-70 ${textClass}`}
                              >
                                Full Name
                              </label>
                              <input
                                className="w-full rounded-lg border border-white/20 bg-white/10 p-4 text-inherit placeholder:text-inherit/30 outline-none transition-colors focus:border-white/50"
                                placeholder="Guest Name"
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRsvpSubmitted(true);
                              }}
                              className="mt-2 w-full rounded-lg bg-white py-4 text-sm font-bold uppercase tracking-widest text-slate-900 shadow-lg transition-colors hover:bg-slate-200"
                            >
                              Send Attendance
                            </button>
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <div className="mb-4 text-4xl">🎉</div>
                            <h3 className={`mb-2 text-2xl font-serif ${textClass}`}>Thank you!</h3>
                            <p className={`opacity-70 ${textClass}`}>
                              Your attendance response has been sent.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRsvpSubmitted(false);
                                setRsvpAttending("yes");
                              }}
                              className="mt-6 text-sm underline opacity-50 hover:opacity-100"
                            >
                              Send another response
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <button
                          onClick={() => handleShare()}
                          className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/20"
                        >
                          <Share2 size={16} />
                          <span className="hidden sm:inline">Share link</span>
                        </button>
                        <button
                          onClick={() => handleGoogleCalendar()}
                          className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/20"
                        >
                          <Image
                            src="/brands/google-white.svg"
                            alt="Google"
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          <span className="hidden sm:inline">Google Cal</span>
                        </button>
                        <button
                          onClick={() => handleAppleCalendar()}
                          className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/20"
                        >
                          <Image
                            src="/brands/apple-white.svg"
                            alt="Apple"
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          <span className="hidden sm:inline">Apple Cal</span>
                        </button>
                        <button
                          onClick={() => handleOutlookCalendar()}
                          className="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/20"
                        >
                          <Image
                            src="/brands/microsoft-white.svg"
                            alt="Microsoft"
                            width={16}
                            height={16}
                            className="h-4 w-4"
                          />
                          <span className="hidden sm:inline">Outlook</span>
                        </button>
                      </div>
                    </FootballSeasonPreviewSection>
                  )}

                  <footer className={`mt-1 border-t border-white/10 py-8 text-center ${textClass}`}>
                    <a
                      href="https://envitefy.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block space-y-1 no-underline"
                    >
                      <p className="text-sm opacity-60" style={bodyShadow}>
                        Powered By Envitefy. Create. Share. Enjoy.
                      </p>
                      <p className="text-xs opacity-50" style={bodyShadow}>
                        Create yours now.
                      </p>
                    </a>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <a
                        href="https://www.facebook.com/envitefy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-60 transition-opacity hover:opacity-100"
                        aria-label="Facebook"
                      >
                        <Image
                          src="/email/social-facebook.svg"
                          alt="Facebook"
                          width={24}
                          height={24}
                          className="h-6 w-6"
                        />
                      </a>
                      <a
                        href="https://www.instagram.com/envitefy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-60 transition-opacity hover:opacity-100"
                        aria-label="Instagram"
                      >
                        <Image
                          src="/email/social-instagram.svg"
                          alt="Instagram"
                          width={24}
                          height={24}
                          className="h-6 w-6"
                        />
                      </a>
                      <a
                        href="https://www.tiktok.com/@envitefy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-60 transition-opacity hover:opacity-100"
                        aria-label="TikTok"
                      >
                        <Image
                          src="/email/social-tiktok.svg"
                          alt="TikTok"
                          width={24}
                          height={24}
                          className="h-6 w-6"
                        />
                      </a>
                      <a
                        href="https://www.youtube.com/@Envitefy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-60 transition-opacity hover:opacity-100"
                        aria-label="YouTube"
                      >
                        <Image
                          src="/email/social-youtube.svg"
                          alt="YouTube"
                          width={24}
                          height={24}
                          className="h-6 w-6"
                        />
                      </a>
                    </div>
                  </footer>
                </FootballSeasonPreviewFrame>
              </div>
            </div>
          </div>
        )}

        {!isEmbed && mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/50 z-10"
            onClick={closeMobileMenu}
            role="presentation"
          ></div>
        )}

        <div
          className={`w-full bg-white flex flex-col ${
            isEmbed
              ? "min-h-screen"
              : `md:w-[400px] border-l border-slate-200 shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
                  mobileMenuOpen ? "translate-x-0" : "translate-x-full"
                }`
          }`}
          {...drawerTouchHandlers}
        >
          <ScrollHandoffContainer className="flex-1">
            {!isEmbed && (
              <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 gap-3">
                <button
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-full px-3 py-1"
                >
                  <ChevronLeft size={14} />
                  Back to preview
                </button>
                <span className="text-sm font-semibold text-slate-700">Customize</span>
              </div>
            )}

            <div className="p-6 pt-4 md:pt-6">
              {activeView === "main" && renderMainMenu()}
              {activeView === "headline" && renderHeadlineEditor}
              {activeView === "images" && renderImagesEditor()}
              {activeView === "design" && renderDesignEditor()}
              {activeView === "details" && renderDetailsEditor()}
              {activeView === "discover" && renderDiscoverEditor()}
              {activeView === "rsvp" && renderRsvpEditor()}
              {activeView === "passcode" && renderPasscodeEditor()}
              {config.advancedSections?.map((section) =>
                activeView === section.id ? (
                  <React.Fragment key={section.id}>{renderAdvancedEditor(section)}</React.Fragment>
                ) : null,
              )}
            </div>
          </ScrollHandoffContainer>

          <div className="p-4 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <div className="flex gap-3">
              {editEventId && (
                <button
                  onClick={() => {
                    if (!didExplicitSave && isNewDraft && editEventId) {
                      void (async () => {
                        try {
                          await fetch(`/api/history/${editEventId}`, {
                            method: "DELETE",
                            credentials: "include",
                          });
                        } catch {}

                        if (
                          isEmbed &&
                          typeof window !== "undefined" &&
                          (window as any).parent !== window
                        ) {
                          try {
                            (window as any).parent.location.assign("/event/football");
                            return;
                          } catch {}
                        }
                        router.push("/event/football");
                      })();
                      return;
                    }
                    if (
                      isEmbed &&
                      typeof window !== "undefined" &&
                      (window as any).parent !== window
                    ) {
                      try {
                        (window as any).parent.location.assign(`/event/${editEventId}`);
                        return;
                      } catch {}
                    }
                    router.push(`/event/${editEventId}`);
                  }}
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

        {!isEmbed && !mobileMenuOpen && (
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
// FOOTBALL SEASON MANAGEMENT - TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

import { config } from "@/components/event-templates/FootballSeasonTemplate";

const Page = createSimpleCustomizePage(config);
export default Page;
