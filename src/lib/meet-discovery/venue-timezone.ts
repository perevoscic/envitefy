import { isStreetAddressQuery, searchBuilderAddress } from "../livecard-address-server";
import { validGymnasticsTimeZone } from "../gymnastics-event-dates";

/** Missing source zones require a unique provider address and geographic boundaries, never a host default. */
export async function resolveDiscoveryVenueTimezone(timezone: unknown, address: unknown): Promise<string | null> {
  const supplied = validGymnasticsTimeZone(timezone);
  if (supplied) return supplied;
  const query = typeof address === "string" ? address.trim() : "";
  if (!isStreetAddressQuery(query)) return null;
  try {
    const result = await searchBuilderAddress({ query });
    return result?.location?.resolution === "verified"
      ? validGymnasticsTimeZone(result.location.timezone) || null
      : null;
  } catch {
    // An outage or ambiguous address keeps the timezone visibly missing for correction.
    return null;
  }
}
