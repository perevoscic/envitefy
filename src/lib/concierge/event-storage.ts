import { query } from "@/lib/db";
import type {
  EventAsset,
  EventAssetStatus,
  EventAssetType,
} from "./types.ts";

let tablesReady: Promise<void> | null = null;

function asJsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isEventAssetType(value: unknown): value is EventAssetType {
  return (
    value === "event_page" ||
    value === "live_card" ||
    value === "signup_form" ||
    value === "invitation" ||
    value === "rsvp_page" ||
    value === "whatsapp" ||
    value === "instagram_story" ||
    value === "printable_flyer" ||
    value === "reminder_message" ||
    value === "thank_you_card" ||
    value === "menu" ||
    value === "welcome_sign"
  );
}

export async function ensureEventManageTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await query(`
        create table if not exists event_assets (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references users(id),
          event_id uuid not null references event_history(id) on delete cascade,
          asset_type text not null,
          title text not null,
          status text not null default 'draft',
          content jsonb not null default '{}'::jsonb,
          design jsonb not null default '{}'::jsonb,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        )
      `);
      await query(
        `create index if not exists idx_event_assets_event_updated on event_assets(event_id, updated_at desc)`,
      );
      await query(
        `create index if not exists idx_event_assets_user_event on event_assets(user_id, event_id)`,
      );
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  await tablesReady;
}

function mapAsset(row: any): EventAsset {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    event_id: String(row.event_id),
    asset_type: isEventAssetType(row.asset_type) ? row.asset_type : "live_card",
    title: String(row.title || "Untitled asset"),
    status: String(row.status || "draft"),
    content: asJsonRecord(row.content),
    design: asJsonRecord(row.design),
    metadata: asJsonRecord(row.metadata),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listEventAssets(eventId: string, userId: string): Promise<EventAsset[]> {
  await ensureEventManageTables();
  const res = await query(
    `select id, user_id, event_id, asset_type, title, status, content, design, metadata, created_at, updated_at
     from event_assets
     where event_id = $1 and user_id = $2
     order by updated_at desc, created_at desc`,
    [eventId, userId],
  );
  return (res.rows || []).map(mapAsset);
}

export async function createEventAsset(params: {
  userId: string;
  eventId: string;
  assetType: EventAssetType;
  title: string;
  status?: EventAssetStatus | string;
  content?: Record<string, unknown>;
  design?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<EventAsset> {
  await ensureEventManageTables();
  const res = await query(
    `insert into event_assets (user_id, event_id, asset_type, title, status, content, design, metadata)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
     returning id, user_id, event_id, asset_type, title, status, content, design, metadata, created_at, updated_at`,
    [
      params.userId,
      params.eventId,
      params.assetType,
      params.title.slice(0, 240),
      params.status || "draft",
      JSON.stringify(params.content || {}),
      JSON.stringify(params.design || {}),
      JSON.stringify(params.metadata || {}),
    ],
  );
  return mapAsset(res.rows[0]);
}

export async function updateEventAsset(params: {
  userId: string;
  eventId: string;
  assetId: string;
  patch: {
    title?: string;
    status?: EventAssetStatus | string;
    content?: Record<string, unknown>;
    design?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
}): Promise<EventAsset | null> {
  await ensureEventManageTables();
  const current = await query(
    `select id, user_id, event_id, asset_type, title, status, content, design, metadata, created_at, updated_at
     from event_assets
     where id = $1 and event_id = $2 and user_id = $3
     limit 1`,
    [params.assetId, params.eventId, params.userId],
  );
  const row = current.rows[0];
  if (!row) return null;
  const patch = params.patch || {};
  const nextContent =
    patch.content && typeof patch.content === "object"
      ? { ...asJsonRecord(row.content), ...patch.content }
      : asJsonRecord(row.content);
  const nextDesign =
    patch.design && typeof patch.design === "object"
      ? { ...asJsonRecord(row.design), ...patch.design }
      : asJsonRecord(row.design);
  const nextMetadata =
    patch.metadata && typeof patch.metadata === "object"
      ? { ...asJsonRecord(row.metadata), ...patch.metadata }
      : asJsonRecord(row.metadata);
  const res = await query(
    `update event_assets
     set title = $4,
         status = $5,
         content = $6::jsonb,
         design = $7::jsonb,
         metadata = $8::jsonb,
         updated_at = now()
     where id = $1 and event_id = $2 and user_id = $3
     returning id, user_id, event_id, asset_type, title, status, content, design, metadata, created_at, updated_at`,
    [
      params.assetId,
      params.eventId,
      params.userId,
      typeof patch.title === "string" && patch.title.trim()
        ? patch.title.trim().slice(0, 240)
        : row.title,
      typeof patch.status === "string" && patch.status.trim() ? patch.status.trim() : row.status,
      JSON.stringify(nextContent),
      JSON.stringify(nextDesign),
      JSON.stringify(nextMetadata),
    ],
  );
  return res.rows[0] ? mapAsset(res.rows[0]) : null;
}

export async function deleteEventAsset(params: {
  userId: string;
  eventId: string;
  assetId: string;
}): Promise<boolean> {
  await ensureEventManageTables();
  const res = await query(
    `delete from event_assets where id = $1 and event_id = $2 and user_id = $3`,
    [params.assetId, params.eventId, params.userId],
  );
  return (res.rowCount || 0) > 0;
}
