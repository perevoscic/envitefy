import "dotenv/config";

import { query, getEventHistoryById, updateEventHistoryData } from "../src/lib/db";
import {
  applyConciergeV2Session,
  createConciergeV2Session,
  type ConciergeV2ApplyResult,
} from "../src/lib/concierge-v2/storage";
import {
  assignConciergeV2Resource,
  createConciergeV2Resource,
  getConciergeV2ResourcePlanningCenter,
  updateConciergeV2Attendance,
} from "../src/lib/concierge-v2/resource-planning";
import { createConciergeV2HubParticipant } from "../src/lib/concierge-v2/team-class-hub";
import {
  applyConciergeV2AcceptedImportItems,
  createConciergeV2SourceImport,
  updateConciergeV2ExtractedItemStatus,
} from "../src/lib/concierge-v2/source-imports";

let OWNER_ID = process.env.DEMO_OWNER_ID || "";
let OWNER_EMAIL = process.env.DEMO_OWNER_EMAIL || "bugjosru@gmail.com";
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const DEMO_CREATED_AT = new Date().toISOString();

type ResourceSeed = {
  name: string;
  type: string;
  venue?: string;
  capacity?: number;
  notes?: string;
  occurrenceTitleIncludes?: string;
};

type RsvpSeed = {
  name: string;
  email: string;
  response: "yes" | "no" | "maybe";
  adultCount?: number;
  kidCount?: number;
  allergyNotes?: string;
  message?: string;
  answers?: Record<string, any>;
};

type DemoRecord = {
  title: string;
  mode: string;
  eventType: string;
  eventHistoryId: string;
  eventPageId: string | null;
  programId: string | null;
  eventPath: string;
  publicUrl: string;
  workspaceRoutes: Record<string, string>;
  created: boolean;
  notes: string[];
};

async function resolveDemoOwner() {
  const email = OWNER_EMAIL.trim().toLowerCase();
  const owner = OWNER_ID
    ? await query<{ id: string; email: string; is_admin: boolean }>(
        `select id, email, is_admin from users where id = $1 limit 1`,
        [OWNER_ID],
      )
    : await query<{ id: string; email: string; is_admin: boolean }>(
        `select id, email, is_admin from users where lower(email) = $1 order by created_at asc limit 1`,
        [email],
      );
  const row = owner.rows[0];
  if (!row) {
    throw new Error(
      `Demo owner not found. Set DEMO_OWNER_EMAIL to the localhost signed-in account before running this script.`,
    );
  }
  if (email && row.email.toLowerCase() !== email) {
    throw new Error(`DEMO_OWNER_ID belongs to ${row.email}, not ${OWNER_EMAIL}. Refusing to create demos.`);
  }
  OWNER_ID = row.id;
  OWNER_EMAIL = row.email;
  return row;
}

function at(localIso: string) {
  return new Date(localIso).toISOString();
}

