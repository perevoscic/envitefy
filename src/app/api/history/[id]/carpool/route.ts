import { NextResponse } from "next/server";
import { getEventHistoryById, updateEventHistoryData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CarpoolOfferPayload = {
  action?: "add" | "signup";
  driverName?: string;
  phone?: string;
  email?: string;
  seatsAvailable?: number;
  departureLocation?: string;
  departureTime?: string;
  direction?: string;
  // Signup fields
  carpoolId?: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  seatsRequested?: number;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json().catch(() => null)) as
      | CarpoolOfferPayload
      | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const action = body.action || "add";

    const row = await getEventHistoryById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingData = (row.data ?? {}) as Record<string, any>;
    const advancedSections = existingData?.advancedSections || {};
    const volunteers = advancedSections?.volunteers || {};

    // Handle both data structures: carpoolOffers and carpools
    const carpools = volunteers?.carpoolOffers || volunteers?.carpools || [];

    // Handle signup
    if (action === "signup") {
      if (!body.carpoolId || !body.passengerName || !body.seatsRequested) {
        return NextResponse.json(
          { error: "Missing required fields: carpoolId, passengerName, and seatsRequested" },
          { status: 400 }
        );
      }

      // Find the carpool
      const carpoolIndex = carpools.findIndex(
        (cp: any) => cp.id === body.carpoolId
      );

      if (carpoolIndex === -1) {
        return NextResponse.json(
          { error: "Carpool not found" },
          { status: 404 }
        );
      }

      const carpool = carpools[carpoolIndex];
      const seatsAvailable = carpool.seatsAvailable || carpool.seats || 0;
      const seatsTaken = carpool.seatsTaken || 0;
      const seatsRequested = Number(body.seatsRequested) || 1;

      // Check if enough seats available
      if (seatsTaken + seatsRequested > seatsAvailable) {
        return NextResponse.json(
          { error: `Not enough seats available. Only ${seatsAvailable - seatsTaken} seat(s) remaining.` },
          { status: 400 }
        );
      }

      // Initialize signups array if it doesn't exist
      const signups = carpool.signups || [];

      // Add signup
      const newSignup = {
        id: `signup${Date.now()}`,
        passengerName: body.passengerName.trim(),
        passengerPhone: body.passengerPhone?.trim() || undefined,
        passengerEmail: body.passengerEmail?.trim() || undefined,
        seatsRequested,
        signedUpAt: new Date().toISOString(),
      };

      signups.push(newSignup);

      // Update carpool
      const updatedCarpool = {
        ...carpool,
        signups,
        seatsTaken: seatsTaken + seatsRequested,
      };

      carpools[carpoolIndex] = updatedCarpool;

      // Update the data structure
      const updatedVolunteers = {
        ...volunteers,
        carpoolOffers: carpools,
        carpools: carpools, // Support both structures
      };

      const updatedAdvancedSections = {
        ...advancedSections,
        volunteers: updatedVolunteers,
      };

      const updatedData = {
        ...existingData,
        advancedSections: updatedAdvancedSections,
      };

      // Save to database
      await updateEventHistoryData(id, updatedData);

      return NextResponse.json({
        ok: true,
        signup: newSignup,
        carpool: updatedCarpool,
      });
    }

    // Handle adding new carpool offer
    if (!body.driverName || !body.seatsAvailable) {
      return NextResponse.json(
        { error: "Missing required fields: driverName and seatsAvailable" },
        { status: 400 }
      );
    }

    // Generate a new ID for the carpool offer
    const newId = `cp${Date.now()}`;

    // Create new carpool offer
    const newCarpool = {
      id: newId,
      driverName: body.driverName.trim(),
      phone: body.phone?.trim() || undefined,
      email: body.email?.trim() || undefined,
      seatsAvailable: Number(body.seatsAvailable) || 1,
      seatsTaken: 0,
      signups: [],
      departureLocation: body.departureLocation?.trim() || undefined,
      departureTime: body.departureTime?.trim() || undefined,
      direction: body.direction?.trim() || undefined,
    };

    // Add to carpools array
    const updatedCarpools = [...carpools, newCarpool];

    // Update the data structure
    const updatedVolunteers = {
      ...volunteers,
      carpoolOffers: updatedCarpools,
      carpools: updatedCarpools, // Support both structures
    };

    const updatedAdvancedSections = {
      ...advancedSections,
      volunteers: updatedVolunteers,
    };

    const updatedData = {
      ...existingData,
      advancedSections: updatedAdvancedSections,
    };

    // Save to database
    await updateEventHistoryData(id, updatedData);

    return NextResponse.json({
      ok: true,
      carpool: newCarpool,
    });
  } catch (err: any) {
    console.error("[Carpool Offer] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to add carpool offer" },
      { status: 500 }
    );
  }
}

