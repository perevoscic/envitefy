// @ts-nocheck
"use client";
import { EventSectionBuilderProvider, EventSectionPalette, EventSectionsReadOnly, useSectionEditorClose } from "@/components/events/EventSectionBuilder";
import { normalizeEventSectionLayout } from "@/lib/event-section-layout";
import HeroImageEditor from "@/components/events/HeroImageEditor";
import CustomEventUrlField, { checkCustomEventUrl } from "@/components/events/CustomEventUrlField";
import { validateCustomEventPublicSlug } from "@/utils/event-public-slug";
import { suggestFootballPublicSlug } from "@/lib/football-custom-url";
import FootballSeasonSectionNav, { useFootballSectionTabs } from "@/components/football-season-templates/FootballSectionTabs";
import { resolveFootballTeamName, resolveFootballTitle } from "@/lib/football-team-name";
import { hasFootballGame, mergeFootballGameDetails } from "@/lib/football-games";
import { updateFootballGameDetails } from "@/lib/football-game-details-client";
import { footballErrorMessage, readFootballResponse } from "@/lib/football-response";
import { parseCalendarDateTimeToIso } from "@/lib/calendar-date-time";
import { footballEditorFields } from "@/lib/football-editor-data";
import { FOOTBALL_SECTION_LABELS, normalizeFootballHiddenSections, type FootballSectionId } from "@/lib/football-section-visibility";
import EventCanvas from "@/components/EventCanvas";
import { ownerEventEditorReturnHref } from "@/lib/event-preview-viewport";

import { useManualEventProgress } from "@/hooks/useManualEventProgress";
import { useProgressNavigation } from "@/components/UnsavedProgressProvider";

