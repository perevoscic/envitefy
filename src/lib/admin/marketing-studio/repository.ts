import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import {
  DEFAULT_STUDIO_SETTINGS,
  studioAssetUrl,
  type StudioAsset,
  type StudioConversation,
  type StudioConversationPatch,
  type StudioConversationSummary,
  type StudioMessage,
  type StudioProviderState,
  type StudioResult,
  type StudioSettings,
  type StudioStatus,
  type StudioTurnInput,
  type StudioVersion,
  type StudioVersionPatch,
} from "./types.ts";
import { requireStudioId, StudioRequestError } from "./validation.ts";

type SqlValue = string | number | boolean | null | string[];
export type StudioQuery = <Row extends QueryResultRow>(
  sql: string,
  parameters?: SqlValue[],
) => Promise<{ rows: Row[]; rowCount: number | null }>;

type VersionRow = {
  id: string;
  conversation_id: string;
  parent_version_id: string | null;
  output: StudioVersion["output"];
  status: StudioStatus;
  input: StudioTurnInput;
  result: StudioResult | null;
  provider: StudioProviderState;
  error: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type ThreadMetadata = {
  settings?: StudioSettings;
  draft?: string;
  referenceAssetIds?: string[];
  selectedVersionId?: string | null;
};
type ThreadRow = {
  id: string;
  title: string | null;
  metadata: ThreadMetadata;
  updated_at: string | Date;
  latest_version: VersionRow | null;
};
type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata: { versionId?: string };
  created_at: string | Date;
};

export type StoredStudioAsset = StudioAsset & {
  storageKind: "local" | "blob";
  storagePath: string;
};
type AssetRow = {
  id: string;
  conversation_id: string;
  version_id: string | null;
  name: string;
  mime_type: string;
  size_bytes: string | number;
  storage_kind: "local" | "blob";
  storage_path: string;
};

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function versionFromRow(row: VersionRow): StudioVersion {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    parentVersionId: row.parent_version_id,
    output: row.output,
    status: row.status,
    input: row.input,
    result: row.result,
    provider: row.provider || {},
    error: row.error,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function summaryFromRow(row: ThreadRow): StudioConversationSummary {
  return {
    id: row.id,
    title: row.title || "New creation",
    settings: { ...DEFAULT_STUDIO_SETTINGS, ...row.metadata?.settings },
    draft: row.metadata?.draft || "",
    referenceAssetIds: row.metadata?.referenceAssetIds || [],
    selectedVersionId: row.metadata?.selectedVersionId || null,
    updatedAt: iso(row.updated_at),
    latestVersion: row.latest_version ? versionFromRow(row.latest_version) : null,
  };
}

function assetFromRow(row: AssetRow): StoredStudioAsset {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    versionId: row.version_id,
    name: row.name,
    mimeType: row.mime_type,
    size: Number(row.size_bytes),
    url: studioAssetUrl(row.id),
    storageKind: row.storage_kind,
    storagePath: row.storage_path,
  };
}

function publicAsset(row: AssetRow): StudioAsset {
  const { storageKind: _kind, storagePath: _path, ...asset } = assetFromRow(row);
  return asset;
}

const THREAD_SELECT = `select t.id, t.title, t.metadata, t.updated_at,
  (select row_to_json(v) from admin_marketing_versions v
    where v.conversation_id = t.id order by v.created_at desc, v.id desc limit 1) as latest_version
  from conversation_threads t where t.thread_type = 'admin_marketing'`;

export const STUDIO_LEASE_SECONDS = 360;

