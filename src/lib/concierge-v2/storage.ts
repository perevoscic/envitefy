import { randomBytes } from "node:crypto";
import { invalidateUserDashboard } from "@/lib/dashboard-cache";
import { insertEventHistory, query, updateEventHistoryData } from "@/lib/db";
import { invalidateUserHistory } from "@/lib/history-cache";
import { generateOccurrences, parseConciergeInput } from "./core.mjs";
import {
  buildConciergeV2EventHistoryPayload,
  type ConciergeV2ChecklistItem,
  type ConciergeV2FormSummary,
  type ConciergeV2PaymentItem,
  type ConciergeV2ReminderItem,
  type ConciergeV2ScheduleItem,
  type ConciergeV2VolunteerSlot,
} from "./public-event";

export type ConciergeV2SessionRow = {
  id: string;
  workspace_id: string | null;
  user_id: string;
  mode: string | null;
  source_kind: string;
  input_text: string | null;
  status: string;
  model_provider: string | null;
  model_name: string | null;
  raw_output_json: Record<string, any>;
  normalized_output_json: Record<string, any>;
  missing_fields_json: any[];
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ConciergeV2ApplyResult = {
  sessionId: string;
  workspaceId: string | null;
  programId: string;
  eventPageId: string;
  eventHistoryId: string;
  publicSlug: string | null;
  eventPath: string;
  occurrenceCount: number;
  seriesCount: number;
  formCount: number;
  volunteerSlotCount: number;
  paymentRequestCount: number;
  reminderCount: number;
  checklistCount: number;
};

let tablesReady: Promise<void> | null = null;

function cleanString(value: any, maxLength = 240): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function cents(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function positiveInteger(value: any, fallback = 1): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.round(parsed)) : fallback;
}

function token(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}

