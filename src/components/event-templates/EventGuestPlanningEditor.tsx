"use client";

import { getEventGuestPlanningFields, type EventGuestPlanning } from "@/lib/event-guest-planning";

export default function EventGuestPlanningEditor({
  value = {},
  onChange,
  category,
}: {
  value?: EventGuestPlanning;
  onChange: (value: EventGuestPlanning) => void;
  category?: string;
}) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-800">
      <legend className="px-2 text-sm font-semibold">Before guests arrive</legend>
      <p className="text-xs leading-5 text-slate-500">
        Optional guidance for your guest page. Leave a field blank to hide it.
      </p>
      {getEventGuestPlanningFields(category).map(({ key, label, placeholder }) => (
        <label key={key} className="block text-sm font-medium">
          {label}
          <textarea
            value={value[key] || ""}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
            placeholder={placeholder}
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm font-normal text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </label>
      ))}
    </fieldset>
  );
}
