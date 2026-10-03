import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { builderApiAccess } from "@/lib/livecard-api-access";
import { readLiveCardForm, validateLiveCard } from "@/lib/livecard-builder";
import { readSharedCardDesign } from "@/lib/shared-card-design";
import { cancelArtworkJob, createArtworkJob, readArtworkJobForAccess, runArtworkJob, type ArtworkJob } from "@/lib/livecard-artwork-jobs";
import { getEventHistoryById } from "@/lib/db";
import { getEventPermissions } from "@/lib/event-collaboration";

export const runtime = "nodejs";
export const maxDuration = 600;
async function owner() { return resolveSessionUserId(await getServerSession(authOptions)); }
async function authorizedJob(userId: string, id: string): Promise<ArtworkJob | null> {
  const job = await readArtworkJobForAccess(id);
  if (!job) return null;
  if (!job.event_id) return job.owner_id === userId ? job : null;
  const event = await getEventHistoryById(job.event_id);
  return event && (await getEventPermissions(event, userId)).canEdit ? job : null;
}
export async function GET(request: Request) {
  const userId = await owner();
  if (!userId) return NextResponse.json({ error: "Sign in to view your artwork." }, { status: 401 });
  const job = await authorizedJob(userId, new URL(request.url).searchParams.get("id") || "");
  return NextResponse.json({ job: job ? { ...job, elapsed_ms: Math.max(0, Date.now() - Date.parse(job.created_at)) } : null }, { status: job ? 200 : 404, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const denied = await builderApiAccess("design");
  if (denied) return denied;
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to create artwork." }, { status: 403 });
  const userId = await owner();
  if (!userId) return NextResponse.json({ error: "Sign in to create artwork." }, { status: 401 });
  const raw = await request.json().catch(() => null);
  const form = readLiveCardForm(raw?.form);
  if (!form?.title.trim() || Object.keys(validateLiveCard(form, "design")).length || typeof raw?.key !== "string" || raw.key.length > 200)
    return NextResponse.json({ error: "Add your title, event type and design first." }, { status: 400 });
  const mode = raw.mode === "verify" ? "verify" : raw.mode === "repair" ? "repair" : raw.mode === "background" ? "background" : "generate";
  const design = readSharedCardDesign(raw.design) || null;
  if (mode !== "generate" && !design) return NextResponse.json({ error: "Create a background first." }, { status: 400 });
  const eventId = typeof raw.eventId === "string" ? raw.eventId : null;
  let jobOwner = userId;
  if (eventId) {
    const event = await getEventHistoryById(eventId);
    if (!event || !(await getEventPermissions(event, userId)).canEdit) return NextResponse.json({ error: "You do not have artwork access to this event." }, { status: 403 });
    jobOwner = event.user_id || userId;
  }
  const job = await createArtworkJob(jobOwner, raw.key, form, design, mode, eventId);
  if (job.state === "queued") after(() => runArtworkJob(jobOwner, job.id));
  return NextResponse.json({ job }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ error: "Open Envitefy to cancel artwork." }, { status: 403 });
  const userId = await owner();
  if (!userId) return NextResponse.json({ error: "Sign in to cancel artwork." }, { status: 401 });
  const raw = await request.json().catch(() => null);
  const authorized = await authorizedJob(userId, typeof raw?.id === "string" ? raw.id : "");
  const job = authorized ? await cancelArtworkJob(authorized.owner_id, authorized.id) : null;
  return NextResponse.json({ job, providerCancellation: "unconfirmed", message: "Cancellation requested. Provider execution status unknown." }, { status: job ? 200 : 404 });
}
