// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Users,
  Trophy,
  ClipboardList,
  Bus,
  Shirt,
  Car,
  Image as ImageIcon,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  FileText,
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
  doorsOpen?: string;
  arrivalGuidance?: string;
  registrationInfo?: string;
  facilityLayout?: string;
  scoringInfo?: string;
  resultsInfo?: string;
  rotationSheetsInfo?: string;
  awardsInfo?: string;
  sessionWindows?: Array<{ date?: string; start?: string; end?: string; note?: string }>;
  operationalNotes?: string[];
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
  enabled: boolean;
  showTransportation: boolean;
  showAccommodations: boolean;
  showFees: boolean;
  showMeals: boolean;
  showAdditionalDocuments: boolean;
  travelMode: "bus" | "parent_drive" | "carpool" | "other";
  callTime: string;
  pickupWindow: string;
  hotelName: string;
  hotelAddress: string;
  hotelCheckIn: string;
  mealPlan: string;
  feeDueDate: string;
  feeAmount: string;
  gymLayoutImage?: string;
  parking?: string;
  trafficAlerts?: string;
  rideShare?: string;
  accessibility?: string;
  parkingLinks?: { label: string; url: string }[];
  parkingPricingLinks?: { label: string; url: string }[];
  additionalDocuments: {
    id: string;
    name: string;
    url: string;
    mimeType?: string;
  }[];
  waiverLinks?: string[];
};

type CoachesInfo = {
  enabled: boolean;
  signIn: string;
  attire: string;
  hospitality: string;
  floorAccess: string;
  scratches: string;
  floorMusic: string;
  rotationSheets: string;
  awards: string;
  regionalCommitment: string;
  qualification: string;
  meetFormat: string;
  equipment: string;
  refundPolicy: string;
  paymentInstructions: string;
  entryFees: Array<{ id: string; label: string; amount: string; note: string }>;
  teamFees: Array<{ id: string; label: string; amount: string; note: string }>;
  lateFees: Array<{ id: string; label: string; amount: string; trigger: string; note: string }>;
  deadlines: Array<{ id: string; label: string; date: string; note: string }>;
  contacts: Array<{ id: string; role: string; name: string; email: string; phone: string }>;
  links: Array<{ id: string; label: string; url: string }>;
  notes: string[];
};

type ScheduleClub = {
  id: string;
  name: string;
  teamAwardEligible: boolean | null;
  athleteCount: number | null;
  divisionLabel: string;
};

type ScheduleSession = {
  id: string;
  code: string;
  label: string;
  group: string;
  startTime: string;
  warmupTime: string;
  note: string;
  clubs: ScheduleClub[];
};

type ScheduleDay = {
  id: string;
  date: string;
  shortDate: string;
  isoDate?: string;
  sessions: ScheduleSession[];
};

