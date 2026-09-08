import { query } from "@/lib/db";
import {
  getEventStartIso,
  normalizeDashboardEventOwnership,
  type DashboardEvent,
} from "@/lib/dashboard-data";
import { canShowOwnerRsvpDashboard } from "@/lib/owner-rsvp-dashboard";
import { buildEditLink } from "@/utils/event-edit-route";
import {
  buildDashboardAttention,
  findDashboardConflicts,
  summarizeDashboardSignup,
  type DashboardOverview,
} from "@/lib/dashboard-overview";

type OverviewRow = {
  id: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string | null;
  total?: string;
};

// Keep artwork and contact lists out of these reads. The editor resolver only
// needs routing metadata; sign-up details are aggregated before returning.
const EDIT_DATA = `jsonb_build_object(
  'category', data->'category', 'createdVia', data->'createdVia',
  'templateId', data->'templateId', 'variationId', data->'variationId',
  'ownership', data->'ownership', 'invitedFromScan', data->'invitedFromScan',
  'sourceContext', jsonb_build_object('type', data#>'{sourceContext,type}', 'detectedSourceIntent', data#>'{sourceContext,detectedSourceIntent}'),
  'conciergeDraft', jsonb_build_object('creationSessionId', data#>'{conciergeDraft,creationSessionId}'),
  'creationSessionId', data->'creationSessionId', 'status', data->'status',
  'startAt', coalesce(data->'startAt', data->'startISO', data->'start', data#>'{event,start}'),
  'updatedAt', data->'updatedAt', 'rsvpEnabled', data->'rsvpEnabled',
  'rsvp', data->'rsvp', 'numberOfGuests', data->'numberOfGuests',
  'primaryOutput', data->'primaryOutput', 'productType', data->'productType',
  'publicRenderer', data->'publicRenderer', 'requestedOutputs', data->'requestedOutputs'
)`;

