import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getEventHistoryOwnerById, isEventPublicSlugAvailable } from "@/lib/db";
import { validateCustomEventPublicSlug } from "@/utils/event-public-slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Availability only: typing a URL never creates or updates an event. */
export async function GET(request: Request) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok) return NextResponse.json({ error: "Sign in to choose a custom URL." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const result = validateCustomEventPublicSlug(params.get("slug"));
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  const eventId = params.get("eventId") || undefined;
  try {
    if (eventId) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(eventId))
        return NextResponse.json({ error: "Invalid event." }, { status: 400 });
      const owner = await getEventHistoryOwnerById(eventId);
      if (!owner || owner.user_id !== user.userId)
        return NextResponse.json({ error: "You cannot change this event's URL." }, { status: 403 });
    }
    const available = await isEventPublicSlugAvailable(result.slug, eventId);
    return NextResponse.json({ slug: result.slug, available }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We couldn't check this URL. Please try again." }, { status: 503 });
  }
}
