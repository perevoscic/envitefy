import assert from "node:assert/strict";
import test from "node:test";
import {
  combineGuestInfoFacts,
  detectCategory,
  extractCommonOcrFactsFromFlyerText,
  extractGuestAttendanceFactsFromFlyerText,
  extractGuestReminderFromFlyerText,
  extractHostedByFromFlyerText,
  extractRsvpDetails,
  inferTimezoneFromAddress,
  pickTitle,
  splitVenueFromAddress,
} from "./text.ts";
import { isFootballOcrSkinCandidate } from "./skin-background.ts";

test("pickTitle prefers event-like lines over dates", () => {
  const lines = ["Saturday", "Gemma's 7th Birthday Party", "April 12 at 2 PM"];
  const title = pickTitle(lines, lines.join("\n"));
  assert.match(title, /Birthday Party/i);
  assert.doesNotMatch(title, /^Event from flyer$/i);
});

test("inferTimezoneFromAddress detects central and pacific hints", () => {
  assert.equal(inferTimezoneFromAddress("Austin, Texas"), "America/Chicago");
  assert.equal(inferTimezoneFromAddress("San Diego, California"), "America/Los_Angeles");
});

test("splitVenueFromAddress keeps venue separate from street address", () => {
  const split = splitVenueFromAddress(
    "US Gold Gymnastics, 123 Main St, Springfield, IL 62704",
    "",
    "",
  );
  assert.equal(split.venue, "US Gold Gymnastics");
  assert.equal(split.address, "123 Main St, Springfield, IL 62704");
});

test("detectCategory recognizes medical and sports text", () => {
  assert.equal(
    detectCategory("Dental cleaning appointment with Sacred Heart"),
    "Doctor Appointments",
  );
  assert.equal(detectCategory("Volleyball practice schedule Monday 4:30"), "Sport Events");
  assert.equal(detectCategory("Basketball league game vs Central at 6 PM"), "Sport Events");
  assert.equal(
    detectCategory("Football Senior Night pregame 6:45 PM kickoff 7:30 PM"),
    "Sport Events",
  );
});

test("football OCR skin candidate recognizes senior night, matchup, and watch party flyers", () => {
  assert.equal(
    isFootballOcrSkinCandidate({
      category: "Sport Events",
      title: "Football Senior Night",
      ocrText: "Pregame 6:45 PM Kickoff 7:30 PM",
    }),
    true,
  );
  assert.equal(
    isFootballOcrSkinCandidate({
      category: "Sport Events",
      title: "Friday Night Lights",
      ocrText: "Westfield Tigers vs Central Ridge Panthers",
    }),
    true,
  );
  assert.equal(
    isFootballOcrSkinCandidate({
      category: "General Events",
      title: "Sunday Night Watch Party",
      ocrText: "Jets vs Texans bar specials",
    }),
    true,
  );
});

test("detectCategory recognizes expanded invite categories", () => {
  assert.equal(detectCategory("Join us for Ava's Baby Shower brunch"), "Baby Showers");
  assert.equal(detectCategory("Olivia's Bridal Shower at Magnolia House"), "Bridal Showers");
  assert.equal(
    detectCategory("Join us for the Carter housewarming at our new home"),
    "Housewarming",
  );
  assert.equal(detectCategory("Class of 2026 Graduation Party"), "Graduations");
  assert.equal(detectCategory("Graduation Ceremony — Lena De La Cruz"), "Graduations");
  assert.equal(
    detectCategory("You're invited to our neighborhood fundraiser gala"),
    "General Events",
  );
});

test("extractRsvpDetails captures wedding RSVP url and deadline", () => {
  const details = extractRsvpDetails(
    ["RSVP by December 1st at:", "theknot.com/us/isabellaandjonathon"].join("\n"),
  );

  assert.equal(details.url, "https://theknot.com/us/isabellaandjonathon");
  assert.equal(details.deadline, "December 1st");
  assert.equal(details.contact, null);
});

test("extractRsvpDetails keeps phone-based RSVP contact", () => {
  const details = extractRsvpDetails("RSVP to Maria at 555-123-4567");

  assert.equal(details.contact, "RSVP: Maria 555-123-4567");
  assert.equal(details.url, null);
  assert.equal(details.deadline, null);
});

test("extractRsvpDetails does not treat generic links as RSVP links", () => {
  const details = extractRsvpDetails("Photos: www.example.com/gallery");

  assert.equal(details.url, null);
  assert.equal(details.deadline, null);
  assert.equal(details.contact, null);
});

test("extractGuestAttendanceFactsFromFlyerText keeps sports eligibility and fee details", () => {
  const facts = extractGuestAttendanceFactsFromFlyerText(
    "All Skill Levels Welcome\nAges 16+ • Free to Play",
  );

  assert.equal(facts, "All Skill Levels Welcome. Ages 16+. Free to Play");
});

test("extractCommonOcrFactsFromFlyerText keeps flyer facts but skips question footer", () => {
  const facts = extractCommonOcrFactsFromFlyerText(
    [
      "All Skill Levels Welcome",
      "Ages 16+ • Free to Play",
      "Bring water and both light & dark shirts",
      "Questions? Text (555) 014-2277",
      "Hosted by the Neighborhood Rec Group",
    ].join("\n"),
  );

  assert.deepEqual(facts, [
    { label: "Good to Know", value: "All Skill Levels Welcome" },
    { label: "Good to Know", value: "Ages 16+" },
    { label: "Good to Know", value: "Free to Play" },
    { label: "Host", value: "The Neighborhood Rec Group" },
    { label: "Good to Know", value: "Bring water and both light & dark shirts" },
  ]);
});

test("extractCommonOcrFactsFromFlyerText preserves pickleball timing, fee, and perks", () => {
  const facts = extractCommonOcrFactsFromFlyerText(
    [
      "CHECK-IN 8:30 AM • GAMES START 9:00 AM",
      "$25 ENTRY",
      "PRIZES • MUSIC • REFRESHMENTS",
      "ALL SKILL LEVELS WELCOME",
      "BRING YOUR PADDLE. BRING YOUR GAME.",
    ].join("\n"),
  );

  assert.deepEqual(facts, [
    { label: "Check-in", value: "Check-in 8:30 AM" },
    { label: "Games Start", value: "Games start 9:00 AM" },
    { label: "Entry Fee", value: "$25 ENTRY" },
    { label: "Perks", value: "Prizes, Music, Refreshments" },
    { label: "Good to Know", value: "ALL SKILL LEVELS WELCOME" },
    { label: "Good to Know", value: "BRING YOUR PADDLE. BRING YOUR GAME" },
  ]);
});

test("extractGuestReminderFromFlyerText keeps bring instructions without questions footer", () => {
  const reminder = extractGuestReminderFromFlyerText(
    "Bring water and both light & dark shirts\nQuestions? Text (555) 014-2277",
  );

  assert.equal(reminder, "Bring water and both light & dark shirts");
});

test("combineGuestInfoFacts merges OCR guest facts without duplicates", () => {
  assert.equal(
    combineGuestInfoFacts(
      "All Skill Levels Welcome. Ages 16+. Free to Play",
      "Ages 16+",
      "Bring water and both light & dark shirts",
    ),
    "All Skill Levels Welcome. Ages 16+. Free to Play. Bring water and both light & dark shirts",
  );
});

test("extractHostedByFromFlyerText captures printed host group", () => {
  assert.equal(
    extractHostedByFromFlyerText("Hosted by the Neighborhood Rec Group"),
    "the Neighborhood Rec Group",
  );
});
