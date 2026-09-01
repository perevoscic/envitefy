import { NextResponse } from "next/server";
import { unsubscribeMarketingEmail } from "@/lib/db";
import { verifyMarketingUnsubscribeToken } from "@/lib/marketing-unsubscribe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const email = await verifyMarketingUnsubscribeToken(token);
  if (!email) {
    return new NextResponse("Invalid or expired unsubscribe link.", { status: 400 });
  }
  await unsubscribeMarketingEmail(email);
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head><body style="font-family:system-ui,sans-serif;padding:40px;max-width:640px;margin:auto"><h1>You’re unsubscribed</h1><p>We will stop sending promotional and product-update emails to ${email.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}.</p><p>Essential account, security, RSVP, and event-service messages may still be sent.</p><a href="/">Return to Envitefy</a></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
