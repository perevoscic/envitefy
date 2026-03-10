// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
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
import SimpleTemplateView from "@/components/SimpleTemplateView";
import { useMobileDrawer } from "@/hooks/useMobileDrawer";
import { buildEventPath } from "@/utils/event-url";
import TemplateSelector from "@/components/gym-meet-templates/TemplateSelector";
import {
  DEFAULT_GYM_MEET_TEMPLATE_ID,
  resolveGymMeetTemplateId,
} from "@/components/gym-meet-templates/registry";

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
  /** Optional: two-band swatch (left/right) for strict 2-color display */
  previewFrom?: string;
  previewTo?: string;
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
    nameLabel?: string;
    namePlaceholder?: string;
  };
  showCategoryField?: boolean;
  detailsDescriptionRows?: number;
  detailsDescriptionPopup?: boolean;
  defaultRsvpDeadlineDays?: number | null;
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
  { id: "small", label: "Small", className: "text-2xl md:text-3xl" },
  { id: "medium", label: "Medium", className: "text-3xl md:text-4xl" },
  { id: "large", label: "Large", className: "text-4xl md:text-5xl" },
];

const resolveFontSizeOption = (value: unknown) =>
  FONT_SIZE_OPTIONS.find((option) => option.id === value) || FONT_SIZE_OPTIONS[1];

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  mutedValue = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  mutedValue?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const toneClass = mutedValue
    ? "text-slate-500 focus:text-slate-900"
    : "text-slate-900";

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
          className={`${baseTextareaClass} ${toneClass}`}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          className={`${baseInputClass} ${toneClass}`}
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

/** Where each editor section appears on the generated public event page */
const SECTION_SHOWS_ON_EVENT: Record<string, string> = {
  headline: "Event header (title, date, time, venue)",
  details: "Meet Essentials card + description in Meet Details tab",
  design: "Theme & typography across the whole page",
  images: "Hero image and header area",
  roster: "Team Roster & Attendance section",
  meet: "Meet Details tab (warm-up, march-in, apparatus, judging, scores link)",
  practice: "Practice Planner section",
  logistics: "Logistics & Travel section",
  gear: "Gear & Uniform section",
  volunteers: "Volunteers & Carpool section",
  announcements: "Announcements section",
  rsvp: "Attendance / RSVP area",
  passcode: "Access gate for the whole page",
};

const MenuCard = ({
  title,
  desc,
  icon,
  status,
  onClick,
  showsOnEvent,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  status?: "not-started" | "in-progress" | "ready";
  onClick: () => void;
  /** Where this section appears on the generated event page */
  showsOnEvent?: string;
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
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                status === "ready"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "in-progress"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {status === "ready"
                ? "Ready"
                : status === "in-progress"
                ? "In progress"
                : "Not started"}
            </span>
          )}
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      {showsOnEvent && (
        <p className="text-[11px] text-slate-400 mt-1.5 italic">
          Shows on event: {showsOnEvent}
        </p>
      )}
    </div>
  </button>
);

const SectionToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
    <span className="font-medium text-slate-700 text-sm">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      ></span>
    </button>
  </div>
);

const buildMinimalValue = (value: any): any => {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, buildMinimalValue(inner)])
    );
  }
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return value;
  return value ?? null;
};

const buildMinimalAdvancedState = (
  sections: AdvancedSectionSpec[] | undefined
): Record<string, any> =>
  Object.fromEntries(
    (sections || []).map((section) => [
      section.id,
      buildMinimalValue(section.initialState),
    ])
  );

const buildSampleAdvancedState = (
  sections: AdvancedSectionSpec[] | undefined
): Record<string, any> =>
  Object.fromEntries(
    (sections || []).map((section) => [section.id, section.initialState])
  );

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const hasAnyText = (...values: unknown[]): boolean =>
  values.some((value) => asTrimmedString(value).length > 0);

const uniqueLines = (items: unknown[], limit = 16): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const line = asTrimmedString(item);
    if (!line) continue;
    const key = line.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= limit) break;
  }
  return out;
};

const normalizeHostGymName = (value: unknown): string => {
  const raw = asTrimmedString(value).replace(/\s+/g, " ");
  if (!raw) return "";
  const cleaned = raw
    .replace(/^[\-\u2022*]\s*/, "")
    .replace(/^host(?:ed)?\s*by[:\-\s]*/i, "")
    .replace(/^host\s*gym[:\-\s]*/i, "")
    .replace(/^home\s*gym[:\-\s]*/i, "")
    .replace(/^host[:\-\s]*/i, "")
    .replace(/[|•].*$/, "")
    .replace(
      /\b(meet director|registration|session|date|time|location|address|phone|email)\b.*$/i,
      ""
    )
    .trim();
  if (!cleaned || cleaned.length < 3) return "";
  if (/^(host|hosted by|gymnastics|meet|competition)$/i.test(cleaned)) return "";
  return cleaned;
};

const inferHostGymFromDiscovery = (
  discoverySource: Record<string, any> | null
): string => {
  if (!discoverySource || typeof discoverySource !== "object") return "";
  const parseResult = discoverySource?.parseResult || {};

  const directCandidates = [
    parseResult?.hostGym,
    parseResult?.athlete?.team,
    parseResult?.team,
  ];
  for (const candidate of directCandidates) {
    const normalized = normalizeHostGymName(candidate);
    if (normalized) return normalized;
  }

  const evidenceHostHints = Array.isArray(
    discoverySource?.evidence?.candidates?.hostGymHints
  )
    ? discoverySource.evidence.candidates.hostGymHints
    : [];
  const evidenceTitleHints = Array.isArray(
    discoverySource?.evidence?.candidates?.titleHints
  )
    ? discoverySource.evidence.candidates.titleHints
    : [];
  const evidenceFirstLines = Array.isArray(discoverySource?.evidence?.snippets?.firstLines)
    ? discoverySource.evidence.snippets.firstLines
    : [];

  const hostHintLine = [...evidenceHostHints, ...evidenceTitleHints, ...evidenceFirstLines].find(
    (line) => /(host(ed)? by|host gym|home gym)/i.test(asTrimmedString(line))
  );
  const normalizedHostHint = normalizeHostGymName(hostHintLine);
  if (normalizedHostHint) return normalizedHostHint;

  const gymNameLine = [...evidenceHostHints, ...evidenceTitleHints, ...evidenceFirstLines].find(
    (line) => {
      const text = asTrimmedString(line);
      if (!text) return false;
      if (!/(gymnastics|gym club|academy|gym\b)/i.test(text)) return false;
      return !/(session|schedule|championship|classic|invitational|meet|competition)/i.test(
        text
      );
    }
  );
  return normalizeHostGymName(gymNameLine);
};

const buildDiscoveryMeetDetailsDescription = (parseResult: any): string => {
  const parseMeetDetails = parseResult?.meetDetails || {};
  const lines = uniqueLines(
    [
      asTrimmedString(parseResult?.dates)
        ? `Meet dates: ${asTrimmedString(parseResult.dates)}`
        : "",
      asTrimmedString(parseMeetDetails?.doorsOpen)
        ? `Doors open: ${asTrimmedString(parseMeetDetails.doorsOpen)}`
        : "",
      asTrimmedString(parseMeetDetails?.arrivalGuidance)
        ? `Arrival guidance: ${asTrimmedString(parseMeetDetails.arrivalGuidance)}`
        : "",
      asTrimmedString(parseMeetDetails?.registrationInfo)
        ? `Registration: ${asTrimmedString(parseMeetDetails.registrationInfo)}`
        : "",
      asTrimmedString(parseMeetDetails?.facilityLayout)
        ? `Facility layout: ${asTrimmedString(parseMeetDetails.facilityLayout)}`
        : "",
      asTrimmedString(parseMeetDetails?.scoringInfo)
        ? `Scoring: ${asTrimmedString(parseMeetDetails.scoringInfo)}`
        : "",
      ...(Array.isArray(parseMeetDetails?.operationalNotes)
        ? parseMeetDetails.operationalNotes
        : []),
    ],
    16
  );
  return lines.join("\n");
};

