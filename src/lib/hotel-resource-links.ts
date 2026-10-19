/** Link-specific evidence for accommodation actions; page headings alone are insufficient. */
type HotelResourceLink = {
  url?: unknown;
  label?: unknown;
  contextText?: unknown;
};

const HOTEL_TEXT = /\b(?:hotels?|lodging|accommodations?|housing|travel|room\s+blocks?|book\s+(?:your\s+)?stay)\b/i;
const BOOKING_ACTION = /\b(?:book|reserve|reservations?|booking)\b/i;
const HOTEL_PROVIDERS = [
  "marriott.com", "hilton.com", "hiltonhonors.com", "hyatt.com", "ihg.com",
  "choicehotels.com", "wyndhamhotels.com", "bestwestern.com", "passkey.com",
  "groupbook.io", "eventpipe.com", "hotelplanner.com", "booking.com", "reservations.com",
];

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hotelDestination(value: unknown): { hotel: boolean; unrelated: boolean } | null {
  try {
    const url = new URL(text(value));
    if (!/^https?:$/.test(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (HOTEL_PROVIDERS.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return { hotel: true, unrelated: false };
    }
    // Query parameters and fragments can describe another destination or a campaign.
    // They provide no evidence about what this link actually opens.
    const path = decodeURIComponent(url.pathname).replace(/[-_./]+/g, " ");
    const hostWords = host.replace(/[.-]+/g, " ");
    const hotel = HOTEL_TEXT.test(`${hostWords} ${path}`) ||
      /\b(?:book|reserve|reservations?|booking|rooms?|passkey)\b/i.test(path);
    const unrelatedHost = /awards?|troph(?:y|ies)|leotards?|apparel|photograph|scorecat|meetscoresonline/i.test(host);
    const unrelatedPath = /\b(?:awards?|troph(?:y|ies)|leotards?|apparel|photos?|results?|scores?|tickets?)\b/i.test(path);
    return { hotel, unrelated: unrelatedHost || (unrelatedPath && !hotel) };
  } catch {
    return null;
  }
}

export function isHotelResourceLink(link: HotelResourceLink): boolean {
  const destination = hotelDestination(link.url);
  if (!destination || destination.unrelated) return false;
  if (destination.hotel) return true;
  const label = text(link.label);
  if (HOTEL_TEXT.test(label)) return true;
  // A generic reservation action can use its own nearby hotel block, such as
  // coordinate-derived PDF text. Do not promote an unlabeled sponsor link merely
  // because its page or section mentions hotels.
  const context = text(link.contextText);
  return BOOKING_ACTION.test(label) && context.length <= 320 && HOTEL_TEXT.test(context);
}

/** Validate persisted fallbacks too, including resources mislabeled by older imports. */
export function selectHotelResourceFallback(
  urls: unknown[],
  links: HotelResourceLink[] = [],
): string | null {
  for (const value of urls) {
    const url = text(value);
    if (!url) continue;
    const matching = links.find((link) => {
      try { return new URL(text(link.url)).toString() === new URL(url).toString(); }
      catch { return false; }
    });
    if (isHotelResourceLink(matching || { url })) return new URL(url).toString();
  }
  return null;
}
