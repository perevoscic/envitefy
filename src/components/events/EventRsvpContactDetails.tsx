import { readEventRsvpContact } from "@/lib/event-rsvp-contact";
import { isRsvpExplicitlyDisabled } from "@/lib/event-rsvp-settings";

/** Public reply contacts retain the invitation's own paper and ink. */
export default function EventRsvpContactDetails({ value }: { value: unknown }) {
  const { rsvpName, rsvpEmail, rsvpPhone } = readEventRsvpContact(value);
  if (isRsvpExplicitlyDisabled(value) || (!rsvpName && !rsvpEmail && !rsvpPhone)) return null;
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rsvpEmail) ? `mailto:${encodeURIComponent(rsvpEmail)}` : undefined;
  const phone = rsvpPhone.replace(/[^\d+]/g, "");
  return <address className="my-4 flex flex-col gap-2 not-italic" aria-label="RSVP contact">
    {rsvpName && <p>{rsvpName}</p>}
    {rsvpEmail && <a href={emailHref} className="inline-flex min-h-11 items-center break-all underline underline-offset-4">{rsvpEmail}</a>}
    {rsvpPhone && <a href={/\d{3}/.test(phone) ? `tel:${phone}` : undefined} className="inline-flex min-h-11 items-center break-all underline underline-offset-4">{rsvpPhone}</a>}
  </address>;
}
