// @ts-nocheck
"use client";

import React from "react";
import {
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
  FileText,
  Link as LinkIcon,
  CheckSquare,
  Bell,
  Download,
  ExternalLink,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type AthleteStatus = "going" | "not_going" | "maybe" | "late" | "pending";

type Athlete = {
  id: string;
  name: string;
  level: string;
  primaryEvents: string[];
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  medicalNotes: string;
  status: AthleteStatus;
};

type MeetInfo = {
  sessionNumber: string;
  warmUpTime: string;
  marchInTime: string;
  startApparatus: string;
  rotationOrder: string[];
  judgingNotes: string;
  scoresLink: string;
};

type PracticeBlock = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  focus: string[];
  skillGoals: string;
  equipment: string;
  assignments: string;
};

type LogisticsInfo = {
  travelMode: "bus" | "parent_drive" | "carpool" | "other";
  callTime: string;
  pickupWindow: string;
  hotelName: string;
  hotelAddress: string;
  hotelCheckIn: string;
  mealPlan: string;
  feeDueDate: string;
  feeAmount: string;
  paymentLink: string;
  waiverLinks: string[];
};

type GearItem = {
  id: string;
  name: string;
  required: boolean;
  acknowledged: boolean;
};

type VolunteerSlot = {
  id: string;
  role: string;
  name: string;
  filled: boolean;
};

type CarpoolOffer = {
  id: string;
  driverName: string;
  phone: string;
  seatsAvailable: number;
  departureLocation: string;
  departureTime: string;
};

// Helper to generate unique IDs
const genId = () => Math.random().toString(36).substring(2, 9);