function dateText(value: any): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function daysBefore(localIso: string, days: number, time = "09:00:00", offset = "-05:00") {
  const date = new Date(localIso);
  date.setUTCDate(date.getUTCDate() - days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return at(`${yyyy}-${mm}-${dd}T${time}${offset}`);
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function workspaceRoutes(eventHistoryId: string) {
  const base = `${BASE_URL}/concierge-v2/events/${eventHistoryId}`;
  return {
    schedule: `${base}/schedule`,
    rsvp: `${base}/rsvp`,
    setup: `${base}/resources`,
    hub: `${base}/hub`,
    imports: `${base}/imports`,
    calendar: `${base}/calendar`,
    ops: `${base}/ops`,
  };
}

function field(key: string, label: string, type = "text", required = false, options: string[] = []) {
  return { key, label, type, required, options };
}

function checklist(title: string, category: string, status = "open", description?: string) {
  return { title, category, status, description };
}

function reminder(
  title: string,
  reminderType: string,
  scheduledFor: string,
  status = "scheduled",
  channel = "email",
) {
  return { title, reminderType, channel, scheduledFor, status };
}

function payment(
  title: string,
  amountCents: number,
  dueAt: string | null,
  status = "unpaid",
  description?: string,
) {
  return { title, amountCents, currency: "USD", dueAt, status, description };
}

function slot(title: string, quantityNeeded: number, group: string, description?: string) {
  return { title, quantityNeeded, claimedQuantity: 0, group, description };
}

async function findExistingDemo(title: string): Promise<DemoRecord | null> {
  const res = await query<{ id: string; title: string; public_slug: string | null; data: any }>(
    `select id, title, public_slug, data
     from event_history
     where user_id = $1 and title = $2
     order by created_at desc
     limit 1`,
    [OWNER_ID, title],
  );
  const row = res.rows[0];
  if (!row) return null;
  const page = await query<{ id: string; program_id: string | null }>(
    `select id, program_id
     from event_pages
     where legacy_event_history_id = $1
     order by created_at desc
     limit 1`,
    [row.id],
  );
  const data = asRecord(row.data);
  const mode = String(data.mode || "demo");
  const eventType = String(data.eventType || "demo");
  const eventPath = `/event/${encodeURIComponent(row.public_slug || row.id)}`;
  return {
    title: row.title,
    mode,
    eventType,
    eventHistoryId: row.id,
    eventPageId: page.rows[0]?.id || null,
    programId: page.rows[0]?.program_id || null,
    eventPath,
    publicUrl: `${BASE_URL}${eventPath}`,
    workspaceRoutes: workspaceRoutes(row.id),
    created: false,
    notes: ["Already existed; reused to avoid duplicate demo events."],
  };
}

async function markDemo(result: ConciergeV2ApplyResult, params: {
  title: string;
  mode: string;
  eventType: string;
  category: string;
  thumbnail: string;
  theme: Record<string, any>;
  patch?: Record<string, any>;
}) {
  const row = await getEventHistoryById(result.eventHistoryId);
  if (!row) throw new Error(`Event history not found after create: ${params.title}`);
  const data = asRecord(row.data);
  const publicEvent = asRecord(data.publicEvent);
  const liveCard = asRecord(data.liveCard);
  const patch = asRecord(params.patch);
  const metadata = {
    ...asRecord(data.metadata_json),
    demo: true,
    demoCreatedAt: DEMO_CREATED_AT,
    demoOwnerId: OWNER_ID,
    demoOwnerEmail: OWNER_EMAIL,
  };
  const nextData = {
    ...data,
    ...patch,
    demo: true,
    internalDemo: true,
    metadata_json: metadata,
    mode: params.mode,
    eventType: params.eventType,
    category: params.category,
    status: "published",
    ownership: "owned",
    thumbnail: params.thumbnail,
    coverImageUrl: params.thumbnail,
    heroImage: params.thumbnail,
    theme: {
      ...asRecord(data.theme),
      ...params.theme,
    },
    publicEvent: {
      ...publicEvent,
      ...(asRecord(patch.publicEvent)),
      rsvpEnabled: true,
      reviewReady: true,
      demo: true,
    },
    liveCard: {
      ...liveCard,
      ...(asRecord(patch.liveCard)),
      cta: liveCard.cta || "RSVP",
      demo: true,
    },
  };
  await updateEventHistoryData(result.eventHistoryId, nextData);
  await query(
    `update event_pages
     set metadata_json = metadata_json || $2::jsonb,
       status = 'published'
     where id = $1`,
    [result.eventPageId, JSON.stringify(metadata)],
  );
  await query(
    `update programs
     set metadata_json = metadata_json || $2::jsonb
     where id = $1`,
    [result.programId, JSON.stringify({ ...metadata, eventType: params.eventType })],
  );
}

async function createFromDraft(params: {
  title: string;
  mode: string;
  eventType: string;
  inputText: string;
  draft: Record<string, any>;
  category: string;
  thumbnail: string;
  theme: Record<string, any>;
  patch?: Record<string, any>;
}): Promise<DemoRecord> {
  const existing = await findExistingDemo(params.title);
  if (existing) return existing;

  const session = await createConciergeV2Session({
    userId: OWNER_ID,
    inputText: params.inputText,
    sourceKind: "demo",
    draft: params.draft,
    referenceDate: "2026-06-04",
  });
  const result = await applyConciergeV2Session({
    userId: OWNER_ID,
    sessionId: session.id,
    draft: params.draft,
  });
  await markDemo(result, params);
  return {
    title: params.title,
    mode: params.mode,
    eventType: params.eventType,
    eventHistoryId: result.eventHistoryId,
    eventPageId: result.eventPageId,
    programId: result.programId,
    eventPath: result.eventPath,
    publicUrl: `${BASE_URL}${result.eventPath}`,
    workspaceRoutes: workspaceRoutes(result.eventHistoryId),
    created: true,
    notes: [`Created via Concierge V2 session ${session.id}.`],
  };
}

async function addResources(eventHistoryId: string, resources: ResourceSeed[]) {
  const center = await getConciergeV2ResourcePlanningCenter({ eventHistoryId, userId: OWNER_ID });
  const occurrences = center.occurrences;
  const existingResourceByName = new Map(
    center.resources.map((resource) => [resource.name.toLowerCase(), resource.id]),
  );
  const existingAssignmentKeys = new Set(
    center.assignments.map((assignment) => `${assignment.resourceId}:${assignment.occurrenceId}`),
  );
  for (const item of resources) {
    const resourceKey = item.name.toLowerCase();
    let resourceId = existingResourceByName.get(resourceKey) || null;
    if (!resourceId) {
      const created = await createConciergeV2Resource({
        eventHistoryId,
        userId: OWNER_ID,
        name: item.name,
        resourceType: item.type,
        venueName: item.venue,
        capacity: item.capacity,
        notes: item.notes,
      });
      resourceId = created.id || null;
    }
    const occurrence =
      occurrences.find((candidate) =>
        item.occurrenceTitleIncludes
          ? candidate.title.toLowerCase().includes(item.occurrenceTitleIncludes.toLowerCase())
          : false,
      ) || occurrences[0];
    const assignmentKey = occurrence?.id && resourceId ? `${resourceId}:${occurrence.id}` : "";
    const startsAt = dateText(occurrence?.startAt);
    const endsAt = dateText(occurrence?.endAt);
    if (resourceId && occurrence?.id && startsAt && !existingAssignmentKeys.has(assignmentKey)) {
      await assignConciergeV2Resource({
        eventHistoryId,
        userId: OWNER_ID,
        resourceId,
        occurrenceId: occurrence.id,
        startAt: startsAt,
        endAt: endsAt,
        notes: item.notes || `Demo assignment for ${item.name}.`,
      });
      existingAssignmentKeys.add(assignmentKey);
    }
    if (resourceId) existingResourceByName.set(resourceKey, resourceId);
  }
}

async function postRsvp(eventHistoryId: string, entry: RsvpSeed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${BASE_URL}/api/events/${eventHistoryId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response: entry.response,
        name: entry.name,
        email: entry.email,
        adultCount: entry.adultCount,
        kidCount: entry.kidCount,
        allergyNotes: entry.allergyNotes,
        message: entry.message,
        answers: entry.answers || {},
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`RSVP API returned ${res.status}: ${text.slice(0, 180)}`);
    }
    return "api";
  } catch (error) {
    await query(
      `insert into rsvp_responses (
         event_id, email, name, message, response, answers_json, adult_count, kid_count,
         allergy_notes, updated_at
       )
       values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, now())
       on conflict (event_id, email) where email is not null
       do update set response = excluded.response, name = excluded.name, message = excluded.message,
         answers_json = excluded.answers_json, adult_count = excluded.adult_count,
         kid_count = excluded.kid_count, allergy_notes = excluded.allergy_notes, updated_at = now()`,
      [
        eventHistoryId,
        entry.email,
        entry.name,
        entry.message || null,
        entry.response,
        JSON.stringify(entry.answers || {}),
        entry.adultCount ?? null,
        entry.kidCount ?? null,
        entry.allergyNotes || null,
      ],
    );
    return `db-fallback:${error instanceof Error ? error.message : String(error)}`;
  } finally {
    clearTimeout(timeout);
  }
}

