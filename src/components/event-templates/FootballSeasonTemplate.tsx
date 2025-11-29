// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
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
  Home,
  Plane,
} from "lucide-react";

type PlayerStatus = "active" | "injured" | "ineligible" | "pending";

type Player = {
  id: string;
  name: string;
  jerseyNumber: string;
  position: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  medicalNotes: string;
  status: PlayerStatus;
};

type Game = {
  id: string;
  opponent: string;
  date: string;
  time: string;
  homeAway: "home" | "away";
  venue: string;
  address: string;
  conference: boolean;
  broadcast: string;
  ticketsLink: string;
  result: "W" | "L" | "T" | null;
  score: string;
};

type PracticeBlock = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  arrivalTime: string;
  type: "full_pads" | "shells" | "helmets" | "no_contact" | "walk_through";
  positionGroups: string[];
  focus: string;
  film: boolean;
};

type LogisticsInfo = {
  travelMode: "bus" | "parent_drive" | "carpool" | "other";
  callTime: string;
  departureTime: string;
  pickupWindow: string;
  hotelName: string;
  hotelAddress: string;
  mealPlan: string;
  weatherPolicy: string;
};

type GearItem = {
  id: string;
  name: string;
  required: boolean;
  forGames: boolean;
  forPractice: boolean;
};

type VolunteerSlot = {
  id: string;
  role: string;
  name: string;
  filled: boolean;
  gameDate: string;
};

const genId = () => Math.random().toString(36).substring(2, 9);

const POSITIONS = [
  "QB",
  "RB",
  "FB",
  "WR",
  "TE",
  "OT",
  "OG",
  "C",
  "DE",
  "DT",
  "NT",
  "OLB",
  "MLB",
  "ILB",
  "CB",
  "FS",
  "SS",
  "K",
  "P",
  "LS",
  "KR",
  "PR",
];
const GRADES = ["Freshman", "Sophomore", "Junior", "Senior"];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const PRACTICE_TYPES = [
  { value: "full_pads", label: "Full Pads" },
  { value: "shells", label: "Shells (Shoulder Pads Only)" },
  { value: "helmets", label: "Helmets Only" },
  { value: "no_contact", label: "No Contact / Shorts" },
  { value: "walk_through", label: "Walk-Through" },
];
const POSITION_GROUPS = [
  "Offense",
  "Defense",
  "Special Teams",
  "O-Line",
  "D-Line",
  "Skill",
  "Linebackers",
  "Secondary",
];
const VOLUNTEER_ROLES = [
  "Chain Gang",
  "Clock Operator",
  "Concessions",
  "Gate/Tickets",
  "Team Mom",
  "Water/Gatorade",
  "Equipment",
  "Film/Video",
  "First Aid",
  "Announcer",
];

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: GAME SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

