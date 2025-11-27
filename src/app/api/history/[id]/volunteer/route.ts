import { NextResponse } from "next/server";
import { getEventHistoryById, updateEventHistoryData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VolunteerSignupPayload = {
  slotId: string;
  name: string;
  email?: string;
  phone?: string;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json().catch(() => null)) as
      | VolunteerSignupPayload
      | null;

    if (!body || !body.slotId || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields: slotId and name" },
        { status: 400 }
      );
    }

    const row = await getEventHistoryById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingData = (row.data ?? {}) as Record<string, any>;
    const advancedSections = existingData?.advancedSections || {};
    const volunteers = advancedSections?.volunteers || {};

    // Handle both data structures: volunteerSlots and slots
    const slots = volunteers?.volunteerSlots || volunteers?.slots || [];

    // Find the slot
    const slotIndex = slots.findIndex(
      (slot: any) => slot.id === body.slotId
    );

    if (slotIndex === -1) {
      return NextResponse.json(
        { error: "Volunteer slot not found" },
        { status: 404 }
      );
    }

    const slot = slots[slotIndex];

    // Check if already filled
    if (slot.filled || slot.name || slot.assignee) {
      return NextResponse.json(
        { error: "This volunteer slot is already filled" },
        { status: 400 }
      );
    }

    // Update the slot
    const updatedSlot = {
      ...slot,
      filled: true,
      name: body.name.trim(),
      assignee: body.name.trim(),
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
    };

    slots[slotIndex] = updatedSlot;

    // Update the data structure
    const updatedVolunteers = {
      ...volunteers,
      volunteerSlots: slots,
      slots: slots, // Support both structures
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
      slot: updatedSlot,
    });
  } catch (err: any) {
    console.error("[Volunteer Signup] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to sign up for volunteer slot" },
      { status: 500 }
    );
  }
}

