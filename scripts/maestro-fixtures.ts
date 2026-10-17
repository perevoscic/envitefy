// Fixture data uses the application's real adapters. No provider requests occur here.
import { readFile, writeFile } from "node:fs/promises";
import { liveCardHistoryPayload } from "../src/app/live-cards/livecard-adapters";
import { createLiveCardForm } from "../src/lib/livecard-builder";
import { createSignupThemeForm } from "../src/lib/signup-starters";

const input = JSON.parse(await readFile(process.argv[2], "utf8"));
const { baseUrl, accounts } = input;
const date = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
function card(owner: number, key: string, status: "draft" | "published" = "published") {
  const form = {
    ...createLiveCardForm("America/Chicago"),
    title: `Maestro ${key}`,
    eventType: "General event" as const,
    design: "A calm botanical gathering",
    date,
    startTime: "14:00",
    endTime: "16:00",
    overview: "Original guest message",
    locations: [
      {
        id: "primary",
        label: "",
        venue: "Synthetic QA venue",
        address: "100 Test Lane, Austin, TX",
        time: "",
        note: "",
        resolution: "verified" as const,
        timezone: "America/Chicago",
      },
    ],
  };
  const imageUrl = `${baseUrl}/__campaign-media/fixture.webp`;
  // Legacy baked artwork is deliberately supported: routine tests need no paid generation.
  const artwork = {
    imageUrl,
    designKey: JSON.stringify([form.title, form.eventType, form.design, form.referenceUrl]),
  };
  const payload = liveCardHistoryPayload(form, artwork, status);
  return { key, owner: accounts[owner - 1].id, ...payload };
}
function signup(owner: number, key: string, { full = false, cohost = false } = {}) {
  const form = {
    ...createSignupThemeForm("school-days"),
    title: `Maestro ${key}`,
    version: 1,
    revision: 0,
    enabled: true,
    start: `${date}T14:00`,
    end: `${date}T16:00`,
    timezone: "America/Chicago",
    locationMode: "tba",
    sections: [
      {
        id: "helpers",
        title: "Volunteer shifts",
        purpose: "volunteers",
        slots: [{ id: "welcome", label: "Welcome desk", capacity: full ? 1 : 4 }],
      },
    ],
    questions: [{ id: "note", prompt: "Anything we should know?", required: false }],
    settings: {
      allowMultipleSlotsPerPerson: true,
      maxGuestsPerSignup: 1,
      waitlistEnabled: true,
      lockWhenFull: true,
      collectPhone: false,
      collectEmail: true,
      showRemainingSpots: true,
      autoRemindersHoursBefore: [],
    },
    responses: full
      ? [
          {
            id: "seed-reservation",
            userId: accounts[5].id,
            name: "Seed participant",
            email: accounts[5].email,
            status: "confirmed",
            slots: [{ sectionId: "helpers", slotId: "welcome", quantity: 1 }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      : [],
  };
  return {
    key,
    owner: accounts[owner - 1].id,
    title: form.title,
    cohost,
    data: {
      title: form.title,
      category: "Sign-up Form",
      createdVia: "signup-form",
      ownership: "owned",
      status: "published",
      isDraft: false,
      signupForm: form,
      start: form.start,
      startAt: form.start,
      end: form.end,
      templateEditor: {
        category: "signup-forms",
        templateId: "editorial--school-days",
        snapshot: { form },
      },
    },
  };
}
const events = [
  card(2, "draft invitation", "draft"),
  card(3, "published invitation"),
  card(2, "cohost invitation"),
  signup(6, "host signup"),
  signup(6, "participant signup"),
  signup(6, "waitlist signup", { full: true }),
  signup(6, "cohost signup", { cohost: true }),
  {
    key: "private scan",
    owner: accounts[4].id,
    title: "Maestro private appointment",
    data: {
      title: "Maestro private appointment",
      category: "Medical Appointments",
      categoryKey: "doctor_appointments",
      ownership: "owned",
      createdVia: "scan",
      source: "scan",
      status: "published",
      start: `${date}T15:00:00-06:00`,
      end: `${date}T16:00:00-06:00`,
      timezone: "America/Chicago",
      fieldsGuess: {
        title: "Maestro private appointment",
        category: "Medical Appointments",
        patient: "Synthetic Patient",
        clinician: "Synthetic Clinician",
        location: "Synthetic QA clinic",
        start: `${date}T15:00`,
      },
      heroImageUrl: `${baseUrl}/__campaign-media/fixture.webp`,
    },
  },
];
await writeFile(process.argv[3], JSON.stringify({ events }, null, 2));
