import { createHash, randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { writeSelectedCalendarItem } from "@/lib/calendar-sync-service";
import { normalizeScanSchedule, scanScheduleCalendarEvent } from "@/lib/scan-schedule";
import { invalidateUserHistory } from "@/lib/history-cache";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordValue) : {};
export const schoolMemoCalendarDeps = {
  query,
  write: writeSelectedCalendarItem,
  now: () => Date.now(),
};
export class SchoolMemoCalendarInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchoolMemoCalendarInputError";
  }
}
export type MemoCalendarResult = {
  id: string;
  status: "added" | "updated" | "unchanged" | "failed" | "busy";
  message?: string;
  addedAt?: string;
};

/** Expose only owner-visible addition times, never provider identities or leases. */
export function schoolMemoCalendarAdditions(eventId: string, data: RecordValue) {
  const schedule = normalizeScanSchedule(data.scanSchedule);
  if (schedule?.kind !== "school-memo") return [];
  const states = record(data.memoCalendarSync);
  return schedule.items.flatMap((item) => {
    const sourceId = createHash("sha256").update(`${eventId}:${item.id}`).digest("hex").slice(0, 32);
    const times = ["google", "microsoft"].flatMap((provider) => {
      const state = record(states[`${provider}:${sourceId}`]);
      const time = state.addedAt || (state.status === "synced" ? state.updatedAt : null);
      return typeof time === "string" && Number.isFinite(Date.parse(time)) ? [time] : [];
    }).sort((a, b) => Date.parse(a) - Date.parse(b));
    return times.length ? [{ id: item.id, addedAt: times[0] }] : [];
  });
}