export async function loadDashboardOverview(
  userId: string,
  events: DashboardEvent[],
): Promise<DashboardOverview> {
  const result: DashboardOverview = {
    attention: [],
    conflicts: findDashboardConflicts(events),
    guests: [],
    signups: [],
    drafts: { count: 0, items: [] },
    editLinks: {},
    unavailable: [],
  };
  const ownedIds = events.filter((event) => event.ownership === "owned").map((event) => event.id);
  const [ownedResult, draftResult] = await Promise.allSettled([
    ownedIds.length
      ? query<OverviewRow>(
          `select id::text, title, created_at::text, ${EDIT_DATA} as data from event_history where user_id = $1 and id = any($2::uuid[])`,
          [userId, ownedIds],
        )
      : Promise.resolve({ rows: [] as OverviewRow[] }),
    query<OverviewRow>(
      `select id::text, title, created_at::text, ${EDIT_DATA} as data, count(*) over()::text as total
       from event_history where user_id = $1 and lower(data->>'status') = 'draft'
       and case lower(trim(coalesce(data#>>'{sourceContext,detectedSourceIntent}', '')))
         when 'received_invite' then false
         when 'authoring_source' then true
         when 'reference_material' then true
         else lower(trim(coalesce(data->>'ownership', ''))) <> 'invited'
           and lower(trim(coalesce(data->>'invitedFromScan', 'false'))) <> 'true'
       end
       order by coalesce(data->>'updatedAt', created_at::text) desc, id desc limit 12`,
      [userId],
    ),
  ]);
  const ownedRows = ownedResult.status === "fulfilled" ? ownedResult.value.rows : [];
  if (ownedResult.status === "rejected") result.unavailable.push("event details");
  for (const row of ownedRows)
    result.editLinks[row.id] = buildEditLink(row.id, row.data, row.title);
  if (draftResult.status === "fulfilled") {
    result.drafts = {
      count: Number(draftResult.value.rows[0]?.total || 0),
      items: draftResult.value.rows
        .filter(
          (row) =>
            normalizeDashboardEventOwnership(
              row.data.ownership,
              row.data.createdVia,
              row.data.invitedFromScan,
              row.data.sourceContext,
            ) === "owned",
        )
        .map((row) => ({
          id: row.id,
          title: row.title || "Untitled event",
          startAt: getEventStartIso(row.data),
          updatedAt: typeof row.data.updatedAt === "string" ? row.data.updatedAt : row.created_at,
          href:
            String(row.data.createdVia || "").toLowerCase() === "studio"
              ? `/event/${encodeURIComponent(row.id)}`
              : buildEditLink(row.id, row.data, row.title),
        })),
    };
  } else result.unavailable.push("drafts");

  const rsvpIds = ownedRows
    .filter((row) => canShowOwnerRsvpDashboard(row.data))
    .map((row) => row.id);
  const titles = new Map(ownedRows.map((row) => [row.id, row.title]));
  const loadGuests = async () => {
    if (!rsvpIds.length) return;
    const response = await query<{
      event_id: string;
      going: string;
      maybe: string;
      declined: string;
    }>(
      `select eh.id::text as event_id,
       count(r.id) filter (where r.response = 'yes')::text as going,
       count(r.id) filter (where r.response = 'maybe')::text as maybe,
       count(r.id) filter (where r.response = 'no')::text as declined
       from event_history eh left join rsvp_responses r on r.event_id = eh.id
       where eh.user_id = $1 and eh.id = any($2::uuid[]) group by eh.id`,
      [userId, rsvpIds],
    );
    result.guests = response.rows.map((row) => ({
      eventId: row.event_id,
      title: titles.get(row.event_id) || "Event",
      going: Number(row.going),
      maybe: Number(row.maybe),
      declined: Number(row.declined),
      awaitingShared: null,
    }));
    // Shares are identifiable invited recipients. A target guest count is not
    // evidence of invitations, so never subtract responses from that target.
    try {
      const pending = await query<{ event_id: string; awaiting: string }>(
        `select es.event_id::text, count(distinct es.recipient_user_id)::text as awaiting
         from event_shares es join event_history eh on eh.id = es.event_id
         join users u on u.id = es.recipient_user_id
         where eh.user_id = $1 and es.event_id = any($2::uuid[])
           and es.revoked_at is null and es.status in ('pending', 'accepted')
           and not exists (select 1 from rsvp_responses r where r.event_id = es.event_id
             and (r.user_id = es.recipient_user_id or lower(r.email) = lower(u.email))
             and r.response in ('yes', 'no', 'maybe'))
         group by es.event_id`,
        [userId, rsvpIds],
      );
      const counts = new Map(pending.rows.map((row) => [row.event_id, Number(row.awaiting)]));
      for (const summary of result.guests)
        summary.awaitingShared = counts.get(summary.eventId) || 0;
    } catch {
      /* Replies remain useful when shared-invitation tracking is unavailable. */
    }
  };
  const loadSignups = async () => {
    if (!ownedIds.length) return;
    const exists = await query<{ available: string | null }>(
      "select to_regclass('public.signup_forms')::text as available",
    );
    const normalized = Boolean(exists.rows[0]?.available);
    const source = normalized
      ? "coalesce(sf.form, eh.data->'signupForm')"
      : "eh.data->'signupForm'";
    const forms = await query<{ id: string; title: string; form: unknown }>(
      `select eh.id::text, eh.title, jsonb_build_object(
        'enabled', ${source}->'enabled', 'sections', ${source}->'sections',
        'responses', coalesce((select jsonb_agg(jsonb_build_object('status', r->'status', 'slots', r->'slots'))
          from jsonb_array_elements(case when jsonb_typeof(${source}->'responses') = 'array' then ${source}->'responses' else '[]'::jsonb end) r), '[]'::jsonb)
       ) as form from event_history eh ${normalized ? "left join signup_forms sf on sf.event_id = eh.id" : ""}
       where eh.user_id = $1 and eh.id = any($2::uuid[]) and jsonb_typeof(${source}) = 'object'`,
      [userId, ownedIds],
    );
    result.signups = forms.rows.flatMap((row) => {
      const summary = summarizeDashboardSignup(row.id, row.title, row.form);
      return summary ? [summary] : [];
    });
  };
  const loads = await Promise.allSettled([loadGuests(), loadSignups()]);
  if (loads[0].status === "rejected") result.unavailable.push("guest responses");
  if (loads[1].status === "rejected") result.unavailable.push("sign-up progress");
  result.attention = buildDashboardAttention(events, result.editLinks);
  return result;
}
