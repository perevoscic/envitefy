import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  completeOnboardingByEmail,
  dismissOnboardingPromptByEmail,
  getOnboardingByEmail,
} from "@/lib/db";
import {
  normalizePersona,
  normalizePersonas,
  normalizeTemplateKeys,
  resolveVisibility,
} from "@/config/feature-visibility";

function buildResponse(row: Awaited<ReturnType<typeof getOnboardingByEmail>>) {
  type FeatureVisibilityPayload = {
    personas?: unknown;
    visibleTemplateKeys?: unknown;
  };
  const metadata =
    row?.feature_visibility && typeof row.feature_visibility === "object"
      ? (row.feature_visibility as FeatureVisibilityPayload)
      : null;

  const visibility = resolveVisibility({
    persona: row?.onboarding_persona || null,
    personas: metadata?.personas,
    visibleTemplateKeys: metadata?.visibleTemplateKeys,
  });

  return {
    required: Boolean(row?.onboarding_required),
    completed: Boolean(row?.onboarding_completed_at),
    persona: visibility.persona,
    personas: visibility.personas,
    promptDismissedAt: row?.onboarding_prompt_dismissed_at || null,
    visibleTemplateKeys: visibility.visibleTemplateKeys,
    dashboardLayout: visibility.dashboardLayout,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const row = await getOnboardingByEmail(String(session.user.email));
  return NextResponse.json(buildResponse(row));
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = String(session.user.email);
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").trim();

  if (action === "dismiss_prompt") {
    await dismissOnboardingPromptByEmail(email);
    const row = await getOnboardingByEmail(email);
    return NextResponse.json({ ok: true, onboarding: buildResponse(row) });
  }

  if (action === "complete") {
    const personas = normalizePersonas(body?.personas);
    const persona = normalizePersona(body?.persona) || personas[0] || null;
    if (!persona && personas.length === 0) {
      return NextResponse.json({ error: "Invalid persona selection" }, { status: 400 });
    }
    const normalizedPersonas =
      personas.length > 0
        ? personas
        : persona
        ? [persona]
        : [];

    const normalizedVisibleKeys = normalizeTemplateKeys(body?.visibleTemplateKeys);
    const resolved = resolveVisibility({
      persona,
      personas: normalizedPersonas,
      visibleTemplateKeys: normalizedVisibleKeys,
    });

    await completeOnboardingByEmail({
      email,
      persona: resolved.persona || normalizedPersonas[0],
      personas: resolved.personas,
      visibleTemplateKeys: resolved.visibleTemplateKeys,
    });

    const row = await getOnboardingByEmail(email);
    return NextResponse.json({ ok: true, onboarding: buildResponse(row) });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
