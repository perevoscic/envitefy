import { ENVITEFY_PUBLIC_ORIGIN } from "../public-asset-url.ts";

export type AdminEmailScenarioId =
  | "snap"
  | "concierge"
  | "live-page"
  | "rsvp"
  | "signups"
  | "weddings"
  | "sports"
  | "teachers"
  | "share";

export type AdminEmailProductScenario = {
  id: AdminEmailScenarioId;
  title: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
  /** Still-image scene for AI generation (photographic, not GIF). */
  stillScene: string;
};

/**
 * Product use-case rows injected into admin marketing emails.
 * Each row gets a freshly generated still photo that must pass anti-AI visual QA.
 */
export const ADMIN_EMAIL_PRODUCT_SCENARIOS: AdminEmailProductScenario[] = [
  {
    id: "snap",
    title: "Snap any invitation into a live event card",
    body: "Photograph or upload an invitation, flyer, screenshot, or event image and Envitefy creates a saved live event card with the important details organized. Add it to a calendar, share one easy link, and reopen it anytime instead of losing the paper invite or adding more fridge clutter.",
    ctaLabel: "Try Snap",
    ctaPath: "/snap",
    stillScene:
      "Documentary-style photo of a person photographing or uploading a printed invitation that matches the campaign's requested event type. Natural window light, realistic hands and paper texture, shallow depth of field. Soft-focus on the printed card is fine. No logos, watermarks, brand marks, glowing overlays, collage, or floating icons.",
  },
  {
    id: "concierge",
    title: "Birthday coming up? Ask Envitefy Concierge",
    body: "Describe the event in plain language and Envitefy Concierge creates a polished invitation and live event page without starting from a blank form. Review the draft, add relevant tools such as RSVP, calendar, directions, registry, or reminders, then share one guest-ready link.",
    ctaLabel: "Open Envitefy Concierge",
    ctaPath: "/chat",
    stillScene:
      "Natural lifestyle photo of a host at a desk with coffee and a notebook, calmly using a phone to plan the event type requested by the campaign. Soft realistic lighting, authentic skin texture. No logos, watermarks, holograms, robot avatar, glowing UI bubbles, or floating collage panels.",
  },
  {
    id: "live-page",
    title: "Give every event one live home",
    body: "Publish a polished, mobile-friendly event page that guests can open without installing an app or creating an account. Keep the current details, schedule, calendar, directions, updates, and relevant guest actions together on one easy link.",
    ctaLabel: "Create an event page",
    ctaPath: "/invitation-maker",
    stillScene:
      "Professional lifestyle photo of a host showing one clean event page on a phone to a guest in a bright, realistic setting that matches the campaign's event type. Natural light, believable hands and screen reflections, simple composition. No readable logos, watermarks, floating UI, collage panels, or glowing icons.",
  },
  {
    id: "rsvp",
    title: "Keep RSVPs with the invitation",
    body: "Let guests respond from the live event page, then keep attendance, household counts, plus-ones, pending replies, and relevant notes organized for the host. Depending on the event, collect details such as kids and adults, allergies, meal choices, guest messages, reveal guesses, or athlete availability.",
    ctaLabel: "Create an RSVP page",
    ctaPath: "/invitation-maker",
    stillScene:
      "Natural documentary photo of an event host reviewing guest responses on a phone or laptop at a tidy kitchen table or planning desk, with subtle event-appropriate props. Realistic screen glow and hands, calm confident expression, professional stock-photo finish. No logos, watermarks, fake readable dashboards, floating charts, collage, or neon overlays.",
  },
  {
    id: "signups",
    title: "Coordinate every signup without the spreadsheet cleanup",
    body: "Create a live signup form for volunteer roles, potluck items, supplies, shifts, snacks, or custom needs. Set quantities, capacity, time windows, per-person limits, and waitlists, then share the form by link or QR code and see what is claimed or still needed.",
    ctaLabel: "Create a signup form",
    ctaPath: "/signup-forms",
    stillScene:
      "Professional documentary photo of a community, school, team, or family organizer calmly reviewing a volunteer or supply signup on a laptop while a few labeled but unreadable planning items sit nearby. Natural light, realistic people and materials, clean single scene. No logos, watermarks, readable personal data, floating checkmarks, collage, or glowing overlays.",
  },
  {
    id: "weddings",
    title: "One elegant home for the whole wedding experience",
    body: "Bring the invitation, multi-event itinerary, RSVPs, registry or fund links, maps, travel details, and calendar actions together in a polished wedding page. Supported flows can also track meal choices, dietary needs, guest messages, and other planning details.",
    ctaLabel: "Create a wedding invitation",
    ctaPath: "/weddings",
    stillScene:
      "Elegant editorial wedding-planning photo of a couple or planner reviewing a printed invitation beside a phone, with refined stationery, rings, or florals in natural window light. Luxurious but believable materials, realistic hands, single scene. No logos, watermarks, readable private details, collage, floating icons, or magical glow.",
  },
  {
    id: "sports",
    title: "Turn team schedules into a family-ready hub",
    body: "Organize sports flyers, game schedules, meet packets, session times, locations, parking, team notes, calendar actions, and updates on one page. Specialized flows can also collect parent responses, athlete availability, and volunteer needs.",
    ctaLabel: "Create a sports event",
    ctaPath: "/sports",
    stillScene:
      "Realistic sports-family planning photo matching the campaign's named sport: a coach or parent reviewing a schedule on a phone beside ordinary team gear at a gym, field, or kitchen table. Natural documentary lighting and authentic equipment, single scene. No logos, watermarks, readable roster data, collage, floating scoreboards, or neon effects.",
  },
  {
    id: "teachers",
    title: "Teachers: class parties made simpler",
    body: "Turn classroom party flyers and volunteer lists into one shareable page with RSVPs and smart sign-ups for snacks, supplies, and helpers.",
    ctaLabel: "Plan a class event",
    ctaPath: "/",
    stillScene:
      "Professional classroom photo of teachers and parents gathered around a desk looking at one phone together, with balloons or school supplies nearby. Stock-photography realism, natural expressions, clean composition with optional empty negative space on one side. No logos, watermarks, brand overlays, surreal composites, neon lines, or floating icons.",
  },
  {
    id: "share",
    title: "Share one link with every family",
    body: "Send one Envitefy event link that opens in any browser, with no app required. Guests can check the latest details and use relevant actions such as RSVP, calendar, directions, registry, or sign-ups without digging through long message threads.",
    ctaLabel: "Create & share",
    ctaPath: "/",
    stillScene:
      "Clean lifestyle photo of two people casually sharing a phone screen in a bright home or school hallway. Realistic photography, natural color, simple framing. No logos, watermarks, brand badges, multi-phone collage, glowing connection lines, or floating profile bubbles.",
  },
];

export function resolveScenarioCtaUrl(ctaPath: string): string {
  try {
    return new URL(ctaPath, ENVITEFY_PUBLIC_ORIGIN).toString();
  } catch {
    return ENVITEFY_PUBLIC_ORIGIN;
  }
}