const normalizeIsoDate = (value: unknown): string => {
  const text = asTrimmedString(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const monthToIndex = (value: string): number => {
  const normalized = asTrimmedString(value).toLowerCase();
  const map: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11,
  };
  return typeof map[normalized] === "number" ? map[normalized] : -1;
};

const toIsoDate = (year: number, monthIndex: number, day: number): string => {
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return "";
  }
  const y = Math.trunc(year);
  const m = Math.trunc(monthIndex);
  const d = Math.trunc(day);
  if (y < 1900 || y > 2200 || m < 0 || m > 11 || d < 1 || d > 31) return "";
  const dt = new Date(Date.UTC(y, m, d));
  if (Number.isNaN(dt.getTime())) return "";
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return "";
  return dt.toISOString().slice(0, 10);
};

const parseDiscoveryDateRange = (
  value: unknown
): { start: string; end: string; label: string } => {
  const label = asTrimmedString(value);
  if (!label) return { start: "", end: "", label: "" };

  const monthRange =
    label.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthRange) {
    const monthIdx = monthToIndex(monthRange[1]);
    const start = toIsoDate(
      Number.parseInt(monthRange[4], 10),
      monthIdx,
      Number.parseInt(monthRange[2], 10)
    );
    const end = toIsoDate(
      Number.parseInt(monthRange[4], 10),
      monthIdx,
      Number.parseInt(monthRange[3], 10)
    );
    return { start, end: end || start, label };
  }

  const monthSingle =
    label.match(
      /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2}),?\s*(\d{4})\b/i
    ) || null;
  if (monthSingle) {
    const monthIdx = monthToIndex(monthSingle[1]);
    const day = Number.parseInt(monthSingle[2], 10);
    const year = Number.parseInt(monthSingle[3], 10);
    const date = toIsoDate(year, monthIdx, day);
    return { start: date, end: date, label };
  }

  const slashRange =
    label.match(
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[–-]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\b/
    ) || null;
  if (slashRange) {
    const start = toIsoDate(
      Number.parseInt(slashRange[3], 10),
      Number.parseInt(slashRange[1], 10) - 1,
      Number.parseInt(slashRange[2], 10)
    );
    const end = toIsoDate(
      Number.parseInt(slashRange[6], 10),
      Number.parseInt(slashRange[4], 10) - 1,
      Number.parseInt(slashRange[5], 10)
    );
    return { start, end: end || start, label };
  }

  const slashSingle = label.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashSingle) {
    const date = toIsoDate(
      Number.parseInt(slashSingle[3], 10),
      Number.parseInt(slashSingle[1], 10) - 1,
      Number.parseInt(slashSingle[2], 10)
    );
    return { start: date, end: date, label };
  }

  return { start: "", end: "", label };
};

const isDateWithinRange = (value: string, start: string, end: string) => {
  const normalized = normalizeIsoDate(value);
  if (!normalized || !start) return false;
  const upper = end || start;
  return normalized >= start && normalized <= upper;
};

/** Stable layout for section editors so inputs (e.g. Details description) don't remount and lose focus on re-render. */
function GymnasticsEditorLayout({
  isEmbed,
  title,
  children,
  onBack,
  showBack = true,
}: {
  isEmbed: boolean;
  title: string;
  children: React.ReactNode;
  onBack: () => void;
  showBack?: boolean;
}) {
  return (
    <div className="animate-fade-in-right min-h-0" style={{ pointerEvents: "auto" }}>
      <div className="mb-6 pb-4 border-b border-slate-100 relative z-10" style={{ pointerEvents: "auto" }}>
        {!isEmbed && (
          <div className="flex items-center">
            <div className="mr-3 w-8">
              {showBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Customize
            </span>
          </div>
        )}
        <h2
          className={`text-lg font-serif font-bold text-slate-800 ${isEmbed && showBack ? "flex items-center gap-2" : "mt-2 text-center"}`}
        >
          {isEmbed && showBack ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer touch-manipulation"
                aria-label="Back to menu"
                style={{ pointerEvents: "auto" }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBack();
                }}
                className="flex-1 text-left hover:bg-slate-100 rounded px-2 py-2 -mx-1 transition-colors cursor-pointer touch-manipulation min-h-[44px] flex items-center"
                aria-label="Back to edit meet options"
                style={{ pointerEvents: "auto" }}
              >
                {title}
              </button>
            </>
          ) : (
            title
          )}
        </h2>
      </div>
      {children}
    </div>
  );
}

