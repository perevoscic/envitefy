import { query } from "@/lib/db";
import { generateOccurrences, parseConciergeInput } from "./core.mjs";
import { createConciergeV2Occurrence } from "./schedule";
import { ensureConciergeV2Tables } from "./storage";
import { ConciergeV2OperationError } from "./operations";

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  program_id: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type SourceDocumentRow = {
  id: string;
  workspace_id: string | null;
  uploaded_by_user_id: string | null;
  source_kind: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  text_content: string | null;
  extracted_text: string | null;
  parse_status: string;
  parsed_json: Record<string, any>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ExtractedItemRow = {
  id: string;
  source_document_id: string;
  item_type: string;
  title: string | null;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  confidence: string | number | null;
  data_json: Record<string, any>;
  status: string;
  applied_entity_type: string | null;
  applied_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

type ProposedItem = {
  itemType: string;
  title: string;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  confidence?: number;
  data: Record<string, any>;
};

function cleanString(value: any, maxLength = 500): string {
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
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function nullableIso(value: any): string | null {
  const text = cleanString(value, 100);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function requireOwner(page: EventPageRow, userId: string | null | undefined) {
  if (!userId) throw new ConciergeV2OperationError("Sign in to import source material.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

function supportedSourceKind(value: any) {
  const kind = cleanString(value, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  return (
    [
      "pasted_text",
      "email",
      "school_flyer",
      "gymnastics_packet",
      "birthday_invitation",
      "class_newsletter",
      "sports_calendar",
      "group_chat",
      "pdf_schedule",
      "screenshot",
    ].includes(kind)
      ? kind
      : "pasted_text"
  );
}

function normalizeItem(row: ExtractedItemRow) {
  return {
    id: row.id,
    sourceDocumentId: row.source_document_id,
    itemType: row.item_type,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    confidence: Number(row.confidence || 0),
    data: asRecord(row.data_json),
    status: row.status,
    appliedEntityType: row.applied_entity_type,
    appliedEntityId: row.applied_entity_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDocument(row: SourceDocumentRow, items: ExtractedItemRow[] = []) {
  const parsed = asRecord(row.parsed_json);
  return {
    id: row.id,
    sourceKind: row.source_kind,
    fileName: row.file_name,
    fileType: row.file_type,
    parseStatus: row.parse_status,
    errorMessage: row.error_message,
    extractedText: row.extracted_text,
    textPreview: cleanString(row.extracted_text || row.text_content, 260),
    mode: cleanString(parsed.mode, 80) || null,
    eventType: cleanString(parsed.eventType, 80) || null,
    itemCounts: countItems(items.map(normalizeItem)),
    items: items.map(normalizeItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countItems(items: Array<ReturnType<typeof normalizeItem>>) {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      counts[item.status] = (counts[item.status] || 0) + 1;
      return counts;
    },
    { total: 0 } as Record<string, number>,
  );
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, ep.program_id, ep.owner_user_id,
       eh.title as event_title
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getOwnedImportPage(params: {
  eventHistoryId: string;
  userId: string;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  if (!page.program_id) throw new ConciergeV2OperationError("Import target program not found.", 404);
  return page;
}

function proposedOccurrence(item: any, fallbackType = "event"): ProposedItem | null {
  const title = cleanString(item.title, 220);
  if (!title) return null;
  const itemType = cleanString(item.type || item.occurrenceType, 80) === "deadline" ? "deadline" : "occurrence";
  return {
    itemType,
    title,
    description: cleanString(item.description || item.notes, 800) || null,
    startAt: nullableIso(item.startAt),
    endAt: nullableIso(item.endAt),
    confidence: itemType === "deadline" ? 0.76 : 0.82,
    data: {
      ...asRecord(item),
      type: cleanString(item.type || item.occurrenceType, 80) || fallbackType,
      startAt: nullableIso(item.startAt),
      endAt: nullableIso(item.endAt),
      locationText: cleanString(item.locationText || item.location, 220) || null,
      timezone: cleanString(item.timezone, 80) || "America/Chicago",
    },
  };
}

function buildProposedItems(draft: Record<string, any>): ProposedItem[] {
  const items: ProposedItem[] = [];
  for (const occurrence of asArray(draft.occurrences)) {
    const proposed = proposedOccurrence(occurrence);
    if (proposed) items.push(proposed);
  }
  for (const series of asArray(draft.series)) {
    const generated = generateOccurrences(series, {}, []).slice(0, 12);
    for (const occurrence of generated) {
      const proposed = proposedOccurrence(
        {
          ...occurrence,
          notes: `Generated from recurring series: ${cleanString(series.title, 180) || "Recurring schedule"}`,
        },
        cleanString(series.type, 80) || "recurring",
      );
      if (proposed) items.push({ ...proposed, confidence: 0.72 });
    }
  }
  for (const form of asArray(draft.forms)) {
    const title = cleanString(form.title, 220);
    if (title) {
      items.push({
        itemType: "form",
        title,
        description: cleanString(form.description, 800) || null,
        confidence: 0.7,
        data: form,
      });
    }
  }
  for (const reminder of asArray(draft.reminders)) {
    const title = cleanString(reminder.title, 220);
    if (title) {
      items.push({
        itemType: "reminder",
        title,
        description: cleanString(reminder.description || reminder.body, 800) || null,
        startAt: nullableIso(reminder.scheduledFor),
        confidence: 0.68,
        data: reminder,
      });
    }
  }
  for (const checklist of asArray(draft.checklistItems)) {
    const title = cleanString(checklist.title, 220);
    if (title) {
      items.push({
        itemType: "checklist",
        title,
        description: cleanString(checklist.description, 800) || null,
        confidence: 0.72,
        data: checklist,
      });
    }
  }
  for (const payment of asArray(draft.paymentItems)) {
    const title = cleanString(payment.title, 220);
    if (title) {
      items.push({
        itemType: "payment",
        title,
        description: cleanString(payment.description, 800) || null,
        startAt: nullableIso(payment.dueAt),
        confidence: 0.66,
        data: payment,
      });
    }
  }
  return items.slice(0, 80);
}

async function insertExtractedItems(sourceDocumentId: string, items: ProposedItem[]) {
  const inserted: ExtractedItemRow[] = [];
  for (const item of items) {
    const res = await query<ExtractedItemRow>(
      `insert into extracted_items (
         source_document_id, item_type, title, description, start_at, end_at,
         confidence, data_json, status
       )
       values ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8::jsonb, 'proposed')
       returning id, source_document_id, item_type, title, description, start_at, end_at,
         confidence, data_json, status, applied_entity_type, applied_entity_id, created_at, updated_at`,
      [
        sourceDocumentId,
        item.itemType,
        item.title,
        item.description || null,
        item.startAt || null,
        item.endAt || null,
        item.confidence || 0.6,
        JSON.stringify(item.data || {}),
      ],
    );
    if (res.rows[0]) inserted.push(res.rows[0]);
  }
  return inserted;
}

async function loadDocuments(params: { eventHistoryId: string; limit?: number }) {
  const res = await query<SourceDocumentRow>(
    `select id, workspace_id, uploaded_by_user_id, source_kind, file_url, file_name,
       file_type, text_content, extracted_text, parse_status, parsed_json, error_message,
       created_at, updated_at
     from source_documents
     where parsed_json->>'eventHistoryId' = $1
     order by created_at desc
     limit $2`,
    [params.eventHistoryId, params.limit || 12],
  );
  const documentIds = res.rows.map((row) => row.id);
  const itemsRes = documentIds.length
    ? await query<ExtractedItemRow>(
        `select id, source_document_id, item_type, title, description, start_at, end_at,
           confidence, data_json, status, applied_entity_type, applied_entity_id, created_at, updated_at
         from extracted_items
         where source_document_id = any($1::uuid[])
         order by created_at asc`,
        [documentIds],
      )
    : { rows: [] as ExtractedItemRow[] };
  const byDocument = new Map<string, ExtractedItemRow[]>();
  for (const item of itemsRes.rows) {
    byDocument.set(item.source_document_id, [...(byDocument.get(item.source_document_id) || []), item]);
  }
  return res.rows.map((row) => normalizeDocument(row, byDocument.get(row.id) || []));
}

export async function getConciergeV2ImportCenter(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const page = await getOwnedImportPage(params);
  const documents = await loadDocuments({ eventHistoryId: params.eventHistoryId });
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
    },
    supportedSources: [
      "pasted_text",
      "email",
      "school_flyer",
      "gymnastics_packet",
      "class_newsletter",
      "sports_calendar",
      "group_chat",
    ],
    providerStatus: {
      pastedText: "ready",
      imageOcr: "provider_setup_required",
      pdfOcr: "provider_setup_required",
    },
    documents,
  };
}

export async function createConciergeV2SourceImport(params: {
  eventHistoryId: string;
  userId: string;
  sourceKind?: string | null;
  text: string;
}) {
  const page = await getOwnedImportPage(params);
  const text = cleanString(params.text, 20_000);
  if (text.length < 10) throw new ConciergeV2OperationError("Paste at least a few details to import.", 400);
  const sourceKind = supportedSourceKind(params.sourceKind);
  const draft = parseConciergeInput(
    { text, sourceKind },
    {
      sourceKind,
      title: page.event_title,
      timezone: "America/Chicago",
    },
  );
  const proposedItems = buildProposedItems(draft);
  const docRes = await query<SourceDocumentRow>(
    `insert into source_documents (
       workspace_id, uploaded_by_user_id, source_kind, text_content, extracted_text,
       parse_status, parsed_json
     )
     values ($1, $2, $3, $4, $5, 'review', $6::jsonb)
     returning id, workspace_id, uploaded_by_user_id, source_kind, file_url, file_name,
       file_type, text_content, extracted_text, parse_status, parsed_json, error_message,
       created_at, updated_at`,
    [
      page.workspace_id,
      params.userId,
      sourceKind,
      text,
      text,
      JSON.stringify({
        ...draft,
        eventHistoryId: params.eventHistoryId,
        eventPageId: page.event_page_id,
        programId: page.program_id,
        extractedItemCount: proposedItems.length,
      }),
    ],
  );
  const document = docRes.rows[0];
  if (!document) throw new ConciergeV2OperationError("Unable to create import.", 500);
  const items = await insertExtractedItems(document.id, proposedItems);
  return normalizeDocument(document, items);
}

async function requireOwnedDocument(params: {
  eventHistoryId: string;
  userId: string;
  documentId: string;
}) {
  await getOwnedImportPage(params);
  const doc = await query<SourceDocumentRow>(
    `select id, workspace_id, uploaded_by_user_id, source_kind, file_url, file_name,
       file_type, text_content, extracted_text, parse_status, parsed_json, error_message,
       created_at, updated_at
     from source_documents
     where id = $1 and parsed_json->>'eventHistoryId' = $2 and uploaded_by_user_id = $3
     limit 1`,
    [params.documentId, params.eventHistoryId, params.userId],
  );
  const row = doc.rows[0];
  if (!row) throw new ConciergeV2OperationError("Import not found.", 404);
  return row;
}

export async function updateConciergeV2ExtractedItemStatus(params: {
  eventHistoryId: string;
  userId: string;
  documentId: string;
  itemId: string;
  status: string;
}) {
  await requireOwnedDocument(params);
  const status = cleanString(params.status, 40).toLowerCase();
  if (!["proposed", "accepted", "rejected"].includes(status)) {
    throw new ConciergeV2OperationError("Unsupported item status.", 400);
  }
  const updated = await query<ExtractedItemRow>(
    `update extracted_items
     set status = $3, updated_at = now()
     where id = $1 and source_document_id = $2 and status <> 'applied'
     returning id, source_document_id, item_type, title, description, start_at, end_at,
       confidence, data_json, status, applied_entity_type, applied_entity_id, created_at, updated_at`,
    [params.itemId, params.documentId, status],
  );
  const item = updated.rows[0];
  if (!item) throw new ConciergeV2OperationError("Extracted item not found.", 404);
  return normalizeItem(item);
}

async function applyForm(params: {
  page: EventPageRow;
  userId: string;
  data: Record<string, any>;
}) {
  const form = params.data;
  const formRes = await query<{ id: string }>(
    `insert into smart_forms (
       workspace_id, program_id, event_page_id, title, description, schema_json, status, created_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, 'active', $7)
     returning id`,
    [
      params.page.workspace_id,
      params.page.program_id,
      params.page.event_page_id,
      cleanString(form.title, 220) || "Smart Form",
      cleanString(form.description, 500) || null,
      JSON.stringify(form),
      params.userId,
    ],
  );
  const formId = formRes.rows[0]?.id;
  if (!formId) throw new ConciergeV2OperationError("Unable to apply form.", 500);
  const fields = asArray(form.fields);
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    await query(
      `insert into form_fields (form_id, field_key, label, field_type, required, options_json, sort_order)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7)
       on conflict (form_id, field_key) do nothing`,
      [
        formId,
        cleanString(field.key, 100) || `field_${index + 1}`,
        cleanString(field.label, 220) || "Question",
        cleanString(field.type, 80) || "text",
        Boolean(field.required),
        JSON.stringify(asArray(field.options)),
        index,
      ],
    );
  }
  return { type: "form", id: formId };
}

async function applyOperationalItem(params: {
  page: EventPageRow;
  userId: string;
  item: ReturnType<typeof normalizeItem>;
}) {
  const data = asRecord(params.item.data);
  if (params.item.itemType === "reminder") {
    const res = await query<{ id: string }>(
      `insert into reminders (
         workspace_id, program_id, event_page_id, reminder_type, channel,
         audience_filter_json, scheduled_for, status, created_by_user_id, metadata_json
       )
       values ($1, $2, $3, $4, $5, '{}'::jsonb, $6::timestamptz, $7, $8, $9::jsonb)
       returning id`,
      [
        params.page.workspace_id,
        params.page.program_id,
        params.page.event_page_id,
        cleanString(data.reminderType || data.type, 80) || "custom",
        cleanString(data.channel, 40) || "email",
        nullableIso(data.scheduledFor),
        nullableIso(data.scheduledFor) ? "scheduled" : "draft",
        params.userId,
        JSON.stringify({ ...data, title: params.item.title, createdVia: "source_import" }),
      ],
    );
    return { type: "reminder", id: res.rows[0]?.id };
  }
  if (params.item.itemType === "checklist") {
    const res = await query<{ id: string }>(
      `insert into checklist_items (
         workspace_id, program_id, event_page_id, title, category, status, metadata_json, created_by_user_id
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       returning id`,
      [
        params.page.workspace_id,
        params.page.program_id,
        params.page.event_page_id,
        cleanString(data.title, 220) || params.item.title || "Checklist item",
        cleanString(data.category, 120) || "Imported",
        cleanString(data.status, 40) || "open",
        JSON.stringify({ ...data, createdVia: "source_import" }),
        params.userId,
      ],
    );
    return { type: "checklist", id: res.rows[0]?.id };
  }
  if (params.item.itemType === "payment") {
    const res = await query<{ id: string }>(
      `insert into payment_requests (
         workspace_id, program_id, event_page_id, title, description, amount_cents,
         currency, due_at, external_payment_url, external_payment_note, status, created_by_user_id
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, $10, 'unpaid', $11)
       returning id`,
      [
        params.page.workspace_id,
        params.page.program_id,
        params.page.event_page_id,
        cleanString(data.title, 220) || params.item.title || "Payment request",
        cleanString(data.description, 500) || params.item.description || null,
        cents(data.amountCents || data.amount_cents),
        cleanString(data.currency, 12) || "USD",
        nullableIso(data.dueAt),
        cleanString(data.externalPaymentUrl, 500) || null,
        cleanString(data.externalPaymentNote, 500) || null,
        params.userId,
      ],
    );
    return { type: "payment", id: res.rows[0]?.id };
  }
  return null;
}

export async function applyConciergeV2AcceptedImportItems(params: {
  eventHistoryId: string;
  userId: string;
  documentId: string;
}) {
  const page = await getOwnedImportPage(params);
  await requireOwnedDocument(params);
  const itemsRes = await query<ExtractedItemRow>(
    `select id, source_document_id, item_type, title, description, start_at, end_at,
       confidence, data_json, status, applied_entity_type, applied_entity_id, created_at, updated_at
     from extracted_items
     where source_document_id = $1 and status = 'accepted'
     order by created_at asc`,
    [params.documentId],
  );
  const items = itemsRes.rows.map(normalizeItem);
  if (!items.length) throw new ConciergeV2OperationError("Accept at least one extracted item before applying.", 400);

  const applied: Array<{ itemId: string; type: string; id: string }> = [];
  for (const item of items) {
    let appliedEntity: { type: string; id?: string | null } | null = null;
    if (item.itemType === "occurrence" || item.itemType === "deadline") {
      const data = asRecord(item.data);
      const occurrence = await createConciergeV2Occurrence({
        eventHistoryId: params.eventHistoryId,
        userId: params.userId,
        title: cleanString(data.title, 220) || item.title || "Imported schedule item",
        occurrenceType: item.itemType === "deadline" ? "deadline" : cleanString(data.type, 80) || "event",
        startAt: cleanString(data.startAt, 100) || item.startAt,
        endAt: cleanString(data.endAt, 100) || item.endAt,
        timezone: cleanString(data.timezone, 80) || "America/Chicago",
        locationText: cleanString(data.locationText || data.location, 220) || null,
        notes: cleanString(data.notes || item.description, 1000) || "Imported from source material.",
      });
      appliedEntity = { type: "occurrence", id: occurrence.id };
    } else if (item.itemType === "form") {
      appliedEntity = await applyForm({ page, userId: params.userId, data: asRecord(item.data) });
    } else {
      appliedEntity = await applyOperationalItem({ page, userId: params.userId, item });
    }
    if (!appliedEntity?.id) continue;
    await query(
      `update extracted_items
       set status = 'applied', applied_entity_type = $3, applied_entity_id = $4, updated_at = now()
       where id = $1 and source_document_id = $2`,
      [item.id, params.documentId, appliedEntity.type, appliedEntity.id],
    );
    applied.push({ itemId: item.id, type: appliedEntity.type, id: appliedEntity.id });
  }

  await query(
    `update source_documents
     set parse_status = 'applied',
         parsed_json = parsed_json || $3::jsonb,
         updated_at = now()
     where id = $1 and parsed_json->>'eventHistoryId' = $2`,
    [
      params.documentId,
      params.eventHistoryId,
      JSON.stringify({ appliedAt: new Date().toISOString(), appliedCount: applied.length }),
    ],
  );
  return {
    appliedCount: applied.length,
    applied,
    imports: await loadDocuments({ eventHistoryId: params.eventHistoryId }),
  };
}