async function postRsvps(eventHistoryId: string, responses: RsvpSeed[]) {
  const statuses: string[] = [];
  for (const entry of responses) {
    statuses.push(await postRsvp(eventHistoryId, entry));
  }
  return statuses;
}

async function createBirthdayDemo() {
  const start = at("2026-06-13T15:00:00-05:00");
  const end = at("2026-06-13T18:00:00-05:00");
  const title = "Demo: Lara's Birthday Pool Party";
  const demo = await createFromDraft({
    title,
    mode: "social",
    eventType: "birthday_party",
    category: "Birthday",
    thumbnail: "/studio/birthday.webp",
    theme: {
      palette: "summer pool party",
      accentColor: "#7c3aed",
      surface: "warm white",
      tone: "premium playful",
    },
    inputText:
      "Create a cat-themed summer birthday pool party for Lara with RSVP, allergy questions, setup items, helpers, optional gift link, and reminders.",
    draft: {
      title,
      mode: "social",
      eventType: "birthday_party",
      timezone: "America/Chicago",
      locationText: "Nana and Nanu's Pool, Santa Rosa Beach, FL",
      summary:
        "Join us for a fun cat-themed pool party with snacks, music, swimming, and birthday cake.",
      program: {
        title: "Lara's Birthday Pool Party",
        mode: "social",
      },
      occurrences: [
        {
          title: "Birthday Pool Party",
          type: "party",
          startAt: start,
          endAt: end,
          timezone: "America/Chicago",
          locationText: "Nana and Nanu's Pool, Santa Rosa Beach, FL",
          notes: "Cat-themed pool party with snacks, music, swimming, and birthday cake.",
        },
      ],
      forms: [
        {
          title: "Birthday RSVP Questions",
          description: "Help the host plan food, swimming supervision, and party supplies.",
          fields: [
            field("coming", "Are you coming?", "select", true, ["Yes", "Maybe", "No"]),
            field("kid_count", "Number of kids", "number", true),
            field("adult_count", "Number of adults", "number", true),
            field("allergies", "Any allergies?", "textarea"),
            field("favorite_pool_snack", "Favorite pool snack?", "text"),
            field("swims_independently", "Can your child swim independently?", "select", true, [
              "Yes",
              "No",
            ]),
          ],
        },
      ],
      volunteerSlots: [
        slot("Bring drinks", 1, "Food and drinks", "Juice boxes, water, or sparkling water."),
        slot("Bring fruit tray", 1, "Food and drinks", "A simple kid-friendly fruit tray."),
        slot("Help with setup", 2, "Helpers", "Arrive 30 minutes early."),
        slot("Help with cleanup", 2, "Helpers", "Stay 15 minutes after the party."),
        slot("Take birthday photos", 1, "Helpers", "Capture cake, pool fun, and group moments."),
      ],
      paymentItems: [
        payment("Party contribution", 0, null, "not_required", "No contribution is required."),
        payment(
          "Group gift contribution",
          1000,
          at("2026-06-12T12:00:00-05:00"),
          "optional",
          "Optional $10 group gift contribution.",
        ),
      ],
      reminders: [
        reminder("RSVP reminder", "rsvp_deadline", daysBefore("2026-06-13T15:00:00-05:00", 5)),
        reminder("Party tomorrow reminder", "event_tomorrow", at("2026-06-12T09:00:00-05:00")),
        reminder(
          "Bring towel and sunscreen reminder",
          "morning_of",
          at("2026-06-13T08:00:00-05:00"),
        ),
        reminder("Thank-you message draft", "follow_up", at("2026-06-14T10:00:00-05:00"), "draft"),
      ],
      checklistItems: [
        checklist("Birthday cake", "Food", "ready", "Pick up before noon."),
        checklist("Cat decorations", "Decorations", "in_progress"),
        checklist("Pool towels", "Setup", "open"),
        checklist("Extra sunscreen", "Safety", "open"),
        checklist("Drinks and juice boxes", "Food", "open"),
        checklist("Pizza", "Food", "open"),
        checklist("Paper plates and napkins", "Supplies", "ready"),
        checklist("Cleanup helper", "Helpers", "open"),
        checklist("Parking note", "Guest details", "ready"),
      ],
      missingFields: [],
    },
    patch: {
      giftPreferenceNote: "Gifts are optional. A placeholder gift link is included for review.",
      registries: [
        {
          label: "Optional group gift",
          url: "https://www.amazon.com/",
        },
      ],
      whatToBring: ["Swimsuit", "Towel", "Sunscreen", "Dry clothes"],
      goodToKnow:
        "Please park along the driveway side and send allergy notes with your RSVP.",
      publicEvent: {
        subheadline: "Cat-themed summer pool party",
        body: "Join us for snacks, music, swimming, birthday cake, and a playful cat-themed afternoon by the pool.",
      },
    },
  });

  {
    await addResources(demo.eventHistoryId, [
      { name: "Birthday cake", type: "food", venue: "Nana and Nanu's Pool", notes: "Pickup before noon." },
      { name: "Cat decorations", type: "decoration", venue: "Nana and Nanu's Pool", notes: "Set up on patio tables." },
      { name: "Pool towels", type: "setup_item", venue: "Pool deck", capacity: 18 },
      { name: "Extra sunscreen", type: "safety", venue: "Pool deck" },
      { name: "Drinks and juice boxes", type: "food", venue: "Cooler station" },
      { name: "Pizza", type: "food", venue: "Patio table" },
      { name: "Paper plates and napkins", type: "supply", venue: "Food table" },
      { name: "Cleanup helper", type: "helper", venue: "Pool deck", capacity: 2 },
      { name: "Parking note", type: "parking", venue: "Driveway", notes: "Use the right side of the driveway." },
    ]);
    const rsvpStatuses = await postRsvps(demo.eventHistoryId, [
      {
        name: "Avery Parker",
        email: "avery.parent.demo@example.com",
        response: "yes",
        adultCount: 1,
        kidCount: 2,
        allergyNotes: "No peanuts.",
        answers: {
          favorite_pool_snack: "Watermelon",
          swims_independently: "Yes",
        },
      },
      {
        name: "Maya Torres",
        email: "maya.torres.demo@example.com",
        response: "maybe",
        adultCount: 1,
        kidCount: 1,
        answers: {
          favorite_pool_snack: "Goldfish crackers",
          swims_independently: "No",
        },
      },
      {
        name: "Noah Reed",
        email: "noah.reed.demo@example.com",
        response: "yes",
        adultCount: 2,
        kidCount: 1,
        answers: {
          favorite_pool_snack: "Pizza",
          swims_independently: "Yes",
        },
      },
    ]);
    demo.notes.push(`RSVP seeds: ${rsvpStatuses.join(", ")}`);
  }
  return demo;
}

