import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  normalizePersona,
  normalizePersonas,
  normalizeTemplateKeys,
  resolveVisibility,
  TEMPLATE_KEYS,
} from "@/config/feature-visibility";
import { authOptions } from "@/lib/auth";
import { getFeatureVisibilityByEmail, updateFeatureVisibilityByEmail } from "@/lib/db";

type FeatureVisibilityPayload = {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
};

function readMetadata(row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>) {
  if (!row?.feature_visibility || typeof row.feature_visibility !== "object") {
    return null;
  }
  return row.feature_visibility as FeatureVisibilityPayload;
}

function buildResponse(row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>) {
  const metadata = readMetadata(row);
  if (!metadata) {
    return {
      persona: null,
      personas: [],
      visibleTemplateKeys: [...TEMPLATE_KEYS],
      dashboardLayout: "default" as const,
    };
  }

  const normalizedVisibleTemplateKeys = normalizeTemplateKeys(metadata.visibleTemplateKeys);
  const visibility = resolveVisibility({
    persona: metadata.persona,
    personas: metadata.personas,
    visibleTemplateKeys: metadata.visibleTemplateKeys,
  });

  return {
    persona: visibility.persona,
    personas: visibility.personas,
    visibleTemplateKeys:
      normalizedVisibleTemplateKeys.length > 0
        ? visibility.visibleTemplateKeys
        : [...TEMPLATE_KEYS],
    dashboardLayout: visibility.dashboardLayout,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const row = await getFeatureVisibilityByEmail(String(session.user.email));
  return NextResponse.json(buildResponse(row));
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = String(session.user.email);
  const rawBody = await req.json().catch(() => ({}));
  const body: Record<string, unknown> =
    rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};
  const existingRow = await getFeatureVisibilityByEmail(email);
  const existingMetadata = readMetadata(existingRow);

  const hasPersona = Object.hasOwn(body, "persona");
  const hasPersonas = Object.hasOwn(body, "personas");
  const hasVisibleTemplateKeys = Object.hasOwn(body, "visibleTemplateKeys");

  const resolved = resolveVisibility({
    persona: hasPersona ? normalizePersona(body.persona) : existingMetadata?.persona,
    personas: hasPersonas ? normalizePersonas(body.personas) : existingMetadata?.personas,
    visibleTemplateKeys: hasVisibleTemplateKeys
      ? normalizeTemplateKeys(body.visibleTemplateKeys)
      : existingMetadata?.visibleTemplateKeys,
  });

  if (!resolved.visibleTemplateKeys.length) {
    return NextResponse.json(
      { error: "At least one visible feature is required" },
      { status: 400 },
    );
  }

  await updateFeatureVisibilityByEmail({
    email,
    persona: resolved.persona,
    personas: resolved.personas,
    visibleTemplateKeys: resolved.visibleTemplateKeys,
  });

  const row = await getFeatureVisibilityByEmail(email);
  return NextResponse.json({ ok: true, featureVisibility: buildResponse(row) });
}
