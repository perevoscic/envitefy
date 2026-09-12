"use client";

import { useId, useState } from "react";
import FootballText from "./FootballPageText";
import { parseScoreStreamWidget } from "@/lib/scorestream";
import {
  findScoreStreamState,
  SCORESTREAM_STATES,
  scoreStreamStateUrl,
} from "@/lib/scorestream-states";

export default function ScoreStreamScoreboard({
  value,
  allowStateSelection = true,
}: {
  value?: string;
  allowStateSelection?: boolean;
}) {
  const id = useId();
  const [selection, setSelection] = useState({ source: "", url: "" });
  const savedWidget = parseScoreStreamWidget(value);
  const savedState = findScoreStreamState(savedWidget?.url || "");
  const widget = parseScoreStreamWidget(
    savedState && allowStateSelection && selection.source === savedWidget?.url
      ? selection.url
      : value,
  );
  if (!widget) return null;
  const state = findScoreStreamState(widget.url);

  return (
    <div className="min-w-0 space-y-2">
      {savedState && allowStateSelection ? (
        <div className="mb-4 space-y-2">
          <FootballText
            fallback="Scores by state"
            renderText={(caption) => (
              <label htmlFor={id} className="block text-sm font-semibold">
                {caption || "Scores by state"}
              </label>
            )}
          />
          <select
            id={id}
            value={state?.code || savedState.code}
            onChange={(event) => {
              const next = SCORESTREAM_STATES.find((entry) => entry.code === event.target.value);
              if (next && savedWidget)
                setSelection({ source: savedWidget.url, url: scoreStreamStateUrl(next) });
            }}
            aria-describedby={`${id}-help`}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 sm:max-w-sm"
          >
            {SCORESTREAM_STATES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </select>
          <p id={`${id}-help`} className="text-sm">
            High-school varsity football · Scores reported on ScoreStream
          </p>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-current/20 bg-white">
        <iframe
          key={widget.url}
          src={widget.url}
          title="Football scores from ScoreStream"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className={
            widget.layout === "vert"
              ? "block h-[480px] w-full border-0 sm:h-[600px]"
              : "block h-[240px] w-full border-0 sm:h-[300px]"
          }
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p>Scores reported on ScoreStream. Game coverage may vary.</p>
        <FootballText
          fallback="Open scoreboard in ScoreStream"
          renderText={(caption) => (
            <a
              href={widget.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-md font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {caption || "Open scoreboard in ScoreStream"}
            </a>
          )}
        />
      </div>
    </div>
  );
}
