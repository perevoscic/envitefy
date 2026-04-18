import {
  landingLiveCardSnapshots,
  type LandingLiveCardSnapshot,
} from "@/components/landing/landing-live-card-snapshots";

export function buildLandingShowcasePath(slug: string): string {
  return `/showcase/${encodeURIComponent(slug.trim())}`;
}

export function normalizeLandingShowcaseValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function resolveLandingShowcaseSnapshot(value: string): LandingLiveCardSnapshot | null {
  const normalized = normalizeLandingShowcaseValue(value);
  if (!normalized) return null;

  return (
    landingLiveCardSnapshots.find((snapshot) => {
      return (
        normalizeLandingShowcaseValue(snapshot.title) === normalized ||
        normalizeLandingShowcaseValue(snapshot.slug) === normalized ||
        normalizeLandingShowcaseValue(snapshot.id) === normalized
      );
    }) || null
  );
}
