function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function flag(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  if (/^(true|1|yes)$/i.test(value.trim())) return true;
  if (/^(false|0|no|off)$/i.test(value.trim())) return false;
  return undefined;
}

export function isRsvpExplicitlyDisabled(value: unknown): boolean {
  const data = record(value);
  const rsvp = record(data.rsvp);
  return [data.rsvpEnabled, rsvp.isEnabled, rsvp.enabled].some(value => flag(value) === false);
}

/** Restore both native editor snapshots and older flat saved event payloads. */
export function readEventRsvpSettings(value: unknown, fallbackEnabled = false) {
  const data = record(value);
  const rsvp = record(data.rsvp);
  const legacy = typeof data.rsvp === "string" ? data.rsvp.trim() : "";
  const deadline = typeof data.rsvpDeadline === "string" ? data.rsvpDeadline
    : typeof rsvp.deadline === "string" ? rsvp.deadline
    : /^\d{4}-\d{2}-\d{2}$/.test(legacy) ? legacy : "";
  const explicit = [data.rsvpEnabled, rsvp.isEnabled, rsvp.enabled, rsvp.direct].map(flag);
  return {
    isEnabled: !isRsvpExplicitlyDisabled(data) &&
      (explicit.includes(true) || (explicit.every(value => value === undefined) && (Boolean(legacy || deadline) || fallbackEnabled))),
    deadline: deadline.trim(),
  };
}
