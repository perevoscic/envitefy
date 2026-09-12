"use client";

import { useId, useState } from "react";
import { parseScoreStreamWidget, SCORESTREAM_WIDGET_CREATOR } from "@/lib/scorestream";
import {
  findScoreStreamState,
  SCORESTREAM_STATES,
  scoreStreamStateUrl,
} from "@/lib/scorestream-states";
import ScoreStreamScoreboard from "./ScoreStreamScoreboard";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ScoreStreamEditor({ value, onChange }: Props) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const widget = parseScoreStreamWidget(value);
  const invalid = Boolean(value.trim()) && !widget;
  const showError = touched && invalid;
  const state = findScoreStreamState(value);
  const [customOpen, setCustomOpen] = useState(Boolean(value && !state));

  return (
    <div className="space-y-5 text-slate-800">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">High-school football scores</h3>
        <p className="text-sm leading-relaxed text-slate-600">
          Choose a state to show varsity football scores reported on ScoreStream. Visitors can
          browse other states without changing your event’s saved selection. Coverage varies by
          game.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor={`${id}-state`} className="block text-sm font-semibold">
          State or district
        </label>
        <select
          id={`${id}-state`}
          value={state?.code || ""}
          aria-describedby={`${id}-state-help`}
          onChange={(event) => {
            const selected = SCORESTREAM_STATES.find((entry) => entry.code === event.target.value);
            if (selected) {
              onChange(scoreStreamStateUrl(selected));
              setTouched(false);
              setCustomOpen(false);
            }
          }}
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <option value="" disabled>
            {value ? "Custom scoreboard" : "Choose a state"}
          </option>
          {SCORESTREAM_STATES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>
        <p id={`${id}-state-help`} className="text-sm text-slate-600">
          No ScoreStream account is needed for these state scoreboards. Save or publish your event
          to keep your choice.
        </p>
      </div>
      <details
        open={customOpen}
        onToggle={(event) => setCustomOpen(event.currentTarget.open)}
        className="rounded-xl border border-slate-200 p-4"
      >
        <summary className="min-h-11 cursor-pointer py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
          Use a team or custom scoreboard
        </summary>
        <div className="space-y-4 pt-3">
          <p className="text-sm leading-relaxed text-slate-600">
            Create a scoreboard for your teams in ScoreStream, then paste its embed code or link. A
            free ScoreStream account may be needed to create a custom widget.
          </p>
          <a
            href={SCORESTREAM_WIDGET_CREATOR}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Create a scoreboard in ScoreStream
          </a>
          <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-semibold">
              Scoreboard link or embed code
            </label>
            <textarea
              id={id}
              name="scorestreamWidget"
              value={value}
              maxLength={4096}
              rows={3}
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              aria-invalid={showError || undefined}
              aria-describedby={`${id}-help${showError ? ` ${id}-error` : ""}`}
              onBlur={() => setTouched(true)}
              onChange={(event) => {
                const next = event.target.value;
                onChange(parseScoreStreamWidget(next)?.url || next);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            />
            <p id={`${id}-help`} className="text-sm text-slate-600">
              Use the scoreboard’s embed link, rather than a team profile link. Save or publish your
              event to keep this connection.
            </p>
            {showError ? (
              <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
                Paste the scoreboard’s embed code or its ScoreStream widget URL.
              </p>
            ) : null}
          </div>
        </div>
      </details>
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setTouched(false);
            setCustomOpen(false);
          }}
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Remove scoreboard
        </button>
      ) : null}
      {widget ? (
        <div className="space-y-3">
          <h4 className="font-semibold">Scoreboard preview</h4>
          <ScoreStreamScoreboard value={widget.url} allowStateSelection={false} />
        </div>
      ) : null}
    </div>
  );
}
