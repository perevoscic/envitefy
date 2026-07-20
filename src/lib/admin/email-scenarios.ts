import { ENVITEFY_PUBLIC_ORIGIN } from "../public-asset-url.ts";

export type AdminEmailScenarioId = "snap" | "concierge" | "teachers" | "share";

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
    title: "Parents: snap a birthday flyer",
    body: "Point the camera at the invite. Envitefy reads the details and builds a live event card you can share in seconds.",
    ctaLabel: "Try Snap",
    ctaPath: "/snap",
    stillScene:
      "Documentary-style photo of a parent at a kitchen table photographing a printed kids birthday invitation with a phone. Natural window light, realistic hands and paper texture, shallow depth of field. Soft-focus on the printed card is fine. No logos, watermarks, brand marks, glowing overlays, collage, or floating icons.",
  },
  {
    id: "concierge",
    title: "Birthday coming up? Ask Concierge",
    body: "Describe the party in plain language. Concierge helps draft the event page, RSVP flow, and next steps without starting from a blank form.",
    ctaLabel: "Open Concierge",
    ctaPath: "/chat",
    stillScene:
      "Natural lifestyle photo of a parent at a desk with coffee and a notebook, calmly using a phone to plan an upcoming birthday. Soft realistic lighting, authentic skin texture. No logos, watermarks, holograms, robot avatar, glowing UI bubbles, or floating collage panels.",
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
    body: "Send a single Envitefy event link so guests can RSVP, check details, and stay aligned—without long group threads.",
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
