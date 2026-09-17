type EventListRecord = {
  id: string;
  public_slug?: string | null;
  data?: { publicSlug?: string | null } | null;
};

export const EVENT_DELETION_CHANNEL = "envitefy:events:deleted:v1";

type RemovalStorage = Pick<Storage, "getItem" | "setItem">;

export function readEventRemovalKeys(storage: RemovalStorage, identity: string): Set<string> {
  try {
    const values: unknown = JSON.parse(
      storage.getItem(`${EVENT_DELETION_CHANNEL}:${identity}`) || "[]",
    );
    return new Set(
      Array.isArray(values)
        ? values
            .filter((value): value is string => typeof value === "string")
            .map(normalizeEventRemovalKey)
        : [],
    );
  } catch {
    return new Set();
  }
}

export function writeEventRemovalKeys(
  storage: RemovalStorage,
  identity: string,
  keys: ReadonlySet<string>,
): void {
  try {
    storage.setItem(`${EVENT_DELETION_CHANNEL}:${identity}`, JSON.stringify([...keys]));
  } catch {
    // In-memory protection still applies when browser storage is unavailable.
  }
}

export function normalizeEventRemovalKey(value: string): string {
  const key = value.trim().toLowerCase();
  // Old links can contain a title followed by the canonical event UUID.
  return (
    key.match(
      /(?:^|-)([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/,
    )?.[1] || key
  );
}

export function withoutRemovedEvents<T extends EventListRecord>(
  rows: T[],
  removed: ReadonlySet<string>,
): T[] {
  return rows.filter(
    (row) =>
      ![row.id, row.public_slug, row.data?.publicSlug].some(
        (key) => key && removed.has(normalizeEventRemovalKey(key)),
      ),
  );
}

/** Never let a read started before deletion or a stale server cache restore removed rows. */
export function mergeEventHistoryRefresh<T extends EventListRecord>(
  fetched: T[],
  previous: T[],
  preservePrevious: boolean,
  removed: ReadonlySet<string>,
): T[] {
  const rows = preservePrevious
    ? [...new Map([...fetched, ...previous].map((row) => [row.id, row])).values()]
    : fetched;
  return withoutRemovedEvents(rows, removed);
}
