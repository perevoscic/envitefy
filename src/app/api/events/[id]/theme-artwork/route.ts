import { after, NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { getEventHistoryById } from "@/lib/db";
import { checkCreationAccess } from "@/lib/creation-access-server";
import { eventCreationRequirement } from "@/lib/creation-access";
import { generateImportedEventArtwork, importedArtworkState } from "@/lib/imported-event-artwork";
import { readImportedEventTheme } from "@/lib/imported-event-theme";

export const runtime = "nodejs";
export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };
async function owned(request: Request, context: Context) {
  const user = await getAuthenticatedRequestUser(request);
  if (!user.ok)
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const { id } = await context.params;
  const row = await getEventHistoryById(id);
  if (!row || row.user_id !== user.userId)
    return { error: NextResponse.json({ error: "Event not found." }, { status: 404 }) };
  return { row, userId: user.userId };
}
export async function GET(request: Request, context: Context) {
  const result = await owned(request, context);
  if (result.error) return result.error;
  return NextResponse.json(
    { artwork: importedArtworkState(result.row.data?.importedThemeArtwork) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: Request, context: Context) {
  const result = await owned(request, context);
  if (result.error) return result.error;
  const data = result.row.data || {};
  const category = eventCreationRequirement(data).categories.find((value) =>
    ["gymnastics", "football", "sport-events", "soccer", "cheerleading", "dance-ballet"].includes(value),
  );
  if (!category)
    return NextResponse.json({ error: "Open a sports event to generate its image." }, { status: 400 });
  const denied = await checkCreationAccess(result.userId, {
    product: "event_page",
    category,
    eventId: result.row.id,
  });
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const theme = readImportedEventTheme(body?.theme);
  if (!theme?.enabled)
    return NextResponse.json({ error: "Choose an event theme first." }, { status: 400 });
  const existing = importedArtworkState(data.importedThemeArtwork);
  if (existing?.themeId === theme.id && (existing.status !== "failed" || body?.retry !== true))
    return NextResponse.json({ artwork: existing });
  after(() => generateImportedEventArtwork(result.row.id, theme, { retry: body?.retry === true }));
  return NextResponse.json(
    { artwork: { themeId: theme.id, status: "generating", updatedAt: new Date().toISOString() } },
    { status: 202 },
  );
}
