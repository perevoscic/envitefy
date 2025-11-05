"use client";

import React from "react";
import RegistryLinksEditor, {
  type RegistryFormEntry,
} from "@/components/RegistryLinksEditor";
import Toggle from "@/components/Toggle";

export type EditorBindings = {
  summary: { time: string | null; date: string | null };
  whenDate: string;
  setWhenDate: (v: string) => void;
  fullDay: boolean;
  setFullDay: (v: boolean) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;

  venue: string;
  setVenue: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;

  numberOfGuests: number;
  setNumberOfGuests: (v: number) => void;

  description: string;
  setDescription: (v: string) => void;
  descriptionRef: React.RefObject<HTMLTextAreaElement | null>;

  showRsvpField: boolean;
  rsvp: string;
  setRsvp: (v: string) => void;

  allowsRegistrySection: boolean;
  registryLinks: RegistryFormEntry[];
  addRegistryLink: () => void;
  removeRegistryLink: (key: string) => void;
  handleRegistryFieldChange: (
    key: string,
    field: "label" | "url",
    value: string
  ) => void;
  MAX_REGISTRY_LINKS: number;

  attachment: { name: string; type: string; dataUrl: string } | null;
  attachmentPreviewUrl: string | null;
  attachmentError: string | null;
  // Header image upload controls (kept for header background)
  flyerInputRef: React.RefObject<HTMLInputElement | null>;
  handleFlyerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearFlyer: () => void;
  // Bottom flyer/invite upload (separate from header)
  attachmentInputRef: React.RefObject<HTMLInputElement | null>;
  handleAttachmentOnlyChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  repeat: boolean;
  setRepeat: (v: boolean) => void;
  repeatFrequency: "weekly" | "monthly" | "yearly";
  setRepeatFrequency: (v: "weekly" | "monthly" | "yearly") => void;
  repeatDays: string[];
  setRepeatDays: (updater: (prev: string[]) => string[]) => void;

  connectedCalendars: { google: boolean; microsoft: boolean; apple: boolean };
  selectedCalendars: { google: boolean; microsoft: boolean; apple: boolean };
  setSelectedCalendars: (
    updater: (prev: {
      google: boolean;
      microsoft: boolean;
      apple: boolean;
    }) => { google: boolean; microsoft: boolean; apple: boolean }
  ) => void;

  // Theme/background for card
  cardBackgroundImage: string | undefined;
};

