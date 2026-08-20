import { describe, expect, test } from "bun:test";
import { genericSportsDiscoveryAdapter } from "./adapters";

describe("shared sports discovery adapter", () => {
  test("maps important game, venue, parking, ticket, and schedule facts", async () => {
    const mapped = await genericSportsDiscoveryAdapter.map({
      activityProfile: "basketball",
      eventArchetype: "tournament",
      detectionConfidence: 1,
      currentData: { pageTemplateId: "sunset_court" },
      parseResult: {
        eventType: "football_season_schedule",
        documentProfile: "season_schedule",
        title: "Central Hoops Invitational",
        summary: "Pool play begins Saturday morning.",
        dates: "January 9-10, 2027",
        startAt: "2027-01-09T09:00:00-06:00",
        endAt: null,
        timezone: "America/Chicago",
        homeTeam: "Central Hoops",
        opponent: null,
        season: "U16 Gold",
        headCoach: null,
        venue: "Central Fieldhouse",
        address: "100 Arena Drive",
        games: [
          {
            opponent: "North Stars",
            date: "2027-01-09",
            time: "09:00",
            homeAway: "home",
            venue: "Court 1",
            address: "100 Arena Drive",
            conference: false,
            broadcast: null,
            ticketsLink: "https://example.com/tickets",
            result: null,
            score: null,
            notes: null,
          },
        ],
        roster: { players: [] },
        practice: { blocks: [] },
        logistics: {
          travelMode: null,
          callTime: null,
          departureTime: null,
          pickupWindow: null,
          parking: "Use the east garage.",
          hotelName: null,
          hotelAddress: null,
          mealPlan: null,
          weatherPolicy: null,
          ticketsLink: "https://example.com/tickets",
          broadcast: "CourtStream",
          notes: [],
        },
        gear: { uniform: null, checklist: [] },
        volunteers: { signupLink: null, notes: null, slots: [] },
        communications: { announcements: [], passcode: null },
        links: [{ label: "Tickets", url: "https://example.com/tickets" }],
        unmappedFacts: [],
      },
    });

    expect(mapped.category).toBe("sport_event");
    expect(mapped.activityProfile).toBe("basketball");
    expect(mapped.eventArchetype).toBe("tournament");
    expect(mapped.details).toContain("North Stars");
    expect(mapped.customFields.parking).toBe("Use the east garage.");
    expect(mapped.customFields.tickets).toBe("https://example.com/tickets");
    expect(mapped.customFields.broadcast).toBe("CourtStream");
  });
});