export async function ensureConciergeV2Tables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await query(`
        create table if not exists workspaces (
          id uuid primary key default gen_random_uuid(),
          owner_user_id uuid references users(id) on delete set null,
          name text not null,
          slug text unique,
          workspace_type text not null default 'personal',
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(
        `create index if not exists idx_workspaces_owner_type on workspaces(owner_user_id, workspace_type)`,
      );
      await query(`
        create table if not exists programs (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          owner_user_id uuid references users(id) on delete set null,
          title text not null,
          mode text not null default 'social',
          status text not null default 'draft',
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists event_series (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          owner_user_id uuid references users(id) on delete set null,
          title text not null,
          series_type text not null default 'recurring',
          recurrence_rule text,
          start_time_local text,
          duration_minutes integer,
          timezone text,
          status text not null default 'active',
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists event_occurrences (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          series_id uuid references event_series(id) on delete set null,
          owner_user_id uuid references users(id) on delete set null,
          title text not null,
          occurrence_type text not null default 'event',
          start_at timestamptz(6),
          end_at timestamptz(6),
          timezone text,
          location_text text,
          status text not null default 'scheduled',
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(
        `create index if not exists idx_event_occurrences_program_start on event_occurrences(program_id, start_at)`,
      );
      await query(`
        create table if not exists event_pages (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete set null,
          series_id uuid references event_series(id) on delete set null,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          legacy_event_history_id uuid references event_history(id) on delete set null,
          owner_user_id uuid references users(id) on delete set null,
          title text not null,
          target_type text not null default 'program',
          visibility text not null default 'public',
          share_token text unique,
          status text not null default 'draft',
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists concierge_sessions (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          user_id uuid references users(id) on delete set null,
          mode text,
          source_kind text not null default 'text',
          input_text text,
          status text not null default 'started',
          model_provider text,
          model_name text,
          raw_output_json jsonb not null default '{}'::jsonb,
          normalized_output_json jsonb not null default '{}'::jsonb,
          missing_fields_json jsonb not null default '[]'::jsonb,
          error_message text,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(
        `create index if not exists idx_concierge_sessions_user_created on concierge_sessions(user_id, created_at desc)`,
      );
      await query(`
        create table if not exists concierge_drafts (
          id uuid primary key default gen_random_uuid(),
          session_id uuid not null references concierge_sessions(id) on delete cascade,
          draft_type text not null,
          payload_json jsonb not null default '{}'::jsonb,
          status text not null default 'draft',
          applied_entity_type text,
          applied_entity_id text,
          applied_at timestamptz(6),
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists smart_forms (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          event_page_id uuid references event_pages(id) on delete set null,
          title text not null,
          description text,
          schema_json jsonb not null default '{}'::jsonb,
          status text not null default 'draft',
          created_by_user_id uuid references users(id) on delete set null,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists form_fields (
          id uuid primary key default gen_random_uuid(),
          form_id uuid not null references smart_forms(id) on delete cascade,
          field_key text not null,
          label text not null,
          field_type text not null,
          required boolean not null default false,
          options_json jsonb not null default '[]'::jsonb,
          sort_order integer not null default 0,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`create unique index if not exists uniq_form_fields_form_key on form_fields(form_id, field_key)`);
      await query(`
        create table if not exists form_responses (
          id uuid primary key default gen_random_uuid(),
          form_id uuid not null references smart_forms(id) on delete cascade,
          user_id uuid references users(id) on delete set null,
          guest_name text,
          guest_email text,
          answers_json jsonb not null default '{}'::jsonb,
          status text not null default 'submitted',
          submitted_at timestamptz(6),
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(
        `create index if not exists idx_form_responses_form on form_responses(form_id, created_at desc)`,
      );
      await query(`
        create table if not exists volunteer_boards (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          event_page_id uuid references event_pages(id) on delete set null,
          title text not null,
          description text,
          status text not null default 'draft',
          created_by_user_id uuid references users(id) on delete set null,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists volunteer_slots (
          id uuid primary key default gen_random_uuid(),
          board_id uuid not null references volunteer_boards(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          title text not null,
          description text,
          quantity_needed integer not null default 1,
          claimed_quantity integer not null default 0,
          start_at timestamptz(6),
          end_at timestamptz(6),
          requirements_json jsonb not null default '{}'::jsonb,
          sort_order integer not null default 0,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`alter table volunteer_slots add column if not exists claimed_quantity integer not null default 0`);
      await query(`
        create table if not exists volunteer_claims (
          id uuid primary key default gen_random_uuid(),
          slot_id uuid not null references volunteer_slots(id) on delete cascade,
          user_id uuid references users(id) on delete set null,
          guest_name text,
          guest_email text,
          status text not null default 'claimed',
          quantity integer not null default 1,
          notes text,
          claimed_at timestamptz(6),
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(
        `create index if not exists idx_volunteer_claims_slot_status on volunteer_claims(slot_id, status)`,
      );
      await query(
        `create unique index if not exists uniq_volunteer_claims_slot_email_active
         on volunteer_claims(slot_id, lower(guest_email))
         where guest_email is not null and status = 'claimed'`,
      );
      await query(`
        create table if not exists payment_requests (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          event_page_id uuid references event_pages(id) on delete set null,
          title text not null,
          description text,
          amount_cents integer not null default 0,
          currency text not null default 'USD',
          due_at timestamptz(6),
          external_payment_url text,
          external_payment_note text,
          status text not null default 'unpaid',
          created_by_user_id uuid references users(id) on delete set null,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists payments (
          id uuid primary key default gen_random_uuid(),
          payment_request_id uuid references payment_requests(id) on delete set null,
          user_id uuid references users(id) on delete set null,
          guest_name text,
          amount_cents integer not null default 0,
          currency text not null default 'USD',
          status text not null default 'unpaid',
          provider text,
          provider_reference text,
          provider_payload_json jsonb not null default '{}'::jsonb,
          manual_method text,
          paid_at timestamptz(6),
          notes text,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`create index if not exists idx_payments_status on payments(status)`);
      await query(`
        create table if not exists message_templates (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          mode text,
          event_type text,
          trigger_key text not null,
          channel text not null default 'email',
          subject text,
          body text not null,
          variables_json jsonb not null default '[]'::jsonb,
          is_system boolean not null default false,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists reminders (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          event_page_id uuid references event_pages(id) on delete set null,
          reminder_type text not null default 'custom',
          channel text not null default 'email',
          audience_filter_json jsonb not null default '{}'::jsonb,
          scheduled_for timestamptz(6),
          status text not null default 'draft',
          template_id uuid,
          created_by_user_id uuid references users(id) on delete set null,
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists message_campaigns (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          name text not null,
          scope_type text,
          scope_id text,
          audience_filter_json jsonb not null default '{}'::jsonb,
          channels_json jsonb not null default '[]'::jsonb,
          subject text,
          body text not null,
          status text not null default 'draft',
          scheduled_for timestamptz(6),
          sent_at timestamptz(6),
          created_by_user_id uuid references users(id) on delete set null,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists message_deliveries (
          id uuid primary key default gen_random_uuid(),
          campaign_id uuid references message_campaigns(id) on delete set null,
          reminder_id uuid references reminders(id) on delete set null,
          recipient_user_id uuid references users(id) on delete set null,
          guest_name text,
          channel text not null default 'email',
          to_address text,
          status text not null default 'queued',
          provider text,
          provider_message_id text,
          error_message text,
          sent_at timestamptz(6),
          delivered_at timestamptz(6),
          opened_at timestamptz(6),
          metadata_json jsonb not null default '{}'::jsonb,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`alter table message_deliveries add column if not exists metadata_json jsonb not null default '{}'::jsonb`);
      await query(`create index if not exists idx_reminders_status_scheduled on reminders(status, scheduled_for)`);
      await query(`create index if not exists idx_message_deliveries_status on message_deliveries(status)`);
      await query(`create index if not exists idx_message_deliveries_reminder on message_deliveries(reminder_id, created_at desc)`);
      await query(`
        create table if not exists checklist_items (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          program_id uuid references programs(id) on delete cascade,
          occurrence_id uuid references event_occurrences(id) on delete set null,
          event_page_id uuid references event_pages(id) on delete set null,
          title text not null,
          category text,
          status text not null default 'open',
          sort_order integer not null default 0,
          metadata_json jsonb not null default '{}'::jsonb,
          created_by_user_id uuid references users(id) on delete set null,
          created_at timestamptz(6) default now(),
          updated_at timestamptz(6) default now()
        )
      `);
      await query(`
        create table if not exists audit_logs (
          id uuid primary key default gen_random_uuid(),
          workspace_id uuid references workspaces(id) on delete set null,
          actor_user_id uuid references users(id) on delete set null,
          action text not null,
          entity_type text not null,
          entity_id text not null,
          before_json jsonb,
          after_json jsonb,
          ip_address text,
          user_agent text,
          created_at timestamptz(6) default now()
        )
      `);
    })().catch((error) => {
      tablesReady = null;
      throw error;
    });
  }
  await tablesReady;
}

function mapSession(row: any): ConciergeV2SessionRow {
  return {
    id: String(row.id),
    workspace_id: row.workspace_id ? String(row.workspace_id) : null,
    user_id: String(row.user_id),
    mode: row.mode ? String(row.mode) : null,
    source_kind: String(row.source_kind || "text"),
    input_text: row.input_text ? String(row.input_text) : null,
    status: String(row.status || "started"),
    model_provider: row.model_provider ? String(row.model_provider) : null,
    model_name: row.model_name ? String(row.model_name) : null,
    raw_output_json: asRecord(row.raw_output_json),
    normalized_output_json: asRecord(row.normalized_output_json),
    missing_fields_json: asArray(row.missing_fields_json),
    error_message: row.error_message ? String(row.error_message) : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function draftParts(draft: Record<string, any>): Array<{ type: string; payload: any }> {
  return [
    { type: "program", payload: draft.program || {} },
    ...asArray(draft.series).map((payload) => ({ type: "series", payload })),
    ...asArray(draft.occurrences).map((payload) => ({ type: "occurrence", payload })),
    ...asArray(draft.forms).map((payload) => ({ type: "form", payload })),
    ...asArray(draft.reminders).map((payload) => ({ type: "reminder", payload })),
    ...asArray(draft.checklistItems).map((payload) => ({ type: "checklist", payload })),
  ];
}

async function getOrCreatePersonalWorkspace(userId: string): Promise<string | null> {
  const existing = await query<{ id: string }>(
    `select id from workspaces
     where owner_user_id = $1 and workspace_type = 'personal'
     order by created_at asc
     limit 1`,
    [userId],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;
  const created = await query<{ id: string }>(
    `insert into workspaces (owner_user_id, name, slug, workspace_type)
     values ($1, 'Personal workspace', $2, 'personal')
     returning id`,
    [userId, `personal-${userId.slice(0, 8)}-${token(5)}`],
  );
  return created.rows[0]?.id || null;
}

export async function createConciergeV2Session(params: {
  userId: string;
  inputText: string;
  sourceKind?: string;
  draft?: Record<string, any> | null;
  referenceDate?: string | null;
}): Promise<ConciergeV2SessionRow> {
  await ensureConciergeV2Tables();
  const inputText = cleanString(params.inputText, 12000);
  const draft =
    params.draft ||
    parseConciergeInput(inputText, {
      sourceKind: params.sourceKind || "text",
      referenceDate: params.referenceDate || undefined,
    });
  const workspaceId = await getOrCreatePersonalWorkspace(params.userId);
  const res = await query(
    `insert into concierge_sessions (
       workspace_id,
       user_id,
       mode,
       source_kind,
       input_text,
       status,
       model_provider,
       model_name,
       raw_output_json,
       normalized_output_json,
       missing_fields_json
     )
     values ($1, $2, $3, $4, $5, 'parsed', 'deterministic', 'fallback-v2', $6::jsonb, $7::jsonb, $8::jsonb)
     returning id, workspace_id, user_id, mode, source_kind, input_text, status, model_provider, model_name,
       raw_output_json, normalized_output_json, missing_fields_json, error_message, created_at, updated_at`,
    [
      workspaceId,
      params.userId,
      cleanString(draft.mode, 80) || null,
      params.sourceKind || "text",
      inputText,
      JSON.stringify({ inputText }),
      JSON.stringify(draft),
      JSON.stringify(asArray(draft.missingFields)),
    ],
  );
  const session = mapSession(res.rows[0]);
  for (const part of draftParts(draft)) {
    await query(
      `insert into concierge_drafts (session_id, draft_type, payload_json, status)
       values ($1, $2, $3::jsonb, 'draft')`,
      [session.id, part.type, JSON.stringify(part.payload || {})],
    );
  }
  return session;
}

export async function getConciergeV2Session(params: {
  userId: string;
  sessionId: string;
}): Promise<ConciergeV2SessionRow | null> {
  await ensureConciergeV2Tables();
  const res = await query(
    `select id, workspace_id, user_id, mode, source_kind, input_text, status, model_provider, model_name,
       raw_output_json, normalized_output_json, missing_fields_json, error_message, created_at, updated_at
     from concierge_sessions
     where id = $1 and user_id = $2
     limit 1`,
    [params.sessionId, params.userId],
  );
  return res.rows[0] ? mapSession(res.rows[0]) : null;
}

export async function listConciergeV2Sessions(params: {
  userId: string;
  limit?: number;
}): Promise<ConciergeV2SessionRow[]> {
  await ensureConciergeV2Tables();
  const limit = Math.max(1, Math.min(25, Math.floor(params.limit || 10)));
  const res = await query(
    `select id, workspace_id, user_id, mode, source_kind, input_text, status, model_provider, model_name,
       raw_output_json, normalized_output_json, missing_fields_json, error_message, created_at, updated_at
     from concierge_sessions
     where user_id = $1
     order by updated_at desc, created_at desc
     limit $2`,
    [params.userId, limit],
  );
  return res.rows.map(mapSession);
}

async function insertProgram(params: {
  workspaceId: string | null;
  userId: string;
  draft: Record<string, any>;
}): Promise<string> {
  const program = asRecord(params.draft.program);
  const res = await query<{ id: string }>(
    `insert into programs (workspace_id, owner_user_id, title, mode, status, metadata_json)
     values ($1, $2, $3, $4, 'active', $5::jsonb)
     returning id`,
    [
      params.workspaceId,
      params.userId,
      cleanString(program.title, 220) || cleanString(params.draft.title, 220) || "Envitefy Program",
      cleanString(program.mode || params.draft.mode, 80) || "social",
      JSON.stringify({ source: "concierge_v2", eventType: params.draft.eventType || null }),
    ],
  );
  return res.rows[0].id;
}

async function insertSeries(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  series: Record<string, any>;
}): Promise<string> {
  const res = await query<{ id: string }>(
    `insert into event_series (
       workspace_id, program_id, owner_user_id, title, series_type, recurrence_rule,
       start_time_local, duration_minutes, timezone, status, metadata_json
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10::jsonb)
     returning id`,
    [
      params.workspaceId,
      params.programId,
      params.userId,
      cleanString(params.series.title, 220) || "Recurring schedule",
      cleanString(params.series.type, 80) || "recurring",
      cleanString(params.series.recurrenceRule, 220) || null,
      cleanString(params.series.startTimeLocal, 40) || null,
      Number(params.series.durationMinutes) || null,
      cleanString(params.series.timezone, 80) || null,
      JSON.stringify(params.series),
    ],
  );
  return res.rows[0].id;
}

async function insertOccurrence(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  seriesId?: string | null;
  occurrence: Record<string, any>;
}): Promise<ConciergeV2ScheduleItem & { id: string }> {
  const title = cleanString(params.occurrence.title, 220) || "Scheduled event";
  const res = await query<{
    id: string;
    title: string;
    occurrence_type: string;
    start_at: string | null;
    end_at: string | null;
    timezone: string | null;
    location_text: string | null;
    status: string;
  }>(
    `insert into event_occurrences (
       workspace_id, program_id, series_id, owner_user_id, title, occurrence_type,
       start_at, end_at, timezone, location_text, status, metadata_json
     )
     values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, $9, $10, $11, $12::jsonb)
     returning id, title, occurrence_type, start_at, end_at, timezone, location_text, status`,
    [
      params.workspaceId,
      params.programId,
      params.seriesId || null,
      params.userId,
      title,
      cleanString(params.occurrence.type || params.occurrence.occurrenceType, 80) || "event",
      cleanString(params.occurrence.startAt, 80) || null,
      cleanString(params.occurrence.endAt, 80) || null,
      cleanString(params.occurrence.timezone, 80) || null,
      cleanString(params.occurrence.locationText || params.occurrence.location, 220) || null,
      cleanString(params.occurrence.status, 60) || "scheduled",
      JSON.stringify(params.occurrence),
    ],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    title: row.title,
    type: row.occurrence_type,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationText: row.location_text,
    status: row.status,
  };
}

async function insertForms(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  eventPageId?: string | null;
  forms: any[];
}): Promise<ConciergeV2FormSummary[]> {
  const inserted: ConciergeV2FormSummary[] = [];
  for (const form of params.forms) {
    const formRes = await query<{ id: string }>(
      `insert into smart_forms (
         workspace_id, program_id, event_page_id, title, description, schema_json, status, created_by_user_id
       )
       values ($1, $2, $3, $4, $5, $6::jsonb, 'active', $7)
       returning id`,
      [
        params.workspaceId,
        params.programId,
        params.eventPageId || null,
        cleanString(form.title, 220) || "Smart Form",
        cleanString(form.description, 500) || null,
        JSON.stringify(form),
        params.userId,
      ],
    );
    const formId = formRes.rows[0].id;
    const fields = asArray(form.fields);
    const storedFields: NonNullable<ConciergeV2FormSummary["fields"]> = [];
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      const fieldKey = cleanString(field.key, 100) || `field_${index + 1}`;
      const label = cleanString(field.label, 220) || "Question";
      const type = cleanString(field.type, 80) || "text";
      const required = Boolean(field.required);
      await query(
        `insert into form_fields (form_id, field_key, label, field_type, required, options_json, sort_order)
         values ($1, $2, $3, $4, $5, $6::jsonb, $7)
         on conflict (form_id, field_key) do nothing`,
        [
          formId,
          fieldKey,
          label,
          type,
          required,
          JSON.stringify(asArray(field.options)),
          index,
        ],
      );
      storedFields.push({ key: fieldKey, label, type, required });
    }
    inserted.push({
      id: formId,
      title: cleanString(form.title, 220) || "Smart Form",
      description: cleanString(form.description, 500) || null,
      fields: storedFields,
    });
  }
  return inserted;
}

async function insertVolunteerSlots(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  eventPageId?: string | null;
  draft: Record<string, any>;
}): Promise<ConciergeV2VolunteerSlot[]> {
  const slots = asArray(params.draft.volunteerSlots);
  if (!slots.length) return [];
  const board = await query<{ id: string }>(
    `insert into volunteer_boards (
       workspace_id, program_id, event_page_id, title, description, status, created_by_user_id
     )
     values ($1, $2, $3, $4, $5, 'active', $6)
     returning id`,
    [
      params.workspaceId,
      params.programId,
      params.eventPageId || null,
      `${cleanString(params.draft.title, 180) || "Event"} Signup`,
      "Volunteer and item slots generated by Envitefy Concierge.",
      params.userId,
    ],
  );
  const boardId = board.rows[0].id;
  const inserted: ConciergeV2VolunteerSlot[] = [];
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    const quantityNeeded = positiveInteger(slot.quantityNeeded || slot.quantity_needed, 1);
    const group = cleanString(slot.group, 120) || null;
    const res = await query<{ id: string }>(
      `insert into volunteer_slots (board_id, title, description, quantity_needed, requirements_json, sort_order)
       values ($1, $2, $3, $4, $5::jsonb, $6)
       returning id`,
      [
        boardId,
        cleanString(slot.title, 220) || "Signup slot",
        cleanString(slot.description, 500) || null,
        quantityNeeded,
        JSON.stringify({ group }),
        index,
      ],
    );
    inserted.push({
      id: res.rows[0].id,
      title: cleanString(slot.title, 220) || "Signup slot",
      description: cleanString(slot.description, 500) || null,
      group,
      quantityNeeded,
      claimedQuantity: 0,
    });
  }
  return inserted;
}

async function insertPayments(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  eventPageId?: string | null;
  paymentItems: any[];
}): Promise<ConciergeV2PaymentItem[]> {
  const inserted: ConciergeV2PaymentItem[] = [];
  for (const item of params.paymentItems) {
    const title = cleanString(item.title, 220) || "Payment request";
    const description = cleanString(item.description, 500) || null;
    const amountCents = cents(item.amountCents || item.amount_cents);
    const currency = cleanString(item.currency, 12) || "USD";
    const dueAt = cleanString(item.dueAt || item.due_at, 80) || null;
    const status = cleanString(item.status, 80) || "unpaid";
    const res = await query<{ id: string }>(
      `insert into payment_requests (
         workspace_id, program_id, event_page_id, title, description, amount_cents,
         currency, due_at, external_payment_url, external_payment_note, status, created_by_user_id
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, $10, $11, $12)
       returning id`,
      [
        params.workspaceId,
        params.programId,
        params.eventPageId || null,
        title,
        description,
        amountCents,
        currency,
        dueAt,
        cleanString(item.externalPaymentUrl || item.external_payment_url, 500) || null,
        cleanString(item.externalPaymentNote || item.external_payment_note, 500) || null,
        status,
        params.userId,
      ],
    );
    inserted.push({ id: res.rows[0].id, title, description, amountCents, currency, dueAt, status });
  }
  return inserted;
}

async function insertReminders(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  eventPageId?: string | null;
  reminders: any[];
}): Promise<ConciergeV2ReminderItem[]> {
  const inserted: ConciergeV2ReminderItem[] = [];
  for (const reminder of params.reminders) {
    const reminderType = cleanString(reminder.reminderType || reminder.reminder_type, 80) || "custom";
    const channel = cleanString(reminder.channel, 40) || "email";
    const scheduledFor = cleanString(reminder.scheduledFor || reminder.scheduled_for, 80) || null;
    const status = cleanString(reminder.status, 60) || "draft";
    const res = await query<{ id: string }>(
      `insert into reminders (
         workspace_id, program_id, event_page_id, reminder_type, channel, audience_filter_json,
         scheduled_for, status, created_by_user_id, metadata_json
       )
       values ($1, $2, $3, $4, $5, '{}'::jsonb, $6::timestamptz, $7, $8, $9::jsonb)
       returning id`,
      [
        params.workspaceId,
        params.programId,
        params.eventPageId || null,
        reminderType,
        channel,
        scheduledFor,
        status,
        params.userId,
        JSON.stringify(reminder),
      ],
    );
    inserted.push({
      id: res.rows[0].id,
      title: cleanString(reminder.title, 220) || reminderType.replace(/_/g, " "),
      reminderType,
      channel,
      scheduledFor,
      status,
    });
  }
  return inserted;
}

async function insertChecklist(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  eventPageId?: string | null;
  items: any[];
}): Promise<ConciergeV2ChecklistItem[]> {
  const inserted: ConciergeV2ChecklistItem[] = [];
  for (let index = 0; index < params.items.length; index += 1) {
    const item = params.items[index];
    const title = cleanString(item.title, 220) || "Checklist item";
    const category = cleanString(item.category, 120) || null;
    const status = cleanString(item.status, 60) || "open";
    const res = await query<{ id: string }>(
      `insert into checklist_items (
         workspace_id, program_id, event_page_id, title, category, status, sort_order,
         metadata_json, created_by_user_id
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
       returning id`,
      [
        params.workspaceId,
        params.programId,
        params.eventPageId || null,
        title,
        category,
        status,
        index,
        JSON.stringify(item),
        params.userId,
      ],
    );
    inserted.push({ id: res.rows[0].id, title, category, status });
  }
  return inserted;
}

async function createEventPage(params: {
  workspaceId: string | null;
  userId: string;
  programId: string;
  title: string;
  eventHistoryId: string;
}) {
  const res = await query<{ id: string }>(
    `insert into event_pages (
       workspace_id, program_id, legacy_event_history_id, owner_user_id, title,
       target_type, visibility, share_token, status, metadata_json
     )
     values ($1, $2, $3, $4, $5, 'program', 'public', $6, 'published', $7::jsonb)
     returning id`,
    [
      params.workspaceId,
      params.programId,
      params.eventHistoryId,
      params.userId,
      params.title,
      token(),
      JSON.stringify({ source: "concierge_v2" }),
    ],
  );
  return res.rows[0].id;
}

function withStoredPublicSections(params: {
  data: Record<string, any>;
  forms: ConciergeV2FormSummary[];
  volunteerSlots: ConciergeV2VolunteerSlot[];
  paymentItems: ConciergeV2PaymentItem[];
  reminders: ConciergeV2ReminderItem[];
  checklistItems: ConciergeV2ChecklistItem[];
}) {
  const data = { ...(params.data || {}) };
  data.smartForms = {
    ...asRecord(data.smartForms),
    enabled: params.forms.length > 0,
    forms: params.forms,
  };
  data.volunteerSignup = {
    ...asRecord(data.volunteerSignup),
    enabled: params.volunteerSlots.length > 0,
    slots: params.volunteerSlots,
  };
  data.paymentTracker = {
    ...asRecord(data.paymentTracker),
    enabled: params.paymentItems.length > 0,
    manualOnly: true,
    items: params.paymentItems,
  };
  data.reminderTimeline = {
    ...asRecord(data.reminderTimeline),
    enabled: params.reminders.length > 0,
    providerStatus: "stub",
    items: params.reminders,
  };
  data.checklistItems = params.checklistItems;
  data.publicEvent = {
    ...asRecord(data.publicEvent),
    forms: params.forms,
    volunteerSlots: params.volunteerSlots,
    paymentItems: params.paymentItems,
    reminders: params.reminders,
    checklistItems: params.checklistItems,
  };
  return data;
}

export async function applyConciergeV2Session(params: {
  userId: string;
  sessionId: string;
  draft?: Record<string, any> | null;
}): Promise<ConciergeV2ApplyResult> {
  await ensureConciergeV2Tables();
  const session = await getConciergeV2Session({ userId: params.userId, sessionId: params.sessionId });
  if (!session) throw new Error("Concierge session not found.");

  const priorApply = asRecord(session.raw_output_json.applyResult);
  if (session.status === "applied" && cleanString(priorApply.eventHistoryId)) {
    return priorApply as ConciergeV2ApplyResult;
  }

  const draft = params.draft && Object.keys(params.draft).length
    ? params.draft
    : session.normalized_output_json;
  const workspaceId = session.workspace_id || (await getOrCreatePersonalWorkspace(params.userId));
  const programId = await insertProgram({ workspaceId, userId: params.userId, draft });
  const createdOccurrences: Array<ConciergeV2ScheduleItem & { id: string }> = [];
  const seriesItems = asArray(draft.series);
  const now = new Date();
  const materializeRange = {
    start: now.toISOString(),
    end: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90).toISOString(),
  };

  for (const series of seriesItems) {
    const seriesId = await insertSeries({
      workspaceId,
      userId: params.userId,
      programId,
      series,
    });
    const materialized = generateOccurrences({ ...series, id: seriesId }, materializeRange, []);
    for (const occurrence of materialized.slice(0, 40)) {
      createdOccurrences.push(
        await insertOccurrence({
          workspaceId,
          userId: params.userId,
          programId,
          seriesId,
          occurrence,
        }),
      );
    }
  }

  for (const occurrence of asArray(draft.occurrences)) {
    createdOccurrences.push(
      await insertOccurrence({
        workspaceId,
        userId: params.userId,
        programId,
        occurrence,
      }),
    );
  }

  const publicPayload = buildConciergeV2EventHistoryPayload({
    draft,
    programId,
    occurrenceRows: createdOccurrences,
  });
  const eventHistory = await insertEventHistory({
    userId: params.userId,
    title: publicPayload.title,
    data: publicPayload.data,
  });
  const eventPageId = await createEventPage({
    workspaceId,
    userId: params.userId,
    programId,
    title: publicPayload.title,
    eventHistoryId: eventHistory.id,
  });

  const storedForms = await insertForms({
    workspaceId,
    userId: params.userId,
    programId,
    eventPageId,
    forms: asArray(draft.forms),
  });
  const storedVolunteerSlots = await insertVolunteerSlots({
    workspaceId,
    userId: params.userId,
    programId,
    eventPageId,
    draft,
  });
  const storedPaymentItems = await insertPayments({
    workspaceId,
    userId: params.userId,
    programId,
    eventPageId,
    paymentItems: asArray(draft.paymentItems),
  });
  const storedReminders = await insertReminders({
    workspaceId,
    userId: params.userId,
    programId,
    eventPageId,
    reminders: asArray(draft.reminders),
  });
  const storedChecklistItems = await insertChecklist({
    workspaceId,
    userId: params.userId,
    programId,
    eventPageId,
    items: asArray(draft.checklistItems),
  });
  const storedPublicData = withStoredPublicSections({
    data: publicPayload.data,
    forms: storedForms,
    volunteerSlots: storedVolunteerSlots,
    paymentItems: storedPaymentItems,
    reminders: storedReminders,
    checklistItems: storedChecklistItems,
  });
  await updateEventHistoryData(eventHistory.id, storedPublicData);

  await query(
    `insert into audit_logs (workspace_id, actor_user_id, action, entity_type, entity_id, after_json)
     values ($1, $2, 'concierge_v2.apply', 'program', $3, $4::jsonb)`,
    [
      workspaceId,
      params.userId,
      programId,
      JSON.stringify({ eventHistoryId: eventHistory.id, eventPageId, sessionId: session.id }),
    ],
  );

  const publicSlug =
    typeof eventHistory.public_slug === "string" && eventHistory.public_slug.trim()
      ? eventHistory.public_slug.trim()
      : typeof eventHistory.data?.publicSlug === "string"
        ? eventHistory.data.publicSlug.trim()
        : null;
  const eventPath = `/event/${encodeURIComponent(publicSlug || eventHistory.id)}`;
  const applyResult: ConciergeV2ApplyResult = {
    sessionId: session.id,
    workspaceId,
    programId,
    eventPageId,
    eventHistoryId: eventHistory.id,
    publicSlug,
    eventPath,
    occurrenceCount: createdOccurrences.length,
    seriesCount: seriesItems.length,
    formCount: storedForms.length,
    volunteerSlotCount: storedVolunteerSlots.length,
    paymentRequestCount: storedPaymentItems.length,
    reminderCount: storedReminders.length,
    checklistCount: storedChecklistItems.length,
  };

  await query(
    `update concierge_sessions
     set status = 'applied',
         normalized_output_json = $3::jsonb,
         raw_output_json = raw_output_json || $4::jsonb,
         updated_at = now()
     where id = $1 and user_id = $2`,
    [
      session.id,
      params.userId,
      JSON.stringify(draft),
      JSON.stringify({ applyResult, appliedAt: new Date().toISOString() }),
    ],
  );
  await query(
    `update concierge_drafts
     set status = 'applied', applied_at = now()
     where session_id = $1`,
    [session.id],
  );

  invalidateUserHistory(params.userId);
  invalidateUserDashboard(params.userId);

  return applyResult;
}
