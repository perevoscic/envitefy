// @ts-nocheck
"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  memo,
  useRef,
} from "react";
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
  ClipboardList,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shirt,
  Plus,
  Trash2,
  Link as LinkIcon,
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
    fontId?: string;
  };
  advancedSections?: AdvancedSectionSpec[];
};

const DANCE_FONTS = [
  {
    id: "playfair",
    name: "Playfair Display",
    css: "'Playfair Display', 'Times New Roman', serif",
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    css: "'Cormorant Garamond', 'Garamond', serif",
  },
  {
    id: "great-vibes",
    name: "Great Vibes",
    css: "'Great Vibes', 'Lucida Calligraphy', cursive",
  },
  {
    id: "parisienne",
    name: "Parisienne",
    css: "'Parisienne', 'Brush Script MT', cursive",
  },
  { id: "allura", name: "Allura", css: "'Allura', 'Brush Script MT', cursive" },
  {
    id: "dancing-script",
    name: "Dancing Script",
    css: "'Dancing Script', 'Comic Sans MS', cursive",
  },
  {
    id: "cinzel-decorative",
    name: "Cinzel Decorative",
    css: "'Cinzel Decorative', 'Cinzel', serif",
  },
  { id: "fraunces", name: "Fraunces", css: "'Fraunces', 'Georgia', serif" },
  {
    id: "libre-baskerville",
    name: "Libre Baskerville",
    css: "'Libre Baskerville', 'Baskerville', serif",
  },
  {
    id: "marcellus",
    name: "Marcellus",
    css: "'Marcellus', 'Times New Roman', serif",
  },
  {
    id: "quattrocento",
    name: "Quattrocento",
    css: "'Quattrocento', 'Garamond', serif",
  },
  { id: "petrona", name: "Petrona", css: "'Petrona', 'Georgia', serif" },
  {
    id: "pinyon-script",
    name: "Pinyon Script",
    css: "'Pinyon Script', 'Edwardian Script ITC', cursive",
  },
  {
    id: "dm-serif-display",
    name: "DM Serif Display",
    css: "'DM Serif Display', 'Times New Roman', serif",
  },
  {
    id: "sorts-mill-goudy",
    name: "Sorts Mill Goudy",
    css: "'Sorts Mill Goudy', 'Goudy Old Style', serif",
  },
  { id: "gloock", name: "Gloock", css: "'Gloock', 'Georgia', serif" },
  { id: "italiana", name: "Italiana", css: "'Italiana', 'Didot', serif" },
  {
    id: "la-belle-aurore",
    name: "La Belle Aurore",
    css: "'La Belle Aurore', 'Bradley Hand', cursive",
  },
  {
    id: "meddon",
    name: "Meddon",
    css: "'Meddon', 'Lucida Handwriting', cursive",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    css: "'Tangerine', 'Brush Script MT', cursive",
  },
];

const DANCE_GOOGLE_FONT_FAMILIES = [
  "Playfair+Display:wght@400;600;700",
  "Cormorant+Garamond:wght@400;500;600",
  "Great+Vibes",
  "Parisienne",
  "Allura",
  "Dancing+Script:wght@400;600;700",
  "Cinzel+Decorative:wght@400;700",
  "Fraunces:wght@400;600;700",
  "Libre+Baskerville:wght@400;700",
  "Marcellus",
  "Quattrocento:wght@400;700",
  "Petrona:wght@400;600;700",
  "Pinyon+Script",
  "DM+Serif+Display",
  "Sorts+Mill+Goudy",
  "Gloock",
  "Italiana",
  "La+Belle+Aurore",
  "Meddon",
  "Tangerine:wght@400;700",
];