type ScheduleInfo = {
  enabled: boolean;
  venueLabel: string;
  supportEmail: string;
  notes: string[];
  days: ScheduleDay[];
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

const SectionToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const BufferedInput = ({
  value,
  onCommit,
  className,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) => {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const commit = () => {
    const next = draft ?? "";
    const current = value ?? "";
    if (next !== current) onCommit(next);
  };

  return (
    <input
      {...props}
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
};

const BufferedTextarea = ({
  value,
  onCommit,
  className,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) => {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const commit = () => {
    const next = draft ?? "";
    const current = value ?? "";
    if (next !== current) onCommit(next);
  };

  return (
    <textarea
      {...props}
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: ROSTER & ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════

const rosterSection = {
  id: "roster",
  menuTitle: "Roster & Attendance",
  menuDesc: "Athletes, levels, parent contacts, attendance tracking.",
  initialState: {
    enabled: true,
    showAttendance: true,
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
    const isEnabled = state?.enabled !== false;
    const showAttendance = state?.showAttendance !== false;
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
        <SectionToggle
          label="Show Roster & Attendance"
          checked={isEnabled}
          onChange={(value) => setState((s: any) => ({ ...s, enabled: value }))}
        />
        <SectionToggle
          label="Show Attendance Status"
          checked={showAttendance}
          onChange={(value) =>
            setState((s: any) => ({ ...s, showAttendance: value }))
          }
        />

        {!isEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Roster & attendance are hidden from the public page.
          </div>
        ) : (
          <>
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
                <BufferedInput
                  className={inputClass}
                  placeholder="Sarah Johnson"
                  value={athlete.name}
                  onCommit={(value) => updateAthlete(athlete.id, "name", value)}
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
                <BufferedInput
                  className={inputClass}
                  placeholder="Parent Name"
                  value={athlete.parentName}
                  onCommit={(value) =>
                    updateAthlete(athlete.id, "parentName", value)
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <BufferedInput
                    className={inputClass}
                    placeholder="Phone"
                    type="tel"
                    value={athlete.parentPhone}
                    onCommit={(value) =>
                      updateAthlete(athlete.id, "parentPhone", value)
                    }
                  />
                  <BufferedInput
                    className={inputClass}
                    placeholder="Email"
                    type="email"
                    value={athlete.parentEmail}
                    onCommit={(value) =>
                      updateAthlete(athlete.id, "parentEmail", value)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Medical Notes (optional)
              </label>
              <BufferedTextarea
                className={textareaClass}
                placeholder="Allergies, injuries, restrictions..."
                value={athlete.medicalNotes}
                onCommit={(value) =>
                  updateAthlete(athlete.id, "medicalNotes", value)
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
          </>
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
    if (state?.enabled === false) return null;
    const showAttendance = state?.showAttendance !== false;
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
                {showAttendance && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                      athlete.status
                    )}`}
                  >
                    {statusIcon(athlete.status)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {showAttendance && (
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
        )}
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
    doorsOpen: "",
    arrivalGuidance: "",
    registrationInfo: "",
    facilityLayout: "",
    scoringInfo: "",
    resultsInfo: "",
    rotationSheetsInfo: "",
    awardsInfo: "",
    sessionWindows: [],
    operationalNotes: [],
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
            <BufferedInput
              className={inputClass}
              placeholder="Session 2"
              value={meet.sessionNumber || ""}
              onCommit={(value) => updateField("sessionNumber", value)}
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
          <BufferedTextarea
            className={textareaClass}
            placeholder="Head judge expectations, deduction reminders, presentation tips..."
            value={meet.judgingNotes || ""}
            onCommit={(value) => updateField("judgingNotes", value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Live Scores Link
          </label>
          <BufferedInput
            className={inputClass}
            placeholder="https://meetscoresonline.com/..."
            type="url"
            value={meet.scoresLink || ""}
            onCommit={(value) => updateField("scoresLink", value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Link to live scoring (MeetScoresOnline, MyUSAGym, etc.)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BufferedTextarea
            className={textareaClass}
            placeholder="Doors open details"
            value={meet.doorsOpen || ""}
            onCommit={(value) => updateField("doorsOpen", value)}
            rows={2}
          />
          <BufferedTextarea
            className={textareaClass}
            placeholder="Arrival guidance"
            value={meet.arrivalGuidance || ""}
            onCommit={(value) => updateField("arrivalGuidance", value)}
            rows={2}
          />
          <BufferedTextarea
            className={textareaClass}
            placeholder="Registration info"
            value={meet.registrationInfo || ""}
            onCommit={(value) => updateField("registrationInfo", value)}
            rows={2}
          />
          <BufferedTextarea
            className={textareaClass}
            placeholder="Facility layout"
            value={meet.facilityLayout || ""}
            onCommit={(value) => updateField("facilityLayout", value)}
            rows={2}
          />
          <BufferedTextarea
            className={textareaClass}
            placeholder="Results or live scoring details"
            value={meet.resultsInfo || ""}
            onCommit={(value) => updateField("resultsInfo", value)}
            rows={2}
          />
          <BufferedTextarea
            className={textareaClass}
            placeholder="Awards details"
            value={meet.awardsInfo || ""}
            onCommit={(value) => updateField("awardsInfo", value)}
            rows={2}
          />
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
      meet.judgingNotes ||
      meet.doorsOpen ||
      meet.arrivalGuidance ||
      meet.resultsInfo ||
      meet.awardsInfo;
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
        {meet.resultsInfo ? (
          <div className={`mt-3 text-sm opacity-80 whitespace-pre-wrap ${textClass}`} style={bodyShadow}>
            Results: {meet.resultsInfo}
          </div>
        ) : null}
        {meet.awardsInfo ? (
          <div className={`mt-2 text-sm opacity-80 whitespace-pre-wrap ${textClass}`} style={bodyShadow}>
            Awards: {meet.awardsInfo}
          </div>
        ) : null}
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
    enabled: true,
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
    const isEnabled = state?.enabled !== false;
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
        <SectionToggle
          label="Show Practice Schedule"
          checked={isEnabled}
          onChange={(value) => setState((s: any) => ({ ...s, enabled: value }))}
        />
        {!isEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Practice schedule is hidden from the public page.
          </div>
        ) : (
          <>
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
              <BufferedTextarea
                className={textareaClass}
                placeholder="Back walkover on beam, giants on bars, Yurchenko drills..."
                value={block.skillGoals}
                onCommit={(value) => updateBlock(block.id, "skillGoals", value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Required Equipment
                </label>
                <BufferedInput
                  className={inputClass}
                  placeholder="Grips, panel mats..."
                  value={block.equipment}
                  onCommit={(value) => updateBlock(block.id, "equipment", value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Special Assignments
                </label>
                <BufferedInput
                  className={inputClass}
                  placeholder="Conditioning, flexibility..."
                  value={block.assignments}
                  onCommit={(value) =>
                    updateBlock(block.id, "assignments", value)
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
          </>
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
    if (state?.enabled === false) return null;
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
    enabled: false,
    showTransportation: true,
    showAccommodations: true,
    showFees: true,
    showMeals: true,
    showAdditionalDocuments: true,
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
    parking: "",
    trafficAlerts: "",
    rideShare: "",
    accessibility: "",
    parkingLinks: [],
    parkingPricingLinks: [],
    gymLayoutImage: "",
    additionalDocuments: [
      {
        id: "doc1",
        name: "USAG Waiver",
        url: "https://usagym.org/waiver/2025",
      },
      {
        id: "doc2",
        name: "Travel Permission",
        url: "https://forms.gle/travel-permission-2025",
      },
    ],
  } as LogisticsInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const logistics: LogisticsInfo = state || {};
    const isEnabled = logistics.enabled !== false;
    const showTransportation = logistics.showTransportation !== false;
    const showAccommodations = logistics.showAccommodations !== false;
    const showFees = logistics.showFees !== false;
    const showMeals = logistics.showMeals !== false;
    const showAdditionalDocuments = logistics.showAdditionalDocuments !== false;

    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    const addDocument = () => {
      setState((s: any) => ({
        ...s,
        additionalDocuments: [
          ...(s?.additionalDocuments || []),
          { id: genId(), name: "", url: "" },
        ],
      }));
    };

    const updateDocument = (id: string, field: "name" | "url", value: string) => {
      setState((s: any) => ({
        ...s,
        additionalDocuments: (s?.additionalDocuments || []).map((doc: any) =>
          doc.id === id ? { ...doc, [field]: value } : doc
        ),
      }));
    };

    const removeDocument = (id: string) => {
      setState((s: any) => ({
        ...s,
        additionalDocuments: (s?.additionalDocuments || []).filter(
          (doc: any) => doc.id !== id
        ),
      }));
    };

    const handleGymLayoutUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!/^image\/(png|jpe?g|webp)$/i.test(file.type || "")) {
        window.alert("Please upload a PNG, JPG, or WEBP image.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        window.alert("Please upload an image smaller than 10MB.");
        return;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        if (!dataUrl) return;
        updateField("gymLayoutImage", dataUrl);
      } catch (err) {
        console.error("Failed to upload gym layout image", err);
        window.alert("Could not process this image. Please try another file.");
      }
    };

    const handleDocumentUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        window.alert("Please upload a file smaller than 10MB.");
        return;
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        if (!dataUrl) return;
        setState((s: any) => ({
          ...s,
          additionalDocuments: [
            ...(s?.additionalDocuments || []),
            {
              id: genId(),
              name: file.name || "Uploaded document",
              url: dataUrl,
              mimeType: file.type || undefined,
            },
          ],
        }));
      } catch (err) {
        console.error("Failed to upload additional document", err);
        window.alert("Could not process this document. Please try another file.");
      }
    };

    return (
      <div className="space-y-6">
        <SectionToggle
          label="Show Logistics & Travel"
          checked={isEnabled}
          onChange={(value) => updateField("enabled", value)}
        />
        {!isEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Logistics & travel are hidden from the public page.
          </div>
        ) : (
          <>
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
        <div className="border-t pt-4 space-y-3">
          <SectionToggle
            label="Show Transportation"
            checked={showTransportation}
            onChange={(value) => updateField("showTransportation", value)}
          />
          {showTransportation && (
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Car size={18} /> Transportation
          </h4>
          )}
          {showTransportation && (
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
                <BufferedInput
                  className={inputClass}
                  placeholder="5:00-5:30 PM"
                  value={logistics.pickupWindow || ""}
                  onCommit={(value) => updateField("pickupWindow", value)}
                />
              </div>
            </div>
          </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <ImageIcon size={18} /> Gym Layout Image (optional)
          </h4>
          <p className="text-xs text-slate-500">
            Upload a floor map/photo so families can see arena zones in the
            Facility tab.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            {logistics.gymLayoutImage ? (
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={logistics.gymLayoutImage}
                    alt="Gym layout"
                    className="w-full h-52 object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => updateField("gymLayoutImage", "")}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Remove gym layout image
                </button>
              </div>
            ) : (
              <input
                type="file"
                className={inputClass}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleGymLayoutUpload}
              />
            )}
          </div>
        </div>

        {/* Hotel */}
        <div className="border-t pt-4 space-y-3">
          <SectionToggle
            label="Show Accommodations"
            checked={showAccommodations}
            onChange={(value) => updateField("showAccommodations", value)}
          />
          {showAccommodations && (
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MapPin size={18} /> Accommodations
          </h4>
          )}
          {showAccommodations && (
          <div className="grid grid-cols-1 gap-4">
            <BufferedInput
              className={inputClass}
              placeholder="Hotel Name"
              value={logistics.hotelName || ""}
              onCommit={(value) => updateField("hotelName", value)}
            />
            <BufferedInput
              className={inputClass}
              placeholder="Hotel Address"
              value={logistics.hotelAddress || ""}
              onCommit={(value) => updateField("hotelAddress", value)}
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
                <BufferedInput
                  className={inputClass}
                  placeholder="Team dinner at 6 PM"
                  value={logistics.mealPlan || ""}
                  onCommit={(value) => updateField("mealPlan", value)}
                />
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Fees */}
        <div className="border-t pt-4 space-y-3">
          <SectionToggle
            label="Show Fees"
            checked={showFees}
            onChange={(value) => updateField("showFees", value)}
          />
          {showFees && (
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <FileText size={18} /> Fees
          </h4>
          )}
          {showFees && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fee Amount
              </label>
              <BufferedInput
                className={inputClass}
                placeholder="$125"
                value={logistics.feeAmount || ""}
                onCommit={(value) => updateField("feeAmount", value)}
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
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <SectionToggle
            label="Show Meals"
            checked={showMeals}
            onChange={(value) => updateField("showMeals", value)}
          />
          {showMeals && (
            <>
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock size={18} /> Meals
              </h4>
              <BufferedTextarea
                className={textareaClass}
                placeholder="Team dinner, breakfast, snack notes..."
                value={logistics.mealPlan || ""}
                onCommit={(value) => updateField("mealPlan", value)}
                rows={2}
              />
            </>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <SectionToggle
            label="Show Additional Documents"
            checked={showAdditionalDocuments}
            onChange={(value) => updateField("showAdditionalDocuments", value)}
          />
          {showAdditionalDocuments && (
            <>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Additional Documents
          </label>
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Upload document
            </label>
            <input
              type="file"
              className={inputClass}
              accept=".pdf,.doc,.docx,.txt,.rtf,.png,.jpg,.jpeg,.webp"
              onChange={handleDocumentUpload}
            />
            <p className="text-xs text-slate-500 mt-2">
              Add a file directly, or keep using external links below.
            </p>
          </div>
          {(logistics.additionalDocuments || []).map((doc: any) => (
            <div key={doc.id} className="grid grid-cols-1 gap-2 mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <BufferedInput
                className={inputClass}
                placeholder="Document name (example: Travel Waiver)"
                value={doc.name || ""}
                onCommit={(value) => updateDocument(doc.id, "name", value)}
              />
              <BufferedInput
                className={inputClass}
                placeholder="https://document.link/..."
                value={doc.url || ""}
                onCommit={(value) => updateDocument(doc.id, "url", value)}
              />
              <button
                onClick={() => removeDocument(doc.id)}
                className="justify-self-start text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove document
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDocument}
            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Plus size={14} /> Add document
          </button>
            </>
          )}
        </div>
          </>
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
    const logistics: LogisticsInfo = state || {};
    if (logistics.enabled === false) return null;
    const showTransportation = logistics.showTransportation !== false;
    const showAccommodations = logistics.showAccommodations !== false;
    const showFees = logistics.showFees !== false;
    const showMeals = logistics.showMeals !== false;
    const showAdditionalDocuments = logistics.showAdditionalDocuments !== false;
    const documents =
      logistics.additionalDocuments?.filter((doc) => doc?.url || doc?.name) || [];
    const hasData =
      (showTransportation &&
        (logistics.travelMode || logistics.callTime || logistics.pickupWindow)) ||
      (showAccommodations && (logistics.hotelName || logistics.hotelAddress)) ||
      (showFees && (logistics.feeAmount || logistics.feeDueDate)) ||
      (showMeals && logistics.mealPlan) ||
      Boolean(logistics.gymLayoutImage) ||
      (showAdditionalDocuments && documents.length > 0);
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
          {showTransportation && logistics.travelMode && (
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
          {showAccommodations && logistics.hotelName && (
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
          {showFees && logistics.feeAmount && (
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
          {showMeals && logistics.mealPlan && (
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
        {showAdditionalDocuments && documents.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {documents.map((doc, idx) => {
              if (!doc.url) return null;
              const isEmbeddedDocument =
                typeof doc.url === "string" && doc.url.startsWith("data:");
              return (
                <a
                  key={doc.id || idx}
                  href={doc.url}
                  target={isEmbeddedDocument ? undefined : "_blank"}
                  rel={isEmbeddedDocument ? undefined : "noopener noreferrer"}
                  download={
                    isEmbeddedDocument ? doc.name || `document-${idx + 1}` : undefined
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors ${textClass}`}
                >
                  <FileText size={16} />
                  {doc.name || `Document ${idx + 1}`}
                </a>
              );
            })}
          </div>
        )}
        {logistics.gymLayoutImage && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={16} className="opacity-70" />
              <span
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Gym Layout
              </span>
            </div>
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/10">
              <img
                src={logistics.gymLayoutImage}
                alt="Gym layout"
                className="w-full h-56 object-cover"
              />
            </div>
          </div>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: COACHES
// ═══════════════════════════════════════════════════════════════════════════

const coachesSection = {
  id: "coaches",
  menuTitle: "Coaches",
  menuDesc: "Coach operations, registration fees, payment rules, deadlines.",
  initialState: {
    enabled: false,
    signIn: "",
    attire: "",
    hospitality: "",
    floorAccess: "",
    scratches: "",
    floorMusic: "",
    rotationSheets: "",
    awards: "",
    regionalCommitment: "",
    qualification: "",
    meetFormat: "",
    equipment: "",
    refundPolicy: "",
    paymentInstructions: "",
    entryFees: [],
    teamFees: [],
    lateFees: [],
    deadlines: [],
    contacts: [],
    links: [],
    notes: [],
  } as CoachesInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const coaches: CoachesInfo = state || {};
    const updateField = (field: string, value: any) =>
      setState((s: any) => ({ ...s, [field]: value }));
    const addItem = (field: string, item: any) =>
      setState((s: any) => ({ ...s, [field]: [...(s?.[field] || []), item] }));
    const updateItem = (field: string, id: string, key: string, value: string) =>
      setState((s: any) => ({
        ...s,
        [field]: (s?.[field] || []).map((item: any) =>
          item.id === id ? { ...item, [key]: value } : item
        ),
      }));
    const removeItem = (field: string, id: string) =>
      setState((s: any) => ({
        ...s,
        [field]: (s?.[field] || []).filter((item: any) => item.id !== id),
      }));

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="text-slate-700 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-slate-900">Coach Packet Details</h4>
              <p className="text-sm text-slate-600">
                Keep coach-only pricing, payment, deadlines, sign-in rules, and operational notes here.
              </p>
            </div>
          </div>
        </div>

        <SectionToggle
          label="Show Coaches Section"
          checked={coaches.enabled !== false}
          onChange={(value) => updateField("enabled", value)}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            ["signIn", "Sign-In"],
            ["hospitality", "Hospitality"],
            ["floorAccess", "Floor Access"],
            ["scratches", "Scratches"],
            ["floorMusic", "Floor Music"],
            ["rotationSheets", "Rotation Sheets"],
            ["awards", "Awards"],
            ["regionalCommitment", "Regional Commitment"],
            ["qualification", "Qualification"],
            ["meetFormat", "Meet Format"],
            ["equipment", "Equipment"],
            ["refundPolicy", "Refund Policy"],
            ["paymentInstructions", "Payment Instructions"],
          ].map(([field, label]) => (
            <div key={field}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {label}
              </label>
              <BufferedTextarea
                className={textareaClass}
                value={(coaches as any)?.[field] || ""}
                onCommit={(value) => updateField(field, value)}
                rows={2}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Attire
            </label>
            <BufferedTextarea
              className={textareaClass}
              placeholder="Business casual, closed-toe athletic shoes, no hats..."
              value={coaches.attire || ""}
              onCommit={(value) => updateField("attire", value)}
              rows={2}
            />
          </div>
        </div>

        {[
          ["entryFees", "Entry Fees", { label: "Entry fee", amount: "", note: "" }],
          ["teamFees", "Team Fees", { label: "Team fee", amount: "", note: "" }],
        ].map(([field, label, seed]: any) => (
          <div key={field} className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">{label}</h4>
              <button
                type="button"
                onClick={() => addItem(field, { id: genId(), ...seed })}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {(coaches as any)?.[field]?.map((item: any) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                <BufferedInput
                  className={inputClass}
                  placeholder="Label"
                  value={item.label || ""}
                  onCommit={(value) => updateItem(field, item.id, "label", value)}
                />
                <BufferedInput
                  className={inputClass}
                  placeholder="$0.00"
                  value={item.amount || ""}
                  onCommit={(value) => updateItem(field, item.id, "amount", value)}
                />
                <BufferedInput
                  className={inputClass}
                  placeholder="Note"
                  value={item.note || ""}
                  onCommit={(value) => updateItem(field, item.id, "note", value)}
                />
                <button
                  type="button"
                  onClick={() => removeItem(field, item.id)}
                  className="justify-self-start text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-700">Late Fees</h4>
            <button
              type="button"
              onClick={() =>
                addItem("lateFees", {
                  id: genId(),
                  label: "Late fee",
                  amount: "",
                  trigger: "",
                  note: "",
                })
              }
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {(coaches.lateFees || []).map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
              <BufferedInput className={inputClass} placeholder="Label" value={item.label || ""} onCommit={(value) => updateItem("lateFees", item.id, "label", value)} />
              <BufferedInput className={inputClass} placeholder="$0.00" value={item.amount || ""} onCommit={(value) => updateItem("lateFees", item.id, "amount", value)} />
              <BufferedInput className={inputClass} placeholder="Trigger" value={item.trigger || ""} onCommit={(value) => updateItem("lateFees", item.id, "trigger", value)} />
              <BufferedInput className={inputClass} placeholder="Note" value={item.note || ""} onCommit={(value) => updateItem("lateFees", item.id, "note", value)} />
              <button type="button" onClick={() => removeItem("lateFees", item.id)} className="justify-self-start text-sm text-red-600 hover:text-red-800">
                Remove
              </button>
            </div>
          ))}
        </div>

        {[
          ["deadlines", "Deadlines", { label: "Deadline", date: "", note: "" }],
          ["contacts", "Contacts", { role: "Coach contact", name: "", email: "", phone: "" }],
          ["links", "Links", { label: "Coach link", url: "" }],
        ].map(([field, label, seed]: any) => (
          <div key={field} className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">{label}</h4>
              <button
                type="button"
                onClick={() => addItem(field, { id: genId(), ...seed })}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {(coaches as any)?.[field]?.map((item: any) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                {field === "deadlines" ? (
                  <>
                    <BufferedInput className={inputClass} placeholder="Label" value={item.label || ""} onCommit={(value) => updateItem(field, item.id, "label", value)} />
                    <BufferedInput className={inputClass} placeholder="YYYY-MM-DD" value={item.date || ""} onCommit={(value) => updateItem(field, item.id, "date", value)} />
                    <BufferedInput className={inputClass} placeholder="Note" value={item.note || ""} onCommit={(value) => updateItem(field, item.id, "note", value)} />
                  </>
                ) : null}
                {field === "contacts" ? (
                  <>
                    <BufferedInput className={inputClass} placeholder="Role" value={item.role || ""} onCommit={(value) => updateItem(field, item.id, "role", value)} />
                    <BufferedInput className={inputClass} placeholder="Name" value={item.name || ""} onCommit={(value) => updateItem(field, item.id, "name", value)} />
                    <BufferedInput className={inputClass} placeholder="Email" value={item.email || ""} onCommit={(value) => updateItem(field, item.id, "email", value)} />
                    <BufferedInput className={inputClass} placeholder="Phone" value={item.phone || ""} onCommit={(value) => updateItem(field, item.id, "phone", value)} />
                  </>
                ) : null}
                {field === "links" ? (
                  <>
                    <BufferedInput className={inputClass} placeholder="Label" value={item.label || ""} onCommit={(value) => updateItem(field, item.id, "label", value)} />
                    <div className="md:col-span-2">
                      <BufferedInput className={inputClass} placeholder="https://..." value={item.url || ""} onCommit={(value) => updateItem(field, item.id, "url", value)} />
                    </div>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeItem(field, item.id)}
                  className="justify-self-start text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className="border-t pt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Additional Notes
          </label>
          <BufferedTextarea
            className={textareaClass}
            placeholder="One note per line"
            value={(coaches.notes || []).join("\n")}
            onCommit={(value) =>
              updateField(
                "notes",
                value
                  .split(/\n+/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            rows={4}
          />
        </div>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const coaches: CoachesInfo = state || {};
    const hasData =
      coaches.enabled !== false &&
      (coaches.signIn ||
        coaches.hospitality ||
        coaches.floorAccess ||
        coaches.rotationSheets ||
        coaches.paymentInstructions ||
        coaches.entryFees?.length ||
        coaches.teamFees?.length ||
        coaches.lateFees?.length ||
        coaches.deadlines?.length ||
        coaches.contacts?.length);
    if (!hasData) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Coaches
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[coaches.signIn && `Sign-In: ${coaches.signIn}`, coaches.hospitality && `Hospitality: ${coaches.hospitality}`, coaches.floorAccess && `Floor access: ${coaches.floorAccess}`, coaches.rotationSheets && `Rotation sheets: ${coaches.rotationSheets}`, coaches.paymentInstructions && `Payment: ${coaches.paymentInstructions}`]
            .filter(Boolean)
            .map((item) => (
              <div key={item} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className={`text-sm whitespace-pre-wrap ${textClass}`} style={bodyShadow}>
                  {item}
                </p>
              </div>
            ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: MEET SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

const scheduleSection = {
  id: "schedule",
  menuTitle: "Schedule",
  menuDesc: "Meet days, sessions, clubs, and award flags.",
  initialState: {
    enabled: true,
    venueLabel: "",
    supportEmail: "",
    notes: [],
    days: [
      {
        id: "schedule-day-1",
        date: "Friday, March 13, 2026",
        shortDate: "Friday • Mar 13",
        isoDate: "2026-03-13",
        sessions: [
          {
            id: "schedule-session-1",
            code: "FR1",
            label: "Session FR1",
            group: "Bronze",
            startTime: "8:00 AM",
            warmupTime: "8:00 AM",
            note: "General Stretch & Warmup",
            clubs: [
              {
                id: "schedule-club-1",
                name: "Browns Gym",
                teamAwardEligible: true,
                athleteCount: null,
                divisionLabel: "",
              },
              {
                id: "schedule-club-2",
                name: "Twisters Canada",
                teamAwardEligible: false,
                athleteCount: null,
                divisionLabel: "",
              },
            ],
          },
        ],
      },
    ],
  } as ScheduleInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const schedule: ScheduleInfo = state || {};
    const updateField = (field: string, value: any) =>
      setState((current: any) => ({ ...current, [field]: value }));
    const updateDay = (dayId: string, patch: Record<string, any>) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId ? { ...day, ...patch } : day
        ),
      }));
    const removeDay = (dayId: string) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).filter((day: ScheduleDay) => day.id !== dayId),
      }));
    const addDay = () =>
      setState((current: any) => ({
        ...current,
        days: [
          ...(current?.days || []),
          {
            id: genId(),
            date: "",
            shortDate: "",
            isoDate: "",
            sessions: [],
          },
        ],
      }));
    const addSession = (dayId: string) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: [
                  ...(day.sessions || []),
                  {
                    id: genId(),
                    code: "",
                    label: "",
                    group: "",
                    startTime: "",
                    warmupTime: "",
                    note: "",
                    clubs: [],
                  },
                ],
              }
            : day
        ),
      }));
    const updateSession = (dayId: string, sessionId: string, patch: Record<string, any>) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: (day.sessions || []).map((session: ScheduleSession) =>
                  session.id === sessionId ? { ...session, ...patch } : session
                ),
              }
            : day
        ),
      }));
    const removeSession = (dayId: string, sessionId: string) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: (day.sessions || []).filter(
                  (session: ScheduleSession) => session.id !== sessionId
                ),
              }
            : day
        ),
      }));
    const addClub = (dayId: string, sessionId: string) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: (day.sessions || []).map((session: ScheduleSession) =>
                  session.id === sessionId
                    ? {
                        ...session,
                        clubs: [
                          ...(session.clubs || []),
                          {
                            id: genId(),
                            name: "",
                            teamAwardEligible: null,
                            athleteCount: null,
                            divisionLabel: "",
                          },
                        ],
                      }
                    : session
                ),
              }
            : day
        ),
      }));
    const updateClub = (
      dayId: string,
      sessionId: string,
      clubId: string,
      patch: Record<string, any>
    ) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: (day.sessions || []).map((session: ScheduleSession) =>
                  session.id === sessionId
                    ? {
                        ...session,
                        clubs: (session.clubs || []).map((club: ScheduleClub) =>
                          club.id === clubId ? { ...club, ...patch } : club
                        ),
                      }
                    : session
                ),
              }
            : day
        ),
      }));
    const removeClub = (dayId: string, sessionId: string, clubId: string) =>
      setState((current: any) => ({
        ...current,
        days: (current?.days || []).map((day: ScheduleDay) =>
          day.id === dayId
            ? {
                ...day,
                sessions: (day.sessions || []).map((session: ScheduleSession) =>
                  session.id === sessionId
                    ? {
                        ...session,
                        clubs: (session.clubs || []).filter((club: ScheduleClub) => club.id !== clubId),
                      }
                    : session
                ),
              }
            : day
        ),
      }));

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CalendarIcon className="text-slate-700 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-slate-900">Public Meet Schedule</h4>
              <p className="text-sm text-slate-600">
                Add the session schedule shown on the public event page. If no days are listed, the Schedule tab stays hidden.
              </p>
            </div>
          </div>
        </div>

        <SectionToggle
          label="Show Schedule Section"
          checked={schedule.enabled !== false}
          onChange={(value) => updateField("enabled", value)}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Venue Label
            </label>
            <BufferedInput
              className={inputClass}
              placeholder="Greater Fort Lauderdale / Broward County Convention Center"
              value={schedule.venueLabel || ""}
              onCommit={(value) => updateField("venueLabel", value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Support Email
            </label>
            <BufferedInput
              className={inputClass}
              placeholder="info@example.com"
              value={schedule.supportEmail || ""}
              onCommit={(value) => updateField("supportEmail", value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Admin Notes
          </label>
          <BufferedTextarea
            className={textareaClass}
            placeholder="One note per line"
            value={(schedule.notes || []).join("\n")}
            onCommit={(value) =>
              updateField(
                "notes",
                value
                  .split(/\n+/)
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
            rows={3}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-700">Schedule Days</h4>
            <button
              type="button"
              onClick={addDay}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus size={14} /> Add Day
            </button>
          </div>

          {(schedule.days || []).map((day) => (
            <div key={day.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-slate-800">
                  {day.shortDate || day.date || "New Day"}
                </h5>
                <button
                  type="button"
                  onClick={() => removeDay(day.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove Day
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <BufferedInput
                  className={inputClass}
                  placeholder="Friday, March 13, 2026"
                  value={day.date || ""}
                  onCommit={(value) => updateDay(day.id, { date: value })}
                />
                <BufferedInput
                  className={inputClass}
                  placeholder="Friday • Mar 13"
                  value={day.shortDate || ""}
                  onCommit={(value) => updateDay(day.id, { shortDate: value })}
                />
                <BufferedInput
                  className={inputClass}
                  placeholder="2026-03-13"
                  value={day.isoDate || ""}
                  onCommit={(value) => updateDay(day.id, { isoDate: value })}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h6 className="font-semibold text-slate-700">Sessions</h6>
                  <button
                    type="button"
                    onClick={() => addSession(day.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Session
                  </button>
                </div>

                {(day.sessions || []).map((session) => (
                  <div key={session.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">
                        {session.label || session.code || "Session"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSession(day.id, session.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Session
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <BufferedInput
                        className={inputClass}
                        placeholder="FR1"
                        value={session.code || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { code: value })}
                      />
                      <BufferedInput
                        className={inputClass}
                        placeholder="Session FR1"
                        value={session.label || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { label: value })}
                      />
                      <BufferedInput
                        className={inputClass}
                        placeholder="Bronze"
                        value={session.group || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { group: value })}
                      />
                      <BufferedInput
                        className={inputClass}
                        placeholder="8:00 AM"
                        value={session.startTime || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { startTime: value })}
                      />
                      <BufferedInput
                        className={inputClass}
                        placeholder="8:00 AM"
                        value={session.warmupTime || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { warmupTime: value })}
                      />
                      <BufferedInput
                        className={inputClass}
                        placeholder="General Stretch & Warmup"
                        value={session.note || ""}
                        onCommit={(value) => updateSession(day.id, session.id, { note: value })}
                      />
                    </div>

                    <div className="space-y-3 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <h6 className="font-semibold text-slate-700">Clubs</h6>
                        <button
                          type="button"
                          onClick={() => addClub(day.id, session.id)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Club
                        </button>
                      </div>

                      {(session.clubs || []).map((club) => (
                        <div
                          key={club.id}
                          className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-4"
                        >
                          <BufferedInput
                            className={inputClass}
                            placeholder="Club name"
                            value={club.name || ""}
                            onCommit={(value) => updateClub(day.id, session.id, club.id, { name: value })}
                          />
                          <BufferedInput
                            className={inputClass}
                            placeholder="Athlete count"
                            value={club.athleteCount == null ? "" : String(club.athleteCount)}
                            onCommit={(value) =>
                              updateClub(day.id, session.id, club.id, {
                                athleteCount: value.trim() ? Number(value) || null : null,
                              })
                            }
                          />
                          <BufferedInput
                            className={inputClass}
                            placeholder="Division label"
                            value={club.divisionLabel || ""}
                            onCommit={(value) =>
                              updateClub(day.id, session.id, club.id, { divisionLabel: value })
                            }
                          />
                          <select
                            className={inputClass}
                            value={
                              club.teamAwardEligible === true
                                ? "team"
                                : club.teamAwardEligible === false
                                ? "individual"
                                : "unknown"
                            }
                            onChange={(event) =>
                              updateClub(day.id, session.id, club.id, {
                                teamAwardEligible:
                                  event.target.value === "team"
                                    ? true
                                    : event.target.value === "individual"
                                    ? false
                                    : null,
                              })
                            }
                          >
                            <option value="unknown">Awards status unknown</option>
                            <option value="team">Individual &amp; Team Awards</option>
                            <option value="individual">Individual Only</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeClub(day.id, session.id, club.id)}
                            className="justify-self-start text-sm text-red-600 hover:text-red-800"
                          >
                            Remove Club
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  renderPreview: ({ state, textClass, accentClass, headingShadow, bodyShadow, titleColor }) => {
    const schedule: ScheduleInfo = state || {};
    if (schedule.enabled === false || (schedule.days?.length ?? 0) === 0) return null;

    return (
      <>
        <h2
          className={`text-2xl mb-4 ${accentClass}`}
          style={{ ...headingShadow, ...(titleColor || {}) }}
        >
          Schedule
        </h2>
        <div className="space-y-3">
          {(schedule.days || []).map((day) => (
            <div key={day.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className={`font-semibold ${textClass}`} style={bodyShadow}>
                {day.shortDate || day.date || "Schedule Day"}
              </div>
              <div className={`mt-2 text-sm opacity-80 ${textClass}`} style={bodyShadow}>
                {(day.sessions || []).length} session
                {(day.sessions || []).length === 1 ? "" : "s"}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: GEAR & UNIFORM CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const gearSection = {
  id: "gear",
  menuTitle: "Gear & Uniform",
  menuDesc: "Leotard, grips, equipment checklist.",
  initialState: {
    enabled: false,
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
    const isEnabled = state?.enabled !== false;
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
        <SectionToggle
          label="Show Gear & Uniform"
          checked={isEnabled}
          onChange={(value) => setState((s: any) => ({ ...s, enabled: value }))}
        />
        {!isEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Gear & uniform are hidden from the public page.
          </div>
        ) : (
          <>
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
          <BufferedInput
            className={inputClass}
            placeholder="Red competition leo, Team warm-ups..."
            value={state?.leotardOfDay || ""}
            onCommit={(value) => updateField("leotardOfDay", value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Hair & Makeup Notes
          </label>
          <BufferedTextarea
            className={textareaClass}
            placeholder="High bun with team scrunchie, natural makeup, no glitter..."
            value={state?.hairMakeupNotes || ""}
            onCommit={(value) => updateField("hairMakeupNotes", value)}
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Floor Music Link
          </label>
          <BufferedInput
            className={inputClass}
            placeholder="https://drive.google.com/..."
            type="url"
            value={state?.musicFileLink || ""}
            onCommit={(value) => updateField("musicFileLink", value)}
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
                <BufferedInput
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                  placeholder="Item name"
                  value={item.name}
                  onCommit={(value) => updateItem(item.id, "name", value)}
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
          </>
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
    if (state?.enabled === false) return null;
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
    enabled: false,
    showVolunteerSlots: true,
    showCarpool: true,
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
    const isEnabled = state?.enabled !== false;
    const showVolunteerSlots = state?.showVolunteerSlots !== false;
    const showCarpool = state?.showCarpool !== false;
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
        <SectionToggle
          label="Show Volunteers & Carpool"
          checked={isEnabled}
          onChange={(value) => setState((s: any) => ({ ...s, enabled: value }))}
        />
        {!isEnabled ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Volunteers and carpool are hidden from the public page.
          </div>
        ) : (
          <>
        <SectionToggle
          label="Show Volunteer Slots"
          checked={showVolunteerSlots}
          onChange={(value) =>
            setState((s: any) => ({ ...s, showVolunteerSlots: value }))
          }
        />
        <SectionToggle
          label="Show Carpool Offers"
          checked={showCarpool}
          onChange={(value) =>
            setState((s: any) => ({ ...s, showCarpool: value }))
          }
        />

        {/* Volunteers */}
        {showVolunteerSlots && (
          <>
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
            <BufferedInput
              className={`${inputClass} flex-1`}
              placeholder="Volunteer name"
              value={slot.name}
              onCommit={(value) => updateSlot(slot.id, "name", value)}
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
          </>
        )}

        {/* Carpool */}
        {showCarpool && (
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
                <BufferedInput
                  className={inputClass}
                  placeholder="Driver Name"
                  value={cp.driverName}
                  onCommit={(value) =>
                    updateCarpool(cp.id, "driverName", value)
                  }
                />
                <BufferedInput
                  className={inputClass}
                  placeholder="Phone"
                  type="tel"
                  value={cp.phone}
                  onCommit={(value) => updateCarpool(cp.id, "phone", value)}
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
              <BufferedInput
                className={inputClass}
                placeholder="Departure location"
                value={cp.departureLocation}
                onCommit={(value) =>
                  updateCarpool(cp.id, "departureLocation", value)
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
        )}
          </>
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
    if (state?.enabled === false) return null;
    const showVolunteerSlots = state?.showVolunteerSlots !== false;
    const showCarpool = state?.showCarpool !== false;
    const slots: VolunteerSlot[] = state?.volunteerSlots || [];
    const carpools: CarpoolOffer[] = state?.carpoolOffers || [];
    if (
      (showVolunteerSlots ? slots.length === 0 : true) &&
      (showCarpool ? carpools.length === 0 : true)
    )
      return null;

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
        {showVolunteerSlots && slots.length > 0 && (
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
        {showCarpool && carpools.length > 0 && (
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
            <BufferedTextarea
              className={textareaClass}
              placeholder="Type your announcement..."
              value={ann.text}
              onCommit={(value) => updateAnnouncement(ann.id, "text", value)}
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
  displayName: "Gymnastics",
  category: "sport_gymnastics_schedule",
  categoryLabel: "Gymnastics",
  showCategoryField: false,
  detailsDescriptionRows: 8,
  detailsDescriptionPopup: true,
  defaultRsvpDeadlineDays: null,
  themesExpandedByDefault: false,
  defaultHero: "/templates/hero-images/gymnastics-hero.jpeg",
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Response settings for athletes.",
    editorTitle: "Confirm Attendance",
    toggleLabel: "Enable Attendance RSVP",
    deadlineLabel: "Response Deadline",
    helperText: "Athletes/parents can confirm attendance status.",
    nameLabel: "Athlete Name",
    namePlaceholder: "Athlete Name",
  },
  prefill: {
    title: "",
    venue: "Redbird Arena",
    address: "200 N University St, Normal, IL 61761",
    city: "Normal",
    state: "IL",
    details:
      "Level 4-7 compulsory and optional competition. Athletes should arrive 90 minutes before session start for team warm-up. Parents are welcome to watch from the stands. Concessions available.",
    extra: {
      team: "",
      season: "",
      coach: "",
      assistantCoach: "",
      coachPhone: "",
    },
  },
  detailFields: [
    { key: "team", label: "Competing Team" },
    { key: "season", label: "Season" },
    { key: "coach", label: "Head Coach" },
    {
      key: "assistantCoach",
      label: "Assistant Coach",
    },
    {
      key: "coachPhone",
      label: "Coach Contact",
    },
  ],
  themes: [
    {
      id: "launchpad_editorial",
      name: "Launchpad Editorial",
      bg: "bg-[linear-gradient(180deg,#f3f5fb_0%,#edf1f8_42%,#f6f8fc_100%)]",
      text: "text-[#1f2438]",
      accent: "text-[#61708a]",
      preview:
        "bg-[linear-gradient(135deg,#ffffff_0%,#f8f7ff_55%,#eef6ff_100%)]",
      previewFrom: "bg-[#f3f5fb]",
      previewTo: "bg-[#d9e7ff]",
    },
    {
      id: "electric_teal",
      name: "Electric Teal",
      bg: "bg-gradient-to-br from-slate-950 to-teal-500",
      text: "text-white",
      accent: "text-teal-100",
      preview: "bg-gradient-to-r from-slate-950 to-teal-500",
      previewFrom: "bg-slate-950",
      previewTo: "bg-teal-500",
    },
    {
      id: "power_purple",
      name: "Power Purple",
      bg: "bg-gradient-to-br from-slate-950 to-purple-600",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-slate-950 to-purple-600",
      previewFrom: "bg-slate-950",
      previewTo: "bg-purple-600",
    },
    {
      id: "flare_pink",
      name: "Flare Pink",
      bg: "bg-gradient-to-br from-slate-950 to-pink-500",
      text: "text-white",
      accent: "text-pink-100",
      preview: "bg-gradient-to-r from-slate-950 to-pink-500",
      previewFrom: "bg-slate-950",
      previewTo: "bg-pink-500",
    },
    {
      id: "impact_blue",
      name: "Impact Blue",
      bg: "bg-gradient-to-br from-slate-950 to-blue-600",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-slate-950 to-blue-600",
      previewFrom: "bg-slate-950",
      previewTo: "bg-blue-600",
    },
    {
      id: "starlight_navy",
      name: "Starlight Navy",
      bg: "bg-gradient-to-br from-blue-950 to-slate-500",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-blue-950 to-slate-500",
      previewFrom: "bg-blue-950",
      previewTo: "bg-slate-500",
    },
    {
      id: "regal_spark",
      name: "Regal Spark",
      bg: "bg-gradient-to-br from-purple-900 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-purple-900 to-slate-200",
      previewFrom: "bg-purple-900",
      previewTo: "bg-slate-200",
    },
    {
      id: "aqua_shine",
      name: "Aqua Shine",
      bg: "bg-gradient-to-br from-teal-900 to-slate-300",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-teal-900 to-slate-300",
      previewFrom: "bg-teal-900",
      previewTo: "bg-slate-300",
    },
    {
      id: "elite_gold",
      name: "Elite Gold",
      bg: "bg-gradient-to-br from-slate-950 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 to-amber-500",
      previewFrom: "bg-slate-950",
      previewTo: "bg-amber-500",
    },
    {
      id: "glitter_beam",
      name: "Glitter Beam",
      bg: "bg-gradient-to-br from-pink-700 to-slate-200",
      text: "text-slate-900",
      accent: "text-fuchsia-700",
      preview: "bg-gradient-to-r from-pink-700 to-slate-200",
      previewFrom: "bg-pink-700",
      previewTo: "bg-slate-200",
    },
    {
      id: "edge_red",
      name: "Edge Red",
      bg: "bg-gradient-to-br from-slate-950 to-red-600",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-slate-950 to-red-600",
      previewFrom: "bg-slate-950",
      previewTo: "bg-red-600",
    },
    {
      id: "mint_motion",
      name: "Mint Motion",
      bg: "bg-gradient-to-br from-emerald-100 to-white",
      text: "text-slate-900",
      accent: "text-emerald-700",
      preview: "bg-gradient-to-r from-emerald-100 to-white",
      previewFrom: "bg-emerald-100",
      previewTo: "bg-white",
    },
    {
      id: "aerial_amethyst",
      name: "Aerial Amethyst",
      bg: "bg-gradient-to-br from-purple-200 to-white",
      text: "text-slate-900",
      accent: "text-purple-700",
      preview: "bg-gradient-to-r from-purple-200 to-white",
      previewFrom: "bg-purple-200",
      previewTo: "bg-white",
    },
    {
      id: "turbo_turquoise",
      name: "Turbo Turquoise",
      bg: "bg-gradient-to-br from-slate-950 to-teal-500",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-950 to-teal-500",
      previewFrom: "bg-slate-950",
      previewTo: "bg-teal-500",
    },
    {
      id: "galaxy_magenta",
      name: "Galaxy Magenta",
      bg: "bg-gradient-to-br from-fuchsia-700 to-blue-900",
      text: "text-white",
      accent: "text-fuchsia-100",
      preview: "bg-gradient-to-r from-fuchsia-700 to-blue-900",
      previewFrom: "bg-fuchsia-700",
      previewTo: "bg-blue-900",
    },
    {
      id: "pink_velocity",
      name: "Pink Velocity",
      bg: "bg-gradient-to-br from-pink-500 to-blue-900",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-pink-500 to-blue-900",
      previewFrom: "bg-pink-500",
      previewTo: "bg-blue-900",
    },
    {
      id: "royal_spark",
      name: "Royal Spark",
      bg: "bg-gradient-to-br from-blue-900 to-slate-300",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-blue-900 to-slate-300",
      previewFrom: "bg-blue-900",
      previewTo: "bg-slate-300",
    },
    {
      id: "neon_beam",
      name: "Neon Beam",
      bg: "bg-gradient-to-br from-slate-950 to-fuchsia-600",
      text: "text-white",
      accent: "text-fuchsia-200",
      preview: "bg-gradient-to-r from-slate-950 to-fuchsia-600",
      previewFrom: "bg-slate-950",
      previewTo: "bg-fuchsia-600",
    },
    {
      id: "fire_flash",
      name: "Fire Flash",
      bg: "bg-gradient-to-br from-red-800 to-slate-200",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-red-800 to-slate-200",
      previewFrom: "bg-red-800",
      previewTo: "bg-slate-200",
    },
    {
      id: "aurora_violet",
      name: "Aurora Violet",
      bg: "bg-gradient-to-br from-violet-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-violet-900 to-amber-500",
      previewFrom: "bg-violet-900",
      previewTo: "bg-amber-500",
    },
    {
      id: "mint_surge",
      name: "Mint Surge",
      bg: "bg-gradient-to-br from-slate-950 to-emerald-400",
      text: "text-white",
      accent: "text-emerald-100",
      preview: "bg-gradient-to-r from-slate-950 to-emerald-400",
      previewFrom: "bg-slate-950",
      previewTo: "bg-emerald-400",
    },
    {
      id: "lavender_leap",
      name: "Lavender Leap",
      bg: "bg-gradient-to-br from-purple-200 to-white",
      text: "text-slate-900",
      accent: "text-purple-700",
      preview: "bg-gradient-to-r from-purple-200 to-white",
      previewFrom: "bg-purple-200",
      previewTo: "bg-white",
    },
    {
      id: "cosmic_flip",
      name: "Cosmic Flip",
      bg: "bg-gradient-to-br from-slate-950 to-pink-600",
      text: "text-white",
      accent: "text-pink-200",
      preview: "bg-gradient-to-r from-slate-950 to-pink-600",
      previewFrom: "bg-slate-950",
      previewTo: "bg-pink-600",
    },
    {
      id: "starbound_rose",
      name: "Starbound Rose",
      bg: "bg-gradient-to-br from-blue-950 to-amber-400",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-blue-950 to-amber-400",
      previewFrom: "bg-blue-950",
      previewTo: "bg-amber-400",
    },
    {
      id: "aqua_energy",
      name: "Aqua Energy",
      bg: "bg-gradient-to-br from-slate-950 to-cyan-500",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-950 to-cyan-500",
      previewFrom: "bg-slate-950",
      previewTo: "bg-cyan-500",
    },
  ],
  advancedSections: [
    rosterSection,
    meetSection,
    practiceSection,
    logisticsSection,
    coachesSection,
    scheduleSection,
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
  coachesSection,
  scheduleSection,
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
  CoachesInfo,
  ScheduleInfo,
  GearItem,
  VolunteerSlot,
  CarpoolOffer,
};
