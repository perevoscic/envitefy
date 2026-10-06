import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { getEventPermissions } from "@/lib/event-collaboration";
import {
  processSignupHostAlerts,
  retrySignupHostAlert,
  saveSignupHostAlertPreferences,
  signupHostAlertSettings,
} from "@/lib/signup-host-alerts";
import { SignupMutationError } from "@/lib/signup-mutations";
import { hasSameSignupOrigin } from "@/lib/signup-request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const headers = { "Cache-Control": "private, no-store" };
type Context = { params: Promise<{ id: string }> };

async function authorized(context: Context) {
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) throw new SignupMutationError("Sign in to manage signup alerts.", 401);
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row?.data?.signupForm) throw new SignupMutationError("Signup form not found.", 404);
  if (!(await getEventPermissions(row, userId)).canManageResponses)
    throw new SignupMutationError(
      "Only the owner and accepted co-hosts can manage signup alerts.",
      403,
    );
  return { row, userId };
}

function processLater(eventId: string) {
  after(async () => {
    try {
      await processSignupHostAlerts({ eventId });
    } catch {
      console.error("[signup-host-alerts] Processing deferred to retry worker");
    }
  });
}

function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof SignupMutationError
          ? error.message
          : "Unable to load or save email alerts. Try again.",
    },
    { status: error instanceof SignupMutationError ? error.status : 500, headers },
  );
}

export async function GET(_req: Request, context: Context) {
  try {
    const { row, userId } = await authorized(context);
    const settings = await signupHostAlertSettings(row, userId);
    processLater(row.id);
    return NextResponse.json(settings, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: Request, context: Context) {
  try {
    if (!hasSameSignupOrigin(req))
      throw new SignupMutationError("Open the signup page to continue.", 403);
    const { row, userId } = await authorized(context);
    const body = await req.json().catch(() => null);
    if (body?.action === "retry") {
      if (
        typeof body.alertId !== "string" ||
        !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(body.alertId)
      )
        throw new SignupMutationError("Choose an email attempt to retry.");
      await retrySignupHostAlert(row.id, userId, body.alertId);
    } else {
      const preferences = body?.preferences;
      if (
        !preferences ||
        ["newSignups", "changes", "cancellations", "waitlist"].some(
          (key) => typeof preferences[key] !== "boolean",
        )
      )
        throw new SignupMutationError("Choose your email alert preferences.");
      await saveSignupHostAlertPreferences(row.id, userId, {
        newSignups: preferences.newSignups,
        changes: preferences.changes,
        cancellations: preferences.cancellations,
        waitlist: preferences.waitlist,
      });
    }
    const settings = await signupHostAlertSettings(row, userId);
    processLater(row.id);
    return NextResponse.json(settings, { headers });
  } catch (error) {
    return failure(error);
  }
}
