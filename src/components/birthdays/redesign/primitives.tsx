"use client";

import { CalendarDays, Clock, MapPin, ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { BirthdayCalendarDate, BirthdayVenueLink, BirthdayShareControl } from "../BirthdayGuestActions";
import type { BirthdaySceneProps } from "./types";

type PrimitiveProps = BirthdaySceneProps & { inverse?: boolean; className?: string; titleClassName?: string; storyClassName?: string };

export function BirthdaySceneCopy({ theme, event, inverse, className = "", titleClassName = "", storyClassName = "" }: PrimitiveProps) {
  const anniversaryTitle = theme.id.endsWith("-anniversary") && event.birthdayName ? `${event.birthdayName}${event.age ? ` · ${event.age} ${Number(event.age) === 1 ? "year" : "years"} together` : " · together, always"}` : undefined;
  const title = event.headlineTitle || anniversaryTitle || (event.birthdayName ? event.age ? `${event.birthdayName} is turning ${event.age}` : `${event.birthdayName}’s birthday` : theme.defaultHeadline || theme.name);
  return <div className={`birthday-scene-copy ${inverse ? "text-white" : ""} ${className}`}>
    <h1 className={`birthday-scene-title text-[clamp(2.25rem,6cqw,6.5rem)] leading-[.94] tracking-[-.045em] [overflow-wrap:break-word] ${titleClassName}`} style={{ fontFamily: theme.fonts.headline }}>{title}</h1>
    {event.story ? <p className={`birthday-scene-story mt-6 max-w-xl text-base leading-relaxed opacity-85 ${storyClassName}`}>{event.story}</p> : null}
  </div>;
}

export function BirthdaySceneFacts({ event, inverse, className = "" }: PrimitiveProps) {
  const date = event.date ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(event.date) ? `${event.date}T00:00:00` : event.date) : null;
  const valid = date && !Number.isNaN(date.getTime());
  const clock = (value?: string) => value?.includes("T") && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"}) : "";
  const endDate = event.end && valid && new Date(event.end).toDateString() !== date.toDateString() ? new Date(event.end).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "";
  const time = [clock(event.date), [endDate,clock(event.end)].filter(Boolean).join(", ")].filter(Boolean).join(" – ");
  return <div className={`birthday-scene-facts flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium ${inverse ? "text-white" : ""} ${className}`}>
    <BirthdayCalendarDate><CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />{valid ? date.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "Date to be announced"}</BirthdayCalendarDate>
    {time ? <span className="inline-flex items-center gap-2"><Clock aria-hidden="true" className="h-4 w-4 shrink-0" />{time}</span> : null}
    <BirthdayVenueLink><MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />{event.location || "Location to be announced"}</BirthdayVenueLink>
  </div>;
}

const TREATMENTS: Record<string,string> = {
  pill:"rounded-full", ticket:"border-dashed rounded-sm", stamp:"border-2 rotate-[-1deg] uppercase tracking-widest", block:"rounded-none uppercase tracking-widest", underline:"border-x-0 border-t-0 px-0", outline:"rounded-full border-2",
};
export function BirthdaySceneRsvp({ theme, event, onRsvpClick, inverse, className = "" }: PrimitiveProps) {
  const button = `inline-flex min-h-12 items-center justify-center gap-3 border border-current px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${TREATMENTS[theme.experience.ctaTreatment] || ""}`;
  return <div className={`birthday-scene-rsvp flex flex-wrap items-center gap-4 ${inverse ? "text-white" : ""} ${className}`}>
    {event.rsvpEnabled && onRsvpClick ? <button type="button" onClick={onRsvpClick} className={button}>RSVP to celebrate <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button> : null}
    <BirthdayShareControl className={button} />
  </div>;
}

export function birthdaySceneStyle(theme: BirthdaySceneProps["theme"]): CSSProperties {
  return { "--scene-paper":theme.colors.primary, "--scene-accent":theme.colors.secondary, fontFamily:theme.fonts.body || "inherit" } as CSSProperties;
}
