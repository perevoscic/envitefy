import { describe, expect, test } from "bun:test";
import {
  GOOGLE_CALENDAR_EVENT_WRITE_SCOPE,
  hasGoogleCalendarEventWriteScope,
} from "./google-calendar-oauth";

describe("Google Calendar OAuth scopes", () => {
  test("requests the narrow owned-event permission", () => {
    expect(GOOGLE_CALENDAR_EVENT_WRITE_SCOPE).toBe(
      "https://www.googleapis.com/auth/calendar.events.owned",
    );
  });

  test("accepts current and legacy event-write grants", () => {
    expect(hasGoogleCalendarEventWriteScope(`openid ${GOOGLE_CALENDAR_EVENT_WRITE_SCOPE}`)).toBe(
      true,
    );
    expect(
      hasGoogleCalendarEventWriteScope(
        "openid https://www.googleapis.com/auth/calendar.events profile",
      ),
    ).toBe(true);
    expect(hasGoogleCalendarEventWriteScope("openid email profile")).toBe(false);
  });
});
