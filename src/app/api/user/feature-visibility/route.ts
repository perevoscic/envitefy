import { NextResponse } from "next/server";
import {
  migrateAnniversaryTemplateKeys,
  normalizePersona,
  normalizePersonas,
  normalizeTemplateKeys,
  resolveVisibility,
  TEMPLATE_KEYS,
} from "@/config/feature-visibility";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { creationAllowed, filterCreationTemplateKeys, normalizeCreationCategory, type CreationAccess } from "@/lib/creation-access";
import { getCreationAccess } from "@/lib/creation-access-server";
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
  v?: unknown;
  persona?: unknown;
  personas?: unknown;
  visibleTemplateKeys?: unknown;
  defaultCreateIntent?: unknown;
  sportPreferences?: unknown;
  quickAccess?: unknown;
};

function readMetadata(row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>) {
  if (!row?.feature_visibility || typeof row.feature_visibility !== "object") {
    return null;
  }
  return row.feature_visibility as FeatureVisibilityPayload;
}
function allowedSportPreferences(value: unknown, access: CreationAccess) {
  const preferences = normalizeSportPreferences(value);
  return normalizeSportPreferences({ ...preferences, enabledSports: preferences.enabledSports.filter((sport) => creationAllowed(access, "event_page", normalizeCreationCategory(sport) || "sport-events")) });
}
function allowedDefaultIntent(value: string | null, access: CreationAccess): ReturnType<typeof normalizeSignupIntent> {
  if (!value) return null;
  if (value === "signup_forms") return access.allowedProducts.includes("signup_form") ? value : null;
  if (value === "snap") return access.allowedProducts.includes("snap") ? value : null;
  const category = normalizeCreationCategory(value);
  return category && creationAllowed(access, "event_page", category) ? normalizeSignupIntent(value) : null;
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
      quickAccess: ["snap", "upload", "smart_signup"],
    };
  }

  const visibility = resolveVisibility({
    persona: metadata.persona,
    personas: metadata.personas,
    visibleTemplateKeys: Array.isArray(metadata.visibleTemplateKeys)
      ? migrateAnniversaryTemplateKeys(metadata.visibleTemplateKeys, metadata.v)
      : metadata.visibleTemplateKeys,
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
    quickAccess: Array.isArray(metadata.quickAccess) ? metadata.quickAccess.filter((key) => key === "snap" || key === "upload" || key === "smart_signup") : ["snap", "upload", "smart_signup"],
  };
}

async function loadSportPreferenceSuggestion(
  email: string,
  row: Awaited<ReturnType<typeof getFeatureVisibilityByEmail>>,
): Promise<SportPreferenceSuggestion | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // History inference is only a suggestion. It must not hold up the saved
    // workspace preferences or make them unavailable when history cannot load.
    return await Promise.race([
      getSportPreferenceSuggestionByEmail(email, row),
      new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 1_000); }),
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const authUser = await getAuthenticatedRequestUser(req);
    if (!authUser.ok) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers });
    }

    const [row, access] = await Promise.all([
      getFeatureVisibilityByEmail(authUser.email),
      getCreationAccess(authUser.userId),
    ]);
    const metadata = readMetadata(row);
    const configured = normalizeSportPreferences(metadata?.sportPreferences).setupCompleted;
    const suggestion = configured
      ? null
      : await loadSportPreferenceSuggestion(authUser.email, row);
    const payload = buildResponse(row, suggestion);
    payload.visibleTemplateKeys = filterCreationTemplateKeys(payload.visibleTemplateKeys, access);
    payload.sportPreferences = allowedSportPreferences(payload.sportPreferences, access);
    payload.defaultCreateIntent = allowedDefaultIntent(payload.defaultCreateIntent, access);
    return NextResponse.json(payload, { headers });
  } catch {
    return NextResponse.json(
      { error: "Could not load your workspace preferences. Please retry." },
      { status: 503, headers },
    );
  }
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
      : Array.isArray(existingMetadata?.visibleTemplateKeys)
        ? migrateAnniversaryTemplateKeys(existingMetadata.visibleTemplateKeys, existingMetadata.v)
        : existingMetadata?.visibleTemplateKeys,
    defaultCreateIntent: hasDefaultCreateIntent
      ? normalizeSignupIntent(body.defaultCreateIntent)
      : normalizeSignupIntent(existingMetadata?.defaultCreateIntent),
    sportPreferences,
  });
  const access = await getCreationAccess(authUser.userId);
  resolved.visibleTemplateKeys = filterCreationTemplateKeys(resolved.visibleTemplateKeys, access);
  resolved.sportPreferences = allowedSportPreferences(resolved.sportPreferences, access);
  resolved.defaultCreateIntent = allowedDefaultIntent(resolved.defaultCreateIntent, access);

  await updateFeatureVisibilityByEmail({
    email,
    persona: resolved.persona,
    personas: resolved.personas,
    visibleTemplateKeys: resolved.visibleTemplateKeys,
    defaultCreateIntent: resolved.defaultCreateIntent,
    sportPreferences: resolved.sportPreferences,
    quickAccess: Object.hasOwn(body, "quickAccess") && Array.isArray(body.quickAccess)
      ? body.quickAccess.filter((key): key is string => key === "snap" || key === "upload" || key === "smart_signup")
      : undefined,
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
