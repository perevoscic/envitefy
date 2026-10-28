export type EventRsvpContact = { rsvpName: string; rsvpEmail: string; rsvpPhone: string };
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, limit: number) => typeof value === "string" ? value.trim().slice(0, limit) : "";

/** Explicit empty fields clear old contacts; never infer a destination from the account. */
export function readEventRsvpContact(value: unknown): EventRsvpContact {
  const data = record(value), rsvp = record(data.rsvp), contact = record(data.rsvpContact);
  return {
    rsvpName: text(data.rsvpName ?? contact.name ?? rsvp.contactName, 200),
    rsvpEmail: text(data.rsvpEmail ?? contact.email ?? rsvp.email, 320),
    rsvpPhone: text(data.rsvpPhone ?? contact.phone ?? rsvp.phone, 80),
  };
}
