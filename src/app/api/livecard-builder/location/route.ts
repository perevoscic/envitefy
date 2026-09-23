import { NextResponse } from "next/server";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { resolveBuilderPlace, searchBuilderLocation } from "@/lib/livecard-location-server";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  const denied = await builderApiAccess("location");
  if (denied) return denied;
  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object")
    return NextResponse.json({ error: "Enter a venue or address." }, { status: 400 });
  const body = raw as Record<string, unknown>;
  const value = (key: string) =>
    typeof body[key] === "string" ? body[key].slice(0, 500).trim() : "";
  try {
    if (value("placeId")) {
      const location = await resolveBuilderPlace(
        value("placeId"),
        value("date"),
        value("id") || "primary",
      );
      if (location.timezone) return NextResponse.json({ location });
      return NextResponse.json(
        await searchBuilderLocation({
          query: [location.venue, location.address].filter(Boolean).join(", "),
          venue: location.venue,
          address: location.address,
          city: location.city,
          date: value("date"),
          id: value("id") || "primary",
          timezone: value("timezone") || "UTC",
        }),
      );
    }
    if (!value("query"))
      return NextResponse.json(
        { error: "Enter the venue name to find your location." },
        { status: 400 },
      );
    return NextResponse.json(
      await searchBuilderLocation({
        query: value("query"),
        venue: value("venue"),
        city: value("city"),
        address: value("address"),
        date: value("date"),
        id: value("id") || "primary",
        timezone: value("timezone") || "UTC",
      }),
    );
  } catch {
    return NextResponse.json(
      {
        error: "We couldn’t finish preparing your location. Please try again.",
      },
      { status: 503 },
    );
  }
}
