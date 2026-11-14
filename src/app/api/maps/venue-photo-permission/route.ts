import { findPermittedVenuePhoto } from "@/lib/venue-photo-permission-server";
import { readVenuePhotoReference } from "@/lib/venue-photo-source";

/** Reads caller-supplied public source pages only; no private events or paid providers. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const body = await request.json().catch(() => null);
  const venue = typeof body?.venue === "string" ? body.venue.trim() : "";
  const reference = readVenuePhotoReference(body?.reference);
  if (!venue || venue.length > 240 || !reference) return Response.json({ photo: null }, { status: 400, headers });
  return Response.json({ photo: await findPermittedVenuePhoto(venue, reference) }, { headers });
}
