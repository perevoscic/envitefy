import { query } from "@/lib/db";
import type {
  ConversationMessage,
  ConversationMessageRole,
  ConversationThread,
  CreationSession,
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
    value === "live_card" ||
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

export async function ensureEventWorkspaceTables(): Promise<void> {
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
      await query(`
        create table if not exists conversation_threads (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references users(id),
          event_id uuid references event_history(id) on delete cascade,
          thread_type text not null,
          title text,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        )
      `);
      await query(
        `create index if not exists idx_conversation_threads_event_type on conversation_threads(user_id, event_id, thread_type, updated_at desc)`,
      );
      await query(`
        create table if not exists conversation_messages (
          id uuid primary key default gen_random_uuid(),
          thread_id uuid not null references conversation_threads(id) on delete cascade,
          user_id uuid references users(id),
          role text not null,
          content text not null,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz default now()
        )
      `);
      await query(
        `create index if not exists idx_conversation_messages_thread_created on conversation_messages(thread_id, created_at asc)`,
      );
      await query(`
        create table if not exists creation_sessions (
          id text primary key,
          user_id uuid not null references users(id),
          status text not null default 'needs_event_details',
          draft jsonb not null default '{}'::jsonb,
          active_context jsonb not null default '{}'::jsonb,
          source_context jsonb not null default '{}'::jsonb,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        )
      `);
      await query(
        `create index if not exists idx_creation_sessions_user_updated on creation_sessions(user_id, updated_at desc)`,
      );
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  await tablesReady;
}

function mapCreationSession(row: any): CreationSession {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    status: String(row.status || "needs_event_details"),
    draft: asJsonRecord(row.draft) as any,
    active_context: asJsonRecord(row.active_context),
    source_context: asJsonRecord(row.source_context),
    metadata: asJsonRecord(row.metadata),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function upsertCreationSession(params: {
  userId: string;
  draft: CreationSession["draft"];
  activeContext?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<CreationSession> {
  await ensureEventWorkspaceTables();
  const sessionId = params.draft.creationSessionId;
  const res = await query(
    `insert into creation_sessions (id, user_id, status, draft, active_context, source_context, metadata)
     values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb)
     on conflict (id) do update
       set status = excluded.status,
           draft = excluded.draft,
           active_context = excluded.active_context,
           source_context = excluded.source_context,
           metadata = creation_sessions.metadata || excluded.metadata,
           updated_at = now()
     where creation_sessions.user_id = excluded.user_id
     returning id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at`,
    [
      sessionId,
      params.userId,
      params.draft.draftStatus,
      JSON.stringify(params.draft),
      JSON.stringify(params.activeContext || {}),
      JSON.stringify(params.draft.sourceContext || {}),
      JSON.stringify(params.metadata || {}),
    ],
  );
  if (!res.rows[0]) {
    throw new Error("Creation session id is not available for this user.");
  }
  return mapCreationSession(res.rows[0]);
}

export async function getCreationSession(params: {
  userId: string;
  sessionId: string;
}): Promise<CreationSession | null> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `select id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at
     from creation_sessions
     where id = $1 and user_id = $2
     limit 1`,
    [params.sessionId, params.userId],
  );
  return res.rows[0] ? mapCreationSession(res.rows[0]) : null;
}

export async function getLatestCreationSession(params: {
  userId: string;
}): Promise<CreationSession | null> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `select id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at
     from creation_sessions
     where user_id = $1
       and status not in ('published', 'publishing')
       and not (metadata ? 'savedEventId')
     order by updated_at desc, created_at desc
     limit 1`,
    [params.userId],
  );
  return res.rows[0] ? mapCreationSession(res.rows[0]) : null;
}

export async function listCreationSessions(params: {
  userId: string;
  limit?: number;
}): Promise<CreationSession[]> {
  await ensureEventWorkspaceTables();
  const limit = Math.max(1, Math.min(50, Math.floor(params.limit || 20)));
  const res = await query(
    `select id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at
     from creation_sessions
     where user_id = $1
     order by updated_at desc, created_at desc
     limit $2`,
    [params.userId, limit],
  );
  return (res.rows || []).map(mapCreationSession);
}

