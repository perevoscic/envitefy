import type {
  TravelAccommodationAttempt,
  TravelAccommodationHotel,
} from "@/lib/travel-accommodation-discovery";

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

export async function extractHotelsWithBrowserUse(
  url: string
): Promise<{ hotels: TravelAccommodationHotel[]; fallbackLink: string | null; attempt: TravelAccommodationAttempt }> {
  const apiKey = safeString(process.env.BROWSER_USE_API_KEY);
  const baseUrl = safeString(process.env.BROWSER_USE_BASE_URL);
  if (!apiKey || !baseUrl || process.env.DISCOVERY_TRAVEL_BROWSER_USE_ENABLED !== "1") {
    return {
      hotels: [],
      fallbackLink: null,
      attempt: {
        provider: "browser_use",
        ok: false,
        url,
        error: "Browser Use is not enabled",
      },
    };
  }
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrl: url,
        task:
          "Find hotel and travel accommodation details for this event and return structured hotel cards with name, bookingUrl, groupRate, reservationDeadline, parking, breakfast, phone, imageUrl, and distanceFromVenue.",
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(safeString((payload as any)?.error || response.statusText) || "Browser Use request failed");
    }
    const hotels = (Array.isArray((payload as any)?.data?.hotels) ? (payload as any).data.hotels : [])
      .map((hotel: any) => ({
        name: safeString(hotel?.name),
        imageUrl: normalizeUrl(hotel?.imageUrl) || null,
        distanceFromVenue: safeString(hotel?.distanceFromVenue) || null,
        groupRate: safeString(hotel?.groupRate) || null,
        parking: safeString(hotel?.parking) || null,
        breakfast: safeString(hotel?.breakfast) || null,
        reservationDeadline: safeString(hotel?.reservationDeadline) || null,
        phone: safeString(hotel?.phone) || null,
        bookingUrl: normalizeUrl(hotel?.bookingUrl) || null,
        notes: Array.isArray(hotel?.notes) ? hotel.notes.map((item: any) => safeString(item)).filter(Boolean) : [],
        sourceType: "web" as const,
        contentOrigin: "browser_use",
        confidence: 0.82,
      }))
      .filter((hotel: TravelAccommodationHotel) => hotel.name);
    return {
      hotels,
      fallbackLink: normalizeUrl((payload as any)?.data?.fallbackLink) || null,
      attempt: {
        provider: "browser_use",
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
        provider: "browser_use",
        ok: false,
        url,
        error: error instanceof Error ? error.message : String(error || "Browser Use failed"),
      },
    };
  }
}
