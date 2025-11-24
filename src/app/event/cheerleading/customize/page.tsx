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
  ClipboardList,
  Users,
  Home,
  Plane,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shirt,
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

type CheerEvent = {
  id: string;
  name: string;
  type: "competition" | "game" | "pep_rally";
  opponent?: string;
  date?: string;
  time?: string;
  homeAway?: "home" | "away";
  venue?: string;
  address?: string;
  callTime?: string;
  warmupTime?: string;
  onMatTime?: string;
  notes?: string;
  score?: string;
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

type RosterAthlete = {
  id: string;
  name: string;
  role: string;
  stuntGroup?: string;
  status: "active" | "alternate" | "injured";
  notes?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
};

type LogisticsInfo = {
  busCall?: string;
  hotel?: string;
  rooming?: string;
  meals?: string;
  emergencyContact?: string;
  travelNotes?: string;
};

type GearInfo = {
  uniform?: string;
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

const CHEER_GROUPS = ["Varsity", "JV", "Game Day", "Competition"];
const STUNT_ROLES = ["Flyer", "Base", "Backspot", "Tumbler", "Coach"];

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

// ───────────────────────────────
// Cheer-specific advanced sections
// ───────────────────────────────

const eventsSection = {
  id: "events",
  menuTitle: "Events & Competitions",
  menuDesc: "Home/away games, competitions, rallies, mat times.",
  initialState: {
    events: [
      {
        id: genId(),
        name: "UCA Regionals",
        type: "competition",
        opponent: "",
        date: "",
        time: "10:00",
        homeAway: "away",
        venue: "Convention Center - Hall B",
        address: "123 Expo Way, Chicago, IL",
        callTime: "08:30",
        warmupTime: "09:15",
        onMatTime: "09:45",
        notes: "Full outs; bring signs/poms.",
        score: "",
      },
      {
        id: genId(),
        name: "Home vs Central High",
        type: "game",
        opponent: "Central High",
        date: "",
        time: "19:00",
        homeAway: "home",
        venue: "Panther Stadium",
        address: "500 Stadium Dr, Chicago, IL",
        callTime: "17:45",
        warmupTime: "18:15",
        onMatTime: "",
        notes: "Sidelines set A; halftime routine.",
        score: "",
      },
    ] as CheerEvent[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const events: CheerEvent[] = state?.events || [];
    const addEvent = () => {
      setState((s: any) => ({
        ...s,
        events: [
          ...(s?.events || []),
          {
            id: genId(),
            name: "",
            type: "competition",
            opponent: "",
            date: "",
            time: "17:00",
            homeAway: "home",
            venue: "",
            address: "",
            callTime: "",
            warmupTime: "",
            onMatTime: "",
            notes: "",
            score: "",
          } as CheerEvent,
        ],
      }));
    };
    const updateEvent = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        events: (s?.events || []).map((ev: CheerEvent) =>
          ev.id === id ? { ...ev, [field]: value } : ev
        ),
      }));
    };
    const removeEvent = (id: string) => {
      setState((s: any) => ({
        ...s,
        events: (s?.events || []).filter((ev: CheerEvent) => ev.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 flex gap-3 items-start">
          <ClipboardList className="text-pink-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-pink-900">
              Cheer Season Schedule
            </h4>
            <p className="text-sm text-pink-700">
              Track competitions, football games, pep rallies, and mat times
              with home/away notes.
            </p>
          </div>
        </div>

        {events.map((ev, idx) => (
          <div
            key={ev.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Event #{idx + 1}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    ev.homeAway === "home"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {ev.homeAway === "home" ? "HOME" : "AWAY"}
                </span>
              </div>
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
                  Event / Opponent
                </label>
                <input
                  className={inputClass}
                  placeholder="vs Central High or UCA Regionals"
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
                      e.target.value as CheerEvent["type"]
                    )
                  }
                >
                  <option value="competition">Competition</option>
                  <option value="game">Football/Basketball Game</option>
                  <option value="pep_rally">Pep Rally</option>
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
                  Home / Away
                </label>
                <select
                  className={inputClass}
                  value={ev.homeAway}
                  onChange={(e) =>
                    updateEvent(ev.id, "homeAway", e.target.value)
                  }
                >
                  <option value="home">🏠 Home</option>
                  <option value="away">✈️ Away</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Venue
                </label>
                <input
                  className={inputClass}
                  placeholder="Panther Stadium / Convention Center"
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

            <div className="grid grid-cols-3 gap-3">
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
                  Warm-up
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.warmupTime}
                  onChange={(e) =>
                    updateEvent(ev.id, "warmupTime", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  On Mat / Performance
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={ev.onMatTime}
                  onChange={(e) =>
                    updateEvent(ev.id, "onMatTime", e.target.value)
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
                  placeholder="Stunt order, basket toss reminders, mat size"
                  value={ev.notes}
                  onChange={(e) => updateEvent(ev.id, "notes", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Result / Score
                </label>
                <input
                  className={inputClass}
                  placeholder="94.25 or W/L"
                  value={ev.score}
                  onChange={(e) => updateEvent(ev.id, "score", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEvent}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-pink-400 hover:text-pink-600 transition-colors flex items-center justify-center gap-2"
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
  }) => {
    const events: CheerEvent[] = state?.events || [];
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
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Cheer Events & Competitions
        </h2>
        <div className="space-y-3">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ev.homeAway === "home"
                        ? "bg-green-500/20 text-green-200"
                        : "bg-blue-500/20 text-blue-200"
                    }`}
                  >
                    {ev.homeAway === "home" ? "HOME" : "AWAY"}
                  </span>
                  <span className="px-2 py-0.5 bg-pink-500/20 text-pink-50 rounded text-xs font-medium">
                    {ev.type === "competition"
                      ? "Competition"
                      : ev.type === "game"
                      ? "Game"
                      : "Pep Rally"}
                  </span>
                </div>
                {ev.score && (
                  <span className="text-sm font-semibold opacity-80">
                    {ev.score}
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
              {(ev.callTime || ev.warmupTime || ev.onMatTime) && (
                <div
                  className={`text-xs opacity-75 flex flex-wrap gap-3 items-center ${textClass}`}
                  style={bodyShadow}
                >
                  {ev.callTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Call {fmtTime(ev.callTime)}
                    </span>
                  )}
                  {ev.warmupTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Warm-up {fmtTime(ev.warmupTime)}
                    </span>
                  )}
                  {ev.onMatTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> On Mat {fmtTime(ev.onMatTime)}
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
  menuTitle: "Practice Plan",
  menuDesc: "Weekly practices, arrival, focus, stunt groups.",
  initialState: {
    blocks: [
      {
        id: genId(),
        day: "Monday",
        startTime: "15:30",
        endTime: "17:30",
        arrivalTime: "15:15",
        focus: "Stunts, tumbling, counts review",
        groups: ["Varsity"],
      },
      {
        id: genId(),
        day: "Wednesday",
        startTime: "15:30",
        endTime: "17:00",
        arrivalTime: "15:15",
        focus: "Sidelines, pyramids, baskets",
        groups: ["Varsity", "JV"],
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
            day: "Tuesday",
            startTime: "15:30",
            endTime: "17:30",
            arrivalTime: "15:15",
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
            <h4 className="font-semibold text-emerald-900">Practice Blocks</h4>
            <p className="text-sm text-emerald-700">
              Set weekly practice times, arrival, and focus.
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
                Practice #{idx + 1}
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
                {CHEER_GROUPS.map((group) => (
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
                placeholder="Stunts, tumbling, sidelines, timing..."
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
          Add Practice
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
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Practice Schedule
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
  menuTitle: "Roster & Stunt Groups",
  menuDesc: "Athletes, roles, parent contacts, stunt groups.",
  initialState: {
    athletes: [
      {
        id: genId(),
        name: "Alexis Carter",
        role: "Flyer",
        stuntGroup: "Group A",
        status: "active",
        notes: "Works full-up; needs new grips.",
        parentName: "Dana Carter",
        parentPhone: "555-123-4567",
        parentEmail: "dana@example.com",
      },
      {
        id: genId(),
        name: "Jordan Lee",
        role: "Base",
        stuntGroup: "Group A",
        status: "active",
        notes: "Ankle brace for left ankle.",
        parentName: "Chris Lee",
        parentPhone: "555-987-6543",
        parentEmail: "chris@example.com",
      },
    ] as RosterAthlete[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const athletes: RosterAthlete[] = state?.athletes || [];
    const addAthlete = () => {
      setState((s: any) => ({
        ...s,
        athletes: [
          ...(s?.athletes || []),
          {
            id: genId(),
            name: "",
            role: "Flyer",
            stuntGroup: "",
            status: "active",
            notes: "",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
          } as RosterAthlete,
        ],
      }));
    };
    const updateAthlete = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).map((a: RosterAthlete) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    };
    const removeAthlete = (id: string) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).filter((a: RosterAthlete) => a.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex gap-3 items-start">
          <Users className="text-purple-600 mt-0.5" size={18} />
          <div>
            <h4 className="font-semibold text-purple-900">Roster & Roles</h4>
            <p className="text-sm text-purple-700">
              Track flyers, bases, backspots, tumblers, and contacts.
            </p>
          </div>
        </div>

        {athletes.map((a, idx) => (
          <div
            key={a.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Athlete #{idx + 1}
              </span>
              <button
                onClick={() => removeAthlete(a.id)}
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
                  placeholder="Alexis Carter"
                  value={a.name}
                  onChange={(e) => updateAthlete(a.id, "name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Role
                </label>
                <select
                  className={inputClass}
                  value={a.role}
                  onChange={(e) => updateAthlete(a.id, "role", e.target.value)}
                >
                  {STUNT_ROLES.map((r) => (
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
                  Stunt Group
                </label>
                <input
                  className={inputClass}
                  placeholder="Group A / Pyramid Line 1"
                  value={a.stuntGroup}
                  onChange={(e) =>
                    updateAthlete(a.id, "stuntGroup", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  className={inputClass}
                  value={a.status}
                  onChange={(e) =>
                    updateAthlete(
                      a.id,
                      "status",
                      e.target.value as RosterAthlete["status"]
                    )
                  }
                >
                  <option value="active">Active</option>
                  <option value="alternate">Alternate</option>
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
                  value={a.parentName}
                  onChange={(e) =>
                    updateAthlete(a.id, "parentName", e.target.value)
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
                  value={a.parentPhone}
                  onChange={(e) =>
                    updateAthlete(a.id, "parentPhone", e.target.value)
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
                  value={a.parentEmail}
                  onChange={(e) =>
                    updateAthlete(a.id, "parentEmail", e.target.value)
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
                placeholder="Injuries, mat restrictions, role swaps..."
                value={a.notes}
                onChange={(e) => updateAthlete(a.id, "notes", e.target.value)}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAthlete}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Athlete
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
    const athletes: RosterAthlete[] = state?.athletes || [];
    if (athletes.length === 0) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Roster & Stunt Groups
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {athletes.map((a) => (
            <div
              key={a.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-1"
            >
              <div
                className={`font-semibold text-lg ${textClass}`}
                style={bodyShadow}
              >
                {a.name || "Unnamed"}
              </div>
              <div
                className={`text-sm opacity-75 flex gap-3 items-center ${textClass}`}
                style={bodyShadow}
              >
                <span>{a.role}</span>
                {a.stuntGroup && (
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {a.stuntGroup}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    a.status === "active"
                      ? "bg-green-500/20 text-green-200"
                      : a.status === "alternate"
                      ? "bg-yellow-500/20 text-yellow-100"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {a.status}
                </span>
              </div>
              {a.notes && (
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {a.notes}
                </div>
              )}
              {(a.parentPhone || a.parentEmail) && (
                <div
                  className={`text-xs opacity-75 flex gap-3 items-center ${textClass}`}
                  style={bodyShadow}
                >
                  {a.parentPhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {a.parentPhone}
                    </span>
                  )}
                  {a.parentEmail && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {a.parentEmail}
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
  menuTitle: "Travel & Logistics",
  menuDesc: "Buses, hotels, rooming, meals, emergency contact.",
  initialState: {
    info: {
      busCall: "Bus call 12:45 PM from Main Gym (Lot A)",
      hotel: "Hilton Downtown Chicago – confirmation sent",
      rooming: "See rooming chart (Groups A/B/C)",
      meals: "Team dinner Fri 6 PM; breakfast hotel buffet",
      emergencyContact: "Coach Rivera 555-321-7788",
      travelNotes: "Load signs/poms in bin 2; chaperones: Smith, Lee",
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
            <h4 className="font-semibold text-blue-900">Travel Details</h4>
            <p className="text-sm text-blue-700">
              Share how the team is traveling and who to contact.
            </p>
          </div>
        </div>

        <InputGroup
          label="Bus Call / Departure"
          value={info.busCall || ""}
          onChange={(v) => update("busCall", v)}
          placeholder="Bus call 12:45 PM from Main Gym"
        />
        <InputGroup
          label="Hotel"
          value={info.hotel || ""}
          onChange={(v) => update("hotel", v)}
          placeholder="Hilton Downtown, confirmation codes"
        />
        <InputGroup
          label="Rooming"
          value={info.rooming || ""}
          onChange={(v) => update("rooming", v)}
          placeholder="Rooming list / roommates"
        />
        <InputGroup
          label="Meals"
          value={info.meals || ""}
          onChange={(v) => update("meals", v)}
          placeholder="Team dinner 6 PM; per diem; snacks to pack"
        />
        <InputGroup
          label="Emergency Contact"
          value={info.emergencyContact || ""}
          onChange={(v) => update("emergencyContact", v)}
          placeholder="Coach Rivera 555-123-4567"
        />
        <InputGroup
          label="Travel Notes"
          type="textarea"
          value={info.travelNotes || ""}
          onChange={(v) => update("travelNotes", v)}
          placeholder="Parking lot to load, bus seating, chaperones"
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
  }) => {
    const info: LogisticsInfo = state?.info || {};
    if (
      !info.busCall &&
      !info.hotel &&
      !info.rooming &&
      !info.meals &&
      !info.emergencyContact &&
      !info.travelNotes
    ) {
      return null;
    }
    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Travel & Logistics
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          {info.busCall && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Bus / Call:</strong> {info.busCall}
            </div>
          )}
          {info.hotel && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Hotel:</strong> {info.hotel}
            </div>
          )}
          {info.rooming && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Rooming:</strong> {info.rooming}
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
          {info.travelNotes && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Notes:</strong> {info.travelNotes}
            </div>
          )}
        </div>
      </>
    );
  },
};

const gearSection = {
  id: "gear",
  menuTitle: "Uniform & Props",
  menuDesc: "Uniform call, hair/makeup, shoes, props, music link.",
  initialState: {
    gear: {
      uniform: "Red top, white skirt, comp bow",
      hairMakeup: "High pony, red bow, light glam",
      shoes: "Nfinity Vengeance, white crew socks",
      props: "Silver poms, megaphone, signs bag",
      musicLink: "https://drive.example.com/cheer-mix",
      checklist: "Water, tape, brace, snacks, backup bow",
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
            <h4 className="font-semibold text-orange-900">Uniform Call</h4>
            <p className="text-sm text-orange-700">
              Keep parents clear on what to pack for each event.
            </p>
          </div>
        </div>
        <InputGroup
          label="Uniform"
          value={gear.uniform || ""}
          onChange={(v) => update("uniform", v)}
          placeholder="Red top, white skirt, comp bow"
        />
        <InputGroup
          label="Hair / Makeup"
          value={gear.hairMakeup || ""}
          onChange={(v) => update("hairMakeup", v)}
          placeholder="High pony, red bow, natural glam"
        />
        <InputGroup
          label="Shoes / Accessories"
          value={gear.shoes || ""}
          onChange={(v) => update("shoes", v)}
          placeholder="Nfinity Vengeance, grips, tape"
        />
        <InputGroup
          label="Props / Signs / Poms"
          value={gear.props || ""}
          onChange={(v) => update("props", v)}
          placeholder="Silver poms, megaphone, signs bag"
        />
        <InputGroup
          label="Music Link"
          value={gear.musicLink || ""}
          onChange={(v) => update("musicLink", v)}
          placeholder="https://drive.example.com/music"
        />
        <InputGroup
          label="Checklist"
          type="textarea"
          value={gear.checklist || ""}
          onChange={(v) => update("checklist", v)}
          placeholder="Pack bow, water bottle, tape, meds..."
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
  }) => {
    const gear: GearInfo = state?.gear || {};
    if (
      !gear.uniform &&
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
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Uniform & Props
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
          {gear.uniform && (
            <div className={`text-sm ${textClass}`} style={bodyShadow}>
              <strong>Uniform:</strong> {gear.uniform}
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
  slug: "cheerleading-season",
  displayName: "Cheerleading Season",
  category: "sport_cheerleading",
  categoryLabel: "Cheerleading",
  defaultHero:
    "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1800&q=80",
  detailFields: [
    { key: "team", label: "Team / Squad", placeholder: "Varsity Cheer" },
    { key: "season", label: "Season / Year", placeholder: "2024-2025" },
    {
      key: "division",
      label: "Division / Level",
      placeholder: "UCA Game Day - Large Varsity",
    },
    {
      key: "coach",
      label: "Coach / Contacts",
      placeholder: "Coach Rivera, Asst. Lee",
    },
    {
      key: "music",
      label: "Music / Mix Link",
      placeholder: "https://music.example.com",
    },
    {
      key: "uniform",
      label: "Uniform & Hair",
      placeholder: "Red top, white bow; high pony",
    },
    {
      key: "warmup",
      label: "Warm-up & Call Time",
      placeholder: "Warm-up 2:15 PM, on mat 2:45 PM",
    },
    {
      key: "routine",
      label: "Routine Notes",
      placeholder: "Stunt order, pyramid adjustments",
    },
  ],
  prefill: {
    title: "Varsity Cheer Season",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split("T")[0];
    })(),
    time: "17:00",
    city: "Chicago",
    state: "IL",
    venue: "Panther Stadium",
    details:
      "Follow our full cheer season with games, comps, warm-ups, and travel details in one place.",
    extra: {
      team: "Varsity Cheer",
      season: "2024-2025",
      division: "UCA Game Day - Large Varsity",
      coach: "Coach Rivera, Asst. Lee",
      music: "https://drive.example.com/cheer-mix",
      uniform: "Red top, white bow; high pony",
      warmup: "Warm-up 2:15 PM, on mat 2:45 PM",
      routine: "Stunt order: Group A/B/C; basket after count 52",
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
      id: "stadium_nights",
      name: "Stadium Nights",
      bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700",
      text: "text-white",
      accent: "text-indigo-200",
      preview: "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-700",
    },
    {
      id: "electric_field",
      name: "Electric Field",
      bg: "bg-gradient-to-br from-emerald-900 via-lime-700 to-emerald-500",
      text: "text-white",
      accent: "text-lime-100",
      preview: "bg-gradient-to-r from-emerald-900 via-lime-700 to-emerald-500",
    },
    {
      id: "sunset_court",
      name: "Sunset Court",
      bg: "bg-gradient-to-br from-orange-900 via-amber-700 to-rose-600",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-orange-900 via-amber-700 to-rose-600",
    },
    {
      id: "spirit_pink",
      name: "Spirit Pink",
      bg: "bg-gradient-to-br from-pink-900 via-rose-800 to-pink-700",
      text: "text-white",
      accent: "text-pink-100",
      preview: "bg-gradient-to-r from-pink-900 via-rose-800 to-pink-700",
    },
    {
      id: "golden_sparkle",
      name: "Golden Sparkle",
      bg: "bg-gradient-to-br from-yellow-700 via-amber-700 to-yellow-600",
      text: "text-white",
      accent: "text-yellow-100",
      preview: "bg-gradient-to-r from-yellow-700 via-amber-700 to-yellow-600",
    },
    {
      id: "royal_purple",
      name: "Royal Purple",
      bg: "bg-gradient-to-br from-purple-900 via-violet-800 to-purple-700",
      text: "text-white",
      accent: "text-purple-200",
      preview: "bg-gradient-to-r from-purple-900 via-violet-800 to-purple-700",
    },
    {
      id: "electric_blue",
      name: "Electric Blue",
      bg: "bg-gradient-to-br from-blue-900 via-cyan-800 to-blue-700",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-900 via-cyan-800 to-blue-700",
    },
    {
      id: "crimson_cheer",
      name: "Crimson Cheer",
      bg: "bg-gradient-to-br from-red-900 via-rose-800 to-red-700",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-red-900 via-rose-800 to-red-700",
    },
    {
      id: "emerald_energy",
      name: "Emerald Energy",
      bg: "bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700",
      text: "text-white",
      accent: "text-emerald-200",
      preview: "bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-700",
    },
    {
      id: "orange_blast",
      name: "Orange Blast",
      bg: "bg-gradient-to-br from-orange-800 via-red-700 to-orange-600",
      text: "text-white",
      accent: "text-orange-100",
      preview: "bg-gradient-to-r from-orange-800 via-red-700 to-orange-600",
    },
    {
      id: "midnight_magic",
      name: "Midnight Magic",
      bg: "bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900",
      text: "text-white",
      accent: "text-indigo-200",
      preview: "bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900",
    },
    {
      id: "teal_thunder",
      name: "Teal Thunder",
      bg: "bg-gradient-to-br from-teal-900 via-cyan-800 to-teal-700",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-teal-900 via-cyan-800 to-teal-700",
    },
    {
      id: "violet_vibes",
      name: "Violet Vibes",
      bg: "bg-gradient-to-br from-violet-950 via-purple-900 to-violet-800",
      text: "text-white",
      accent: "text-violet-200",
      preview: "bg-gradient-to-r from-violet-950 via-purple-900 to-violet-800",
    },
    {
      id: "rose_radiance",
      name: "Rose Radiance",
      bg: "bg-gradient-to-br from-rose-900 via-pink-800 to-rose-700",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-900 via-pink-800 to-rose-700",
    },
    {
      id: "sapphire_spirit",
      name: "Sapphire Spirit",
      bg: "bg-gradient-to-br from-sky-950 via-blue-900 to-sky-700",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-sky-950 via-blue-900 to-sky-700",
    },
    {
      id: "lime_lightning",
      name: "Lime Lightning",
      bg: "bg-gradient-to-br from-lime-800 via-green-700 to-emerald-600",
      text: "text-white",
      accent: "text-lime-100",
      preview: "bg-gradient-to-r from-lime-800 via-green-700 to-emerald-600",
    },
    {
      id: "bronze_brilliance",
      name: "Bronze Brilliance",
      bg: "bg-gradient-to-br from-amber-900 via-orange-800 to-amber-700",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-amber-900 via-orange-800 to-amber-700",
    },
    {
      id: "navy_night",
      name: "Navy Night",
      bg: "bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-800",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-800",
    },
    {
      id: "coral_crush",
      name: "Coral Crush",
      bg: "bg-gradient-to-br from-orange-900 via-rose-800 to-orange-700",
      text: "text-white",
      accent: "text-orange-100",
      preview: "bg-gradient-to-r from-orange-900 via-rose-800 to-orange-700",
    },
    {
      id: "platinum_power",
      name: "Platinum Power",
      bg: "bg-gradient-to-br from-slate-800 via-gray-700 to-slate-600",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600",
    },
    {
      id: "fuchsia_fire",
      name: "Fuchsia Fire",
      bg: "bg-gradient-to-br from-fuchsia-900 via-pink-800 to-fuchsia-700",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-fuchsia-900 via-pink-800 to-fuchsia-700",
    },
    {
      id: "aqua_aura",
      name: "Aqua Aura",
      bg: "bg-gradient-to-br from-cyan-900 via-teal-800 to-cyan-700",
      text: "text-white",
      accent: "text-cyan-200",
      preview: "bg-gradient-to-r from-cyan-900 via-teal-800 to-cyan-700",
    },
  ],
};
const Page = createSimpleCustomizePage(config);
export default Page;
