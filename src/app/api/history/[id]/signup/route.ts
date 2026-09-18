import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { absoluteUrl } from "@/lib/absolute-url";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import {
  getEventHistoryById,
  isEventSharedWithUser,
  listShareRecipientUserIdsForEvent,
  mutateSignupEvent,
} from "@/lib/db";
import { sendSignupConfirmationEmail } from "@/lib/email";
import { isEventDraft } from "@/lib/event-draft-access";
import { guardDraftRequest } from "@/lib/event-draft-access-server";
import { invalidateUserHistory } from "@/lib/history-cache";
import { allowsPublicSignup } from "@/lib/signup-access";
import {
  createSignupGuestToken,
  readSignupGuestToken,
  signupGuestCookieName,
  signupGuestId,
} from "@/lib/signup-guest-cookie";
import { ownSignupResponseId, withoutSignupGuestId } from "@/lib/signup-identity";
import {
  mutateSignupReservation,
  readStoredSignup,
  SignupMutationError,
} from "@/lib/signup-mutations";
import { projectSignupForm } from "@/lib/signup-projection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const denied = await guardDraftRequest(id, false);
    if (denied) return denied;
    const row = await getEventHistoryById(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    const isOwner = Boolean(userId && userId === row.user_id);
    const shared = userId ? await isEventSharedWithUser(id, userId) : false;
    if (!isOwner && !shared && !allowsPublicSignup(row.data))
      return NextResponse.json(
        { error: "Access is limited to invited contacts." },
        { status: 403 },
      );
    const form = readStoredSignup(row.data?.signupForm);
    const identity = { userId, guestId: signupGuestId(readSignupGuestToken(req, id)) };
    return NextResponse.json(
      {
        signupForm: projectSignupForm(form, { isOwner, ...identity }),
        myResponseId: ownSignupResponseId(form, identity),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return signupError(error);
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin)
      return NextResponse.json({ error: "Open the signup page to continue." }, { status: 403 });
    const denied = await guardDraftRequest(id, false);
    if (denied) return denied;
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    const email = session?.user?.email;
    const body: unknown = await req.json().catch(() => null);
    const currentGuestToken = readSignupGuestToken(req, id);
    const guestToken = currentGuestToken || (!userId ? createSignupGuestToken() : null);
    const identity = { userId, guestId: signupGuestId(guestToken) };
    const shared = userId ? await isEventSharedWithUser(id, userId) : false;
    const saved = await mutateSignupEvent(id, (row) => {
      if (isEventDraft(row.data)) throw new SignupMutationError("Not found", 404);
      const isOwner = Boolean(userId && row.user_id === userId);
      if (!isOwner && !shared && !allowsPublicSignup(row.data))
        throw new SignupMutationError(
          "Access is limited to invited contacts. Ask the organizer to share this event with your account.",
          403,
        );
      const form = readStoredSignup(row.data?.signupForm);
      const change = mutateSignupReservation(form, body, {
        ...identity,
        email,
        name: session?.user?.name,
        isOwner,
      });
      return { data: { ...row.data, signupForm: change.form }, result: { ...change, isOwner } };
    });
    if (!saved) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const viewers = new Set([
      saved.row.user_id,
      userId,
      ...(await listShareRecipientUserIdsForEvent(id).catch(() => [])),
    ]);
    for (const viewer of viewers)
      if (viewer) {
        invalidateUserHistory(viewer);
        invalidateUserDashboard(viewer);
      }
    const { form, response, isOwner } = saved.result;
    // Await the attempt so the runtime cannot discard it after the response. A mail failure
    // never turns a committed reservation into a failed request that guests would retry.
    if (response?.email) {
      try {
        await sendSignupConfirmationEmail({
          toEmail: response.email,
          userName: response.name,
          eventTitle: form.title || saved.row.title || "Signup",
          eventUrl: await absoluteUrl(`/smart-signup-form/${id}`),
          form,
          response,
        });
      } catch (error) {
        console.error("[signup] Confirmation delivery failed", {
          eventId: id,
          error: error instanceof Error ? error.message : "Mail error",
        });
      }
    }
    const result = NextResponse.json(
      {
        ok: true,
        status: response?.status,
        signupForm: projectSignupForm(form, { isOwner, ...identity }),
        response: response ? withoutSignupGuestId(response) : undefined,
        myResponseId: ownSignupResponseId(form, identity),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    if (guestToken && !currentGuestToken) {
      result.cookies.set(signupGuestCookieName(id), guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return result;
  } catch (error) {
    return signupError(error);
  }
}

function signupError(error: unknown) {
  if (error instanceof SignupMutationError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("[signup] Request failed", error);
  return NextResponse.json(
    { error: "Unable to save your signup right now. Please try again." },
    { status: 500 },
  );
}
