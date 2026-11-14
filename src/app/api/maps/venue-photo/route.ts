import { findVenuePhoto } from "@/lib/venue-photo";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const venue = (params.get("venue") || "").trim();
  const address = (params.get("address") || "").trim();
  const headers = { "Cache-Control": "no-store" };
  if (!venue || !address || venue.length > 240 || address.length > 400)
    return Response.json({ error: "A venue and address are required." }, { status: 400, headers });
  try {
    const photo = await findVenuePhoto(venue, address);
    return Response.json({ photo }, { headers });
  } catch {
    return Response.json({ error: "The venue photo is temporarily unavailable." }, { status: 502, headers });
  }
}
