export type VenuePhoto = {
  url: string;
  mapsUrl: string;
  authors: Array<{ name: string; url: string }>;
};
const normalize = (value: string) => value.toLowerCase().replace(/\b(?:boulevard|street|avenue|road|drive)\b/g,
  word => ({ boulevard: "blvd", street: "st", avenue: "ave", road: "rd", drive: "dr" })[word]!)
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const https = (value: unknown) => typeof value === "string" && /^https:\/\//.test(value) ? value : "";

/** Resolve fresh Google photo references; never persist photo names or expose API keys. */
export async function findVenuePhoto(venue: string, address: string): Promise<VenuePhoto | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const signal = AbortSignal.timeout(8000);
  const search = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST", cache: "no-store", signal,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.photos" },
    body: JSON.stringify({ textQuery: `${venue}, ${address}`, maxResultCount: 3 }),
  });
  if (!search.ok) throw new Error(`Venue photo lookup failed (${search.status})`);
  const result = await search.json();
  const words = normalize(venue).split(" ").filter(word => word.length > 2);
  const addressWords = normalize(address).split(" ").filter(Boolean);
  const place = (Array.isArray(result.places) ? result.places : []).find((item: any) =>
    words.length && words.every(word => normalize(item.displayName?.text || "").includes(word)) &&
    addressWords.every(word => normalize(item.formattedAddress || "").split(" ").includes(word)));
  const photo = place?.photos?.[0];
  if (!photo || !/^places\/[^/]+\/photos\/[^/]+$/.test(photo.name || "")) return null;
  const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&skipHttpRedirect=true`, {
    headers: { "X-Goog-Api-Key": key }, cache: "no-store", signal,
  });
  if (!media.ok) throw new Error(`Venue photo retrieval failed (${media.status})`);
  const image = await media.json();
  const url = https(image.photoUri);
  if (!url) return null;
  return { url, mapsUrl: https(photo.googleMapsUri) || https(place.googleMapsUri),
    authors: (Array.isArray(photo.authorAttributions) ? photo.authorAttributions : []).map((author: any) => ({
      name: String(author.displayName || "Photo contributor"), url: https(author.uri),
    })) };
}