function createSimpleCustomizePage(config: SimpleTemplateConfig) {
  return function SimpleCustomizePage() {
    const search = useSearchParams();
    const router = useRouter();
    const editEventId = search?.get("edit") ?? undefined;
    const isEmbed = search?.get("embed") === "1";
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

    const sampleAdvancedState = useMemo(
      () => buildSampleAdvancedState(config.advancedSections),
      [config.advancedSections]
    );

    const [data, setData] = useState(() => ({
      title: "",
      date: initialDate,
      time: "14:00",
      timezone:
        typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "America/Chicago",
      hostGym: "",
      city: "",
      state: "",
      address: "",
      venue: "",
      details: "",
      hero: "",
      rsvpEnabled: false,
      rsvpDeadline:
        typeof config.defaultRsvpDeadlineDays === "number"
          ? (() => {
              const d = new Date();
              d.setDate(d.getDate() + config.defaultRsvpDeadlineDays!);
              return d.toISOString().split("T")[0];
            })()
          : "",
      pageTemplateId: editEventId ? undefined : DEFAULT_GYM_MEET_TEMPLATE_ID,
      fontId: (config as any)?.prefill?.fontId || GYM_FONTS[0]?.id || "inter",
      fontSize: (config as any)?.prefill?.fontSize || "medium",
      passcodeRequired: false,
      passcode: "",
      passcodeHint: "",
      simpleDesignTokens: null as any,
      extra: Object.fromEntries(
        config.detailFields.map((f) => [f.key, ""])
      ),
    }));
    const [advancedState, setAdvancedState] = useState(() =>
      buildMinimalAdvancedState(config.advancedSections)
    );
    const [themeId, setThemeId] = useState(
      config.themes[0]?.id ?? "default-theme"
    );
    const [activeView, setActiveView] = useState<string>("main");
    const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
    const [rsvpAttending, setRsvpAttending] = useState("yes");
    const [dismissedSuggestedExtraFields, setDismissedSuggestedExtraFields] =
      useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const [discoverFile, setDiscoverFile] = useState<File | null>(null);
    const [discoverBusy, setDiscoverBusy] = useState(false);
    const [discoverError, setDiscoverError] = useState("");
    const [loadingExisting, setLoadingExisting] = useState(() =>
      Boolean(search?.get("edit"))
    );
    const [loadedDiscoverySource, setLoadedDiscoverySource] = useState<
      Record<string, any> | null
    >(null);
    const [isDiscoveryEdit, setIsDiscoveryEdit] = useState(false);
    const [isInIframe, setIsInIframe] = useState(false);
    const [loadVersion, setLoadVersion] = useState(0);
    const repairAttemptedRef = useRef(false);
    useEffect(() => {
      if (typeof window !== "undefined") {
        setIsInIframe(window.self !== window.top);
      }
    }, []);

    useEffect(() => {
      setDismissedSuggestedExtraFields({});
    }, [editEventId]);

    useEffect(() => {
      repairAttemptedRef.current = false;
    }, [editEventId]);

    useEffect(() => {
      if (!isEmbed || typeof document === "undefined") return;
      const html = document.documentElement;
      const body = document.body;
      html.classList.add("embedded-editor");
      body.classList.add("embedded-editor");
      return () => {
        html.classList.remove("embedded-editor");
        body.classList.remove("embedded-editor");
      };
    }, [isEmbed]);

    // When embedded next to the live event page, broadcast template previews to parent
    useEffect(() => {
      if (!isEmbed || !editEventId) return;
      if (loadingExisting) return;
      const resolvedPreviewTemplateId = resolveGymMeetTemplateId(data);
      if (!resolvedPreviewTemplateId) return;
      if (typeof window === "undefined") return;
      try {
        window.parent?.postMessage(
          {
            type: "envitefy:discovery-theme-preview",
            eventId: editEventId,
            pageTemplateId: resolvedPreviewTemplateId,
          },
          "*"
        );
      } catch {
        // ignore cross-origin errors in preview mode
      }
    }, [data, editEventId, isEmbed, loadingExisting]);
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
    const selectedSize = resolveFontSizeOption(data.fontSize);

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
    const headingFontStyle = {
      fontFamily: selectedFont?.css,
      ...(headingShadow || {}),
      ...(titleColor || {}),
    };
    const headingSizeClass =
      selectedSize?.className || FONT_SIZE_OPTIONS[1].className;

    const locationParts = data.venue || "";
    const addressLine = data.address || "";

    const hasRoster =
      advancedState?.roster?.enabled !== false &&
      (advancedState?.roster?.athletes?.length ?? 0) > 0;
    const hasMeet = Boolean(
      advancedState?.meet?.sessionNumber ||
        advancedState?.meet?.warmUpTime ||
        advancedState?.meet?.marchInTime ||
        advancedState?.meet?.startApparatus ||
        advancedState?.meet?.judgingNotes ||
        advancedState?.meet?.scoresLink
    );
    const hasPractice =
      advancedState?.practice?.enabled !== false &&
      (advancedState?.practice?.blocks?.length ?? 0) > 0;
    const hasLogistics =
      advancedState?.logistics?.enabled !== false &&
      ((advancedState?.logistics?.showTransportation !== false &&
        Boolean(
          advancedState?.logistics?.travelMode ||
            advancedState?.logistics?.callTime ||
            advancedState?.logistics?.pickupWindow
        )) ||
        (advancedState?.logistics?.showAccommodations !== false &&
          Boolean(
            advancedState?.logistics?.hotelName ||
              advancedState?.logistics?.hotelAddress ||
              advancedState?.logistics?.hotelCheckIn
          )) ||
        (advancedState?.logistics?.showFees !== false &&
          Boolean(
            advancedState?.logistics?.feeAmount ||
              advancedState?.logistics?.feeDueDate
          )) ||
        (advancedState?.logistics?.showMeals !== false &&
          Boolean(advancedState?.logistics?.mealPlan)) ||
        (advancedState?.logistics?.showAdditionalDocuments !== false &&
          Boolean(advancedState?.logistics?.additionalDocuments?.length)));
    const hasGear = (advancedState?.gear?.items?.length ?? 0) > 0;
    const hasVolunteers =
      advancedState?.volunteers?.enabled !== false &&
      ((advancedState?.volunteers?.showVolunteerSlots !== false &&
        (advancedState?.volunteers?.volunteerSlots?.length ??
          advancedState?.volunteers?.slots?.length ??
          0) > 0) ||
        (advancedState?.volunteers?.showCarpool !== false &&
          (advancedState?.volunteers?.carpoolOffers?.length ??
            advancedState?.volunteers?.carpools?.length ??
            0) > 0));
    const hasAnnouncements =
      (advancedState?.announcements?.items?.length ?? 0) > 0;
    const hasAnnouncementEntries =
      hasAnnouncements ||
      (advancedState?.announcements?.announcements?.length ?? 0) > 0;
    const parseResult = loadedDiscoverySource?.parseResult || {};
    const parseCommunications = parseResult?.communications || {};
    const parseAthlete = parseResult?.athlete || {};
    const parseMeetDetails = parseResult?.meetDetails || {};
    const parseLogistics = parseResult?.logistics || {};
    const parseGear = parseResult?.gear || {};
    const parseVolunteers = parseResult?.volunteers || {};
    const parseHasRoster = hasAnyText(
      parseAthlete?.name,
      parseAthlete?.level,
      parseAthlete?.team,
      parseAthlete?.session
    );
    const parseHasMeet = hasAnyText(
      parseMeetDetails?.warmup,
      parseMeetDetails?.marchIn,
      parseMeetDetails?.rotationOrder,
      parseMeetDetails?.judgingNotes,
      parseAthlete?.stretchTime,
      parseAthlete?.marchIn,
      parseAthlete?.session
    );
    const parseHasLogistics = hasAnyText(
      parseLogistics?.parking,
      parseLogistics?.trafficAlerts,
      parseLogistics?.hotel,
      parseLogistics?.meals,
      parseLogistics?.fees,
      parseLogistics?.waivers
    );
    const parseHasGear =
      hasAnyText(parseGear?.uniform) ||
      (Array.isArray(parseGear?.checklist) && parseGear.checklist.length > 0);
    const parseHasVolunteers = hasAnyText(
      parseVolunteers?.signupLink,
      parseVolunteers?.notes
    );
    const parseHasAnnouncements =
      Array.isArray(parseCommunications?.announcements) &&
      parseCommunications.announcements.length > 0;
    const parseHasGymLayoutImage = hasAnyText(
      loadedDiscoverySource?.extractionMeta?.gymLayoutImageDataUrl
    );
    const parseHasGymLayoutFacts =
      Array.isArray(loadedDiscoverySource?.extractionMeta?.gymLayoutFacts) &&
      loadedDiscoverySource.extractionMeta.gymLayoutFacts.length > 0;
    const hasDiscoveryParsePayload = Boolean(
      loadedDiscoverySource?.input || loadedDiscoverySource?.parseResult
    );
    const useParseDrivenSections = Boolean(
      editEventId && (isDiscoveryEdit || hasDiscoveryParsePayload)
    );
    const syncedMeetDetailsDescription = useMemo(
      () =>
        useParseDrivenSections
          ? buildDiscoveryMeetDetailsDescription(parseResult)
          : "",
      [parseResult, useParseDrivenSections]
    );
    const visibleAdvancedSections = useMemo(() => {
      const allSections = config.advancedSections || [];
      if (!useParseDrivenSections) return allSections;
      return allSections.filter((section) => {
        switch (section.id) {
          case "roster":
            return hasRoster || parseHasRoster;
          case "meet":
            return hasMeet || parseHasMeet;
          case "practice":
            return hasPractice;
          case "logistics":
            return (
              hasLogistics ||
              parseHasLogistics ||
              parseHasGymLayoutImage ||
              parseHasGymLayoutFacts
            );
          case "gear":
            return hasGear || parseHasGear;
          case "volunteers":
            return hasVolunteers || parseHasVolunteers;
          case "announcements":
            return hasAnnouncementEntries || parseHasAnnouncements;
          default:
            return true;
        }
      });
    }, [
      config.advancedSections,
      hasAnnouncementEntries,
      hasGear,
      hasLogistics,
      hasMeet,
      hasPractice,
      hasRoster,
      hasVolunteers,
      parseHasAnnouncements,
      parseHasGear,
      parseHasGymLayoutImage,
      parseHasGymLayoutFacts,
      parseHasLogistics,
      parseHasMeet,
      parseHasRoster,
      parseHasVolunteers,
      useParseDrivenSections,
    ]);
    const visibleAdvancedSectionIds = useMemo(
      () => new Set(visibleAdvancedSections.map((section) => section.id)),
      [visibleAdvancedSections]
    );

    const headlineStatus: "not-started" | "in-progress" | "ready" = (() => {
      const filled = [
        Boolean(data.title?.trim()),
        Boolean(data.date || data.time),
        Boolean(data.timezone?.trim()),
        Boolean(data.time),
        Boolean(data.venue?.trim() || data.address?.trim()),
      ].filter(Boolean).length;
      if (filled === 0) return "not-started";
      return filled >= 5 ? "ready" : "in-progress";
    })();

    const detailsStatus: "not-started" | "in-progress" | "ready" = (() => {
      const base = Boolean(data.details?.trim());
      const extrasFilled = Object.values(data.extra || {}).filter((value) =>
        String(value || "").trim()
      ).length;
      if (!base && extrasFilled === 0) return "not-started";
      if (base && extrasFilled >= 2) return "ready";
      return "in-progress";
    })();

    const advancedStatus = (enabled: boolean): "not-started" | "ready" =>
      enabled ? "ready" : "not-started";
    const passcodeStatus: "not-started" | "in-progress" | "ready" = (() => {
      if (!data.passcodeRequired) return "not-started";
      if (!data.passcode?.trim()) return "in-progress";
      return data.passcode.trim().length >= 4 ? "ready" : "in-progress";
    })();
    const rsvpStatus: "not-started" | "ready" = data.rsvpEnabled
      ? "ready"
      : "not-started";

    const missingEssentials = [
      !data.title?.trim() ? "Event title" : null,
      !data.date ? "Date" : null,
      !data.time ? "Start time in Event Basics" : null,
      !data.timezone?.trim() ? "Timezone" : null,
      !data.venue?.trim() && !data.address?.trim()
        ? "Venue or address"
        : null,
      !(data.details || "").trim() ? "Description" : null,
    ].filter(Boolean) as string[];
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
            enabled: hasAnnouncementEntries,
          },
          { id: "rsvp", label: "RSVP", enabled: data.rsvpEnabled },
          { id: "passcode", label: "Passcode", enabled: true },
        ].filter((item) => item.enabled),
      [
        hasAnnouncementEntries,
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

    useEffect(() => {
      if (activeView === "main") return;
      const staticViews = new Set([
        "headline",
        "images",
        "design",
        "details",
        "discover",
        "rsvp",
        "passcode",
      ]);
      if (staticViews.has(activeView)) return;
      if (!visibleAdvancedSectionIds.has(activeView)) {
        setActiveView("main");
      }
    }, [activeView, visibleAdvancedSectionIds]);

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
          const existingCreatedVia = asTrimmedString(existing?.createdVia)
            .toLowerCase()
            .trim();
          const existingDiscoverySource =
            existing?.discoverySource &&
            typeof existing.discoverySource === "object"
              ? (existing.discoverySource as Record<string, any>)
              : null;
          const inferredHostGym = inferHostGymFromDiscovery(existingDiscoverySource);
          setLoadedDiscoverySource(existingDiscoverySource);
          setIsDiscoveryEdit(
            existingCreatedVia === "meet-discovery" ||
              Boolean(existingDiscoverySource?.input)
          );

          console.log("[Edit] Loaded event data:", {
            title: json?.title,
            pageTemplateId: existing.pageTemplateId,
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
          if (typeof startIso === "string") {
            const isoMatch = startIso.match(
              /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/
            );
            if (isoMatch) {
              loadedDate = isoMatch[1];
              loadedTime = isoMatch[2];
            } else {
              const d = new Date(startIso);
              if (!Number.isNaN(d.getTime())) {
                loadedDate = d.toISOString().split("T")[0];
                loadedTime = d.toISOString().slice(11, 16);
              }
            }
          }
          const parseDatesLabel =
            existingDiscoverySource?.parseResult?.dates ||
            existing?.customFields?.meetDateRangeLabel;
          const parsedRange = parseDiscoveryDateRange(parseDatesLabel);
          const existingDateCandidate = normalizeIsoDate(
            existing.date || loadedDate
          );
          const resolvedDate =
            parsedRange.start &&
            (!existingDateCandidate ||
              !isDateWithinRange(
                existingDateCandidate,
                parsedRange.start,
                parsedRange.end
              ))
              ? parsedRange.start
              : existingDateCandidate || "";
          const isExistingDiscoveryEvent =
            existingCreatedVia === "meet-discovery" ||
            Boolean(existingDiscoverySource?.input);
          const resolvedTime =
            asTrimmedString(existing.time) || asTrimmedString(loadedTime);

          // Load all data fields, prioritizing existing values
          const accessControl = existing.accessControl || {};
          const hasPasscode = Boolean(
            accessControl?.passcodeHash || accessControl?.requirePasscode
          );

          setData((prev) => ({
            ...prev,
            title: json?.title || existing.title || prev.title,
            date: resolvedDate || (isExistingDiscoveryEvent ? "" : prev.date),
            time: resolvedTime || (isExistingDiscoveryEvent ? "" : prev.time),
            timezone: existing.timezone || prev.timezone,
            hostGym:
              existing.hostGym ||
              existing.team ||
              existing.customFields?.team ||
              inferredHostGym ||
              prev.hostGym,
            city: existing.city || prev.city,
            state: existing.state || prev.state,
            address: existing.address || prev.address,
            venue: existing.venue || existing.location || prev.venue,
            details: existing.details || existing.description || prev.details,
            hero: existing.heroImage || existing.hero || prev.hero,
            pageTemplateId: resolveGymMeetTemplateId(existing),
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
            passcodeHint:
              typeof accessControl?.passcodeHint === "string"
                ? accessControl.passcodeHint
                : "",
            simpleDesignTokens:
              existing.designTokens ||
              existing.customFields?.designTokens ||
              prev.simpleDesignTokens ||
              null,
            extra: {
              ...prev.extra,
              ...(existing.extra || {}),
              ...(existing.customFields || {}),
              team:
                existing.team ||
                existing.customFields?.team ||
                inferredHostGym ||
                prev.extra?.team ||
                "",
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
    }, [editEventId, loadVersion]);

    useEffect(() => {
      if (!editEventId || !isDiscoveryEdit || loadingExisting) return;
      if (repairAttemptedRef.current) return;
      if (!loadedDiscoverySource?.input) return;

      const parseResult = loadedDiscoverySource?.parseResult || {};
      const parseMeetDetails = parseResult?.meetDetails || {};
      const parsedRange = parseDiscoveryDateRange(parseResult?.dates);
      const normalizedDataDate = normalizeIsoDate(data.date);
      const dateMismatch =
        Boolean(parsedRange.start) &&
        Boolean(normalizedDataDate) &&
        !isDateWithinRange(normalizedDataDate, parsedRange.start, parsedRange.end);
      const missingDateWithKnownRange =
        Boolean(parsedRange.start) && !normalizedDataDate;

      const extractionMeta = loadedDiscoverySource?.extractionMeta || {};
      const parseHasMeetCore =
        hasAnyText(
          parseMeetDetails?.doorsOpen,
          parseMeetDetails?.arrivalGuidance,
          parseMeetDetails?.registrationInfo,
          parseMeetDetails?.facilityLayout,
          parseMeetDetails?.scoringInfo
        ) ||
        (Array.isArray(parseMeetDetails?.operationalNotes) &&
          parseMeetDetails.operationalNotes.length > 0);

      const mappedOperationalNotes = Array.isArray(advancedState?.meet?.operationalNotes)
        ? advancedState.meet.operationalNotes
        : [];
      const hasMappedMeetCore =
        hasAnyText(
          advancedState?.meet?.doorsOpen,
          advancedState?.meet?.arrivalGuidance,
          advancedState?.meet?.registrationInfo,
          advancedState?.meet?.facilityLayout,
          advancedState?.meet?.scoringInfo
        ) || mappedOperationalNotes.length > 0;

      const hasLayoutEvidence =
        hasAnyText(extractionMeta?.gymLayoutImageDataUrl) ||
        (Array.isArray(extractionMeta?.gymLayoutFacts) &&
          extractionMeta.gymLayoutFacts.length > 0);
      const hasMappedLayoutEvidence =
        hasAnyText(advancedState?.logistics?.gymLayoutImage) ||
        mappedOperationalNotes.some((line: string) =>
          /(hall|registration|awards area|competition area|guest services|gym\s*[a-f]|coffee bar)/i.test(
            asTrimmedString(line)
          )
        );

      const needsRepair =
        dateMismatch ||
        missingDateWithKnownRange ||
        (parseHasMeetCore && !hasMappedMeetCore) ||
        (hasLayoutEvidence && !hasMappedLayoutEvidence);

      if (!needsRepair) return;

      repairAttemptedRef.current = true;
      let cancelled = false;
      (async () => {
        try {
          const repairRes = await fetch(`/api/parse/${editEventId}?repair=1`, {
            method: "POST",
            credentials: "include",
          });
          if (!repairRes.ok) {
            const repairJson = await repairRes.json().catch(() => ({}));
            throw new Error(repairJson?.error || "Failed discovery repair parse");
          }
          if (!cancelled) {
            setLoadVersion((prev) => prev + 1);
          }
        } catch (err) {
          console.error("[Edit] Discovery repair parse failed", err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [
      advancedState?.logistics?.gymLayoutImage,
      advancedState?.meet?.arrivalGuidance,
      advancedState?.meet?.doorsOpen,
      advancedState?.meet?.facilityLayout,
      advancedState?.meet?.operationalNotes,
      advancedState?.meet?.registrationInfo,
      advancedState?.meet?.scoringInfo,
      data.date,
      editEventId,
      isDiscoveryEdit,
      loadedDiscoverySource,
      loadingExisting,
    ]);

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
      if (!useParseDrivenSections) return;
      if (!syncedMeetDetailsDescription) return;
      setData((prev) =>
        prev.details === syncedMeetDetailsDescription
          ? prev
          : { ...prev, details: syncedMeetDetailsDescription }
      );
    }, [syncedMeetDetailsDescription, useParseDrivenSections]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setData((prev) => ({ ...prev, hero: url }));
      }
    };

    const updateExtra = useCallback((key: string, value: string) => {
      setDismissedSuggestedExtraFields((prev) =>
        prev[key] ? prev : { ...prev, [key]: true }
      );
      setData((prev) => ({
        ...prev,
        extra: { ...prev.extra, [key]: value },
      }));
    }, []);

    const handleTemplateSelection = useCallback(
      async (pageTemplateId: string) => {
        setData((prev) => ({ ...prev, pageTemplateId }));
        if (!editEventId) return;

        try {
          const res = await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              data: { pageTemplateId },
            }),
          });
          if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            throw new Error(errorText || "Failed to save template selection");
          }
        } catch (err) {
          console.error("[Design] Failed to persist meet page template", {
            editEventId,
            pageTemplateId,
            err,
          });
        }
      },
      [editEventId]
    );

    const handlePublish = useCallback(async () => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const {
          advancedSections: _ignoredAdvancedSections,
          designTokens: _ignoredDesignTokens,
          ...extraFieldsForSave
        } = (data.extra || {}) as Record<string, any>;
        let startISO: string | null = null;
        let endISO: string | null = null;
        if (data.date && data.time) {
          const start = new Date(`${data.date}T${data.time || "14:00"}:00`);
          const end = new Date(start);
          end.setHours(end.getHours() + 2);
          startISO = start.toISOString();
          endISO = end.toISOString();
        }

        // Convert blob URLs to data URLs for saving
        let heroToSave = "";
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
                  resolve(result || "");
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (err) {
              console.error("Failed to convert blob URL:", err);
              heroToSave = "";
            }
          } else if (/^data:/i.test(data.hero)) {
            // Already a data URL, use as-is
            heroToSave = data.hero;
          } else {
            // Regular URL (http/https), use as-is
            heroToSave = data.hero;
          }
        }

        const resolvedPageTemplateId =
          data.pageTemplateId ||
          resolveGymMeetTemplateId(data) ||
          DEFAULT_GYM_MEET_TEMPLATE_ID;

        console.log("[Publish] Saving meet page template:", {
          pageTemplateId: resolvedPageTemplateId,
          editEventId,
        });

        const isDiscoveryUpdate = Boolean(
          editEventId && (isDiscoveryEdit || loadedDiscoverySource)
        );
        const payload: any = {
          title: data.title || config.displayName,
          data: {
            category: config.category,
            createdVia: isDiscoveryUpdate ? "meet-discovery" : "simple-template",
            createdManually: isDiscoveryUpdate ? false : true,
            ...(loadedDiscoverySource && {
              discoverySource: {
                ...loadedDiscoverySource,
                updatedAt: new Date().toISOString(),
              },
            }),
            startISO,
            endISO,
            location: locationParts || undefined,
            address: data.address || undefined,
            venue: data.venue || undefined,
            timezone: data.timezone || undefined,
            hostGym: data.hostGym || undefined,
            city: data.city || undefined,
            state: data.state || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
            rsvpEnabled: data.rsvpEnabled,
            rsvpDeadline: data.rsvpDeadline || undefined,
            numberOfGuests: 0,
            templateId: config.slug,
            pageTemplateId: resolvedPageTemplateId,
            fontSize: selectedSize.id,
            fontSizeClass: selectedSize.className,
            templateConfig: {
              displayName: config.displayName,
              categoryLabel: config.categoryLabel || config.displayName,
              detailFields: config.detailFields,
              rsvpCopy: config.rsvpCopy,
            },
            customFields: {
              ...extraFieldsForSave,
              team: extraFieldsForSave?.team || "",
              advancedSections: advancedState,
            },
            advancedSections: advancedState,
            heroImage: heroToSave,
            time: data.time,
            date: data.date,
            ...(data.passcodeRequired && data.passcode
              ? {
                  accessControl: {
                    mode: "access-code",
                    passcodePlain: data.passcode,
                    passcodeHint: data.passcodeHint || undefined,
                    requirePasscode: true,
                  },
                }
              : data.passcodeRequired === false
              ? {
                  accessControl: {
                    mode: "public",
                    passcodeHint: "",
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
            pageTemplateId: payload.data.pageTemplateId,
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
            pageTemplateId: result?.data?.pageTemplateId,
          });

          const redirectUrl = buildEventPath(editEventId, payload.title, {
            updated: true,
            t: Date.now(),
          });

          // When embedded in event page iframe, tell parent to exit edit mode and navigate.
          if (typeof window !== "undefined" && (window as any).parent !== window) {
            try {
              (window as any).parent.postMessage(
                {
                  type: "envitefy:discovery-edit-saved",
                  eventId: editEventId,
                  redirectUrl,
                },
                window.location.origin
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
      data.timezone,
      data.hostGym,
      data.city,
      data.state,
      data.hero,
      data.pageTemplateId,
      data.fontId,
      data.fontSize,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      data.passcodeRequired,
      data.passcode,
      data.passcodeHint,
      data.simpleDesignTokens,
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
      selectedSize,
      editEventId,
      isDiscoveryEdit,
      loadedDiscoverySource,
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
      nameLabel: config.rsvpCopy?.nameLabel || "Full Name",
      namePlaceholder: config.rsvpCopy?.namePlaceholder || "Guest Name",
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
            {useParseDrivenSections ? "Edit your meet" : "Build Your Meet Page"}
          </h2>
          <p className="text-slate-500 text-sm">
            {useParseDrivenSections
              ? "Update details and sections from your uploaded source."
              : "Complete the essentials first, then add operations and parent communications."}
          </p>
        </div>

        {!useParseDrivenSections && (
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Starter Mode
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveView("discover")}
                className="w-full rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                Upload & Prefill
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Recommended
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetToBlank}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
                >
                  Start Blank
                </button>
                <button
                  type="button"
                  onClick={applySampleData}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  Load Sample Meet
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Essentials
          </p>
          <MenuCard
            title="Event Basics"
            desc="Title, date, time, venue, session & team level."
            icon={<Type size={18} />}
            status={headlineStatus}
            onClick={() => setActiveView("headline")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.headline}
          />
          <MenuCard
            title="Details"
            desc="Description, coaches, and season context."
            icon={<Edit2 size={18} />}
            status={detailsStatus}
            onClick={() => setActiveView("details")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.details}
          />
          <MenuCard
            title="Design"
            desc="Choose a page template."
            icon={<Palette size={18} />}
            status={data.pageTemplateId ? "ready" : "not-started"}
            onClick={() => setActiveView("design")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.design}
          />
          <MenuCard
            title="Images"
            desc="Hero and header photo."
            icon={<ImageIcon size={18} />}
            status={data.hero ? "ready" : "not-started"}
            onClick={() => setActiveView("images")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.images}
          />

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
            Operations
          </p>
          {visibleAdvancedSections
            ?.filter((section) => section.id !== "announcements")
            .map((section) => {
              const sectionEnabled = (() => {
                switch (section.id) {
                  case "roster":
                    return hasRoster;
                  case "meet":
                    return hasMeet;
                  case "practice":
                    return hasPractice;
                  case "logistics":
                    return hasLogistics;
                  case "gear":
                    return hasGear;
                  case "volunteers":
                    return hasVolunteers;
                  default:
                    return Boolean(advancedState?.[section.id]);
                }
              })();
              return (
                <MenuCard
                  key={section.id}
                  title={section.menuTitle}
                  desc={section.menuDesc}
                  icon={<Edit2 size={18} />}
                  status={advancedStatus(sectionEnabled)}
                  onClick={() => setActiveView(section.id)}
                  showsOnEvent={SECTION_SHOWS_ON_EVENT[section.id]}
                />
              );
            })}

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
            Communication
          </p>
          <MenuCard
            title={rsvpCopy.menuTitle}
            desc={rsvpCopy.menuDesc}
            icon={<CheckSquare size={18} />}
            status={rsvpStatus}
            onClick={() => setActiveView("rsvp")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.rsvp}
          />
          <MenuCard
            title="Passcode"
            desc="Protect this page with an access code."
            icon={<LinkIcon size={18} />}
            status={passcodeStatus}
            onClick={() => setActiveView("passcode")}
            showsOnEvent={SECTION_SHOWS_ON_EVENT.passcode}
          />
          {visibleAdvancedSections
            ?.filter((section) => section.id === "announcements")
            .map((section) => (
              <MenuCard
                key={section.id}
                title={section.menuTitle}
                desc={section.menuDesc}
                icon={<Edit2 size={18} />}
                status={advancedStatus(hasAnnouncementEntries)}
                onClick={() => setActiveView(section.id)}
                showsOnEvent={SECTION_SHOWS_ON_EVENT.announcements}
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

    const handleDesignTokensChange = useCallback((tokens: any) => {
      setData((prev) => {
        const prevTokens = prev.simpleDesignTokens;
        if (
          prevTokens &&
          tokens &&
          JSON.stringify(prevTokens) === JSON.stringify(tokens)
        ) {
          return prev;
        }
        return { ...prev, simpleDesignTokens: tokens };
      });
    }, []);

    const handleBackToMain = useCallback(() => {
      setActiveView("main");
    }, []);

    const applySampleData = useCallback(() => {
      setData((prev) => ({
        ...prev,
        title: config.prefill?.title ?? `${config.displayName}`,
        pageTemplateId: prev.pageTemplateId || DEFAULT_GYM_MEET_TEMPLATE_ID,
        hostGym: config.prefill?.extra?.team || prev.hostGym,
        city: config.prefill?.city || prev.city,
        state: config.prefill?.state || prev.state,
        address: config.prefill?.address || prev.address,
        venue: config.prefill?.venue || prev.venue,
        details: config.prefill?.details || prev.details,
        hero: config.prefill?.hero || prev.hero,
        extra: Object.fromEntries(
          config.detailFields.map((f) => [
            f.key,
            config.prefill?.extra?.[f.key] ?? "",
          ])
        ),
      }));
      setAdvancedState(sampleAdvancedState);
    }, [
      config.detailFields,
      config.displayName,
      config.prefill?.address,
      config.prefill?.city,
      config.prefill?.details,
      config.prefill?.extra,
      config.prefill?.hero,
      config.prefill?.state,
      config.prefill?.title,
      config.prefill?.venue,
      sampleAdvancedState,
    ]);

    const resetToBlank = useCallback(() => {
      setData((prev) => ({
        ...prev,
        title: "",
        pageTemplateId: DEFAULT_GYM_MEET_TEMPLATE_ID,
        hostGym: "",
        city: "",
        state: "",
        address: "",
        venue: "",
        details: "",
        hero: "",
        extra: Object.fromEntries(config.detailFields.map((f) => [f.key, ""])),
      }));
      setAdvancedState(buildMinimalAdvancedState(config.advancedSections));
    }, [config.advancedSections, config.detailFields]);

    const renderHeadlineEditor = useMemo(
      () => (
        <GymnasticsEditorLayout isEmbed={isEmbed} title="Event Basics" onBack={handleBackToMain} showBack>
          <div className="space-y-6">
            <InputGroup
              label="Event Title"
              value={data.title}
              onChange={(v) => updateData("title", v)}
              placeholder="Level 6 Invitational - Session 2"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                label="Session"
                value={advancedState?.meet?.sessionNumber || ""}
                onChange={(v) =>
                  setAdvancedState((prev: Record<string, any>) => ({
                    ...prev,
                    meet: {
                      ...(prev?.meet || {}),
                      sessionNumber: v,
                    },
                  }))
                }
                placeholder="e.g. Session 2 - Level 5-7"
              />
              <InputGroup
                label="Team Level"
                value={advancedState?.roster?.athletes?.[0]?.level || ""}
                onChange={(v) =>
                  setAdvancedState((prev: Record<string, any>) => {
                    const roster = prev?.roster || {};
                    const athletes = Array.isArray(roster.athletes)
                      ? [...roster.athletes]
                      : [];
                    if (athletes.length === 0) {
                      athletes.push({
                        id: "athlete-1",
                        name: "",
                        level: v,
                        primaryEvents: [],
                        parentName: "",
                        parentPhone: "",
                        parentEmail: "",
                        medicalNotes: "",
                        status: "pending",
                        team: "",
                        session: "",
                      });
                    } else {
                      athletes[0] = { ...(athletes[0] || {}), level: v };
                    }
                    return {
                      ...prev,
                      roster: {
                        ...roster,
                        athletes,
                      },
                    };
                  })
                }
                placeholder="e.g. Level 4"
              />
            </div>

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
              label="Display Date"
              value={data.extra?.meetDateRangeLabel || ""}
              onChange={(v) => updateExtra("meetDateRangeLabel", v)}
              placeholder="e.g. March 6-8, 2026"
            />
            <p className="text-xs text-slate-500 -mt-2">
              Set the exact event start above. For multi-day meets, use Display
              Date to show a range (e.g. March 6-8, 2026) in the header. Leave
              blank to use the single date. Session timing:{" "}
              <strong>Operations → Meet Details</strong>.
            </p>
            <InputGroup
              label="Timezone"
              value={data.timezone || ""}
              onChange={(v) => updateData("timezone", v)}
              placeholder="America/Chicago"
            />
            <InputGroup
              label="Host Gym"
              value={data.hostGym || ""}
              onChange={(v) => updateData("hostGym", v)}
              placeholder="Northern Illinois Gymnastics"
            />
            <InputGroup
              label="Venue"
              value={data.venue}
              onChange={(v) => updateData("venue", v)}
              placeholder="Arena or gym name"
            />
            <InputGroup
              label="Address"
              value={data.address}
              onChange={(v) => updateData("address", v)}
              placeholder="Street address"
            />
          </div>
        </GymnasticsEditorLayout>
      ),
      [
        data.title,
        data.date,
        data.time,
        data.extra?.meetDateRangeLabel,
        data.timezone,
        data.hostGym,
        advancedState?.meet?.sessionNumber,
        advancedState?.roster?.athletes?.[0]?.level,
        data.venue,
        data.address,
        data.city,
        data.state,
        handleBackToMain,
        updateExtra,
        config.displayName,
      ]
    );

    const renderImagesEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
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
      </GymnasticsEditorLayout>
    );

    const renderDesignEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
        title="Design"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-4">
          <TemplateSelector
            value={resolveGymMeetTemplateId(data)}
            onChange={handleTemplateSelection}
          />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Title Size
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Controls the event title in preview and on the live meet page.
                </p>
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
      </GymnasticsEditorLayout>
    );

    const renderDetailsEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
        title="Details"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
              Assigned Gym (Manual)
            </label>
            <select
              className={baseInputClass}
              value={advancedState?.meet?.assignedGym || ""}
              onChange={(e) =>
                setAdvancedState((prev: Record<string, any>) => ({
                  ...prev,
                  meet: {
                    ...(prev?.meet || {}),
                    assignedGym: e.target.value,
                  },
                }))
              }
            >
              <option value="">Not selected</option>
              <option value="Gym A">Gym A</option>
              <option value="Gym B">Gym B</option>
              <option value="Gym C">Gym C</option>
              <option value="Gym D">Gym D</option>
              <option value="Gym E">Gym E</option>
              <option value="Gym F">Gym F</option>
              <option value="Gym 1">Gym 1</option>
              <option value="Gym 2">Gym 2</option>
              <option value="Gym 3">Gym 3</option>
              <option value="Gym 4">Gym 4</option>
              <option value="Gym 5">Gym 5</option>
              <option value="Gym 6">Gym 6</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Choose the gym manually. We no longer auto-assign gym letters/numbers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
              Description
            </label>
            <textarea
              className={`w-full p-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow ${
                config.detailsDescriptionPopup
                  ? "min-h-[160px]"
                  : "min-h-[130px]"
              }`}
              rows={config.detailsDescriptionRows || 6}
              value={data.details}
              onChange={(e) => updateData("details", e.target.value)}
              readOnly={useParseDrivenSections}
              placeholder="Session notes, arrival instructions, spectator info, and what athletes should prepare."
            />
            <p className="mt-1 text-xs text-slate-400">
              {useParseDrivenSections
                ? "Auto-synced from Meet Details."
                : "Tip: press Shift+Enter for line breaks."}
            </p>
          </div>

          {config.showCategoryField !== false && (
            <InputGroup
              label="Category"
              value={config.categoryLabel || config.displayName}
              onChange={() => {}}
              readOnly
            />
          )}

          <div className="grid grid-cols-1 gap-4">
            {config.detailFields.map((field) => (
              <InputGroup
                key={field.key}
                label={field.label}
                type={field.type === "textarea" ? "textarea" : "text"}
                value={data.extra[field.key] || ""}
                onChange={(v) => updateExtra(field.key, v)}
                placeholder={field.placeholder}
                mutedValue={Boolean(
                  useParseDrivenSections &&
                    data.extra[field.key] &&
                    !dismissedSuggestedExtraFields[field.key]
                )}
              />
            ))}
          </div>
        </div>
      </GymnasticsEditorLayout>
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

        const ingestRes = await fetch("/api/ingest?mode=meet_discovery", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const ingestJson = await ingestRes.json().catch(() => ({}));
        if (!ingestRes.ok || !ingestJson?.eventId) {
          throw new Error(ingestJson?.error || "Failed to ingest source");
        }
        const eventId = String(ingestJson.eventId);
        const parseRes = await fetch(`/api/parse/${eventId}`, {
          method: "POST",
          credentials: "include",
        });
        const parseJson = await parseRes.json().catch(() => ({}));
        if (!parseRes.ok) {
          throw new Error(parseJson?.error || "Failed to parse source");
        }
        router.push(`/event/gymnastics/customize?edit=${eventId}`);
      } catch (err: any) {
        setDiscoverError(String(err?.message || err || "Failed to parse source"));
      } finally {
        setDiscoverBusy(false);
      }
    }, [discoverBusy, discoverFile, router]);

    const renderDiscoverEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
        title="Upload to Prefill"
        onBack={() => setActiveView("main")}
        showBack
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
            Upload a PDF/JPG/PNG file. We will parse details and prefill your
            meet page builder.
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
            {discoverBusy ? "Parsing..." : "Parse and Build Meet Page"}
          </button>
        </div>
      </GymnasticsEditorLayout>
    );

    const renderRsvpEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
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

          <div className="space-y-3">
            <SectionToggle
              label={`Use ${rsvpCopy.deadlineLabel}`}
              checked={Boolean(data.rsvpDeadline)}
              onChange={(enabled) =>
                updateData(
                  "rsvpDeadline",
                  enabled
                    ? data.rsvpDeadline ||
                        (() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 10);
                          return d.toISOString().split("T")[0];
                        })()
                    : ""
                )
              }
            />
            {Boolean(data.rsvpDeadline) && (
              <InputGroup
                label={rsvpCopy.deadlineLabel}
                type="date"
                value={data.rsvpDeadline}
                onChange={(v) => updateData("rsvpDeadline", v)}
                placeholder="Set a deadline"
              />
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <strong>Preview:</strong> {rsvpCopy.helperText}
          </div>
        </div>
      </GymnasticsEditorLayout>
    );

    const renderPasscodeEditor = () => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
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
                Require a shared code before anyone can open this page.
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
            <div className="space-y-4">
              <InputGroup
                label="Access Code"
                type="text"
                value={data.passcode}
                onChange={(v) => updateData("passcode", v)}
                placeholder="Gym2026Finals"
              />
              <InputGroup
                label="Passcode Hint (optional)"
                type="text"
                value={data.passcodeHint}
                onChange={(v) => updateData("passcodeHint", v)}
                placeholder="Team nickname + year"
              />
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-md text-blue-800 text-sm">
            <strong>How it works:</strong> Guests need both the event link and
            this code. If you rotate codes often, update it here before sharing
            to families.
          </div>
        </div>
      </GymnasticsEditorLayout>
    );

    const renderAdvancedEditor = (section: AdvancedSectionSpec) => (
      <GymnasticsEditorLayout isEmbed={isEmbed}
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
      </GymnasticsEditorLayout>
    );

    const previewEventData = useMemo(() => {
      const {
        advancedSections: _ignoredAdvancedSections,
        designTokens: _ignoredDesignTokens,
        ...extraFieldsForPreview
      } = (data.extra || {}) as Record<string, any>;
      let startISO: string | null = null;
      let endISO: string | null = null;
      if (data.date && data.time) {
        const start = new Date(`${data.date}T${data.time}:00`);
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setHours(end.getHours() + 2);
          startISO = start.toISOString();
          endISO = end.toISOString();
        }
      }

      // For existing meet-discovery edits, keep the discovery layout in preview
      const isDiscoveryPreview = Boolean(
        editEventId && (isDiscoveryEdit || loadedDiscoverySource || useParseDrivenSections)
      );

      return {
        category: config.category,
        createdVia: isDiscoveryPreview ? "meet-discovery" : "simple-template",
        createdManually: !isDiscoveryPreview,
        ...(loadedDiscoverySource
          ? {
              discoverySource: loadedDiscoverySource,
            }
          : {}),
        startISO,
        endISO,
        location: locationParts || undefined,
        address: data.address || undefined,
        venue: data.venue || undefined,
        timezone: data.timezone || undefined,
        hostGym: data.hostGym || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        description: data.details || undefined,
        rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
        rsvpEnabled: data.rsvpEnabled,
        rsvpDeadline: data.rsvpDeadline || undefined,
        numberOfGuests: 0,
        templateId: config.slug,
        pageTemplateId: data.pageTemplateId,
        fontSize: selectedSize.id,
        fontSizeClass: selectedSize.className,
        templateConfig: {
          displayName: config.displayName,
          categoryLabel: config.categoryLabel || config.displayName,
          detailFields: config.detailFields,
          rsvpCopy: config.rsvpCopy,
        },
        customFields: {
          ...extraFieldsForPreview,
          team: extraFieldsForPreview?.team || "",
          advancedSections: advancedState,
        },
        advancedSections: advancedState,
        heroImage: data.hero || undefined,
        time: data.time,
        date: data.date,
        ...(data.passcodeRequired && data.passcode
          ? {
              accessControl: {
                mode: "access-code",
                passcodePlain: data.passcode,
                passcodeHint: data.passcodeHint || undefined,
                requirePasscode: true,
              },
            }
          : data.passcodeRequired === false
          ? {
              accessControl: {
                mode: "public",
                passcodeHint: "",
                requirePasscode: false,
              },
            }
          : {}),
      };
    }, [
      advancedState,
      config.category,
      config.categoryLabel,
      config.defaultHero,
      config.detailFields,
      config.displayName,
      config.rsvpCopy,
      config.slug,
      editEventId,
      isDiscoveryEdit,
      loadedDiscoverySource,
      useParseDrivenSections,
      data.address,
      data.city,
      data.date,
      data.details,
      data.extra,
      data.hero,
      data.pageTemplateId,
      data.passcode,
      data.passcodeHint,
      data.passcodeRequired,
      data.rsvpDeadline,
      data.rsvpEnabled,
      selectedSize,
      data.state,
      data.time,
      data.timezone,
      data.hostGym,
      data.venue,
      locationParts,
    ]);
    const previewEventId = editEventId || `preview-${config.slug}`;

    useEffect(() => {
      if (!isEmbed || !editEventId) return;
      if (loadingExisting) return;
      if (typeof window === "undefined") return;

      const liveTitle = data.title || config.displayName;
      try {
        window.parent?.postMessage(
          {
            type: "envitefy:discovery-preview-patch",
            eventId: editEventId,
            patch: {
              ...previewEventData,
              title: liveTitle,
              eventTitle: liveTitle,
            },
          },
          "*"
        );
      } catch {
        // Best effort only for live preview.
      }
    }, [
      config.displayName,
      editEventId,
      isEmbed,
      loadingExisting,
      previewEventData,
      data.title,
    ]);

    const sidebarPanel = (
      <div
        {...drawerTouchHandlers}
        className={
          isEmbed
            ? "flex h-dvh min-h-0 w-full flex-1 flex-col overflow-hidden bg-white"
            : `w-full md:w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20 absolute md:relative top-0 right-0 bottom-0 h-full transition-transform duration-300 transform md:translate-x-0 ${
                mobileMenuOpen ? "translate-x-0" : "translate-x-full"
              }`
        }
      >
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {!isEmbed && (
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

          <div
            className="p-6 pt-4 pb-8 md:pt-6 md:pb-10"
            style={{ pointerEvents: "auto" }}
          >
            {activeView === "main" &&
              (editEventId && loadingExisting ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    Loading event…
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Preparing edit sidebar
                  </p>
                </div>
              ) : (
                renderMainMenu()
              ))}
            {activeView === "headline" && renderHeadlineEditor}
            {activeView === "images" && renderImagesEditor()}
            {activeView === "design" && renderDesignEditor()}
            {activeView === "details" && renderDetailsEditor()}
            {activeView === "discover" && renderDiscoverEditor()}
            {activeView === "rsvp" && renderRsvpEditor()}
            {activeView === "passcode" && renderPasscodeEditor()}
            {visibleAdvancedSections.map((section) =>
              activeView === section.id ? (
                <React.Fragment key={section.id}>
                  {renderAdvancedEditor(section)}
                </React.Fragment>
              ) : null
            )}
          </div>
        </div>

          <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50">
            <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Before Publish
              </p>
              {missingEssentials.length === 0 ? (
                <p className="mt-1 text-xs text-emerald-700 font-medium">
                  Essentials complete. You are ready to publish.
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  Missing: {missingEssentials.join(", ")}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {editEventId && (
                <button
                  onClick={() => {
                    if (isEmbed && typeof window !== "undefined") {
                      const href = `${window.location.origin}${buildEventPath(editEventId, data.title || "Event")}`;
                      try {
                        (window as any).parent.location.href = href;
                      } catch {
                        router.push(`/event/${editEventId}`);
                      }
                    } else {
                      router.push(`/event/${editEventId}`);
                    }
                  }}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-sm tracking-wide transition-colors shadow-sm"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handlePublish}
                disabled={submitting || missingEssentials.length > 0}
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
    );

    if (isEmbed) {
      return (
        <div className="h-dvh min-h-0 w-full bg-white flex flex-col overflow-hidden">
          {sidebarPanel}
        </div>
      );
    }

    return (
      <div className="relative flex min-h-screen h-[100dvh] w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
        <div
          {...previewTouchHandlers}
          className="flex-1 min-h-0 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="w-full max-w-[100%] md:max-w-[calc(100%-40px)] xl:max-w-[1000px] my-4 md:my-8 mb-12 md:mb-16 transition-all duration-500 ease-in-out">
            <div
              id="guide-preview-root"
              className="min-h-[780px] w-full shadow-2xl md:rounded-xl overflow-hidden transition-all duration-500 relative z-0"
            >
              {editEventId && loadingExisting ? (
                <div className="flex min-h-[780px] items-center justify-center bg-white text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Loading event preview...
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Replacing previous event data.
                    </p>
                  </div>
                </div>
              ) : (
                <SimpleTemplateView
                  key={`preview-${previewEventId}`}
                  eventId={previewEventId}
                  eventData={previewEventData}
                  eventTitle={data.title || config.displayName}
                  isOwner={false}
                  isReadOnly={true}
                  viewerKind="readonly"
                  shareUrl=""
                  sessionEmail={null}
                  disableProtectedSectionLocks={true}
                  disableThemeBackground={true}
                  neutralPreview={{
                    surface: "light-gradient",
                    suppressTextShadows: true,
                  }}
                />
              )}
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

        {sidebarPanel}

        {!isEmbed && !isInIframe && !mobileMenuOpen && (
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
