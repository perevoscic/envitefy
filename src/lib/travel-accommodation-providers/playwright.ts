import type {
  TravelAccommodationAttempt,
  TravelAccommodationHotel,
} from "@/lib/travel-accommodation-discovery";
import { mergePdfAndWebHotels } from "@/lib/travel-accommodation-discovery";

function safeString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : value == null
    ? ""
    : String(value).trim();
}

function normalizeUrl(value: unknown): string {
  const raw = safeString(value);
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    return "";
  }
}

const CLICK_TARGETS = [
  "Host Hotels",
  "Host Hotel",
  "Hotel Information",
  "Hotel & Travel",
  "Hotels & Travel",
  "Travel",
  "Lodging",
  "Reservations",
  "Book Here",
  "Book Now",
];

const BOOKING_URL_HINT = /\b(book|reserve|reservation|passkey|rooms?|lodging|hotel)\b/i;
const DISTANCE_PATTERN = /\b\d+(?:\.\d+)?\s*(?:mile|miles|mi|minutes?)\b/i;
const RATE_PATTERN = /\$\s*\d+(?:\.\d{2})?(?:\s*(?:\+\s*tax|per night|nightly))?/i;
const PHONE_PATTERN = /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;
const DEADLINE_PATTERN =
  /\b(?:book|reserve|reservations?)\s+by\b[^.\n]*|\b(?:reservation|booking)\s+deadline\b[^.\n]*/i;

function normalizeWhitespace(value: unknown): string {
  return safeString(value).replace(/\s+/g, " ").trim();
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = safeString(getKey(item)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function pickFirstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? safeString(match[0]) : null;
}

function extractLabeledValue(text: string, label: RegExp): string | null {
  const lines = text
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  for (const line of lines) {
    if (!label.test(line)) continue;
    const cleaned = line.replace(label, "").replace(/^[:\-\s]+/, "").trim();
    if (cleaned) return cleaned;
  }
  return null;
}

function buildHotelFromCard(card: {
  name: string;
  bookingUrl: string | null;
  imageUrl: string | null;
  text: string;
}): TravelAccommodationHotel | null {
  const name = normalizeWhitespace(card.name);
  if (!name) return null;
  const text = normalizeWhitespace(card.text);
  const distanceFromVenue = pickFirstMatch(text, DISTANCE_PATTERN);
  const groupRate = pickFirstMatch(text, RATE_PATTERN) || extractLabeledValue(text, /^group rate\b/i);
  const parking = extractLabeledValue(text, /^parking\b/i);
  const breakfast = extractLabeledValue(text, /^breakfast\b/i) || extractLabeledValue(text, /^complimentary\b/i);
  const reservationDeadline =
    extractLabeledValue(text, /^reservation deadline\b/i) || pickFirstMatch(text, DEADLINE_PATTERN);
  const phone = extractLabeledValue(text, /^(?:hotel phone|phone reservations?)\b/i) || pickFirstMatch(text, PHONE_PATTERN);
  const notes = uniqueBy(
    text
      .split(/[\n•]+/)
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean)
      .filter((line) => line.length >= 12)
      .slice(0, 3),
    (line) => line.toLowerCase()
  );

  const supportFields = [distanceFromVenue, groupRate, parking, breakfast, reservationDeadline, phone].filter(Boolean)
    .length;
  const confidence = Math.min(0.92, 0.78 + (card.bookingUrl ? 0.06 : 0) + supportFields * 0.02);

  return {
    name,
    imageUrl: normalizeUrl(card.imageUrl) || null,
    distanceFromVenue: distanceFromVenue || null,
    groupRate: groupRate || null,
    parking: parking || null,
    breakfast: breakfast || null,
    reservationDeadline: reservationDeadline || null,
    phone: phone || null,
    bookingUrl: normalizeUrl(card.bookingUrl) || null,
    notes,
    sourceType: "web" as const,
    contentOrigin: "playwright_structured_cards",
    confidence,
  };
}

