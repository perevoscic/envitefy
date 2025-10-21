const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

type EmailSearchOptions = {
  maxDepth?: number;
  ignoreKeys?: string[];
};

const DEFAULT_IGNORE_KEYS = new Set([
  "attachment",
  "attachments",
  "thumbnail",
  "thumbnails",
  "image",
  "images",
  "dataurl",
  "dataUrl",
  "preview",
  "previews",
]);

const isSkippableString = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > 4000) return true;
  if (trimmed.startsWith("data:")) return true;
  return false;
};

export function findFirstEmail(
  input: unknown,
  options: EmailSearchOptions = {}
): string | null {
  const { maxDepth = 4, ignoreKeys = [] } = options;
  const ignore = new Set<string>(
    ignoreKeys.map((k) => k.toLowerCase()).concat([...DEFAULT_IGNORE_KEYS])
  );
  const visited = new WeakSet<object>();

  const walk = (value: unknown, depth: number): string | null => {
    if (depth > maxDepth || value == null) return null;

    if (typeof value === "string") {
      if (isSkippableString(value)) return null;
      const match = value.match(EMAIL_REGEX);
      return match ? match[0] : null;
    }

    if (typeof value !== "object") return null;

    const record = value as Record<string, unknown>;
    if (visited.has(record)) return null;
    visited.add(record);

    if (Array.isArray(record)) {
      for (let i = 0; i < record.length && i < 24; i += 1) {
        const found = walk(record[i], depth + 1);
        if (found) return found;
      }
      return null;
    }

    const entries = Object.entries(record);
    for (let i = 0; i < entries.length && i < 24; i += 1) {
      const [key, val] = entries[i];
      if (typeof key === "string" && ignore.has(key.toLowerCase())) continue;
      const found = walk(val, depth + 1);
      if (found) return found;
    }
    return null;
  };

  return walk(input, 0);
}

