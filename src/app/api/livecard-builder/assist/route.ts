import { NextResponse } from "next/server";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { readLiveCardForm } from "@/lib/livecard-builder";
import {
  assistLiveCard,
  proofreadLiveCardOverview,
  proofreadLiveCardWording,
} from "@/lib/livecard-assistance";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  const denied = await builderApiAccess("assist");
  if (denied) return denied;
  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object")
    return NextResponse.json({ error: "Describe your event first." }, { status: 400 });
  const body = raw as Record<string, unknown>;
  const form = readLiveCardForm(body.form);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if ((body.mode === "wording" || body.mode === "overview") && form) {
    try {
      return NextResponse.json(
        await (body.mode === "overview"
          ? proofreadLiveCardOverview(form)
          : proofreadLiveCardWording(form)),
      );
    } catch {
      return NextResponse.json(
        {
          error:
            "We couldn't finish preparing your invitation. Your details are safe. Please try again.",
        },
        { status: 503 },
      );
    }
  }
  if (!form || (!message && !form.referenceUrl) || message.length > 12000)
    return NextResponse.json(
      { error: "Add a description or reference image (up to 12,000 characters)." },
      { status: 400 },
    );
  try {
    new Intl.DateTimeFormat("en", { timeZone: form.timezone }).format();
  } catch {
    return NextResponse.json({ error: "Choose a valid local time zone." }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await assistLiveCard(
        form,
        message || "Read the event information in this reference and suggest a matching design.",
        body.mode === "idea" ? "idea" : "revision",
      ),
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "We couldn't finish the suggestions. Your details are safe. Try again or continue manually.",
      },
      { status: 503 },
    );
  }
}
