import { createHmac, timingSafeEqual } from "node:crypto";
import { parseConciergeInput } from "./core.mjs";

type ProviderDraftResult = {
  draft: Record<string, any>;
  provider: string;
  model: string;
  raw: Record<string, any>;
  fallbackUsed: boolean;
  errorMessage?: string | null;
};

type ProviderSendResult = {
  provider: string;
  status: "sent" | "blocked" | "failed";
  providerReference?: string | null;
  errorMessage?: string | null;
  providerPayload?: Record<string, any>;
};

type StripeCheckoutResult = {
  provider: "stripe";
  status: "created" | "blocked" | "failed";
  url?: string | null;
  providerReference?: string | null;
  errorMessage?: string | null;
  providerPayload?: Record<string, any>;
};

function cleanString(value: any, maxLength = 1000): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function firstNonEmptyString(...values: any[]): string {
  for (const value of values) {
    const cleaned = cleanString(value, 1000);
    if (cleaned) return cleaned;
  }
  return "";
}

function providerArrayOrFallback(providerValue: any, fallbackValue: any) {
  const providerArray = Array.isArray(providerValue) ? providerValue : [];
  const fallbackArray = Array.isArray(fallbackValue) ? fallbackValue : [];
  return providerArray.length ? providerArray : fallbackArray;
}

