export type EventMessageDelivery = {
  email: string;
  name: string;
  status: "pending" | "sending" | "sent" | "failed" | "skipped";
  updatedAt: string;
};

export type EventMessage = {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "queued";
  createdAt: string;
  sentAt: string | null;
  deliveries: EventMessageDelivery[];
};

export type EventMessagesData = {
  audienceCount: number;
  replyTo: string | null;
  eventUrl: string;
  messages: EventMessage[];
};

export function validGuestEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value);
}

export class EventMessageError extends Error {}

export function validateEventMessage(value: unknown, requireContent = true) {
  if (!value || typeof value !== "object") throw new Error("Enter a subject and message.");
  const input = value as Record<string, unknown>;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const id = typeof input.id === "string" ? input.id : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Please reopen Messages and try again.");
  }
  if ((requireContent && !subject) || subject.length > 160 || /[\r\n]/.test(subject)) {
    throw new Error("Enter a subject of up to 160 characters on one line.");
  }
  if ((requireContent && !body) || body.length > 5000)
    throw new Error("Enter a message of up to 5,000 characters.");
  return { id, subject, body };
}
