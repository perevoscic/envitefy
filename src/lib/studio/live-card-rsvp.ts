import { buildEventPath } from "@/utils/event-url";
import { isGenderRevealEventData, parseGenderRevealConfig } from "@/lib/gender-reveal";
import { isRsvpExplicitlyDisabled } from "@/lib/event-rsvp-settings";

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
  // Classic invitations carry printed contacts while online collection stays disabled.
  if (data.rsvpMode === "external" && data.primaryOutput === "digital_flyer") return args.invitationData;
  if (isRsvpExplicitlyDisabled(data)) {
    return {
      ...args.invitationData,
      eventDetails: {
        ...(isRecord(args.invitationData.eventDetails) ? args.invitationData.eventDetails : {}),
        rsvpEnabled: false,
        rsvpMode: "none",
        rsvpUrl: "",
        rsvpContact: "",
        actionVisibility: {
          ...(isRecord(args.invitationData.eventDetails) && isRecord(args.invitationData.eventDetails.actionVisibility)
            ? args.invitationData.eventDetails.actionVisibility : {}),
          rsvp: false,
        },
      },
    };
  }
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
      // Studio's visual category may be Baby Shower; guest validation follows the saved event.
      ...(isGenderRevealEventData(data) ? {
        category: "Gender Reveal",
        eventKind: "gender_reveal",
        genderReveal: parseGenderRevealConfig(data),
        rsvpDeadline: readFirstString(data.rsvpDeadline, rsvp?.deadline, data.rsvp),
      } : {}),
      eventId: args.row.id,
      rsvpEnabled: true,
      actionVisibility: { ...(isRecord(eventDetails.actionVisibility) ? eventDetails.actionVisibility : {}), rsvp: true },
      rsvpMode: readFirstString(eventDetails.rsvpMode, "envitefy"),
      rsvpName: typeof data.rsvpName === "string" ? data.rsvpName : readFirstString(eventDetails.rsvpName, data.hostName, "Host"),
      rsvpContact: typeof data.rsvpContact === "string" ? data.rsvpContact : eventDetails.rsvpContact,
      rsvpDeadline: typeof data.rsvpDeadline === "string" ? data.rsvpDeadline : readFirstString(rsvp?.deadline, eventDetails.rsvpDeadline),
      rsvpUrl: `${buildEventPath(
        args.row.id,
        args.title,
        undefined,
        args.row.public_slug,
      )}#event-rsvp`,
    },
  };
}
