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
    headingFontStyle,
  }) => {
    const events: CheerEvent[] = state?.events || [];
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
    headingFontStyle,
  }) => {
    const athletes: RosterAthlete[] = state?.athletes || [];
    if (athletes.length === 0) return null;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
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
    headingFontStyle,
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
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
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
    headingFontStyle,
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
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
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



const config = {
  slug: "cheerleading-season",
  displayName: "Cheerleading Season",
  category: "sport_cheerleading",
  categoryLabel: "Cheerleading",
  defaultHero: "/templates/hero-images/cheerleading-hero.jpeg",
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
      id: "pep_rally_pink",
      name: "Pep Rally Pink",
      bg: "bg-gradient-to-br from-fuchsia-700 via-pink-600 to-slate-950",
      text: "text-white",
      accent: "text-pink-100",
      preview: "bg-gradient-to-r from-fuchsia-700 via-pink-600 to-slate-950",
    },
    {
      id: "royal_spirit",
      name: "Royal Spirit",
      bg: "bg-gradient-to-br from-blue-900 via-blue-800 to-slate-50",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-blue-900 via-blue-800 to-slate-50",
    },
    {
      id: "cheer_classic",
      name: "Cheer Classic",
      bg: "bg-gradient-to-br from-red-900 via-red-700 to-slate-50",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-red-900 via-red-700 to-slate-50",
    },
    {
      id: "silver_starlight",
      name: "Silver Starlight",
      bg: "bg-gradient-to-br from-purple-800 via-purple-600 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-purple-800 via-purple-600 to-slate-200",
    },
    {
      id: "electric_teal",
      name: "Electric Teal",
      bg: "bg-gradient-to-br from-slate-950 via-teal-900 to-teal-600",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-slate-950 via-teal-900 to-teal-600",
    },
    {
      id: "victory_navy",
      name: "Victory Navy",
      bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-blue-950 via-blue-900 to-amber-500",
    },
    {
      id: "spirit_orange",
      name: "Spirit Orange",
      bg: "bg-gradient-to-br from-orange-600 via-orange-500 to-amber-100",
      text: "text-slate-900",
      accent: "text-orange-700",
      preview: "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-100",
    },
    {
      id: "shamrock_shout",
      name: "Shamrock Shout",
      bg: "bg-gradient-to-br from-green-700 via-emerald-600 to-emerald-50",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-green-700 via-emerald-600 to-emerald-50",
    },
    {
      id: "thunder_maroon",
      name: "Thunder Maroon",
      bg: "bg-gradient-to-br from-rose-900 via-rose-800 to-slate-300",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-900 via-rose-800 to-slate-300",
    },
    {
      id: "golden_cheer",
      name: "Golden Cheer",
      bg: "bg-gradient-to-br from-slate-950 via-black to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-amber-500",
    },
    {
      id: "glitter_pop",
      name: "Glitter Pop",
      bg: "bg-gradient-to-br from-pink-500 via-fuchsia-500 to-slate-200",
      text: "text-slate-900",
      accent: "text-fuchsia-700",
      preview: "bg-gradient-to-r from-pink-500 via-fuchsia-500 to-slate-200",
    },
    {
      id: "rivalry_red",
      name: "Rivalry Red",
      bg: "bg-gradient-to-br from-slate-950 via-red-900 to-red-700",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-slate-950 via-red-900 to-red-700",
    },
    {
      id: "skyline_spirit",
      name: "Skyline Spirit",
      bg: "bg-gradient-to-br from-sky-500 via-sky-400 to-white",
      text: "text-slate-900",
      accent: "text-sky-700",
      preview: "bg-gradient-to-r from-sky-500 via-sky-400 to-white",
    },
    {
      id: "majestic_motion",
      name: "Majestic Motion",
      bg: "bg-gradient-to-br from-purple-900 via-violet-800 to-amber-400",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-purple-900 via-violet-800 to-amber-400",
    },
    {
      id: "aqua_energy",
      name: "Aqua Energy",
      bg: "bg-gradient-to-br from-cyan-500 via-teal-400 to-white",
      text: "text-slate-900",
      accent: "text-teal-700",
      preview: "bg-gradient-to-r from-cyan-500 via-teal-400 to-white",
    },
    {
      id: "coral_crush",
      name: "Coral Crush",
      bg: "bg-gradient-to-br from-orange-400 via-rose-400 to-blue-900",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-orange-400 via-rose-400 to-blue-900",
    },
    {
      id: "mint_sparkle",
      name: "Mint Sparkle",
      bg: "bg-gradient-to-br from-emerald-200 via-green-200 to-amber-200",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-200 via-green-200 to-amber-200",
    },
    {
      id: "crimson_cheer",
      name: "Crimson Cheer",
      bg: "bg-gradient-to-br from-rose-900 via-rose-800 to-rose-100",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-900 via-rose-800 to-rose-100",
    },
    {
      id: "power_pink",
      name: "Power Pink",
      bg: "bg-gradient-to-br from-slate-950 via-black to-fuchsia-700",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-fuchsia-700",
    },
    {
      id: "neon_hype",
      name: "Neon Hype",
      bg: "bg-gradient-to-br from-slate-950 via-lime-700 to-lime-500",
      text: "text-white",
      accent: "text-lime-200",
      preview: "bg-gradient-to-r from-slate-950 via-lime-700 to-lime-500",
    },
    {
      id: "fire_flash",
      name: "Fire & Flash",
      bg: "bg-gradient-to-br from-red-800 via-red-700 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-red-800 via-red-700 to-slate-200",
    },
    {
      id: "golden_glow",
      name: "Golden Glow",
      bg: "bg-gradient-to-br from-amber-100 via-amber-50 to-white",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-gradient-to-r from-amber-100 via-amber-50 to-white",
    },
    {
      id: "royal_rally",
      name: "Royal Rally",
      bg: "bg-gradient-to-br from-purple-800 via-purple-600 to-white",
      text: "text-slate-900",
      accent: "text-purple-700",
      preview: "bg-gradient-to-r from-purple-800 via-purple-600 to-white",
    },
    {
      id: "frost_spirit",
      name: "Frost Spirit",
      bg: "bg-gradient-to-br from-blue-900 via-slate-500 to-gray-100",
      text: "text-white",
      accent: "text-sky-100",
      preview: "bg-gradient-to-r from-blue-900 via-slate-500 to-gray-100",
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
  CheerEvent,
  PracticeBlock,
  RosterAthlete,
  LogisticsInfo,
  GearInfo,
};