export function createStudioRepository(execute: StudioQuery) {
  async function getVersion(id: string): Promise<StudioVersion | null> {
    requireStudioId(id, "version ID");
    const result = await execute<VersionRow>(
      `select v.* from admin_marketing_versions v
      join conversation_threads t on t.id = v.conversation_id
      where v.id = $1::uuid and t.thread_type = 'admin_marketing'`,
      [id],
    );
    return result.rows[0] ? versionFromRow(result.rows[0]) : null;
  }

  async function getAssetRecord(id: string): Promise<StoredStudioAsset | null> {
    requireStudioId(id, "asset ID");
    const result = await execute<AssetRow>(
      `select a.* from admin_marketing_assets a
      join conversation_threads t on t.id = a.conversation_id
      where a.id = $1::uuid and t.thread_type = 'admin_marketing'`,
      [id],
    );
    return result.rows[0] ? assetFromRow(result.rows[0]) : null;
  }

  async function validateReferences(
    conversationId: string,
    referenceIds: string[],
    parentId?: string | null,
  ): Promise<void> {
    requireStudioId(conversationId, "conversation ID");
    if (parentId) {
      const parent = await getVersion(parentId);
      if (!parent || parent.conversationId !== conversationId) {
        throw new StudioRequestError("That version does not belong to this conversation.", 404);
      }
    }
    if (referenceIds.length) {
      for (const id of referenceIds) requireStudioId(id, "reference asset ID");
      const result = await execute<{ id: string }>(
        `select a.id from admin_marketing_assets a
        join conversation_threads t on t.id = a.conversation_id
        where a.conversation_id = $1::uuid and a.id = any($2::uuid[])
          and a.mime_type in ('image/png', 'image/jpeg', 'image/webp')
          and t.thread_type = 'admin_marketing'`,
        [conversationId, referenceIds],
      );
      if (result.rows.length !== new Set(referenceIds).size) {
        throw new StudioRequestError("Reference images must belong to this conversation.", 404);
      }
    }
  }

  async function listConversations(): Promise<StudioConversationSummary[]> {
    const result = await execute<ThreadRow>(
      `${THREAD_SELECT} order by t.updated_at desc, t.id desc limit 100`,
    );
    return result.rows.map(summaryFromRow);
  }

  async function getConversation(id: string): Promise<StudioConversation | null> {
    requireStudioId(id, "conversation ID");
    const result = await execute<ThreadRow>(`${THREAD_SELECT} and t.id = $1::uuid`, [id]);
    if (!result.rows[0]) return null;
    const [versions, messages, assets] = await Promise.all([
      execute<VersionRow>(
        `select v.* from admin_marketing_versions v
        join conversation_threads t on t.id = v.conversation_id
        where t.id = $1::uuid and t.thread_type = 'admin_marketing'
        order by v.created_at, v.id`,
        [id],
      ),
      execute<MessageRow>(
        `select m.id, m.role, m.content, m.metadata, m.created_at
        from conversation_messages m join conversation_threads t on t.id = m.thread_id
        where t.id = $1::uuid and t.thread_type = 'admin_marketing' and m.role in ('user', 'assistant')
        order by m.created_at, case when m.role = 'user' then 0 else 1 end, m.id`,
        [id],
      ),
      execute<AssetRow>(
        `select a.* from admin_marketing_assets a
        join conversation_threads t on t.id = a.conversation_id
        where t.id = $1::uuid and t.thread_type = 'admin_marketing'
        order by a.created_at, a.id`,
        [id],
      ),
    ]);
    return {
      ...summaryFromRow(result.rows[0]),
      versions: versions.rows.map(versionFromRow),
      messages: messages.rows.map(
        (message): StudioMessage => ({
          id: message.id,
          role: message.role,
          text: message.content,
          versionId: message.metadata?.versionId || null,
          createdAt: iso(message.created_at),
        }),
      ),
      attachments: assets.rows.map(publicAsset),
    };
  }

  async function createConversation(
    email: string,
    title: string,
    settings: StudioSettings,
  ): Promise<StudioConversation> {
    const result = await execute<{ id: string }>(
      `insert into conversation_threads
      (user_id, event_id, thread_type, title, metadata)
      select u.id, null, 'admin_marketing', $2, $3::jsonb from users u
      where lower(u.email) = lower($1) and u.is_admin = true returning id`,
      [
        email,
        title,
        JSON.stringify({ settings, draft: "", referenceAssetIds: [], selectedVersionId: null }),
      ],
    );
    if (!result.rows[0]) throw new StudioRequestError("Admin account not found.", 403);
    const conversation = await getConversation(result.rows[0].id);
    if (!conversation) throw new StudioRequestError("Conversation could not be loaded.", 500);
    return conversation;
  }

  async function updateConversation(
    id: string,
    patch: StudioConversationPatch,
  ): Promise<StudioConversation | null> {
    requireStudioId(id, "conversation ID");
    await validateReferences(id, patch.referenceAssetIds || [], patch.selectedVersionId);
    const { title, ...metadata } = patch;
    await execute(
      `update conversation_threads set title = coalesce($2::text, title),
      metadata = coalesce(metadata, '{}'::jsonb) || $3::jsonb, updated_at = now()
      where id = $1::uuid and thread_type = 'admin_marketing'`,
      [id, title ?? null, JSON.stringify(metadata)],
    );
    return getConversation(id);
  }

  async function createTurn(
    conversationId: string,
    email: string,
    input: StudioTurnInput,
  ): Promise<StudioVersion> {
    requireStudioId(conversationId, "conversation ID");
    await validateReferences(conversationId, input.referenceAssetIds, input.parentVersionId);
    const id = randomUUID();
    const result = await execute<VersionRow>(
      `with inserted as (
      insert into admin_marketing_versions
        (id, conversation_id, parent_version_id, created_by, client_request_id, output, input)
      select $1::uuid, t.id, $3::uuid, u.id, $4::uuid, $5, $6::jsonb
      from conversation_threads t cross join users u
      where t.id = $2::uuid and t.thread_type = 'admin_marketing'
        and lower(u.email) = lower($7) and u.is_admin = true
      on conflict (conversation_id, client_request_id) do nothing returning *
    ), message as (
      insert into conversation_messages (thread_id, user_id, role, content, metadata)
      select conversation_id, created_by, 'user', input->>'text', jsonb_build_object('versionId', id::text)
      from inserted
    ), touched as (
      update conversation_threads t set updated_at = now(),
        title = case when t.title = 'New creation' then left(i.input->>'text', 80) else t.title end,
        metadata = coalesce(t.metadata, '{}'::jsonb) || jsonb_build_object(
          'settings', i.input->'settings', 'draft', '', 'referenceAssetIds', i.input->'referenceAssetIds',
          'selectedVersionId', i.id::text)
      from inserted i where t.id = i.conversation_id and t.thread_type = 'admin_marketing'
    ) select * from inserted`,
      [
        id,
        conversationId,
        input.parentVersionId,
        input.clientRequestId,
        input.settings.output,
        JSON.stringify(input),
        email,
      ],
    );
    if (result.rows[0]) return versionFromRow(result.rows[0]);
    const existing = await execute<VersionRow & { same_input: boolean }>(
      `select v.*, v.input = $3::jsonb as same_input
      from admin_marketing_versions v join conversation_threads t on t.id = v.conversation_id
      where v.conversation_id = $1::uuid and v.client_request_id = $2::uuid
        and t.thread_type = 'admin_marketing'`,
      [conversationId, input.clientRequestId, JSON.stringify(input)],
    );
    if (existing.rows[0]) {
      if (!existing.rows[0].same_input)
        throw new StudioRequestError(
          "This request ID was already used for different content.",
          409,
        );
      return versionFromRow(existing.rows[0]);
    }
    throw new StudioRequestError("Conversation not found.", 404);
  }

  async function claimVersion(
    id: string,
  ): Promise<{ version: StudioVersion; leaseToken: string } | null> {
    requireStudioId(id, "version ID");
    // A lost submission response cannot safely be retried: the provider may have charged for it.
    await execute(
      `update admin_marketing_versions v set status = 'submission_unknown',
      error = 'Generation was submitted but its response could not be confirmed. Start a new version to try again.',
      lease_token = null, lease_until = null, next_poll_at = null, updated_at = now()
      from conversation_threads t where t.id = v.conversation_id and t.thread_type = 'admin_marketing'
        and v.id = $1::uuid and v.status = 'submitting' and (v.lease_until is null or v.lease_until < now())`,
      [id],
    );
    const leaseToken = randomUUID();
    const result = await execute<VersionRow>(
      `update admin_marketing_versions v
      set lease_token = $2::uuid, lease_until = now() + ($3::integer * interval '1 second')
      from conversation_threads t where t.id = v.conversation_id and t.thread_type = 'admin_marketing'
        and v.id = $1::uuid and v.status in ('queued', 'developing', 'running', 'finalizing')
        and (v.lease_until is null or v.lease_until < now())
        and (v.next_poll_at is null or v.next_poll_at <= now()) returning v.*`,
      [id, leaseToken, STUDIO_LEASE_SECONDS],
    );
    return result.rows[0] ? { version: versionFromRow(result.rows[0]), leaseToken } : null;
  }

  async function updateClaimedVersion(
    id: string,
    leaseToken: string,
    patch: StudioVersionPatch,
    release = true,
  ): Promise<boolean> {
    requireStudioId(id, "version ID");
    requireStudioId(leaseToken, "lease token");
    const result = await execute<{ id: string }>(
      `with changed as (
      update admin_marketing_versions v set status = coalesce($3::text, v.status),
        result = case when $4::boolean then $5::jsonb else v.result end,
        provider = case when $6::jsonb is null then v.provider else $6::jsonb end,
        error = case when $7::boolean then $8::text else v.error end,
        next_poll_at = case when $3::text in ('ready', 'failed', 'submission_unknown') then null
          when $9::boolean then $10::timestamptz else v.next_poll_at end,
        lease_token = case when $11::boolean then null else v.lease_token end,
        lease_until = case when $11::boolean then null else now() + ($12::integer * interval '1 second') end,
        updated_at = now()
      from conversation_threads t where t.id = v.conversation_id and t.thread_type = 'admin_marketing'
        and v.id = $1::uuid and v.lease_token = $2::uuid returning v.*
    ), touched as (
      update conversation_threads t set updated_at = now(),
        title = case when v.status = 'ready'
          and nullif(btrim(v.result->>'headline'), '') is not null
          and (t.title = 'New creation' or t.title = left(v.input->>'text', 80))
          and v.id = (select initial.id from admin_marketing_versions initial
            where initial.conversation_id = t.id order by initial.created_at, initial.id limit 1)
          then left(btrim(v.result->>'headline'), 80) else t.title end
      from changed v
      where t.id = v.conversation_id and t.thread_type = 'admin_marketing'
    ), response_message as (
      insert into conversation_messages (thread_id, user_id, role, content, metadata)
      select v.conversation_id, null, 'assistant',
        coalesce(nullif(v.result->>'direction', ''), 'Your creation is ready.'), jsonb_build_object('versionId', v.id::text)
      from changed v where v.status = 'ready' and not exists (
        select 1 from conversation_messages m where m.thread_id = v.conversation_id
          and m.role = 'assistant' and m.metadata->>'versionId' = v.id::text)
    ) select id from changed`,
      [
        id,
        leaseToken,
        patch.status ?? null,
        Object.hasOwn(patch, "result"),
        JSON.stringify(patch.result ?? null),
        Object.hasOwn(patch, "provider") ? JSON.stringify(patch.provider || {}) : null,
        Object.hasOwn(patch, "error"),
        patch.error ?? null,
        Object.hasOwn(patch, "nextPollAt"),
        patch.nextPollAt ?? null,
        release,
        STUDIO_LEASE_SECONDS,
      ],
    );
    return result.rows.length > 0;
  }

  async function getDueVersionIds(limit = 5): Promise<string[]> {
    const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)));
    const result = await execute<{ id: string }>(
      `select v.id from admin_marketing_versions v
      join conversation_threads t on t.id = v.conversation_id
      where t.thread_type = 'admin_marketing' and v.status in ('queued', 'developing', 'submitting', 'running', 'finalizing')
        and (v.lease_until is null or v.lease_until < now())
        and (v.next_poll_at is null or v.next_poll_at <= now())
      order by coalesce(v.next_poll_at, v.created_at), v.created_at limit $1`,
      [safeLimit],
    );
    return result.rows.map((row) => row.id);
  }

  async function retryVersion(id: string): Promise<StudioVersion> {
    requireStudioId(id, "version ID");
    const result = await execute<VersionRow>(
      `update admin_marketing_versions v
      set status = case when nullif(v.result->>'rawAssetId', '') is not null then 'finalizing' else 'running' end,
        error = null, provider = v.provider || '{"attempts":0}'::jsonb,
        next_poll_at = now(), lease_token = null, lease_until = null, updated_at = now()
      from conversation_threads t where t.id = v.conversation_id and t.thread_type = 'admin_marketing'
        and v.id = $1::uuid and v.status = 'failed'
        and (v.lease_until is null or v.lease_until < now())
        and (nullif(v.result->>'rawAssetId', '') is not null or nullif(v.provider->>'interactionId', '') is not null)
      returning v.*`,
      [id],
    );
    if (result.rows[0]) return versionFromRow(result.rows[0]);
    const version = await getVersion(id);
    if (!version) throw new StudioRequestError("Version not found.", 404);
    if (["running", "finalizing", "ready"].includes(version.status)) return version;
    throw new StudioRequestError(
      "This generation cannot be resumed. Create a new version to try again.",
      409,
    );
  }

  async function insertAssetRecord(asset: StoredStudioAsset): Promise<StudioAsset> {
    requireStudioId(asset.id, "asset ID");
    requireStudioId(asset.conversationId, "conversation ID");
    await validateReferences(asset.conversationId, [], asset.versionId);
    const result = await execute<AssetRow>(
      `insert into admin_marketing_assets
      (id, conversation_id, version_id, name, mime_type, size_bytes, storage_kind, storage_path)
      select $1::uuid, t.id, $3::uuid, $4, $5, $6, $7, $8 from conversation_threads t
      where t.id = $2::uuid and t.thread_type = 'admin_marketing' returning *`,
      [
        asset.id,
        asset.conversationId,
        asset.versionId,
        asset.name,
        asset.mimeType,
        asset.size,
        asset.storageKind,
        asset.storagePath,
      ],
    );
    if (!result.rows[0]) throw new StudioRequestError("Conversation not found.", 404);
    return publicAsset(result.rows[0]);
  }

  return {
    getVersion,
    getAssetRecord,
    validateReferences,
    listConversations,
    getConversation,
    createConversation,
    updateConversation,
    createTurn,
    claimVersion,
    updateClaimedVersion,
    getDueVersionIds,
    retryVersion,
    insertAssetRecord,
  };
}

const execute: StudioQuery = async <Row extends QueryResultRow>(
  sql: string,
  parameters: SqlValue[] = [],
) => {
  const { query } = await import("@/lib/db");
  return query<Row>(sql, parameters);
};

export const {
  getVersion,
  getAssetRecord,
  validateReferences,
  listConversations,
  getConversation,
  createConversation,
  updateConversation,
  createTurn,
  claimVersion,
  updateClaimedVersion,
  getDueVersionIds,
  retryVersion,
  insertAssetRecord,
} = createStudioRepository(execute);
