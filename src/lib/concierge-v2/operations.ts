import { query } from "@/lib/db";
import { createStripeCheckoutSession } from "./providers";
import { ensureConciergeV2Tables } from "./storage";

export class ConciergeV2OperationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ConciergeV2OperationError";
    this.status = status;
  }
}

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  program_id: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type FormRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  response_count: string | number;
};

type FormFieldRow = {
  form_id: string;
  field_key: string;
  label: string;
  field_type: string;
  required: boolean;
  options_json: any;
  sort_order: number;
};

type FormResponseRow = {
  id: string;
  form_id: string;
  guest_name: string | null;
  guest_email: string | null;
  answers_json: Record<string, any>;
  status: string;
  submitted_at: string | null;
  created_at: string;
};

type VolunteerSlotRow = {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  quantity_needed: number;
  claimed_quantity: string | number | null;
  group_name: string | null;
};

type VolunteerClaimRow = {
  id: string;
  slot_id: string;
  guest_name: string | null;
  guest_email: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  claimed_at: string | null;
  created_at: string;
};

type PaymentRequestRow = {
  id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  due_at: string | null;
  status: string;
  external_payment_url: string | null;
  external_payment_note: string | null;
};

type ReminderRow = {
  id: string;
  reminder_type: string;
  channel: string;
  scheduled_for: string | null;
  status: string;
  metadata_json: Record<string, any>;
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

function positiveInteger(value: any, fallback = 1): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(99, Math.round(parsed))) : fallback;
}

