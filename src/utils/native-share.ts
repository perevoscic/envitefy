type NativeShareInput = {
  title?: string | null;
  text?: string | null;
  url?: string | null;
};

const INTERNAL_INSTRUCTION_COPY_PATTERNS = [
  /\bUse the [^.]{1,80}? Envitefy template family\.?/gi,
  /\bPreserve the full event flow in the generated live card and guest-facing details\.?/gi,
  /\bGenerate website hero\/background artwork for the event page\.[^.]*\.?/gi,
  /\bDo not bake large title text[\s\S]*?in HTML\.?/gi,
  /\bAdditional event stops?:\s*/gi,
  /\b(?:change|replace|update|fix)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s+to\b[^.]*\.?/gi,
];

function stripInternalInstructionCopy(value: string) {
  let stripped = value;
  for (const pattern of INTERNAL_INSTRUCTION_COPY_PATTERNS) {
    stripped = stripped.replace(pattern, " ");
  }
  return stripped
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/(?:^|\s)[,.;:!?]+(?=\s|$)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeShareValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = stripInternalInstructionCopy(value);
  return trimmed || undefined;
}

function pushUniqueCandidate(candidates: ShareData[], seen: Set<string>, candidate: ShareData) {
  if (!candidate.title && !candidate.text && !candidate.url) {
    return;
  }

  const key = JSON.stringify([candidate.title || "", candidate.text || "", candidate.url || ""]);
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  candidates.push(candidate);
}

function isStudioCardShareUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value, "https://envitefy.local");
    return parsed.pathname.startsWith("/card/");
  } catch {
    return value.startsWith("/card/");
  }
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

  if (isStudioCardShareUrl(url)) {
    pushUniqueCandidate(candidates, seen, { url });
  } else {
    pushUniqueCandidate(candidates, seen, { title, text, url });
    pushUniqueCandidate(candidates, seen, { title, url });
    pushUniqueCandidate(candidates, seen, { url });
    pushUniqueCandidate(candidates, seen, { title, text });
    pushUniqueCandidate(candidates, seen, { text });
  }

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
