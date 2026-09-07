"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  ArrowUpRight,
  Clock,
  CloudSun,
  MapPin,
  Navigation,
} from "lucide-react";
import type { DashboardOverview } from "@/lib/dashboard-overview";

type AgendaEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  locationText: string | null;
  ownership?: "owned" | "invited";
  shareStatus?: "accepted" | "pending" | null;
  userRsvpResponse?: "yes" | "no" | "maybe" | null;
  hasRsvp?: boolean;
  mapsUrl?: string | null;
  tz?: string | null;
};
const panel =
  "min-w-0 scroll-mt-24 rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:p-6";
const action =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

function eventHref(id: string) {
  return `/event/${encodeURIComponent(id)}`;
}
function time(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function driveDuration(minutes: number) {
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  if (!hours) return `${remainder} min`;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}
function day(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NextEventPlanning({
  event,
  metrics,
  loading,
  hasOrigin,
  onTravel,
  error,
  editHref,
  now,
}: {
  event: AgendaEvent;
  metrics: {
    travelMinutes: number | null;
    travelDistanceKm: number | null;
    travelUpdatedAt: string | null;
    travelOriginLabel?: string | null;
    weatherTemp: number | null;
    weatherSummary: string | null;
    weatherUpdatedAt: string | null;
  } | null;
  loading: boolean;
  hasOrigin?: boolean;
  onTravel: () => void;
  error?: string | null;
  editHref?: string;
  now: number;
}) {
  const minutes = metrics?.travelMinutes;
  const distanceKm = metrics?.travelDistanceKm;
  const miles = distanceKm != null && Number.isFinite(distanceKm) && distanceKm >= 0
    ? (distanceKm / 1.609344).toLocaleString("en-US", { maximumFractionDigits: 1 })
    : null;
  const hoursUntil = (Date.parse(event.startAt) - now) / 3_600_000;
  const locationPromptId = useId();
  const offerCurrentLocation = metrics?.travelOriginLabel !== "current location";
  const tileClassName =
    "flex min-w-0 flex-col rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.025)]";
  const tileHeadingClassName =
    "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500";
  return (
    <div className="@container mb-5" role="group" aria-label="Plan for this event">
      <div className="grid grid-cols-1 gap-3 @min-[520px]:grid-cols-3">
        <section className={tileClassName} aria-label="Venue">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
              <MapPin size={17} aria-hidden="true" />
            </span>
            <p className={tileHeadingClassName}>Venue</p>
          </div>
          <p className="text-sm font-semibold leading-6 text-slate-800 break-words">
            {event.locationText || "Location not added yet"}
          </p>
          {event.mapsUrl ? (
            <div className="mt-auto pt-4">
              <a className={`${action} w-full bg-indigo-50/70`} href={event.mapsUrl} target="_blank" rel="noreferrer">
                <Navigation size={14} aria-hidden="true" />
                Directions
              </a>
            </div>
          ) : editHref ? (
            <div className="mt-auto pt-4">
              <Link className={`${action} w-full bg-indigo-50/70`} href={editHref}>
                Add venue
              </Link>
            </div>
          ) : null}
        </section>

        <section className={tileClassName} aria-label="Drive">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500">
              <Clock size={17} aria-hidden="true" />
            </span>
            <p className={tileHeadingClassName}>Drive</p>
          </div>
          {minutes != null ? (
            <>
              <p className="text-lg font-bold leading-6 tracking-tight text-slate-900">
                {driveDuration(minutes)}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {miles != null ? `${miles} miles total` : "Distance unavailable"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                From {metrics?.travelOriginLabel || "your starting location"}
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold leading-6 text-slate-800">
              {!event.locationText ? "Add a venue first" : loading ? "Getting your drive estimate…" : hasOrigin === false ? "Estimate your drive" : error ? "Drive estimate unavailable" : "Plan your drive"}
            </p>
          )}
          {event.locationText && offerCurrentLocation && !loading ? (
            <p id={locationPromptId} className="mt-2 text-xs leading-5 text-slate-500">
              {minutes != null
                ? "Use your current location to update this drive estimate."
                : "Use your location to estimate drive time and total miles."}
              {" "}Your browser will ask for permission if needed.
            </p>
          ) : null}
          {error ? (
            <p role="status" className="mt-3 text-xs leading-5 text-amber-800">{error}</p>
          ) : null}
          {event.locationText ? (
            <div className="mt-auto pt-4">
              <button
                type="button"
                className={`${action} w-full bg-indigo-50/70 disabled:cursor-wait disabled:opacity-60`}
                onClick={onTravel}
                disabled={loading}
                aria-busy={loading}
                aria-describedby={offerCurrentLocation && !loading ? locationPromptId : undefined}
                aria-label={!loading && !offerCurrentLocation && minutes != null ? "Refresh drive estimate" : undefined}
              >
                {loading ? "Updating…" : offerCurrentLocation ? "Use my location" : minutes != null ? "Refresh estimate" : "Estimate drive"}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              A venue is needed to estimate the drive.
            </p>
          )}
        </section>

        <section className={tileClassName} aria-label="Weather">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <CloudSun size={17} aria-hidden="true" />
            </span>
            <p className={tileHeadingClassName}>Weather</p>
          </div>
          {metrics?.weatherTemp != null ? (
            <>
              <p className="text-2xl font-bold leading-7 tracking-tight text-slate-900">
                {Math.round(metrics.weatherTemp)}°F
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {metrics.weatherSummary || "At event time"}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold leading-6 text-slate-800">
                {!event.locationText ? "Add a venue first" : hoursUntil > 72 ? "Within 3 days" : loading ? "Checking forecast…" : "Forecast unavailable"}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {!event.locationText
                  ? "Add a location for the event forecast."
                  : hoursUntil > 72
                    ? "Forecast available closer to the event."
                    : loading
                      ? "Checking the weather at your event’s location."
                      : "Check back for the weather at your event."}
              </p>
            </>
          )}
          <div className="mt-auto pt-4 text-[11px] leading-4 text-slate-500">
            {metrics?.weatherUpdatedAt ? (
              <p>Forecast updated {day(metrics.weatherUpdatedAt)} at {time(metrics.weatherUpdatedAt)}</p>
            ) : (
              <p>Forecast for the event’s time and location</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DashboardPlanningPanels({ overview }: { overview?: DashboardOverview }) {
  const [allDrafts, setAllDrafts] = useState(false);
  if (!overview) return null;
  return (
    <div className="grid items-stretch gap-5 lg:grid-cols-2">
      {overview.guests.length ? (
        <section id="dashboard-guests" className={panel} aria-labelledby="guests-heading">
          <h2 id="guests-heading" className="text-lg font-bold text-slate-900">
            Guest responses
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Replies to events you’re hosting.</p>
          <ul className="mt-4 space-y-4">
            {overview.guests.map((guest) => (
              <li key={guest.eventId} className="rounded-2xl border border-slate-100 p-4">
                <Link
                  className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-slate-800 hover:text-indigo-600"
                  href={`${eventHref(guest.eventId)}?tab=rsvps`}
                >
                  <span className="break-words">{guest.title}</span>
                  <ArrowUpRight size={16} className="shrink-0" />
                </Link>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { label: "Going", value: guest.going, color: "text-emerald-700" },
                    { label: "Maybe", value: guest.maybe, color: "text-amber-700" },
                    { label: "Declined", value: guest.declined, color: "text-slate-500" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <dt className="text-xs text-slate-500">{stat.label}</dt>
                      <dd className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
                {guest.awaitingShared != null && guest.awaitingShared > 0 ? (
                  <p className="mt-3 text-xs text-slate-600">
                    {guest.awaitingShared} shared{" "}
                    {guest.awaitingShared === 1 ? "invitation" : "invitations"} awaiting a reply
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {overview.drafts.count > 0 ? (
        <section id="dashboard-drafts" className={panel} aria-labelledby="drafts-heading">
          <div className="flex items-center justify-between">
            <h2 id="drafts-heading" className="text-lg font-bold text-slate-900">
              Continue creating
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {overview.drafts.count} drafts
            </span>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {(allDrafts ? overview.drafts.items : overview.drafts.items.slice(0, 3)).map(
              (draft) => (
                <li key={draft.id}>
                  <Link
                    href={draft.href}
                    className="group flex min-h-20 items-center justify-between gap-4 rounded-xl py-3 focus-visible:outline-2 focus-visible:outline-indigo-600"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                        {draft.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {draft.startAt ? day(draft.startAt) : "Date to be decided"}
                        {draft.updatedAt
                          ? ` · Saved ${new Date(draft.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">Continue →</span>
                  </Link>
                </li>
              ),
            )}
          </ul>
          {overview.drafts.items.length > 3 ? (
            <button
              type="button"
              className={action}
              aria-expanded={allDrafts}
              onClick={() => setAllDrafts(!allDrafts)}
            >
              {allDrafts ? "Show fewer drafts" : "Show more drafts"}
            </button>
          ) : null}
          {overview.drafts.count > overview.drafts.items.length ? (
            <p className="mt-2 text-xs text-slate-500">
              Showing your {overview.drafts.items.length} most recent drafts.
            </p>
          ) : null}
        </section>
      ) : null}

      {overview.signups.length ? (
        <section id="dashboard-signups" className={panel} aria-labelledby="signups-heading">
          <h2 id="signups-heading" className="text-lg font-bold text-slate-900">
            Sign-up progress
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            What’s covered and where you still need help.
          </p>
          <ul className="mt-4 space-y-4">
            {overview.signups.map((signup) => (
              <li key={signup.eventId} className="rounded-2xl border border-slate-100 p-4">
                <Link
                  href={`/smart-signup-form/${encodeURIComponent(signup.eventId)}`}
                  className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold text-slate-800 hover:text-indigo-600"
                >
                  <span className="break-words">{signup.title}</span>
                  <ArrowUpRight size={16} className="shrink-0" />
                </Link>
                {signup.capacity > 0 ? (
                  <>
                    <div className="my-2 flex justify-between gap-2 text-xs text-slate-600">
                      <span>
                        {signup.filled} of {signup.capacity} spots filled
                      </span>
                      <span className="font-semibold text-indigo-700">{signup.remaining} open</span>
                    </div>
                    <progress
                      className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500"
                      max={signup.capacity}
                      value={signup.filled}
                      aria-label={`${signup.title}: filled sign-up spots`}
                    />
                  </>
                ) : null}
                <ul className="mt-3 flex flex-wrap gap-2">
                  {signup.sections.map((section) => (
                    <li
                      key={section.id}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ${section.remaining || section.unlimitedSlots ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
                    >
                      {section.title}:{" "}
                      {section.remaining
                        ? `${section.remaining} open`
                        : section.unlimitedSlots
                          ? "Open sign-up"
                          : "Covered"}
                      {section.remaining && section.unlimitedSlots ? " + open sign-up" : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
