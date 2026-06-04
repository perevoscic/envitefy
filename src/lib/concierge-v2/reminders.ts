import { query } from "@/lib/db";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  program_id: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type ReminderRow = {
  id: string;
  workspace_id: string | null;
  program_id: string | null;
  event_page_id: string | null;
  reminder_type: string;
  channel: string;
  audience_filter_json: Record<string, any>;
  scheduled_for: string | null;
  status: string;
  metadata_json: Record<string, any>;
  delivery_count?: string | number | null;
  dry_run_count?: string | number | null;
  last_delivery_at?: string | null;
};

type DeliveryRow = {
  id: string;
  reminder_id: string | null;
  guest_name: string | null;
  channel: string;
  to_address: string | null;
  status: string;
  provider: string | null;
  error_message: string | null;
  metadata_json: Record<string, any>;
  created_at: string;
};

type ReminderRecipient = {
  guestName: string | null;
  email: string;
  source: "rsvp" | "form" | "volunteer";
};

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function reminderTitle(row: ReminderRow): string {
  const metadata = asRecord(row.metadata_json);
  return cleanString(metadata.title, 220) || row.reminder_type.replace(/_/g, " ");
}

function normalizeEmail(value: any): string {
  const email = cleanString(value, 240).toLowerCase();
  return email.includes("@") ? email : "";
}