// Apparatus options
const APPARATUS = ["Vault", "Bars", "Beam", "Floor"];
const LEVELS = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Level 9",
  "Level 10",
  "Xcel Bronze",
  "Xcel Silver",
  "Xcel Gold",
  "Xcel Platinum",
  "Xcel Diamond",
];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const VOLUNTEER_ROLES = [
  "Timer",
  "Score Flasher",
  "Line Judge",
  "Chaperone",
  "Check-in",
  "Hospitality",
  "Photography",
  "Setup/Teardown",
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: ROSTER & ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════

const rosterSection = {
  id: "roster",
  menuTitle: "Roster & Attendance",
  menuDesc: "Athletes, levels, parent contacts, attendance tracking.",
  initialState: {
    athletes: [
      {
        id: "ath1",
        name: "Emma Rodriguez",
        level: "Level 6",
        primaryEvents: ["Bars", "Beam"],
        parentName: "Sofia Rodriguez",
        parentPhone: "(815) 555-0189",
        parentEmail: "sofia.rodriguez@email.com",
        medicalNotes: "Mild peanut allergy - carries EpiPen",
        status: "going" as AthleteStatus,
      },
      {
        id: "ath2",
        name: "Olivia Chen",
        level: "Level 5",
        primaryEvents: ["Vault", "Floor"],
        parentName: "Jennifer Chen",
        parentPhone: "(815) 555-0234",
        parentEmail: "jchen@email.com",
        medicalNotes: "",
        status: "going" as AthleteStatus,
      },
      {
        id: "ath3",
        name: "Ava Mitchell",
        level: "Level 6",
        primaryEvents: ["Bars", "Beam", "Floor"],
        parentName: "Sarah Mitchell",
        parentPhone: "(815) 555-0167",
        parentEmail: "smitchell@email.com",
        medicalNotes: "Asthma - inhaler in bag",
        status: "maybe" as AthleteStatus,
      },
      {
        id: "ath4",
        name: "Sophia Williams",
        level: "Level 5",
        primaryEvents: ["Vault", "Bars"],
        parentName: "Michael Williams",
        parentPhone: "(815) 555-0298",
        parentEmail: "mwilliams@email.com",
        medicalNotes: "",
        status: "pending" as AthleteStatus,
      },
      {
        id: "ath5",
        name: "Isabella Martinez",
        level: "Level 7",
        primaryEvents: ["Beam", "Floor"],
        parentName: "Carmen Martinez",
        parentPhone: "(815) 555-0345",
        parentEmail: "carmen.m@email.com",
        medicalNotes: "",
        status: "late" as AthleteStatus,
      },
    ] as Athlete[],
    showMedical: false,
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const athletes: Athlete[] = state?.athletes || [];
    const addAthlete = () => {
      setState((s: any) => ({
        ...s,
        athletes: [
          ...(s?.athletes || []),
          {
            id: genId(),
            name: "",
            level: "Level 4",
            primaryEvents: [],
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            medicalNotes: "",
            status: "pending" as AthleteStatus,
          },
        ],
      }));
    };
    const updateAthlete = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).map((a: Athlete) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    };
    const removeAthlete = (id: string) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).filter((a: Athlete) => a.id !== id),
      }));
    };
    const toggleEvent = (id: string, event: string) => {
      setState((s: any) => ({
        ...s,
        athletes: (s?.athletes || []).map((a: Athlete) => {
          if (a.id !== id) return a;
          const events = a.primaryEvents || [];
          return {
            ...a,
            primaryEvents: events.includes(event)
              ? events.filter((e) => e !== event)
              : [...events, event],
          };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-purple-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-purple-900">Team Roster</h4>
              <p className="text-sm text-purple-700">
                Add athletes with their levels, events, and parent contact info
                for attendance tracking.
              </p>
            </div>
          </div>
        </div>

        {athletes.map((athlete, idx) => (
          <div
            key={athlete.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Athlete #{idx + 1}
              </span>
              <button
                onClick={() => removeAthlete(athlete.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Athlete Name *
                </label>
                <input
                  className={inputClass}
                  placeholder="Sarah Johnson"
                  value={athlete.name}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Level
                </label>
                <select
                  className={inputClass}
                  value={athlete.level}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "level", e.target.value)
                  }
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  className={`${inputClass} ${
                    athlete.status === "going"
                      ? "bg-green-50 border-green-300"
                      : athlete.status === "not_going"
                      ? "bg-red-50 border-red-300"
                      : athlete.status === "maybe"
                      ? "bg-yellow-50 border-yellow-300"
                      : athlete.status === "late"
                      ? "bg-orange-50 border-orange-300"
                      : ""
                  }`}
                  value={athlete.status}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "status", e.target.value)
                  }
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="going">✓ Going</option>
                  <option value="not_going">✗ Not Going</option>
                  <option value="maybe">? Maybe</option>
                  <option value="late">⏰ Late Arrival</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Primary Events
              </label>
              <div className="flex flex-wrap gap-2">
                {APPARATUS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(athlete.id, event)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (athlete.primaryEvents || []).includes(event)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                    }`}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Parent/Guardian Contact
              </label>
              <div className="grid grid-cols-1 gap-3">
                <input
                  className={inputClass}
                  placeholder="Parent Name"
                  value={athlete.parentName}
                  onChange={(e) =>
                    updateAthlete(athlete.id, "parentName", e.target.value)
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Phone"
                    type="tel"
                    value={athlete.parentPhone}
                    onChange={(e) =>
                      updateAthlete(athlete.id, "parentPhone", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Email"
                    type="email"
                    value={athlete.parentEmail}
                    onChange={(e) =>
                      updateAthlete(athlete.id, "parentEmail", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Medical Notes (optional)
              </label>
              <textarea
                className={textareaClass}
                placeholder="Allergies, injuries, restrictions..."
                value={athlete.medicalNotes}
                onChange={(e) =>
                  updateAthlete(athlete.id, "medicalNotes", e.target.value)
                }
                rows={2}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addAthlete}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Athlete
        </button>

        {athletes.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-700 mb-2">
              Attendance Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              {[
                {
                  status: "going",
                  label: "Going",
                  color: "bg-green-100 text-green-700",
                },
                {
                  status: "not_going",
                  label: "Not Going",
                  color: "bg-red-100 text-red-700",
                },
                {
                  status: "maybe",
                  label: "Maybe",
                  color: "bg-yellow-100 text-yellow-700",
                },
                {
                  status: "late",
                  label: "Late",
                  color: "bg-orange-100 text-orange-700",
                },
                {
                  status: "pending",
                  label: "Pending",
                  color: "bg-slate-100 text-slate-700",
                },
              ].map(({ status, label, color }) => (
                <div key={status} className={`${color} rounded-lg p-2`}>
                  <div className="text-lg font-bold">
                    {athletes.filter((a) => a.status === status).length}
                  </div>
                  <div className="text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
    const athletes: Athlete[] = state?.athletes || [];
    if (athletes.length === 0) return null;

    const statusIcon = (s: AthleteStatus) => {
      switch (s) {
        case "going":
          return "✓";
        case "not_going":
          return "✗";
        case "maybe":
          return "?";
        case "late":
          return "⏰";
        default:
          return "⏳";
      }
    };
    const statusColor = (s: AthleteStatus) => {
      switch (s) {
        case "going":
          return "bg-green-500/20 text-green-200";
        case "not_going":
          return "bg-red-500/20 text-red-200";
        case "maybe":
          return "bg-yellow-500/20 text-yellow-200";
        case "late":
          return "bg-orange-500/20 text-orange-200";
        default:
          return "bg-white/10 text-white/60";
      }
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Team Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className={`font-semibold ${textClass}`}
                    style={bodyShadow}
                  >
                    {athlete.name || "Unnamed"}
                  </div>
                  <div
                    className={`text-sm opacity-70 ${textClass}`}
                    style={bodyShadow}
                  >
                    {athlete.level} •{" "}
                    {(athlete.primaryEvents || []).join(", ") || "All events"}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                    athlete.status
                  )}`}
                >
                  {statusIcon(athlete.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-4 flex items-center gap-4 text-sm opacity-70"
          style={bodyShadow}
        >
          <span className={textClass}>
            {athletes.filter((a) => a.status === "going").length} confirmed
          </span>
          <span className={textClass}>
            {athletes.filter((a) => a.status === "pending").length} pending
          </span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: MEET SPECIFICS
// ═══════════════════════════════════════════════════════════════════════════

const meetSection = {
  id: "meet",
  menuTitle: "Meet Details",
  menuDesc: "Warm-up, march-in, rotation order, judging notes.",
  initialState: {
    sessionNumber: "Session 2 - Level 5-7",
    warmUpTime: "10:30",
    marchInTime: "11:15",
    startApparatus: "Bars",
    rotationOrder: ["Bars", "Beam", "Floor", "Vault"],
    judgingNotes:
      "This is a sanctioned USAG meet. Judges are from Region 5. Remember: salute before and after each routine. Deductions for steps on dismounts. No chalk on beam except hands. Good luck, team!",
    scoresLink: "https://meetscoresonline.com/results/2025-illinois-state-inv",
  } as MeetInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const meet: MeetInfo = state || {};

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    const moveApparatus = (from: number, to: number) => {
      const order = [...(meet.rotationOrder || APPARATUS)];
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      updateField("rotationOrder", order);
    };

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900">Meet Day Details</h4>
              <p className="text-sm text-amber-700">
                Competition specifics to share with athletes and parents.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Session Number
            </label>
            <input
              className={inputClass}
              placeholder="Session 2"
              value={meet.sessionNumber || ""}
              onChange={(e) => updateField("sessionNumber", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Start Apparatus
            </label>
            <select
              className={inputClass}
              value={meet.startApparatus || "Vault"}
              onChange={(e) => updateField("startApparatus", e.target.value)}
            >
              {APPARATUS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Warm-up Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={meet.warmUpTime || ""}
              onChange={(e) => updateField("warmUpTime", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              March-in Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={meet.marchInTime || ""}
              onChange={(e) => updateField("marchInTime", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Rotation Order
          </label>
          <div className="space-y-2">
            {(meet.rotationOrder || APPARATUS).map((apparatus, idx) => (
              <div
                key={apparatus}
                className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200"
              >
                <GripVertical size={16} className="text-slate-400" />
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-slate-700">
                  {apparatus}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => idx > 0 && moveApparatus(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => idx < 3 && moveApparatus(idx, idx + 1)}
                    disabled={idx === 3}
                    className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Judging Panel / Notes
          </label>
          <textarea
            className={textareaClass}
            placeholder="Head judge expectations, deduction reminders, presentation tips..."
            value={meet.judgingNotes || ""}
            onChange={(e) => updateField("judgingNotes", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Live Scores Link
          </label>
          <input
            className={inputClass}
            placeholder="https://meetscoresonline.com/..."
            type="url"
            value={meet.scoresLink || ""}
            onChange={(e) => updateField("scoresLink", e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Link to live scoring (MeetScoresOnline, MyUSAGym, etc.)
          </p>
        </div>
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
    const meet: MeetInfo = state || {};
    const hasData =
      meet.sessionNumber ||
      meet.warmUpTime ||
      meet.marchInTime ||
      meet.judgingNotes;
    if (!hasData) return null;

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
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Meet Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {meet.sessionNumber && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Session
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {meet.sessionNumber}
              </div>
            </div>
          )}
          {meet.warmUpTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Warm-up
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(meet.warmUpTime)}
              </div>
            </div>
          )}
          {meet.marchInTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                March-in
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(meet.marchInTime)}
              </div>
            </div>
          )}
          {meet.startApparatus && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Start
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {meet.startApparatus}
              </div>
            </div>
          )}
        </div>
        {(meet.rotationOrder?.length || 0) > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span
              className={`text-sm opacity-70 ${textClass}`}
              style={bodyShadow}
            >
              Rotation:
            </span>
            {(meet.rotationOrder || APPARATUS).map((a, i) => (
              <React.Fragment key={a}>
                <span
                  className={`px-2 py-1 bg-white/10 rounded text-sm ${textClass}`}
                >
                  {a}
                </span>
                {i < 3 && <span className={`opacity-50 ${textClass}`}>→</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        {meet.judgingNotes && (
          <div
            className={`text-sm opacity-80 whitespace-pre-wrap ${textClass}`}
            style={bodyShadow}
          >
            {meet.judgingNotes}
          </div>
        )}
        {meet.scoresLink && (
          <a
            href={meet.scoresLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
          >
            <ExternalLink size={16} />
            View Live Scores
          </a>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: PRACTICE PLANNER
// ═══════════════════════════════════════════════════════════════════════════

const practiceSection = {
  id: "practice",
  menuTitle: "Practice Planner",
  menuDesc: "Weekly schedule, apparatus focus, skill goals.",
  initialState: {
    blocks: [
      {
        id: "prac1",
        day: "Tuesday",
        startTime: "16:30",
        endTime: "19:30",
        focus: ["Vault", "Bars"],
        skillGoals:
          "Vault: Handspring drills, board work. Bars: Giants, clear hip to handstand, release moves for Level 6+",
        equipment: "Grips, panel mats, vault board",
        assignments: "10 min conditioning circuit at end",
      },
      {
        id: "prac2",
        day: "Thursday",
        startTime: "16:30",
        endTime: "19:30",
        focus: ["Beam", "Floor"],
        skillGoals:
          "Beam: Series connections, back walkover, dismounts. Floor: Tumbling passes, dance through, leap series",
        equipment: "Beam shoes optional, floor music USB",
        assignments: "Full routines x3 each apparatus",
      },
      {
        id: "prac3",
        day: "Saturday",
        startTime: "09:00",
        endTime: "12:00",
        focus: ["Vault", "Bars", "Beam", "Floor"],
        skillGoals:
          "Mock meet format - full routines on all apparatus. Judges present for feedback.",
        equipment: "Competition leos, grips, all equipment",
        assignments: "Competition simulation - treat like meet day",
      },
    ] as PracticeBlock[],
    excusedAthletes: [] as string[],
    modifiedTraining: [] as { athleteId: string; notes: string }[],
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
            endTime: "19:00",
            focus: [],
            skillGoals: "",
            equipment: "",
            assignments: "",
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

    const toggleFocus = (id: string, apparatus: string) => {
      setState((s: any) => ({
        ...s,
        blocks: (s?.blocks || []).map((b: PracticeBlock) => {
          if (b.id !== id) return b;
          const focus = b.focus || [];
          return {
            ...b,
            focus: focus.includes(apparatus)
              ? focus.filter((f) => f !== apparatus)
              : [...focus, apparatus],
          };
        }),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="text-emerald-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-emerald-900">
                Weekly Practice Plan
              </h4>
              <p className="text-sm text-emerald-700">
                Define practice blocks with apparatus focus and skill
                objectives.
              </p>
            </div>
          </div>
        </div>

        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Practice Block #{idx + 1}
              </span>
              <button
                onClick={() => removeBlock(block.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                Apparatus Focus
              </label>
              <div className="flex flex-wrap gap-2">
                {APPARATUS.map((apparatus) => (
                  <button
                    key={apparatus}
                    type="button"
                    onClick={() => toggleFocus(block.id, apparatus)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (block.focus || []).includes(apparatus)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400"
                    }`}
                  >
                    {apparatus}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Skill Goals
              </label>
              <textarea
                className={textareaClass}
                placeholder="Back walkover on beam, giants on bars, Yurchenko drills..."
                value={block.skillGoals}
                onChange={(e) =>
                  updateBlock(block.id, "skillGoals", e.target.value)
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Required Equipment
                </label>
                <input
                  className={inputClass}
                  placeholder="Grips, panel mats..."
                  value={block.equipment}
                  onChange={(e) =>
                    updateBlock(block.id, "equipment", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Special Assignments
                </label>
                <input
                  className={inputClass}
                  placeholder="Conditioning, flexibility..."
                  value={block.assignments}
                  onChange={(e) =>
                    updateBlock(block.id, "assignments", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBlock}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Practice Block
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
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Practice Schedule
        </h2>
        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`font-semibold ${textClass}`}
                  style={bodyShadow}
                >
                  {block.day}
                </div>
                <div
                  className={`text-sm opacity-80 ${textClass}`}
                  style={bodyShadow}
                >
                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                </div>
              </div>
              {(block.focus?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {block.focus.map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 bg-white/10 rounded text-xs"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {block.skillGoals && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  {block.skillGoals}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: LOGISTICS
// ═══════════════════════════════════════════════════════════════════════════

const logisticsSection = {
  id: "logistics",
  menuTitle: "Logistics & Travel",
  menuDesc: "Transport, hotel, meals, fees, waivers.",
  initialState: {
    travelMode: "carpool",
    callTime: "07:30",
    pickupWindow: "5:00 - 5:30 PM",
    hotelName: "Hampton Inn Normal",
    hotelAddress: "310 S Greenbriar Dr, Normal, IL 61761",
    hotelCheckIn: "15:00",
    mealPlan:
      "Team dinner at Olive Garden, 6:00 PM Friday. Breakfast at hotel included Saturday.",
    feeDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    feeAmount: "$125 per athlete",
    paymentLink: "https://niugymnastics.teamsnap.com/payments",
    waiverLinks: [
      "https://usagym.org/waiver/2025",
      "https://forms.gle/travel-permission-2025",
    ],
  } as LogisticsInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const logistics: LogisticsInfo = state || {};

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    const addWaiverLink = () => {
      setState((s: any) => ({
        ...s,
        waiverLinks: [...(s?.waiverLinks || []), ""],
      }));
    };

    const updateWaiverLink = (idx: number, value: string) => {
      setState((s: any) => ({
        ...s,
        waiverLinks: (s?.waiverLinks || []).map((l: string, i: number) =>
          i === idx ? value : l
        ),
      }));
    };

    const removeWaiverLink = (idx: number) => {
      setState((s: any) => ({
        ...s,
        waiverLinks: (s?.waiverLinks || []).filter(
          (_: string, i: number) => i !== idx
        ),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bus className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">
                Travel & Logistics
              </h4>
              <p className="text-sm text-blue-700">
                Transportation, accommodations, and administrative details.
              </p>
            </div>
          </div>
        </div>

        {/* Travel */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Car size={18} /> Transportation
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Travel Mode
              </label>
              <select
                className={inputClass}
                value={logistics.travelMode || "parent_drive"}
                onChange={(e) => updateField("travelMode", e.target.value)}
              >
                <option value="bus">Team Bus</option>
                <option value="parent_drive">Parent Drive</option>
                <option value="carpool">Carpool</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Call Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={logistics.callTime || ""}
                  onChange={(e) => updateField("callTime", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pickup Window
                </label>
                <input
                  className={inputClass}
                  placeholder="5:00-5:30 PM"
                  value={logistics.pickupWindow || ""}
                  onChange={(e) => updateField("pickupWindow", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hotel */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={18} /> Accommodations
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <input
              className={inputClass}
              placeholder="Hotel Name"
              value={logistics.hotelName || ""}
              onChange={(e) => updateField("hotelName", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Hotel Address"
              value={logistics.hotelAddress || ""}
              onChange={(e) => updateField("hotelAddress", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Check-in Time
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={logistics.hotelCheckIn || ""}
                  onChange={(e) => updateField("hotelCheckIn", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Meal Plan
                </label>
                <input
                  className={inputClass}
                  placeholder="Team dinner at 6 PM"
                  value={logistics.mealPlan || ""}
                  onChange={(e) => updateField("mealPlan", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText size={18} /> Fees & Forms
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fee Amount
              </label>
              <input
                className={inputClass}
                placeholder="$125"
                value={logistics.feeAmount || ""}
                onChange={(e) => updateField("feeAmount", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Due Date
              </label>
              <input
                type="date"
                className={inputClass}
                value={logistics.feeDueDate || ""}
                onChange={(e) => updateField("feeDueDate", e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Payment Link
            </label>
            <input
              className={inputClass}
              placeholder="https://payment.link/..."
              type="url"
              value={logistics.paymentLink || ""}
              onChange={(e) => updateField("paymentLink", e.target.value)}
            />
          </div>

          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Waiver / Form Links
          </label>
          {(logistics.waiverLinks || []).map((link: string, idx: number) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                className={inputClass}
                placeholder="https://form.link/..."
                value={link}
                onChange={(e) => updateWaiverLink(idx, e.target.value)}
              />
              <button
                onClick={() => removeWaiverLink(idx)}
                className="text-red-400 hover:text-red-600 p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addWaiverLink}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus size={14} /> Add waiver link
          </button>
        </div>
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
    const logistics: LogisticsInfo = state || {};
    const hasData =
      logistics.travelMode || logistics.hotelName || logistics.feeAmount;
    if (!hasData) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    const travelLabels: Record<string, string> = {
      bus: "Team Bus",
      parent_drive: "Parent Drive",
      carpool: "Carpool",
      other: "Other",
    };

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Logistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {logistics.travelMode && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Car size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Transportation
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {travelLabels[logistics.travelMode] || logistics.travelMode}
              </div>
              {logistics.callTime && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Call time: {formatTime(logistics.callTime)}
                </div>
              )}
            </div>
          )}
          {logistics.hotelName && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Hotel
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {logistics.hotelName}
              </div>
              {logistics.hotelAddress && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  {logistics.hotelAddress}
                </div>
              )}
            </div>
          )}
          {logistics.feeAmount && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Fee
                </span>
              </div>
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {logistics.feeAmount}
              </div>
              {logistics.feeDueDate && (
                <div
                  className={`text-sm opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Due: {new Date(logistics.feeDueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
          {logistics.mealPlan && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="opacity-70" />
                <span
                  className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                  style={bodyShadow}
                >
                  Meals
                </span>
              </div>
              <div className={`text-sm ${textClass}`} style={bodyShadow}>
                {logistics.mealPlan}
              </div>
            </div>
          )}
        </div>
        {(logistics.paymentLink ||
          (logistics.waiverLinks?.length || 0) > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {logistics.paymentLink && (
              <a
                href={logistics.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
              >
                <LinkIcon size={16} />
                Pay Fees
              </a>
            )}
            {(logistics.waiverLinks || []).map(
              (link: string, idx: number) =>
                link && (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
                  >
                    <FileText size={16} />
                    Form #{idx + 1}
                  </a>
                )
            )}
          </div>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: GEAR & UNIFORM CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const gearSection = {
  id: "gear",
  menuTitle: "Gear & Uniform",
  menuDesc: "Leotard, grips, equipment checklist.",
  initialState: {
    leotardOfDay:
      "Navy blue competition leotard with silver accents. Team warm-up jacket and black leggings for march-in.",
    hairMakeupNotes:
      "High bun secured with navy scrunchie. Light natural makeup allowed - no glitter. Remove all jewelry including stud earrings.",
    musicFileLink:
      "https://drive.google.com/drive/folders/niu-floor-music-2025",
    items: [
      {
        id: "gear1",
        name: "Competition Leotard (Navy/Silver)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear2",
        name: "Team Warm-up Jacket",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear3",
        name: "Black Leggings",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear4",
        name: "Dowel Grips (bars)",
        required: false,
        acknowledged: false,
      },
      { id: "gear5", name: "Beam Shoes", required: false, acknowledged: false },
      {
        id: "gear6",
        name: "Pre-wrap & Athletic Tape",
        required: false,
        acknowledged: false,
      },
      {
        id: "gear7",
        name: "Hair Kit (bobby pins, gel, hairspray)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear8",
        name: "White Ankle Socks",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear9",
        name: "Water Bottle (labeled)",
        required: true,
        acknowledged: false,
      },
      {
        id: "gear10",
        name: "Snacks (nothing messy)",
        required: false,
        acknowledged: false,
      },
    ] as GearItem[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const items: GearItem[] = state?.items || [];

    const addItem = () => {
      setState((s: any) => ({
        ...s,
        items: [
          ...(s?.items || []),
          { id: genId(), name: "", required: false, acknowledged: false },
        ],
      }));
    };

    const updateItem = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).map((item: GearItem) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    };

    const removeItem = (id: string) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).filter((item: GearItem) => item.id !== id),
      }));
    };

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shirt className="text-pink-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-pink-900">Gear & Uniform</h4>
              <p className="text-sm text-pink-700">
                Equipment checklist and uniform requirements for meet day.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Leotard of the Day
          </label>
          <input
            className={inputClass}
            placeholder="Red competition leo, Team warm-ups..."
            value={state?.leotardOfDay || ""}
            onChange={(e) => updateField("leotardOfDay", e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Hair & Makeup Notes
          </label>
          <textarea
            className={textareaClass}
            placeholder="High bun with team scrunchie, natural makeup, no glitter..."
            value={state?.hairMakeupNotes || ""}
            onChange={(e) => updateField("hairMakeupNotes", e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Floor Music Link
          </label>
          <input
            className={inputClass}
            placeholder="https://drive.google.com/..."
            type="url"
            value={state?.musicFileLink || ""}
            onChange={(e) => updateField("musicFileLink", e.target.value)}
          />
        </div>

        <div className="border-t pt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Equipment Checklist
          </label>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200"
              >
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    updateItem(item.id, "required", e.target.checked)
                  }
                  className="w-4 h-4 text-pink-600"
                />
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                />
                <span className="text-xs text-slate-400">
                  {item.required ? "Required" : "Optional"}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-sm text-pink-600 hover:text-pink-800 flex items-center gap-1"
          >
            <Plus size={14} /> Add item
          </button>
        </div>
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
    const items: GearItem[] = state?.items || [];
    const hasData = state?.leotardOfDay || items.length > 0;
    if (!hasData) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Gear Checklist
        </h2>
        {state?.leotardOfDay && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <div
              className={`text-xs uppercase tracking-wide opacity-70 mb-1 ${textClass}`}
              style={bodyShadow}
            >
              Uniform
            </div>
            <div className={`font-semibold ${textClass}`} style={bodyShadow}>
              {state.leotardOfDay}
            </div>
            {state.hairMakeupNotes && (
              <div
                className={`text-sm opacity-70 mt-1 ${textClass}`}
                style={bodyShadow}
              >
                {state.hairMakeupNotes}
              </div>
            )}
          </div>
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {items
              .filter((i) => i.name)
              .map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    item.required ? "bg-pink-500/20" : "bg-white/5"
                  }`}
                >
                  <CheckSquare size={14} className="opacity-70" />
                  <span className={`text-sm ${textClass}`} style={bodyShadow}>
                    {item.name}
                  </span>
                  {item.required && (
                    <span className="text-xs bg-pink-500/30 px-1.5 py-0.5 rounded">
                      *
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}
        {state?.musicFileLink && (
          <a
            href={state.musicFileLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
          >
            <Download size={16} />
            Download Floor Music
          </a>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: VOLUNTEERS & CARPOOL
// ═══════════════════════════════════════════════════════════════════════════

const volunteersSection = {
  id: "volunteers",
  menuTitle: "Volunteers & Carpool",
  menuDesc: "Sign up for roles, coordinate rides.",
  initialState: {
    volunteerSlots: [
      { id: "vol1", role: "Timer", name: "Sofia Rodriguez", filled: true },
      { id: "vol2", role: "Timer", name: "", filled: false },
      {
        id: "vol3",
        role: "Score Flasher",
        name: "Jennifer Chen",
        filled: true,
      },
      { id: "vol4", role: "Score Flasher", name: "", filled: false },
      { id: "vol5", role: "Chaperone", name: "Sarah Mitchell", filled: true },
      { id: "vol6", role: "Check-in", name: "", filled: false },
      {
        id: "vol7",
        role: "Hospitality",
        name: "Carmen Martinez",
        filled: true,
      },
      { id: "vol8", role: "Photography", name: "", filled: false },
    ] as VolunteerSlot[],
    carpoolOffers: [
      {
        id: "cp1",
        driverName: "Michael Williams",
        phone: "(815) 555-0298",
        seatsAvailable: 3,
        departureLocation: "NIU Recreation Center parking lot",
        departureTime: "07:00",
      },
      {
        id: "cp2",
        driverName: "Sofia Rodriguez",
        phone: "(815) 555-0189",
        seatsAvailable: 2,
        departureLocation: "Target parking lot, DeKalb",
        departureTime: "07:15",
      },
    ] as CarpoolOffer[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const slots: VolunteerSlot[] = state?.volunteerSlots || [];
    const carpools: CarpoolOffer[] = state?.carpoolOffers || [];

    const addSlot = () => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: [
          ...(s?.volunteerSlots || []),
          { id: genId(), role: "Timer", name: "", filled: false },
        ],
      }));
    };

    const updateSlot = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: (s?.volunteerSlots || []).map((slot: VolunteerSlot) =>
          slot.id === id ? { ...slot, [field]: value } : slot
        ),
      }));
    };

    const removeSlot = (id: string) => {
      setState((s: any) => ({
        ...s,
        volunteerSlots: (s?.volunteerSlots || []).filter(
          (slot: VolunteerSlot) => slot.id !== id
        ),
      }));
    };

    const addCarpool = () => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: [
          ...(s?.carpoolOffers || []),
          {
            id: genId(),
            driverName: "",
            phone: "",
            seatsAvailable: 2,
            departureLocation: "",
            departureTime: "",
          },
        ],
      }));
    };

    const updateCarpool = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: (s?.carpoolOffers || []).map((cp: CarpoolOffer) =>
          cp.id === id ? { ...cp, [field]: value } : cp
        ),
      }));
    };

    const removeCarpool = (id: string) => {
      setState((s: any) => ({
        ...s,
        carpoolOffers: (s?.carpoolOffers || []).filter(
          (cp: CarpoolOffer) => cp.id !== id
        ),
      }));
    };

    return (
      <div className="space-y-6">
        {/* Volunteers */}
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-orange-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-orange-900">
                Volunteer Sign-ups
              </h4>
              <p className="text-sm text-orange-700">
                Timer, score flasher, chaperone, and other meet roles.
              </p>
            </div>
          </div>
        </div>

        {slots.map((slot, idx) => (
          <div
            key={slot.id}
            className="border border-slate-200 rounded-lg p-3 bg-white flex items-center gap-3"
          >
            <select
              className={`${inputClass} flex-shrink-0 w-36`}
              value={slot.role}
              onChange={(e) => updateSlot(slot.id, "role", e.target.value)}
            >
              {VOLUNTEER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              className={`${inputClass} flex-1`}
              placeholder="Volunteer name"
              value={slot.name}
              onChange={(e) => updateSlot(slot.id, "name", e.target.value)}
            />
            <button
              type="button"
              onClick={() => updateSlot(slot.id, "filled", !slot.filled)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                slot.filled
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {slot.filled ? "✓ Filled" : "Open"}
            </button>
            <button
              onClick={() => removeSlot(slot.id)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSlot}
          className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Volunteer Slot
        </button>

        {/* Carpool */}
        <div className="border-t pt-6">
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Car className="text-cyan-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-cyan-900">
                  Carpool Coordination
                </h4>
                <p className="text-sm text-cyan-700">
                  Offers from drivers with available seats.
                </p>
              </div>
            </div>
          </div>

          {carpools.map((cp) => (
            <div
              key={cp.id}
              className="border border-slate-200 rounded-xl p-4 mb-3 bg-white space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Carpool Offer
                </span>
                <button
                  onClick={() => removeCarpool(cp.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="Driver Name"
                  value={cp.driverName}
                  onChange={(e) =>
                    updateCarpool(cp.id, "driverName", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Phone"
                  type="tel"
                  value={cp.phone}
                  onChange={(e) =>
                    updateCarpool(cp.id, "phone", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    className={inputClass}
                    value={cp.seatsAvailable}
                    onChange={(e) =>
                      updateCarpool(
                        cp.id,
                        "seatsAvailable",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">
                    Departure
                  </label>
                  <input
                    type="time"
                    className={inputClass}
                    value={cp.departureTime}
                    onChange={(e) =>
                      updateCarpool(cp.id, "departureTime", e.target.value)
                    }
                  />
                </div>
              </div>
              <input
                className={inputClass}
                placeholder="Departure location"
                value={cp.departureLocation}
                onChange={(e) =>
                  updateCarpool(cp.id, "departureLocation", e.target.value)
                }
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addCarpool}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-cyan-400 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Carpool Offer
          </button>
        </div>
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
    const slots: VolunteerSlot[] = state?.volunteerSlots || [];
    const carpools: CarpoolOffer[] = state?.carpoolOffers || [];
    if (slots.length === 0 && carpools.length === 0) return null;

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
        {slots.length > 0 && (
          <>
            <h2
              className={`text-2xl mb-4 ${accentClass}`}
              style={{ ...headingShadow, ...(titleColor || {}) }}
            >
              Volunteers Needed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                    slot.filled
                      ? "bg-green-500/20"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <span
                    className={`font-medium ${textClass}`}
                    style={bodyShadow}
                  >
                    {slot.role}
                  </span>
                  {slot.filled ? (
                    <span
                      className={`text-sm opacity-80 ${textClass}`}
                      style={bodyShadow}
                    >
                      ✓ {slot.name || "Filled"}
                    </span>
                  ) : (
                    <span className="text-sm px-2 py-1 bg-orange-500/30 rounded text-orange-200">
                      Open
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {carpools.length > 0 && (
          <>
            <h2
              className={`text-2xl mb-4 ${accentClass}`}
              style={{ ...headingShadow, ...(titleColor || {}) }}
            >
              Carpool Offers
            </h2>
            <div className="space-y-3">
              {carpools
                .filter((c) => c.driverName)
                .map((cp) => (
                  <div
                    key={cp.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`font-semibold ${textClass}`}
                        style={bodyShadow}
                      >
                        {cp.driverName}
                      </div>
                      <span className="px-2 py-1 bg-cyan-500/30 rounded text-cyan-200 text-sm">
                        {cp.seatsAvailable} seat
                        {cp.seatsAvailable !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className={`text-sm opacity-70 ${textClass}`}
                      style={bodyShadow}
                    >
                      {cp.departureLocation && (
                        <span>{cp.departureLocation}</span>
                      )}
                      {cp.departureTime && (
                        <span> • {formatTime(cp.departureTime)}</span>
                      )}
                    </div>
                    {cp.phone && (
                      <a
                        href={`tel:${cp.phone}`}
                        className={`inline-flex items-center gap-1 text-sm mt-2 opacity-80 hover:opacity-100 ${textClass}`}
                      >
                        <Phone size={14} /> {cp.phone}
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: ANNOUNCEMENTS & REMINDERS
// ═══════════════════════════════════════════════════════════════════════════

const announcementsSection = {
  id: "announcements",
  menuTitle: "Announcements",
  menuDesc: "Updates, reminders, schedule changes.",
  initialState: {
    announcements: [
      {
        id: "ann1",
        text: "SCHEDULE CHANGE: Our session has been moved from 9:00 AM to 11:15 AM due to the Level 3-4 session running long. Please adjust your arrival time accordingly. New warm-up time is 10:30 AM.",
        priority: "urgent" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ann2",
        text: "Reminder: All athletes must have their competition hair and makeup done BEFORE arriving at the venue. We will not have time for touch-ups. Please arrive with hair secured in a high bun with the navy scrunchie.",
        priority: "normal" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ann3",
        text: "We still need 2 more timers and 1 score flasher for this meet. Please sign up using the Volunteers section above if you can help! Training will be provided on-site.",
        priority: "normal" as const,
        createdAt: new Date().toISOString(),
      },
    ] as {
      id: string;
      text: string;
      priority: "normal" | "urgent";
      createdAt: string;
    }[],
  },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const announcements = state?.announcements || [];

    const addAnnouncement = () => {
      setState((s: any) => ({
        ...s,
        announcements: [
          ...(s?.announcements || []),
          {
            id: genId(),
            text: "",
            priority: "normal",
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    };

    const updateAnnouncement = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        announcements: (s?.announcements || []).map((a: any) =>
          a.id === id ? { ...a, [field]: value } : a
        ),
      }));
    };

    const removeAnnouncement = (id: string) => {
      setState((s: any) => ({
        ...s,
        announcements: (s?.announcements || []).filter((a: any) => a.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="text-red-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-red-900">Announcements</h4>
              <p className="text-sm text-red-700">
                Important updates, schedule changes, reminders for parents.
              </p>
            </div>
          </div>
        </div>

        {announcements.map((ann: any, idx: number) => (
          <div
            key={ann.id}
            className={`border rounded-xl p-4 space-y-3 ${
              ann.priority === "urgent"
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Announcement #{idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateAnnouncement(
                      ann.id,
                      "priority",
                      ann.priority === "urgent" ? "normal" : "urgent"
                    )
                  }
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    ann.priority === "urgent"
                      ? "bg-red-200 text-red-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ann.priority === "urgent" ? "🚨 Urgent" : "Normal"}
                </button>
                <button
                  onClick={() => removeAnnouncement(ann.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <textarea
              className={textareaClass}
              placeholder="Type your announcement..."
              value={ann.text}
              onChange={(e) =>
                updateAnnouncement(ann.id, "text", e.target.value)
              }
              rows={3}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAnnouncement}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Announcement
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
    const announcements =
      state?.announcements?.filter((a: any) => a.text) || [];
    if (announcements.length === 0) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Announcements
        </h2>
        <div className="space-y-3">
          {announcements.map((ann: any) => (
            <div
              key={ann.id}
              className={`rounded-lg p-4 ${
                ann.priority === "urgent"
                  ? "bg-red-500/20 border border-red-400/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              {ann.priority === "urgent" && (
                <div className="flex items-center gap-2 mb-2 text-red-200">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold uppercase">Urgent</span>
                </div>
              )}
              <p
                className={`whitespace-pre-wrap ${textClass}`}
                style={bodyShadow}
              >
                {ann.text}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const config = {
  slug: "gymnastics-schedule",
  displayName: "Gymnastics Schedule",
  category: "sport_gymnastics_schedule",
  categoryLabel: "Gymnastics",
  themesExpandedByDefault: false,
  defaultHero: "/templates/hero-images/gymnastics-hero.jpeg",
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Response settings for athletes.",
    editorTitle: "Confirm Attendance",
    toggleLabel: "Enable Attendance RSVP",
    deadlineLabel: "Response Deadline",
    helperText: "Athletes/parents can confirm attendance status.",
  },
  prefill: {
    title: "Illinois State Invitational",
    venue: "Redbird Arena",
    address: "200 N University St, Normal, IL 61761",
    city: "Normal",
    state: "IL",
    details:
      "Level 4-7 compulsory and optional competition. Athletes should arrive 90 minutes before session start for team warm-up. Parents are welcome to watch from the stands. Concessions available.",
    extra: {
      team: "Northern Illinois Gymnastics",
      season: "2025 Season",
      primaryVenue: "Redbird Arena, Normal IL",
      coach: "Coach Maria Rivera",
      assistantCoach: "Coach Jessica Thompson",
      coachPhone: "(815) 555-0142",
    },
  },
  detailFields: [
    { key: "team", label: "Team", placeholder: "NIU Gymnastics" },
    { key: "season", label: "Season", placeholder: "2025 Season" },
    { key: "primaryVenue", label: "Primary Venue", placeholder: "Main Gym" },
    { key: "coach", label: "Head Coach", placeholder: "Coach Rivera" },
    {
      key: "assistantCoach",
      label: "Assistant Coach",
      placeholder: "Coach Thompson",
    },
    {
      key: "coachPhone",
      label: "Coach Contact",
      placeholder: "(555) 123-4567",
    },
  ],
  themes: [
    {
      id: "electric_teal",
      name: "Electric Teal",
      bg: "bg-gradient-to-br from-slate-950 via-teal-900 to-teal-500",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-slate-950 via-teal-900 to-teal-500",
    },
    {
      id: "power_purple",
      name: "Power Purple",
      bg: "bg-gradient-to-br from-slate-950 via-purple-900 to-purple-600",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-slate-950 via-purple-900 to-purple-600",
    },
    {
      id: "flare_pink",
      name: "Flare Pink",
      bg: "bg-gradient-to-br from-slate-950 via-fuchsia-800 to-pink-500",
      text: "text-white",
      accent: "text-pink-100",
      preview: "bg-gradient-to-r from-slate-950 via-fuchsia-800 to-pink-500",
    },
    {
      id: "impact_blue",
      name: "Impact Blue",
      bg: "bg-gradient-to-br from-slate-950 via-blue-900 to-blue-600",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-slate-950 via-blue-900 to-blue-600",
    },
    {
      id: "starlight_navy",
      name: "Starlight Navy",
      bg: "bg-gradient-to-br from-blue-950 via-slate-800 to-slate-500",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-blue-950 via-slate-800 to-slate-500",
    },
    {
      id: "regal_spark",
      name: "Regal Spark",
      bg: "bg-gradient-to-br from-purple-900 via-slate-700 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-purple-900 via-slate-700 to-slate-200",
    },
    {
      id: "aqua_shine",
      name: "Aqua Shine",
      bg: "bg-gradient-to-br from-teal-900 via-cyan-700 to-slate-300",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-teal-900 via-cyan-700 to-slate-300",
    },
    {
      id: "elite_gold",
      name: "Elite Gold",
      bg: "bg-gradient-to-br from-slate-950 via-black to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-amber-500",
    },
    {
      id: "glitter_beam",
      name: "Glitter Beam",
      bg: "bg-gradient-to-br from-pink-700 via-fuchsia-600 to-slate-200",
      text: "text-slate-900",
      accent: "text-fuchsia-700",
      preview: "bg-gradient-to-r from-pink-700 via-fuchsia-600 to-slate-200",
    },
    {
      id: "edge_red",
      name: "Edge Red",
      bg: "bg-gradient-to-br from-slate-950 via-red-900 to-red-600",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-slate-950 via-red-900 to-red-600",
    },
    {
      id: "mint_motion",
      name: "Mint Motion",
      bg: "bg-gradient-to-br from-emerald-100 via-teal-50 to-white",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-100 via-teal-50 to-white",
    },
    {
      id: "aerial_amethyst",
      name: "Aerial Amethyst",
      bg: "bg-gradient-to-br from-purple-200 via-violet-100 to-white",
      text: "text-slate-900",
      accent: "text-purple-700",
      preview: "bg-gradient-to-r from-purple-200 via-violet-100 to-white",
    },
    {
      id: "turbo_turquoise",
      name: "Turbo Turquoise",
      bg: "bg-gradient-to-br from-slate-950 via-cyan-900 to-teal-500",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-950 via-cyan-900 to-teal-500",
    },
    {
      id: "galaxy_magenta",
      name: "Galaxy Magenta",
      bg: "bg-gradient-to-br from-fuchsia-700 via-purple-800 to-blue-900",
      text: "text-white",
      accent: "text-fuchsia-100",
      preview: "bg-gradient-to-r from-fuchsia-700 via-purple-800 to-blue-900",
    },
    {
      id: "pink_velocity",
      name: "Pink Velocity",
      bg: "bg-gradient-to-br from-pink-500 via-rose-500 to-blue-900",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-pink-500 via-rose-500 to-blue-900",
    },
    {
      id: "royal_spark",
      name: "Royal Spark",
      bg: "bg-gradient-to-br from-blue-900 via-blue-800 to-slate-300",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-blue-900 via-blue-800 to-slate-300",
    },
    {
      id: "neon_beam",
      name: "Neon Beam",
      bg: "bg-gradient-to-br from-slate-950 via-black to-fuchsia-600",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-fuchsia-600",
    },
    {
      id: "fire_flash",
      name: "Fire Flash",
      bg: "bg-gradient-to-br from-red-800 via-red-700 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-red-800 via-red-700 to-slate-200",
    },
    {
      id: "aurora_violet",
      name: "Aurora Violet",
      bg: "bg-gradient-to-br from-violet-900 via-purple-800 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-violet-900 via-purple-800 to-amber-500",
    },
    {
      id: "mint_surge",
      name: "Mint Surge",
      bg: "bg-gradient-to-br from-slate-950 via-black to-emerald-400",
      text: "text-white",
      accent: "text-emerald-100",
      preview: "bg-gradient-to-r from-slate-950 via-black to-emerald-400",
    },
    {
      id: "lavender_leap",
      name: "Lavender Leap",
      bg: "bg-gradient-to-br from-purple-200 via-violet-100 to-white",
      text: "text-slate-900",
      accent: "text-purple-700",
      preview: "bg-gradient-to-r from-purple-200 via-violet-100 to-white",
    },
    {
      id: "cosmic_flip",
      name: "Cosmic Flip",
      bg: "bg-gradient-to-br from-slate-950 via-purple-900 to-pink-600",
      text: "text-white",
      accent: "text-pink-200",
      preview: "bg-gradient-to-r from-slate-950 via-purple-900 to-pink-600",
    },
    {
      id: "starbound_rose",
      name: "Starbound Rose",
      bg: "bg-gradient-to-br from-blue-950 via-slate-900 to-amber-400",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-blue-950 via-slate-900 to-amber-400",
    },
    {
      id: "aqua_energy",
      name: "Aqua Energy",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-500",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-500",
    },
  ],
  advancedSections: [
    rosterSection,
    meetSection,
    practiceSection,
    logisticsSection,
    gearSection,
    volunteersSection,
    announcementsSection,
  ],
};

export {
  config,
  rosterSection,
  meetSection,
  practiceSection,
  logisticsSection,
  gearSection,
  volunteersSection,
  announcementsSection,
};
export type {
  AthleteStatus,
  Athlete,
  MeetInfo,
  PracticeBlock,
  LogisticsInfo,
  GearItem,
  VolunteerSlot,
  CarpoolOffer,
};
