function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => equal(value, right[index]));
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.hasOwn(right, key) && equal(left[key], right[key]));
}

/** Refresh untouched fields while keeping edits made since the previous server snapshot. */
export function mergeDiscoveryEditorRefresh<T>(current: T, previousServer: T, nextServer: T): T {
  if (equal(current, previousServer)) return nextServer;
  if (!isRecord(current) || !isRecord(previousServer) || !isRecord(nextServer)) return current;
  const merged: Record<string, unknown> = { ...current };
  for (const key of Object.keys(nextServer)) {
    if (key === "importedTheme" && isRecord(current[key]) && isRecord(previousServer[key]) && current[key].id !== previousServer[key].id) continue;
    merged[key] = mergeDiscoveryEditorRefresh(current[key], previousServer[key], nextServer[key]);
  }
  return merged as T;
}
