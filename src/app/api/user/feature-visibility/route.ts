import { NextResponse } from "next/server";
import {
  normalizePersona,
  normalizePersonas,
  normalizeTemplateKeys,
  resolveVisibility,
  TEMPLATE_KEYS,
} from "@/config/feature-visibility";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import {
  getFeatureVisibilityByEmail,
  getSportPreferenceSuggestionByEmail,
  updateFeatureVisibilityByEmail,
} from "@/lib/db";
import { normalizeSignupIntent } from "@/lib/signup-intent";
import {
  EMPTY_SPORT_PREFERENCES,
  normalizeSportPreferences,
  type SportPreferenceInferenceSource,
  type SportPreferenceSuggestion,
} from "@/lib/sports-preferences";

type FeatureVisibilityPayload = {
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
  defaultCreateIntent?: unknown;
  sportPreferences?: unknown;
};

function readMetadata(row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>) {
  if (!row?.feature_visibility || typeof row.feature_visibility !== "object") {
    return null;
  }
  return row.feature_visibility as FeatureVisibilityPayload;
}

function buildResponse(
  row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>,
  sportPreferenceSuggestion: SportPreferenceSuggestion | null = null,
) {
  const metadata = readMetadata(row);
  if (!metadata) {
    return {
      persona: null,
      personas: [],
      visibleTemplateKeys: [...TEMPLATE_KEYS],
      dashboardLayout: "default" as const,
      defaultCreateIntent: null,
      sportPreferences: { ...EMPTY_SPORT_PREFERENCES },
      sportPreferenceSuggestion,
    };
  }

  const visibility = resolveVisibility({
    persona: metadata.persona,
    personas: metadata.personas,
    visibleTemplateKeys: metadata.visibleTemplateKeys,
    defaultCreateIntent: normalizeSignupIntent(metadata.defaultCreateIntent),
  });

  return {
    persona: visibility.persona,
    personas: visibility.personas,
    visibleTemplateKeys:
      Array.isArray(metadata.visibleTemplateKeys)
        ? visibility.visibleTemplateKeys
        : [...TEMPLATE_KEYS],
    dashboardLayout: visibility.dashboardLayout,
    defaultCreateIntent: normalizeSignupIntent(metadata.defaultCreateIntent),
    sportPreferences: normalizeSportPreferences(metadata.sportPreferences),
    sportPreferenceSuggestion,
  };
}

export async function GET(req: Request) {
  const authUser = await getAuthenticatedRequestUser(req);
  if (!authUser.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const row = await getFeatureVisibilityByEmail(authUser.email);
  const metadata = readMetadata(row);
  const configured = normalizeSportPreferences(metadata?.sportPreferences).setupCompleted;
  const suggestion = configured
    ? null
    : await getSportPreferenceSuggestionByEmail(authUser.email, row);
  return NextResponse.json(buildResponse(row, suggestion));
}

export async function PUT(req: Request) {
  const authUser = await getAuthenticatedRequestUser(req);
  if (!authUser.ok) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = authUser.email;
  const rawBody = await req.json().catch(() => ({}));
  const body: Record<string, unknown> =
    rawBody && typeof rawBody === "object" ? (rawBody as Record<string, unknown>) : {};
  const existingRow = await getFeatureVisibilityByEmail(email);
  const existingMetadata = readMetadata(existingRow);

  const hasPersona = Object.hasOwn(body, "persona");
  const hasPersonas = Object.hasOwn(body, "personas");
  const hasVisibleTemplateKeys = Object.hasOwn(body, "visibleTemplateKeys");
  const hasDefaultCreateIntent = Object.hasOwn(body, "defaultCreateIntent");
  const hasSportPreferences = Object.hasOwn(body, "sportPreferences");
  const existingSportPreferences = normalizeSportPreferences(existingMetadata?.sportPreferences);
  const sportPreferences = hasSportPreferences
    ? normalizeSportPreferences(body.sportPreferences)
    : existingSportPreferences;
  const requestedSetupCompleted =
    hasSportPreferences &&
    body.sportPreferences &&
    typeof body.sportPreferences === "object" &&
    (body.sportPreferences as Record<string, unknown>).setupCompleted === true;

  if (requestedSetupCompleted && !sportPreferences.setupCompleted) {
    return NextResponse.json(
      { error: "Choose at least one valid sport and mark one as primary." },
      { status: 400 },
    );
  }

  const resolved = resolveVisibility({
    persona: hasPersona ? normalizePersona(body.persona) : existingMetadata?.persona,
    personas: hasPersonas ? normalizePersonas(body.personas) : existingMetadata?.personas,
    visibleTemplateKeys: hasVisibleTemplateKeys
      ? normalizeTemplateKeys(body.visibleTemplateKeys)
      : existingMetadata?.visibleTemplateKeys,
    defaultCreateIntent: hasDefaultCreateIntent
      ? normalizeSignupIntent(body.defaultCreateIntent)
      : normalizeSignupIntent(existingMetadata?.defaultCreateIntent),
    sportPreferences,
  });

  await updateFeatureVisibilityByEmail({
    email,
    persona: resolved.persona,
    personas: resolved.personas,
    visibleTemplateKeys: resolved.visibleTemplateKeys,
    defaultCreateIntent: resolved.defaultCreateIntent,
    sportPreferences: resolved.sportPreferences,
  });

  if (
    hasSportPreferences &&
    JSON.stringify(existingSportPreferences) !== JSON.stringify(resolved.sportPreferences)
  ) {
    const rawSource = String(body.sportPreferenceSource || "");
    const source: SportPreferenceInferenceSource | "manual" | "settings" =
      rawSource === "url" || rawSource === "signup" || rawSource === "history"
        ? rawSource
        : rawSource === "manual"
          ? "manual"
          : "settings";
    console.info("[sports-preferences] updated", {
      inferenceSource: source,
      primarySport: resolved.sportPreferences.primarySport,
      enabledSportCount: resolved.sportPreferences.enabledSports.length,
    });
  }

  const row = await getFeatureVisibilityByEmail(email);
  return NextResponse.json({ ok: true, featureVisibility: buildResponse(row) });
}
