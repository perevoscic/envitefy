import type {
  TravelAccommodationAttempt,
  TravelAccommodationHotel,
} from "@/lib/travel-accommodation-discovery";
import { validateModelHotels } from "./astra";
import type { TravelProviderOptions } from "./budget";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
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
  url: string,
  options: TravelProviderOptions,
): Promise<{
  hotels: TravelAccommodationHotel[];
  fallbackLink: string | null;
  attempt: TravelAccommodationAttempt;
}> {
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
      signal: options.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startUrl: url,
        task: "Read only this event's linked accommodation pages. Return data.content containing exact page text with markdown links and data.hotels, each with sourceBlock and fields. Every field (name, address, bookingUrl, bookingInstructions, groupRate, reservationDeadline, parking, breakfast, phone, imageUrl, distanceFromVenue) is null or {value, quote}. Quotes must occur verbatim inside sourceBlock and values inside quotes. Preserve full booking URLs. No guesses or attractions.",
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        safeString((payload as any)?.error || response.statusText) || "Browser Use request failed",
      );
    }
    return {
      hotels: validateModelHotels(
        (payload as any)?.data,
        safeString((payload as any)?.data?.content),
        { sourceUrl: url },
      ),
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
