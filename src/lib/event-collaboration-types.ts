export type EventRole = "owner" | "cohost";
export type EventPermissions = {
  role: EventRole | null;
  canEdit: boolean;
  canPublish: boolean;
  canManageResponses: boolean;
  canManageCollaborators: boolean;
  canDelete: boolean;
};

/** Authored events and signup forms support co-hosts; private scans retain their own access rules. */
export function supportsEventCollaboration(data: Record<string, any> | null | undefined): boolean {
  if (
    !data ||
    data.attachment ||
    data.invitedFromScan ||
    data.ownership === "invited"
  )
    return false;
  const source = String(data.createdVia || "").toLowerCase();
  return !["ocr", "scan", "upload", "snap"].some((part) => source.includes(part));
}

export function eventPermissions(role: EventRole | null): EventPermissions {
  return {
    role,
    canEdit: role !== null,
    canPublish: role !== null,
    canManageResponses: role !== null,
    canManageCollaborators: role === "owner",
    canDelete: role === "owner",
  };
}

export type EventAccessPerson = {
  id: string;
  email: string;
  name: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string | null;
  emailStatus: "pending" | "sent" | "failed" | null;
};

export type PendingCoHostInvitation = {
  id: string;
  eventId: string;
  eventTitle: string;
  ownerName: string;
  expiresAt: string;
};

export class EventCollaborationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