function isEmptyAnswer(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function sanitizeAnswers(value: any): Record<string, string | number | boolean | string[] | null> {
  const record = asRecord(value);
  const out: Record<string, string | number | boolean | string[] | null> = {};
  for (const [key, rawValue] of Object.entries(record).slice(0, 80)) {
    const cleanKey = key.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 100);
    if (!cleanKey) continue;
    if (typeof rawValue === "string") {
      out[cleanKey] = rawValue.replace(/\s+/g, " ").trim().slice(0, 2000) || null;
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      out[cleanKey] = rawValue;
    } else if (typeof rawValue === "boolean" || rawValue === null) {
      out[cleanKey] = rawValue;
    } else if (Array.isArray(rawValue)) {
      out[cleanKey] = rawValue
        .map((item) => cleanString(item, 500))
        .filter(Boolean)
        .slice(0, 30);
    }
  }
  return out;
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

function requireOwner(page: EventPageRow, userId: string | null | undefined) {
  if (!userId) throw new ConciergeV2OperationError("Sign in to manage this event.", 401);
  if (page.owner_user_id !== userId) {
    throw new ConciergeV2OperationError("You do not have access to this event.", 403);
  }
}

export async function getConciergeV2OperationsSummary(params: {
  eventHistoryId: string;
  userId?: string | null;
  includePrivate?: boolean;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  if (params.includePrivate) requireOwner(page, params.userId);

  const formsRes = await query<FormRow>(
    `select sf.id, sf.title, sf.description, sf.status, count(fr.id) as response_count
     from smart_forms sf
     left join form_responses fr on fr.form_id = sf.id
     where sf.event_page_id = $1
     group by sf.id
     order by sf.created_at asc`,
    [page.event_page_id],
  );
  const formIds = formsRes.rows.map((form) => form.id);
  const fieldsRes = formIds.length
    ? await query<FormFieldRow>(
        `select form_id, field_key, label, field_type, required, options_json, sort_order
         from form_fields
         where form_id = any($1::uuid[])
         order by sort_order asc, created_at asc`,
        [formIds],
      )
    : { rows: [] as FormFieldRow[] };
  const responsesRes = params.includePrivate && formIds.length
    ? await query<FormResponseRow>(
        `select id, form_id, guest_name, guest_email, answers_json, status, submitted_at, created_at
         from form_responses
         where form_id = any($1::uuid[])
         order by created_at desc`,
        [formIds],
      )
    : { rows: [] as FormResponseRow[] };

  const slotsRes = await query<VolunteerSlotRow>(
    `select vs.id, vs.board_id, vs.title, vs.description, vs.quantity_needed,
       coalesce(vs.claimed_quantity, 0) as claimed_quantity,
       vs.requirements_json->>'group' as group_name
     from volunteer_slots vs
     join volunteer_boards vb on vb.id = vs.board_id
     where vb.event_page_id = $1
     order by vs.sort_order asc, vs.created_at asc`,
    [page.event_page_id],
  );
  const slotIds = slotsRes.rows.map((slot) => slot.id);
  const claimsRes = params.includePrivate && slotIds.length
    ? await query<VolunteerClaimRow>(
        `select id, slot_id, guest_name, guest_email, quantity, notes, status, claimed_at, created_at
         from volunteer_claims
         where slot_id = any($1::uuid[])
         order by created_at desc`,
        [slotIds],
      )
    : { rows: [] as VolunteerClaimRow[] };

  const paymentsRes = await query<PaymentRequestRow>(
    `select id, title, description, amount_cents, currency, due_at, status,
       external_payment_url, external_payment_note
     from payment_requests
     where event_page_id = $1
     order by created_at asc`,
    [page.event_page_id],
  );

  const remindersRes = await query<ReminderRow>(
    `select id, reminder_type, channel, scheduled_for, status, metadata_json
     from reminders
     where event_page_id = $1
     order by scheduled_for asc nulls last, created_at asc`,
    [page.event_page_id],
  );

  const fieldsByForm = new Map<string, FormFieldRow[]>();
  for (const field of fieldsRes.rows) {
    fieldsByForm.set(field.form_id, [...(fieldsByForm.get(field.form_id) || []), field]);
  }
  const responsesByForm = new Map<string, FormResponseRow[]>();
  for (const response of responsesRes.rows) {
    responsesByForm.set(response.form_id, [...(responsesByForm.get(response.form_id) || []), response]);
  }
  const claimsBySlot = new Map<string, VolunteerClaimRow[]>();
  for (const claim of claimsRes.rows) {
    claimsBySlot.set(claim.slot_id, [...(claimsBySlot.get(claim.slot_id) || []), claim]);
  }

  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: page.event_page_id,
      title: page.event_title,
      isOwner: Boolean(params.userId && params.userId === page.owner_user_id),
    },
    forms: formsRes.rows.map((form) => ({
      id: form.id,
      title: form.title,
      description: form.description,
      status: form.status,
      responseCount: Number(form.response_count || 0),
      fields: (fieldsByForm.get(form.id) || []).map((field) => ({
        key: field.field_key,
        label: field.label,
        type: field.field_type,
        required: field.required,
        options: asArray(field.options_json),
      })),
      responses: (responsesByForm.get(form.id) || []).map((response) => ({
        id: response.id,
        guestName: response.guest_name,
        guestEmail: response.guest_email,
        answers: asRecord(response.answers_json),
        status: response.status,
        submittedAt: response.submitted_at || response.created_at,
      })),
    })),
    volunteerSlots: slotsRes.rows.map((slot) => ({
      id: slot.id,
      boardId: slot.board_id,
      title: slot.title,
      description: slot.description,
      group: slot.group_name,
      quantityNeeded: Number(slot.quantity_needed || 1),
      claimedQuantity: Number(slot.claimed_quantity || 0),
      claims: (claimsBySlot.get(slot.id) || []).map((claim) => ({
        id: claim.id,
        guestName: claim.guest_name,
        guestEmail: claim.guest_email,
        quantity: Number(claim.quantity || 1),
        notes: claim.notes,
        status: claim.status,
        claimedAt: claim.claimed_at || claim.created_at,
      })),
    })),
    paymentRequests: paymentsRes.rows.map((payment) => ({
      id: payment.id,
      title: payment.title,
      description: payment.description,
      amountCents: Number(payment.amount_cents || 0),
      currency: payment.currency || "USD",
      dueAt: payment.due_at,
      status: payment.status,
      externalPaymentUrl: payment.external_payment_url,
      externalPaymentNote: payment.external_payment_note,
    })),
    reminders: remindersRes.rows.map((reminder) => ({
      id: reminder.id,
      title: cleanString(reminder.metadata_json?.title, 220) || reminder.reminder_type.replace(/_/g, " "),
      reminderType: reminder.reminder_type,
      channel: reminder.channel,
      scheduledFor: reminder.scheduled_for,
      status: reminder.status,
    })),
  };
}

