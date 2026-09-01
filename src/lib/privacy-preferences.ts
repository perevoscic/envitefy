export const PRIVACY_PREFERENCES_STORAGE_KEY = "envitefy:privacy-preferences:v1";
export const PRIVACY_PREFERENCES_EVENT = "envitefy:privacy-preferences-changed";
export const PRIVACY_CHOICES_OPEN_EVENT = "envitefy:open-privacy-choices";
export const ANALYTICS_READY_EVENT = "envitefy:analytics-ready";

export type PrivacyPreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

export function readPrivacyPreferences(): PrivacyPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PRIVACY_PREFERENCES_STORAGE_KEY) || "null",
    ) as Partial<PrivacyPreferences> | null;
    if (parsed?.version !== 1 || typeof parsed.analytics !== "boolean") return null;
    return {
      version: 1,
      necessary: true,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
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
  window.localStorage.setItem(PRIVACY_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(PRIVACY_PREFERENCES_EVENT, { detail: preferences }));
  return preferences;
}
