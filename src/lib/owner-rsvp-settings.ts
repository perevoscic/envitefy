export type OwnerRsvpSettings = {
  hostName: string;
  phone: string;
  email: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(...values: unknown[]): string {
  return (
    values
      .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
      ?.trim() || ""
  );
}

export function readOwnerRsvpSettings(data: Record<string, unknown> | null): OwnerRsvpSettings {
  const source = data || {};
  const rsvp = record(source.rsvp);
  const details = record(record(record(source.studioCard).invitationData).eventDetails);
  const eventDetails = record(source.eventDetails);
  const draft = record(source.conciergeDraft);
  const contact = text(
    source.rsvpContact,
    rsvp.contact,
    details.rsvpContact,
    eventDetails.rsvpContact,
    draft.rsvpContact,
    source.rsvp,
  );
  const email =
    text(source.rsvpEmail, rsvp.email) ||
    contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
    "";
  const phoneText = contact
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/https?:\/\/\S+/gi, "");
  const phone =
    text(source.rsvpPhone, rsvp.phone) ||
    phoneText.match(/\+?\d[\d\s().-]{5,}\d/)?.[0]?.trim() ||
    "";
  return {
    hostName: text(
      source.rsvpName,
      rsvp.name,
      details.rsvpName,
      eventDetails.rsvpName,
      draft.rsvpName,
      source.hostName,
    ),
    phone,
    email,
  };
}

export function validateOwnerRsvpSettings(value: unknown): OwnerRsvpSettings {
  const input = record(value);
  for (const key of ["hostName", "phone", "email"] as const) {
    if (typeof input[key] !== "string")
      throw new Error("Enter the host name, phone, and email as text.");
    if (input[key].length > (key === "phone" ? 80 : 254))
      throw new Error("The RSVP contact details are too long.");
  }
  const settings = {
    hostName: String(input.hostName).trim(),
    phone: String(input.phone).trim(),
    email: String(input.email).trim(),
  };
  if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email))
    throw new Error("Enter a valid email address.");
  if (
    settings.phone &&
    (!/^[+\d\s().-]+$/.test(settings.phone) ||
      !/^\d{7,15}$/.test(settings.phone.replace(/\D/g, "")))
  ) {
    throw new Error("Enter a valid phone number, including the area code.");
  }
  return settings;
}

/** Update the contact projections without changing artwork, event facts, or RSVP behavior. */
export function buildOwnerRsvpSettingsPatch(
  data: Record<string, unknown>,
  settings: OwnerRsvpSettings,
): Record<string, unknown> {
  const contact = [settings.phone, settings.email].filter(Boolean).join(" · ");
  const fields = {
    rsvpName: settings.hostName,
    rsvpContact: contact,
    rsvpPhone: settings.phone,
    rsvpEmail: settings.email,
  };
  const patch: Record<string, unknown> = { ...fields, hostName: settings.hostName };
  const existingRsvp = record(data.rsvp);
  if (data.rsvp && typeof data.rsvp === "object") {
    patch.rsvp = {
      ...existingRsvp,
      name: settings.hostName,
      contact,
      phone: settings.phone,
      email: settings.email,
    };
  } else {
    const existingUrl =
      typeof data.rsvp === "string" ? data.rsvp.match(/https?:\/\/[^\s]+/)?.[0] : "";
    patch.rsvp = [contact, existingUrl].filter(Boolean).join(" · ");
  }
  patch.eventDetails = { ...record(data.eventDetails), ...fields };
  const studioCard = record(data.studioCard);
  if (Object.keys(studioCard).length) {
    const invitation = record(studioCard.invitationData);
    patch.studioCard = {
      ...studioCard,
      invitationData: {
        ...invitation,
        eventDetails: { ...record(invitation.eventDetails), ...fields },
      },
    };
  }
  if (data.conciergeDraft) {
    patch.conciergeDraft = { ...record(data.conciergeDraft), ...fields };
  }
  return patch;
}
