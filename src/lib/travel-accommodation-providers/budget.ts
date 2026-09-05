import type {
  TravelAccommodationAttempt,
  TravelAccommodationHotel,
} from "../travel-accommodation-discovery";
import type { HotelLink } from "../travel-accommodation-evidence";
export type TravelProviderOptions = { signal: AbortSignal; timeoutMs: number };
export type TravelProviderResult = {
  hotels: TravelAccommodationHotel[];
  fallbackLink: string | null;
  attempt: TravelAccommodationAttempt;
  links?: HotelLink[];
  content?: string;
};
export async function withinTravelBudget<T>(
  work: () => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason || new Error("Hotel discovery cancelled"));
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    return await Promise.race([work(), aborted]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
