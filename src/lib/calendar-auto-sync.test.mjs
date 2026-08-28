import { describe, expect, test } from "bun:test";
import { buildAutoCalendarEvent } from "./calendar-auto-sync.ts";
import {
  formatCalendarDateTimeInTimeZone,
  parseCalendarDateTimeToIso,
} from "./calendar-date-time.ts";
import { toMicrosoftEvent } from "./mappers.ts";

describe("calendar date handling", () => {
  test("interprets a local OCR timestamp in the event time zone", () => {
    expect(parseCalendarDateTimeToIso("2026-09-12T18:30:00", "America/Chicago")).toBe(
      "2026-09-12T23:30:00.000Z",
    );
    expect(parseCalendarDateTimeToIso("2026-02-30T18:30:00Z", "UTC")).toBeNull();
  });

  test("formats an instant for Microsoft without shifting the local clock", () => {
    expect(formatCalendarDateTimeInTimeZone("2026-09-12T23:30:00.000Z", "America/Chicago")).toBe(
      "2026-09-12T18:30:00",
    );
    const graphEvent = toMicrosoftEvent({
      title: "Birthday party",
      start: "2026-09-12T23:30:00.000Z",
      end: "2026-09-13T01:00:00.000Z",
      timezone: "America/Chicago",
    });
    expect(graphEvent.start).toEqual({
      dateTime: "2026-09-12T18:30:00",
      timeZone: "America/Chicago",
    });
    expect(graphEvent.end).toEqual({
      dateTime: "2026-09-12T20:00:00",
      timeZone: "America/Chicago",
    });
  });
});

describe("automatic calendar payload", () => {
  test("keeps the event title in the title field and the Envitefy URL on the final line", () => {
    const result = buildAutoCalendarEvent({
      title: "Maya's 8th Birthday",
      data: {
        startISO: "2026-09-12T18:30:00",
        endISO: "2026-09-12T20:30:00",
        timezone: "America/Chicago",
        category: "Birthdays",
        description: "Cake, games, and swimming.",
        hostName: "The Johnson family",
        rsvp: "3125550100",
        attire: "Swimsuit",
        activities: ["Swimming", "Cake"],
        attachment: { name: "maya-invite.png", type: "image/png" },
      },
      envitefyUrl: "https://envitefy.com/event/mayas-birthday-123",
      flyerSourceUrl: "https://envitefy.com/media/events/123/thumbnail?variant=attachment",
      flyerPreviewUrl: "https://envitefy.com/media/events/123/thumbnail?variant=thumbnail",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.title).toBe("Maya's 8th Birthday");
    expect(result.value.event.description).toContain("Cake, games, and swimming.");
    expect(result.value.event.description).toContain("Host: The Johnson family");
    expect(result.value.event.description).toContain("RSVP: 3125550100");
    expect(result.value.event.description).toContain("Flyer / invite:");
    expect(
      result.value.event.description?.endsWith(
        "https://envitefy.com/event/mayas-birthday-123",
      ),
    ).toBe(true);
    expect(result.value.flyer?.previewUrl).toContain("variant=thumbnail");
  });

  test("creates a one-day all-day event when the scan has a date but no visible time", () => {
    const result = buildAutoCalendarEvent({
      title: "School fair",
      data: {
        startISO: "2026-10-03T05:00:00.000Z",
        endISO: null,
        timezone: "America/Chicago",
        timeFound: false,
      },
      envitefyUrl: "https://envitefy.com/event/school-fair-123",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.event.allDay).toBe(true);
    expect(result.value.event.start).toBe("2026-10-03");
    expect(result.value.event.end).toBe("2026-10-04");
  });

  test("repairs an invalid end time and refuses an event without a date", () => {
    const repaired = buildAutoCalendarEvent({
      title: "Practice",
      data: {
        startISO: "2026-11-05T18:00:00.000Z",
        endISO: "2026-11-05T17:00:00.000Z",
        timezone: "UTC",
      },
      envitefyUrl: "https://envitefy.com/event/practice-123",
    });
    expect(repaired.ok).toBe(true);
    if (repaired.ok) {
      expect(repaired.value.event.end).toBe("2026-11-05T19:30:00.000Z");
    }

    expect(
      buildAutoCalendarEvent({
        title: "No date yet",
        data: {},
        envitefyUrl: "https://envitefy.com/event/no-date-123",
      }),
    ).toEqual({ ok: false, reason: "missing_start" });
  });
});
