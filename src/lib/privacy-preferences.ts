export const PRIVACY_PREFERENCES_STORAGE_KEY = "envitefy:privacy-preferences:v1";
export const PRIVACY_PREFERENCES_EVENT = "envitefy:privacy-preferences-changed";
export const PRIVACY_CHOICES_OPEN_EVENT = "envitefy:open-privacy-choices";
export const ANALYTICS_READY_EVENT = "envitefy:analytics-ready";

const PRIVACY_PREFERENCES_COOKIE_NAME = "envitefy_privacy_preferences";
const PRIVACY_PREFERENCES_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type PrivacyPreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

function normalizePrivacyPreferences(
  value: Partial<PrivacyPreferences> | null,
): PrivacyPreferences | null {
  if (value?.version !== 1 || typeof value.analytics !== "boolean") return null;
  return {
    version: 1,
    necessary: true,
    analytics: value.analytics,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

function readPrivacyPreferencesCookie(): PrivacyPreferences | null {
  if (typeof document === "undefined") return null;
  const prefix = `${PRIVACY_PREFERENCES_COOKIE_NAME}=`;
  const rawValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  if (!rawValue) return null;

  try {
    return normalizePrivacyPreferences(
      JSON.parse(decodeURIComponent(rawValue)) as Partial<PrivacyPreferences> | null,
    );
  } catch {
    return null;
  }
}

function savePrivacyPreferencesCookie(preferences: PrivacyPreferences) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: This first-party necessary cookie remembers the visitor's privacy choice.
  document.cookie = `${PRIVACY_PREFERENCES_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(preferences))}; Max-Age=${PRIVACY_PREFERENCES_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export function readPrivacyPreferences(): PrivacyPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const localPreferences = normalizePrivacyPreferences(
      JSON.parse(
        window.localStorage.getItem(PRIVACY_PREFERENCES_STORAGE_KEY) || "null",
      ) as Partial<PrivacyPreferences> | null,
    );
    if (localPreferences) return localPreferences;
  } catch {
    // Fall back to the first-party consent cookie when local storage is unavailable.
  }

  const cookiePreferences = readPrivacyPreferencesCookie();
  if (!cookiePreferences) return null;
  try {
    window.localStorage.setItem(PRIVACY_PREFERENCES_STORAGE_KEY, JSON.stringify(cookiePreferences));
  } catch {
    // The cookie remains the durable preference when local storage is unavailable.
  }
  return cookiePreferences;
}

export function hasAnalyticsConsent(): boolean {
  return readPrivacyPreferences()?.analytics === true;
}

export function savePrivacyPreferences(analytics: boolean): PrivacyPreferences {
  const preferences: PrivacyPreferences = {
    version: 1,
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(PRIVACY_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The first-party cookie below provides the durable fallback.
  }
  savePrivacyPreferencesCookie(preferences);
  window.dispatchEvent(new CustomEvent(PRIVACY_PREFERENCES_EVENT, { detail: preferences }));
  return preferences;
}
