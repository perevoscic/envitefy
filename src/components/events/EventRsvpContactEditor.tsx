"use client";
import type { EventRsvpContact } from "@/lib/event-rsvp-contact";
import { EventEditorInput } from "./EventEditorFields";

export default function EventRsvpContactEditor({ value, onChange }: {
  value: Partial<EventRsvpContact>;
  onChange: (patch: Partial<EventRsvpContact>) => void;
}) {
  return <div className="space-y-4">
    <EventEditorInput label="RSVP contact name" value={value.rsvpName || ""} maxLength={200} onChange={rsvpName => onChange({ rsvpName })} />
    <EventEditorInput label="RSVP email" type="email" value={value.rsvpEmail || ""} maxLength={320} onChange={rsvpEmail => onChange({ rsvpEmail })} />
    <EventEditorInput label="RSVP phone" type="tel" value={value.rsvpPhone || ""} maxLength={80} onChange={rsvpPhone => onChange({ rsvpPhone })} />
  </div>;
}
