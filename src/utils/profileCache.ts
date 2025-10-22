export const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

type Plan = "freemium" | "free" | "monthly" | "yearly" | "FF" | null;

type ProfileCacheRecord = {
  timestamp: number;
  plan: Plan;
  credits: number | "INF" | null;
};

function getCacheKey(email?: string | null): string | null {
  if (!email) return null;
  return `profile-cache:${email.toLowerCase()}`;
}

export function readProfileCache(email?: string | null): {
  timestamp: number;
  plan: Plan;
  credits: number | null;
} | null {
  if (typeof window === "undefined") return null;
  const key = getCacheKey(email);
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileCacheRecord;
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    const credits = parsed.credits === "INF" ? Infinity : parsed.credits;
    return {
      timestamp: parsed.timestamp,
      plan: parsed.plan ?? null,
      credits: typeof credits === "number" || credits === null ? credits : Infinity,
    };
  } catch {
    return null;
  }
}

export function writeProfileCache(
  email: string | null | undefined,
  plan: Plan,
  credits: number | null
): void {
  if (typeof window === "undefined") return;
  const key = getCacheKey(email);
  if (!key) return;
  try {
    const payload: ProfileCacheRecord = {
      timestamp: Date.now(),
      plan,
      credits:
        credits === Infinity || credits === null
          ? credits === Infinity
            ? "INF"
            : null
          : credits,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {}
}

export function clearProfileCache(email?: string | null) {
  if (typeof window === "undefined") return;
  const key = getCacheKey(email);
  if (!key) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {}
}
