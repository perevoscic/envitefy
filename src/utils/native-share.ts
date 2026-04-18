type NativeShareInput = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

function normalizeShareValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function pushUniqueCandidate(
  candidates: ShareData[],
  seen: Set<string>,
  candidate: ShareData,
) {
  if (!candidate.title && !candidate.text && !candidate.url) {
    return;
  }

  const key = JSON.stringify([
    candidate.title || "",
    candidate.text || "",
    candidate.url || "",
  ]);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push(candidate);
}

export function resolveNativeShareData(input: NativeShareInput): ShareData | null {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return null;
  }

  const title = normalizeShareValue(input.title);
  const text = normalizeShareValue(input.text);
  const url = normalizeShareValue(input.url);
  const candidates: ShareData[] = [];
  const seen = new Set<string>();

  pushUniqueCandidate(candidates, seen, { title, text, url });
  pushUniqueCandidate(candidates, seen, { title, url });
  pushUniqueCandidate(candidates, seen, { url });
  pushUniqueCandidate(candidates, seen, { title, text });
  pushUniqueCandidate(candidates, seen, { text });

  if (candidates.length === 0) {
    return null;
  }

  if (typeof navigator.canShare !== "function") {
    return candidates[0];
  }

  for (const candidate of candidates) {
    try {
      if (navigator.canShare(candidate)) {
        return candidate;
      }
    } catch {}
  }

  return null;
}
