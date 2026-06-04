import { query } from "@/lib/db";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

const RESOURCE_TYPES = [
  "room",
  "coach",
  "teacher",
  "equipment",
  "apparatus",
  "bus",
  "volunteer",
  "food",
  "decoration",
  "seating",
  "helper",
  "location",
  "parking",
  "pool_access",
  "setup_item",
  "snack",
  "supply",
  "chaperone",
  "classroom",
  "form",
  "warmup_area",
  "hotel",
  "venue",
  "speaker",
  "materials",
  "check_in",
  "catering",
  "follow_up",
  "other",
] as const;
const ATTENDANCE_STATUSES = ["expected", "present", "absent", "late", "excused"] as const;

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  workspace_name: string | null;
  program_id: string | null;
  program_title: string | null;
  program_mode: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type MembershipRow = {
  id: string;
  role: string;
};

type OccurrenceRow = {
  id: string;
  title: string;
  occurrence_type: string;
  start_at: string | null;
  end_at: string | null;
  timezone: string | null;
  location_text: string | null;
  status: string;
};

type ResourceRow = {
  id: string;
  venue_id: string | null;
  venue_name: string | null;
  resource_type: string;
  name: string;
  capacity: number | null;
  status: string;
  attributes_json: Record<string, any>;
};

type RequirementRow = {
  id: string;
  occurrence_id: string;
  occurrence_title: string;
  resource_type: string;
  quantity: number;
  required_attributes_json: Record<string, any>;
  notes: string | null;
};

type AssignmentRow = {
  id: string;
  occurrence_id: string;
  occurrence_title: string;
  occurrence_type: string;
  resource_id: string;
  resource_name: string;
  resource_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  conflict_status: string | null;
  notes: string | null;
};

type ResourceAssignment = {
  id: string;
  occurrenceId: string;
  occurrenceTitle: string;
  occurrenceType: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  startsAt: string;
  endsAt: string;
  status: string;
  conflictStatus: string | null;
  notes: string | null;
};

type ParticipantRow = {
  id: string;
  display_name: string | null;
  first_name: string;
  last_name: string | null;
  group_name: string | null;
};

