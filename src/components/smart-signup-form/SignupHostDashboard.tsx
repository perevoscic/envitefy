"use client";

import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { SignupForm, SignupResponse, SignupResponseStatus } from "@/types/signup";
import {
  countConfirmedForSlot,
  countWaitlistedForSlot,
  normalizeSignupQuantity,
} from "@/utils/signup";
import SignupHostAlerts from "./SignupHostAlerts";
import styles from "./signup-host-dashboard.module.css";

type Props = {
  eventId: string;
  form: SignupForm;
  loading: boolean;
  refreshing: boolean;
  removingResponseId: string | null;
  canEdit: boolean;
  onEdit: (response: SignupResponse) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
  onSetOpen: () => void;
  onRefresh: () => void;
};
function time(value?: string | null) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute)
    ? `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`
    : value;
}
function slotLabels(form: SignupForm, response: SignupResponse) {
  return response.slots.map((selection) => {
    const section = form.sections.find((item) => item.id === selection.sectionId);
    const slot = section?.slots.find((item) => item.id === selection.slotId);
    const range = [time(slot?.startTime), time(slot?.endTime)].filter(Boolean).join("–");
    return `${section?.title || "Section"}: ${slot?.label || "Removed slot"} ×${normalizeSignupQuantity(selection.quantity)}${range ? ` (${range})` : ""}`;
  });
}

