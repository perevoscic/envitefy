import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getEventHistoryById,
  getUserIdByEmail,
  isEventSharedWithUser,
  updateEventHistoryData,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AttendanceStatus =
  | "going"
  | "not_going"
  | "notgoing"
  | "maybe"
  | "late"
  | "pending";

function normalizeStatus(input: any): AttendanceStatus | null {
  if (typeof input !== "string") return null;
  const val = input.toLowerCase();
  switch (val) {
    case "going":
    case "not_going":
    case "notgoing":
    case "maybe":
    case "late":
    case "pending":
      return val;
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any);
    const sessionUser: any = (session && (session as any).user) || null;
    let userId: string | null = (sessionUser?.id as string | undefined) || null;
    if (!userId && sessionUser?.email) {
      userId = (await getUserIdByEmail(String(sessionUser.email))) || null;
    }
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required to record attendance" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const eventId = typeof body.eventId === "string" ? body.eventId : null;
    const requestedStatus = normalizeStatus(body.status);
    const athleteId =
      typeof body.athleteId === "string" ? body.athleteId : null;
    const athleteName =
      typeof body.athleteName === "string" ? body.athleteName.trim() : null;

    if (!eventId || !requestedStatus) {
      return NextResponse.json(
        { error: "eventId and valid status are required" },
        { status: 400 }
      );
    }

    const existing = await getEventHistoryById(eventId);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = existing.user_id && existing.user_id === userId;
    let isRecipient = false;
    if (!isOwner) {
      try {
        isRecipient = Boolean(await isEventSharedWithUser(eventId, userId));
      } catch {
        isRecipient = false;
      }
    }
    if (!isOwner && !isRecipient) {
      return NextResponse.json(
        { error: "You do not have access to update this roster" },
        { status: 403 }
      );
    }

    const data = (existing.data as any) || {};
    const advanced = (data.advancedSections as any) || {};
    const roster = (advanced.roster as any) || {};
    const athletes = Array.isArray(roster.athletes) ? roster.athletes : [];

    if (!athletes.length) {
      return NextResponse.json(
        { error: "Roster not found for this event" },
        { status: 400 }
      );
    }

    const findIndexByName = (name: string) =>
      athletes.findIndex((a: any) =>
        String(a?.name || "")
          .trim()
          .toLowerCase()
          .includes(name.trim().toLowerCase())
      );

    let idx = athleteId
      ? athletes.findIndex((a: any) => String(a?.id || "") === athleteId)
      : -1;

    if (idx === -1 && athleteName) {
      idx = findIndexByName(athleteName);
    }

    if (idx === -1) {
      return NextResponse.json(
        { error: "Athlete not found in roster" },
        { status: 404 }
      );
    }

    const normalizedStatus =
      requestedStatus === "not_going" ? "notgoing" : requestedStatus;

    const updatedAthletes = [...athletes];
    updatedAthletes[idx] = {
      ...updatedAthletes[idx],
      status: normalizedStatus,
      attendanceUpdatedByUserId: userId,
      attendanceUpdatedAt: new Date().toISOString(),
    };

    const updatedData = {
      ...data,
      advancedSections: {
        ...advanced,
        roster: {
          ...roster,
          athletes: updatedAthletes,
        },
      },
    };

    const updatedRow =
      (await updateEventHistoryData(eventId, updatedData)) || existing;

    if (existing.user_id) {
      invalidateUserHistory(existing.user_id);
    }

    return NextResponse.json({
      ok: true,
      athlete: updatedRow.data?.advancedSections?.roster?.athletes?.[idx] || null,
      updatedEvent: updatedRow,
    });
  } catch (err: any) {
    try {
      console.error("[rsvp/attendance] error", err);
    } catch {}
    return NextResponse.json(
      { error: String(err?.message || err || "Unknown error") },
      { status: 500 }
    );
  }
}
