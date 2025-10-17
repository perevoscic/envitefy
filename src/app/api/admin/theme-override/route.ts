import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getThemeOverrideByEmail,
  upsertThemeOverrideForUser,
  deleteThemeOverrideForUser,
  getUserByEmail,
} from "@/lib/db";
import {
  resolveThemeForDate,
  findActiveThemeWindow,
  isValidThemeKey,
  isValidVariant,
  ThemeKey,
  ThemeVariant,
  ThemeOverride,
} from "@/themes";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function toThemeOverride(row: { theme_key: string; variant: string; expires_at?: string | null }): ThemeOverride | null {
  if (!row) return null;
  const key = row.theme_key as ThemeKey;
  const variant = row.variant as ThemeVariant;
  if (!isValidThemeKey(key) || !isValidVariant(variant)) return null;
  return {
    themeKey: key,
    variant,
    expiresAt: row.expires_at ?? null,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();
  if (!(session.user as any)?.isAdmin) return forbidden();

  const email = session.user.email;
  const overrideRow = await getThemeOverrideByEmail(email);
  const override = overrideRow ? toThemeOverride(overrideRow as any) : null;

  const now = new Date();
  const scheduledKey = resolveThemeForDate(now);
  const activeWindow = findActiveThemeWindow(now);

  return NextResponse.json({
    override,
    schedule: {
      themeKey: scheduledKey,
      window: activeWindow
        ? {
            key: activeWindow.key,
            start: activeWindow.start.toISOString(),
            end: activeWindow.end.toISOString(),
          }
        : null,
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();
  if (!(session.user as any)?.isAdmin) return forbidden();

  const email = session.user.email;
  const user = await getUserByEmail(email);
  if (!user?.id) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const themeKey = body?.themeKey as string | undefined;
  const variant = body?.variant as string | undefined;
  if (!themeKey || !isValidThemeKey(themeKey as ThemeKey)) {
    return NextResponse.json({ error: "Invalid theme key" }, { status: 400 });
  }
  if (!variant || !isValidVariant(variant as ThemeVariant)) {
    return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
  }

  let expiresAt: string | null = null;
  if (typeof body?.expiresAt === "string" && body.expiresAt.trim().length > 0) {
    const parsed = new Date(body.expiresAt);
    if (!Number.isNaN(parsed.getTime())) {
      expiresAt = parsed.toISOString();
    }
  }

  const upserted = await upsertThemeOverrideForUser(
    user.id,
    themeKey,
    variant,
    expiresAt
  );

  if (!upserted) {
    return NextResponse.json({ error: "Unable to persist override" }, { status: 500 });
  }

  return NextResponse.json({ override: toThemeOverride(upserted as any) });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return unauthorized();
  if (!(session.user as any)?.isAdmin) return forbidden();

  const email = session.user.email;
  const user = await getUserByEmail(email);
  if (!user?.id) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await deleteThemeOverrideForUser(user.id);
  return NextResponse.json({ ok: true });
}
