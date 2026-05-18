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
  publicEventVisitors: number;
  publicEventViews: number;
  linkClicks: number;
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
  publicEventVisitors: number;
  publicEventViews: number;
  linkClicks: number;
  registryClicks: number;
};

export type AdminEventTrackedLink = {
  eventId: string;
  eventTitle: string;
  eventName: string;
  targetUrl: string | null;
  targetDomain: string | null;
  targetLabel: string | null;
  clicks: number;
  uniqueVisitors: number;
  lastClickedAt: string | null;
};

export type AdminEventsData = {
  summary: {
    totalEvents: number;
    publicEvents: number;
    events7Days: number;
    events30Days: number;
    rsvps: number;
    shares: number;
    publicEventViews: number;
    publicEventVisitors: number;
    linkClicks: number;
    registryClicks: number;
  };
  categories: AdminEventCategorySummary[];
  recentEvents: AdminEventListItem[];
  topLinks: AdminEventTrackedLink[];
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
  public_event_visitors: string | null;
  public_event_views: string | null;
  link_clicks: string | null;
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
  public_event_visitors: string | null;
  public_event_views: string | null;
  link_clicks: string | null;
  registry_clicks: string | null;
};

type LinkClickRow = {
  event_id: string;
  event_title: string | null;
  event_name: string;
  target_url: string | null;
  target_domain: string | null;
  target_label: string | null;
  clicks: string;
  unique_visitors: string;
  last_clicked_at: Date | string | null;
};