async function createGymnasticsDemo() {
  const title = "Demo: Livia Gymnastics Season";
  const meetArrival = at("2026-06-20T08:00:00-04:00");
  const meetStart = at("2026-06-20T09:30:00-04:00");
  const meetEnd = at("2026-06-20T12:30:00-04:00");
  const demo = await createFromDraft({
    title,
    mode: "gymnastics",
    eventType: "team_schedule",
    category: "Gymnastics",
    thumbnail: "/images/gymnastic-hero.png",
    theme: {
      palette: "gymnastics team",
      accentColor: "#6d28d9",
      surface: "clean white",
      tone: "organized team",
    },
    inputText:
      "Create a sample gymnastics season board for Livia with recurring practices, Orlando meet details, roster, travel reminders, resources, attendance, and payments.",
    draft: {
      title,
      mode: "gymnastics",
      eventType: "team_schedule",
      timezone: "America/Chicago",
      locationText: "US Gold Gym, Miramar Beach",
      summary:
        "A sample gymnastics season board with recurring practices, one Orlando meet, travel notes, reminders, attendance, and parent tasks.",
      program: {
        title: "Livia Gymnastics Season",
        mode: "gymnastics",
      },
      series: [
        {
          title: "Team Practice",
          type: "practice",
          recurrenceRule: "FREQ=WEEKLY;BYDAY=TU,TH",
          startTimeLocal: "17:30",
          durationMinutes: 90,
          timezone: "America/Chicago",
          locationText: "US Gold Gym, Miramar Beach",
          rangeLabel: "Next 8 weeks",
        },
      ],
      occurrences: [
        {
          title: "Orlando Spring Invitational Arrival",
          type: "meet_arrival",
          startAt: meetArrival,
          endAt: meetStart,
          timezone: "America/New_York",
          locationText: "Orlando Sports Center, Orlando, FL",
          notes: "Arrive 90 minutes early. Bring competition leo, warmups, grips, water, snacks, and hair supplies.",
        },
        {
          title: "Orlando Spring Invitational",
          type: "meet",
          startAt: meetStart,
          endAt: meetEnd,
          timezone: "America/New_York",
          locationText: "Orlando Sports Center, Orlando, FL",
          notes: "Competition begins at 9:30 AM Eastern.",
        },
      ],
      forms: [
        {
          title: "Meet Travel Questions",
          description: "Confirm attendance, travel needs, hotel plans, uniform readiness, and fees.",
          fields: [
            field("athlete_attending", "Athlete attending?", "select", true, ["Yes", "No"]),
            field("parent_attending", "Parent attending?", "select", true, ["Yes", "No"]),
            field("need_ride", "Need ride?", "select", false, ["Yes", "No"]),
            field("hotel_booked", "Hotel booked?", "select", false, ["Yes", "No"]),
            field("uniform_ready", "Uniform ready?", "select", false, ["Yes", "No"]),
            field("meet_fee_paid", "Meet fee paid?", "select", false, ["Yes", "No"]),
            field("travel_notes", "Any travel notes?", "textarea"),
          ],
        },
      ],
      paymentItems: [
        payment("Meet fee", 8500, at("2026-06-13T17:00:00-05:00"), "unpaid", "Due one week before meet."),
        payment("Team dinner", 2000, at("2026-06-19T12:00:00-04:00"), "optional", "Optional team dinner contribution."),
      ],
      reminders: [
        reminder("Practice reminder", "practice", at("2026-06-09T15:30:00-05:00")),
        reminder("Meet packing reminder", "packing", at("2026-06-17T09:00:00-05:00")),
        reminder("Hotel and travel reminder", "travel", at("2026-06-18T09:00:00-05:00")),
        reminder("Arrival reminder", "arrival", at("2026-06-20T06:30:00-04:00")),
        reminder("Fee deadline reminder", "payment_due", at("2026-06-12T09:00:00-05:00")),
      ],
      checklistItems: [
        checklist("Competition leo", "Uniform", "open"),
        checklist("Warmups", "Uniform", "open"),
        checklist("Grips", "Equipment", "open"),
        checklist("Water and snacks", "Packing", "open"),
        checklist("Hair supplies", "Packing", "open"),
        checklist("Hotel confirmation", "Travel", "open"),
        checklist("Parent carpool", "Travel", "in_progress"),
      ],
      missingFields: [],
    },
    patch: {
      publicEvent: {
        subheadline: "Practices, meet travel, roster, reminders, and fees",
        body: "A demo gymnastics season board for families to track practices, meet logistics, attendance, travel tasks, and fee status.",
      },
    },
  });

  {
    const participantIds: Record<string, string> = {};
    const existingCenter = await getConciergeV2ResourcePlanningCenter({
      eventHistoryId: demo.eventHistoryId,
      userId: OWNER_ID,
    });
    for (const participant of existingCenter.participants) {
      participantIds[participant.name] = participant.id;
    }
    for (const athlete of ["Livia", "Emma", "Sophia", "Ava", "Mia"]) {
      if (participantIds[athlete]) continue;
      const created = await createConciergeV2HubParticipant({
        eventHistoryId: demo.eventHistoryId,
        userId: OWNER_ID,
        firstName: athlete,
        role: "athlete",
        groupName: "Level 4 Team",
        familyName: `${athlete} Family`,
        notes: "Demo roster athlete.",
      });
      if (created.id) participantIds[athlete] = created.id;
    }
    await addResources(demo.eventHistoryId, [
      { name: "Coach Amanda", type: "coach", venue: "US Gold Gym", occurrenceTitleIncludes: "Team Practice" },
      { name: "Vault station", type: "apparatus", venue: "US Gold Gym", occurrenceTitleIncludes: "Team Practice" },
      { name: "Beam station", type: "apparatus", venue: "US Gold Gym", occurrenceTitleIncludes: "Team Practice" },
      { name: "Floor area", type: "apparatus", venue: "US Gold Gym", occurrenceTitleIncludes: "Team Practice" },
      { name: "Team warmup room", type: "warmup_area", venue: "Orlando Sports Center", occurrenceTitleIncludes: "Orlando Spring Invitational" },
      { name: "Hotel block", type: "hotel", venue: "Orlando hotel block", occurrenceTitleIncludes: "Orlando Spring Invitational" },
      { name: "Parent carpool", type: "volunteer", venue: "US Gold Gym", occurrenceTitleIncludes: "Orlando Spring Invitational" },
    ]);
    const center = await getConciergeV2ResourcePlanningCenter({ eventHistoryId: demo.eventHistoryId, userId: OWNER_ID });
    const nextPractice = center.occurrences.find((item) => item.title === "Team Practice");
    if (nextPractice) {
      const statuses: Record<string, string> = {
        Livia: "expected",
        Emma: "expected",
        Sophia: "expected",
        Ava: "absent",
        Mia: "expected",
      };
      for (const [athlete, status] of Object.entries(statuses)) {
        const participantId = participantIds[athlete];
        if (participantId) {
          await updateConciergeV2Attendance({
            eventHistoryId: demo.eventHistoryId,
            userId: OWNER_ID,
            occurrenceId: nextPractice.id,
            participantId,
            status,
            notes: status === "absent" ? "Family marked absent for demo." : "Expected at next practice.",
          });
        }
      }
    }
    const rsvpStatuses = await postRsvps(demo.eventHistoryId, [
      {
        name: "Livia Parent",
        email: "livia.parent.demo@example.com",
        response: "yes",
        adultCount: 1,
        kidCount: 1,
        answers: {
          athlete_attending: "Yes",
          parent_attending: "Yes",
          hotel_booked: "Yes",
          meet_fee_paid: "No",
        },
      },
      {
        name: "Emma Parent",
        email: "emma.parent.demo@example.com",
        response: "yes",
        adultCount: 2,
        kidCount: 1,
        answers: {
          athlete_attending: "Yes",
          parent_attending: "Yes",
          need_ride: "No",
          uniform_ready: "Yes",
        },
      },
    ]);
    demo.notes.push(`RSVP seeds: ${rsvpStatuses.join(", ")}`);
  }
  return demo;
}

