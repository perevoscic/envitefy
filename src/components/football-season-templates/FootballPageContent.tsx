"use client";

import { EventSectionCanvas, useEventSectionBuilder } from "@/components/events/EventSectionBuilder";
import type { CSSProperties, ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";
import FootballText from "./FootballPageText";
import FootballSchedule from "./FootballSchedule";
import ScoreStreamScoreboard from "./ScoreStreamScoreboard";
import type { useFootballSectionTabs } from "./FootballSectionTabs";
import type { FootballGame, FootballHome } from "@/lib/football-games";

type Card = {
  id: string;
  title: string;
  body?: string;
  meta?: string;
  details?: string[];
  href?: string;
  fieldKey?: string;
};
export type FootballPageSection = {
  id: string;
  label: string;
  eyebrow?: string;
  cards?: Card[];
  lines?: string[];
  hasContent: boolean;
  scorestreamWidgetUrl?: string;
};
type Chrome = {
  sectionClass: string;
  sectionTitleClass: string;
  sectionTitleStyle?: CSSProperties;
  accentClass: string;
  sectionMutedClass: string;
  sectionCardClass: string;
  textClass: string;
  mutedClass: string;
};
type Attendance = {
  passcodeLabel: string;
  passcodeHint: string;
  passcodeRequired: boolean;
  helperText: string;
  deadline?: string;
};

/** The editor and published page render exactly the same section wording and content. */
export default function FootballPageContent({
  sections,
  tabs,
  chrome,
  schedule,
  attendance,
  onRemove,
  sectionAction,
}: {
  sections: FootballPageSection[];
  tabs: ReturnType<typeof useFootballSectionTabs>;
  chrome: Chrome;
  schedule: FootballHome & { games: FootballGame[] };
  attendance: Attendance;
  onRemove?: (id: string) => void;
  sectionAction?: (id: string) => ReactNode;
}) {
  const builder = useEventSectionBuilder();
  return (
    <EventSectionCanvas className="space-y-4 px-3 pb-5 pt-6 sm:px-5 sm:pb-6 sm:pt-7"
      sections={sections.filter((section) => section.hasContent).map((section) => ({
        id: section.id === "attendance" ? "rsvp" : section.id,
        label: section.label,
        editorId: section.id === "attendance" ? "rsvp" : section.id,
        content: (
          <section
            key={section.id}
            {...(builder ? { id: section.id } : tabs.panelProps(section.id))}
            className={`${chrome.sectionClass} scroll-mt-28`}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                {section.eyebrow ? (
                  <p
                    className={`text-[10px] font-black uppercase tracking-[0.26em] ${chrome.accentClass}`}
                  >
                    <FootballText
                      textKey={`section:${section.id}:caption`}
                      fallback={section.eyebrow}
                      label={`${section.label} caption`}
                    />
                  </p>
                ) : null}
                <h2
                  className={`mt-2 text-2xl font-black uppercase tracking-tight ${chrome.sectionTitleClass}`}
                  style={chrome.sectionTitleStyle}
                >
                  <FootballText
                    textKey={`section:${section.id}:title`}
                    fallback={section.label}
                    label={`${section.label} heading`}
                  />
                </h2>
              </div>
              {onRemove && !builder ? (
                <button
                  type="button"
                  onClick={() => onRemove(section.id)}
                  aria-label={`Remove ${section.label} section`}
                  title={`Remove ${section.label} section`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-current/25 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {sectionAction?.(section.id)}
            {section.id === "scores" ? (
              <ScoreStreamScoreboard value={section.scorestreamWidgetUrl} />
            ) : section.id === "games" ? (
              <FootballSchedule {...schedule} cardClassName={chrome.sectionCardClass} />
            ) : section.id === "attendance" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <article className={chrome.sectionCardClass}>
                  <h3 className={`text-base font-bold ${chrome.sectionTitleClass}`}>
                    <FootballText fallback={attendance.passcodeLabel} />
                  </h3>
                  <p
                    className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${chrome.textClass}`}
                  >
                    <FootballText fallback={attendance.passcodeHint} />
                  </p>
                  <span
                    className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs ${chrome.sectionMutedClass}`}
                  >
                    <FootballText fallback={attendance.passcodeRequired ? "Locked" : "Open"} />
                  </span>
                </article>
                <article className={chrome.sectionCardClass}>
                  <h3 className={`text-base font-bold ${chrome.sectionTitleClass}`}>
                    <FootballText fallback="Response Window" />
                  </h3>
                  <p
                    className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${chrome.textClass}`}
                  >
                    <FootballText fallback={attendance.helperText} />
                  </p>
                  {attendance.deadline ? (
                    <div
                      className={`mt-4 inline-flex flex-wrap items-center gap-1 rounded-full border px-3 py-1 text-sm ${chrome.sectionMutedClass}`}
                    >
                      <FootballText fallback="Deadline:" /> {attendance.deadline}
                    </div>
                  ) : null}
                </article>
              </div>
            ) : (
              <>
                {section.lines?.length ? (
                  <div className="mb-4 space-y-3">
                    {section.lines.map((line, index) => (
                      <p
                        key={`${section.id}-${index}`}
                        className={`whitespace-pre-wrap text-sm leading-relaxed ${chrome.textClass}`}
                      >
                        <FootballText
                          textKey={
                            section.id === "details" && index === 0
                              ? "eventDetails"
                              : `line:${section.id}-${index}:body`
                          }
                          fallback={line}
                          label={
                            section.id === "details" ? "Event description" : `${section.label} text`
                          }
                        />
                      </p>
                    ))}
                  </div>
                ) : null}
                {section.cards?.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {section.cards.map((card) => {
                      const key = encodeURIComponent(`${section.id}-${card.id}`);
                      return (
                        <article key={card.id} className={`min-w-0 ${chrome.sectionCardClass}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3
                                className={`text-base font-black uppercase tracking-[0.08em] ${chrome.sectionTitleClass}`}
                                style={chrome.sectionTitleStyle}
                              >
                                <FootballText
                                  textKey={
                                    card.fieldKey
                                      ? `field:${card.fieldKey}:label`
                                      : `card:${key}:title`
                                  }
                                  fallback={card.title}
                                  label={`${card.title} label`}
                                />
                              </h3>
                              {card.body ? (
                                <p
                                  className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${chrome.textClass}`}
                                >
                                  {card.fieldKey ? (
                                    card.body
                                  ) : (
                                    <FootballText
                                      textKey={`card:${key}:body`}
                                      fallback={card.body}
                                      label={`${card.title} description`}
                                    />
                                  )}
                                </p>
                              ) : null}
                            </div>
                            {card.meta ? (
                              <span
                                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${chrome.sectionMutedClass}`}
                              >
                                <FootballText
                                  textKey={`card:${key}:meta`}
                                  fallback={card.meta}
                                  label={`${card.title} caption`}
                                />
                              </span>
                            ) : null}
                          </div>
                          {card.details?.length ? (
                            <div
                              className={`mt-4 space-y-2 border-t pt-4 text-sm ${chrome.mutedClass}`}
                            >
                              {card.details.map((line, index) => (
                                <p key={`${key}-${index}`} className="leading-relaxed">
                                  <FootballText
                                    textKey={`line:${key}-${index}:body`}
                                    fallback={line}
                                    label={`${card.title} detail`}
                                  />
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {card.href ? (
                            <FootballText
                              fallback="Open link"
                              renderText={(caption) => (
                                <a
                                  href={card.href}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${chrome.sectionMutedClass}`}
                                >
                                  {caption || "Open link"}
                                  <ChevronRight size={12} aria-hidden="true" />
                                </a>
                              )}
                            />
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </>
            )}
          </section>
        ),
      }))} />
  );
}
