import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFootballEventData } from "./normalizeFootballEventData.mjs";

test("normalizeFootballEventData preserves football discovery sections and visibility", () => {
  const model = normalizeFootballEventData({
    eventTitle: "Panthers Football",
    eventData: {
      title: "Panthers Football",
      date: "2025-09-13",
      time: "19:00",
      venue: "Panthers Stadium",
      customFields: {
        team: "Varsity Panthers",
        season: "Fall 2025",
        headCoach: "Coach Kelly",
        stadium: "Panthers Stadium",
        stadiumAddress: "123 Main St, Chicago, IL",
      },
      rsvpEnabled: true,
      rsvpDeadline: "2025-09-10",
      accessControl: { requirePasscode: true },
      advancedSections: {
        games: {
          games: [
            {
              id: "game-1",
              opponent: "Cougars",
              date: "2025-09-13",
              time: "19:00",
              homeAway: "home",
              venue: "Panthers Stadium",
              address: "123 Main St, Chicago, IL",
              conference: true,
              broadcast: "Local stream",
              ticketsLink: "https://tickets.example",
              result: "W",
              score: "28-7",
              notes: "Homecoming",
            },
          ],
        },
        roster: {
          players: [
            {
              id: "player-1",
              name: "Jordan Smith",
              jerseyNumber: "12",
              position: "QB",
              grade: "Senior",
              parentName: "Sam Smith",
              parentPhone: "555-1111",
              parentEmail: "sam@example.com",
              medicalNotes: "None",
              status: "active",
            },
          ],
        },
        practice: {
          blocks: [
            {
              id: "practice-1",
              day: "Monday",
              startTime: "15:30",
              endTime: "17:00",
              arrivalTime: "15:15",
              type: "full_pads",
              positionGroups: ["Offense"],
              focus: "Install",
              film: true,
            },
          ],
        },
        logistics: {
          travelMode: "bus",
          callTime: "14:00",
          departureTime: "14:30",
          pickupWindow: "Return around 10 PM",
          hotelName: "Team Hotel",
          hotelAddress: "500 Lane, Chicago, IL",
          mealPlan: "Pizza before kickoff",
          weatherPolicy: "Lightning delay protocol",
          parking: "Lot A",
          broadcast: "Live stream",
          ticketsLink: "https://tickets.example",
          notes: ["Bring water"],
        },
        gear: {
          uniform: "White jerseys",
          items: ["Helmet", "Mouthguard"],
        },
        volunteers: {
          slots: [
            {
              id: "vol-1",
              role: "Chain Gang",
              name: "Alex",
              filled: false,
              gameDate: "2025-09-13",
            },
          ],
        },
        announcements: {
          items: [
            {
              id: "announcement-1",
              text: "Gate Change\n\nUse the north gate after 6 PM.",
            },
          ],
        },
      },
    },
  });

  assert.equal(model.title, "Panthers Football");
  assert.deepEqual(
    model.navItems.map((item) => item.label),
    [
      "Game Schedule",
      "Team Roster",
      "Practice Schedule",
      "Travel & Logistics",
      "Equipment Checklist",
      "Parent Volunteers",
      "Announcements",
      "Attendance",
    ]
  );

  assert.equal(model.sections.find((section) => section.id === "games").cards.length, 1);
  assert.equal(model.sections.find((section) => section.id === "roster").cards.length, 1);
  assert.equal(model.sections.find((section) => section.id === "practice").cards.length, 1);
  assert.equal(model.sections.find((section) => section.id === "logistics").cards.length > 0, true);
  assert.equal(model.sections.find((section) => section.id === "gear").cards.length, 2);
  assert.equal(model.sections.find((section) => section.id === "volunteers").cards.length, 1);
  assert.equal(model.sections.find((section) => section.id === "announcements").cards.length, 1);
  assert.equal(model.sections.find((section) => section.id === "attendance").hasContent, true);
  assert.equal(model.attendance.enabled, true);
  assert.equal(model.attendance.visible, true);
  assert.equal(model.attendance.passcodeRequired, true);
  assert.match(model.sections.find((section) => section.id === "announcements").cards[0].title, /Gate Change/);
  assert.match(model.sections.find((section) => section.id === "games").cards[0].title, /vs Cougars/);
  assert.match(model.sections.find((section) => section.id === "roster").cards[0].body, /#12/);
});

