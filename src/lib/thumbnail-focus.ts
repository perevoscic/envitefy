export const THUMBNAIL_FOCUS_TARGETS = ["face", "title", "center"] as const;

export type ThumbnailFocusTarget = (typeof THUMBNAIL_FOCUS_TARGETS)[number];

export type ThumbnailFocus = {
  target: ThumbnailFocusTarget;
  x: number;
  y: number;
  confidence?: number;
};

function isThumbnailFocusTarget(value: unknown): value is ThumbnailFocusTarget {
  return (
    typeof value === "string" &&
    (THUMBNAIL_FOCUS_TARGETS as readonly string[]).includes(value)
  );
}

function finiteNumber(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function normalizeThumbnailFocus(value: unknown): ThumbnailFocus | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!isThumbnailFocusTarget(record.target)) return null;

  const x = finiteNumber(record.x);
  const y = finiteNumber(record.y);
  if (x === null || y === null) return null;

  const confidence = finiteNumber(record.confidence);
  return {
    target: record.target,
    x: clampUnit(x),
    y: clampUnit(y),
    ...(confidence === null ? {} : { confidence: clampUnit(confidence) }),
  };
}

export function thumbnailFocusToObjectPosition(value: unknown): string | undefined {
  const focus = normalizeThumbnailFocus(value);
  if (!focus) return undefined;
  const x = Number((focus.x * 100).toFixed(2));
  const y = Number((focus.y * 100).toFixed(2));
  return `${x}% ${y}%`;
}
