import type {
  TravelAccommodationAttempt,
  TravelAccommodationHotel,
} from "@/lib/travel-accommodation-discovery";

type FirecrawlHotelSchema = {
  hotels?: Array<{
    name?: string | null;
    imageUrl?: string | null;
    distanceFromVenue?: string | null;
    groupRate?: string | null;
    parking?: string | null;
    breakfast?: string | null;
    reservationDeadline?: string | null;
    phone?: string | null;
    bookingUrl?: string | null;
    notes?: string[] | null;
  }>;
  fallbackLink?: string | null;
};

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
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getFirecrawlConfig() {
  const apiKey = safeString(process.env.FIRECRAWL_API_KEY);
  const baseUrl = safeString(process.env.FIRECRAWL_BASE_URL) || "https://api.firecrawl.dev";
  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
  };
}

function hotelJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      hotels: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            imageUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
            distanceFromVenue: { anyOf: [{ type: "string" }, { type: "null" }] },
            groupRate: { anyOf: [{ type: "string" }, { type: "null" }] },
            parking: { anyOf: [{ type: "string" }, { type: "null" }] },
            breakfast: { anyOf: [{ type: "string" }, { type: "null" }] },
            reservationDeadline: { anyOf: [{ type: "string" }, { type: "null" }] },
            phone: { anyOf: [{ type: "string" }, { type: "null" }] },
            bookingUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
            notes: {
              anyOf: [
                { type: "array", items: { type: "string" } },
                { type: "null" },
              ],
            },
          },
          required: [
            "name",
            "imageUrl",
            "distanceFromVenue",
            "groupRate",
            "parking",
            "breakfast",
            "reservationDeadline",
            "phone",
            "bookingUrl",
            "notes",
          ],
        },
      },
      fallbackLink: { anyOf: [{ type: "string" }, { type: "null" }] },
    },
    required: ["hotels", "fallbackLink"],
  };
}

function mapHotels(json: FirecrawlHotelSchema): TravelAccommodationHotel[] {
  return (Array.isArray(json.hotels) ? json.hotels : [])
    .map((hotel) => ({
      name: safeString(hotel?.name),
      imageUrl: normalizeUrl(hotel?.imageUrl) || null,
      distanceFromVenue: safeString(hotel?.distanceFromVenue) || null,
      groupRate: safeString(hotel?.groupRate) || null,
      parking: safeString(hotel?.parking) || null,
      breakfast: safeString(hotel?.breakfast) || null,
      reservationDeadline: safeString(hotel?.reservationDeadline) || null,
      phone: safeString(hotel?.phone) || null,
      bookingUrl: normalizeUrl(hotel?.bookingUrl) || null,
      notes: Array.isArray(hotel?.notes) ? hotel.notes.map((item) => safeString(item)).filter(Boolean) : [],
      sourceType: "web" as const,
      contentOrigin: "firecrawl_scrape_json",
      confidence: 0.9,
    }))
    .filter((hotel) => hotel.name);
}

async function firecrawlRequest(path: string, body: Record<string, unknown>) {
  const config = getFirecrawlConfig();
  if (!config.apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      safeString((payload as any)?.error || (payload as any)?.message || response.statusText) ||
        `Firecrawl request failed: ${response.status}`
    );
  }
  return payload as any;
}

export async function extractHotelsWithFirecrawlScrape(
  url: string
): Promise<{ hotels: TravelAccommodationHotel[]; fallbackLink: string | null; attempt: TravelAccommodationAttempt }> {
  try {
    const payload = await firecrawlRequest("/v1/scrape", {
      url,
      formats: [
        {
          type: "json",
          schema: hotelJsonSchema(),
          prompt:
            "Extract hotel and travel accommodation cards from this page. Return every visible hotel card with booking URL, rate, deadline, parking, breakfast, phone, and distance when present. If there are no hotel cards, return an empty hotels array and set fallbackLink to the primary travel/hotel link on the page when one exists.",
        },
      ],
      onlyMainContent: false,
      timeout: 120000,
    });
    const json = ((payload as any)?.data?.json || {}) as FirecrawlHotelSchema;
    return {
      hotels: mapHotels(json),
      fallbackLink: normalizeUrl(json.fallbackLink) || null,
      attempt: {
        provider: "firecrawl_scrape_json",
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
        provider: "firecrawl_scrape_json",
        ok: false,
        url,
        error: error instanceof Error ? error.message : String(error || "Firecrawl scrape failed"),
      },
    };
  }
}

export async function extractHotelsWithFirecrawlAgent(
  url: string
): Promise<{ hotels: TravelAccommodationHotel[]; fallbackLink: string | null; attempt: TravelAccommodationAttempt }> {
  try {
    const payload = await firecrawlRequest("/v2/agent", {
      prompt:
        "Find the official hotel and travel accommodation information for this event page. Extract hotel cards with name, booking URL, group rate, reservation deadline, parking, breakfast, phone, image URL, and distance from venue. Return an empty hotels array if only a fallback travel link exists.",
      urls: [url],
      schema: hotelJsonSchema(),
      model: "spark-1-mini",
      maxCredits: 100,
    });
    const json = ((payload as any)?.data || {}) as FirecrawlHotelSchema;
    return {
      hotels: mapHotels(json),
      fallbackLink: normalizeUrl(json.fallbackLink) || null,
      attempt: {
        provider: "firecrawl_agent",
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
        provider: "firecrawl_agent",
        ok: false,
        url,
        error: error instanceof Error ? error.message : String(error || "Firecrawl agent failed"),
      },
    };
  }
}