export default function SignupHostDashboard(props: Props) {
  const { form } = props;
  const [view, setView] = useState<"items" | "people">("items");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SignupResponseStatus | "active" | "all">("active");
  const [personId, setPersonId] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      form.responses.filter((response) => {
        if (personId && response.id !== personId) return false;
        if (
          status === "active"
            ? response.status === "cancelled"
            : status !== "all" && response.status !== status
        )
          return false;
        return (
          !search.trim() ||
          `${response.name} ${response.email || ""} ${response.phone || ""} ${slotLabels(form, response).join(" ")} ${response.note || ""} ${(response.answers || []).map((answer) => answer.value).join(" ")}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        );
      }),
    [form, search, status, personId],
  );
  const actionClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-[var(--signup-surface)] disabled:opacity-50";
  const actions = (response: SignupResponse) =>
    response.status !== "cancelled" && (
      <div className="flex gap-2">
        <button
          type="button"
          title={`Edit signup for ${response.name}`}
          aria-label={`Edit signup for ${response.name}`}
          disabled={props.loading || !props.canEdit || props.removingResponseId === response.id}
          onClick={() => props.onEdit(response)}
          className={`${actionClass} border-[var(--signup-border)] text-[var(--signup-muted)]`}
        >
          <Pencil size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          title={`Remove signup for ${response.name}`}
          aria-label={`Remove signup for ${response.name}`}
          disabled={props.loading || !!props.removingResponseId}
          onClick={() => props.onRemove(response.id)}
          className={`${actionClass} border-red-300 text-red-700`}
        >
          {props.removingResponseId === response.id ? (
            <LoaderCircle
              size={17}
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Trash2 size={17} aria-hidden="true" />
          )}
        </button>
      </div>
    );
  const participant = (response: SignupResponse) => (
    <article
      key={response.id}
      data-signup-participant
      className="min-w-0 rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] p-4 text-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 break-words">
          <h5 className="font-semibold">{response.name}</h5>
          <time
            dateTime={response.updatedAt || response.createdAt}
            className="mt-1 block text-xs text-[var(--signup-muted)]"
          >
            {new Date(response.updatedAt || response.createdAt).toLocaleString("en-US")}
          </time>
        </div>
        {actions(response)}
      </div>
      <ul className="mt-3 space-y-1 break-words text-[var(--signup-muted)]">
        {slotLabels(form, response).map((label, index) => (
          <li key={response.slots[index].slotId}>{label}</li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 break-all text-xs text-[var(--signup-muted)]">
        {response.email && (
          <a className="py-1 underline" href={`mailto:${response.email}`}>
            {response.email}
          </a>
        )}
        {response.phone && (
          <a className="py-1 underline" href={`tel:${response.phone}`}>
            {response.phone}
          </a>
        )}
      </div>
      {(form.questions.length > 0 || response.note || !!response.guests) && (
        <details className="mt-2 rounded-lg border border-[var(--signup-border)] px-3">
          <summary className="min-h-11 cursor-pointer py-3 font-semibold">
            Participant details
          </summary>
          <dl className="space-y-2 break-words pb-3">
            {!!response.guests && (
              <div>
                <dt className="font-medium">Extra guests</dt>
                <dd>{response.guests}</dd>
              </div>
            )}
            {form.questions.map((question) => (
              <div key={question.id}>
                <dt className="font-medium">{question.prompt}</dt>
                <dd>
                  {response.answers?.find((answer) => answer.questionId === question.id)?.value ||
                    "Not provided"}
                </dd>
              </div>
            ))}
            {response.note && (
              <div>
                <dt className="font-medium">Note</dt>
                <dd className="whitespace-pre-wrap">{response.note}</dd>
              </div>
            )}
          </dl>
        </details>
      )}
    </article>
  );
  const matchingSections = form.sections.filter((section) => section.slots.length > 0);
  const visibleItems = matchingSections
    .flatMap((section) =>
      section.slots.map((slot) => {
        const assigned = visible.filter((response) =>
          response.slots.some(
            (selection) => selection.sectionId === section.id && selection.slotId === slot.id,
          ),
        );
        const query = search.trim().toLowerCase();
        const matchesSlot =
          !query || `${section.title} ${slot.label}`.toLowerCase().includes(query);
        if (personId || status !== "active") {
          if (!assigned.length) return [];
        }
        if (!matchesSlot && !assigned.length) return [];
        return [{ section, slot, assigned }];
      }),
    )
    .flat();
  return (
    <section
      id="signup-host-dashboard"
      tabIndex={-1}
      aria-labelledby="signup-host-heading"
      className={`${styles.dashboard} scroll-mt-6 space-y-4 rounded-2xl border border-[var(--signup-border)] bg-[var(--signup-surface)] p-4 shadow-sm sm:p-5`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="signup-host-heading" className="text-lg font-bold">
          Host dashboard
        </h3>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-[var(--signup-border)] px-3 text-sm"
          disabled={props.refreshing || props.loading}
          onClick={props.onRefresh}
        >
          {props.refreshing ? "Refreshing…" : "Refresh signups"}
        </button>
      </header>
      <div className="grid grid-cols-3 gap-2 text-sm">
        {(
          [
            ["Confirmed signups", "confirmed"],
            ["On waitlist", "waitlisted"],
            ["Cancelled", "cancelled"],
          ] as const
        ).map(([label, key]) => (
          <div key={key} className="rounded-lg border border-[var(--signup-border)] p-3">
            <strong className="block text-lg">
              {form.responses.filter((response) => response.status === key).length}
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        {matchingSections.map((section) => {
          const unlimited = section.slots.some((slot) => slot.capacity === null);
          const capacity = section.slots.reduce((sum, slot) => sum + (slot.capacity || 0), 0);
          const filled = section.slots.reduce(
            (sum, slot) => sum + countConfirmedForSlot(form, section.id, slot.id),
            0,
          );
          return (
            <div
              key={section.id}
              className="rounded-lg border border-[var(--signup-border)] p-3 text-sm"
            >
              <h4 className="font-semibold">{section.title}</h4>
              <p>
                {filled} {section.unitLabel || "places"} reserved
                {unlimited
                  ? " · Includes unlimited capacity"
                  : ` · ${Math.max(0, capacity - filled)} of ${capacity} remaining`}
              </p>
            </div>
          );
        })}
      </div>
      <div role="group" aria-label="View signups" className="flex flex-wrap gap-2">
        {(
          [
            ["items", "By item/shift"],
            ["people", "By person"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => {
              setView(key);
              setPersonId(null);
            }}
            className={`min-h-11 rounded-lg border border-[var(--signup-border)] px-4 text-sm ${view === key ? "bg-[var(--signup-page)] font-semibold" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="min-w-0 flex-1 basis-52">
          <span className="mb-1 block">Search signups</span>
          <input
            aria-label="Search participants"
            placeholder="Name, contact, item, or answer"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPersonId(null);
            }}
            className="min-h-11 w-full rounded-lg border border-[var(--signup-border)] px-3"
          />
        </label>
        <label>
          <span className="mb-1 block">Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPersonId(null);
            }}
            className="min-h-11 max-w-full rounded-lg border border-[var(--signup-border)] px-3"
          >
            <option value="active">Active signups</option>
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button
          type="button"
          onClick={props.onExport}
          title="Export all signup responses"
          className="min-h-11 rounded-lg border border-[var(--signup-border)] px-3"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={props.onSetOpen}
          disabled={props.loading}
          className="min-h-11 rounded-lg border border-[var(--signup-border)] px-3"
        >
          {form.enabled ? "Close signups" : "Reopen signups"}
        </button>
      </div>
      {personId && (
        <button
          type="button"
          className="min-h-11 text-sm underline"
          onClick={() => setPersonId(null)}
        >
          Show all participants
        </button>
      )}
      {view === "people" ? (
        <div className="space-y-4">
          {(["confirmed", "waitlisted", "cancelled"] as const).map((group) => {
            const participants = visible.filter((response) => response.status === group);
            return (
              participants.length > 0 && (
                <div key={group}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide">
                    {group === "waitlisted"
                      ? "Waitlist"
                      : group === "cancelled"
                        ? "Cancelled (audit trail)"
                        : "Confirmed"}
                  </h4>
                  <div className={styles.grid}>{participants.map(participant)}</div>
                </div>
              )
            );
          })}
          {!visible.length && (
            <p className="text-sm text-[var(--signup-muted)]">
              {form.responses.length
                ? "No participants match your filters."
                : "Your first signup will appear here."}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleItems.map(({ section, slot, assigned }) => {
            const filled = countConfirmedForSlot(form, section.id, slot.id);
            const waitlisted = countWaitlistedForSlot(form, section.id, slot.id);
            const range = [time(slot.startTime), time(slot.endTime)].filter(Boolean).join("–");
            return (
              <article
                key={`${section.id}:${slot.id}`}
                data-signup-item
                className="min-w-0 rounded-xl border border-[var(--signup-border)] bg-[var(--signup-page)] p-4 text-sm"
              >
                <p className="text-xs text-[var(--signup-muted)]">{section.title}</p>
                <h4 className="break-words font-semibold">{slot.label}</h4>
                {range && (
                  <p>
                    {range}
                    {form.timezone ? ` · ${form.timezone}` : ""}
                  </p>
                )}
                <p className="mt-2">
                  {filled} {section.unitLabel || "places"} reserved ·{" "}
                  {slot.capacity === null
                    ? "Unlimited capacity"
                    : `${Math.max(0, slot.capacity - filled)} of ${slot.capacity} remaining`}
                  {waitlisted > 0 ? ` · ${waitlisted} waitlisted` : ""}
                </p>
                {assigned.length ? (
                  <ul className="mt-3 divide-y divide-[var(--signup-border)]">
                    {assigned.map((response) => (
                      <li
                        key={response.id}
                        className="flex min-h-11 items-center justify-between gap-3"
                      >
                        <button
                          type="button"
                          className="min-h-11 min-w-0 break-words text-left underline"
                          onClick={() => {
                            setView("people");
                            setPersonId(response.id);
                          }}
                        >
                          {response.name}
                        </button>
                        <span className="shrink-0">
                          ×
                          {response.slots.find(
                            (selection) =>
                              selection.sectionId === section.id && selection.slotId === slot.id,
                          )?.quantity || 1}
                          {response.status !== "confirmed" ? ` · ${response.status}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[var(--signup-muted)]">
                    {search.trim() ? "No matching participants." : "No one signed up yet."}
                  </p>
                )}
              </article>
            );
          })}
          {!visibleItems.length && (
            <p className="text-sm text-[var(--signup-muted)]">
              No items or shifts match your filters.
            </p>
          )}
        </div>
      )}
      <SignupHostAlerts eventId={props.eventId} />
    </section>
  );
}