export default function EventTemplateBase({
  editor,
}: {
  editor: EditorBindings;
}) {
  const e = editor;
  return (
    <section
      className="event-theme-card rounded-2xl border px-3 sm:px-6 py-6 shadow-sm"
      style={
        {
          backgroundImage: e.cardBackgroundImage,
        } as React.CSSProperties
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
            When
          </dt>
          <dd className="mt-1 text-base font-semibold">
            {e.summary.time && <div>{e.summary.time}</div>}
            {e.summary.date && (
              <div className="text-sm mt-1 opacity-80">{e.summary.date}</div>
            )}
          </dd>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between sm:col-span-1">
              <label className="text-sm opacity-70">Full day</label>
              <input
                type="checkbox"
                checked={e.fullDay}
                onChange={(ev) => e.setFullDay(ev.target.checked)}
              />
            </div>
            {e.fullDay ? (
              <input
                type="date"
                value={e.whenDate}
                onChange={(ev) => e.setWhenDate(ev.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
            ) : (
              <div className="col-span-3 grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-foreground/70 mb-1">Start</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={e.whenDate}
                      onChange={(ev) => e.setWhenDate(ev.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-background"
                    />
                    <input
                      type="time"
                      value={e.startTime}
                      onChange={(ev) => e.setStartTime(ev.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-background"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground/70 mb-1">End</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={e.endDate}
                      onChange={(ev) => e.setEndDate(ev.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-background"
                    />
                    <input
                      type="time"
                      value={e.endTime}
                      onChange={(ev) => e.setEndTime(ev.target.value)}
                      className="px-2 py-1 rounded-md border border-border bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {e.venue ? "Address" : "Location"}
          </dt>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <input
              type="text"
              value={e.venue}
              onChange={(ev) => e.setVenue(ev.target.value)}
              placeholder="Venue name (optional)"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            />
            <input
              type="text"
              value={e.location}
              onChange={(ev) => e.setLocation(ev.target.value)}
              placeholder="Street, City, State ZIP"
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            />
          </div>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Guests
          </dt>
          <input
            type="number"
            min={1}
            required
            value={e.numberOfGuests || ""}
            onChange={(ev) =>
              e.setNumberOfGuests(Number.parseInt(ev.target.value, 10) || 0)
            }
            placeholder="Enter number of guests"
            className="mt-2 w-full px-3 py-2 rounded-md border border-border bg-background"
          />
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
            Description
          </dt>
          <textarea
            ref={e.descriptionRef}
            value={e.description}
            onChange={(ev) => e.setDescription(ev.target.value)}
            rows={3}
            className="mt-2 w-full px-3 py-2 rounded-md border border-border bg-background"
            placeholder="Add details for your guests"
          />
        </div>

        {e.showRsvpField && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
              RSVP
            </dt>
            <textarea
              value={e.rsvp}
              onChange={(ev) => e.setRsvp(ev.target.value)}
              rows={1}
              className="mt-2 w-full px-3 py-2 rounded-md border border-border bg-background"
              placeholder="Phone number or email address"
            />
          </div>
        )}

        {e.allowsRegistrySection && (
          <RegistryLinksEditor
            entries={e.registryLinks}
            onAdd={e.addRegistryLink}
            onRemove={e.removeRegistryLink}
            onChange={e.handleRegistryFieldChange}
            maxLinks={e.MAX_REGISTRY_LINKS}
          />
        )}

        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-foreground">
            <span>Update event flyer/invite</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => e.attachmentInputRef.current?.click()}
                className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface hover:border-foreground/20"
              >
                {e.attachment ? "Replace file" : "Upload file"}
              </button>
              {e.attachment && (
                <button
                  type="button"
                  onClick={e.clearFlyer}
                  className="text-xs font-medium text-foreground hover:text-foreground/80"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={e.attachmentInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={e.handleAttachmentOnlyChange}
            className="hidden"
          />
          {e.attachmentError && (
            <p className="mt-2 text-xs text-red-600">{e.attachmentError}</p>
          )}
          {e.attachment && (
            <div className="mt-2 flex items-center gap-3 text-xs text-foreground/80">
              {e.attachmentPreviewUrl ? (
                <img
                  src={e.attachmentPreviewUrl}
                  alt={e.attachment.name}
                  className="h-16 w-16 rounded border border-border object-cover"
                />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70">
                  📄
                </span>
              )}
              <span className="truncate" title={e.attachment.name}>
                {e.attachment.name}
              </span>
            </div>
          )}
          {!e.attachment && !e.attachmentError && (
            <p className="mt-2 text-xs text-foreground/60">
              Images or PDFs up to 5 MB.
            </p>
          )}
        </div>

        <div>
          <Toggle
            label="Repeats"
            checked={e.repeat}
            onChange={(next) => {
              e.setRepeat(next);
              if (!next) e.setRepeatDays(() => []);
            }}
            size="md"
          />
          {e.repeat && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs text-foreground/70 mb-1">Every</div>
                <div className="flex gap-2">
                  {(["weekly", "monthly", "yearly"] as const).map((key) => {
                    const active = e.repeatFrequency === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => e.setRepeatFrequency(key)}
                        className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        {key === "weekly"
                          ? "Week"
                          : key === "monthly"
                          ? "Month"
                          : "Year"}
                      </button>
                    );
                  })}
                </div>
              </div>
              {e.repeatFrequency === "weekly" && (
                <div>
                  <div className="text-xs text-foreground/70 mb-1">
                    Repeat on
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { code: "SU", label: "Sun" },
                      { code: "MO", label: "Mon" },
                      { code: "TU", label: "Tue" },
                      { code: "WE", label: "Wed" },
                      { code: "TH", label: "Thu" },
                      { code: "FR", label: "Fri" },
                      { code: "SA", label: "Sat" },
                    ].map((d) => {
                      const active = e.repeatDays.includes(d.code);
                      return (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() =>
                            e.setRepeatDays((prev) =>
                              active
                                ? prev.filter((c) => c !== d.code)
                                : [...prev, d.code]
                            )
                          }
                          className={`h-8 rounded-md border text-xs font-medium transition ${
                            active
                              ? "border-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white shadow"
                              : "bg-background text-foreground border-border"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {e.repeatFrequency === "monthly" && (
                <p className="text-xs text-foreground/60">
                  Repeats each month on the event start date.
                </p>
              )}
              {e.repeatFrequency === "yearly" && (
                <p className="text-xs text-foreground/60">
                  Repeats every year on the event start date.
                </p>
              )}
            </div>
          )}
        </div>

        {(e.connectedCalendars.google ||
          e.connectedCalendars.microsoft ||
          e.connectedCalendars.apple) && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Add to Calendar
            </dt>
            <div className="mt-2 space-y-2">
              {e.connectedCalendars.google && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={e.selectedCalendars.google}
                    onChange={(ev) =>
                      e.setSelectedCalendars((prev) => ({
                        ...prev,
                        google: ev.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <span>Google Calendar</span>
                </label>
              )}
              {e.connectedCalendars.microsoft && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={e.selectedCalendars.microsoft}
                    onChange={(ev) =>
                      e.setSelectedCalendars((prev) => ({
                        ...prev,
                        microsoft: ev.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <span>Outlook Calendar</span>
                </label>
              )}
              {e.connectedCalendars.apple && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={e.selectedCalendars.apple}
                    onChange={(ev) =>
                      e.setSelectedCalendars((prev) => ({
                        ...prev,
                        apple: ev.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <span>Apple Calendar</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