const DANCE_GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${DANCE_GOOGLE_FONT_FAMILIES.join(
  "&family="
)}&display=swap`;

const FONT_SIZE_OPTIONS = [
  { id: "small", label: "Small", className: "text-3xl md:text-4xl" },
  { id: "medium", label: "Medium", className: "text-4xl md:text-5xl" },
  { id: "large", label: "Large", className: "text-5xl md:text-6xl" },
];

type DanceEvent = {
  id: string;
  name: string;
  type: "performance" | "rehearsal" | "competition";
  date?: string;
  time?: string;
  callTime?: string;
  spacingTime?: string;
  stageTime?: string;
  venue?: string;
  address?: string;
  notes?: string;
  result?: string;
};

type PracticeBlock = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  arrivalTime?: string;
  focus?: string;
  groups: string[];
};

type RosterDancer = {
  id: string;
  name: string;
  role: string;
  piece?: string;
  status: "performing" | "understudy" | "injured";
  notes?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
};

type LogisticsInfo = {
  transport?: string;
  hotel?: string;
  dressingRoom?: string;
  meals?: string;
  emergencyContact?: string;
  logisticsNotes?: string;
};

type GearInfo = {
  costume?: string;
  hairMakeup?: string;
  shoes?: string;
  props?: string;
  musicLink?: string;
  checklist?: string;
};

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DANCE_GROUPS = ["Company", "Pre-Pro", "Ensemble", "Apprentice", "Youth"];
const DANCE_ROLES = ["Principal", "Soloist", "Corps", "Understudy", "Coach"];
const genId = () => Math.random().toString(36).slice(2, 9);

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
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          className={baseTextareaClass}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      ) : (
        <input
          type={type}
          className={baseInputClass}
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

// ───────────────────────────────
// Dance/Ballet advanced sections
// ───────────────────────────────

const eventsSection = {
  id: "events",
  menuTitle: "Performances & Shows",
  menuDesc: "Performances, rehearsals, stage times, and tech notes.",
  initialState: {
    events: [
      {
        id: genId(),
        name: "Swan Lake, Act II",
        type: "performance",
        date: "",
        time: "19:00",
        callTime: "17:45",
        spacingTime: "18:15",
        stageTime: "19:00",
        venue: "Lyric Theater",
        address: "123 Main St, Chicago, IL",
        notes: "Black swan cast; fog effect; quick-change after Scene 3.",
        result: "",
      },
      {
        id: genId(),
        name: "Spacing Rehearsal",
        type: "rehearsal",
        date: "",
        time: "16:00",
        callTime: "15:45",
        spacingTime: "",
        stageTime: "",
        venue: "Studio A",
        address: "Downtown Arts Center",
        notes: "Marks only; focus on corps lines and exits.",
        result: "",
      },
    ] as DanceEvent[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const events: DanceEvent[] = state?.events || [];
    const addEvent = () => {
      setState((s: any) => ({
        ...s,
        events: [
          ...(s?.events || []),
          {
            id: genId(),
            name: "",
            type: "performance",
            date: "",
            time: "19:00",
            callTime: "",
            spacingTime: "",
            stageTime: "",
            venue: "",
            address: "",
            notes: "",
            result: "",
          } as DanceEvent,
        ],
      }));
    };
    const updateEvent = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        events: (s?.events || []).map((ev: DanceEvent) =>
          ev.id === id ? { ...ev, [field]: value } : ev
        ),
      }));
    };
    const removeEvent = (id: string) => {
      setState((s: any) => ({
        ...s,
        events: (s?.events || []).filter((ev: DanceEvent) => ev.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex gap-3 items-start">
          <ClipboardList className="text-indigo-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-indigo-900">Show & Tech Calls</h4>
            <p className="text-sm text-indigo-700">
              Track performances, rehearsals, call times, and stage windows.
            </p>
          </div>
        </div>

        {events.map((ev, idx) => (
          <div
            key={ev.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Event #{idx + 1}
              </span>
              <button
                onClick={() => removeEvent(ev.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  className={inputClass}
                  placeholder="Nutcracker – Snow Scene"
                  value={ev.name}
                  onChange={(e) => updateEvent(ev.id, "name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Type
                </label>
                <select
                  className={inputClass}
                  value={ev.type}
                  onChange={(e) =>
                    updateEvent(
                      ev.id,
                      "type",
                      e.target.value as DanceEvent["type"]
                    )
                  }
                >
                  <option value="performance">Performance</option>
                  <option value="rehearsal">Rehearsal / Spacing</option>
                  <option value="competition">Competition / Festival</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={ev.date}
                  onChange={(e) => updateEvent(ev.id, "date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Start
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.time}
                  onChange={(e) => updateEvent(ev.id, "time", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Stage / Performance Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.stageTime}
                  onChange={(e) =>
                    updateEvent(ev.id, "stageTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Call Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.callTime}
                  onChange={(e) =>
                    updateEvent(ev.id, "callTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Spacing / Tech
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.spacingTime}
                  onChange={(e) =>
                    updateEvent(ev.id, "spacingTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Venue
                </label>
                <input
                  className={inputClass}
                  placeholder="Lyric Theater"
                  value={ev.venue}
                  onChange={(e) => updateEvent(ev.id, "venue", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Address
                </label>
                <input
                  className={inputClass}
                  placeholder="123 Main St, City, ST"
                  value={ev.address}
                  onChange={(e) =>
                    updateEvent(ev.id, "address", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Notes
                </label>
                <textarea
                  className={textareaClass}
                  rows={2}
                  placeholder="Quick change cues, prop handoffs, lighting notes"
                  value={ev.notes}
                  onChange={(e) => updateEvent(ev.id, "notes", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Result / Scores
                </label>
                <input
                  className={inputClass}
                  placeholder="Adjudication or judge notes"
                  value={ev.result}
                  onChange={(e) => updateEvent(ev.id, "result", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEvent}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Event
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
    headingFontStyle,
  }) => {
    const events: DanceEvent[] = state?.events || [];
    if (events.length === 0) return null;

    const fmtDate = (d?: string) =>
      d
        ? new Date(d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "";
    const fmtTime = (t?: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Performances & Tech
        </h2>
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-50 rounded text-xs font-medium">
                  {ev.type === "performance"
                    ? "Performance"
                    : ev.type === "rehearsal"
                    ? "Rehearsal"
                    : "Competition"}
                </span>
                {ev.result && (
                  <span className="text-sm font-semibold opacity-80">
                    {ev.result}
                  </span>
                )}
              </div>
              <div
                className={`font-semibold text-lg ${textClass}`}
                style={bodyShadow}
              >
                {ev.name || "TBD"}
              </div>
              <div
                className={`text-sm opacity-75 flex flex-wrap gap-2 items-center ${textClass}`}
                style={bodyShadow}
              >
                {fmtDate(ev.date)}
                {ev.time && "•"}
                {fmtTime(ev.time)}
                {ev.venue && (
                  <>
                    <span>•</span>
                    <span>{ev.venue}</span>
                  </>
                )}
              </div>
              {(ev.callTime || ev.spacingTime || ev.stageTime) && (
                <div
                  className={`text-xs opacity-75 flex flex-wrap gap-3 items-center ${textClass}`}
                  style={bodyShadow}
                >
                  {ev.callTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Call {fmtTime(ev.callTime)}
                    </span>
                  )}
                  {ev.spacingTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Spacing {fmtTime(ev.spacingTime)}
                    </span>
                  )}
                  {ev.stageTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Stage {fmtTime(ev.stageTime)}
                    </span>
                  )}
                </div>
              )}
              {ev.notes && (
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {ev.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const practiceSection = {
  id: "practice",
  menuTitle: "Rehearsal Blocks",
  menuDesc: "Daily rehearsal schedule, arrival, focus, groups.",
  initialState: {
    blocks: [
      {
        id: genId(),
        day: "Tuesday",
        startTime: "16:00",
        endTime: "18:00",
        arrivalTime: "15:45",
        focus: "Technique + Corps lines (Act II)",
        groups: ["Company", "Ensemble"],
      },
      {
        id: genId(),
        day: "Thursday",
        startTime: "16:00",
        endTime: "18:30",
        arrivalTime: "15:45",
        focus: "Full run, spacing, lifts",
        groups: ["Company", "Pre-Pro"],
      },
    ] as PracticeBlock[],
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
            endTime: "18:00",
            arrivalTime: "15:45",
            focus: "",
            groups: [],
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
    const toggleGroup = (id: string, group: string) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) => {
          if (b.id !== id) return b;
          const groups = b.groups || [];
          return {
            ...b,
            groups: groups.includes(group)
              ? groups.filter((g) => g !== group)
              : [...groups, group],
          };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex gap-3 items-start">
          <ClipboardList className="text-emerald-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-emerald-900">Rehearsal Plan</h4>
            <p className="text-sm text-emerald-700">
              Set rehearsal times, arrival, focus, and groups.
            </p>
          </div>
        </div>

        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Rehearsal #{idx + 1}
              </span>
              <button
                onClick={() => removeBlock(block.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  Arrival
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={block.arrivalTime}
                  onChange={(e) =>
                    updateBlock(block.id, "arrivalTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                Groups
              </label>
              <div className="flex flex-wrap gap-2">
                {DANCE_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleGroup(block.id, group)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (block.groups || []).includes(group)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Focus / Plan
              </label>
              <textarea
                className={textareaClass}
                rows={2}
                placeholder="Lift transitions, counts, musicality..."
                value={block.focus}
                onChange={(e) => updateBlock(block.id, "focus", e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Rehearsal
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
    headingFontStyle,
  }) => {
    const blocks: PracticeBlock[] = state?.blocks || [];
    if (blocks.length === 0) return null;

    const fmtTime = (t?: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Rehearsal Schedule
        </h2>
        <div className="space-y-3">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {b.day} • {fmtTime(b.startTime)}-{fmtTime(b.endTime)}
              </div>
              <div
                className={`text-sm opacity-75 flex flex-wrap gap-3 items-center ${textClass}`}
                style={bodyShadow}
              >
                {b.arrivalTime && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Arrive {fmtTime(b.arrivalTime)}
                  </span>
                )}
                {(b.groups || []).length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {(b.groups || []).join(", ")}
                  </span>
                )}
              </div>
              {b.focus && (
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {b.focus}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const rosterSection = {
  id: "roster",
  menuTitle: "Cast & Roster",
  menuDesc: "Dancers, roles, pieces, parent contacts.",
  initialState: {
    dancers: [
      {
        id: genId(),
        name: "Elena Torres",
        role: "Principal",
        piece: "Odette",
        status: "performing",
        notes: "Covers Odile as understudy.",
        parentName: "Marisol Torres",
        parentPhone: "555-201-8899",
        parentEmail: "marisol@example.com",
      },
      {
        id: genId(),
        name: "Maya Chen",
        role: "Corps",
        piece: "Swan Corps",
        status: "performing",
        notes: "Watch timing on diagonal entry.",
        parentName: "Li Chen",
        parentPhone: "555-441-7723",
        parentEmail: "li@example.com",
      },
    ] as RosterDancer[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const dancers: RosterDancer[] = state?.dancers || [];
    const addDancer = () => {
      setState((s: any) => ({
        ...s,
        dancers: [
          ...(s?.dancers || []),
          {
            id: genId(),
            name: "",
            role: "Corps",
            piece: "",
            status: "performing",
            notes: "",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
          } as RosterDancer,
        ],
      }));
    };
    const updateDancer = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        dancers: (s?.dancers || []).map((d: RosterDancer) =>
          d.id === id ? { ...d, [field]: value } : d
        ),
      }));
    };
    const removeDancer = (id: string) => {
      setState((s: any) => ({
        ...s,
        dancers: (s?.dancers || []).filter((d: RosterDancer) => d.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex gap-3 items-start">
          <Users className="text-purple-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-purple-900">Cast List</h4>
            <p className="text-sm text-purple-700">
              Track roles, pieces, status, and contacts.
            </p>
          </div>
        </div>

        {dancers.map((d, idx) => (
          <div
            key={d.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Dancer #{idx + 1}
              </span>
              <button
                onClick={() => removeDancer(d.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Name
                </label>
                <input
                  className={inputClass}
                  placeholder="Elena Torres"
                  value={d.name}
                  onChange={(e) => updateDancer(d.id, "name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Role
                </label>
                <select
                  className={inputClass}
                  value={d.role}
                  onChange={(e) => updateDancer(d.id, "role", e.target.value)}
                >
                  {DANCE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Piece / Part
                </label>
                <input
                  className={inputClass}
                  placeholder="Odette / Swan Corps"
                  value={d.piece}
                  onChange={(e) => updateDancer(d.id, "piece", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  className={inputClass}
                  value={d.status}
                  onChange={(e) =>
                    updateDancer(
                      d.id,
                      "status",
                      e.target.value as RosterDancer["status"]
                    )
                  }
                >
                  <option value="performing">Performing</option>
                  <option value="understudy">Understudy</option>
                  <option value="injured">Injured/Modified</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Parent Name
                </label>
                <input
                  className={inputClass}
                  placeholder="Parent/Guardian"
                  value={d.parentName}
                  onChange={(e) =>
                    updateDancer(d.id, "parentName", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Parent Phone
                </label>
                <input
                  className={inputClass}
                  placeholder="555-123-4567"
                  value={d.parentPhone}
                  onChange={(e) =>
                    updateDancer(d.id, "parentPhone", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Parent Email
                </label>
                <input
                  className={inputClass}
                  placeholder="parent@email.com"
                  value={d.parentEmail}
                  onChange={(e) =>
                    updateDancer(d.id, "parentEmail", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                className={textareaClass}
                rows={2}
                placeholder="Covers, injuries, musicality notes..."
                value={d.notes}
                onChange={(e) => updateDancer(d.id, "notes", e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addDancer}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Dancer
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
    headingFontStyle,
  }) => {
    const dancers: RosterDancer[] = state?.dancers || [];
    if (dancers.length === 0) return null;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Cast & Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dancers.map((d) => (
            <div
              key={d.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-1"
            >
              <div
                className={`font-semibold text-lg ${textClass}`}
                style={bodyShadow}
              >
                {d.name || "Unnamed"}
              </div>
              <div
                className={`text-sm opacity-75 flex gap-3 items-center ${textClass}`}
                style={bodyShadow}
              >
                <span>{d.role}</span>
                {d.piece && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {d.piece}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    d.status === "performing"
                      ? "bg-green-500/20 text-green-200"
                      : d.status === "understudy"
                      ? "bg-yellow-500/20 text-yellow-100"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {d.status}
                </span>
              </div>
              {d.notes && (
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {d.notes}
                </div>
              )}
              {(d.parentPhone || d.parentEmail) && (
                <div
                  className={`text-xs opacity-75 flex gap-3 items-center ${textClass}`}
                  style={bodyShadow}
                >
                  {d.parentPhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {d.parentPhone}
                    </span>
                  )}
                  {d.parentEmail && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {d.parentEmail}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const logisticsSection = {
  id: "logistics",
  menuTitle: "Logistics",
  menuDesc: "Transport, hotel, dressing rooms, meals, emergency contact.",
  initialState: {
    info: {
      transport: "Call van at 4:45 PM from studio",
      hotel: "Hilton Downtown – block reserved for touring cast",
      dressingRoom: "Room B2; quick-change rack backstage left",
      meals: "Snacks provided; dinner break 6:15-6:45",
      emergencyContact: "Artistic Dir. Carter 555-555-1212",
      logisticsNotes:
        "Load props via stage door on Wabash; wristbands required.",
    } as LogisticsInfo,
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const info: LogisticsInfo = state?.info || {};
    const update = (field: keyof LogisticsInfo, value: string) => {
      setState((s: any) => ({
        ...s,
        info: { ...(s?.info || {}), [field]: value },
      }));
    };

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
          <MapPin className="text-blue-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-blue-900">Logistics</h4>
            <p className="text-sm text-blue-700">
              Travel, dressing rooms, meals, and who to contact.
            </p>
          </div>
        </div>

        <InputGroup
          label="Transport / Call"
          value={info.transport || ""}
          onChange={(v) => update("transport", v)}
          placeholder="Call van at 4:45 PM from studio"
        />
        <InputGroup
          label="Hotel"
          value={info.hotel || ""}
          onChange={(v) => update("hotel", v)}
          placeholder="Tour block / confirmation"
        />
        <InputGroup
          label="Dressing Room"
          value={info.dressingRoom || ""}
          onChange={(v) => update("dressingRoom", v)}
          placeholder="Room B2; quick-change rack"
        />
        <InputGroup
          label="Meals"
          value={info.meals || ""}
          onChange={(v) => update("meals", v)}
          placeholder="Snacks provided; dinner break 6:15-6:45"
        />
        <InputGroup
          label="Emergency Contact"
          value={info.emergencyContact || ""}
          onChange={(v) => update("emergencyContact", v)}
          placeholder="Artistic Dir. Carter 555-555-1212"
        />
        <InputGroup
          label="Notes"
          type="textarea"
          value={info.logisticsNotes || ""}
          onChange={(v) => update("logisticsNotes", v)}
          placeholder="Load-in, stage door, wristbands..."
        />
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
    headingFontStyle,
  }) => {
    const info: LogisticsInfo = state?.info || {};
    if (
      !info.transport &&
      !info.hotel &&
      !info.dressingRoom &&
      !info.meals &&
      !info.emergencyContact &&
      !info.logisticsNotes
    ) {
      return null;
    }
    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Logistics
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          {info.transport && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Transport / Call:</strong> {info.transport}
            </div>
          )}
          {info.hotel && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Hotel:</strong> {info.hotel}
            </div>
          )}
          {info.dressingRoom && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Dressing Room:</strong> {info.dressingRoom}
            </div>
          )}
          {info.meals && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Meals:</strong> {info.meals}
            </div>
          )}
          {info.emergencyContact && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Emergency:</strong> {info.emergencyContact}
            </div>
          )}
          {info.logisticsNotes && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Notes:</strong> {info.logisticsNotes}
            </div>
          )}
        </div>
      </>
    );
  },
};

const gearSection = {
  id: "gear",
  menuTitle: "Costume & Props",
  menuDesc: "Costume call, hair/makeup, shoes, props, music link.",
  initialState: {
    gear: {
      costume: "Blue tutu + white bodice (Act II)",
      hairMakeup: "Low bun, clean stage face",
      shoes: "Freed Classics (2 pairs), pointe pads",
      props: "Veils for corps; fans for coda",
      musicLink: "https://drive.example.com/swan-track",
      checklist: "Rosin, tape, sewing kit, extra ribbons",
    } as GearInfo,
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const gear: GearInfo = state?.gear || {};
    const update = (field: keyof GearInfo, value: string) => {
      setState((s: any) => ({
        ...s,
        gear: { ...(s?.gear || {}), [field]: value },
      }));
    };

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-3 items-start">
          <Shirt className="text-orange-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-orange-900">Costume Call</h4>
            <p className="text-sm text-orange-700">
              Keep dancers and parents aligned on wardrobe and props.
            </p>
          </div>
        </div>
        <InputGroup
          label="Costume"
          value={gear.costume || ""}
          onChange={(v) => update("costume", v)}
          placeholder="Blue tutu + white bodice (Act II)"
        />
        <InputGroup
          label="Hair / Makeup"
          value={gear.hairMakeup || ""}
          onChange={(v) => update("hairMakeup", v)}
          placeholder="Low bun, clean stage face"
        />
        <InputGroup
          label="Shoes / Accessories"
          value={gear.shoes || ""}
          onChange={(v) => update("shoes", v)}
          placeholder="Pointe shoes, flats, pads, rosin"
        />
        <InputGroup
          label="Props"
          value={gear.props || ""}
          onChange={(v) => update("props", v)}
          placeholder="Fans, veils, handheld props"
        />
        <InputGroup
          label="Music Link"
          value={gear.musicLink || ""}
          onChange={(v) => update("musicLink", v)}
          placeholder="https://drive.example.com/track"
        />
        <InputGroup
          label="Checklist"
          type="textarea"
          value={gear.checklist || ""}
          onChange={(v) => update("checklist", v)}
          placeholder="Rosin, sewing kit, extra ribbons..."
        />
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
    headingFontStyle,
  }) => {
    const gear: GearInfo = state?.gear || {};
    if (
      !gear.costume &&
      !gear.hairMakeup &&
      !gear.shoes &&
      !gear.props &&
      !gear.musicLink &&
      !gear.checklist
    ) {
      return null;
    }
    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Costume & Props
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          {gear.costume && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Costume:</strong> {gear.costume}
            </div>
          )}
          {gear.hairMakeup && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Hair/Makeup:</strong> {gear.hairMakeup}
            </div>
          )}
          {gear.shoes && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Shoes:</strong> {gear.shoes}
            </div>
          )}
          {gear.props && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Props:</strong> {gear.props}
            </div>
          )}
          {gear.musicLink && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Music:</strong>{" "}
              <a
                href={gear.musicLink}
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {gear.musicLink}
              </a>
            </div>
          )}
          {gear.checklist && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Checklist:</strong> {gear.checklist}
            </div>
          )}
        </div>
      </>
    );
  },
};

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
      fontId: config.prefill?.fontId || DANCE_FONTS[0]?.id || "playfair",
      fontSize: config.prefill?.fontSize || "medium",
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
    const [themesExpanded, setThemesExpanded] = useState(
      config.themesExpandedByDefault ?? true
    );
    const [loadingExisting, setLoadingExisting] = useState(false);
    const {
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
      previewTouchHandlers,
      drawerTouchHandlers,
    } = useMobileDrawer();
    const fontListRef = useRef<HTMLDivElement | null>(null);
    const [fontScrollTop, setFontScrollTop] = useState(0);
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

    // Expand themes when Design view is opened
    useEffect(() => {
      if (activeView === "design") {
        setThemesExpanded(true);
      }
    }, [activeView]);

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

          const startIso =
            existing.start || existing.startISO || existing.startIso;
          let loadedDate: string | undefined;
          let loadedTime: string | undefined;
          if (startIso) {
            const d = new Date(startIso);
            if (!Number.isNaN(d.getTime())) {
              loadedDate = d.toISOString().split("T")[0];
              loadedTime = d.toISOString().slice(11, 16);
            }
          }

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
            venue: existing.venue || existing.location || prev.venue,
            details: existing.details || existing.description || prev.details,
            hero: existing.heroImage || existing.hero || prev.hero,
            rsvpEnabled:
              typeof existing.rsvpEnabled === "boolean"
                ? existing.rsvpEnabled
                : prev.rsvpEnabled,
            rsvpDeadline: existing.rsvpDeadline || prev.rsvpDeadline,
            fontId:
              existing.fontId &&
              DANCE_FONTS.find((f) => f.id === existing.fontId)
                ? existing.fontId
                : prev.fontId,
            fontSize:
              existing.fontSize &&
              FONT_SIZE_OPTIONS.find((o) => o.id === existing.fontSize)
                ? existing.fontSize
                : prev.fontSize,
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

          if (
            existing.themeId &&
            config.themes.find((t) => t.id === existing.themeId)
          ) {
            setThemeId(existing.themeId);
          } else if (
            existing.theme?.id &&
            config.themes.find((t) => t.id === existing.theme.id)
          ) {
            setThemeId(existing.theme.id);
          } else {
            setThemeId(config.themes[0]?.id ?? "default-theme");
          }

          setLoadingExisting(false);
        } catch (err) {
          console.error("[Edit] Error loading event:", err);
          setLoadingExisting(false);
          alert("Failed to load event data. Please refresh the page.");
        }
      };
      loadExisting();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editEventId]);

    // Load elegant dance fonts into the designer/preview
    useEffect(() => {
      let link =
        document.querySelector<HTMLLinkElement>(
          'link[data-dance-fonts="true"]'
        ) || null;
      let added = false;

      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.setAttribute("data-dance-fonts", "true");
        added = true;
      }

      link.href = DANCE_GOOGLE_FONTS_URL;

      if (added) {
        document.head.appendChild(link);
      }

      return () => {
        if (added && link?.parentElement) {
          link.parentElement.removeChild(link);
        }
      };
    }, []);

    useEffect(() => {
      if (fontListRef.current) {
        fontListRef.current.scrollTop = fontScrollTop;
      }
    }, [fontScrollTop, data.fontId]);

    const currentTheme =
      config.themes.find((t) => t.id === themeId) || config.themes[0];

    const selectedFont =
      DANCE_FONTS.find((f) => f.id === data.fontId) || DANCE_FONTS[0];

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

    const locationParts = [data.venue, data.city, data.state]
      .filter(Boolean)
      .join(", ");
    const addressLine = "";

    const hasEvents = (advancedState?.events?.events?.length ?? 0) > 0;
    const hasPractice = (advancedState?.practice?.blocks?.length ?? 0) > 0;
    const hasRoster = (advancedState?.roster?.athletes?.length ?? 0) > 0;
    const hasLogistics = Boolean(
      advancedState?.logistics?.travelMode ||
        advancedState?.logistics?.departure ||
        advancedState?.logistics?.pickupWindow
    );
    const hasGear = (advancedState?.gear?.items?.length ?? 0) > 0;

    const navItems = useMemo(
      () =>
        [
          { id: "details", label: "Details", enabled: true },
          { id: "events", label: "Events", enabled: hasEvents },
          { id: "practice", label: "Practice", enabled: hasPractice },
          { id: "roster", label: "Roster", enabled: hasRoster },
          { id: "logistics", label: "Logistics", enabled: hasLogistics },
          { id: "gear", label: "Gear", enabled: hasGear },
          { id: "rsvp", label: "RSVP", enabled: data.rsvpEnabled },
          { id: "passcode", label: "Passcode", enabled: true },
        ].filter((item) => item.enabled),
      [
        hasEvents,
        hasGear,
        hasLogistics,
        hasPractice,
        hasRoster,
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
        { root: null, rootMargin: "-25% 0px -60% 0px", threshold: 0 }
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

        let heroToSave = config.defaultHero;
        if (data.hero) {
          if (/^blob:/i.test(data.hero)) {
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
            heroToSave = data.hero;
          } else {
            heroToSave = data.hero;
          }
        }

        const validThemeId =
          themeId && config.themes.find((t) => t.id === themeId)
            ? themeId
            : config.themes[0]?.id || "default-theme";
        const themeToSave =
          config.themes.find((t) => t.id === validThemeId) || config.themes[0];
        const validFontId =
          data.fontId && DANCE_FONTS.find((f) => f.id === data.fontId)
            ? data.fontId
            : DANCE_FONTS[0]?.id || "playfair";
        const validFontSize =
          data.fontSize && FONT_SIZE_OPTIONS.find((o) => o.id === data.fontSize)
            ? data.fontSize
            : "medium";
        const currentSelectedFont =
          DANCE_FONTS.find((f) => f.id === validFontId) || DANCE_FONTS[0];
        const currentSelectedSize =
          FONT_SIZE_OPTIONS.find((o) => o.id === validFontSize) ||
          FONT_SIZE_OPTIONS[1];

        const payload: any = {
          title: data.title || config.displayName,
          data: {
            category: config.category,
            createdVia: "simple-template",
            createdManually: true,
            startISO,
            endISO,
            location: locationParts || undefined,
            venue: data.venue || undefined,
            description: data.details || undefined,
            rsvp: data.rsvpEnabled ? data.rsvpDeadline || undefined : undefined,
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
          const res = await fetch(`/api/history/${editEventId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: payload.title, data: payload.data }),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[Edit] Update failed:", res.status, txt);
            throw new Error("Failed to update event");
          }
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
      data.hero,
      data.rsvpEnabled,
      data.rsvpDeadline,
      data.extra,
      data.fontId,
      data.fontSize,
      data.passcodeRequired,
      data.passcode,
      advancedState,
      locationParts,
      config.category,
      config.displayName,
      config.slug,
      config.defaultHero,
      config.detailFields,
      config.rsvpCopy,
      router,
      themeId,
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
            <div
              ref={fontListRef}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1"
            >
              {DANCE_FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFontScrollTop(fontListRef.current?.scrollTop || 0);
                    setData((p) => ({ ...p, fontId: f.id }));
                  }}
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
      <div className="relative flex min-h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
        <div
          {...previewTouchHandlers}
          className="flex-1 relative overflow-y-auto scrollbar-hide bg-[#f0f2f5] flex justify-center md:justify-end md:pr-50"
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
                      className={`text-3xl md:text-5xl font-serif mb-2 leading-tight ${textClass}`}
                      style={headingFontStyle}
                    >
                      {data.title || config.displayName}
                    </h1>
                    {infoLine}
                    {addressLine && (
                      <div
                        className={`mt-2 text-sm opacity-80 flex items-center gap-2 ${textClass}`}
                        style={bodyShadow}
                      >
                        <MapPin size={14} />
                        <span className="truncate">{addressLine}</span>
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
                        headingFontStyle,
                        bodyShadow,
                        titleColor,
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
                      style={headingFontStyle}
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
          {...drawerTouchHandlers}
        >
          <ScrollBoundary
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

const config = {
  slug: "dance-ballet-season",
  displayName: "Dance / Ballet Season",
  category: "sport_dance_ballet",
  categoryLabel: "Dance / Ballet",
  defaultHero: "/templates/hero-images/balet-dance-hero.jpeg",
  detailFields: [
    {
      key: "company",
      label: "Studio / Company",
      placeholder: "Northside Ballet Company",
    },
    { key: "piece", label: "Feature Piece", placeholder: "Swan Lake, Act II" },
    {
      key: "choreographer",
      label: "Choreographer / AD",
      placeholder: "Ms. Alvarez",
    },
    {
      key: "costume",
      label: "Costume / Hair / Makeup",
      placeholder: "Blue tutu, low bun, light glam",
    },
    {
      key: "call",
      label: "Stage Call & Rehearsal",
      placeholder: "Call 5:30 PM, spacing 5:45 PM",
    },
    {
      key: "music",
      label: "Music / Tech Notes",
      placeholder: "Track link, cues, lighting notes",
    },
  ],
  prefill: {
    title: "Company Season — Swan Lake Highlights",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split("T")[0];
    })(),
    time: "19:00",
    city: "Chicago",
    state: "IL",
    venue: "Lyric Theater",
    details:
      "Follow our season with performances, spacing calls, rehearsals, and costume notes in one place.",
    extra: {
      company: "Northside Ballet Company",
      piece: "Swan Lake, Act II",
      choreographer: "Ms. Alvarez",
      costume: "Blue tutu, low bun, light glam",
      call: "Call 5:30 PM, spacing 5:45 PM",
      music: "https://drive.example.com/swan-track",
    },
  },
  advancedSections: [
    eventsSection,
    practiceSection,
    rosterSection,
    logisticsSection,
    gearSection,
  ],
  themes: [
    {
      id: "blush_reverie",
      name: "Blush Reverie",
      bg: "bg-gradient-to-br from-rose-200 via-rose-100 to-amber-50",
      text: "text-slate-900",
      accent: "text-rose-700",
      preview: "bg-gradient-to-r from-rose-200 via-rose-100 to-amber-50",
    },
    {
      id: "prima_ballerina",
      name: "Prima Ballerina",
      bg: "bg-gradient-to-br from-rose-300 via-amber-100 to-rose-50",
      text: "text-slate-900",
      accent: "text-rose-800",
      preview: "bg-gradient-to-r from-rose-300 via-amber-100 to-rose-50",
    },
    {
      id: "violet_pirouette",
      name: "Violet Pirouette",
      bg: "bg-gradient-to-br from-purple-200 via-violet-200 to-purple-100",
      text: "text-slate-900",
      accent: "text-purple-800",
      preview: "bg-gradient-to-r from-purple-200 via-violet-200 to-purple-100",
    },
    {
      id: "rosette_waltz",
      name: "Rosette Waltz",
      bg: "bg-gradient-to-br from-rose-400 via-rose-300 to-amber-50",
      text: "text-slate-900",
      accent: "text-rose-900",
      preview: "bg-gradient-to-r from-rose-400 via-rose-300 to-amber-50",
    },
    {
      id: "moonlit_stage",
      name: "Moonlit Stage",
      bg: "bg-gradient-to-br from-slate-100 via-gray-50 to-white",
      text: "text-slate-900",
      accent: "text-slate-700",
      preview: "bg-gradient-to-r from-slate-100 via-gray-50 to-white",
    },
    {
      id: "swan_lake_blue",
      name: "Swan Lake Blue",
      bg: "bg-gradient-to-br from-sky-200 via-blue-100 to-white",
      text: "text-slate-900",
      accent: "text-sky-800",
      preview: "bg-gradient-to-r from-sky-200 via-blue-100 to-white",
    },
    {
      id: "golden_pointe",
      name: "Golden Pointe",
      bg: "bg-gradient-to-br from-rose-200 via-amber-100 to-amber-50",
      text: "text-slate-900",
      accent: "text-amber-800",
      preview: "bg-gradient-to-r from-rose-200 via-amber-100 to-amber-50",
    },
    {
      id: "champagne_elegance",
      name: "Champagne Elegance",
      bg: "bg-gradient-to-br from-amber-100 via-amber-50 to-white",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-gradient-to-r from-amber-100 via-amber-50 to-white",
    },
    {
      id: "peach_arabesque",
      name: "Peach Arabesque",
      bg: "bg-gradient-to-br from-orange-200 via-amber-200 to-rose-100",
      text: "text-slate-900",
      accent: "text-orange-800",
      preview: "bg-gradient-to-r from-orange-200 via-amber-200 to-rose-100",
    },
    {
      id: "mint_en_pointe",
      name: "Mint En Pointe",
      bg: "bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-50",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-100 via-teal-100 to-emerald-50",
    },
    {
      id: "shadow_ballet",
      name: "Shadow Ballet",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-200",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-rose-200",
    },
    {
      id: "royal_ballet",
      name: "Royal Ballet",
      bg: "bg-gradient-to-br from-purple-900 via-purple-800 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-purple-900 via-purple-800 to-amber-500",
    },
    {
      id: "coral_curtain",
      name: "Coral Curtain",
      bg: "bg-gradient-to-br from-orange-200 via-rose-100 to-amber-50",
      text: "text-slate-900",
      accent: "text-orange-800",
      preview: "bg-gradient-to-r from-orange-200 via-rose-100 to-amber-50",
    },
    {
      id: "crimson_pas_de_deux",
      name: "Crimson Pas de Deux",
      bg: "bg-gradient-to-br from-rose-900 via-rose-700 to-rose-200",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-900 via-rose-700 to-rose-200",
    },
    {
      id: "dreamy_lift",
      name: "Dreamy Lift",
      bg: "bg-gradient-to-br from-sky-200 via-blue-100 to-violet-100",
      text: "text-slate-900",
      accent: "text-sky-800",
      preview: "bg-gradient-to-r from-sky-200 via-blue-100 to-violet-100",
    },
    {
      id: "silk_slippers",
      name: "Silk Slippers",
      bg: "bg-gradient-to-br from-stone-300 via-stone-200 to-rose-100",
      text: "text-slate-900",
      accent: "text-rose-700",
      preview: "bg-gradient-to-r from-stone-300 via-stone-200 to-rose-100",
    },
    {
      id: "midnight_encore",
      name: "Midnight Encore",
      bg: "bg-gradient-to-br from-slate-950 via-blue-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-blue-900 to-amber-500",
    },
    {
      id: "gilded_tulle",
      name: "Gilded Tulle",
      bg: "bg-gradient-to-br from-white via-amber-50 to-amber-200",
      text: "text-slate-900",
      accent: "text-amber-800",
      preview: "bg-gradient-to-r from-white via-amber-50 to-amber-200",
    },
    {
      id: "twilight_dance",
      name: "Twilight Dance",
      bg: "bg-gradient-to-br from-rose-200 via-slate-200 to-sky-200",
      text: "text-slate-900",
      accent: "text-rose-800",
      preview: "bg-gradient-to-r from-rose-200 via-slate-200 to-sky-200",
    },
    {
      id: "feathered_grace",
      name: "Feathered Grace",
      bg: "bg-gradient-to-br from-slate-200 via-gray-200 to-rose-100",
      text: "text-slate-900",
      accent: "text-rose-700",
      preview: "bg-gradient-to-r from-slate-200 via-gray-200 to-rose-100",
    },
    {
      id: "regal_performance",
      name: "Regal Performance",
      bg: "bg-gradient-to-br from-purple-950 via-purple-900 to-slate-400",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-purple-950 via-purple-900 to-slate-400",
    },
    {
      id: "recital_pastels",
      name: "Recital Pastels",
      bg: "bg-gradient-to-br from-pink-200 via-sky-200 to-pink-100",
      text: "text-slate-900",
      accent: "text-sky-700",
      preview: "bg-gradient-to-r from-pink-200 via-sky-200 to-pink-100",
    },
    {
      id: "studio_warmth",
      name: "Studio Warmth",
      bg: "bg-gradient-to-br from-amber-100 via-amber-200 to-orange-100",
      text: "text-slate-900",
      accent: "text-amber-800",
      preview: "bg-gradient-to-r from-amber-100 via-amber-200 to-orange-100",
    },
    {
      id: "orchestra_glow",
      name: "Orchestra Glow",
      bg: "bg-gradient-to-br from-slate-950 via-rose-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-rose-900 to-amber-500",
    },
  ],
};
const Page = createSimpleCustomizePage(config);
export default Page;
