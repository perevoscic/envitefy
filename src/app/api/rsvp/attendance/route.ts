import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parse as parseCookie } from "cookie";
import {
  getEventHistoryById,
  getUserIdByEmail,
  isEventSharedWithUser,
  updateEventHistoryData,
} from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import {
  getEventAccessCookieName,
  verifyEventAccessCookieValue,
} from "@/lib/event-access";

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
    const body = await req.json().catch(() => ({}));
    const eventId = typeof body.eventId === "string" ? body.eventId : null;
    const requestedStatus = normalizeStatus(body.status);
    const athleteId =
      typeof body.athleteId === "string" ? body.athleteId : null;
    const athleteName =
      typeof body.athleteName === "string" ? body.athleteName.trim() : null;
    const guest =
      body && typeof body.guest === "object" && body.guest
        ? {
            name:
              typeof body.guest.name === "string"
                ? body.guest.name.trim()
                : "",
            email:
              typeof body.guest.email === "string"
                ? body.guest.email.trim()
                : "",
            phone:
              typeof body.guest.phone === "string"
                ? body.guest.phone.trim()
                : "",
          }
        : null;

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
    if (!isOwner && userId) {
      try {
        isRecipient = Boolean(await isEventSharedWithUser(eventId, userId));
      } catch {
        isRecipient = false;
      }
    }

    const accessControl =
      existing.data &&
      typeof existing.data === "object" &&
      (existing.data as any).accessControl &&
      typeof (existing.data as any).accessControl === "object"
        ? ((existing.data as any).accessControl as any)
        : null;
    const requiresPasscode = Boolean(
      accessControl?.requirePasscode && accessControl?.passcodeHash
    );

    let hasGuestAccess = !requiresPasscode;
    if (requiresPasscode && accessControl?.passcodeHash) {
      const cookieHeader = req.headers.get("cookie") || "";
      const cookies = parseCookie(cookieHeader);
      const cookieName = getEventAccessCookieName(eventId);
      hasGuestAccess = verifyEventAccessCookieValue(
        cookies?.[cookieName],
        eventId,
        String(accessControl.passcodeHash)
      );
    }

    if (!isOwner && !isRecipient && !hasGuestAccess) {
      return NextResponse.json({ error: "This event is private" }, { status: 403 });
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
    const updatedByKind = isOwner || isRecipient ? "user" : "guest";
    const guestName = guest?.name || athleteName || "";

    const updatedAthletes = [...athletes];
    updatedAthletes[idx] = {
      ...updatedAthletes[idx],
      status: normalizedStatus,
      attendanceUpdatedByUserId:
        updatedByKind === "user" ? userId || null : null,
      ...(updatedByKind === "guest"
        ? {
            attendanceUpdatedByGuestName: guestName || null,
            attendanceUpdatedByGuestEmail: guest?.email || null,
            attendanceUpdatedByGuestPhone: guest?.phone || null,
          }
        : {
            attendanceUpdatedByGuestName: null,
            attendanceUpdatedByGuestEmail: null,
            attendanceUpdatedByGuestPhone: null,
          }),
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
      updatedBy: updatedByKind,
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