import FootballHero from "@/components/football-season-templates/FootballHero";
import FootballPageContent from "@/components/football-season-templates/FootballPageContent";
import { FootballPageTextProvider } from "@/components/football-season-templates/FootballPageText";
import { normalizeFootballEventData } from "@/components/football-discovery/normalizeFootballEventData.mjs";
import { normalizeFootballPageText, updateFootballPageText, type FootballPageText, type FootballPageTextChange } from "@/lib/football-page-text";
import { resolveFootballHero } from "@/components/football-season-templates/footballDesigns";
import FootballPageActions from "@/components/football-season-templates/FootballPageActions";
import EventGuestPlanningEditor from "@/components/event-templates/EventGuestPlanningEditor";
import { type EventGuestPlanning, normalizeEventGuestPlanning, eventLocalDateParts, getEventEndLocal } from "@/lib/event-guest-planning";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Link as LinkIcon,
  Type,
  Upload,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  getGymMeetTemplateMeta,
  isGymMeetTemplateId,
} from "@/components/football-season-templates/registry";
import TemplateSelector from "@/components/football-season-templates/TemplateSelector";
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
  const inputId = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={inputId}
          className={baseTextareaClass}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      ) : (
        <input
          id={inputId}
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


const FootballSeasonPreviewFrame = ({
  theme,
  children,
}: {
  theme: any;
  children: React.ReactNode;
}) => (
  <div
    className={`relative min-h-[780px] w-full overflow-hidden rounded-[32px] ${theme.pageClass} ${theme.shellClass}`}
  >
    <div className="relative z-10">{children}</div>
  </div>
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
    }) => {
      const closeSectionEditor = useSectionEditorClose();
      if (closeSectionEditor) return <>{children}</>;
      return (
      <div className="animate-fade-in-right">
        <div className="flex items-center mb-6 pb-4 border-b border-slate-100">
          <div className="mr-3 w-8">
            {showBack && (
              <button
                type="button" aria-label="Back to customization"
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
          <h2 className="text-lg font-serif font-bold text-slate-800 ml-3 min-w-0 text-right">
            {title}
          </h2>
        </div>
        {children}
      </div>
    );
};

function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
    const search = useSearchParams();
    const router = useRouter();
  const { allowNavigation, requestLeave } = useProgressNavigation();
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

    const [progressLoading, setProgressLoading] = useState(Boolean(editEventId));
    const [data, setData] = useState(() => ({
      guestPlanning: {} as EventGuestPlanning,
      footballHiddenSections: [] as FootballSectionId[],
      sectionLayout: normalizeEventSectionLayout(undefined),
      footballPageText: {} as FootballPageText,
      endTime: "",
      endDate: "",
      title: config.displayName,
      publicSlugInput: "",
      date: defaultDate ? initialDate : "",
      timezone: "",
      time: "",
      city: "",
      state: "",
      venue: "",
      details: "",
      heroImageFilterEnabled: false,
      hero: "",
      rsvpEnabled: false,
      rsvpDeadline: "",
      fontSize: (config as any)?.prefill?.fontSize || "medium",
      passcodeRequired: false,
      passcode: "",
      extra: Object.fromEntries(
        config.detailFields.map((f) => [
          f.key,
          "",
        ]),
      ),
    }));
    const [advancedState, setAdvancedState] = useState(() => ({
      scores: { scorestreamWidgetUrl: "" },
      games: { games: [] }, roster: { players: [] }, practice: { blocks: [] },
      logistics: {}, gear: { items: [] }, volunteers: { slots: [] }, announcements: { items: [] },
    }));
    const [pageTemplateId, setPageTemplateId] = useState(() => {
      const selected = search?.get("templateId");
      return isGymMeetTemplateId(selected) ? selected : DEFAULT_GYM_MEET_TEMPLATE_ID;
    });
    const [activeView, setActiveView] = useState<string>("main");
    const [sectionPreviewOpen, setSectionPreviewOpen] = useState(false);
    const sectionPreviewRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
      if (sectionPreviewOpen) sectionPreviewRef.current?.showModal();
      else sectionPreviewRef.current?.close();
    }, [sectionPreviewOpen]);
    const [submitting, setSubmitting] = useState(false);
    const [, setDidExplicitSave] = useState(false);
    const [initializingEdit, setInitializingEdit] = useState(Boolean(editEventId));
    const [discoverMode, setDiscoverMode] = useState<"file" | "url">("file");
    const discoverId = useId();
    const discoverTabs = useRef<Partial<Record<"file" | "url", HTMLButtonElement | null>>>({});
    const discoverFileInput = useRef<HTMLInputElement | null>(null);
    const [discoverUrl, setDiscoverUrl] = useState("");
    const [contextBusy, setContextBusy] = useState(false);
    const [contextMessage, setContextMessage] = useState("");
    const contextRequest = useRef<AbortController | null>(null);
    const currentEditor = useRef({ data, advancedState });
    currentEditor.current = { data, advancedState };
    useEffect(() => () => contextRequest.current?.abort(), []);
    const [discoverSuccess, setDiscoverSuccess] = useState("");
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
    } = useMobileDrawer(undefined, "event-actions");
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

    const refreshGameContext = async (sourceGames = advancedState?.games?.games || [], sourceHome = { teamName: data.extra?.team, homeVenue: data.extra?.stadium || data.venue, homeAddress: data.extra?.stadiumAddress, timezone: data.timezone }) => {
      if (!sourceGames.length) return;
      contextRequest.current?.abort();
      const request = new AbortController();
      contextRequest.current = request;
      setContextBusy(true); setContextMessage("");
      try {
        const homeKey = (home) => JSON.stringify([resolveFootballTeamName(home.teamName || "").toLowerCase(), home.homeVenue || "", home.homeAddress || "", home.timezone || ""]);
        const result = await updateFootballGameDetails({
          games: sourceGames, home: sourceHome, signal: request.signal,
          onProgress: setContextMessage,
          onUpdate: ({ games, home: resolvedHome, previous }) => {
            const latest = currentEditor.current.data;
            const latestKey = homeKey({ teamName: latest.extra?.team, homeVenue: latest.extra?.stadium || latest.venue, homeAddress: latest.extra?.stadiumAddress, timezone: latest.timezone });
            if (latestKey !== homeKey(sourceHome) && latestKey !== homeKey(previous.home)) {
              setContextMessage("Your home team or stadium changed. Find game details again for the updated team.");
              request.abort();
              return;
            }
            setData((current) => ({ ...current, venue: current.venue || resolvedHome.homeVenue || "", extra: { ...current.extra, stadium: current.extra?.stadium || resolvedHome.homeVenue || "", stadiumAddress: current.extra?.stadiumAddress || resolvedHome.homeAddress || "" } }));
            setAdvancedState((current) => ({ ...current, games: { ...current.games, games: (current.games?.games || []).map((game) => {
              const original = previous.games.find((candidate) => candidate.id === game.id);
              const found = games.find((candidate) => candidate.id === game.id);
              return original && found ? mergeFootballGameDetails(game, original, found) : game;
            }) } }));
          },
        });
        if (request.signal.aborted) return;
        const ticketCount = result.games.filter((game) => game.ticketsLink).length;
        const stadiumCount = result.games.filter((game) => game.address).length;
        const driveCount = result.games.filter((game) => game.homeAway === "away" && game.context?.miles != null).length;
        const summary = ticketCount || stadiumCount
          ? `Found ticket links for ${ticketCount} games, ${stadiumCount} stadium addresses, and ${driveCount} away-game drives. Review the cards, then save to keep these details.`
          : "We couldn't verify the hosting schools' details yet. Add your home stadium address or enter each stadium and ticket URL below.";
        setContextMessage([summary, ...result.errors].join(" "));
      } catch (error) { if (!request.signal.aborted) setContextMessage(footballErrorMessage(error, "The lookup failed. Select Find tickets, stadiums & miles to try again; your details are kept.")); }
      finally { if (contextRequest.current === request) { setContextBusy(false); contextRequest.current = null; } }
    };

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
          if (existing.manualEditor?.snapshot) {
            const saved = existing.manualEditor.snapshot;
            if (saved.data !== undefined) setData({ ...saved.data, footballPageText: normalizeFootballPageText(saved.data.footballPageText), publicSlugInput: saved.data.publicSlugInput ?? json.public_slug ?? existing.publicSlug ?? "" });
            if (saved.advancedState !== undefined) setAdvancedState(saved.advancedState);
            if (saved.pageTemplateId !== undefined) setPageTemplateId(saved.pageTemplateId);
            if (saved.loadedDiscoverySource) setLoadedDiscoverySource(saved.loadedDiscoverySource);
            if (saved.isDiscoveryEdit) setIsDiscoveryEdit(true);
            setProgressLoading(false);
            return;
          }

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
              existingCreatedVia === "football-discovery-v2" ||
              safeString(existingDiscoverySource?.workflow) === "football",
          );

          const startIso = existing.start || existing.startISO || existing.startIso;
          let loadedDate = "";
          let loadedTime = "";
          if (startIso) {
            const d = new Date(startIso);
            if (!Number.isNaN(d.getTime())) {
              loadedDate = eventLocalDateParts(d.toISOString()).date;
              loadedTime = eventLocalDateParts(d.toISOString()).time;
            }
          }

          const accessControl = existing.accessControl || {};
          const hasPasscode = Boolean(
            accessControl?.passcodeHash || accessControl?.requirePasscode,
          );

          setData((prev) => ({
            ...prev,
            title: json?.title || existing.title || prev.title,
            publicSlugInput: json?.public_slug || existing.publicSlug || "",
            guestPlanning: normalizeEventGuestPlanning(existing.guestPlanning),
            footballHiddenSections: normalizeFootballHiddenSections(existing.footballHiddenSections),
            sectionLayout: normalizeEventSectionLayout(existing.sectionLayout),
            footballPageText: normalizeFootballPageText(existing.footballPageText),
            endTime: existing.endTime || eventLocalDateParts(existing.endISO || existing.endAt || existing.end).time,
            endDate: existing.endDate || eventLocalDateParts(existing.endISO || existing.endAt || existing.end).date,
            timezone: existing.timezone || "",
            date: existing.date || loadedDate,
            time: existing.time || loadedTime,
            city: existing.city || "",
            state: existing.state || "",
            venue: existing.venue || "",
            details: existing.details || existing.description || "",
            heroImageFilterEnabled: false,
            hero: existing.heroImage || existing.hero || prev.hero,
            rsvpEnabled:
              existing.rsvpEnabled === true,
            rsvpDeadline: existing.rsvpDeadline || "",
            fontSize: existing.fontSize || prev.fontSize,
            passcodeRequired: hasPasscode,
            passcode: "", // Never load plain passcode for security
            extra: {
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
            setAdvancedState(normalizedAdvanced);
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
          setProgressLoading(false);
          setInitializingEdit(false);
        }
      };
      loadExisting();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editEventId]);

    const resolvedHero = resolveFootballHero(pageTemplateId, data.hero);
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
              title: resolveFootballTitle(data.title, data.extra?.team),
              description: data.details,
              details: data.details,
              guestPlanning: data.guestPlanning,
              footballHiddenSections: normalizeFootballHiddenSections(data.sectionLayout?.hidden ?? data.footballHiddenSections),
              sectionLayout: data.sectionLayout,
              footballPageText: normalizeFootballPageText(data.footballPageText),
              endTime: data.endTime,
              endDate: data.endDate,
              heroImageFilterEnabled: false,
              heroImage: resolvedHero,
              hero: resolvedHero,
              venue: data.venue || data.extra?.stadium || data.extra?.stadiumAddress,
              date: data.date,
              time: data.time,
              timezone: data.timezone || undefined,
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
      data.guestPlanning,
      data.footballHiddenSections,
      data.sectionLayout,
      data.footballPageText,
      data.endTime,
      data.endDate,
      data.extra,
      data.fontSize,
      resolvedHero,
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

    const textClass = templateTheme.textClass;
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
    const headingSizeClass = selectedSize?.className || FONT_SIZE_OPTIONS[1].className;

    const displayTeamName = resolveFootballTeamName(data.extra?.team, data.title);
    const hiddenSections = useMemo(() => normalizeFootballHiddenSections(data.sectionLayout?.hidden ?? data.footballHiddenSections), [data.sectionLayout, data.footballHiddenSections]);
    const sectionLayout = data.sectionLayout || (hiddenSections.length ? { version: 1 as const, order: [], added: [], hidden: hiddenSections } : undefined);
    const locationParts = [data.venue, data.city, data.state].filter(Boolean).join(", ");
    const addressLine = data.extra?.stadiumAddress || data.extra?.address || "";

    const hasGames = (advancedState?.games?.games || []).some(hasFootballGame);

    const footballModel = useMemo(() => normalizeFootballEventData({
      eventTitle: data.title,
      eventData: {
        ...data, description: data.details, customFields: data.extra,
        advancedSections: advancedState, previewDetailsPlaceholder: "Add an event description",
        accessControl: { requirePasscode: data.passcodeRequired },
      },
    }), [data, advancedState]);
    const navItems = footballModel.navItems;

    const sectionTabs = useFootballSectionTabs(navItems);
    const handlePageTextChange: FootballPageTextChange = useCallback((key, value) => {
      setData((previous) => updateFootballPageText(previous, key, value));
    }, []);

    const updateExtra = useCallback((key: string, value: string) => {
      setData((prev) => {
        const next = cloneState(prev || {});
        const extra = next.extra && typeof next.extra === "object" ? next.extra : {};
        next.extra = { ...extra, ...(key === "team" && value !== extra.team ? { teamMascot: "" } : {}), [key]: value };
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

  useManualEventProgress({
    snapshot: { data, advancedState, pageTemplateId, loadedDiscoverySource, isDiscoveryEdit },
    category: config.category, templateId: config.slug, eventId: editEventId,
    ready: !progressLoading, busy: submitting || discoverBusy,
  });

    const handlePublish = useCallback(async () => {
      if (submitting) return;
      setSubmitting(true);
      try {
        let publicSlug: string | undefined;
        if (data.publicSlugInput?.trim()) {
          const validation = validateCustomEventPublicSlug(data.publicSlugInput);
          try {
            if (validation.error) throw new Error(validation.error);
            await checkCustomEventUrl(validation.slug, editEventId);
            publicSlug = validation.slug;
          } catch (error) {
            setActiveView("url");
            throw error;
          }
        }
        if (data.endTime && !getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate)) {
          throw new Error("End time must be after the start. For an overnight event, choose the next end date.");
        }

        let startISO: string | null = null;
        let endISO: string | null = null;
        if (data.date && data.time) {
          const endLocal = getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate);
          startISO = parseCalendarDateTimeToIso(`${data.date}T${data.time}`, data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
          endISO = endLocal ? parseCalendarDateTimeToIso(endLocal, data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone) : null;
        }

        const heroToSave =
          (await persistImageMediaValue({
            value: resolvedHero,
            eventId: editEventId || undefined,
            fileName: `${config.slug}-hero.png`,
            fallbackValue: resolvedHero,
          })) || resolvedHero;

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
        const isDiscoveryUpdate = isDiscoveryEdit;
        const payload: any = {
          title: resolveFootballTitle(data.title, data.extra?.team) || config.displayName,
          data: {
            category: config.category,
            displayName: config.displayName,
            createdVia: isDiscoveryUpdate ? "football-discovery-v2" : "template",
            createdManually: !isDiscoveryUpdate,
            startISO,
            endISO,
            endAt: endISO,
            end: endISO,
            endTime: data.endTime,
            endDate: data.endDate,
            guestPlanning: data.guestPlanning,
            footballHiddenSections: hiddenSections,
            sectionLayout: data.sectionLayout,
            footballPageText: normalizeFootballPageText(data.footballPageText),
            date: data.date,
            time: data.time,
            timezone: data.timezone || undefined,
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
              team: resolveFootballTeamName(data.extra?.team, data.title),
              advancedSections: normalizedAdvancedSections,
            },
            advancedSections: normalizedAdvancedSections,
            heroImageFilterEnabled: false,
            heroImage: heroToSave,
            extra: { ...data.extra, team: resolveFootballTeamName(data.extra?.team, data.title) },
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
        payload.data.status = "published";
        payload.data.draftStatus = "published";
        payload.data.manualEditor = null;
        if (publicSlug) payload.publicSlug = publicSlug;

        if (editEventId) {
          const res = await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: payload.title,
              data: payload.data,
              ...(publicSlug ? { publicSlug } : {}),
              ...(isNewDraft ? { claim: true } : {}),
            }),
          });
          const saved = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 409 && publicSlug) setActiveView("url");
            throw new Error(saved.error || "Failed to update event");
          }
          setDidExplicitSave(true);
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("history:updated", {
                detail: { id: editEventId },
              }),
            );
          }
          const redirectUrl = buildEventPath(editEventId, payload.title, {
            tab: "event",
            updated: true,
            t: Date.now(),
          }, saved.public_slug || saved.data?.publicSlug);
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
          allowNavigation(() => router.push(redirectUrl));
        } else {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            if (res.status === 409 && publicSlug) setActiveView("url");
            throw new Error(json.error || "Failed to create event");
          }
          const id = (json as any)?.id as string | undefined;
          if (!id) throw new Error("Failed to create event");
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("history:created", {
                detail: {
                  id,
                  title: payload.title,
                  public_slug: json.public_slug,
                  created_at: (json as any)?.created_at || new Date().toISOString(),
                  data: json.data || payload.data,
                },
              }),
            );
          }
          allowNavigation(() => router.push(buildEventPath(id, payload.title, { created: true }, json.public_slug || json.data?.publicSlug)));
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
      data.publicSlugInput,
      data.details,
      data.guestPlanning,
      data.sectionLayout,
      hiddenSections,
      data.endTime,
      data.endDate,
      data.venue,
      data.city,
      data.state,
      resolvedHero,
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
      const endLocal = getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate);
          const end = endLocal ? new Date(endLocal) : start;
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

    const _handleShare = () => {
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

    const _handleGoogleCalendar = () => {
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

    const _handleOutlookCalendar = () => {
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

    const _handleAppleCalendar = () => {
      const details = buildEventDetails();
      openAppleCalendarIcs(buildIcsUrl(details));
    };

    const handleBackToTemplates = () => {
      const params = new URLSearchParams();
      if (defaultDate) params.set("d", defaultDate);
      const templatesHref = `/event/football${params.size ? `?${params.toString()}` : ""}`;
      requestLeave(() => {
        if (isEmbed && window.parent !== window) {
          if (editEventId) {
            window.parent.postMessage(
              { type: "envitefy:discovery-preview-reset", eventId: editEventId },
              window.location.origin,
            );
          }
          window.parent.location.assign(templatesHref);
        } else {
          router.push(templatesHref);
        }
      });
    };

    const renderMainMenu = () => (
      <div className="space-y-4 animate-fade-in pb-8 flex flex-col items-center">
        {discoverSuccess ? <p role="status" className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{discoverSuccess}</p> : null}
        <div className="mb-2 w-full max-w-sm text-center">
          <button
            type="button"
            onClick={handleBackToTemplates}
            disabled={submitting || progressLoading}
            className="mb-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Back to templates
          </button>
          <h2 className="text-2xl font-serif font-semibold text-slate-800 mb-1">
            Event settings
          </h2>
          {isDiscoveryEdit ? <p className="text-slate-500 text-sm">Review the details from your imported football source.</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          {renderDiscoverEditor()}
          <MenuCard
            title="Event basics"
            desc="Title, date, location."
            icon={<Type size={18} />}
            onClick={() => setActiveView("headline")}
          />
          <MenuCard title="Design" desc="Page style, typography, and colors." icon={<Type size={18} />} onClick={() => setActiveView("design")} />
          <MenuCard title="Custom URL" desc="Choose your page's shareable web address." icon={<LinkIcon size={18} />} onClick={() => setActiveView("url")} />

          <EventSectionPalette />
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
        <EditorLayout title="Event basics" onBack={handleBackToMain} showBack>
          <div className="space-y-6">
            <InputGroup
              key="title"
              label="Headline"
              value={data.title}
              onChange={(v) => updateData("title", v)}
              placeholder={`${config.displayName} title`}
            />
            <p className="text-sm leading-relaxed text-slate-600">
              Shown at the top of your page. The preview updates as you type.
            </p>

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
            <InputGroup label="Timezone" value={data.timezone || ""} onChange={(value) => updateData("timezone", value)} placeholder="America/Chicago" />
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
        data.endTime,
        data.endDate,
        data.timezone,
        data.venue,
        data.city,
        data.state,
        updateData,
        handleBackToMain,
        config.displayName,
      ],
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
          <EventGuestPlanningEditor category="football-season" value={data.guestPlanning} onChange={(guestPlanning) => setData((prev) => ({ ...prev, guestPlanning }))} />

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
                value={(field.key === "team" ? displayTeamName : data.extra[field.key]) || ""}
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
      setDiscoverError(""); setDiscoverSuccess("");
      if (discoverMode === "file" && !discoverFile) { setDiscoverError("Choose a file to continue."); return; }
      if (discoverMode === "url") {
        try { const url = new URL(discoverUrl.trim()); if (!["https:", "http:"].includes(url.protocol)) throw new Error(); }
        catch { setDiscoverError("Enter a complete http or https website URL."); return; }
      }
      setDiscoverBusy(true);
      try {
        const form = new FormData();
        if (discoverFile) form.append("file", discoverFile);
        const response = await fetch("/api/football/prefill", {
          method: "POST", credentials: "include",
          ...(discoverMode === "url" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: discoverUrl.trim() }) } : { body: form }),
        });
        const result = await readFootballResponse(response, "The import service did not respond. Try the file or URL again; your current details are kept.");
        if (!result.data) throw new Error(result.error || "Unable to read this source.");
        setData((previous) => ({ ...previous, ...footballEditorFields(result.data), guestPlanning: {}, passcode: result.passcode || "" }));
        setAdvancedState((previous) => ({
          ...(result.data.advancedSections || {}),
          scores: previous.scores || { scorestreamWidgetUrl: "" },
        }));
        setLoadedDiscoverySource(result.source); setIsDiscoveryEdit(true);
        void refreshGameContext(result.data.advancedSections?.games?.games || [], { teamName: result.data.extra?.team, homeVenue: result.data.extra?.stadium || result.data.venue, homeAddress: result.data.extra?.stadiumAddress, timezone: result.data.timezone });
        setDiscoverSuccess("Source imported. Review your details, then save or publish when ready.");
        setActiveView("main");
      } catch (error) { setDiscoverError(footballErrorMessage(error, "The import service did not respond. Try again; your current details are kept.")); }
      finally { setDiscoverBusy(false); }
    }, [discoverBusy, discoverMode, discoverFile, discoverUrl]);

    const renderDiscoverEditor = () => (
      <section aria-label="Import football details" className="w-full rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-left">
        <p className="text-sm font-semibold text-slate-800">Have your football details already?</p>
        <form className="mt-3 space-y-3" noValidate onSubmit={(event) => { event.preventDefault(); void handleDiscoverParse(); }}>
          <input
            ref={discoverFileInput}
            type="file"
            aria-label="Schedule, roster, or packet"
            accept=".pdf,image/png,image/jpeg,image/webp"
            disabled={discoverBusy}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setDiscoverFile(file);
              setDiscoverError("");
            }}
          />
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Import source">
            {(["file", "url"] as const).map((mode) => (
              <button
                key={mode}
                ref={(node) => { discoverTabs.current[mode] = node; }}
                id={`${discoverId}-${mode}-tab`}
                type="button"
                role="tab"
                aria-selected={discoverMode === mode}
                aria-controls={`${discoverId}-${mode}-panel`}
                tabIndex={discoverMode === mode ? 0 : -1}
                disabled={discoverBusy}
                onClick={() => {
                  setDiscoverMode(mode);
                  setDiscoverError("");
                  if (mode === "file") discoverFileInput.current?.click();
                }}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const nextMode = event.key === "Home" ? "file" : event.key === "End" ? "url" : mode === "file" ? "url" : "file";
                  setDiscoverMode(nextMode);
                  setDiscoverError("");
                  discoverTabs.current[nextMode]?.focus();
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50 motion-reduce:transition-none ${discoverMode === mode ? "border-violet-600 bg-violet-600 text-white shadow-sm hover:bg-violet-700" : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"}`}
              >
                {mode === "file" ? <Upload className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {mode === "file" ? "Upload" : "Paste URL"}
              </button>
            ))}
          </div>
          <div id={`${discoverId}-file-panel`} role="tabpanel" aria-labelledby={`${discoverId}-file-tab`} hidden={discoverMode !== "file"} className="space-y-2">
            {discoverFile ? <p role="status" className="break-all text-xs leading-5 text-slate-600">Selected: {discoverFile.name}</p> : null}
            <p className="text-xs text-slate-500">PDF, PNG, JPG, or WebP</p>
          </div>
          <div id={`${discoverId}-url-panel`} role="tabpanel" aria-labelledby={`${discoverId}-url-tab`} hidden={discoverMode !== "url"} className="space-y-2">
            <label htmlFor={`${discoverId}-source-url`} className="block text-xs font-semibold text-slate-600">Public football URL</label>
            <input id={`${discoverId}-source-url`} type="url" value={discoverUrl} disabled={discoverBusy} onChange={(event) => { setDiscoverUrl(event.target.value); setDiscoverError(""); }} placeholder="https://school.edu/athletics/football" autoCapitalize="none" autoCorrect="off" aria-invalid={discoverMode === "url" && !!discoverError} aria-describedby={discoverMode === "url" && discoverError ? `${discoverId}-error` : undefined} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-normal text-slate-900 outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          {discoverError ? <p id={`${discoverId}-error`} role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{footballErrorMessage(discoverError, "The previous import failed. Try the file or URL again; your current details are kept.")}</p> : null}
          <button type="submit" disabled={discoverBusy} className="min-h-11 w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">{discoverBusy ? "Reading your source…" : discoverMode === "file" ? "Fill from this file" : "Fill from this link"}</button>
          {discoverBusy ? <p role="status" className="text-sm text-slate-600">Reading the source and organizing the schedule. This can take a minute.</p> : null}
          <p className="text-xs leading-5 text-slate-500">Imported details replace the current details. Your design and hero image stay in place.</p>
        </form>
      </section>
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
        {section.id === "games" ? (
          <section className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="football-travel-heading">
            <div>
              <h3 id="football-travel-heading" className="text-base font-semibold text-slate-800">Tickets, stadiums & travel</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Find official ticket links and stadium addresses for the hosting schools. Away-game drives start at your team's home stadium.
              </p>
            </div>
            <InputGroup
              label="Home stadium name"
              value={data.extra?.stadium || data.venue || ""}
              onChange={(value) => setData((previous) => ({ ...previous, extra: { ...previous.extra, stadium: value } }))}
              placeholder="Your team's home stadium"
            />
            <InputGroup
              label="Home stadium address"
              value={data.extra?.stadiumAddress || ""}
              onChange={(value) => setData((previous) => ({ ...previous, extra: { ...previous.extra, stadiumAddress: value } }))}
              placeholder="Street, city, state, and ZIP"
            />
            {hasGames ? (
              <button type="button" onClick={() => void refreshGameContext()} disabled={contextBusy} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
                {contextBusy ? "Finding tickets, stadiums & miles…" : "Find tickets, stadiums & miles"}
              </button>
            ) : null}
            <p className="text-xs leading-relaxed text-slate-500">
              The lookup fills missing details and keeps your edits. Ticket buttons open the host school's sales page; forecasts appear when available near game day.
            </p>
            {contextMessage ? <p role="status" className="text-sm leading-relaxed text-slate-700">{footballErrorMessage(contextMessage, "The previous lookup failed. Select Find tickets, stadiums & miles to retry; your details are kept.")}</p> : null}
          </section>
        ) : null}
        {section.renderEditor({
          state: advancedState?.[section.id],
          setState: (updater: any) => setAdvancedSectionState(section.id, updater),
          setActiveView,
          inputClass: baseInputClass,
          textareaClass: baseTextareaClass,
        })}
      </EditorLayout>
    );

    const infoLine = <div className="flex flex-wrap gap-x-4 gap-y-2 text-base font-medium text-current" style={bodyShadow}>
      {[data.date ? new Date(data.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "", data.time, locationParts].filter(Boolean).map((value) => <span key={value}>{value}</span>)}
    </div>;

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

    const renderFootballPage = (readOnly: boolean) => (<FootballSeasonPreviewFrame theme={templateTheme}>
                  <FootballPageTextProvider text={data.footballPageText} title={data.title} details={data.details} onChange={readOnly || mobileMenuOpen ? undefined : handlePageTextChange}>
                  <FootballHero
                    templateId={pageTemplateId}
                    title={!editEventId && (!data.title?.trim() || data.title === config.displayName) ? "Your team. Your season." : resolveFootballTitle(data.title, data.extra?.team) || config.displayName}
                    subtitle={footballModel.subtitle || "Football season"}
                    metadata={infoLine}
                    details={[addressLine]}
                    heroSrc={resolvedHero}
                    headingClassName={headingSizeClass}
                    headingStyle={heroHeadingFontStyle}
                    artworkAction={readOnly ? undefined : <HeroImageEditor value={data.hero} onChange={(hero) => setData((prev) => ({ ...prev, hero }))} />}
                    actions={
                      <FootballPageActions
                        title={resolveFootballTitle(data.title, data.extra?.team)}
                        start={data.date && data.time ? `${data.date}T${data.time}` : undefined}
                        timezone={data.timezone || undefined}
                        end={getEventEndLocal(data.date, data.time || "14:00", data.endTime, data.endDate)}
                        description={data.details}
                        location={[data.venue, data.city, data.state].filter(Boolean).join(", ")}
                        shareUrl={editEventId && typeof window !== "undefined" ? `${window.location.origin}${buildEventPath(editEventId)}` : undefined}
                        onEdit={readOnly ? undefined : openMobileMenu}
                        onPreview={readOnly ? undefined : () => setSectionPreviewOpen(true)}
                      />
                    }
                  />

                  {readOnly && navItems.length > 0 ? <div className="px-5 pt-5"><FootballSeasonSectionNav tabs={sectionTabs} shellClassName={templateTheme.navShellClass} activeClassName={templateTheme.navActiveClass} idleClassName={templateTheme.navIdleClass} /></div> : null}
                  <FootballPageContent
                    sections={footballModel.sections}
                    tabs={sectionTabs}
                    chrome={templateTheme}
                    schedule={{
                      games: advancedState?.games?.games || [], teamName: displayTeamName,
                      teamMascot: data.extra?.teamMascot, season: data.extra?.season,
                      homeVenue: data.extra?.stadium || data.venue, homeAddress: data.extra?.stadiumAddress,
                      timezone: data.timezone,
                    }}
                    attendance={footballModel.attendance}
                    sectionAction={readOnly ? undefined : (id) => id === "games" ? <div className="mb-5 flex flex-wrap items-center gap-3">
                      <button type="button" disabled={contextBusy} onClick={() => void refreshGameContext()} className="inline-flex min-h-11 items-center justify-center rounded-full border border-current/30 px-4 py-2 text-sm font-semibold hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
                        {contextBusy ? "Finding tickets, stadiums & miles…" : "Find tickets, stadiums & miles"}
                      </button>
                      {contextMessage ? <p role="status" className="max-w-2xl text-sm leading-relaxed opacity-85">{footballErrorMessage(contextMessage, "The previous lookup failed. Select Find tickets, stadiums & miles to retry; your details are kept.")}</p> : null}
                    </div> : null}
                  />

                  <footer className={`mt-1 border-t border-white/10 py-8 text-center ${textClass}`}>
                    <EnvitefyEventBranding category="Football" inheritColor />
                  </footer>
                  </FootballPageTextProvider>
                </FootballSeasonPreviewFrame>);

    const renderSectionEditor = (id: string) => {
      if (id === "details") return renderDetailsEditor();
      if (id === "rsvp") return renderRsvpEditor();
      const section = config.advancedSections?.find((item) => item.id === id);
      return section ? renderAdvancedEditor(section) : null;
    };
    const sectionCatalog = Object.entries(FOOTBALL_SECTION_LABELS).map(([id, label]) => ({ id, label, editorId: id }));

    return (
      <EventSectionBuilderProvider layout={sectionLayout} catalog={sectionCatalog} renderEditor={renderSectionEditor}
        onChange={(next) => setData((previous) => ({ ...previous, sectionLayout: next }))}>
      <div
        className={`relative flex w-full bg-slate-100 font-sans text-slate-900 ${
          isEmbed ? "min-h-screen flex-col" : "min-h-screen h-[100dvh] overflow-clip"
        }`}
      >
        {!isEmbed && (
          <EventCanvas
            {...previewTouchHandlers}
            className="flex-1 min-w-0 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <div className="w-full min-w-0 mb-20 md:mb-24 pb-8 transition-all duration-500 ease-in-out">
              <div>
                {renderFootballPage(false)}
              </div>
            </div>
          </EventCanvas>
        )}

        {!isEmbed && mobileMenuOpen && (
          <div
            className="nav-chrome-mobile-drawer-backdrop md:hidden fixed inset-0 z-10"
            onClick={closeMobileMenu}
            role="presentation"
          ></div>
        )}

        <div
          className={`w-full flex flex-col ${
            isEmbed
              ? "min-h-screen bg-white"
              : `nav-chrome-mobile-drawer md:w-[400px] md:shrink-0 z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
                  mobileMenuOpen ? "translate-x-0" : "translate-x-full max-md:invisible max-md:pointer-events-none"
                }`
          }`}
          {...drawerTouchHandlers}
        >
          <ScrollHandoffContainer className="flex-1">
            {!isEmbed && (
              <div className="nav-chrome-mobile-drawer-header md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
                <button
                  onClick={closeMobileMenu}
                  className="nav-chrome-mobile-drawer-back-button flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                >
                  <ChevronLeft size={14} />
                  Back to preview
                </button>
                <span className="text-sm font-semibold text-slate-700">Customize</span>
              </div>
            )}

            <div className="p-6 pt-4 md:pt-6">
              {(activeView === "main" || activeView === "images") && renderMainMenu()}
              {activeView === "headline" && renderHeadlineEditor}

              {activeView === "design" && renderDesignEditor()}
              {activeView === "url" && <EditorLayout title="Custom URL" onBack={handleBackToMain} showBack>
                <CustomEventUrlField value={data.publicSlugInput || ""} onChange={(value) => updateData("publicSlugInput", value)} eventId={editEventId} disabled={submitting}
                  suggestion={suggestFootballPublicSlug({ teamName: displayTeamName, teamMascot: data.extra?.teamMascot, title: data.title === config.displayName ? "" : data.title, season: data.extra?.season, games: advancedState.games?.games || [] })} />
              </EditorLayout>}
              {activeView === "details" && renderDetailsEditor()}
              {activeView === "rsvp" && renderRsvpEditor()}
              {activeView === "passcode" && renderPasscodeEditor()}
              {config.advancedSections?.map((section) =>
                activeView === section.id ? (
                  <React.Fragment key={section.id}>{renderAdvancedEditor(section)}</React.Fragment>
                ) : null,
              )}
            </div>
          </ScrollHandoffContainer>

          <div className="sticky bottom-0 border-t border-[rgba(112,97,168,0.14)] bg-[rgba(246,241,255,0.92)] p-4 backdrop-blur-xl">
            <div className="flex gap-3">
              {editEventId && (
                <button
                  onClick={() => {
                    const cancelHref = ownerEventEditorReturnHref(search) ||
                      buildEventPath(editEventId, undefined, { tab: "event" });
                    if (isEmbed && window.parent !== window) {
                      requestLeave(() => {
                        window.parent.postMessage(
                          { type: "envitefy:discovery-preview-reset", eventId: editEventId },
                          window.location.origin,
                        );
                        window.parent.location.assign(cancelHref);
                      });
                    } else {
                      router.push(cancelHref);
                    }
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

      </div>
      <dialog ref={sectionPreviewRef} aria-label="Football event preview"
        onCancel={() => setSectionPreviewOpen(false)} onClose={() => setSectionPreviewOpen(false)}
        className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 p-0">
        {sectionPreviewOpen ? <EventSectionsReadOnly><EventCanvas className="min-h-full w-full">
          <div className="sticky top-0 z-50 flex justify-end p-3"><button type="button" onClick={() => setSectionPreviewOpen(false)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow" aria-label="Close preview"><X size={18} aria-hidden="true" />Close</button></div>
          {renderFootballPage(true)}
        </EventCanvas></EventSectionsReadOnly> : null}
      </dialog>
      </EventSectionBuilderProvider>
    );
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL SEASON MANAGEMENT - TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

import { config } from "@/components/event-templates/FootballSeasonTemplate";

const Page = createSimpleCustomizePage(config);
export default Page;