function safeJson(value: string): Record<string, any> | null {
  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function mergeProviderDraft(providerDraft: Record<string, any>, fallback: Record<string, any>) {
  const nestedDraft = asRecord(providerDraft.draft);
  const draft = Object.keys(nestedDraft).length ? nestedDraft : providerDraft;
  const program = { ...asRecord(fallback.program), ...asRecord(draft.program) };
  const providerOccurrences = Array.isArray(draft.occurrences) ? draft.occurrences : [];
  const fallbackOccurrences = Array.isArray(fallback.occurrences) ? fallback.occurrences : [];
  const occurrenceCount = Math.max(providerOccurrences.length, fallbackOccurrences.length);
  const merged = {
    ...fallback,
    ...draft,
    mode: firstNonEmptyString(draft.mode, fallback.mode) || "social",
    eventType: firstNonEmptyString(draft.eventType, fallback.eventType) || "general_event",
    title: firstNonEmptyString(draft.title, draft.pageTitle, draft.eventTitle, program.title, fallback.title),
    summary: firstNonEmptyString(draft.summary, draft.description, fallback.summary),
    timezone: firstNonEmptyString(draft.timezone, draft.tz, fallback.timezone) || "America/Chicago",
    originalText: firstNonEmptyString(draft.originalText, fallback.originalText),
    program,
    series: providerArrayOrFallback(draft.series, fallback.series),
    occurrences: Array.from({ length: occurrenceCount }).map((_, index) => {
        const occurrence = providerOccurrences[index] || fallbackOccurrences[index];
        const fallbackOccurrence = asRecord(fallbackOccurrences[index]);
        return {
          ...fallbackOccurrence,
          ...asRecord(occurrence),
          title: firstNonEmptyString(occurrence?.title, occurrence?.name, fallbackOccurrence.title),
          timezone: firstNonEmptyString(occurrence?.timezone, occurrence?.tz, fallbackOccurrence.timezone, fallback.timezone),
          locationText: firstNonEmptyString(
            occurrence?.locationText,
            occurrence?.location,
            occurrence?.venue,
            fallbackOccurrence.locationText,
            fallbackOccurrence.location,
          ),
        };
      }),
    forms: providerArrayOrFallback(draft.forms, fallback.forms),
    volunteerSlots: providerArrayOrFallback(draft.volunteerSlots, fallback.volunteerSlots),
    paymentItems: providerArrayOrFallback(draft.paymentItems, fallback.paymentItems),
    reminders: providerArrayOrFallback(draft.reminders, fallback.reminders),
    checklistItems: providerArrayOrFallback(draft.checklistItems, fallback.checklistItems),
    missingFields: providerArrayOrFallback(draft.missingFields, fallback.missingFields),
  };
  merged.program = {
    ...merged.program,
    title: firstNonEmptyString(merged.program.title, merged.title, fallback.program?.title),
    mode: firstNonEmptyString(merged.program.mode, merged.mode, fallback.program?.mode),
  };
  if (
    fallback.eventType === "gymnastics_meet" &&
    Array.isArray(fallback.occurrences) &&
    fallback.missingFields?.some((field: any) => /time/i.test(cleanString(field, 120)))
  ) {
    merged.occurrences = (Array.isArray(merged.occurrences) ? merged.occurrences : []).map(
      (occurrence: any, index: number) => {
        const fallbackOccurrence = asRecord(fallback.occurrences[index]);
        if (!fallbackOccurrence.date || fallbackOccurrence.startAt) return occurrence;
        return {
          ...occurrence,
          date: fallbackOccurrence.date,
          dateText: fallbackOccurrence.dateText || occurrence?.dateText || null,
          startAt: null,
          endAt: null,
          timezone: cleanString(occurrence?.timezone, 80) || fallbackOccurrence.timezone || fallback.timezone,
        };
      },
    );
  }
  return merged;
}

export function getConciergeV2ProviderStatus() {
  return {
    aiParsing: process.env.OPENAI_API_KEY ? "ready" : "fallback",
    aiProvider: process.env.OPENAI_API_KEY ? "openai" : "deterministic",
    aiModel: process.env.CONCIERGE_V2_OPENAI_MODEL || "gpt-4o-mini",
    blobStorage: process.env.BLOB_READ_WRITE_TOKEN ? "ready" : "not_configured",
    imageOcr:
      process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT
        ? "ready"
        : "not_configured",
    pdfTextExtraction: "ready",
    email: process.env.RESEND_API_KEY ? "ready" : "not_configured",
    sms:
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
        ? "ready"
        : "not_configured",
    payments: process.env.STRIPE_SECRET_KEY ? "ready" : "not_configured",
    stripeWebhook: process.env.STRIPE_WEBHOOK_SECRET ? "ready" : "not_configured",
  };
}

export async function parseConciergeInputWithProvider(
  inputText: string,
  context: { sourceKind?: string | null; referenceDate?: string | null; timezone?: string | null } = {},
): Promise<ProviderDraftResult> {
  const fallback = parseConciergeInput(inputText, {
    sourceKind: cleanString(context.sourceKind, 80) || "text",
    referenceDate: cleanString(context.referenceDate, 80) || undefined,
    timezone: cleanString(context.timezone, 80) || undefined,
  });
  const apiKey = cleanString(process.env.OPENAI_API_KEY, 400);
  if (!apiKey) {
    return {
      draft: fallback,
      provider: "deterministic",
      model: "fallback-v2",
      raw: { inputText, fallbackReason: "OPENAI_API_KEY is not configured." },
      fallbackUsed: true,
    };
  }
  const model = cleanString(process.env.CONCIERGE_V2_OPENAI_MODEL, 100) || "gpt-4o-mini";
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract an Envitefy Concierge V2 event draft as JSON. Return only JSON. Preserve this shape when possible: mode, eventType, program, series, occurrences, forms, volunteerSlots, paymentItems, reminders, checklistItems, missingFields. Use ISO-like dates when explicit; do not invent missing logistics.",
        },
        {
          role: "user",
          content: JSON.stringify({
            inputText,
            sourceKind: cleanString(context.sourceKind, 80) || "text",
            referenceDate: cleanString(context.referenceDate, 80) || null,
            timezone: cleanString(context.timezone, 80) || null,
            deterministicFallback: fallback,
          }),
        },
      ],
    });
    const content = response.choices[0]?.message?.content || "";
    const parsed = safeJson(content);
    if (!parsed) throw new Error("OpenAI returned non-JSON content.");
    return {
      draft: mergeProviderDraft(parsed, fallback),
      provider: "openai",
      model,
      raw: {
        id: response.id,
        model: response.model,
        parsed,
        usage: response.usage || null,
      },
      fallbackUsed: false,
    };
  } catch (error: any) {
    return {
      draft: fallback,
      provider: "deterministic",
      model: "fallback-v2",
      raw: { inputText, providerError: String(error?.message || "OpenAI parse failed.") },
      fallbackUsed: true,
      errorMessage: String(error?.message || "OpenAI parse failed."),
    };
  }
}

export async function uploadConciergeV2SourceFile(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  eventHistoryId: string;
  userId: string;
}) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for storage-backed imports.");
  }
  const safeName = cleanString(params.fileName, 180).replace(/[^a-zA-Z0-9._-]+/g, "-") || "source";
  const pathname = `concierge-v2/${params.userId}/${params.eventHistoryId}/${Date.now()}-${safeName}`;
  const { put } = await import("@vercel/blob");
  const blob = await put(pathname, params.buffer, {
    access: "public",
    contentType: params.contentType || "application/octet-stream",
  });
  return { url: blob.url, pathname };
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(doc.numPages, 12);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => cleanString(item?.str, 1000))
      .filter(Boolean)
      .join(" ");
    if (text) pages.push(text);
  }
  return pages.join("\n\n").slice(0, 30_000);
}

async function extractImageTextWithGoogleVision(buffer: Buffer): Promise<string> {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
    throw new Error("Google Vision is not configured for image OCR.");
  }
  const vision = await import("@google-cloud/vision");
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection({ image: { content: buffer } });
  return cleanString(result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.description, 30_000);
}