async function createSchoolDemo() {
  const title = "Demo: Lara's School Spirit Week";
  const days = [
    ["Pajama Day", "2026-06-08", "wear pajamas"],
    ["Crazy Hair Day", "2026-06-09", "bring hair accessories"],
    ["Canned Food Drive", "2026-06-10", "bring canned food"],
    ["Team Shirt Day", "2026-06-11", "wear favorite team shirt"],
    ["Early Dismissal", "2026-06-12", "school ends early"],
  ];
  const demo = await createFromDraft({
    title,
    mode: "school",
    eventType: "spirit_week",
    category: "School Event",
    thumbnail: "/studio/field-trip-day.webp",
    theme: {
      palette: "school friendly",
      accentColor: "#7c3aed",
      surface: "warm classroom",
      tone: "parent friendly",
    },
    inputText:
      "Create a school spirit week board with daily themed reminders, parent response form, class party signup, supplies, volunteers, and early dismissal reminder.",
    draft: {
      title,
      mode: "school",
      eventType: "spirit_week",
      timezone: "America/Chicago",
      locationText: "Lara's Classroom",
      summary: "A sample school week board with daily themed reminders and a class signup.",
      program: {
        title: "Lara's School Spirit Week",
        mode: "school",
      },
      occurrences: days.map(([name, date, note]) => ({
        title: name,
        type: name === "Early Dismissal" ? "early_dismissal" : "spirit_day",
        startAt: at(`${date}T08:00:00-05:00`),
        endAt: at(`${date}T${name === "Early Dismissal" ? "12:00:00" : "15:00:00"}-05:00`),
        timezone: "America/Chicago",
        locationText: "Lara's Classroom",
        notes: note,
      })),
      forms: [
        {
          title: "Parent Response Form",
          description: "Collect parent responses for spirit week and the class party.",
          fields: [
            field("child_name", "Child name", "text", true),
            field("parent_name", "Parent name", "text", true),
            field("can_attend", "Can attend?", "select", false, ["Yes", "No"]),
            field("can_volunteer", "Can volunteer?", "select", false, ["Yes", "No"]),
            field("allergies", "Any allergies?", "textarea"),
            field("phone", "Best contact phone", "tel"),
          ],
        },
      ],
      volunteerSlots: [
        slot("Cupcakes", 2, "Class party signup", "Two packs or trays."),
        slot("Juice boxes", 2, "Class party signup", "Enough for 22 kids."),
        slot("Paper plates", 1, "Class party signup"),
        slot("Napkins", 1, "Class party signup"),
        slot("Fruit tray", 1, "Class party signup"),
        slot("Setup helper", 2, "Class party helpers"),
        slot("Cleanup helper", 2, "Class party helpers"),
      ],
      reminders: [
        ...days.flatMap(([name, date, note]) => [
          reminder(`${name} night-before reminder`, "night_before", at(`${date}T18:00:00-05:00`)),
          reminder(`${name} morning reminder`, "morning_of", at(`${date}T06:45:00-05:00`), "scheduled", "sms"),
        ]),
        reminder("Class party signup reminder", "signup", at("2026-06-10T16:00:00-05:00")),
        reminder("Early dismissal reminder", "early_dismissal", at("2026-06-12T06:45:00-05:00"), "scheduled", "sms"),
      ],
      checklistItems: [
        checklist("Cupcakes", "Snacks", "open"),
        checklist("Juice boxes", "Snacks", "open"),
        checklist("Paper plates", "Supplies", "ready"),
        checklist("Napkins", "Supplies", "ready"),
        checklist("Fruit tray", "Snacks", "open"),
        checklist("Setup helper", "Volunteers", "open"),
        checklist("Cleanup helper", "Volunteers", "open"),
        checklist("Parent response form", "Forms", "ready"),
      ],
      missingFields: [],
    },
    patch: {
      publicEvent: {
        subheadline: "Daily spirit themes, parent reminders, and class signup",
        body: "A sample class board for parents to check each day's theme, volunteer, submit responses, and prepare supplies.",
      },
    },
  });

  {
    await addResources(demo.eventHistoryId, [
      { name: "Cupcakes", type: "snack", venue: "Classroom", capacity: 2 },
      { name: "Juice boxes", type: "snack", venue: "Classroom", capacity: 2 },
      { name: "Paper plates", type: "supply", venue: "Classroom" },
      { name: "Napkins", type: "supply", venue: "Classroom" },
      { name: "Fruit tray", type: "snack", venue: "Classroom" },
      { name: "Setup helper", type: "volunteer", venue: "Classroom", capacity: 2 },
      { name: "Cleanup helper", type: "volunteer", venue: "Classroom", capacity: 2 },
      { name: "Parent response form", type: "form", venue: "Classroom" },
    ]);
    const rsvpStatuses = await postRsvps(demo.eventHistoryId, [
      {
        name: "Jordan Lee",
        email: "jordan.lee.demo@example.com",
        response: "yes",
        adultCount: 1,
        kidCount: 1,
        answers: {
          child_name: "Taylor",
          can_volunteer: "Yes",
          phone: "555-0101",
        },
      },
      {
        name: "Priya Shah",
        email: "priya.shah.demo@example.com",
        response: "yes",
        adultCount: 1,
        kidCount: 1,
        allergyNotes: "Dairy sensitivity.",
        answers: {
          child_name: "Anika",
          can_volunteer: "No",
        },
      },
    ]);
    demo.notes.push(`RSVP seeds: ${rsvpStatuses.join(", ")}`);
  }
  return demo;
}

