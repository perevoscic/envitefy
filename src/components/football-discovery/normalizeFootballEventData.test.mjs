import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFootballEventData } from "./normalizeFootballEventData.mjs";

test("saved section removals hide content and tabs without losing data needed to restore", () => {
  const original = {
    title: "Falcons Football",
    details: "Join the team celebration after the final home game.",
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

test("hero facts do not create a duplicate Details section for schedule-only imports", () => {
  const original = {
    title: "South Walton Seahawks Football",
    extra: {
      team: "South Walton Seahawks", season: "2026",
      stadium: "South Walton High School football stadium",
      stadiumAddress: "645 Greenway Trail, Santa Rosa Beach, FL 32459",
    },
    advancedSections: { games: { games: [{ id: "g1", opponent: "Arnold", date: "2026-09-18" }] } },
  };
  const model = normalizeFootballEventData({ eventData: original });
  const details = model.sections.find((section) => section.id === "details");
  assert.equal(details.hasContent, false);
  assert.deepEqual(details.cards, []);
  assert.deepEqual(model.navItems, [{ id: "games", label: "Game Schedule" }]);
  assert.match(model.subtitle, /South Walton Seahawks.*2026/);
  assert.match(model.locationLabel, /South Walton High School football stadium.*645 Greenway Trail/);
  assert.equal(original.extra.stadiumAddress, "645 Greenway Trail, Santa Rosa Beach, FL 32459");

  const authored = normalizeFootballEventData({ eventData: {
    ...original, details: "Proceeds support the school library.",
    extra: { ...original.extra, headCoach: "Coach Taylor", contact: "team@example.com" },
  } });
  const authoredDetails = authored.sections.find((section) => section.id === "details");
  assert.deepEqual(authoredDetails.lines, ["Proceeds support the school library."]);
  assert.deepEqual(authoredDetails.cards.map((card) => card.id), ["headCoach", "contact"]);
});

test("open-week announcements follow schedule edits without creating duplicate saved content", () => {
  const original = {
    extra: { season: "2026" },
    advancedSections: {
      games: { games: [
        { id: "game", opponent: "Pine Forest", date: "2026-09-25" },
        { id: "off", opponent: "Open Week", date: "2026-10-16" },
        { id: "duplicate", opponent: "Bye", date: "10/16" },
      ] },
      announcements: { items: [{ id: "gate", text: "Gate change\n\nUse gate B." }] },
    },
  };
  const saved = JSON.stringify(original);
  const model = normalizeFootballEventData({ eventData: original });
  const announcements = (data) => normalizeFootballEventData({ eventData: data }).sections.find((section) => section.id === "announcements");
  assert.deepEqual(announcements(original).cards, [
    { id: "gate", title: "Gate change", body: "Use gate B." },
    { id: "off-week-2026-10-16", title: "Open week", body: "Fri, Oct 16, 2026 · No game scheduled" },
  ]);
  assert.ok(model.navItems.some((item) => item.id === "announcements"));
  assert.equal(model.sections.find((section) => section.id === "games").cards.length, 1);
  assert.equal(JSON.stringify(original), saved);
  assert.deepEqual(announcements(JSON.parse(saved)), announcements(original));

  const changed = JSON.parse(saved);
  changed.advancedSections.games.games = [{ id: "off", opponent: "Open Week", date: "2026-10-23" }];
  assert.equal(announcements(changed).cards[1].body, "Fri, Oct 23, 2026 · No game scheduled");
  changed.advancedSections.games.games = [];
  assert.equal(announcements(changed).cards.length, 1);
  assert.equal(announcements({ ...original, footballHiddenSections: ["announcements"] }), undefined);

  const imported = { discoverySource: { parseResult: { season: "2026", games: [{ opponent: "Off week", date: "10/16" }] } } };
  assert.equal(announcements(imported).cards[0].body, "Fri, Oct 16, 2026 · No game scheduled");
  delete imported.discoverySource.parseResult.season;
  assert.equal(announcements(imported).cards[0].body, "10/16 · No game scheduled");
  imported.discoverySource.parseResult.games[0].date = "";
  assert.equal(announcements(imported).cards[0].body, "Date to be confirmed · No game scheduled");
});

test("Senior Night announcements retain the game date, matchup and source ceremony details", () => {
  const data = {
    extra: { team: "South Walton Seahawks", season: "2026" },
    advancedSections: { games: { games: [
      { id: "open", opponent: "Open Week", date: "10/16" },
      { id: "senior", opponent: "Pensacola Catholic", homeAway: "home", date: "10/30", notes: "Senior Night" },
    ] } },
  };
  const cards = () => normalizeFootballEventData({ eventData: data }).sections.find((section) => section.id === "announcements").cards;
  assert.deepEqual(cards(), [
    { id: "off-week-2026-10-16", title: "Open week", body: "Fri, Oct 16, 2026 · No game scheduled" },
    { id: "senior-night-senior", title: "Senior Night", body: "Fri, Oct 30, 2026 · Pensacola Catholic at Seahawks" },
  ]);
  const senior = data.advancedSections.games.games[1];
  senior.date = "10/23";
  senior.notes = "Senior Night ceremony at 6 PM.";
  assert.equal(cards()[1].body, "Fri, Oct 23, 2026 · Pensacola Catholic at Seahawks\n\nSenior Night ceremony at 6 PM.");
  senior.notes = "Bring a blanket";
  assert.equal(cards().length, 1);
  senior.notes = "Senior Night";
  senior.opponent = "Open Week";
  assert.ok(cards().every((card) => card.title === "Open week"));
  assert.equal(data.advancedSections.announcements, undefined);
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

test("saved generic season titles show the school-year schedule name without changing authored titles", () => {
  const eventData = {
    title: "South Walton Seahawks Football",
    extra: { team: "South Walton Seahawks", season: "2026" },
    advancedSections: { games: { games: [{ id: "1", opponent: "Walton" }, { id: "2", opponent: "Bay" }] } },
  };
  assert.equal(normalizeFootballEventData({ eventData }).title, "South Walton Seahawks Football '26-'27 Schedule");
  assert.equal(normalizeFootballEventData({ eventData: { ...eventData, title: "Seahawks Homecoming" } }).title, "Seahawks Homecoming");
  assert.equal(eventData.title, "South Walton Seahawks Football");
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
  assert.equal(model.sections.find((section) => section.id === "games").cards[0].title, "Tigers at Fighting Irish");
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
  assert.match(model.sections.find((section) => section.id === "games").cards[0].title, /Cougars at Varsity Panthers/);
  assert.match(model.sections.find((section) => section.id === "roster").cards[0].body, /#12/);
});