export async function getAdminEventsData(
  limit = 12,
  options: AdminEventsDataOptions = {},
): Promise<AdminEventsData> {
  const rsvpsExist = await tableExists("rsvp_responses");
  const trackingEventsExist = await tableExists("event_tracking_events");
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
  const trackingJoin = trackingEventsExist
    ? `left join (
         select
           event_id,
           count(*) filter (where event_name = 'public_event_view')::integer as public_event_views,
           count(distinct coalesce(viewer_user_id::text, visitor_id_hash, id::text))
             filter (where event_name = 'public_event_view')::integer as public_event_visitors,
           count(*) filter (where event_name = 'share_link_click')::integer as share_clicks,
           count(*) filter (where event_name in ('share_link_click', 'registry_click', 'event_link_click'))::integer as link_clicks,
           count(*) filter (where event_name = 'registry_click')::integer as registry_clicks
         from event_tracking_events
         group by event_id
       ) tracking_counts on tracking_counts.event_id = eh.id`
    : "";
  const publicEventViewsSelect = trackingEventsExist
    ? "coalesce(tracking_counts.public_event_views, 0)"
    : "0";
  const publicEventVisitorsSelect = trackingEventsExist
    ? "coalesce(tracking_counts.public_event_visitors, 0)"
    : "0";
  const shareClicksSelect = trackingEventsExist ? "coalesce(tracking_counts.share_clicks, 0)" : "0";
  const linkClicksSelect = trackingEventsExist ? "coalesce(tracking_counts.link_clicks, 0)" : "0";
  const registryClicksSelect = trackingEventsExist
    ? "coalesce(tracking_counts.registry_clicks, 0)"
    : "0";

  const [summary, categories, recent, topLinks] = await Promise.all([
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
      trackingEventsExist
        ? query<{ n: string }>(
            `select (
               (select count(*) from event_shares)
               + (select count(*) from event_tracking_events where event_name = 'share_link_click')
             )::text as n`,
          )
        : query<{ n: string }>(`select count(*)::text as n from event_shares`),
      trackingEventsExist
        ? query<{ n: string }>(
            `select count(*)::text as n
             from event_tracking_events
             where event_name = 'public_event_view'`,
          )
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
      trackingEventsExist
        ? query<{ n: string }>(
            `select count(distinct coalesce(viewer_user_id::text, visitor_id_hash, id::text))::text as n
             from event_tracking_events
             where event_name = 'public_event_view'`,
          )
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
      trackingEventsExist
        ? query<{ n: string }>(
            `select count(*)::text as n
             from event_tracking_events
             where event_name in ('share_link_click', 'registry_click', 'event_link_click')`,
          )
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
      trackingEventsExist
        ? query<{ n: string }>(
            `select count(*)::text as n
             from event_tracking_events
             where event_name = 'registry_click'`,
          )
        : Promise.resolve({ rows: [{ n: "0" }] } as Awaited<
            ReturnType<typeof query<{ n: string }>>
          >),
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
        coalesce(sum(coalesce(share_counts.share_count, 0) + ${shareClicksSelect}), 0)::text as shares,
        coalesce(sum(${rsvpSelect}), 0)::text as rsvps,
        coalesce(sum(${publicEventVisitorsSelect}), 0)::text as public_event_visitors,
        coalesce(sum(${publicEventViewsSelect}), 0)::text as public_event_views,
        coalesce(sum(${linkClicksSelect}), 0)::text as link_clicks,
        max(eh.created_at) as last_created_at
      from event_history eh
      left join share_counts on share_counts.event_id = eh.id
      ${rsvpJoin}
      ${trackingJoin}
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
            (coalesce(share_counts.share_count, 0) + ${shareClicksSelect})::text as shares,
            ${rsvpSelect}::text as rsvps,
            ${publicEventVisitorsSelect}::text as public_event_visitors,
            ${publicEventViewsSelect}::text as public_event_views,
            ${linkClicksSelect}::text as link_clicks,
            ${registryClicksSelect}::text as registry_clicks
          from event_history eh
          left join users on users.id = eh.user_id
          left join share_counts on share_counts.event_id = eh.id
          ${rsvpJoin}
          ${trackingJoin}
          order by eh.created_at desc nulls last, eh.id desc
          limit $1
        `,
          [safeLimit],
        )
      : Promise.resolve({ rows: [] as EventRow[] }),
    trackingEventsExist
      ? query<LinkClickRow>(
          `
          select
            ete.event_id::text as event_id,
            eh.title as event_title,
            ete.event_name,
            ete.target_url,
            ete.target_domain,
            ete.target_label,
            count(*)::text as clicks,
            count(distinct coalesce(ete.viewer_user_id::text, ete.visitor_id_hash, ete.id::text))::text as unique_visitors,
            max(ete.occurred_at) as last_clicked_at
          from event_tracking_events ete
          left join event_history eh on eh.id = ete.event_id
          where ete.event_name in ('share_link_click', 'registry_click', 'event_link_click')
          group by 1, 2, 3, 4, 5, 6
          order by count(*) desc, max(ete.occurred_at) desc nulls last
          limit 12
        `,
        )
      : Promise.resolve({ rows: [] as LinkClickRow[] }),
  ]);

  const [
    total,
    publicEvents,
    events7,
    events30,
    rsvps,
    shares,
    publicEventViews,
    publicEventVisitors,
    linkClicks,
    registryClicks,
  ] = summary;

  return {
    summary: {
      totalEvents: toNumber(total.rows[0]?.n),
      publicEvents: toNumber(publicEvents.rows[0]?.n),
      events7Days: toNumber(events7.rows[0]?.n),
      events30Days: toNumber(events30.rows[0]?.n),
      rsvps: toNumber(rsvps.rows[0]?.n),
      shares: toNumber(shares.rows[0]?.n),
      publicEventViews: toNumber(publicEventViews.rows[0]?.n),
      publicEventVisitors: toNumber(publicEventVisitors.rows[0]?.n),
      linkClicks: toNumber(linkClicks.rows[0]?.n),
      registryClicks: toNumber(registryClicks.rows[0]?.n),
    },
    categories: categories.rows.map((row) => ({
      category: row.category || "Uncategorized",
      label: humanizeCategory(row.category),
      events: toNumber(row.events),
      scans: toNumber(row.scans),
      shares: toNumber(row.shares),
      rsvps: toNumber(row.rsvps),
      publicEventVisitors: toNumber(row.public_event_visitors),
      publicEventViews: toNumber(row.public_event_views),
      linkClicks: toNumber(row.link_clicks),
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
      publicEventVisitors: toNumber(row.public_event_visitors),
      publicEventViews: toNumber(row.public_event_views),
      linkClicks: toNumber(row.link_clicks),
      registryClicks: toNumber(row.registry_clicks),
    })),
    topLinks: topLinks.rows.map((row) => ({
      eventId: row.event_id,
      eventTitle: row.event_title || "Untitled event",
      eventName: row.event_name,
      targetUrl: row.target_url || null,
      targetDomain: row.target_domain || null,
      targetLabel: row.target_label || null,
      clicks: toNumber(row.clicks),
      uniqueVisitors: toNumber(row.unique_visitors),
      lastClickedAt: toIsoString(row.last_clicked_at),
    })),
  };
}
