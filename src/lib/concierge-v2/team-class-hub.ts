import { query } from "@/lib/db";
import { ConciergeV2OperationError } from "./operations";
import { ensureConciergeV2Tables } from "./storage";

export const CONCIERGE_V2_WORKSPACE_ROLES = [
  "platform_admin",
  "org_admin",
  "program_manager",
  "scheduler",
  "coach_teacher",
  "front_desk_checkin",
  "parent_guardian",
  "participant",
  "guest",
] as const;

type WorkspaceRole = (typeof CONCIERGE_V2_WORKSPACE_ROLES)[number];

type EventPageRow = {
  event_page_id: string;
  workspace_id: string | null;
  workspace_name: string | null;
  workspace_type: string | null;
  program_id: string | null;
  program_title: string | null;
  program_mode: string | null;
  owner_user_id: string | null;
  event_title: string;
};

type MembershipRow = {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  role: string;
  status: string;
  accepted_at: string | null;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  grade: string | null;
  school_name: string | null;
  allergies: string | null;
  family_name: string | null;
  roster_role: string | null;
  roster_status: string | null;
  group_name: string | null;
  jersey_number: string | null;
  notes: string | null;
  created_at: string;
};

type SummaryCountRow = {
  upcoming_count?: string | number;
  deadline_count?: string | number;
  family_count?: string | number;
  participant_count?: string | number;
  form_count?: string | number;
  form_response_count?: string | number;
  rsvp_count?: string | number;
  open_signup_count?: string | number;
  claim_count?: string | number;
  payment_count?: string | number;
  unpaid_payment_count?: string | number;
  reminder_count?: string | number;
};

function cleanString(value: any, maxLength = 500): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanEmail(value: any): string {
  return cleanString(value, 320).toLowerCase();
}

function countValue(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}

function normalizeRole(value: any): WorkspaceRole {
  const role = cleanString(value, 80);
  return CONCIERGE_V2_WORKSPACE_ROLES.includes(role as WorkspaceRole)
    ? (role as WorkspaceRole)
    : "parent_guardian";
}

function canManagePeople(role: string | null | undefined): boolean {
  return ["platform_admin", "org_admin", "program_manager", "scheduler", "coach_teacher"].includes(
    cleanString(role, 80),
  );
}

function canManageRoles(role: string | null | undefined): boolean {
  return ["platform_admin", "org_admin", "program_manager"].includes(cleanString(role, 80));
}

