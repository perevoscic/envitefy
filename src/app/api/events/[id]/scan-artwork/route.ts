import { revalidatePath } from "next/cache";
import { after, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { getEventHistoryById, query } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { resolveSavedScanPersonalization } from "@/lib/ocr/personalization";
import { generateSavedScanArtwork } from "@/lib/ocr/scan-artwork";
import { normalizeScanArtwork } from "@/lib/ocr/scan-artwork-state";
import { resolveScanMediaPolicy } from "@/lib/ocr/scan-media";

export const runtime = "nodejs";
export const maxDuration = 300;
type RouteContext = { params: Promise<{ id: string }> };

async function ownedEvent(context: RouteContext) {
  const userId = await resolveSessionUserId(await getServerSession(authOptions));
  if (!userId) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row || row.user_id !== userId)
    return { error: NextResponse.json({ error: "Event not found" }, { status: 404 }) };
  return { row, userId };
}

export async function GET(_request: Request, context: RouteContext) {
  const result = await ownedEvent(context);
  if (result.error) return result.error;
  return NextResponse.json(
    { artwork: normalizeScanArtwork(result.row.data?.scanArtwork) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(_request: Request, context: RouteContext) {
  const result = await ownedEvent(context);
  if (result.error) return result.error;
  if (!resolveSavedScanPersonalization(result.row.data, result.row.title))
    return NextResponse.json({ error: "No scan artwork available" }, { status: 409 });
  await query(
    `UPDATE event_history SET data = jsonb_set(data, '{scanHeroMode}', '"generated"'::jsonb) WHERE id = $1 AND user_id = $2`,
    [result.row.id, result.userId],
  );
  let artwork = normalizeScanArtwork(result.row.data?.scanArtwork);
  if (!artwork) {
    const profile = resolveSavedScanPersonalization(result.row.data, result.row.title);
    if (!profile) return NextResponse.json({ error: "No scan artwork available" }, { status: 409 });
    artwork = { version: 1, status: "pending", updatedAt: new Date().toISOString() };
    await query(
      `UPDATE event_history SET data = data || $3::jsonb WHERE id = $1 AND user_id = $2 AND (data->'scanArtwork' IS NULL OR data->'scanArtwork' = 'null'::jsonb)`,
      [
        result.row.id,
        result.userId,
        JSON.stringify({ scanPersonalization: profile, scanArtwork: artwork }),
      ],
    );
  }
  if (artwork.status === "failed" || (artwork.status === "ready" && !artwork.heroImageUrl)) {
    artwork = { version: 1, status: "pending", updatedAt: new Date().toISOString() };
    await query(
      `UPDATE event_history SET data = jsonb_set(data, '{scanArtwork}', $3::jsonb) WHERE id = $1 AND user_id = $2 AND data->'scanArtwork'->>'status' in ('failed', 'ready')`,
      [result.row.id, result.userId, JSON.stringify(artwork)],
    );
  }
  if (artwork.status !== "ready")
    after(() => generateSavedScanArtwork(result.row.id, result.userId, true));
  invalidateUserHistory(result.userId);
  invalidateUserDashboard(result.userId);
  revalidatePath("/event/[id]", "page");
  return NextResponse.json({ artwork }, { status: 202 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const result = await ownedEvent(context);
  if (result.error) return result.error;
  const body: unknown = await request.json().catch(() => null);
  const mode = body && typeof body === "object" && "heroMode" in body ? body.heroMode : null;
  const policy = resolveScanMediaPolicy(result.row.data, result.row.title);
  if (
    !policy ||
    (mode !== "original" && mode !== "generated") ||
    (policy.medical && mode === "original")
  )
    return NextResponse.json({ error: "Invalid artwork choice" }, { status: 400 });
  if (mode === "generated" && !normalizeScanArtwork(result.row.data.scanArtwork)?.heroImageUrl)
    return NextResponse.json({ error: "Generate artwork first" }, { status: 409 });
  await query(
    `UPDATE event_history SET data = jsonb_set(data, '{scanHeroMode}', $3::jsonb) WHERE id = $1 AND user_id = $2`,
    [result.row.id, result.userId, JSON.stringify(mode)],
  );
  invalidateUserHistory(result.userId);
  invalidateUserDashboard(result.userId);
  revalidatePath("/event/[id]", "page");
  return NextResponse.json({ heroMode: mode });
}
