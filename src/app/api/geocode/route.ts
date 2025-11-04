import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocoding";

/**
 * GET /api/geocode?q=address
 * 
 * Geocode an address or location query and return coordinates.
 * Uses OpenStreetMap Nominatim API.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Missing or empty query parameter 'q'" },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeAddress(query.trim());
    
    if (!result) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      displayName: result.displayName,
      latitude: result.latitude,
      longitude: result.longitude,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("[geocode] Error:", error);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 }
    );
  }
}