export async function extractTextFromConciergeV2SourceFile(params: {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}) {
  const contentType = cleanString(params.contentType, 120).toLowerCase();
  const name = cleanString(params.fileName, 240).toLowerCase();
  if (contentType.startsWith("text/") || /\.(txt|md|csv)$/i.test(name)) {
    return { text: params.buffer.toString("utf8").slice(0, 30_000), provider: "text" };
  }
  if (contentType === "application/pdf" || /\.pdf$/i.test(name)) {
    return { text: await extractPdfText(params.buffer), provider: "pdfjs" };
  }
  if (contentType.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(name)) {
    return { text: await extractImageTextWithGoogleVision(params.buffer), provider: "google_vision" };
  }
  throw new Error("Unsupported import file type.");
}

export async function sendConciergeV2Email(params: {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
}): Promise<ProviderSendResult> {
  const apiKey = cleanString(process.env.RESEND_API_KEY, 400);
  if (!apiKey) {
    return {
      provider: "resend",
      status: "blocked",
      errorMessage: "RESEND_API_KEY is not configured.",
      providerPayload: { providerCalled: false },
    };
  }
  const from =
    cleanString(process.env.RESEND_FROM_EMAIL, 240) ||
    cleanString(process.env.SES_FROM_EMAIL_NO_REPLY, 240) ||
    "Envitefy <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || undefined,
    }),
  });
  const text = await res.text().catch(() => "");
  const payload = safeJson(text) || { raw: text };
  if (!res.ok) {
    return {
      provider: "resend",
      status: "failed",
      errorMessage: `Resend HTTP ${res.status}: ${text || "send failed"}`,
      providerPayload: payload,
    };
  }
  return {
    provider: "resend",
    status: "sent",
    providerReference: cleanString(payload.id, 200) || null,
    providerPayload: payload,
  };
}

export async function sendConciergeV2Sms(params: {
  to: string;
  body: string;
}): Promise<ProviderSendResult> {
  const accountSid = cleanString(process.env.TWILIO_ACCOUNT_SID, 240);
  const authToken = cleanString(process.env.TWILIO_AUTH_TOKEN, 500);
  const from = cleanString(process.env.TWILIO_FROM_NUMBER, 80);
  const messagingServiceSid = cleanString(process.env.TWILIO_MESSAGING_SERVICE_SID, 120);
  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    return {
      provider: "twilio",
      status: "blocked",
      errorMessage:
        "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID are required.",
      providerPayload: { providerCalled: false },
    };
  }
  const body = new URLSearchParams();
  body.set("To", params.to);
  body.set("Body", cleanString(params.body, 1500));
  if (messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
  } else {
    body.set("From", from);
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await res.text().catch(() => "");
  const payload = safeJson(text) || { raw: text };
  if (!res.ok) {
    return {
      provider: "twilio",
      status: "failed",
      errorMessage: `Twilio HTTP ${res.status}: ${text || "send failed"}`,
      providerPayload: payload,
    };
  }
  return {
    provider: "twilio",
    status: "sent",
    providerReference: cleanString(payload.sid, 200) || null,
    providerPayload: payload,
  };
}

export async function createStripeCheckoutSession(params: {
  paymentRequestId: string;
  eventHistoryId: string;
  title: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeCheckoutResult> {
  const key = cleanString(process.env.STRIPE_SECRET_KEY, 500);
  if (!key) {
    return {
      provider: "stripe",
      status: "blocked",
      errorMessage: "STRIPE_SECRET_KEY is not configured.",
      providerPayload: { providerCalled: false },
    };
  }
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", cleanString(params.currency, 12).toLowerCase() || "usd");
  body.set("line_items[0][price_data][unit_amount]", String(Math.max(50, Math.round(params.amountCents || 0))));
  body.set("line_items[0][price_data][product_data][name]", cleanString(params.title, 220) || "Envitefy payment");
  body.set("metadata[paymentRequestId]", params.paymentRequestId);
  body.set("metadata[eventHistoryId]", params.eventHistoryId);
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await res.text().catch(() => "");
  const payload = safeJson(text) || { raw: text };
  if (!res.ok) {
    return {
      provider: "stripe",
      status: "failed",
      errorMessage: `Stripe HTTP ${res.status}: ${text || "checkout failed"}`,
      providerPayload: payload,
    };
  }
  return {
    provider: "stripe",
    status: "created",
    url: cleanString(payload.url, 1000) || null,
    providerReference: cleanString(payload.id, 240) || null,
    providerPayload: payload,
  };
}

export function verifyStripeWebhookSignature(params: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
}) {
  const header = cleanString(params.signatureHeader, 1000);
  const timestamp = header
    .split(",")
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signature = header
    .split(",")
    .find((part) => part.startsWith("v1="))
    ?.slice(3);
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", params.secret).update(`${timestamp}.${params.payload}`).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}
