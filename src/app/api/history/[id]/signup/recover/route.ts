import { NextResponse } from "next/server";
import { consumeSignupRecoveryLimit, getEventHistoryById } from "@/lib/db";
import { sendSignupRecoveryEmail } from "@/lib/email";
import { allowsPublicSignup } from "@/lib/signup-access";
import {
  normalizeSignupContact,
  signupManagementUrl,
  signupRecoveryLimitKey,
} from "@/lib/signup-management";
import { readStoredSignup } from "@/lib/signup-mutations";
import { hasSameSignupOrigin } from "@/lib/signup-request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const message =
  "If a signup matches and has an email address, we’ll send a private management link to that saved email. Check your inbox and spam folder.";
const accepted = () =>
  NextResponse.json({ ok: true, message }, { headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasSameSignupOrigin(request))
    return NextResponse.json({ error: "Open the signup page to request a link." }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  const contact =
    body &&
    typeof body === "object" &&
    "contact" in body &&
    typeof body.contact === "string" &&
    body.contact.length <= 254
      ? normalizeSignupContact(body.contact)
      : null;
  if (!contact)
    return NextResponse.json(
      { error: "Enter the email address or full phone number you used to sign up." },
      { status: 400 },
    );
  const { id } = await context.params;
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unavailable";
    if (
      !(await consumeSignupRecoveryLimit([
        { key: signupRecoveryLimitKey(`ip:${ip}`), limit: 10 },
        { key: signupRecoveryLimitKey(`contact:${id}:${contact}`), limit: 3 },
      ]))
    )
      return accepted();
    const row = await getEventHistoryById(id);
    if (!row || !allowsPublicSignup(row.data)) return accepted();
    const form = readStoredSignup(row.data.signupForm);
    const responses = form.responses.filter(
      (response) =>
        response.status !== "cancelled" &&
        response.email &&
        (normalizeSignupContact(response.email) === contact ||
          (response.phone && normalizeSignupContact(response.phone) === contact)),
    );
    const byEmail = new Map<string, typeof responses>();
    for (const response of responses) {
      const email = normalizeSignupContact(response.email || "");
      if (!email?.includes("@")) continue;
      byEmail.set(email, [...(byEmail.get(email) || []), response]);
    }
    for (const [email, matches] of byEmail) {
      if (
        !(await consumeSignupRecoveryLimit([
          { key: signupRecoveryLimitKey(`recipient:${email}`), limit: 3 },
        ]))
      )
        continue;
      await sendSignupRecoveryEmail({
        toEmail: email,
        eventTitle: form.title || row.title || "Signup",
        links: matches.map((response) => ({
          name: response.name,
          url: signupManagementUrl(id, response),
        })),
      });
    }
    return accepted();
  } catch {
    // Do not expose whether a match or mail delivery failed, or log private links/contacts.
    console.error("[signup] Recovery request could not be completed", { eventId: id });
    return accepted();
  }
}