export async function submitConciergeV2FormResponse(params: {
  eventHistoryId: string;
  formId: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  answers: any;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  const formRes = await query<{ id: string }>(
    `select sf.id
     from smart_forms sf
     where sf.id = $1 and sf.event_page_id = $2 and sf.status = 'active'
     limit 1`,
    [params.formId, page.event_page_id],
  );
  if (!formRes.rows[0]) throw new ConciergeV2OperationError("Form not found.", 404);
  const fields = await query<FormFieldRow>(
    `select form_id, field_key, label, field_type, required, options_json, sort_order
     from form_fields
     where form_id = $1
     order by sort_order asc, created_at asc`,
    [params.formId],
  );
  const answers = sanitizeAnswers(params.answers);
  const missing = fields.rows
    .filter((field) => field.required && isEmptyAnswer(answers[field.field_key]))
    .map((field) => field.label);
  if (missing.length) {
    throw new ConciergeV2OperationError(`Missing required answer: ${missing[0]}`, 400);
  }
  const guestName = cleanString(params.guestName, 180);
  const guestEmail = cleanString(params.guestEmail, 240).toLowerCase();
  if (!guestName) throw new ConciergeV2OperationError("Name is required.", 400);

  const created = await query<FormResponseRow>(
    `insert into form_responses (
       form_id, user_id, guest_name, guest_email, answers_json, status, submitted_at
     )
     values ($1, $2, $3, $4, $5::jsonb, 'submitted', now())
     returning id, form_id, guest_name, guest_email, answers_json, status, submitted_at, created_at`,
    [
      params.formId,
      params.userId || null,
      guestName,
      guestEmail || null,
      JSON.stringify(answers),
    ],
  );
  return created.rows[0];
}

export async function claimConciergeV2VolunteerSlot(params: {
  eventHistoryId: string;
  slotId: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  quantity?: number | null;
  notes?: string | null;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  const guestName = cleanString(params.guestName, 180);
  const guestEmail = cleanString(params.guestEmail, 240).toLowerCase();
  const quantity = positiveInteger(params.quantity, 1);
  const notes = cleanString(params.notes, 1000) || null;
  if (!guestName) throw new ConciergeV2OperationError("Name is required.", 400);

  const slotRes = await query<{ id: string; quantity_needed: number }>(
    `select vs.id, vs.quantity_needed
     from volunteer_slots vs
     join volunteer_boards vb on vb.id = vs.board_id
     where vs.id = $1 and vb.event_page_id = $2 and vb.status = 'active'
     limit 1`,
    [params.slotId, page.event_page_id],
  );
  const slot = slotRes.rows[0];
  if (!slot) throw new ConciergeV2OperationError("Volunteer slot not found.", 404);

  if (guestEmail) {
    const duplicate = await query<{ id: string }>(
      `select id
       from volunteer_claims
       where slot_id = $1 and lower(guest_email) = lower($2) and status = 'claimed'
       limit 1`,
      [params.slotId, guestEmail],
    );
    if (duplicate.rows[0]) {
      throw new ConciergeV2OperationError("This email has already claimed this slot.", 409);
    }
  }

  let claimRes: { rows: VolunteerClaimRow[] };
  try {
    claimRes = await query<VolunteerClaimRow>(
      `with updated_slot as (
         update volunteer_slots vs
         set claimed_quantity = coalesce(vs.claimed_quantity, 0) + $5,
             updated_at = now()
         from volunteer_boards vb
         where vs.id = $1
           and vb.id = vs.board_id
           and vb.event_page_id = $7
           and vb.status = 'active'
           and coalesce(vs.claimed_quantity, 0) + $5 <= vs.quantity_needed
         returning vs.id
       )
       insert into volunteer_claims (
         slot_id, user_id, guest_name, guest_email, quantity, notes, status, claimed_at
       )
       select $1, $2, $3, $4, $5, $6, 'claimed', now()
       from updated_slot
       returning id, slot_id, guest_name, guest_email, quantity, notes, status, claimed_at, created_at`,
      [
        params.slotId,
        params.userId || null,
        guestName,
        guestEmail || null,
        quantity,
        notes,
        page.event_page_id,
      ],
    );
  } catch (error: any) {
    if (String(error?.code || "") === "23505") {
      throw new ConciergeV2OperationError("This email has already claimed this slot.", 409);
    }
    throw error;
  }
  const claim = claimRes.rows[0];
  if (!claim) throw new ConciergeV2OperationError("This slot is already full.", 409);
  return claim;
}

export async function updateConciergeV2PaymentStatus(params: {
  eventHistoryId: string;
  paymentRequestId: string;
  userId: string;
  status: string;
  notes?: string | null;
  manualMethod?: string | null;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  requireOwner(page, params.userId);
  const status = cleanString(params.status, 40).toLowerCase();
  if (!["unpaid", "pending", "paid", "waived", "refunded", "canceled"].includes(status)) {
    throw new ConciergeV2OperationError("Unsupported payment status.", 400);
  }
  const updated = await query<PaymentRequestRow>(
    `update payment_requests
     set status = $4, updated_at = now()
     where id = $1 and event_page_id = $2 and created_by_user_id = $3
     returning id, title, description, amount_cents, currency, due_at, status,
       external_payment_url, external_payment_note`,
    [params.paymentRequestId, page.event_page_id, params.userId, status],
  );
  const payment = updated.rows[0];
  if (!payment) throw new ConciergeV2OperationError("Payment request not found.", 404);
  if (["paid", "waived", "refunded"].includes(status)) {
    await query(
      `insert into payments (
         payment_request_id, user_id, amount_cents, currency, status, provider,
         manual_method, paid_at, notes
       )
       values ($1, $2, $3, $4, $5, 'manual', $6, now(), $7)`,
      [
        payment.id,
        params.userId,
        Number(payment.amount_cents || 0),
        payment.currency || "USD",
        status,
        cleanString(params.manualMethod, 120) || null,
        cleanString(params.notes, 1000) || null,
      ],
    );
  }
  return {
    id: payment.id,
    title: payment.title,
    amountCents: Number(payment.amount_cents || 0),
    currency: payment.currency || "USD",
    status: payment.status,
  };
}

function baseUrl(origin?: string | null) {
  return (
    cleanString(origin, 500) ||
    cleanString(process.env.NEXT_PUBLIC_APP_URL, 500) ||
    cleanString(process.env.NEXTAUTH_URL, 500) ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function createConciergeV2PaymentCheckout(params: {
  eventHistoryId: string;
  paymentRequestId: string;
  origin?: string | null;
  guestName?: string | null;
  userId?: string | null;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  const paymentRes = await query<PaymentRequestRow>(
    `select id, title, description, amount_cents, currency, due_at, status,
       external_payment_url, external_payment_note
     from payment_requests
     where id = $1 and event_page_id = $2 and status not in ('paid', 'waived', 'refunded', 'canceled')
     limit 1`,
    [params.paymentRequestId, page.event_page_id],
  );
  const payment = paymentRes.rows[0];
  if (!payment) throw new ConciergeV2OperationError("Payment request not found.", 404);
  const amountCents = Number(payment.amount_cents || 0);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new ConciergeV2OperationError("Payment request amount must be at least 50 cents.", 400);
  }
  const root = baseUrl(params.origin);
  const checkout = await createStripeCheckoutSession({
    paymentRequestId: payment.id,
    eventHistoryId: params.eventHistoryId,
    title: payment.title,
    amountCents,
    currency: payment.currency || "USD",
    successUrl: `${root}/event/${encodeURIComponent(params.eventHistoryId)}?payment=success`,
    cancelUrl: `${root}/event/${encodeURIComponent(params.eventHistoryId)}?payment=cancelled`,
  });
  await query(
    `insert into payments (
       payment_request_id, user_id, guest_name, amount_cents, currency, status, provider,
       provider_reference, provider_payload_json, notes
     )
     values ($1, $2, $3, $4, $5, $6, 'stripe', $7, $8::jsonb, $9)`,
    [
      payment.id,
      params.userId || null,
      cleanString(params.guestName, 180) || null,
      amountCents,
      payment.currency || "USD",
      checkout.status === "created" ? "pending" : checkout.status,
      checkout.providerReference || null,
      JSON.stringify(checkout.providerPayload || {}),
      checkout.errorMessage || null,
    ],
  );
  if (checkout.status === "created" && checkout.url) {
    await query(
      `update payment_requests
       set status = 'pending', external_payment_url = $2,
         external_payment_note = 'Stripe Checkout session created.', updated_at = now()
       where id = $1`,
      [payment.id, checkout.url],
    );
  }
  return {
    paymentRequestId: payment.id,
    status: checkout.status,
    provider: checkout.provider,
    checkoutUrl: checkout.url || null,
    providerReference: checkout.providerReference || null,
    errorMessage: checkout.errorMessage || null,
  };
}

export async function reconcileConciergeV2StripeCheckout(params: { payload: Record<string, any> }) {
  await ensureConciergeV2Tables();
  const payload = asRecord(params.payload);
  const type = cleanString(payload.type, 120);
  const session = asRecord(asRecord(payload.data).object);
  const metadata = asRecord(session.metadata);
  const paymentRequestId = cleanString(metadata.paymentRequestId, 80);
  const sessionId = cleanString(session.id, 240);
  if (!sessionId || !paymentRequestId) {
    return { handled: false, reason: "missing_checkout_metadata", type };
  }

  const nextStatus =
    type === "checkout.session.completed"
      ? "paid"
      : type === "checkout.session.expired"
        ? "canceled"
        : type === "checkout.session.async_payment_failed"
          ? "failed"
          : "";
  if (!nextStatus) return { handled: false, reason: "ignored_event_type", type };

  const amountCents = Number(session.amount_total || 0);
  const currency = cleanString(session.currency, 12).toUpperCase() || "USD";
  const updated = await query<{ id: string }>(
    `update payments
     set status = $2,
       amount_cents = case when $3 > 0 then $3 else amount_cents end,
       currency = $4,
       provider_payload_json = $5::jsonb,
       paid_at = case when $2 = 'paid' then coalesce(paid_at, now()) else paid_at end,
       updated_at = now()
     where provider = 'stripe' and provider_reference = $1
     returning id`,
    [sessionId, nextStatus, amountCents, currency, JSON.stringify(payload)],
  );
  if (!updated.rows[0]) {
    await query(
      `insert into payments (
         payment_request_id, amount_cents, currency, status, provider, provider_reference,
         provider_payload_json, paid_at
       )
       values ($1, $2, $3, $4, 'stripe', $5, $6::jsonb, case when $4 = 'paid' then now() else null end)`,
      [paymentRequestId, amountCents, currency, nextStatus, sessionId, JSON.stringify(payload)],
    );
  }
  await query(`update payment_requests set status = $2, updated_at = now() where id = $1`, [
    paymentRequestId,
    nextStatus,
  ]);
  return { handled: true, type, paymentRequestId, providerReference: sessionId, status: nextStatus };
}
