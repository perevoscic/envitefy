import { query } from "@/lib/db";
import {
  ADMIN_SCAN_SQL,
  daysAgo,
  humanizeCategory,
  tableExists,
  toIsoString,
  toNumber,
} from "./data-utils";

export type AdminEventCategorySummary = {
  category: string;
  label: string;
  events: number;
  scans: number;
  shares: number;
  rsvps: number;
  lastCreatedAt: string | null;
};

export type AdminEventListItem = {
  id: string;
  title: string;
  category: string;
  publicSlug: string | null;
  ownerEmail: string | null;
  createdVia: string | null;
  createdAt: string | null;
  shares: number;
  rsvps: number;
};

export type AdminEventsData = {
  summary: {
    totalEvents: number;
    publicEvents: number;
    events7Days: number;
    events30Days: number;
    rsvps: number;
    shares: number;
  };
  categories: AdminEventCategorySummary[];
  recentEvents: AdminEventListItem[];
};

export type AdminEventsDataOptions = {
  includeRecent?: boolean;
};

type CategoryRow = {
  category: string | null;
  events: string;
  scans: string;
  shares: string | null;
  rsvps: string | null;
  last_created_at: Date | string | null;
};

type EventRow = {
  id: string;
  title: string | null;
  category: string | null;
  public_slug: string | null;
  owner_email: string | null;
  created_via: string | null;
  created_at: Date | string | null;
  shares: string | null;
  rsvps: string | null;
};

export async function getAdminEventsData(
  limit = 12,
  options: AdminEventsDataOptions = {},
): Promise<AdminEventsData> {
  const rsvpsExist = await tableExists("rsvp_responses");
  const includeRecent = options.includeRecent ?? true;
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  const rsvpJoin = rsvpsExist
    ? `left join (
         select event_id, count(*)::integer as rsvp_count
         from rsvp_responses
         group by event_id
       ) rsvp_counts on rsvp_counts.event_id = eh.id`
    : "";
  const rsvpSelect = rsvpsExist ? "coalesce(rsvp_counts.rsvp_count, 0)" : "0";

  const [summary, categories, recent] = await Promise.all([
    Promise.all([
      query<{ n: string }>(`select count(*)::text as n from event_history`),
      query<{ n: string }>(
        `select count(*)::text as n
         from event_history
         where public_slug is not null and public_slug <> ''`,
      ),
      query<{ n: string }>(
        `select count(*)::text as n from event_history where created_at >= $1::timestamptz`,
        [daysAgo(7)],
      ),
      query<{ n: string }>(
        `select count(*)::text as n from event_history where created_at >= $1::timestamptz`,
        [daysAgo(30)],
      ),
      rsvpsExist
        ? query<{ n: string }>(`select count(*)::text as n from rsvp_responses`)
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
      query<{ n: string }>(`select count(*)::text as n from event_shares`),
    ]),
    query<CategoryRow>(`
      with share_counts as (
        select event_id, count(*)::integer as share_count
        from event_shares
        group by event_id
      )
      select
        coalesce(nullif(eh.data->>'category', ''), 'Uncategorized') as category,
        count(*)::text as events,
        coalesce(sum(case when ${ADMIN_SCAN_SQL} then 1 else 0 end), 0)::text as scans,
        coalesce(sum(coalesce(share_counts.share_count, 0)), 0)::text as shares,
        coalesce(sum(${rsvpSelect}), 0)::text as rsvps,
        max(eh.created_at) as last_created_at
      from event_history eh
      left join share_counts on share_counts.event_id = eh.id
      ${rsvpJoin}
      group by 1
      order by count(*) desc, max(eh.created_at) desc nulls last
      limit 10
    `),
    includeRecent
      ? query<EventRow>(
          `
          with share_counts as (
            select event_id, count(*)::integer as share_count
            from event_shares
            group by event_id
          )
          select
            eh.id::text as id,
            eh.title,
            coalesce(nullif(eh.data->>'category', ''), 'Uncategorized') as category,
            eh.public_slug,
            users.email as owner_email,
            nullif(eh.data->>'createdVia', '') as created_via,
            eh.created_at,
            coalesce(share_counts.share_count, 0)::text as shares,
            ${rsvpSelect}::text as rsvps
          from event_history eh
          left join users on users.id = eh.user_id
          left join share_counts on share_counts.event_id = eh.id
          ${rsvpJoin}
          order by eh.created_at desc nulls last, eh.id desc
          limit $1
        `,
          [safeLimit],
        )
      : Promise.resolve({ rows: [] as EventRow[] }),
  ]);

  const [total, publicEvents, events7, events30, rsvps, shares] = summary;

  return {
    summary: {
      totalEvents: toNumber(total.rows[0]?.n),
      publicEvents: toNumber(publicEvents.rows[0]?.n),
      events7Days: toNumber(events7.rows[0]?.n),
      events30Days: toNumber(events30.rows[0]?.n),
      rsvps: toNumber(rsvps.rows[0]?.n),
      shares: toNumber(shares.rows[0]?.n),
    },
    categories: categories.rows.map((row) => ({
      category: row.category || "Uncategorized",
      label: humanizeCategory(row.category),
      events: toNumber(row.events),
      scans: toNumber(row.scans),
      shares: toNumber(row.shares),
      rsvps: toNumber(row.rsvps),
      lastCreatedAt: toIsoString(row.last_created_at),
    })),
    recentEvents: recent.rows.map((row) => ({
      id: row.id,
      title: row.title || "Untitled event",
      category: humanizeCategory(row.category),
      publicSlug: row.public_slug || null,
      ownerEmail: row.owner_email || null,
      createdVia: row.created_via || null,
      createdAt: toIsoString(row.created_at),
      shares: toNumber(row.shares),
      rsvps: toNumber(row.rsvps),
    })),
  };
}
