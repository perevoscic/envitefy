// @ts-nocheck
"use client";
import ResponsiveEventNavigation from "@/components/events/ResponsiveEventNavigation";
import TemplateImageTone from "@/components/events/TemplateImageTone";

import HeroImageEditor from "@/components/events/HeroImageEditor";

import { normalizeEventGuestActions } from "@/lib/event-guest-actions";
import EventGuestActions from "@/components/event-templates/EventGuestActions";
import EventGuestPlanningEditor from "@/components/event-templates/EventGuestPlanningEditor";
import EventGuestPlanningNotes from "@/components/event-templates/EventGuestPlanningNotes";
import { parseEventGuestDate, type EventGuestPlanning, getEventEndLocal } from "@/lib/event-guest-planning";
import EnvitefyEventBranding from "@/components/branding/EnvitefyEventBranding";
import React, { memo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shirt,
  Plus,
  Trash2,
} from "lucide-react";
import { buildEventPath } from "@/utils/event-url";

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
  }) => {
    const [draft, setDraft] = useState(value ?? "");

    useEffect(() => {
      setDraft(value ?? "");
    }, [value]);

    const commit = () => {
      const next = draft ?? "";
      const current = value ?? "";
      if (next !== current) onChange(next);
    };

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {label}
        </label>
        {type === "textarea" ? (
          <textarea
            className={baseTextareaClass}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        ) : (
          <input
            type={type}
            className={baseInputClass}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.type === nextProps.type &&
      prevProps.placeholder === nextProps.placeholder &&
      // onChange excluded - parent creates new functions on each render
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
        ? parseEventGuestDate(d).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "";
    const fmtTime = (t?: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
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
      const hour = parseInt(h, 10);
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

export {
  config,
  eventsSection,
  practiceSection,
  rosterSection,
  logisticsSection,
  gearSection,
};
export type {
  DanceEvent,
  PracticeBlock,
  RosterDancer,
  LogisticsInfo,
  GearInfo,
};