type AttendanceRow = {
  id: string;
  occurrence_id: string;
  participant_id: string | null;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  notes: string | null;
  updated_at: string;
};

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function asRecord(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function numberOrNull(value: any): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function normalizeResourceType(value: any): string {
  const type = cleanString(value, 80).toLowerCase();
  return RESOURCE_TYPES.includes(type as (typeof RESOURCE_TYPES)[number]) ? type : "other";
}

function normalizeAttendanceStatus(value: any): string {
  const status = cleanString(value, 80).toLowerCase();
  return ATTENDANCE_STATUSES.includes(status as (typeof ATTENDANCE_STATUSES)[number]) ? status : "expected";
}

function canManageResources(role: string | null | undefined): boolean {
  return ["platform_admin", "org_admin", "program_manager", "scheduler", "coach_teacher"].includes(
    cleanString(role, 80),
  );
}

function canMarkAttendance(role: string | null | undefined): boolean {
  return [
    "platform_admin",
    "org_admin",
    "program_manager",
    "scheduler",
    "coach_teacher",
    "front_desk_checkin",
  ].includes(cleanString(role, 80));
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, w.name as workspace_name,
       ep.program_id, p.title as program_title, p.mode as program_mode,
       ep.owner_user_id, eh.title as event_title
     from event_pages ep
     join event_history eh on eh.id = ep.legacy_event_history_id
     left join workspaces w on w.id = ep.workspace_id
     left join programs p on p.id = ep.program_id
     where ep.legacy_event_history_id = $1
     order by ep.created_at desc
     limit 1`,
    [eventHistoryId],
  );
  return res.rows[0] || null;
}

async function getMembership(params: { workspaceId: string; userId: string }): Promise<MembershipRow | null> {
  const res = await query<MembershipRow>(
    `select id, role
     from memberships
     where workspace_id = $1 and user_id = $2 and status = 'active'
     limit 1`,
    [params.workspaceId, params.userId],
  );
  return res.rows[0] || null;
}

async function ensureOwnerMembership(params: {
  workspaceId: string;
  userId: string;
}): Promise<MembershipRow> {
  const existing = await getMembership(params);
  if (existing) return existing;
  const inserted = await query<MembershipRow>(
    `insert into memberships (workspace_id, user_id, role, status, invited_by_user_id, accepted_at)
     values ($1, $2, 'program_manager', 'active', $2, now())
     returning id, role`,
    [params.workspaceId, params.userId],
  );
  return inserted.rows[0];
}

async function requireResourceAccess(params: {
  eventHistoryId: string;
  userId: string;
}) {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  if (!page.workspace_id || !page.program_id) {
    throw new ConciergeV2OperationError("Resource planning target not found.", 404);
  }
  const membership =
    page.owner_user_id === params.userId
      ? await ensureOwnerMembership({ workspaceId: page.workspace_id, userId: params.userId })
      : await getMembership({ workspaceId: page.workspace_id, userId: params.userId });
  if (!membership) {
    throw new ConciergeV2OperationError("You do not have access to this workspace.", 403);
  }
  return {
    page,
    role: membership.role,
    canManageResources: canManageResources(membership.role),
    canMarkAttendance: canMarkAttendance(membership.role),
  };
}

async function loadOccurrences(programId: string) {
  const res = await query<OccurrenceRow>(
    `select id, title, occurrence_type, start_at, end_at, timezone, location_text, status
     from event_occurrences
     where program_id = $1
     order by start_at asc nulls last, created_at asc
     limit 80`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.occurrence_type,
    startAt: row.start_at,
    endAt: row.end_at,
    timezone: row.timezone,
    locationText: row.location_text,
    status: row.status,
  }));
}

async function loadVenues(workspaceId: string) {
  const res = await query(
    `select id, name, timezone, parking_notes, accessibility_notes
     from venues
     where workspace_id = $1
     order by name asc`,
    [workspaceId],
  );
  return res.rows.map((row: any) => ({
    id: String(row.id),
    name: cleanString(row.name, 220),
    timezone: row.timezone || null,
    parkingNotes: row.parking_notes || null,
    accessibilityNotes: row.accessibility_notes || null,
  }));
}

async function loadResources(params: {
  workspaceId: string;
  programId: string;
  eventHistoryId: string;
}) {
  const res = await query<ResourceRow>(
    `select r.id, r.venue_id, v.name as venue_name, r.resource_type,
       r.name, r.capacity, r.status, r.attributes_json
     from resources r
     left join venues v on v.id = r.venue_id
     where r.workspace_id = $1
       and (
         r.attributes_json->>'eventHistoryId' = $3::text
         or r.attributes_json->>'programId' = $2::text
         or exists (
           select 1
           from resource_assignments ra
           join event_occurrences eo on eo.id = ra.occurrence_id
           where ra.resource_id = r.id and eo.program_id = $2::uuid
         )
       )
     order by r.resource_type asc, r.name asc`,
    [params.workspaceId, params.programId, params.eventHistoryId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venue_name,
    type: row.resource_type,
    name: row.name,
    capacity: row.capacity,
    status: row.status,
    attributes: asRecord(row.attributes_json),
  }));
}

async function loadRequirements(programId: string) {
  const res = await query<RequirementRow>(
    `select rr.id, rr.occurrence_id, eo.title as occurrence_title, rr.resource_type,
       rr.quantity, rr.required_attributes_json, rr.notes
     from resource_requirements rr
     join event_occurrences eo on eo.id = rr.occurrence_id
     where eo.program_id = $1
     order by eo.start_at asc nulls last, rr.resource_type asc`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    occurrenceId: row.occurrence_id,
    occurrenceTitle: row.occurrence_title,
    resourceType: row.resource_type,
    quantity: Number(row.quantity || 1),
    requiredAttributes: asRecord(row.required_attributes_json),
    notes: row.notes,
  }));
}

async function loadAssignments(programId: string): Promise<ResourceAssignment[]> {
  const res = await query<AssignmentRow>(
    `select ra.id, ra.occurrence_id, eo.title as occurrence_title,
       eo.occurrence_type, ra.resource_id, r.name as resource_name, r.resource_type,
       ra.starts_at, ra.ends_at, ra.status, ra.conflict_status, ra.notes
     from resource_assignments ra
     join event_occurrences eo on eo.id = ra.occurrence_id
     join resources r on r.id = ra.resource_id
     where eo.program_id = $1
     order by ra.starts_at asc, r.name asc`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    occurrenceId: row.occurrence_id,
    occurrenceTitle: row.occurrence_title,
    occurrenceType: row.occurrence_type,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    resourceType: row.resource_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    conflictStatus: row.conflict_status,
    notes: row.notes,
  }));
}

async function loadParticipants(programId: string) {
  const res = await query<ParticipantRow>(
    `select p.id, p.display_name, p.first_name, p.last_name, pp.group_name
     from program_participants pp
     join participants p on p.id = pp.participant_id
     where pp.program_id = $1 and pp.roster_status = 'active'
     order by p.display_name asc nulls last, p.first_name asc, p.last_name asc nulls last`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    name:
      cleanString(row.display_name, 160) ||
      [row.first_name, row.last_name].map((part) => cleanString(part, 80)).filter(Boolean).join(" "),
    groupName: row.group_name,
  }));
}

async function loadAttendance(programId: string) {
  const res = await query<AttendanceRow>(
    `select ar.id, ar.occurrence_id, ar.participant_id, ar.status,
       ar.checked_in_at, ar.checked_out_at, ar.notes, ar.updated_at
     from attendance_records ar
     join event_occurrences eo on eo.id = ar.occurrence_id
     where eo.program_id = $1
     order by ar.updated_at desc`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    occurrenceId: row.occurrence_id,
    participantId: row.participant_id,
    status: row.status,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    notes: row.notes,
    updatedAt: row.updated_at,
  }));
}

function overlaps(a: { startsAt: string; endsAt: string }, b: { startsAt: string; endsAt: string }) {
  const aStart = new Date(a.startsAt).getTime();
  const aEnd = new Date(a.endsAt).getTime();
  const bStart = new Date(b.startsAt).getTime();
  const bEnd = new Date(b.endsAt).getTime();
  if (![aStart, aEnd, bStart, bEnd].every(Number.isFinite)) return false;
  return aStart < bEnd && bStart < aEnd;
}

export function buildResourceConflicts(assignments: ResourceAssignment[]) {
  const active = assignments.filter((assignment) => assignment.status !== "canceled");
  const conflicts: Array<Record<string, any>> = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (a.resourceId !== b.resourceId || !overlaps(a, b)) continue;
      conflicts.push({
        reason: "resource_double_booking",
        resourceId: a.resourceId,
        resourceName: a.resourceName,
        resourceType: a.resourceType,
        assignmentIds: [a.id, b.id],
        occurrenceIds: [a.occurrenceId, b.occurrenceId],
        window: {
          startsAt: a.startsAt > b.startsAt ? a.startsAt : b.startsAt,
          endsAt: a.endsAt < b.endsAt ? a.endsAt : b.endsAt,
        },
      });
    }
  }
  return conflicts;
}

function defaultAssignmentWindow(occurrence: OccurrenceRow | null, startAt?: string | null, endAt?: string | null) {
  const startText = cleanString(startAt, 100) || cleanString(occurrence?.start_at, 100);
  if (!startText) throw new ConciergeV2OperationError("Assignment start time is required.", 400);
  const start = new Date(startText);
  if (Number.isNaN(start.getTime())) throw new ConciergeV2OperationError("Invalid assignment start time.", 400);
  const endText = cleanString(endAt, 100) || cleanString(occurrence?.end_at, 100);
  const end = endText ? new Date(endText) : new Date(start.getTime() + 60 * 60 * 1000);
  if (Number.isNaN(end.getTime()) || end <= start) {
    throw new ConciergeV2OperationError("Assignment end time must be after the start time.", 400);
  }
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

async function getOccurrenceForProgram(programId: string, occurrenceId: string): Promise<OccurrenceRow | null> {
  const res = await query<OccurrenceRow>(
    `select id, title, occurrence_type, start_at, end_at, timezone, location_text, status
     from event_occurrences
     where id = $1 and program_id = $2
     limit 1`,
    [occurrenceId, programId],
  );
  return res.rows[0] || null;
}

async function getOrCreateVenue(params: {
  workspaceId: string;
  venueName?: string | null;
  timezone?: string | null;
}) {
  const name = cleanString(params.venueName, 220);
  if (!name) return null;
  const existing = await query<{ id: string }>(
    `select id from venues where workspace_id = $1 and lower(name) = lower($2) limit 1`,
    [params.workspaceId, name],
  );
  if (existing.rows[0]?.id) return existing.rows[0].id;
  const created = await query<{ id: string }>(
    `insert into venues (workspace_id, name, timezone)
     values ($1, $2, $3)
     returning id`,
    [params.workspaceId, name, cleanString(params.timezone, 80) || "America/Chicago"],
  );
  return created.rows[0]?.id || null;
}

export async function getConciergeV2ResourcePlanningCenter(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const access = await requireResourceAccess(params);
  const workspaceId = access.page.workspace_id as string;
  const programId = access.page.program_id as string;
  const [venues, resources, requirements, occurrences, assignments, participants, attendance] = await Promise.all([
    loadVenues(workspaceId),
    loadResources({ workspaceId, programId, eventHistoryId: params.eventHistoryId }),
    loadRequirements(programId),
    loadOccurrences(programId),
    loadAssignments(programId),
    loadParticipants(programId),
    loadAttendance(programId),
  ]);
  const conflicts = buildResourceConflicts(assignments);
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: access.page.event_page_id,
      title: access.page.event_title,
      programId,
      programTitle: access.page.program_title,
      mode: access.page.program_mode,
    },
    workspace: {
      id: workspaceId,
      name: access.page.workspace_name || "Workspace",
    },
    currentUser: {
      role: access.role,
      canManageResources: access.canManageResources,
      canMarkAttendance: access.canMarkAttendance,
    },
    venues,
    resources,
    requirements,
    occurrences,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      hasConflict: conflicts.some((conflict) => conflict.assignmentIds.includes(assignment.id)),
    })),
    conflicts,
    participants,
    attendance,
    counts: {
      venues: venues.length,
      resources: resources.length,
      requirements: requirements.length,
      assignments: assignments.length,
      conflicts: conflicts.length,
      participants: participants.length,
      attendanceMarked: attendance.filter((item) => item.status !== "expected").length,
    },
  };
}

export async function createConciergeV2Resource(params: {
  eventHistoryId: string;
  userId: string;
  name: string;
  resourceType?: string | null;
  venueName?: string | null;
  capacity?: number | string | null;
  notes?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canManageResources) {
    throw new ConciergeV2OperationError("You need scheduler or coach/teacher access to manage resources.", 403);
  }
  const workspaceId = access.page.workspace_id as string;
  const name = cleanString(params.name, 220);
  if (!name) throw new ConciergeV2OperationError("Resource name is required.", 400);
  const venueId = await getOrCreateVenue({
    workspaceId,
    venueName: params.venueName,
    timezone: "America/Chicago",
  });
  const inserted = await query<{ id: string }>(
    `insert into resources (
       workspace_id, venue_id, resource_type, name, capacity, attributes_json, status
     )
     values ($1, $2, $3, $4, $5, $6::jsonb, 'active')
     returning id`,
    [
      workspaceId,
      venueId,
      normalizeResourceType(params.resourceType),
      name,
      numberOrNull(params.capacity),
      JSON.stringify({
        notes: cleanString(params.notes, 500) || null,
        eventHistoryId: params.eventHistoryId,
        programId: access.page.program_id || null,
      }),
    ],
  );
  return { id: inserted.rows[0]?.id || null };
}

export async function updateConciergeV2Resource(params: {
  eventHistoryId: string;
  userId: string;
  resourceId: string;
  name?: string | null;
  resourceType?: string | null;
  venueName?: string | null;
  capacity?: number | string | null;
  notes?: string | null;
  status?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canManageResources) {
    throw new ConciergeV2OperationError("You need scheduler or coach/teacher access to manage resources.", 403);
  }
  const workspaceId = access.page.workspace_id as string;
  const existing = await query<ResourceRow>(
    `select id, venue_id, null as venue_name, resource_type, name, capacity, status, attributes_json
     from resources
     where id = $1 and workspace_id = $2
     limit 1`,
    [params.resourceId, workspaceId],
  );
  const current = existing.rows[0];
  if (!current) throw new ConciergeV2OperationError("Resource not found.", 404);
  const venueId = params.venueName !== undefined
    ? await getOrCreateVenue({ workspaceId, venueName: params.venueName, timezone: "America/Chicago" })
    : current.venue_id;
  const status = cleanString(params.status, 40).toLowerCase();
  const nextStatus = ["active", "inactive", "archived"].includes(status) ? status : current.status;
  const updated = await query<{ id: string }>(
    `update resources
     set venue_id = $3,
       resource_type = $4,
       name = $5,
       capacity = $6,
       attributes_json = attributes_json || $7::jsonb,
       status = $8,
       updated_at = now()
     where id = $1 and workspace_id = $2
     returning id`,
    [
      params.resourceId,
      workspaceId,
      venueId,
      params.resourceType ? normalizeResourceType(params.resourceType) : current.resource_type,
      cleanString(params.name, 220) || current.name,
      params.capacity === undefined ? current.capacity : numberOrNull(params.capacity),
      JSON.stringify({ notes: params.notes === undefined ? asRecord(current.attributes_json).notes || null : cleanString(params.notes, 500) || null }),
      nextStatus,
    ],
  );
  return { id: updated.rows[0]?.id || params.resourceId };
}

export async function archiveConciergeV2Resource(params: {
  eventHistoryId: string;
  userId: string;
  resourceId: string;
}) {
  return updateConciergeV2Resource({ ...params, status: "archived" });
}

export async function createConciergeV2ResourceRequirement(params: {
  eventHistoryId: string;
  userId: string;
  occurrenceId: string;
  resourceType: string;
  quantity?: number | string | null;
  notes?: string | null;
  requiredAttributes?: any;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canManageResources) {
    throw new ConciergeV2OperationError("You need scheduler or coach/teacher access to manage resource requirements.", 403);
  }
  const programId = access.page.program_id as string;
  const occurrence = await getOccurrenceForProgram(programId, params.occurrenceId);
  if (!occurrence) throw new ConciergeV2OperationError("Schedule item not found.", 404);
  const quantity = Math.max(1, Math.min(50, Number(params.quantity || 1) || 1));
  const inserted = await query<{ id: string }>(
    `insert into resource_requirements (
       occurrence_id, resource_type, quantity, required_attributes_json, notes
     )
     values ($1, $2, $3, $4::jsonb, $5)
     returning id`,
    [
      occurrence.id,
      normalizeResourceType(params.resourceType),
      quantity,
      JSON.stringify(asRecord(params.requiredAttributes)),
      cleanString(params.notes, 500) || null,
    ],
  );
  return { id: inserted.rows[0]?.id || null };
}

export async function assignConciergeV2Resource(params: {
  eventHistoryId: string;
  userId: string;
  occurrenceId: string;
  resourceId: string;
  startAt?: string | null;
  endAt?: string | null;
  notes?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canManageResources) {
    throw new ConciergeV2OperationError("You need scheduler or coach/teacher access to assign resources.", 403);
  }
  const workspaceId = access.page.workspace_id as string;
  const programId = access.page.program_id as string;
  const occurrence = await getOccurrenceForProgram(programId, params.occurrenceId);
  if (!occurrence) throw new ConciergeV2OperationError("Schedule item not found.", 404);
  const resource = await query<{ id: string }>(
    `select id from resources where id = $1 and workspace_id = $2 and status = 'active' limit 1`,
    [params.resourceId, workspaceId],
  );
  if (!resource.rows[0]) throw new ConciergeV2OperationError("Resource not found.", 404);
  const window = defaultAssignmentWindow(occurrence, params.startAt, params.endAt);
  const inserted = await query<{ id: string }>(
    `insert into resource_assignments (
       occurrence_id, resource_id, assigned_by_user_id, starts_at, ends_at, status, notes
     )
     values ($1, $2, $3, $4::timestamptz, $5::timestamptz, 'assigned', $6)
     returning id`,
    [
      occurrence.id,
      params.resourceId,
      params.userId,
      window.startsAt,
      window.endsAt,
      cleanString(params.notes, 500) || null,
    ],
  );
  return { id: inserted.rows[0]?.id || null };
}

export async function updateConciergeV2Attendance(params: {
  eventHistoryId: string;
  userId: string;
  occurrenceId: string;
  participantId: string;
  status: string;
  notes?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canMarkAttendance) {
    throw new ConciergeV2OperationError("You need check-in access to mark attendance.", 403);
  }
  const programId = access.page.program_id as string;
  const occurrence = await getOccurrenceForProgram(programId, params.occurrenceId);
  if (!occurrence) throw new ConciergeV2OperationError("Schedule item not found.", 404);
  const participant = await query<{ id: string }>(
    `select p.id
     from participants p
     join program_participants pp on pp.participant_id = p.id
     where p.id = $1 and pp.program_id = $2 and pp.roster_status = 'active'
     limit 1`,
    [params.participantId, programId],
  );
  if (!participant.rows[0]) throw new ConciergeV2OperationError("Participant not found.", 404);
  const status = normalizeAttendanceStatus(params.status);
  const checkedInAt = status === "present" || status === "late" ? "now()" : "null";
  const updated = await query(
    `insert into attendance_records (
       occurrence_id, participant_id, status, checked_in_at, marked_by_user_id, notes
     )
     values ($1, $2, $3, ${checkedInAt}, $4, $5)
     on conflict (occurrence_id, participant_id) where participant_id is not null
     do update set
       status = excluded.status,
       checked_in_at = case
         when excluded.status in ('present', 'late') then coalesce(attendance_records.checked_in_at, now())
         else null
       end,
       marked_by_user_id = excluded.marked_by_user_id,
       notes = excluded.notes,
       updated_at = now()
     returning id, status, checked_in_at`,
    [
      occurrence.id,
      params.participantId,
      status,
      params.userId,
      cleanString(params.notes, 500) || null,
    ],
  );
  return updated.rows[0] || null;
}

export async function checkOutConciergeV2Attendance(params: {
  eventHistoryId: string;
  userId: string;
  occurrenceId: string;
  participantId: string;
  notes?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canMarkAttendance) {
    throw new ConciergeV2OperationError("You need check-in access to check out participants.", 403);
  }
  const programId = access.page.program_id as string;
  const occurrence = await getOccurrenceForProgram(programId, params.occurrenceId);
  if (!occurrence) throw new ConciergeV2OperationError("Schedule item not found.", 404);
  const updated = await query(
    `update attendance_records ar
     set checked_out_at = now(),
       marked_by_user_id = $4,
       notes = coalesce($5, notes),
       updated_at = now()
     from program_participants pp
     where ar.occurrence_id = $1
       and ar.participant_id = $2
       and pp.participant_id = ar.participant_id
       and pp.program_id = $3
     returning ar.id, ar.status, ar.checked_in_at, ar.checked_out_at`,
    [
      occurrence.id,
      params.participantId,
      programId,
      params.userId,
      cleanString(params.notes, 500) || null,
    ],
  );
  if (!updated.rows[0]) {
    throw new ConciergeV2OperationError("Check this participant in before checking them out.", 409);
  }
  return updated.rows[0];
}

function csvCell(value: any) {
  const text = cleanString(value, 2000);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportConciergeV2AttendanceCsv(params: {
  eventHistoryId: string;
  userId: string;
  occurrenceId?: string | null;
}) {
  const access = await requireResourceAccess(params);
  if (!access.canMarkAttendance && !access.canManageResources) {
    throw new ConciergeV2OperationError("You need check-in access to export attendance.", 403);
  }
  const programId = access.page.program_id as string;
  const rows = await query<{
    occurrence_title: string;
    occurrence_start_at: string | null;
    participant_name: string;
    group_name: string | null;
    status: string | null;
    checked_in_at: string | null;
    checked_out_at: string | null;
    notes: string | null;
  }>(
    `select eo.title as occurrence_title, eo.start_at as occurrence_start_at,
       coalesce(p.display_name, concat_ws(' ', p.first_name, p.last_name)) as participant_name,
       pp.group_name, ar.status, ar.checked_in_at, ar.checked_out_at, ar.notes
     from program_participants pp
     join participants p on p.id = pp.participant_id
     join event_occurrences eo on eo.program_id = pp.program_id
     left join attendance_records ar on ar.occurrence_id = eo.id and ar.participant_id = p.id
     where pp.program_id = $1
       and pp.roster_status = 'active'
       and ($2::uuid is null or eo.id = $2::uuid)
     order by eo.start_at asc nulls last, participant_name asc`,
    [programId, cleanString(params.occurrenceId, 80) || null],
  );
  const lines = [
    ["Occurrence", "Starts At", "Participant", "Group", "Status", "Checked In", "Checked Out", "Notes"].join(","),
    ...rows.rows.map((row) =>
      [
        row.occurrence_title,
        row.occurrence_start_at,
        row.participant_name,
        row.group_name,
        row.status || "expected",
        row.checked_in_at,
        row.checked_out_at,
        row.notes,
      ].map(csvCell).join(","),
    ),
  ];
  return {
    filename: `envitefy-attendance-${params.eventHistoryId}.csv`,
    contentType: "text/csv; charset=utf-8",
    csv: `${lines.join("\n")}\n`,
  };
}