function requireOwner(page: EventPageRow, userId: string | null | undefined) {
  if (!userId) throw new ConciergeV2OperationError("Sign in to manage reminders.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, ep.program_id, ep.owner_user_id, eh.title as event_title
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getOwnedReminder(params: {
  eventHistoryId: string;
  reminderId: string;
  userId: string;
}): Promise<{ page: EventPageRow; reminder: ReminderRow }> {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  const reminder = await query<ReminderRow>(
    `select id, workspace_id, program_id, event_page_id, reminder_type, channel,
       audience_filter_json, scheduled_for, status, metadata_json
     from reminders
     where id = $1 and event_page_id = $2
     limit 1`,
    [params.reminderId, page.event_page_id],
  );
  const row = reminder.rows[0];
  if (!row) throw new ConciergeV2OperationError("Reminder not found.", 404);
  return { page, reminder: row };
}

async function loadReminderAudience(params: {
  eventHistoryId: string;
  eventPageId: string;
}): Promise<{ recipients: ReminderRecipient[]; missingContactCount: number }> {
  const [rsvps, forms, volunteers] = await Promise.all([
    query<{ guest_name: string | null; email: string | null }>(
      `select name as guest_name, email
       from rsvp_responses
       where event_id = $1 and email is not null
       order by updated_at desc nulls last, created_at desc nulls last
       limit 250`,
      [params.eventHistoryId],
    ).catch(() => ({ rows: [] })),
    query<{ guest_name: string | null; email: string | null }>(
      `select fr.guest_name, fr.guest_email as email
       from form_responses fr
       join smart_forms sf on sf.id = fr.form_id
       where sf.event_page_id = $1 and fr.guest_email is not null
       order by fr.created_at desc
       limit 250`,
      [params.eventPageId],
    ),
    query<{ guest_name: string | null; email: string | null }>(
      `select vc.guest_name, vc.guest_email as email
       from volunteer_claims vc
       join volunteer_slots vs on vs.id = vc.slot_id
       join volunteer_boards vb on vb.id = vs.board_id
       where vb.event_page_id = $1 and vc.status = 'claimed' and vc.guest_email is not null
       order by vc.created_at desc
       limit 250`,
      [params.eventPageId],
    ),
  ]);

  const recipients = new Map<string, ReminderRecipient>();
  let missingContactCount = 0;
  const addRows = (
    rows: Array<{ guest_name: string | null; email: string | null }>,
    source: ReminderRecipient["source"],
  ) => {
    for (const row of rows) {
      const email = normalizeEmail(row.email);
      if (!email) {
        missingContactCount += 1;
        continue;
      }
      if (!recipients.has(email)) {
        recipients.set(email, {
          guestName: cleanString(row.guest_name, 180) || null,
          email,
          source,
        });
      }
    }
  };
  addRows(rsvps.rows, "rsvp");
  addRows(forms.rows, "form");
  addRows(volunteers.rows, "volunteer");
  return { recipients: [...recipients.values()], missingContactCount };
}

function buildReminderPreview(params: {
  eventHistoryId: string;
  page: EventPageRow;
  reminder: ReminderRow;
  recipientCount: number;
  missingContactCount: number;
}) {
  const metadata = asRecord(params.reminder.metadata_json);
  const title = reminderTitle(params.reminder);
  const subject =
    cleanString(metadata.subject, 180) ||
    `Reminder: ${params.page.event_title}`;
  const scheduledLine = params.reminder.scheduled_for
    ? `Scheduled for ${new Date(params.reminder.scheduled_for).toLocaleString()}.`
    : "This reminder is not scheduled yet.";
  const body =
    cleanString(metadata.body, 4000) ||
    [
      `Reminder for ${params.page.event_title}: ${title}.`,
      scheduledLine,
      "Open the Envitefy event page for the latest details.",
      `/event/${encodeURIComponent(params.eventHistoryId)}`,
    ].join("\n\n");
  return {
    title,
    subject,
    body,
    channel: cleanString(params.reminder.channel, 40) || "email",
    status: cleanString(params.reminder.status, 40) || "draft",
    scheduledFor: params.reminder.scheduled_for,
    audienceLabel:
      params.recipientCount === 1
        ? "1 reachable guest"
        : `${params.recipientCount} reachable guests`,
    recipientCount: params.recipientCount,
    missingContactCount: params.missingContactCount,
    providerStatus: "stub",
  };
}

async function recentDeliveries(reminderIds: string[]): Promise<Map<string, DeliveryRow[]>> {
  if (!reminderIds.length) return new Map();
  const rows = await query<DeliveryRow>(
    `select id, reminder_id, guest_name, channel, to_address, status, provider,
       error_message, metadata_json, created_at
     from message_deliveries
     where reminder_id = any($1::uuid[])
     order by created_at desc
     limit 120`,
    [reminderIds],
  );
  const out = new Map<string, DeliveryRow[]>();
  for (const row of rows.rows) {
    if (!row.reminder_id) continue;
    out.set(row.reminder_id, [...(out.get(row.reminder_id) || []), row]);
  }
  return out;
}

export async function getConciergeV2ReminderQueue(params: {
  eventHistoryId: string;
  userId: string;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  const audience = await loadReminderAudience({
    eventHistoryId: params.eventHistoryId,
    eventPageId: page.event_page_id,
  });
  const reminders = await query<ReminderRow>(
    `select r.id, r.workspace_id, r.program_id, r.event_page_id, r.reminder_type, r.channel,
       r.audience_filter_json, r.scheduled_for, r.status, r.metadata_json,
       count(md.id) as delivery_count,
       count(md.id) filter (where md.status = 'dry_run') as dry_run_count,
       max(md.created_at) as last_delivery_at
     from reminders r
     left join message_deliveries md on md.reminder_id = r.id
     where r.event_page_id = $1
     group by r.id
     order by r.scheduled_for asc nulls last, r.created_at asc`,
    [page.event_page_id],
  );
  const deliveriesByReminder = await recentDeliveries(reminders.rows.map((row) => row.id));
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
    },
    audience: {
      recipientCount: audience.recipients.length,
      missingContactCount: audience.missingContactCount,
      sampleRecipients: audience.recipients.slice(0, 8),
    },
    reminders: reminders.rows.map((row) => ({
      id: row.id,
      reminderType: row.reminder_type,
      title: reminderTitle(row),
      channel: row.channel || "email",
      scheduledFor: row.scheduled_for,
      status: row.status,
      deliveryCount: Number(row.delivery_count || 0),
      dryRunCount: Number(row.dry_run_count || 0),
      lastDeliveryAt: row.last_delivery_at || null,
      preview: buildReminderPreview({
        eventHistoryId: params.eventHistoryId,
        page,
        reminder: row,
        recipientCount: audience.recipients.length,
        missingContactCount: audience.missingContactCount,
      }),
      deliveries: (deliveriesByReminder.get(row.id) || []).slice(0, 6).map((delivery) => ({
        id: delivery.id,
        guestName: delivery.guest_name,
        channel: delivery.channel,
        toAddress: delivery.to_address,
        status: delivery.status,
        provider: delivery.provider,
        errorMessage: delivery.error_message,
        createdAt: delivery.created_at,
      })),
    })),
  };
}

export async function previewConciergeV2Reminder(params: {
  eventHistoryId: string;
  reminderId: string;
  userId: string;
}) {
  const { page, reminder } = await getOwnedReminder(params);
  const audience = await loadReminderAudience({
    eventHistoryId: params.eventHistoryId,
    eventPageId: page.event_page_id,
  });
  return buildReminderPreview({
    eventHistoryId: params.eventHistoryId,
    page,
    reminder,
    recipientCount: audience.recipients.length,
    missingContactCount: audience.missingContactCount,
  });
}

export async function dryRunConciergeV2Reminder(params: {
  eventHistoryId: string;
  reminderId: string;
  userId: string;
}) {
  const { page, reminder } = await getOwnedReminder(params);
  const audience = await loadReminderAudience({
    eventHistoryId: params.eventHistoryId,
    eventPageId: page.event_page_id,
  });
  const preview = buildReminderPreview({
    eventHistoryId: params.eventHistoryId,
    page,
    reminder,
    recipientCount: audience.recipients.length,
    missingContactCount: audience.missingContactCount,
  });
  const recipients = audience.recipients.length
    ? audience.recipients
    : [{ guestName: null, email: "", source: "rsvp" as const }];
  const created: DeliveryRow[] = [];
  for (const recipient of recipients.slice(0, 250)) {
    const delivery = await query<DeliveryRow>(
      `insert into message_deliveries (
         reminder_id, guest_name, channel, to_address, status, provider, error_message, metadata_json
       )
       values ($1, $2, $3, $4, 'dry_run', 'stub', $5, $6::jsonb)
       returning id, reminder_id, guest_name, channel, to_address, status, provider,
         error_message, metadata_json, created_at`,
      [
        reminder.id,
        recipient.guestName,
        preview.channel,
        recipient.email || null,
        recipient.email ? null : "No reachable recipients matched this reminder.",
        JSON.stringify({
          preview,
          recipientSource: recipient.source,
          providerCalled: false,
        }),
      ],
    );
    created.push(delivery.rows[0]);
  }
  return {
    preview,
    deliveryCount: created.length,
    deliveries: created.map((delivery) => ({
      id: delivery.id,
      guestName: delivery.guest_name,
      toAddress: delivery.to_address,
      status: delivery.status,
      provider: delivery.provider,
      createdAt: delivery.created_at,
    })),
  };
}

export async function updateConciergeV2ReminderStatus(params: {
  eventHistoryId: string;
  reminderId: string;
  userId: string;
  status: string;
}) {
  const { page, reminder } = await getOwnedReminder(params);
  const status = cleanString(params.status, 40).toLowerCase();
  if (!["draft", "scheduled", "canceled"].includes(status)) {
    throw new ConciergeV2OperationError("Unsupported reminder status.", 400);
  }
  const updated = await query<ReminderRow>(
    `update reminders
     set status = $3, updated_at = now()
     where id = $1 and event_page_id = $2
     returning id, workspace_id, program_id, event_page_id, reminder_type, channel,
       audience_filter_json, scheduled_for, status, metadata_json`,
    [reminder.id, page.event_page_id, status],
  );
  const row = updated.rows[0];
  return {
    id: row.id,
    title: reminderTitle(row),
    status: row.status,
    scheduledFor: row.scheduled_for,
  };
}

export async function dispatchDueConciergeV2Reminders(params: {
  now?: Date | string;
  limit?: number;
  dryRun?: boolean;
} = {}) {
  await ensureConciergeV2Tables();
  const now = params.now instanceof Date ? params.now.toISOString() : params.now || new Date().toISOString();
  const limit = Math.max(1, Math.min(100, Number(params.limit || 50)));
  const due = await query<
    ReminderRow & { legacy_event_history_id: string; owner_user_id: string | null; event_title: string }
  >(
    `select r.id, r.workspace_id, r.program_id, r.event_page_id, r.reminder_type, r.channel,
       r.audience_filter_json, r.scheduled_for, r.status, r.metadata_json,
       ep.legacy_event_history_id, ep.owner_user_id, ep.title as event_title
     from reminders r
     join event_pages ep on ep.id = r.event_page_id
     where r.status = 'scheduled'
       and r.scheduled_for is not null
       and r.scheduled_for <= $1::timestamptz
     order by r.scheduled_for asc
     limit $2`,
    [now, limit],
  );
  const processed = [];
  for (const reminder of due.rows) {
    const page: EventPageRow = {
      event_page_id: String(reminder.event_page_id),
      workspace_id: reminder.workspace_id,
      program_id: reminder.program_id,
      owner_user_id: reminder.owner_user_id,
      event_title: reminder.event_title,
    };
    const audience = await loadReminderAudience({
      eventHistoryId: String(reminder.legacy_event_history_id),
      eventPageId: page.event_page_id,
    });
    const preview = buildReminderPreview({
      eventHistoryId: String(reminder.legacy_event_history_id),
      page,
      reminder,
      recipientCount: audience.recipients.length,
      missingContactCount: audience.missingContactCount,
    });
    await query(
      `insert into message_deliveries (
         reminder_id, channel, status, provider, error_message, metadata_json
       )
       values ($1, $2, $3, 'stub', $4, $5::jsonb)`,
      [
        reminder.id,
        preview.channel,
        params.dryRun === false ? "blocked" : "dry_run",
        params.dryRun === false
          ? "Reminder provider is not configured; no message was sent."
          : "Dry run only; no provider was called.",
        JSON.stringify({ preview, providerCalled: false }),
      ],
    );
    processed.push({ reminderId: reminder.id, title: preview.title, status: params.dryRun === false ? "blocked" : "dry_run" });
  }
  return { processedCount: processed.length, processed };
}
