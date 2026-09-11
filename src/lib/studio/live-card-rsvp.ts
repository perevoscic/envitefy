import { buildEventPath } from "@/utils/event-url";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readFirstString(...values: unknown[]): string {
  return (
    values
      .find((value): value is string => typeof value === "string" && Boolean(value.trim()))
      ?.trim() || ""
  );
}

export function withDirectRsvpInvitationData(args: {
  invitationData: Record<string, unknown>;
  row: { id: string; data: Record<string, unknown> | null; public_slug?: string | null } | null;
  title: string;
}) {
  if (!args.row) return args.invitationData;
  const data = isRecord(args.row.data) ? args.row.data : {};
  const rsvp = isRecord(data.rsvp) ? data.rsvp : null;
  const rsvpEnabled =
    data.rsvpEnabled === true ||
    rsvp?.isEnabled === true ||
    rsvp?.enabled === true ||
    rsvp?.direct === true ||
    (typeof data.rsvpEnabled === "string" && data.rsvpEnabled.toLowerCase() === "true");
  if (!rsvpEnabled) return args.invitationData;

  const eventDetails = isRecord(args.invitationData.eventDetails)
    ? args.invitationData.eventDetails
    : {};
  return {
    ...args.invitationData,
    eventDetails: {
      ...eventDetails,
      eventId: args.row.id,
      rsvpEnabled: true,
      rsvpMode: readFirstString(eventDetails.rsvpMode, "envitefy"),
      rsvpName: readFirstString(eventDetails.rsvpName, data.rsvpName, data.hostName, "Host"),
      rsvpUrl: `${buildEventPath(
        args.row.id,
        args.title,
        undefined,
        args.row.public_slug,
      )}#event-rsvp`,
    },
  };
}
