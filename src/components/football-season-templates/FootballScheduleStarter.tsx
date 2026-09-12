"use client";

import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Flag,
  Plus,
  RotateCcw,
  Upload,
  Users,
  X,
} from "lucide-react";
import { type CSSProperties, type MouseEvent, useEffect, useRef } from "react";
import { getFootballDesign } from "./footballDesigns";

type StarterView = "games" | "discover" | "details" | "roster" | "practice";
export type FootballStarterPanelId = "all" | "matchup" | "details" | "roster" | "practice";

type Props = {
  templateId: string;
  onOpen: (view: StarterView) => void;
  headingClassName?: string;
  headingStyle?: CSSProperties;
  hasTeamDetails: boolean;
  hasRoster: boolean;
  hasPractice: boolean;
  dismissedPanels: FootballStarterPanelId[];
  onDismiss: (panel: FootballStarterPanelId) => void;
  onRestore: () => void;
};

/** Editor guidance only: none of this copy becomes event data. */
export default function FootballScheduleStarter({
  templateId,
  onOpen,
  headingClassName = "",
  headingStyle,
  hasTeamDetails,
  hasRoster,
  hasPractice,
  dismissedPanels,
  onDismiss,
  onRestore,
}: Props) {
  const design = getFootballDesign(templateId);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusAfterChange = useRef<"restore" | "heading" | null>(null);
  useEffect(() => {
    if (focusAfterChange.current === "restore") restoreRef.current?.focus();
    if (focusAfterChange.current === "heading") headingRef.current?.focus();
    focusAfterChange.current = null;
  }, [dismissedPanels]);
  const dismiss = (panel: FootballStarterPanelId, event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) focusAfterChange.current = "restore";
    onDismiss(panel);
  };
  const nextSteps = [
    {
      id: "details",
      title: "Introduce your team",
      copy: "Team name, home field, and season details.",
      icon: Flag,
      complete: hasTeamDetails,
    },
    {
      id: "roster",
      title: "Meet the roster",
      copy: "Give every player a place on the page.",
      icon: Users,
      complete: hasRoster,
    },
    {
      id: "practice",
      title: "Plan your practices",
      copy: "Keep the weekly routine in one place.",
      icon: ClipboardList,
      complete: hasPractice,
    },
  ] as const;
  const remainingSteps = nextSteps.filter(
    (step) => !step.complete && !dismissedPanels.includes(step.id),
  );
  const showMatchup = !dismissedPanels.includes("matchup");
  const focusClass =
    "cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";
  const closeClass = `absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center rounded-full border border-current/20 hover:border-current/60 hover:bg-current/10 ${focusClass}`;

  return (
    <div className={design.textClass}>
      {!dismissedPanels.includes("all") && (
        <section
          aria-labelledby="football-starter-heading"
          className={`@container relative space-y-6 ${design.sectionClass} ${design.textClass}`}
        >
          <button
            type="button"
            aria-label="Close all starter panels"
            title="Close all starter panels"
            onClick={(event) => dismiss("all", event)}
            className={closeClass}
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className={`grid items-start gap-6 pt-10 ${showMatchup ? "@2xl:grid-cols-2" : ""}`}>
            <div className="min-w-0">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
                <CalendarDays size={17} aria-hidden="true" />
                Your season starts here
              </p>
              <h2
                ref={headingRef}
                tabIndex={-1}
                id="football-starter-heading"
                className={`text-balance text-3xl font-bold leading-tight sm:text-4xl ${headingClassName}`}
                style={headingStyle}
              >
                Start your team schedule
              </h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed">
                Bring game days, your roster, and practice plans together. Add your first matchup or
                import a schedule to get the season rolling.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpen("games")}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 hover:opacity-90 ${focusClass} ${design.navActiveClass}`}
                >
                  <Plus size={17} aria-hidden="true" />
                  Build your schedule
                </button>
                <button
                  type="button"
                  onClick={() => onOpen("discover")}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 border border-current/30 ${focusClass} ${design.navIdleClass}`}
                >
                  <Upload size={17} aria-hidden="true" />
                  Import a schedule
                </button>
              </div>
            </div>
            {showMatchup && (
              <div className={`relative min-w-0 space-y-4 ${design.sectionCardClass}`}>
                <button
                  type="button"
                  aria-label="Close first matchup guide"
                  title="Close first matchup guide"
                  onClick={(event) => dismiss("matchup", event)}
                  className={closeClass}
                >
                  <X size={18} aria-hidden="true" />
                </button>
                <p className="pr-11 text-xs font-bold uppercase tracking-[0.16em]">Make it yours</p>
                <h3 className={`pr-9 text-2xl font-bold ${headingClassName}`} style={headingStyle}>
                  Your first matchup
                </h3>
                <ul className="space-y-3 text-sm leading-relaxed">
                  {[
                    "Your team & opponent",
                    "Game date & kickoff time",
                    "Home or away & stadium",
                  ].map((label, index) => (
                    <li key={label} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full border border-current/25 text-xs font-bold"
                      >
                        {index + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
                <p className="border-t border-current/20 pt-4 text-sm leading-relaxed">
                  Start with what you know. You can fill in the rest later.
                </p>
              </div>
            )}
          </div>
          {remainingSteps.length > 0 ? (
            <div className="grid gap-3 border-t border-current/20 pt-6 @xl:grid-cols-3">
              {remainingSteps.map(({ id, title, copy, icon: Icon }) => (
                <div key={id} className={`relative min-w-0 ${design.sectionCardClass}`}>
                  <button
                    type="button"
                    aria-label={`Close ${title.toLowerCase()} panel`}
                    title={`Close ${title.toLowerCase()} panel`}
                    onClick={(event) => dismiss(id, event)}
                    className={closeClass}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpen(id)}
                    className={`group flex min-h-11 w-full min-w-0 flex-col items-start gap-3 rounded-sm text-left hover:opacity-80 ${focusClass}`}
                  >
                    <span className="flex min-h-9 w-full items-center pr-11">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <span className="text-base font-bold">{title}</span>
                    <span className="text-sm leading-relaxed">{copy}</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}
      {dismissedPanels.length > 0 && (
        <button
          ref={restoreRef}
          type="button"
          onClick={(event) => {
            if (event.detail === 0) focusAfterChange.current = "heading";
            onRestore();
          }}
          className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-sm font-semibold hover:border-current/60 ${focusClass}`}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Restore panels
        </button>
      )}
    </div>
  );
}