/** Each item has its own lease and provider identity; a failed batch can safely retry. */
export async function syncSelectedSchoolMemoDates(input: {
  eventId: string;
  userId: string;
  email: string;
  eventUrl: string;
  provider: "google" | "microsoft";
  data: RecordValue;
  itemIds: string[];
}): Promise<MemoCalendarResult[]> {
  if (input.data.status !== "published" || input.data.draftStatus === "draft")
    throw new SchoolMemoCalendarInputError("Publish your memo before adding dates to a calendar.");
  const schedule = normalizeScanSchedule(input.data.scanSchedule);
  if (schedule?.kind !== "school-memo")
    throw new SchoolMemoCalendarInputError("Choose a saved school memo.");
  const selected = new Set(input.itemIds);
  if (
    !selected.size ||
    selected.size > 50 ||
    [...selected].some((id) => !schedule.items.some((item) => item.id === id))
  )
    throw new SchoolMemoCalendarInputError("Select between 1 and 50 dates from this memo.");
  const syncState = record(input.data.memoCalendarSync);
  const results: MemoCalendarResult[] = [];
  const startedAt = schoolMemoCalendarDeps.now();
  const items = schedule.items.filter((item) => selected.has(item.id));
  const syncItem = async (item: (typeof items)[number]): Promise<MemoCalendarResult> => {
    const extracted = scanScheduleCalendarEvent(item, schedule, input.eventId);
    if (!extracted)
      return { id: item.id, status: "failed", message: "Check this item's date before adding it." };
    const event = { ...extracted, envitefyUrl: input.eventUrl };
    if (!event.end)
      return {
        id: item.id,
        status: "failed",
        message: "Add an end time, or download the calendar file for this item.",
      };
    const sourceId = createHash("sha256")
      .update(`${input.eventId}:${item.id}`)
      .digest("hex")
      .slice(0, 32);
    const key = `${input.provider}:${sourceId}`;
    const contentHash = createHash("sha256").update(JSON.stringify(event)).digest("hex");
    const previous = record(syncState[key]);
    if (
      previous.status === "synced" &&
      previous.contentHash === contentHash &&
      typeof previous.externalEventId === "string"
    )
      return { id: item.id, status: "unchanged", addedAt: typeof previous.addedAt === "string" ? previous.addedAt : typeof previous.updatedAt === "string" ? previous.updatedAt : undefined };
    const claimToken = randomUUID();
    const now = new Date().toISOString();
    const claimed = await schoolMemoCalendarDeps.query<{ state: RecordValue }>(
      `UPDATE event_history SET data = jsonb_set(data, '{memoCalendarSync}',
         coalesce(data->'memoCalendarSync', '{}'::jsonb) || jsonb_build_object($3::text,
           coalesce(data->'memoCalendarSync'->$3, '{}'::jsonb) || $4::jsonb))
       WHERE id = $1 AND user_id = $2 AND data->'scanSchedule' = $6::jsonb
         AND data->>'status' = 'published' AND coalesce(data->>'draftStatus', '') <> 'draft'
         AND (data->'memoCalendarSync'->$3->>'status' IS DISTINCT FROM 'syncing'
           OR coalesce(data->'memoCalendarSync'->$3->>'updatedAt', '') < $5)
       RETURNING data->'memoCalendarSync'->$3 AS state`,
      [
        input.eventId,
        input.userId,
        key,
        JSON.stringify({ status: "syncing", claimToken, updatedAt: now }),
        new Date(Date.now() - 120_000).toISOString(),
        JSON.stringify(input.data.scanSchedule),
      ],
    );
    if (!claimed.rows.length)
      return {
        id: item.id,
        status: "busy",
        message: "This memo changed or this date is being added. Refresh before retrying.",
      };
    const claimedState = record(claimed.rows[0].state);
    const externalEventId =
      typeof claimedState.externalEventId === "string" ? claimedState.externalEventId : undefined;
    let state: RecordValue;
    let result: MemoCalendarResult;
    try {
      const saved = await schoolMemoCalendarDeps.write({
        provider: input.provider,
        email: input.email,
        sourceId,
        eventUrl: input.eventUrl,
        event,
        externalEventId,
      });
      const addedAt = typeof claimedState.addedAt === "string"
        ? claimedState.addedAt
        : previous.status === "synced" && typeof previous.updatedAt === "string"
          ? previous.updatedAt
          : new Date(schoolMemoCalendarDeps.now()).toISOString();
      state = {
        status: "synced",
        addedAt,
        contentHash,
        externalEventId: saved.externalEventId,
        updatedAt: new Date().toISOString(),
      };
      result = { id: item.id, status: externalEventId ? "updated" : "added", addedAt };
    } catch {
      state = { status: "failed", updatedAt: new Date().toISOString() };
      result = {
        id: item.id,
        status: "failed",
        message: "Could not add this date. Check your calendar connection and retry.",
      };
    }
    await schoolMemoCalendarDeps.query(
      `UPDATE event_history SET data = jsonb_set(data, '{memoCalendarSync}',
         coalesce(data->'memoCalendarSync', '{}'::jsonb) || jsonb_build_object($3::text,
           coalesce(data->'memoCalendarSync'->$3, '{}'::jsonb) || $4::jsonb))
       WHERE id = $1 AND user_id = $2 AND data->'memoCalendarSync'->$3->>'claimToken' = $5`,
      [input.eventId, input.userId, key, JSON.stringify(state), claimToken],
    );
    return result;
  };
  for (let offset = 0; offset < items.length; offset += 3) {
    // Leave time for the final provider operations and response before the route deadline.
    if (schoolMemoCalendarDeps.now() - startedAt >= 60_000) {
      results.push(
        ...items.slice(offset).map((item) => ({
          id: item.id,
          status: "busy" as const,
          message:
            "These remaining dates still need adding. Retry your selection; completed dates will be retained.",
        })),
      );
      break;
    }
    results.push(...(await Promise.all(items.slice(offset, offset + 3).map(syncItem))));
  }
  invalidateUserHistory(input.userId);
  invalidateUserDashboard(input.userId);
  return results;
}