async function scrollToLoad(page: any, passes = 3) {
  for (let i = 0; i < passes; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function clickLikelyTravelTabs(page: any) {
  for (const label of CLICK_TARGETS) {
    const regex = new RegExp(label.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&"), "i");
    const locator = page
      .locator("a,button,[role='button'],[role='tab'],summary")
      .filter({ hasText: regex })
      .first();
    try {
      const count = await locator.count();
      if (!count) continue;
      await locator.click({ timeout: 1500 });
      await page.waitForLoadState("domcontentloaded", { timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(350);
      await scrollToLoad(page, 2);
    } catch {
      // Best-effort; keep trying other targets.
    }
  }
}

async function extractStructuredCards(page: any) {
  const result = await page.evaluate(() => {
    const normalize = (value: any) =>
      String(value == null ? "" : value)
        .replace(/\s+/g, " ")
        .trim();
    const isGenericName = (value: string) =>
      /\b(click here|book now|book here|reserve|reservations?|learn more|details)\b/i.test(value);
    const bookingHint = /\b(book|reserve|reservation|passkey|rooms?|lodging|hotel)\b/i;
    const avoidHref = /\b(mailto:|tel:|facebook|instagram|twitter|tiktok|youtube)\b/i;

    const anchors = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ a, href: (a as HTMLAnchorElement).href, text: normalize(a.textContent || "") }))
      .filter((item) => item.href && /^https?:\/\//i.test(item.href))
      .filter((item) => !avoidHref.test(item.href))
      .filter((item) => bookingHint.test(item.href) || bookingHint.test(item.text));

    const cards: Array<{ name: string; bookingUrl: string | null; imageUrl: string | null; text: string }> = [];
    const pickContainer = (el: Element) => {
      let node: Element | null = el;
      for (let depth = 0; depth < 6 && node; depth++) {
        const text = normalize((node as HTMLElement).innerText || "");
        if (text.length >= 40 && text.length <= 1500) {
          const tag = node.tagName.toLowerCase();
          if (["article", "li", "section", "div", "td"].includes(tag)) return node;
        }
        node = node.parentElement;
      }
      return el.closest("article,li,section,div,td") || el;
    };
    const pickName = (container: Element, fallback: string) => {
      const heading =
        Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).find((h) => normalize(h.textContent || "").length >= 3) ||
        container.querySelector("strong,b");
      const fromHeading = heading ? normalize(heading.textContent || "") : "";
      if (fromHeading && !isGenericName(fromHeading)) return fromHeading;
      if (fallback && !isGenericName(fallback)) return fallback;
      const text = normalize((container as HTMLElement).innerText || "");
      const firstLine = text.split(/\n/)[0] || "";
      return !isGenericName(firstLine) ? firstLine : "";
    };
    const pickImage = (container: Element) => {
      const img = container.querySelector("img");
      const src = img ? (img.getAttribute("src") || "") : "";
      if (!src) return null;
      try {
        return new URL(src, window.location.href).toString();
      } catch {
        return null;
      }
    };

    for (const item of anchors) {
      const container = pickContainer(item.a);
      const text = normalize((container as HTMLElement).innerText || "");
      const name = pickName(container, item.text);
      if (!name) continue;
      const imageUrl = pickImage(container);
      cards.push({
        name,
        bookingUrl: item.href || null,
        imageUrl,
        text,
      });
    }

    const unique = new Map<string, { name: string; bookingUrl: string | null; imageUrl: string | null; text: string }>();
    for (const card of cards) {
      const key = `${normalize(card.name).toLowerCase()}|${normalize(card.bookingUrl || "").toLowerCase()}`;
      if (!key || unique.has(key)) continue;
      unique.set(key, card);
    }

    const fallbackLink = (() => {
      const travelish = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ href: (a as HTMLAnchorElement).href, text: normalize(a.textContent || "") }))
        .filter((item) => item.href && /^https?:\/\//i.test(item.href))
        .find((item) => /\b(host\s+hotels?|hotel\s+information|hotels?\s*&\s*travel|travel|lodging|reservations?)\b/i.test(item.text));
      return travelish?.href || null;
    })();

    return { cards: [...unique.values()], fallbackLink };
  });

  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const fallbackLink = safeString(result?.fallbackLink) || null;
  return { cards, fallbackLink };
}

export async function extractHotelsWithPlaywright(
  url: string
): Promise<{ hotels: TravelAccommodationHotel[]; fallbackLink: string | null; attempt: TravelAccommodationAttempt }> {
  let browser: any = null;
  let context: any = null;
  try {
    const { chromium } = (await import("playwright")) as {
      chromium: { launch: (options: any) => Promise<any> };
    };
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    await scrollToLoad(page, 2);
    await clickLikelyTravelTabs(page);
    await scrollToLoad(page, 2);

    const extracted = await extractStructuredCards(page);
    await context.close().catch(() => {});
    context = null;
    await browser.close().catch(() => {});
    browser = null;

    const pageHotels = extracted.cards
      .map((card: any) =>
        buildHotelFromCard({
          name: safeString(card?.name),
          bookingUrl: normalizeUrl(card?.bookingUrl) || null,
          imageUrl: normalizeUrl(card?.imageUrl) || null,
          text: safeString(card?.text),
        })
      )
      .filter((hotel): hotel is TravelAccommodationHotel => Boolean(hotel));

    const fallbackFromCards = normalizeUrl(extracted.fallbackLink) || null;
    const fallbackFromHotels = pageHotels.find((hotel) => hotel.bookingUrl && BOOKING_URL_HINT.test(hotel.bookingUrl))?.bookingUrl || null;
    const candidateFallback = fallbackFromCards || fallbackFromHotels || normalizeUrl(url) || null;
    return {
      hotels: mergePdfAndWebHotels([], pageHotels),
      fallbackLink: normalizeUrl(candidateFallback) || null,
      attempt: {
        provider: "playwright",
        ok: true,
        url,
        error: null,
      },
    };
  } catch (error) {
    return {
      hotels: [],
      fallbackLink: null,
      attempt: {
        provider: "playwright",
        ok: false,
        url,
        error: error instanceof Error ? error.message : String(error || "Playwright travel extraction failed"),
      },
    };
  } finally {
    await context?.close().catch(() => {});
    await browser?.close().catch(() => {});
  }
}