async function createBusinessDemo() {
  const title = "Demo: Coastal Open House";
  const demo = await createFromDraft({
    title,
    mode: "business",
    eventType: "open_house",
    category: "Open House",
    thumbnail: "/studio/open-house.webp",
    theme: {
      palette: "professional coastal",
      accentColor: "#6d28d9",
      surface: "soft neutral",
      tone: "polished business",
    },
    inputText:
      "Create a professional coastal open house with RSVP, agenda, check-in resources, reminder timeline, and follow-up note.",
    draft: {
      title,
      mode: "business",
      eventType: "open_house",
      timezone: "America/Chicago",
      locationText: "30A Coastal Office, Santa Rosa Beach, FL",
      summary:
        "Join us for a relaxed open house with light refreshments, networking, and a short product walkthrough.",
      program: {
        title: "Coastal Open House",
        mode: "business",
      },
      occurrences: [
        {
          title: "Welcome and check-in",
          type: "agenda",
          startAt: at("2026-06-17T17:00:00-05:00"),
          endAt: at("2026-06-17T17:30:00-05:00"),
          timezone: "America/Chicago",
          locationText: "30A Coastal Office, Santa Rosa Beach, FL",
        },
        {
          title: "Short presentation",
          type: "agenda",
          startAt: at("2026-06-17T17:30:00-05:00"),
          endAt: at("2026-06-17T18:00:00-05:00"),
          timezone: "America/Chicago",
          locationText: "30A Coastal Office, Santa Rosa Beach, FL",
        },
        {
          title: "Networking",
          type: "agenda",
          startAt: at("2026-06-17T18:00:00-05:00"),
          endAt: at("2026-06-17T18:45:00-05:00"),
          timezone: "America/Chicago",
          locationText: "30A Coastal Office, Santa Rosa Beach, FL",
        },
        {
          title: "Closing notes",
          type: "agenda",
          startAt: at("2026-06-17T18:45:00-05:00"),
          endAt: at("2026-06-17T19:00:00-05:00"),
          timezone: "America/Chicago",
          locationText: "30A Coastal Office, Santa Rosa Beach, FL",
        },
      ],
      forms: [
        {
          title: "Open House RSVP",
          description: "Collect attendance, company, guests, and follow-up interest.",
          fields: [
            field("attending", "Are you attending?", "select", true, ["Yes", "Maybe", "No"]),
            field("guest_count", "How many guests?", "number"),
            field("company_name", "Company name", "text"),
            field("follow_up", "Interested in follow-up?", "select", false, ["Yes", "No"]),
          ],
        },
      ],
      reminders: [
        reminder("RSVP reminder", "rsvp", at("2026-06-14T09:00:00-05:00")),
        reminder("Event tomorrow reminder", "event_tomorrow", at("2026-06-16T09:00:00-05:00")),
        reminder("Thank-you and follow-up draft", "follow_up", at("2026-06-18T10:00:00-05:00"), "draft"),
      ],
      checklistItems: [
        checklist("Check-in table", "Guest experience", "open"),
        checklist("Refreshments", "Hospitality", "open"),
        checklist("Name tags", "Guest experience", "open"),
        checklist("Presentation screen", "Presentation", "ready"),
        checklist("Brochures", "Materials", "open"),
        checklist("Parking note", "Guest details", "ready"),
      ],
      missingFields: [],
    },
    patch: {
      resources: [
        { label: "Parking and arrival", url: "#" },
        { label: "Company overview", url: "#" },
      ],
      publicEvent: {
        subheadline: "Networking, refreshments, and a short walkthrough",
        body: "Join us for a relaxed open house with light refreshments, networking, and a concise product walkthrough.",
      },
    },
  });

  {
    await addResources(demo.eventHistoryId, [
      { name: "Check-in table", type: "check_in", venue: "30A Coastal Office" },
      { name: "Refreshments", type: "catering", venue: "Kitchen counter" },
      { name: "Name tags", type: "materials", venue: "Check-in table" },
      { name: "Presentation screen", type: "equipment", venue: "Conference area" },
      { name: "Brochures", type: "materials", venue: "Welcome table" },
      { name: "Parking note", type: "parking", venue: "Office lot" },
    ]);
    const rsvpStatuses = await postRsvps(demo.eventHistoryId, [
      {
        name: "Morgan Ellis",
        email: "morgan.ellis.demo@example.com",
        response: "yes",
        adultCount: 1,
        answers: {
          company_name: "Coastal Creative",
          follow_up: "Yes",
          guest_count: 1,
        },
      },
      {
        name: "Sam Rivera",
        email: "sam.rivera.demo@example.com",
        response: "maybe",
        adultCount: 1,
        answers: {
          company_name: "30A Partners",
          follow_up: "No",
        },
      },
    ]);
    demo.notes.push(`RSVP seeds: ${rsvpStatuses.join(", ")}`);
  }
  return demo;
}

