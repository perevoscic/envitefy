// @ts-nocheck
"use client";

import React from "react";

const genId = () => Math.random().toString(36).slice(2, 9);

const baseInputClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow";
const baseTextareaClass =
  "w-full p-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow min-h-[90px]";

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea
        className={baseTextareaClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className={baseInputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

const matchScheduleSection = {
  id: "events",
  menuTitle: "Matches & Competitions",
  menuDesc: "Opponent, kickoff, kit colors, call times.",
  initialState: {
    events: [
      {
        id: genId(),
        opponent: "River City FC",
        date: "",
        time: "17:30",
        homeAway: "away",
        venue: "River City Park",
        address: "123 Riverside Dr, Chicago, IL",
        callTime: "16:45",
        notes: "Bring alternate socks; white kit.",
      },
    ],
  },
  renderEditor: ({ state, setState }: any) => {
    const events = state?.events || [];
    const update = (id: string, field: string, value: string) => {
      setState((prev: any) => ({
        ...prev,
        events: (prev?.events || []).map((match: any) =>
          match.id === id ? { ...match, [field]: value } : match
        ),
      }));
    };
    const remove = (id: string) =>
      setState((prev: any) => ({
        ...prev,
        events: (prev?.events || []).filter((match: any) => match.id !== id),
      }));
    const add = () =>
      setState((prev: any) => ({
        ...prev,
        events: [
          ...(prev?.events || []),
          {
            id: genId(),
            opponent: "",
            date: "",
            time: "15:00",
            homeAway: "home",
            venue: "",
            address: "",
            callTime: "",
            notes: "",
          },
        ],
      }));
    return (
      <div className="space-y-4">
        {events.map((match: any, idx: number) => (
          <div
            key={match.id}
            className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              Match #{idx + 1}
              <button
                onClick={() => remove(match.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <InputGroup
              label="Opponent"
              value={match.opponent}
              onChange={(v) => update(match.id, "opponent", v)}
              placeholder="vs River City FC"
            />
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Date"
                type="date"
                value={match.date || ""}
                onChange={(v) => update(match.id, "date", v)}
              />
              <InputGroup
                label="Kickoff"
                type="time"
                value={match.time || ""}
                onChange={(v) => update(match.id, "time", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Venue"
                value={match.venue || ""}
                onChange={(v) => update(match.id, "venue", v)}
                placeholder="East Complex Field 3"
              />
              <InputGroup
                label="Call Time"
                value={match.callTime || ""}
                onChange={(v) => update(match.id, "callTime", v)}
                placeholder="Arrive 45 min early"
              />
            </div>
            <InputGroup
              label="Address"
              value={match.address || ""}
              onChange={(v) => update(match.id, "address", v)}
              placeholder="Street, City, State"
            />
            <InputGroup
              label="Notes"
              type="textarea"
              value={match.notes || ""}
              onChange={(v) => update(match.id, "notes", v)}
              placeholder="Kit colors, scout reminders..."
            />
          </div>
        ))}
        <button
          onClick={add}
          type="button"
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          Add Match
        </button>
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const events = state?.events || [];
    if (!events.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Matches
        </h3>
        <ul className="space-y-2 text-sm">
          {events.map((match: any) => (
            <li
              key={match.id}
              className="bg-white/10 border border-white/15 rounded-lg p-3"
            >
              <div className="font-semibold text-base">
                {match.homeAway === "away" ? "AWAY" : "HOME"} vs{" "}
                {match.opponent || "Opponent"}
              </div>
              <div className="opacity-80">
                {match.date || "Date"} · {match.time || "Time"}
              </div>
              {match.venue && <div>{match.venue}</div>}
              {match.notes && (
                <p className="opacity-70 text-xs mt-1">{match.notes}</p>
              )}
            </li>
          ))}
        </ul>
      </>
    );
  },
};

const practicePlanSection = {
  id: "practice",
  menuTitle: "Training Plan",
  menuDesc: "Weekly sessions, focus areas, arrival windows.",
  initialState: {
    blocks: [
      {
        id: genId(),
        day: "Wednesday",
        startTime: "17:00",
        endTime: "18:30",
        arrivalTime: "16:40",
        focus: "Press triggers, finishing in the box",
      },
      {
        id: genId(),
        day: "Friday",
        startTime: "17:30",
        endTime: "19:00",
        arrivalTime: "17:10",
        focus: "Set-piece rehearsal, half-field scrimmage",
      },
    ],
  },
  renderEditor: ({ state, setState }: any) => {
    const blocks = state?.blocks || [];
    const update = (id: string, field: string, value: string) => {
      setState((prev: any) => ({
        ...prev,
        blocks: (prev?.blocks || []).map((block: any) =>
          block.id === id ? { ...block, [field]: value } : block
        ),
      }));
    };
    const remove = (id: string) =>
      setState((prev: any) => ({
        ...prev,
        blocks: (prev?.blocks || []).filter((block: any) => block.id !== id),
      }));
    const add = () =>
      setState((prev: any) => ({
        ...prev,
        blocks: [
          ...(prev?.blocks || []),
          {
            id: genId(),
            day: "Saturday",
            startTime: "09:00",
            endTime: "10:30",
            arrivalTime: "08:40",
            focus: "Recovery walk & team stretch",
          },
        ],
      }));
    return (
      <div className="space-y-4">
        {blocks.map((block: any, idx: number) => (
          <div
            key={block.id}
            className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              Session #{idx + 1}
              <button
                onClick={() => remove(block.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Day"
                value={block.day}
                onChange={(v) => update(block.id, "day", v)}
                placeholder="Tuesday"
              />
              <InputGroup
                label="Arrival"
                value={block.arrivalTime || ""}
                onChange={(v) => update(block.id, "arrivalTime", v)}
                placeholder="4:45 PM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Start"
                type="time"
                value={block.startTime || ""}
                onChange={(v) => update(block.id, "startTime", v)}
              />
              <InputGroup
                label="End"
                type="time"
                value={block.endTime || ""}
                onChange={(v) => update(block.id, "endTime", v)}
              />
            </div>
            <InputGroup
              label="Focus / Notes"
              type="textarea"
              value={block.focus || ""}
              onChange={(v) => update(block.id, "focus", v)}
              placeholder="Finishing circuit, press triggers..."
            />
          </div>
        ))}
        <button
          onClick={add}
          type="button"
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Add Training Session
        </button>
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const blocks = state?.blocks || [];
    if (!blocks.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Training Plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {blocks.map((block: any) => (
            <div
              key={block.id}
              className="bg-white/10 border border-white/15 rounded-lg p-3"
            >
              <div className="font-semibold">
                {block.day} · {block.startTime || "Start"} -{" "}
                {block.endTime || "End"}
              </div>
              {block.focus && (
                <p className="opacity-75 text-xs mt-1">{block.focus}</p>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const MAX_FORMATION_SLOTS = 11;

const lineupSection = {
  id: "lineup",
  menuTitle: "Lineup & Formation",
  menuDesc: "Assign players to a 4-3-3 grid for parents to visualize.",
  initialState: {
    formation: [
      {
        id: genId(),
        label: "LW",
        player: "Andre Flores",
        line: 1,
        spot: 1,
        number: "11",
      },
      {
        id: genId(),
        label: "ST",
        player: "Leo Park",
        line: 1,
        spot: 2,
        number: "9",
      },
      {
        id: genId(),
        label: "RW",
        player: "Maya Ellis",
        line: 1,
        spot: 3,
        number: "7",
      },
      {
        id: genId(),
        label: "LCM",
        player: "Nora Reed",
        line: 2,
        spot: 1,
        number: "8",
      },
      {
        id: genId(),
        label: "CM",
        player: "Sam Torres",
        line: 2,
        spot: 2,
        number: "6",
      },
      {
        id: genId(),
        label: "RCM",
        player: "Gia Patel",
        line: 2,
        spot: 3,
        number: "10",
      },
      {
        id: genId(),
        label: "LB",
        player: "Isla Hernandez",
        line: 3,
        spot: 1,
        number: "3",
      },
      {
        id: genId(),
        label: "LCB",
        player: "Rowen Chu",
        line: 3,
        spot: 2,
        number: "4",
      },
      {
        id: genId(),
        label: "RCB",
        player: "Miles Cooper",
        line: 3,
        spot: 3,
        number: "5",
      },
      {
        id: genId(),
        label: "RB",
        player: "Devin Ross",
        line: 3,
        spot: 4,
        number: "2",
      },
      {
        id: genId(),
        label: "GK",
        player: "Rowan Patel",
        line: 4,
        spot: 2,
        number: "1",
      },
    ],
  },
  renderEditor: ({ state, setState }: any) => {
    const formation = state?.formation || [];
    const update = (id: string, field: string, value: string | number) => {
      setState((prev: any) => ({
        ...prev,
        formation: (prev?.formation || []).map((slot: any) =>
          slot.id === id ? { ...slot, [field]: value } : slot
        ),
      }));
    };
    const add = () =>
      setState((prev: any) => {
        const existing = prev?.formation || [];
        if (existing.length >= MAX_FORMATION_SLOTS) return prev;
        return {
          ...prev,
          formation: [
            ...existing,
            {
              id: genId(),
              label: "New Role",
              player: "",
              line: 2,
              spot: 2,
              number: "",
            },
          ],
        };
      });
    const remove = (id: string) =>
      setState((prev: any) => ({
        ...prev,
        formation: (prev?.formation || []).filter((slot: any) => slot.id !== id),
      }));
    return (
      <div className="space-y-4">
        {formation.map((slot: any, idx: number) => (
          <div
            key={slot.id}
            className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              Position #{idx + 1}
              <button
                onClick={() => remove(slot.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <InputGroup
              label="Label"
              value={slot.label || ""}
              onChange={(v) => update(slot.id, "label", v)}
              placeholder="e.g., ST, RB"
            />
            <InputGroup
              label="Player"
              value={slot.player || ""}
              onChange={(v) => update(slot.id, "player", v)}
              placeholder="Player name"
            />
            <div className="grid grid-cols-3 gap-3">
              <InputGroup
                label="Line (1 Attack - 4 Keeper)"
                value={String(slot.line || 1)}
                onChange={(v) => update(slot.id, "line", Number(v) || 1)}
                placeholder="1-4"
              />
              <InputGroup
                label="Spot (1 Left - 4 Right)"
                value={String(slot.spot || 2)}
                onChange={(v) => update(slot.id, "spot", Number(v) || 2)}
                placeholder="1-4"
              />
              <InputGroup
                label="Jersey #"
                value={slot.number || ""}
                onChange={(v) => update(slot.id, "number", v)}
                placeholder="10"
              />
            </div>
          </div>
        ))}
        <button
          onClick={add}
          type="button"
          disabled={(formation?.length || 0) >= MAX_FORMATION_SLOTS}
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {formation.length >= MAX_FORMATION_SLOTS
            ? "Lineup is full (11 players)"
            : "Add Position"}
        </button>
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const formation = state?.formation || [];
    if (!formation.length) return null;
    const rows = [1, 2, 3, 4].map((line) =>
      formation.filter((slot: any) => (slot.line || 1) === line)
    );
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Lineup
        </h3>
        <div className="bg-gradient-to-b from-green-700 to-green-600 border border-green-900 rounded-2xl p-4 space-y-4 text-white text-center">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center gap-4 text-sm"
            >
              {row.map((slot: any) => (
                <div
                  key={slot.id}
                  className="px-3 py-2 rounded-full bg-white/10 border border-white/20 shadow-sm min-w-[110px]"
                >
                  <div className="text-xs uppercase opacity-80">
                    {slot.label || "Role"}
                  </div>
                  {slot.number && (
                    <div className="text-xs font-semibold opacity-80">
                      #{slot.number}
                    </div>
                  )}
                  <div className="font-semibold">
                    {slot.player || "TBD"}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const rosterSection = {
  id: "roster",
  menuTitle: "Roster & Parents",
  menuDesc: "Players, jersey numbers, status, parent contacts.",
  initialState: {
    athletes: [
      {
        id: genId(),
        name: "Maya Ellis",
        jerseyNumber: "10",
        position: "Forward",
        status: "active",
        level: "Starter",
        parentName: "Lena Ellis",
        parentPhone: "555-210-8842",
        parentEmail: "lena@example.com",
        medicalNotes: "Ankle tape every match.",
      },
      {
        id: genId(),
        name: "Rowan Patel",
        jerseyNumber: "1",
        position: "Goalkeeper",
        status: "active",
        level: "Keeper",
        parentName: "Raj Patel",
        parentPhone: "555-445-7717",
        parentEmail: "raj@example.com",
        medicalNotes: "",
      },
    ],
  },
  renderEditor: ({ state, setState }: any) => {
    const athletes = state?.athletes || [];
    const update = (id: string, field: string, value: string) => {
      setState((prev: any) => ({
        ...prev,
        athletes: (prev?.athletes || []).map((ath: any) =>
          ath.id === id ? { ...ath, [field]: value } : ath
        ),
      }));
    };
    const remove = (id: string) =>
      setState((prev: any) => ({
        ...prev,
        athletes: (prev?.athletes || []).filter((ath: any) => ath.id !== id),
      }));
    const add = () =>
      setState((prev: any) => ({
        ...prev,
        athletes: [
          ...(prev?.athletes || []),
          {
            id: genId(),
            name: "",
            jerseyNumber: "",
            position: "",
            status: "active",
            level: "",
            parentName: "",
            parentPhone: "",
            parentEmail: "",
            medicalNotes: "",
          },
        ],
      }));
    return (
      <div className="space-y-4">
        {athletes.map((athlete: any, idx: number) => (
          <div
            key={athlete.id}
            className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              Player #{idx + 1}
              <button
                onClick={() => remove(athlete.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputGroup
                label="Name"
                value={athlete.name || ""}
                onChange={(v) => update(athlete.id, "name", v)}
              />
              <InputGroup
                label="Jersey #"
                value={athlete.jerseyNumber || ""}
                onChange={(v) => update(athlete.id, "jerseyNumber", v)}
              />
              <InputGroup
                label="Position"
                value={athlete.position || ""}
                onChange={(v) => update(athlete.id, "position", v)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InputGroup
                label="Role"
                value={athlete.level || ""}
                onChange={(v) => update(athlete.id, "level", v)}
                placeholder="Starter, CB, Midfield..."
              />
              <InputGroup
                label="Status"
                value={athlete.status || "active"}
                onChange={(v) => update(athlete.id, "status", v)}
                placeholder="active / injured"
              />
              <InputGroup
                label="Parent Name"
                value={athlete.parentName || ""}
                onChange={(v) => update(athlete.id, "parentName", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup
                label="Parent Phone"
                value={athlete.parentPhone || ""}
                onChange={(v) => update(athlete.id, "parentPhone", v)}
              />
              <InputGroup
                label="Parent Email"
                value={athlete.parentEmail || ""}
                onChange={(v) => update(athlete.id, "parentEmail", v)}
              />
            </div>
            <InputGroup
              label="Notes"
              type="textarea"
              value={athlete.medicalNotes || ""}
              onChange={(v) => update(athlete.id, "medicalNotes", v)}
              placeholder="Availability, medical reminders..."
            />
          </div>
        ))}
        <button
          onClick={add}
          type="button"
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
        >
          Add Player
        </button>
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const athletes = state?.athletes || [];
    if (!athletes.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Roster
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {athletes.map((ath: any) => (
            <div
              key={ath.id}
              className="bg-white/10 border border-white/15 rounded-lg p-3"
            >
              <div className="font-semibold">
                #{ath.jerseyNumber || "??"} {ath.name || "Player"}
              </div>
              <div className="opacity-75">
                {ath.position || "Position"} · {ath.status || "Status"}
              </div>
              {ath.parentPhone && (
                <div className="opacity-70 text-xs mt-1">
                  Parent: {ath.parentPhone}
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  },
};

const snacksSection = {
  id: "snacks",
  menuTitle: "Snacks & Hydration",
  menuDesc: "Assign families to oranges, drinks, and post-game treats.",
  initialState: {
    slots: [
      {
        id: genId(),
        role: "Oranges / Fruit",
        family: "Martinez family",
        contact: "555-222-1188",
        notes: "",
        filled: true,
      },
      {
        id: genId(),
        role: "Sports Drinks",
        family: "",
        contact: "",
        notes: "",
        filled: false,
      },
      {
        id: genId(),
        role: "Post-match snack",
        family: "",
        contact: "",
        notes: "",
        filled: false,
      },
    ],
  },
  renderEditor: ({ state, setState }: any) => {
    const slots = state?.slots || [];
    const update = (id: string, field: string, value: any) => {
      setState((prev: any) => ({
        ...prev,
        slots: (prev?.slots || []).map((slot: any) =>
          slot.id === id ? { ...slot, [field]: value } : slot
        ),
      }));
    };
    const remove = (id: string) =>
      setState((prev: any) => ({
        ...prev,
        slots: (prev?.slots || []).filter((slot: any) => slot.id !== id),
      }));
    const add = () =>
      setState((prev: any) => ({
        ...prev,
        slots: [
          ...(prev?.slots || []),
          { id: genId(), role: "Hydration", family: "", contact: "", notes: "", filled: false },
        ],
      }));
    return (
      <div className="space-y-4">
        {slots.map((slot: any, idx: number) => (
          <div
            key={slot.id}
            className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              Slot #{idx + 1}
              <button
                onClick={() => remove(slot.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <InputGroup
              label="Role"
              value={slot.role || ""}
              onChange={(v) => update(slot.id, "role", v)}
              placeholder="Oranges / Drinks / Snack"
            />
            <InputGroup
              label="Family / Volunteer"
              value={slot.family || ""}
              onChange={(v) => update(slot.id, "family", v)}
              placeholder="Family name"
            />
            <InputGroup
              label="Contact"
              value={slot.contact || ""}
              onChange={(v) => update(slot.id, "contact", v)}
              placeholder="Phone or email"
            />
            <InputGroup
              label="Notes"
              type="textarea"
              value={slot.notes || ""}
              onChange={(v) => update(slot.id, "notes", v)}
              placeholder="Instructions or meeting spot"
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(slot.filled)}
                onChange={(e) =>
                  update(slot.id, "filled", e.target.checked)
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              Filled
            </label>
          </div>
        ))}
        <button
          onClick={add}
          type="button"
          className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          Add Snack Slot
        </button>
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const slots = state?.slots || [];
    if (!slots.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Snacks & Hydration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {slots.map((slot: any) => (
            <div
              key={slot.id}
              className={`p-3 rounded-lg border ${
                slot.filled
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-dashed border-white/40"
              }`}
            >
              <div className="font-semibold text-sm">{slot.role}</div>
              {slot.family ? (
                <p className="text-xs opacity-80">
                  {slot.family}
                  {slot.contact ? ` · ${slot.contact}` : ""}
                </p>
              ) : (
                <p className="text-xs opacity-70 italic">Open slot – sign up!</p>
              )}
              {slot.notes && (
                <p className="text-xs opacity-70 mt-1">{slot.notes}</p>
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
  menuTitle: "Logistics & Travel",
  menuDesc: "Transport mode, hotel, pickup window, weather policy.",
  initialState: {
    travelMode: "carpool",
    transport: "Carpool departs clubhouse at 2:00 PM",
    callTime: "16:45",
    departureTime: "13:30",
    pickupWindow: "Return approx 7:30 PM (text thread update)",
    hotelName: "",
    mealPlan: "Water + oranges provided. Bring extra electrolytes.",
    weatherPolicy:
      "Heat index >95° = additional water break. Lightning = shelter in clubhouse until 30 min clear.",
  },
  renderEditor: ({ state, setState }: any) => {
    const update = (field: string, value: string) => {
      setState((prev: any) => ({ ...prev, [field]: value }));
    };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Travel Mode
            </label>
            <select
              className={baseInputClass}
              value={state?.travelMode || "carpool"}
              onChange={(e) => update("travelMode", e.target.value)}
            >
              <option value="carpool">Carpool</option>
              <option value="bus">Team bus</option>
              <option value="parent_drive">Parent drive</option>
              <option value="other">Other</option>
            </select>
          </div>
          <InputGroup
            label="Call Time"
            value={state?.callTime || ""}
            onChange={(v) => update("callTime", v)}
            placeholder="Meet at field 45 min early"
          />
        </div>
        <InputGroup
          label="Transport Details"
          value={state?.transport || ""}
          onChange={(v) => update("transport", v)}
          placeholder="Bus departs clubhouse 2:00 PM"
        />
        <InputGroup
          label="Pickup / Return Window"
          value={state?.pickupWindow || ""}
          onChange={(v) => update("pickupWindow", v)}
          placeholder="Return approx 7:30 PM"
        />
        <InputGroup
          label="Meals / Snacks"
          value={state?.mealPlan || ""}
          onChange={(v) => update("mealPlan", v)}
          placeholder="Water + oranges provided; bring protein bar"
        />
        <InputGroup
          label="Weather / Field Alerts"
          type="textarea"
          value={state?.weatherPolicy || ""}
          onChange={(v) => update("weatherPolicy", v)}
          placeholder="Lightning protocol, heat policy..."
        />
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    if (!state) return null;
    const fields = [
      ["Travel", state.transport || state.travelMode],
      ["Call Time", state.callTime],
      ["Pickup", state.pickupWindow],
      ["Meals", state.mealPlan],
      ["Weather", state.weatherPolicy],
    ].filter(([, value]) => value);
    if (!fields.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Logistics
        </h3>
        <div className="space-y-1 text-sm">
          {fields.map(([label, value]) => (
            <p key={label} className="opacity-80">
              <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>
      </>
    );
  },
};

const gearSection = {
  id: "gear",
  menuTitle: "Equipment & Kit",
  menuDesc: "Uniform colors, gear checklist, hydration plan.",
  initialState: {
    gear: {
      uniform: "Home kit (navy/white) + alternate socks",
      hairMakeup: "Hair pulled back, GPS vests charged",
      shoes: "Firm-ground boots + turf backups",
      props: "Match balls, pump, med kit, GPS base",
      musicLink: "",
      checklist: "Water jug, cones, bibs, spare shin guards",
    },
  },
  renderEditor: ({ state, setState }: any) => {
    const gear = state?.gear || {};
    const update = (field: string, value: string) => {
      setState((prev: any) => ({
        ...prev,
        gear: { ...(prev?.gear || {}), [field]: value },
      }));
    };
    return (
      <div className="space-y-3">
        <InputGroup
          label="Uniform"
          value={gear.uniform || ""}
          onChange={(v) => update("uniform", v)}
          placeholder="Home kit, alternate socks"
        />
        <InputGroup
          label="Hydration / Warm-up Gear"
          value={gear.hairMakeup || ""}
          onChange={(v) => update("hairMakeup", v)}
          placeholder="Water, GPS vest, Therabands"
        />
        <InputGroup
          label="Shoes / Extras"
          value={gear.shoes || ""}
          onChange={(v) => update("shoes", v)}
          placeholder="Firm ground, turf backups, tape"
        />
        <InputGroup
          label="Equipment / Props"
          value={gear.props || ""}
          onChange={(v) => update("props", v)}
          placeholder="Balls, pump, med kit"
        />
        <InputGroup
          label="Checklist"
          type="textarea"
          value={gear.checklist || ""}
          onChange={(v) => update("checklist", v)}
          placeholder="Rosin, towels, speaker..."
        />
      </div>
    );
  },
  renderPreview: ({ state }: any) => {
    const gear = state?.gear;
    if (!gear) return null;
    const items = [
      ["Uniform", gear.uniform],
      ["Hydration", gear.hairMakeup],
      ["Shoes", gear.shoes],
      ["Equipment", gear.props],
      ["Checklist", gear.checklist],
    ].filter(([, value]) => value);
    if (!items.length) return null;
    return (
      <>
        <h3 className="text-sm uppercase tracking-widest text-slate-200 mb-2">
          Kit & Equipment
        </h3>
        <div className="space-y-1 text-sm">
          {items.map(([label, value]) => (
            <p key={label} className="opacity-80">
              <strong>{label}:</strong> {value}
            </p>
          ))}
        </div>
      </>
    );
  },
};

const config = {
  slug: "soccer",
  displayName: "Soccer Match",
  category: "sport_soccer",
  categoryLabel: "Soccer",
  defaultHero: "/templates/hero-images/soccer-hero.jpeg",
  detailFields: [
    { key: "opponent", label: "Opponent", placeholder: "vs River City FC" },
    { key: "league", label: "League / Division", placeholder: "U12 Premier" },
    {
      key: "field",
      label: "Field / Pitch",
      placeholder: "Field 3, East Complex",
    },
    {
      key: "meetingPoint",
      label: "Meeting Point",
      placeholder: "Parking Lot C (by snack bar)",
    },
    {
      key: "travelPlan",
      label: "Travel & Carpool",
      placeholder: "Bus departs club 1:15 PM; Row 1 = Captains",
    },
    {
      key: "kit",
      label: "Uniform Colors",
      placeholder: "Home: Navy/White, Away: White/Navy",
    },
    {
      key: "warmup",
      label: "Warm-up & Arrival",
      placeholder: "Arrive 45 min early; warm-up 2:15 PM",
    },
    {
      key: "keeperRotation",
      label: "Keeper / Sub Rotation",
      placeholder: "1st half Izzy, 2nd half Rowan",
    },
    {
      key: "practiceFocus",
      label: "Training Focus",
      placeholder: "Midweek: press triggers, set pieces",
    },
    {
      key: "weatherPlan",
      label: "Weather / Field Alerts",
      placeholder: "Lightning = clubhouse; heat policy",
    },
    {
      key: "coachContact",
      label: "Coach / Staff Contact",
      placeholder: "Coach Ellis · 555-123-9822",
    },
  ],
  rsvpCopy: {
    menuTitle: "Attendance",
    menuDesc: "Turn on attendance tracking tied to your roster.",
    editorTitle: "Attendance",
    toggleLabel: "Enable attendance tracking",
    deadlineLabel: "Attendance Deadline",
    helperText:
      "When enabled, families can pick their athlete from the roster and log if they are going, maybe, or out.",
  },
  prefill: {
    title: "Lakeshore FC at River City",
    date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      return d.toISOString().split("T")[0];
    })(),
    time: "17:30",
    city: "Chicago",
    state: "IL",
    venue: "East Complex Field 3",
    details:
      "Full match brief for players and parents: kit colors, meeting point, carpool details, lineup notes, and training priorities all in one shareable page.",
    extra: {
      opponent: "River City FC",
      league: "U12 Premier",
      field: "Field 3, East Complex",
      meetingPoint: "Parking Lot C (by snack bar) at 1:45 PM",
      travelPlan: "Carpool leaves clubhouse 2:00 PM — Ellis mini-bus seats 1-12.",
      kit: "Home kit (navy/white). Bring white socks as backup.",
      warmup: "Arrive 45 min early; rondos start 2:40 PM; stretch 2:55 PM.",
      keeperRotation: "1st half Izzy, 2nd half Rowan; emergency Miles.",
      practiceFocus: "Midweek: press triggers, set-piece movement.",
      weatherPlan: "Heat index >95° = extra water break. Lightning = clubhouse.",
      coachContact: "Coach Ellis · 555-123-9822",
    },
  },
  advancedSections: [
    matchScheduleSection,
    lineupSection,
    practicePlanSection,
    rosterSection,
    logisticsSection,
    gearSection,
    snacksSection,
  ],
  themes: [
    {
      id: "pitch_royal",
      name: "Pitch Royal",
      bg: "bg-gradient-to-br from-blue-900 via-blue-800 to-slate-100",
      text: "text-white",
      accent: "text-sky-200",
      preview: "bg-gradient-to-r from-blue-900 via-blue-800 to-slate-100",
    },
    {
      id: "striker_red",
      name: "Striker Red",
      bg: "bg-gradient-to-br from-red-900 via-red-800 to-rose-300",
      text: "text-white",
      accent: "text-rose-100",
      preview: "bg-gradient-to-r from-red-900 via-red-800 to-rose-300",
    },
    {
      id: "classic_kit",
      name: "Classic Kit",
      bg: "bg-gradient-to-br from-slate-950 via-slate-700 to-slate-300",
      text: "text-white",
      accent: "text-slate-100",
      preview: "bg-gradient-to-r from-slate-950 via-slate-700 to-slate-300",
    },
    {
      id: "field_green",
      name: "Field Green",
      bg: "bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500",
      text: "text-white",
      accent: "text-emerald-100",
      preview:
        "bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-500",
    },
    {
      id: "sunset_strikers",
      name: "Sunset Strikers",
      bg: "bg-gradient-to-br from-slate-950 via-orange-800 to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-orange-800 to-amber-500",
    },
    {
      id: "midnight_fc",
      name: "Midnight FC",
      bg: "bg-gradient-to-br from-slate-950 via-blue-900 to-blue-700",
      text: "text-white",
      accent: "text-blue-200",
      preview: "bg-gradient-to-r from-slate-950 via-blue-900 to-blue-700",
    },
    {
      id: "golden_cleats",
      name: "Golden Cleats",
      bg: "bg-gradient-to-br from-slate-950 via-black to-amber-500",
      text: "text-white",
      accent: "text-amber-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-amber-500",
    },
    {
      id: "neon_striker",
      name: "Neon Striker",
      bg: "bg-gradient-to-br from-slate-950 via-black to-lime-500",
      text: "text-white",
      accent: "text-lime-200",
      preview: "bg-gradient-to-r from-slate-950 via-black to-lime-500",
    },
  ],
};

export { config };