async function getEventPage(eventHistoryId: string): Promise<EventPageRow | null> {
  const res = await query<EventPageRow>(
    `select ep.id as event_page_id, ep.workspace_id, w.name as workspace_name,
       w.workspace_type, ep.program_id, p.title as program_title, p.mode as program_mode,
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

async function getMembership(params: {
  workspaceId: string;
  userId: string;
}): Promise<MembershipRow | null> {
  const res = await query<MembershipRow>(
    `select id, user_id, invited_email, role, status, accepted_at, created_at
     from memberships
     where workspace_id = $1 and user_id = $2 and status = 'active'
     limit 1`,
    [params.workspaceId, params.userId],
  );
  return res.rows[0] || null;
}

async function ensureOwnerMembership(params: {
  workspaceId: string | null;
  userId: string;
}): Promise<MembershipRow | null> {
  if (!params.workspaceId) return null;
  const existing = await getMembership({ workspaceId: params.workspaceId, userId: params.userId });
  if (existing) {
    if (canManageRoles(existing.role)) return existing;
    const promoted = await query<MembershipRow>(
      `update memberships
       set role = 'program_manager', status = 'active', accepted_at = coalesce(accepted_at, now()), updated_at = now()
       where id = $1
       returning id, user_id, invited_email, role, status, accepted_at, created_at`,
      [existing.id],
    );
    return promoted.rows[0] || existing;
  }
  const inserted = await query<MembershipRow>(
    `insert into memberships (workspace_id, user_id, role, status, invited_by_user_id, accepted_at)
     values ($1, $2, 'program_manager', 'active', $2, now())
     returning id, user_id, invited_email, role, status, accepted_at, created_at`,
    [params.workspaceId, params.userId],
  );
  return inserted.rows[0] || null;
}

async function requireHubAccess(params: {
  eventHistoryId: string;
  userId: string;
}): Promise<{ page: EventPageRow; membership: MembershipRow | null; role: string; canManagePeople: boolean; canManageRoles: boolean }> {
  await ensureConciergeV2Tables();
  const page = await getEventPage(params.eventHistoryId);
  if (!page) throw new ConciergeV2OperationError("Concierge event page not found.", 404);
  if (!page.workspace_id) throw new ConciergeV2OperationError("Workspace not found for this event.", 404);

  const membership =
    page.owner_user_id === params.userId
      ? await ensureOwnerMembership({ workspaceId: page.workspace_id, userId: params.userId })
      : await getMembership({ workspaceId: page.workspace_id, userId: params.userId });
  if (!membership && page.owner_user_id !== params.userId) {
    throw new ConciergeV2OperationError("You do not have access to this workspace.", 403);
  }
  const role = membership?.role || "program_manager";
  return {
    page,
    membership,
    role,
    canManagePeople: canManagePeople(role),
    canManageRoles: canManageRoles(role),
  };
}

async function loadMembers(workspaceId: string) {
  const res = await query<MembershipRow>(
    `select id, user_id, invited_email, role, status, accepted_at, created_at
     from memberships
     where workspace_id = $1 and status <> 'removed'
     order by
       case role
         when 'platform_admin' then 1
         when 'org_admin' then 2
         when 'program_manager' then 3
         when 'scheduler' then 4
         when 'coach_teacher' then 5
         when 'front_desk_checkin' then 6
         when 'parent_guardian' then 7
         when 'participant' then 8
         else 9
       end,
       created_at asc`,
    [workspaceId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    invitedEmail: row.invited_email,
    role: row.role,
    status: row.status,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }));
}

async function loadParticipants(programId: string) {
  const res = await query<ParticipantRow>(
    `select p.id, p.first_name, p.last_name, p.display_name, p.grade, p.school_name,
       p.allergies, f.name as family_name, pp.role as roster_role, pp.roster_status,
       pp.group_name, pp.jersey_number, pp.notes, p.created_at
     from program_participants pp
     join participants p on p.id = pp.participant_id
     left join families f on f.id = p.family_id
     where pp.program_id = $1
     order by p.display_name asc nulls last, p.first_name asc, p.last_name asc nulls last`,
    [programId],
  );
  return res.rows.map((row) => ({
    id: row.id,
    name: cleanString(row.display_name, 160) || [row.first_name, row.last_name].map((part) => cleanString(part, 80)).filter(Boolean).join(" "),
    firstName: row.first_name,
    lastName: row.last_name,
    familyName: row.family_name,
    role: row.roster_role || "participant",
    status: row.roster_status || "active",
    groupName: row.group_name,
    jerseyNumber: row.jersey_number,
    grade: row.grade,
    schoolName: row.school_name,
    allergies: row.allergies,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

async function loadUpcoming(programId: string) {
  const res = await query(
    `select id, title, occurrence_type, start_at, end_at, timezone, location_text, status
     from event_occurrences
     where program_id = $1 and status <> 'canceled'
     order by start_at asc nulls last, created_at asc
     limit 8`,
    [programId],
  );
  return res.rows.map((row: any) => ({
    id: String(row.id),
    title: cleanString(row.title, 220),
    type: cleanString(row.occurrence_type, 80) || "event",
    startAt: row.start_at || null,
    endAt: row.end_at || null,
    timezone: row.timezone || null,
    locationText: row.location_text || null,
    status: cleanString(row.status, 80),
  }));
}

async function loadSummary(params: {
  eventHistoryId: string;
  workspaceId: string;
  programId: string;
}) {
  const [schedule, families, forms, rsvps, volunteer, payments, reminders] = await Promise.all([
    query<SummaryCountRow>(
      `select
        count(*) filter (where status <> 'canceled') as upcoming_count,
        count(*) filter (where status <> 'canceled' and occurrence_type = 'deadline') as deadline_count
       from event_occurrences
       where program_id = $1`,
      [params.programId],
    ),
    query<SummaryCountRow>(`select count(*) as family_count from families where workspace_id = $1`, [params.workspaceId]),
    query<SummaryCountRow>(
      `select count(distinct sf.id) as form_count, count(fr.id) as form_response_count
       from smart_forms sf
       left join form_responses fr on fr.form_id = sf.id
       where sf.program_id = $1`,
      [params.programId],
    ),
    query<SummaryCountRow>(`select count(*) as rsvp_count from rsvp_responses where event_id = $1`, [
      params.eventHistoryId,
    ]),
    query<SummaryCountRow>(
      `select
        count(distinct vs.id) filter (where coalesce(vs.claimed_quantity, 0) < vs.quantity_needed) as open_signup_count,
        count(vc.id) as claim_count
       from volunteer_slots vs
       join volunteer_boards vb on vb.id = vs.board_id
       left join volunteer_claims vc on vc.slot_id = vs.id and vc.status = 'active'
       where vb.program_id = $1`,
      [params.programId],
    ),
    query<SummaryCountRow>(
      `select count(*) as payment_count,
        count(*) filter (where status in ('unpaid', 'pending')) as unpaid_payment_count
       from payment_requests
       where program_id = $1`,
      [params.programId],
    ),
    query<SummaryCountRow>(
      `select count(*) as reminder_count
       from reminders
       where program_id = $1 and status in ('scheduled', 'draft')`,
      [params.programId],
    ),
  ]);
  const scheduleRow = schedule.rows[0] || {};
  const familyRow = families.rows[0] || {};
  const formRow = forms.rows[0] || {};
  const rsvpRow = rsvps.rows[0] || {};
  const volunteerRow = volunteer.rows[0] || {};
  const paymentRow = payments.rows[0] || {};
  const reminderRow = reminders.rows[0] || {};
  return {
    upcomingCount: countValue(scheduleRow.upcoming_count),
    deadlineCount: countValue(scheduleRow.deadline_count),
    familyCount: countValue(familyRow.family_count),
    formCount: countValue(formRow.form_count),
    formResponseCount: countValue(formRow.form_response_count),
    rsvpCount: countValue(rsvpRow.rsvp_count),
    openSignupCount: countValue(volunteerRow.open_signup_count),
    claimCount: countValue(volunteerRow.claim_count),
    paymentCount: countValue(paymentRow.payment_count),
    unpaidPaymentCount: countValue(paymentRow.unpaid_payment_count),
    reminderCount: countValue(reminderRow.reminder_count),
  };
}

function hubMode(programMode: string | null, eventTitle: string): "parent" | "team" | "class" {
  const mode = cleanString(programMode, 80).toLowerCase();
  const title = eventTitle.toLowerCase();
  if (["team", "gymnastics", "sports"].includes(mode) || /\b(team|meet|game|practice|season)\b/.test(title)) return "team";
  if (["class", "school"].includes(mode) || /\b(class|school|teacher|field trip|spirit week)\b/.test(title)) return "class";
  return "parent";
}

export async function getConciergeV2TeamClassHub(params: {
  eventHistoryId: string;
  userId: string;
}) {
  const access = await requireHubAccess(params);
  if (!access.page.program_id || !access.page.workspace_id) {
    throw new ConciergeV2OperationError("Hub program not found.", 404);
  }
  const [members, participants, upcoming, summary] = await Promise.all([
    loadMembers(access.page.workspace_id),
    loadParticipants(access.page.program_id),
    loadUpcoming(access.page.program_id),
    loadSummary({
      eventHistoryId: params.eventHistoryId,
      workspaceId: access.page.workspace_id,
      programId: access.page.program_id,
    }),
  ]);
  return {
    event: {
      id: params.eventHistoryId,
      eventPageId: access.page.event_page_id,
      title: access.page.event_title,
      programId: access.page.program_id,
      programTitle: access.page.program_title,
      mode: access.page.program_mode,
    },
    workspace: {
      id: access.page.workspace_id,
      name: access.page.workspace_name || "Workspace",
      type: access.page.workspace_type || "personal",
    },
    currentUser: {
      role: access.role,
      canManagePeople: access.canManagePeople,
      canManageRoles: access.canManageRoles,
    },
    hubMode: hubMode(access.page.program_mode, access.page.event_title),
    members,
    participants,
    upcoming,
    summary: {
      ...summary,
      memberCount: members.length,
      participantCount: participants.length,
    },
  };
}

export async function inviteConciergeV2HubMember(params: {
  eventHistoryId: string;
  userId: string;
  invitedEmail: string;
  role?: string | null;
}) {
  const access = await requireHubAccess(params);
  if (!access.canManageRoles) {
    throw new ConciergeV2OperationError("You need program manager access to invite workspace members.", 403);
  }
  const workspaceId = access.page.workspace_id;
  if (!workspaceId) throw new ConciergeV2OperationError("Workspace not found for this event.", 404);
  const email = cleanEmail(params.invitedEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConciergeV2OperationError("Enter a valid email address.", 400);
  }
  const role = normalizeRole(params.role);
  const userRes = await query<{ id: string }>(
    `select id from users where lower(email) = $1 order by created_at asc limit 1`,
    [email],
  );
  const existingUserId = userRes.rows[0]?.id || null;
  const existing = existingUserId
    ? await query<MembershipRow>(
        `select id, user_id, invited_email, role, status, accepted_at, created_at
         from memberships
         where workspace_id = $1 and user_id = $2
         limit 1`,
        [workspaceId, existingUserId],
      )
    : await query<MembershipRow>(
        `select id, user_id, invited_email, role, status, accepted_at, created_at
         from memberships
         where workspace_id = $1 and lower(invited_email) = $2 and user_id is null
         limit 1`,
        [workspaceId, email],
      );
  if (existing.rows[0]) {
    const updated = await query<MembershipRow>(
      `update memberships
       set invited_email = $2, role = $3, status = $4, invited_by_user_id = $5,
         accepted_at = case when $6::uuid is not null then coalesce(accepted_at, now()) else accepted_at end,
         updated_at = now()
       where id = $1
       returning id, user_id, invited_email, role, status, accepted_at, created_at`,
      [
        existing.rows[0].id,
        email,
        role,
        existingUserId ? "active" : "invited",
        params.userId,
        existingUserId,
      ],
    );
    return updated.rows[0];
  }
  const inserted = await query<MembershipRow>(
    `insert into memberships (
       workspace_id, user_id, invited_email, role, status, invited_by_user_id, accepted_at
     )
     values ($1, $2, $3, $4, $5, $6, case when $2::uuid is not null then now() else null end)
     returning id, user_id, invited_email, role, status, accepted_at, created_at`,
    [workspaceId, existingUserId, email, role, existingUserId ? "active" : "invited", params.userId],
  );
  return inserted.rows[0];
}

export async function createConciergeV2HubParticipant(params: {
  eventHistoryId: string;
  userId: string;
  firstName: string;
  lastName?: string | null;
  familyName?: string | null;
  role?: string | null;
  groupName?: string | null;
  grade?: string | null;
  schoolName?: string | null;
  allergies?: string | null;
  notes?: string | null;
}) {
  const access = await requireHubAccess(params);
  if (!access.canManagePeople) {
    throw new ConciergeV2OperationError("You need scheduler or coach/teacher access to manage participants.", 403);
  }
  const workspaceId = access.page.workspace_id;
  const programId = access.page.program_id;
  if (!workspaceId || !programId) throw new ConciergeV2OperationError("Hub program not found.", 404);

  const firstName = cleanString(params.firstName, 80);
  if (!firstName) throw new ConciergeV2OperationError("Participant first name is required.", 400);
  const lastName = cleanString(params.lastName, 80) || null;
  const displayName = [firstName, lastName].filter(Boolean).join(" ");
  const familyName = cleanString(params.familyName, 160);
  let familyId: string | null = null;
  if (familyName) {
    const existing = await query<{ id: string }>(
      `select id from families where workspace_id = $1 and lower(name) = lower($2) limit 1`,
      [workspaceId, familyName],
    );
    if (existing.rows[0]?.id) {
      familyId = existing.rows[0].id;
    } else {
      const created = await query<{ id: string }>(
        `insert into families (workspace_id, name, timezone)
         values ($1, $2, 'America/Chicago')
         returning id`,
        [workspaceId, familyName],
      );
      familyId = created.rows[0]?.id || null;
    }
  }

  const participant = await query<{ id: string }>(
    `insert into participants (
       workspace_id, family_id, first_name, last_name, display_name, grade,
       school_name, allergies, profile_json
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     returning id`,
    [
      workspaceId,
      familyId,
      firstName,
      lastName,
      displayName,
      cleanString(params.grade, 80) || null,
      cleanString(params.schoolName, 160) || null,
      cleanString(params.allergies, 500) || null,
      JSON.stringify({ source: "concierge_v2_hub" }),
    ],
  );
  const participantId = participant.rows[0]?.id;
  if (!participantId) throw new ConciergeV2OperationError("Unable to create participant.", 500);

  await query(
    `insert into program_participants (
       workspace_id, program_id, participant_id, role, roster_status, group_name, notes, metadata_json
     )
     values ($1, $2, $3, $4, 'active', $5, $6, $7::jsonb)`,
    [
      workspaceId,
      programId,
      participantId,
      cleanString(params.role, 80) || "participant",
      cleanString(params.groupName, 120) || null,
      cleanString(params.notes, 500) || null,
      JSON.stringify({ source: "concierge_v2_hub" }),
    ],
  );

  await query(
    `insert into audit_logs (workspace_id, actor_user_id, action, entity_type, entity_id, after_json)
     values ($1, $2, 'concierge_v2.participant.create', 'participant', $3, $4::jsonb)`,
    [workspaceId, params.userId, participantId, JSON.stringify({ programId, familyId })],
  );
  return { id: participantId };
}