export async function deleteCreationSession(params: {
  userId: string;
  sessionId: string;
}): Promise<boolean> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `delete from creation_sessions
     where id = $1 and user_id = $2`,
    [params.sessionId, params.userId],
  );
  return Number(res.rowCount || 0) > 0;
}

export async function claimCreationSessionSave(params: {
  userId: string;
  sessionId: string;
}): Promise<CreationSession | null> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `update creation_sessions
     set status = 'publishing',
         metadata = metadata || $3::jsonb,
         updated_at = now()
     where id = $1
       and user_id = $2
       and status not in ('published', 'publishing')
       and not (metadata ? 'savedEventId')
     returning id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at`,
    [
      params.sessionId,
      params.userId,
      JSON.stringify({
        savingAt: new Date().toISOString(),
      }),
    ],
  );
  return res.rows[0] ? mapCreationSession(res.rows[0]) : null;
}

export async function markCreationSessionSaved(params: {
  userId: string;
  sessionId: string;
  eventId: string;
  draft: CreationSession["draft"];
  metadata?: Record<string, unknown>;
}): Promise<CreationSession | null> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `update creation_sessions
     set status = 'published',
         draft = $3::jsonb,
         metadata = metadata || $4::jsonb,
         updated_at = now()
     where id = $1 and user_id = $2
     returning id, user_id, status, draft, active_context, source_context, metadata, created_at, updated_at`,
    [
      params.sessionId,
      params.userId,
      JSON.stringify(params.draft),
      JSON.stringify({
        ...(params.metadata || {}),
        savedEventId: params.eventId,
        savedAt: new Date().toISOString(),
      }),
    ],
  );
  return res.rows[0] ? mapCreationSession(res.rows[0]) : null;
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
  await ensureEventWorkspaceTables();
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
  await ensureEventWorkspaceTables();
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
  await ensureEventWorkspaceTables();
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
  await ensureEventWorkspaceTables();
  const res = await query(
    `delete from event_assets where id = $1 and event_id = $2 and user_id = $3`,
    [params.assetId, params.eventId, params.userId],
  );
  return (res.rowCount || 0) > 0;
}

export async function getOrCreateEventThread(params: {
  userId: string;
  eventId: string;
  title: string;
}): Promise<ConversationThread> {
  await ensureEventWorkspaceTables();
  const existing = await query(
    `select id, user_id, event_id, thread_type, title, created_at, updated_at
     from conversation_threads
     where user_id = $1 and event_id = $2 and thread_type = 'event_assistant'
     order by updated_at desc
     limit 1`,
    [params.userId, params.eventId],
  );
  if (existing.rows[0]) return existing.rows[0] as ConversationThread;
  const created = await query(
    `insert into conversation_threads (user_id, event_id, thread_type, title)
     values ($1, $2, 'event_assistant', $3)
     returning id, user_id, event_id, thread_type, title, created_at, updated_at`,
    [params.userId, params.eventId, params.title.slice(0, 240)],
  );
  return created.rows[0] as ConversationThread;
}

export async function appendConversationMessage(params: {
  threadId: string;
  userId: string | null;
  role: ConversationMessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<ConversationMessage> {
  await ensureEventWorkspaceTables();
  const res = await query(
    `insert into conversation_messages (thread_id, user_id, role, content, metadata)
     values ($1, $2, $3, $4, $5::jsonb)
     returning id, thread_id, user_id, role, content, metadata, created_at`,
    [
      params.threadId,
      params.userId,
      params.role,
      params.content.slice(0, 20000),
      JSON.stringify(params.metadata || {}),
    ],
  );
  return res.rows[0] as ConversationMessage;
}

export async function listConversationMessages(
  threadId: string,
  limit = 30,
): Promise<ConversationMessage[]> {
  await ensureEventWorkspaceTables();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 30)));
  const res = await query(
    `select id, thread_id, user_id, role, content, metadata, created_at
     from conversation_messages
     where thread_id = $1
     order by created_at desc
     limit $2`,
    [threadId, safeLimit],
  );
  return (res.rows || []).reverse() as ConversationMessage[];
}

export async function touchConversationThread(threadId: string): Promise<void> {
  await query(`update conversation_threads set updated_at = now() where id = $1`, [threadId]);
}