async function createImportDemo() {
  const title = "Demo Import: Gymnastics Meet Packet";
  const sourceText = `Orlando Spring Invitational
Saturday, March 14
Arrival time: 8:00 AM
Competition begins: 9:30 AM
Location: Orlando Sports Center, Orlando FL
Meet fee: $85 due March 7
Bring competition leo, grips, warmups, water bottle, snacks, and hair supplies.
Team dinner Friday at 6:30 PM near the hotel.
Hotel block deadline March 1.
Parking is available onsite.`;
  const demo = await createFromDraft({
    title,
    mode: "gymnastics",
    eventType: "imported_schedule",
    category: "Gymnastics",
    thumbnail: "/images/gymanstic-1-landing.png",
    theme: {
      palette: "import review",
      accentColor: "#6d28d9",
      surface: "review workspace",
      tone: "confident OCR review",
    },
    inputText:
      "Create a demo pasted-text import workspace for a gymnastics meet packet and review extracted schedule, checklist, payment, and reminders.",
    draft: {
      title,
      mode: "gymnastics",
      eventType: "imported_schedule",
      timezone: "America/Chicago",
      locationText: "Orlando Sports Center, Orlando, FL",
      summary:
        "A pasted-text import demo that shows how Envitefy reviews a gymnastics meet packet and turns found details into schedule, fees, checklist, and reminders.",
      program: {
        title: "Imported Gymnastics Meet Packet",
        mode: "gymnastics",
      },
      occurrences: [
        {
          title: "Imported meet packet review",
          type: "import_review",
          startAt: at("2026-06-20T08:00:00-04:00"),
          endAt: at("2026-06-20T09:30:00-04:00"),
          timezone: "America/New_York",
          locationText: "Orlando Sports Center, Orlando, FL",
          notes: "Review extracted arrival, competition, fee, packing, hotel, dinner, and parking details.",
        },
      ],
      forms: [
        {
          title: "Imported Meet Questions",
          description: "Confirm meet travel details after reviewing the imported packet.",
          fields: [
            field("athlete_attending", "Athlete attending?", "select", true, ["Yes", "No"]),
            field("hotel_booked", "Hotel booked?", "select", false, ["Yes", "No"]),
            field("meet_fee_paid", "Meet fee paid?", "select", false, ["Yes", "No"]),
            field("travel_notes", "Travel notes", "textarea"),
          ],
        },
      ],
      paymentItems: [
        payment("Meet fee", 8500, at("2026-06-13T17:00:00-05:00"), "unpaid", "Imported from meet packet."),
      ],
      reminders: [
        reminder("Hotel block deadline reminder", "travel_deadline", at("2026-06-15T09:00:00-05:00")),
        reminder("Meet fee reminder", "payment_due", at("2026-06-13T09:00:00-05:00")),
        reminder("Packing reminder", "packing", at("2026-06-17T09:00:00-05:00")),
      ],
      checklistItems: [
        checklist("Competition leo", "Packing", "open"),
        checklist("Grips", "Packing", "open"),
        checklist("Warmups", "Packing", "open"),
        checklist("Water bottle", "Packing", "open"),
        checklist("Snacks", "Packing", "open"),
        checklist("Hair supplies", "Packing", "open"),
        checklist("Parking is available onsite", "Arrival", "ready"),
      ],
      missingFields: [],
    },
    patch: {
      sourceKind: "pasted_text",
      importedSourceTitle: title,
      sourceDocumentText: sourceText,
      publicEvent: {
        subheadline: "Pasted-text import review",
        body: "A demo import workspace showing extracted meet details, proposed schedule items, fees, checklist items, and reminders.",
      },
    },
  });

  {
    await addResources(demo.eventHistoryId, [
      { name: "Coach packet review", type: "coach", venue: "Imported packet" },
      { name: "Hotel block", type: "hotel", venue: "Orlando hotel block" },
      { name: "Meet fee", type: "fee", venue: "Orlando Sports Center" },
      { name: "Packing checklist", type: "equipment", venue: "Team bag" },
      { name: "Parking note", type: "parking", venue: "Orlando Sports Center" },
    ]);
    const existingDocument = await query<{ id: string }>(
      `select id
       from source_documents
       where parsed_json->>'eventHistoryId' = $1
       order by created_at desc
       limit 1`,
      [demo.eventHistoryId],
    );
    if (existingDocument.rows[0]?.id) {
      demo.notes.push(`Import document already exists: ${existingDocument.rows[0].id}`);
      return demo;
    }
    const document = await createConciergeV2SourceImport({
      eventHistoryId: demo.eventHistoryId,
      userId: OWNER_ID,
      sourceKind: "pasted_text",
      text: sourceText,
    });
    let applied = 0;
    for (const item of document.items) {
      await updateConciergeV2ExtractedItemStatus({
        eventHistoryId: demo.eventHistoryId,
        userId: OWNER_ID,
        documentId: document.id,
        itemId: item.id,
        status: "accepted",
      });
      applied += 1;
    }
    if (applied > 0) {
      await applyConciergeV2AcceptedImportItems({
        eventHistoryId: demo.eventHistoryId,
        userId: OWNER_ID,
        documentId: document.id,
      });
    }
    demo.notes.push(`Import document ${document.id} created with ${document.items.length} extracted items and ${applied} accepted items.`);
  }
  return demo;
}

