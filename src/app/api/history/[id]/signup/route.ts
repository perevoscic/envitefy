import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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
import {
  ownSignupResponseId,
  type SignupIdentity,
  withoutSignupGuestId,
} from "@/lib/signup-identity";
import {
  createSignupManagementToken,
  managedSignupResponseId,
  readSignupManagementToken,
  SIGNUP_MANAGEMENT_MAX_AGE,
  signupEmailEventUrl,
  signupManagementCookieName,
  signupManagementUrl,
} from "@/lib/signup-management";
import {
  mutateSignupReservation,
  readStoredSignup,
  SignupMutationError,
} from "@/lib/signup-mutations";
import { projectSignupForm } from "@/lib/signup-projection";
import { hasSameSignupOrigin } from "@/lib/signup-request-origin";
import type { SignupConfirmationEmailStatus } from "@/types/signup";

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
    const identity = {
      userId,
      guestId: signupGuestId(readSignupGuestToken(req, id)),
      managedResponseId: managedSignupResponseId(readSignupManagementToken(req, id), id, form),
    };
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
    if (origin && !hasSameSignupOrigin(req))
      return NextResponse.json({ error: "Open the signup page to continue." }, { status: 403 });
    const denied = await guardDraftRequest(id, false);
    if (denied) return denied;
    const session = await getServerSession(authOptions);
    const userId = await resolveSessionUserId(session);
    const email = session?.user?.email;
    const body: unknown = await req.json().catch(() => null);
    const currentGuestToken = readSignupGuestToken(req, id);
    const guestToken = currentGuestToken || (!userId ? createSignupGuestToken() : null);
    const identity: SignupIdentity = { userId, guestId: signupGuestId(guestToken) };
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
      identity.managedResponseId = managedSignupResponseId(
        readSignupManagementToken(req, id),
        id,
        form,
      );
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
    let confirmationEmail: SignupConfirmationEmailStatus = "not_requested";
    // Await the attempt so the runtime cannot discard it after the response. A mail failure
    // never turns a committed reservation into a failed request that guests would retry.
    if (response?.email) {
      try {
        await sendSignupConfirmationEmail({
          toEmail: response.email,
          userName: response.name,
          eventTitle: form.title || saved.row.title || "Signup",
          eventUrl: signupEmailEventUrl(saved.row.public_slug || id),
          manageUrl: allowsPublicSignup(saved.row.data)
            ? signupManagementUrl(id, response)
            : undefined,
          form,
          response,
        });
        confirmationEmail = "accepted";
      } catch (error) {
        confirmationEmail = "failed";
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
        confirmationEmail,
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
    if (identity.managedResponseId && response?.id === identity.managedResponseId) {
      // Keep this verified browser authorized if the participant changes their contact details.
      result.cookies.set(
        signupManagementCookieName(id),
        createSignupManagementToken(id, response),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SIGNUP_MANAGEMENT_MAX_AGE,
        },
      );
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