const gameScheduleSection = {
  id: "games",
  menuTitle: "Game Schedule",
  menuDesc: "Home/away games, opponents, dates, times, results.",
  initialState: {
    games: [] as Game[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const games: Game[] = state?.games || [];
    const addGame = () => {
      setState((s: any) => ({
        ...s,
        games: [
          ...(s?.games || []),
          {
            id: genId(),
            opponent: "",
            date: "",
            time: "19:00",
            homeAway: "home",
            venue: "",
            address: "",
            conference: true,
            broadcast: "",
            ticketsLink: "",
            result: null,
            score: "",
          },
        ],
      }));
    };
    const updateGame = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        games: (s?.games || []).map((g: Game) =>
          g.id === id ? { ...g, [field]: value } : g
        ),
      }));
    };
    const removeGame = (id: string) => {
      setState((s: any) => ({
        ...s,
        games: (s?.games || []).filter((g: Game) => g.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Trophy className="text-amber-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-amber-900">Season Schedule</h4>
              <p className="text-sm text-amber-700">
                Add all games for the season with home/away details.
              </p>
            </div>
          </div>
        </div>

        {games.map((game, idx) => (
          <div
            key={game.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Game #{idx + 1}
                </span>
                {game.homeAway === "home" ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                    <Home size={12} />
                    HOME
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                    <Plane size={12} />
                    AWAY
                  </span>
                )}
              </div>
              <button
                onClick={() => removeGame(game.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Opponent *
                </label>
                <input
                  className={inputClass}
                  placeholder="Central High Tigers"
                  value={game.opponent}
                  onChange={(e) =>
                    updateGame(game.id, "opponent", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={game.date}
                  onChange={(e) => updateGame(game.id, "date", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Kickoff
                </label>
                <input
                  type="time"
                  className={inputClass}
                  value={game.time}
                  onChange={(e) => updateGame(game.id, "time", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Home/Away
                </label>
                <select
                  className={inputClass}
                  value={game.homeAway}
                  onChange={(e) =>
                    updateGame(game.id, "homeAway", e.target.value)
                  }
                >
                  <option value="home">🏠 Home</option>
                  <option value="away">✈️ Away</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Conference Game
                </label>
                <select
                  className={inputClass}
                  value={game.conference ? "yes" : "no"}
                  onChange={(e) =>
                    updateGame(game.id, "conference", e.target.value === "yes")
                  }
                >
                  <option value="yes">Yes - Conference</option>
                  <option value="no">No - Non-Conference</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Venue
              </label>
              <input
                className={inputClass}
                placeholder="Panthers Stadium"
                value={game.venue}
                onChange={(e) => updateGame(game.id, "venue", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Address
              </label>
              <input
                className={inputClass}
                placeholder="123 Stadium Way, City, ST 12345"
                value={game.address}
                onChange={(e) => updateGame(game.id, "address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Result
                </label>
                <select
                  className={`${inputClass} ${
                    game.result === "W"
                      ? "bg-green-50 border-green-300"
                      : game.result === "L"
                      ? "bg-red-50 border-red-300"
                      : game.result === "T"
                      ? "bg-yellow-50 border-yellow-300"
                      : ""
                  }`}
                  value={game.result || ""}
                  onChange={(e) =>
                    updateGame(game.id, "result", e.target.value || null)
                  }
                >
                  <option value="">Upcoming</option>
                  <option value="W">✓ Win</option>
                  <option value="L">✗ Loss</option>
                  <option value="T">— Tie</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Score
                </label>
                <input
                  className={inputClass}
                  placeholder="28-14"
                  value={game.score}
                  onChange={(e) => updateGame(game.id, "score", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGame}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Game
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
    const games: Game[] = state?.games || [];
    if (games.length === 0) return null;

    const formatDate = (d: string) => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };
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
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Game Schedule
        </h2>
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      game.homeAway === "home"
                        ? "bg-green-500/20 text-green-200"
                        : "bg-blue-500/20 text-blue-200"
                    }`}
                  >
                    {game.homeAway === "home" ? "HOME" : "AWAY"}
                  </span>
                  {game.conference && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-200 rounded text-xs">
                      CONF
                    </span>
                  )}
                </div>
                {game.result && (
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${
                      game.result === "W"
                        ? "bg-green-500/20 text-green-200"
                        : game.result === "L"
                        ? "bg-red-500/20 text-red-200"
                        : "bg-yellow-500/20 text-yellow-200"
                    }`}
                  >
                    {game.result} {game.score}
                  </span>
                )}
              </div>
              <div
                className={`font-semibold text-lg ${textClass}`}
                style={bodyShadow}
              >
                vs {game.opponent || "TBD"}
              </div>
              <div
                className={`text-sm opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                {formatDate(game.date)} • {formatTime(game.time)} •{" "}
                {game.venue || "TBD"}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-4 flex items-center gap-4 text-sm opacity-70"
          style={bodyShadow}
        >
          <span className={textClass}>
            {games.filter((g) => g.result === "W").length}W
          </span>
          <span className={textClass}>
            {games.filter((g) => g.result === "L").length}L
          </span>
          <span className={textClass}>
            {games.filter((g) => !g.result).length} Upcoming
          </span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: TEAM ROSTER
// ═══════════════════════════════════════════════════════════════════════════

const rosterSection = {
  id: "roster",
  menuTitle: "Team Roster",
  menuDesc: "Players, positions, jersey numbers, parent contacts.",
  initialState: { players: [] as Player[] },
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const players: Player[] = state?.players || [];
    const addPlayer = () => {
      setState((s: any) => ({
        ...s,
        players: [
          ...(s?.players || []),
          {
            id: genId(),
            name: "",
            jerseyNumber: "",
            position: "QB",
            grade: "Junior",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            medicalNotes: "",
            status: "active" as PlayerStatus,
          },
        ],
      }));
    };
    const updatePlayer = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        players: (s?.players || []).map((p: Player) =>
          p.id === id ? { ...p, [field]: value } : p
        ),
      }));
    };
    const removePlayer = (id: string) => {
      setState((s: any) => ({
        ...s,
        players: (s?.players || []).filter((p: Player) => p.id !== id),
      }));
    };

    const RosterTextField = ({
      label,
      field,
      playerId,
      value,
      placeholder,
      type = "text",
      textarea = false,
    }: {
      label: string;
      field: keyof Player;
      playerId: string;
      value: string;
      placeholder?: string;
      type?: string;
      textarea?: boolean;
    }) => {
      const [localValue, setLocalValue] = useState(value);

      useEffect(() => {
        setLocalValue(value);
      }, [value]);

      const commit = () => {
        if (localValue !== value) {
          updatePlayer(playerId, field, localValue);
        }
      };

      if (textarea) {
        return (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {label}
            </label>
            <textarea
              className={textareaClass}
              placeholder={placeholder}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={commit}
              rows={2}
            />
          </div>
        );
      }

      return (
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            {label}
          </label>
          <input
            type={type}
            className={inputClass}
            placeholder={placeholder}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={commit}
          />
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-purple-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-purple-900">Team Roster</h4>
              <p className="text-sm text-purple-700">
                Add players with positions, jersey numbers, and parent contact
                info.
              </p>
            </div>
          </div>
        </div>

        {players.map((player, idx) => (
          <div
            key={player.id}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Player #{idx + 1}
              </span>
              <button
                onClick={() => removePlayer(player.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Player Name *
                </label>
                <RosterTextField
                  label="Player Name *"
                  field="name"
                  playerId={player.id}
                  value={player.name}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Jersey #
                </label>
                <RosterTextField
                  label="Jersey #"
                  field="jerseyNumber"
                  playerId={player.id}
                  value={player.jerseyNumber}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Position
                </label>
                <select
                  className={inputClass}
                  value={player.position}
                  onChange={(e) =>
                    updatePlayer(player.id, "position", e.target.value)
                  }
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Grade
                </label>
                <select
                  className={inputClass}
                  value={player.grade}
                  onChange={(e) =>
                    updatePlayer(player.id, "grade", e.target.value)
                  }
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
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
                    player.status === "active"
                      ? "bg-green-50 border-green-300"
                      : player.status === "injured"
                      ? "bg-red-50 border-red-300"
                      : player.status === "ineligible"
                      ? "bg-yellow-50 border-yellow-300"
                      : ""
                  }`}
                  value={player.status}
                  onChange={(e) =>
                    updatePlayer(player.id, "status", e.target.value)
                  }
                >
                  <option value="active">✓ Active</option>
                  <option value="injured">🤕 Injured</option>
                  <option value="ineligible">⚠️ Ineligible</option>
                  <option value="pending">⏳ Pending</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Parent/Guardian Contact
              </label>
              <div className="grid grid-cols-1 gap-3">
                <RosterTextField
                  label="Parent Name"
                  field="parentName"
                  playerId={player.id}
                  value={player.parentName}
                  placeholder="Parent Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <RosterTextField
                    label="Phone"
                    field="parentPhone"
                    playerId={player.id}
                    value={player.parentPhone}
                    placeholder="Phone"
                    type="tel"
                  />
                  <RosterTextField
                    label="Email"
                    field="parentEmail"
                    playerId={player.id}
                    value={player.parentEmail}
                    placeholder="Email"
                    type="email"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Medical Notes (optional)
              </label>
              <RosterTextField
                label="Medical Notes (optional)"
                field="medicalNotes"
                playerId={player.id}
                value={player.medicalNotes}
                placeholder="Allergies, injuries, restrictions..."
                textarea
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPlayer}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Player
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
    const players: Player[] = state?.players || [];
    if (players.length === 0) return null;

    const statusIcon = (s: PlayerStatus) => {
      switch (s) {
        case "active":
          return "✓";
        case "injured":
          return "🤕";
        case "ineligible":
          return "⚠️";
        default:
          return "⏳";
      }
    };
    const statusColor = (s: PlayerStatus) => {
      switch (s) {
        case "active":
          return "bg-green-500/20 text-green-200";
        case "injured":
          return "bg-red-500/20 text-red-200";
        case "ineligible":
          return "bg-yellow-500/20 text-yellow-200";
        default:
          return "bg-white/10 text-white/60";
      }
    };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Team Roster
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold opacity-50">
                      #{player.jerseyNumber || "?"}
                    </span>
                    <div>
                      <div
                        className={`font-semibold ${textClass}`}
                        style={bodyShadow}
                      >
                        {player.name || "Unnamed"}
                      </div>
                      <div
                        className={`text-sm opacity-70 ${textClass}`}
                        style={bodyShadow}
                      >
                        {player.position} • {player.grade}
                      </div>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${statusColor(
                    player.status
                  )}`}
                >
                  {statusIcon(player.status)}
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
            {players.filter((p) => p.status === "active").length} Active
          </span>
          <span className={textClass}>
            {players.filter((p) => p.status === "injured").length} Injured
          </span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: PRACTICE SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════

const practiceSection = {
  id: "practice",
  menuTitle: "Practice Schedule",
  menuDesc: "Weekly practice blocks, times, focus areas, equipment.",
  initialState: {
    blocks: [
      {
        id: "p1",
        day: "Monday",
        startTime: "15:30",
        endTime: "18:00",
        arrivalTime: "15:15",
        type: "full_pads" as const,
        positionGroups: ["Offense", "Defense"],
        focus: "Install new plays, team run/pass",
        film: false,
      },
      {
        id: "p2",
        day: "Wednesday",
        startTime: "15:30",
        endTime: "18:00",
        arrivalTime: "15:15",
        type: "shells" as const,
        positionGroups: ["Offense", "Defense"],
        focus: "Opponent prep, situational football",
        film: true,
      },
      {
        id: "p3",
        day: "Thursday",
        startTime: "15:30",
        endTime: "17:00",
        arrivalTime: "15:15",
        type: "helmets" as const,
        positionGroups: ["Offense", "Defense", "Special Teams"],
        focus: "Walk-through, special teams, light contact",
        film: false,
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
            endTime: "18:00",
            arrivalTime: "15:15",
            type: "full_pads" as const,
            positionGroups: [],
            focus: "",
            film: false,
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
          const groups = b.positionGroups || [];
          return {
            ...b,
            positionGroups: groups.includes(group)
              ? groups.filter((g) => g !== group)
              : [...groups, group],
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
                Define practice blocks with equipment level, focus areas, and
                arrival times.
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
                  Practice Type
                </label>
                <select
                  className={inputClass}
                  value={block.type}
                  onChange={(e) =>
                    updateBlock(block.id, "type", e.target.value)
                  }
                >
                  {PRACTICE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Arrive By
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
                Position Groups
              </label>
              <div className="flex flex-wrap gap-2">
                {POSITION_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleGroup(block.id, group)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      (block.positionGroups || []).includes(group)
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
                placeholder="Red zone offense, 7-on-7, conditioning..."
                value={block.focus}
                onChange={(e) => updateBlock(block.id, "focus", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`film-${block.id}`}
                checked={block.film}
                onChange={(e) =>
                  updateBlock(block.id, "film", e.target.checked)
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              <label
                htmlFor={`film-${block.id}`}
                className="text-sm text-slate-600"
              >
                Pre-practice film session
              </label>
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
    const typeLabel = (t: string) =>
      PRACTICE_TYPES.find((pt) => pt.value === t)?.label || t;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
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
                <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                  {typeLabel(block.type)}
                </span>
              </div>
              <div
                className={`text-sm opacity-80 ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(block.startTime)} - {formatTime(block.endTime)}{" "}
                (arrive {formatTime(block.arrivalTime)})
              </div>
              {block.focus && (
                <div
                  className={`text-sm opacity-70 mt-2 ${textClass}`}
                  style={bodyShadow}
                >
                  {block.focus}
                </div>
              )}
              {block.film && (
                <div className="mt-2 px-2 py-1 bg-blue-500/20 text-blue-200 rounded text-xs inline-block">
                  📹 Film Session Before
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
// SECTION 4: TRAVEL & LOGISTICS
// ═══════════════════════════════════════════════════════════════════════════

const logisticsSection = {
  id: "logistics",
  menuTitle: "Travel & Logistics",
  menuDesc: "Away game travel, bus times, weather policy.",
  initialState: {
    travelMode: "bus" as const,
    callTime: "14:00",
    departureTime: "14:30",
    pickupWindow: "Return approx 11:00 PM - text sent when bus is 20 min out",
    hotelName: "",
    hotelAddress: "",
    mealPlan: "Pre-game meal provided. Bring snacks for the bus.",
    weatherPolicy:
      "Lightning: Players go to locker room. 30-min delay clock starts. Practice continues if no lightning for 30 min. Heavy rain: Moved indoors or cancelled (check GroupMe).",
  } as LogisticsInfo,
  renderEditor: ({ state, setState, inputClass, textareaClass }) => {
    const info: LogisticsInfo = state || {};
    const updateField = (field: string, value: any) => {
      setState((s: any) => ({ ...s, [field]: value }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bus className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-blue-900">Away Game Travel</h4>
              <p className="text-sm text-blue-700">
                Transportation details for away games.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Travel Mode
            </label>
            <select
              className={inputClass}
              value={info.travelMode || "bus"}
              onChange={(e) => updateField("travelMode", e.target.value)}
            >
              <option value="bus">🚌 Team Bus</option>
              <option value="parent_drive">🚗 Parent Drive</option>
              <option value="carpool">🚙 Carpool</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Call Time
            </label>
            <input
              type="time"
              className={inputClass}
              value={info.callTime || ""}
              onChange={(e) => updateField("callTime", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Bus Departure
            </label>
            <input
              type="time"
              className={inputClass}
              value={info.departureTime || ""}
              onChange={(e) => updateField("departureTime", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Pickup / Return Info
          </label>
          <textarea
            className={textareaClass}
            placeholder="Return time, where to pick up players..."
            value={info.pickupWindow || ""}
            onChange={(e) => updateField("pickupWindow", e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Meal Plan
          </label>
          <input
            className={inputClass}
            placeholder="Pre-game meal info, bring snacks..."
            value={info.mealPlan || ""}
            onChange={(e) => updateField("mealPlan", e.target.value)}
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-yellow-900">
                  Weather Policy
                </h4>
                <p className="text-sm text-yellow-700">
                  Important for parents to know what happens in bad weather.
                </p>
              </div>
            </div>
          </div>
          <textarea
            className={textareaClass}
            placeholder="Lightning protocol, rain policy, cancellation procedure..."
            value={info.weatherPolicy || ""}
            onChange={(e) => updateField("weatherPolicy", e.target.value)}
            rows={3}
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
    const info: LogisticsInfo = state || {};
    const hasData = info.travelMode || info.callTime || info.weatherPolicy;
    if (!hasData) return null;

    const formatTime = (t: string) => {
      if (!t) return "";
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };
    const modeIcon = {
      bus: "🚌",
      parent_drive: "🚗",
      carpool: "🚙",
      other: "🚐",
    };

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Travel & Logistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {info.travelMode && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl">
                {modeIcon[info.travelMode] || "🚐"}
              </div>
              <div
                className={`text-sm opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                {info.travelMode === "bus"
                  ? "Team Bus"
                  : info.travelMode === "parent_drive"
                  ? "Parent Drive"
                  : info.travelMode === "carpool"
                  ? "Carpool"
                  : "Other"}
              </div>
            </div>
          )}
          {info.callTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Call Time
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(info.callTime)}
              </div>
            </div>
          )}
          {info.departureTime && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div
                className={`text-xs uppercase tracking-wide opacity-70 ${textClass}`}
                style={bodyShadow}
              >
                Departure
              </div>
              <div
                className={`text-lg font-bold ${textClass}`}
                style={bodyShadow}
              >
                {formatTime(info.departureTime)}
              </div>
            </div>
          )}
        </div>
        {info.pickupWindow && (
          <div
            className={`text-sm opacity-80 mb-3 ${textClass}`}
            style={bodyShadow}
          >
            📍 {info.pickupWindow}
          </div>
        )}
        {info.mealPlan && (
          <div
            className={`text-sm opacity-80 mb-3 ${textClass}`}
            style={bodyShadow}
          >
            🍽️ {info.mealPlan}
          </div>
        )}
        {info.weatherPolicy && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
            <h3
              className={`font-semibold mb-2 ${textClass}`}
              style={bodyShadow}
            >
              ⛈️ Weather Policy
            </h3>
            <p
              className={`text-sm opacity-80 whitespace-pre-wrap ${textClass}`}
              style={bodyShadow}
            >
              {info.weatherPolicy}
            </p>
          </div>
        )}
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: EQUIPMENT CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

const gearSection = {
  id: "gear",
  menuTitle: "Equipment Checklist",
  menuDesc: "Required gear for games and practices.",
  initialState: {
    items: [
      {
        id: "g1",
        name: "Helmet",
        required: true,
        forGames: true,
        forPractice: true,
      },
      {
        id: "g2",
        name: "Shoulder Pads",
        required: true,
        forGames: true,
        forPractice: true,
      },
      {
        id: "g3",
        name: "Mouthguard",
        required: true,
        forGames: true,
        forPractice: true,
      },
      {
        id: "g4",
        name: "Cleats",
        required: true,
        forGames: true,
        forPractice: true,
      },
      {
        id: "g5",
        name: "Game Jersey",
        required: true,
        forGames: true,
        forPractice: false,
      },
      {
        id: "g6",
        name: "Practice Jersey (Dark)",
        required: true,
        forGames: false,
        forPractice: true,
      },
      {
        id: "g7",
        name: "Practice Jersey (Light)",
        required: true,
        forGames: false,
        forPractice: true,
      },
      {
        id: "g8",
        name: "Game Pants",
        required: true,
        forGames: true,
        forPractice: false,
      },
      {
        id: "g9",
        name: "Practice Shorts",
        required: true,
        forGames: false,
        forPractice: true,
      },
      {
        id: "g10",
        name: "2 Water Bottles",
        required: true,
        forGames: true,
        forPractice: true,
      },
    ] as GearItem[],
  },
  renderEditor: ({ state, setState, inputClass }) => {
    const items: GearItem[] = state?.items || [];
    const addItem = () => {
      setState((s: any) => ({
        ...s,
        items: [
          ...(s?.items || []),
          {
            id: genId(),
            name: "",
            required: false,
            forGames: true,
            forPractice: true,
          },
        ],
      }));
    };
    const updateItem = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).map((i: GearItem) =>
          i.id === id ? { ...i, [field]: value } : i
        ),
      }));
    };
    const removeItem = (id: string) => {
      setState((s: any) => ({
        ...s,
        items: (s?.items || []).filter((i: GearItem) => i.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shirt className="text-orange-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-orange-900">
                Equipment Checklist
              </h4>
              <p className="text-sm text-orange-700">
                What players need to bring for games and practices.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
            >
              <input
                className={`flex-1 ${inputClass} !p-2`}
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    updateItem(item.id, "required", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                Required
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={item.forGames}
                  onChange={(e) =>
                    updateItem(item.id, "forGames", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                Games
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={item.forPractice}
                  onChange={(e) =>
                    updateItem(item.id, "forPractice", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                Practice
              </label>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Item
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
    const items: GearItem[] = state?.items || [];
    if (items.length === 0) return null;
    const gameGear = items.filter((i) => i.forGames);
    const practiceGear = items.filter((i) => i.forPractice);

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Equipment Checklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3
              className={`font-semibold mb-3 ${textClass}`}
              style={bodyShadow}
            >
              🏈 Game Day
            </h3>
            <ul className="space-y-1">
              {gameGear.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 text-sm ${textClass}`}
                  style={bodyShadow}
                >
                  <span>{item.required ? "✓" : "○"}</span>
                  <span className={item.required ? "" : "opacity-70"}>
                    {item.name}
                  </span>
                  {item.required && (
                    <span className="text-xs bg-red-500/20 text-red-200 px-1 rounded">
                      REQ
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3
              className={`font-semibold mb-3 ${textClass}`}
              style={bodyShadow}
            >
              🏃 Practice
            </h3>
            <ul className="space-y-1">
              {practiceGear.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-2 text-sm ${textClass}`}
                  style={bodyShadow}
                >
                  <span>{item.required ? "✓" : "○"}</span>
                  <span className={item.required ? "" : "opacity-70"}>
                    {item.name}
                  </span>
                  {item.required && (
                    <span className="text-xs bg-red-500/20 text-red-200 px-1 rounded">
                      REQ
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: VOLUNTEERS
// ═══════════════════════════════════════════════════════════════════════════

const volunteersSection = {
  id: "volunteers",
  menuTitle: "Parent Volunteers",
  menuDesc: "Chain gang, concessions, and other game day help.",
  initialState: { slots: [] as VolunteerSlot[] },
  renderEditor: ({ state, setState, inputClass }) => {
    const slots: VolunteerSlot[] = state?.slots || [];
    const addSlot = () => {
      setState((s: any) => ({
        ...s,
        slots: [
          ...(s?.slots || []),
          {
            id: genId(),
            role: "Chain Gang",
            name: "",
            filled: false,
            gameDate: "",
          },
        ],
      }));
    };
    const updateSlot = (id: string, field: string, value: any) => {
      setState((s: any) => ({
        ...s,
        slots: (s?.slots || []).map((sl: VolunteerSlot) =>
          sl.id === id ? { ...sl, [field]: value } : sl
        ),
      }));
    };
    const removeSlot = (id: string) => {
      setState((s: any) => ({
        ...s,
        slots: (s?.slots || []).filter((sl: VolunteerSlot) => sl.id !== id),
      }));
    };

    return (
      <div className="space-y-6">
        <div className="bg-pink-50 border border-pink-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="text-pink-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-pink-900">
                Volunteer Sign-ups
              </h4>
              <p className="text-sm text-pink-700">
                Game day volunteer positions for parents.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
            >
              <select
                className={`${inputClass} !p-2 !w-auto`}
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
                type="date"
                className={`${inputClass} !p-2 !w-auto`}
                value={slot.gameDate}
                onChange={(e) =>
                  updateSlot(slot.id, "gameDate", e.target.value)
                }
              />
              <input
                className={`flex-1 ${inputClass} !p-2`}
                placeholder="Volunteer name"
                value={slot.name}
                onChange={(e) => updateSlot(slot.id, "name", e.target.value)}
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={slot.filled}
                  onChange={(e) =>
                    updateSlot(slot.id, "filled", e.target.checked)
                  }
                  className="w-4 h-4 rounded"
                />
                Filled
              </label>
              <button
                onClick={() => removeSlot(slot.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSlot}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-pink-400 hover:text-pink-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Add Volunteer Slot
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
    const slots: VolunteerSlot[] = state?.slots || [];
    if (slots.length === 0) return null;
    const filledCount = slots.filter((s) => s.filled).length;
    const neededCount = slots.filter((s) => !s.filled).length;

    return (
      <>
        <h2 className={`text-2xl mb-4 ${accentClass}`} style={headingFontStyle}>
          Volunteers Needed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots
            .filter((s) => !s.filled)
            .map((slot) => (
              <div
                key={slot.id}
                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div
                    className={`font-medium ${textClass}`}
                    style={bodyShadow}
                  >
                    {slot.role}
                  </div>
                  <div
                    className={`text-sm opacity-70 ${textClass}`}
                    style={bodyShadow}
                  >
                    {slot.gameDate
                      ? new Date(slot.gameDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "TBD"}
                  </div>
                </div>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded text-xs">
                  NEEDED
                </span>
              </div>
            ))}
        </div>
        <div
          className="mt-4 flex items-center gap-4 text-sm opacity-70"
          style={bodyShadow}
        >
          <span className={textClass}>✓ {filledCount} Filled</span>
          <span className={textClass}>⚠️ {neededCount} Needed</span>
        </div>
      </>
    );
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION & EXPORT
// ═══════════════════════════════════════════════════════════════════════════

const config: SimpleTemplateConfig = {
  slug: "football-season",
  displayName: "Football Season",
  category: "sport_football_season",
  categoryLabel: "Football Season",
  themesExpandedByDefault: true,
  defaultHero: "/templates/hero-images/football-hero.jpeg",
  detailFields: [
    { key: "team", label: "Team Name", placeholder: "Varsity Panthers" },
    { key: "season", label: "Season", placeholder: "Fall 2025" },
    {
      key: "league",
      label: "League / Conference",
      placeholder: "Metro Conference",
    },
    { key: "headCoach", label: "Head Coach", placeholder: "Coach Johnson" },
    { key: "stadium", label: "Home Stadium", placeholder: "Panthers Field" },
    {
      key: "stadiumAddress",
      label: "Stadium Address",
      placeholder: "123 Main St, Anytown, IL 60000",
    },
    {
      key: "athleticTrainer",
      label: "Athletic Trainer",
      placeholder: "Available at all games and practices",
    },
    {
      key: "contact",
      label: "Contact",
      placeholder: "coach@school.edu or 555-123-4567",
    },
  ],
  prefill: {
    title: "Panthers Football 2025",
    details:
      "Welcome to the 2025 Football Season! This page has everything players and parents need - game schedule, practice times, equipment list, travel info, and volunteer sign-ups. Go Panthers! 🏈",
    hero: "/templates/hero-images/football-hero.jpeg",
    date: "2025-11-30",
    time: "14:00",
    city: "Chicago",
    state: "IL",
    venue: "Panthers Field",
    rsvpEnabled: false,
    extra: {
      team: "Varsity Panthers",
      season: "Fall 2025",
      league: "Metro Conference",
      headCoach: "Coach Johnson",
      stadium: "Panthers Field",
      stadiumAddress: "123 Main St, Chicago, IL 60601",
      athleticTrainer: "Athletic Trainer on-site every game and practice",
      contact: "coach@school.edu • 555-123-4567",
    },
  },
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Track attendance and commitments.",
    editorTitle: "Attendance",
    toggleLabel: "Enable attendance tracking",
    deadlineLabel: "Response deadline",
    helperText: "Players and parents can confirm attendance.",
  },
  themes: [
    {
      id: "rivalry_red",
      name: "Rivalry Red",
      bg: "bg-gradient-to-br from-red-900 via-slate-950 to-red-700",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-red-900 via-slate-950 to-red-700",
    },
    {
      id: "victory_blue",
      name: "Victory Blue",
      bg: "bg-gradient-to-br from-blue-900 via-blue-800 to-sky-600",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-blue-900 via-blue-800 to-sky-600",
    },
    {
      id: "championship_crimson",
      name: "Championship Crimson",
      bg: "bg-gradient-to-br from-red-900 via-red-800 to-rose-600",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-red-900 via-red-800 to-rose-600",
    },
    {
      id: "panther_gold",
      name: "Panther Gold",
      bg: "bg-gradient-to-br from-slate-950 via-black to-amber-600",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-amber-600",
    },
    {
      id: "royal_spirit",
      name: "Royal Spirit",
      bg: "bg-gradient-to-br from-purple-900 via-indigo-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-500",
    },
    {
      id: "falcon_green",
      name: "Falcon Green",
      bg: "bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-500",
      text: "text-white",
      accent: "text-emerald-100",
      preview: "bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-500",
    },
    {
      id: "tiger_fire",
      name: "Tiger Fire",
      bg: "bg-gradient-to-br from-slate-950 via-orange-800 to-amber-600",
      text: "text-white",
      accent: "text-orange-200",
      preview: "bg-gradient-to-r from-slate-950 via-orange-800 to-amber-600",
    },
    {
      id: "patriot_navy",
      name: "Patriot Navy",
      bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-blue-950 via-blue-900 to-amber-500",
    },
    {
      id: "warrior_maroon",
      name: "Warrior Maroon",
      bg: "bg-gradient-to-br from-rose-950 via-rose-800 to-rose-600",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-950 via-rose-800 to-rose-600",
    },
    {
      id: "evergreen_pride",
      name: "Evergreen Pride",
      bg: "bg-gradient-to-br from-emerald-950 via-green-800 to-emerald-500",
      text: "text-white",
      accent: "text-emerald-100",
      preview: "bg-gradient-to-r from-emerald-950 via-green-800 to-emerald-500",
    },
    {
      id: "royal_honor",
      name: "Royal Honor",
      bg: "bg-gradient-to-br from-indigo-900 via-blue-800 to-amber-400",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-indigo-900 via-blue-800 to-amber-400",
    },
    {
      id: "steel_shadow",
      name: "Steel Shadow",
      bg: "bg-gradient-to-br from-slate-950 via-gray-800 to-slate-600",
      text: "text-white",
      accent: "text-slate-200",
      preview: "bg-gradient-to-r from-slate-950 via-gray-800 to-slate-600",
    },
    {
      id: "cardinal_glory",
      name: "Cardinal Glory",
      bg: "bg-gradient-to-br from-red-950 via-red-800 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-red-950 via-red-800 to-amber-500",
    },
    {
      id: "sailor_navy",
      name: "Sailor Navy",
      bg: "bg-gradient-to-br from-blue-950 via-blue-900 to-slate-300",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-blue-950 via-blue-900 to-slate-300",
    },
    {
      id: "violet_victory",
      name: "Violet Victory",
      bg: "bg-gradient-to-br from-violet-900 via-purple-800 to-violet-500",
      text: "text-white",
      accent: "text-violet-100",
      preview: "bg-gradient-to-r from-violet-900 via-purple-800 to-violet-500",
    },
    {
      id: "midnight_crimson",
      name: "Midnight Crimson",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-red-700",
      text: "text-white",
      accent: "text-red-200",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-red-700",
    },
    {
      id: "shamrock_spirit",
      name: "Shamrock Spirit",
      bg: "bg-gradient-to-br from-green-800 via-emerald-700 to-amber-300",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-green-800 via-emerald-700 to-amber-300",
    },
    {
      id: "grizzly_gold",
      name: "Grizzly Gold",
      bg: "bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-600",
      text: "text-white",
      accent: "text-amber-100",
      preview: "bg-gradient-to-r from-amber-900 via-orange-900 to-yellow-600",
    },
    {
      id: "patriot_fusion",
      name: "Patriot Fusion",
      bg: "bg-gradient-to-br from-blue-900 via-indigo-800 to-red-600",
      text: "text-white",
      accent: "text-red-100",
      preview: "bg-gradient-to-r from-blue-900 via-indigo-800 to-red-600",
    },
    {
      id: "iron_maroon",
      name: "Iron Maroon",
      bg: "bg-gradient-to-br from-rose-950 via-slate-700 to-rose-700",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-rose-950 via-slate-700 to-rose-700",
    },
    {
      id: "shadow_blaze",
      name: "Shadow Blaze",
      bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-orange-700",
      text: "text-white",
      accent: "text-orange-200",
      preview: "bg-gradient-to-r from-slate-950 via-slate-900 to-orange-700",
    },
    {
      id: "golden_light",
      name: "Golden Light",
      bg: "bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-400",
      text: "text-slate-900",
      accent: "text-amber-700",
      preview: "bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400",
    },
    {
      id: "storm_teal",
      name: "Storm Teal",
      bg: "bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-700",
      text: "text-white",
      accent: "text-cyan-100",
      preview: "bg-gradient-to-r from-slate-950 via-teal-900 to-cyan-700",
    },
    {
      id: "skyline_blue",
      name: "Skyline Blue",
      bg: "bg-gradient-to-br from-sky-800 via-sky-600 to-sky-300",
      text: "text-white",
      accent: "text-sky-100",
      preview: "bg-gradient-to-r from-sky-800 via-sky-600 to-sky-300",
    },
  ],
  advancedSections: [
    gameScheduleSection,
    practiceSection,
    rosterSection,
    logisticsSection,
    gearSection,
    volunteersSection,
  ],
};

export {
  config,
  gameScheduleSection,
  practiceSection,
  rosterSection,
  logisticsSection,
  gearSection,
  volunteersSection,
};
export type {
  PlayerStatus,
  Player,
  Game,
  PracticeBlock,
  LogisticsInfo,
  GearItem,
  VolunteerSlot,
};
