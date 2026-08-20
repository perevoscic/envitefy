import type { MobileAuditCase, MobileAuditPersona } from "./types";

const publicRoutes = [
  "/landing",
  "/about",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/how-it-works",
  "/who-its-for",
  "/showcase",
  "/weddings",
  "/birthdays",
  "/baby-showers",
  "/bridal-showers",
  "/gender-reveal",
  "/gymnastics",
  "/sports",
  "/sport-events",
  "/football",
  "/signup-forms",
  "/templates/signup",
  "/guides",
  "/guides/wedding-event-page",
  "/guides/live-card-invitations",
  "/guides/registry-invitation-page",
  "/guides/smart-signup-forms",
  "/guides/gymnastics-meet-page",
  "/guides/pdf-to-event-page",
  "/guides/share-event-page-without-app",
  "/guides/flyer-to-event-page",
  "/guides/rsvp-event-page",
  "/guides/birthday-rsvp-invitation",
  "/forgot",
  "/reset",
  "/verify-request",
  "/open",
  "/snap",
] as const;

const creatorRoutes = [
  "/",
  "/settings",
  "/calendar",
  "/chat",
  "/concierge-v2",
  "/studio",
  "/snap",
  "/event",
  "/event/new",
  "/event/appointments",
  "/event/baby-showers",
  "/event/birthdays",
  "/event/football",
  "/event/general",
  "/event/gender-reveal",
  "/event/special-events",
  "/event/weddings",
  "/event/appointments/customize",
  "/event/baby-showers/customize",
  "/event/birthdays/customize",
  "/event/cheerleading/customize",
  "/event/dance-ballet/customize",
  "/event/football-season/customize",
  "/event/football/customize",
  "/event/general/customize",
  "/event/gender-reveal/customize",
  "/event/soccer/customize",
  "/event/special-events/customize",
  "/event/workshops/customize",
  "/event/weddings/customize",
  "/smart-signup-form",
] as const;

const adminRoutes = [
  "/admin",
  "/admin/users",
  "/admin/settings",
  "/admin/scans",
  "/admin/health",
  "/admin/campaigns",
  "/admin/events",
  "/admin/analytics",
  "/admin/ad-studio",
  "/admin/concierge",
  "/admin/landing-preview",
  "/admin/marketing-images",
  "/admin/marketing-assets",
  "/admin/marketing-campaigns",
  "/admin/emails",
  "/admin/emails/editor",
  "/admin/emails/magazine",
  "/admin/emails/password-reset",
  "/admin/emails/password-changed",
  "/admin/emails/event-share",
] as const;

const routeCase = (
  path: string,
  persona: MobileAuditPersona,
  options: Partial<MobileAuditCase> = {},
): MobileAuditCase => ({
  id: `${persona}-${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}`,
  path,
  persona,
  readySelector: "main, [role='main']",
  ...options,
});

const staticCases: MobileAuditCase[] = [
  ...publicRoutes.map((path) =>
    routeCase(path, "anonymous", {
      critical: ["/landing", "/weddings", "/gymnastics", "/snap", "/forgot"].includes(path),
    }),
  ),
  ...creatorRoutes.map((path) =>
    routeCase(path, "creator", {
      critical: ["/", "/settings", "/calendar", "/chat", "/studio", "/event"].includes(
        path,
      ),
    }),
  ),
  routeCase("/event/gymnastics", "gymnastics-coach", {
    critical: true,
    interactions: [
      {
        name: "Focus compact URL import",
        role: "textbox",
        accessibleName: "Public meet URL",
        expectedSelector: "input[placeholder='Paste public meet URL']",
      },
    ],
  }),
  routeCase("/event/gymnastics/customize", "gymnastics-coach", { critical: true }),
  routeCase("/event/sport-events", "multi-sport-creator", { critical: true }),
  routeCase("/event/sport-events/customize", "multi-sport-creator", { critical: true }),
  ...adminRoutes.map((path) => routeCase(path, "administrator", { critical: path === "/admin" })),
];

const dynamicCases: MobileAuditCase[] = [
  routeCase("/event/{fixture}", "anonymous", {
    id: "public-event",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_PUBLIC_EVENT_ID",
  }),
  routeCase("/e/{fixture}", "anonymous", {
    id: "public-event-slug",
    fixtureEnvironmentVariable: "MOBILE_QA_PUBLIC_EVENT_SLUG",
  }),
  routeCase("/card/{fixture}", "anonymous", {
    id: "public-card",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_PUBLIC_CARD_ID",
  }),
  routeCase("/registry/{fixture}", "anonymous", {
    id: "public-registry",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_PUBLIC_REGISTRY_ID",
  }),
  routeCase("/smart-signup-form/{fixture}", "anonymous", {
    id: "public-signup-form",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_PUBLIC_SIGNUP_FORM_ID",
  }),
  routeCase("/showcase/{fixture}", "anonymous", {
    id: "showcase-card",
    fixtureEnvironmentVariable: "MOBILE_QA_SHOWCASE_SLUG",
  }),
  routeCase("/events/{fixture}/manage", "creator", {
    id: "event-management",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_MANAGED_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/hub", "creator", {
    id: "concierge-hub",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/schedule", "creator", {
    id: "concierge-schedule",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/rsvp", "creator", {
    id: "concierge-rsvp",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/resources", "creator", {
    id: "concierge-resources",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/imports", "creator", {
    id: "concierge-imports",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/ops", "creator", {
    id: "concierge-ops",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/events/{fixture}/calendar", "creator", {
    id: "concierge-calendar",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_EVENT_ID",
  }),
  routeCase("/concierge-v2/invitations/{fixture}", "anonymous", {
    id: "concierge-invitation",
    fixtureEnvironmentVariable: "MOBILE_QA_CONCIERGE_INVITATION_TOKEN",
  }),
  routeCase("/event/weddings/{fixture}/registry", "anonymous", {
    id: "wedding-registry",
    critical: true,
    fixtureEnvironmentVariable: "MOBILE_QA_WEDDING_EVENT_ID",
  }),
  routeCase("/event/weddings/customize/{fixture}", "creator", {
    id: "wedding-customizer",
    fixtureEnvironmentVariable: "MOBILE_QA_WEDDING_EVENT_ID",
  }),
];

export const MOBILE_ROUTE_CASES: MobileAuditCase[] = [...staticCases, ...dynamicCases];

export function resolveMobileAuditPath(route: MobileAuditCase): string | null {
  if (!route.fixtureEnvironmentVariable) return route.path;
  const fixture = process.env[route.fixtureEnvironmentVariable]?.trim();
  return fixture ? route.path.replace("{fixture}", encodeURIComponent(fixture)) : null;
}
