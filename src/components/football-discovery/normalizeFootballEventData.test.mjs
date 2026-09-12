import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFootballEventData } from "./normalizeFootballEventData.mjs";

test("saved section removals hide content and tabs without losing data needed to restore", () => {
  const original = {
    title: "Falcons Football",
    extra: { team: "Falcons", stadium: "Home Field" },
    rsvpEnabled: true,
    accessControl: { requirePasscode: true, mode: "access-code" },
    advancedSections: {
      games: { games: [{ id: "g1", opponent: "Owls", homeAway: "home" }] },
      scores: { scorestreamWidgetUrl: "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926" },
      roster: { players: [{ id: "p1", name: "Taylor", jerseyNumber: "8" }] },
      practice: { blocks: [{ id: "b1", day: "Monday", focus: "Footwork" }] },
      logistics: { travelMode: "Team bus" },
      gear: { items: [{ name: "Helmet" }] },
      volunteers: { slots: [{ id: "v1", role: "Concessions" }] },
      announcements: { items: [{ id: "a1", text: "Welcome to the season" }] },
    },
  };
  const baseline = normalizeFootballEventData({ eventData: original });
  assert.equal(baseline.navItems.length, 10);
  for (const id of ["details", "games", "scores", "roster", "practice", "logistics", "gear", "volunteers", "announcements", "rsvp"]) {
    const saved = JSON.parse(JSON.stringify({ ...original, footballHiddenSections: [id] }));
    const model = normalizeFootballEventData({ eventData: saved });
    const publicId = id === "rsvp" ? "attendance" : id;
    assert.equal(model.sections.some((section) => section.id === publicId), false, id);
    assert.equal(model.navItems.some((section) => section.id === publicId), false, id);
    assert.equal(model.navItems.length, baseline.navItems.length - 1);
    if (id === "details") assert.deepEqual(model.summaryItems, []);
    if (id === "rsvp") assert.equal(model.attendance.visible, false);
    assert.deepEqual(saved.advancedSections, original.advancedSections);
    assert.deepEqual(saved.accessControl, original.accessControl);
    assert.equal(model.teamName, "Falcons");
    saved.footballHiddenSections = [];
    assert.deepEqual(normalizeFootballEventData({ eventData: saved }), baseline);
  }
});

test("section visibility handles old records and imported fallback data", () => {
  const original = {
    discoverySource: { parseResult: {
      games: [{ id: "g1", opponent: "Owls" }],
      roster: { players: [{ id: "p1", name: "Taylor" }] },
    } },
  };
  const baseline = normalizeFootballEventData({ eventData: original });
  for (const malformed of [undefined, null, "games", {}, ["hero", "__proto__", 3, {}]]) {
    assert.deepEqual(normalizeFootballEventData({ eventData: { ...original, footballHiddenSections: malformed } }), baseline);
  }
  const model = normalizeFootballEventData({ eventData: {
    ...original, footballHiddenSections: ["games", "games", "roster"],
  } });
  assert.deepEqual(model.navItems, []);
  assert.equal(model.sections.some((section) => section.id === "games" || section.id === "roster"), false);
  assert.equal(original.discoverySource.parseResult.roster.players[0].name, "Taylor");
});

test("a saved ScoreStream widget adds live scores without needing imported games", () => {
  const saved = JSON.parse(JSON.stringify({
    customFields: { advancedSections: { scores: {
      scorestreamWidgetUrl: "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926",
    } } },
  }));
  const model = normalizeFootballEventData({ eventData: saved, eventTitle: "Football" });
  assert.deepEqual(model.navItems, [{ id: "scores", label: "Live scores" }]);
  assert.equal(model.sections.find((section) => section.id === "scores").scorestreamWidgetUrl,
    saved.customFields.advancedSections.scores.scorestreamWidgetUrl);
  assert.equal(model.sections.find((section) => section.id === "games").hasContent, false);
});

test("removing or invalidating a ScoreStream link hides the published section", () => {
  for (const value of ["", undefined, "https://evil.test/widgets/scoreboards/vert?userWidgetId=5926"]) {
    const model = normalizeFootballEventData({
      eventData: { advancedSections: { scores: { scorestreamWidgetUrl: value } } },
      eventTitle: "Football",
    });
    assert.deepEqual(model.navItems, []);
    assert.equal(model.sections.find((section) => section.id === "scores").scorestreamWidgetUrl, "");
  }
});

test("published team summaries and matchups use the mascot already present in the title", () => {
  const model = normalizeFootballEventData({
    eventTitle: "South Walton Seahawks Football",
    eventData: {
      customFields: { team: "South Walton High School Football" },
      advancedSections: { games: { games: [{ id: "game-1", opponent: "Fort Walton Beach", homeAway: "away" }] } },
    },
  });
  assert.equal(model.teamName, "South Walton Seahawks");
  assert.equal(model.summaryItems.find((item) => item.label === "Team").value, model.teamName);
  assert.equal(model.sections.find((section) => section.id === "games").cards[0].title, "Seahawks at Vikings");
});

test("published matchups preserve source-provided multiword mascots", () => {
  const model = normalizeFootballEventData({
    eventData: {
      customFields: { team: "St. Patrick", teamMascot: "Fighting Irish" },
      advancedSections: { games: { games: [{ id: "game-1", opponent: "Bayview", opponentMascot: "Tigers", homeAway: "home" }] } },
    },
  });
  assert.equal(model.teamName, "St. Patrick");
  assert.equal(model.teamMascot, "Fighting Irish");
  assert.equal(model.sections.find((section) => section.id === "games").cards[0].title, "Fighting Irish vs Tigers");
  const edited = normalizeFootballEventData({ eventData: {
    customFields: { team: "New School", teamMascot: "" },
    discoverySource: { parseResult: { homeTeam: "St. Patrick", homeMascot: "Fighting Irish" } },
    advancedSections: { games: { games: [{ id: "game-1", opponent: "Bayview", opponentMascot: "Tigers", homeAway: "away" }] } },
  } });
  assert.equal(edited.sections.find((section) => section.id === "games").cards[0].title, "New School at Tigers");
});

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
      "Details",
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