async function main() {
  const owner = await resolveDemoOwner();
  const demos: DemoRecord[] = [];
  demos.push(await createBirthdayDemo());
  demos.push(await createGymnasticsDemo());
  demos.push(await createSchoolDemo());
  demos.push(await createBusinessDemo());
  demos.push(await createImportDemo());

  const counts = await query<{ title: string; resources: string; rsvps: string; reminders: string }>(
    `select eh.title,
       (
         select count(distinct r.id)::text
         from event_pages ep
         join resources r on r.workspace_id = ep.workspace_id
         where ep.legacy_event_history_id = eh.id
           and (
             r.attributes_json->>'eventHistoryId' = eh.id::text
             or r.attributes_json->>'programId' = ep.program_id::text
             or exists (
               select 1
               from resource_assignments ra
               join event_occurrences eo on eo.id = ra.occurrence_id
               where ra.resource_id = r.id and eo.program_id = ep.program_id
             )
           )
       ) as resources,
       (select count(*)::text from rsvp_responses rr where rr.event_id = eh.id) as rsvps,
       (select count(*)::text from event_pages ep join reminders rem on rem.event_page_id = ep.id where ep.legacy_event_history_id = eh.id) as reminders
     from event_history eh
     where eh.user_id = $1 and eh.title = any($2::text[])
     order by eh.created_at asc`,
    [OWNER_ID, demos.map((demo) => demo.title)],
  );

  console.log(JSON.stringify({
    owner,
    baseUrl: BASE_URL,
    demos,
    counts: counts.rows,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
