type AdminUserMetricCategory =
  | "birthdays"
  | "weddings"
  | "sport_events"
  | "appointments"
  | "doctor_appointments"
  | "play_days"
  | "general_events"
  | "car_pool";

export type AdminUserListItem = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  scans_total: number;
  shares_sent: number;
  events_total: number;
  last_event_created_at: string | null;
  last_scan_created_at: string | null;
} & Record<`scans_${AdminUserMetricCategory}` | `events_${AdminUserMetricCategory}`, number>;

export type AdminUserListPage = {
  items: AdminUserListItem[];
  nextCursor: string | null;
};

export const ADMIN_USER_METRICS_CTE_SQL = `
  with event_rows as materialized (
    select
      user_id,
      created_at,
      lower(coalesce(data->>'category', '')) as category,
      (
        lower(coalesce(data->>'createdVia', '')) = 'ocr'
        or lower(coalesce(data->>'createdVia', '')) like 'ocr-%'
        or lower(coalesce(data->'sourceContext'->>'type', '')) in ('upload', 'snap', 'ocr_text')
      ) as is_scan
    from event_history
  ),
  event_metrics as (
    select
      user_id,
      count(*)::integer as events_total,
      coalesce(sum(case when category like '%birthday%' then 1 else 0 end), 0)::integer as events_birthdays,
      coalesce(sum(case when category like '%wedding%' then 1 else 0 end), 0)::integer as events_weddings,
      coalesce(sum(case when category like '%sport%' then 1 else 0 end), 0)::integer as events_sport_events,
      coalesce(sum(case when category = 'appointments' or category like '%appointment%' then 1 else 0 end), 0)::integer as events_appointments,
      coalesce(sum(case when (category like '%doctor%' or category like '%medical%') then 1 else 0 end), 0)::integer as events_doctor_appointments,
      coalesce(sum(case when category like '%play%' then 1 else 0 end), 0)::integer as events_play_days,
      coalesce(sum(case when category like '%general%' then 1 else 0 end), 0)::integer as events_general_events,
      coalesce(sum(case when category like '%car%' or category like '%pool%' then 1 else 0 end), 0)::integer as events_car_pool,
      coalesce(sum(case when is_scan then 1 else 0 end), 0)::integer as scans_from_history_total,
      coalesce(sum(case when is_scan and category like '%birthday%' then 1 else 0 end), 0)::integer as scans_from_history_birthdays,
      coalesce(sum(case when is_scan and category like '%wedding%' then 1 else 0 end), 0)::integer as scans_from_history_weddings,
      coalesce(sum(case when is_scan and category like '%sport%' then 1 else 0 end), 0)::integer as scans_from_history_sport_events,
      coalesce(sum(case when is_scan and (category = 'appointments' or category like '%appointment%') then 1 else 0 end), 0)::integer as scans_from_history_appointments,
      coalesce(sum(case when is_scan and (category like '%doctor%' or category like '%medical%') then 1 else 0 end), 0)::integer as scans_from_history_doctor_appointments,
      coalesce(sum(case when is_scan and category like '%play%' then 1 else 0 end), 0)::integer as scans_from_history_play_days,
      coalesce(sum(case when is_scan and category like '%general%' then 1 else 0 end), 0)::integer as scans_from_history_general_events,
      coalesce(sum(case when is_scan and (category like '%car%' or category like '%pool%') then 1 else 0 end), 0)::integer as scans_from_history_car_pool,
      max(created_at) as last_event_created_at,
      max(case when is_scan then created_at else null end) as last_scan_created_at
    from event_rows
    where user_id is not null
    group by user_id
  ),
  share_metrics as (
    select
      owner_user_id as user_id,
      count(*)::integer as shares_sent
    from event_shares
    where owner_user_id is not null
    group by owner_user_id
  ),
  admin_users_with_metrics as (
    select
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.created_at,
      greatest(coalesce(u.scans_total, 0), coalesce(em.scans_from_history_total, 0))::integer as scans_total,
      greatest(coalesce(u.shares_sent, 0), coalesce(sm.shares_sent, 0))::integer as shares_sent,
      greatest(coalesce(u.scans_birthdays, 0), coalesce(em.scans_from_history_birthdays, 0))::integer as scans_birthdays,
      greatest(coalesce(u.scans_weddings, 0), coalesce(em.scans_from_history_weddings, 0))::integer as scans_weddings,
      greatest(coalesce(u.scans_sport_events, 0), coalesce(em.scans_from_history_sport_events, 0))::integer as scans_sport_events,
      greatest(coalesce(u.scans_appointments, 0), coalesce(em.scans_from_history_appointments, 0))::integer as scans_appointments,
      greatest(coalesce(u.scans_doctor_appointments, 0), coalesce(em.scans_from_history_doctor_appointments, 0))::integer as scans_doctor_appointments,
      greatest(coalesce(u.scans_play_days, 0), coalesce(em.scans_from_history_play_days, 0))::integer as scans_play_days,
      greatest(coalesce(u.scans_general_events, 0), coalesce(em.scans_from_history_general_events, 0))::integer as scans_general_events,
      greatest(coalesce(u.scans_car_pool, 0), coalesce(em.scans_from_history_car_pool, 0))::integer as scans_car_pool,
      coalesce(em.events_total, 0)::integer as events_total,
      coalesce(em.events_birthdays, 0)::integer as events_birthdays,
      coalesce(em.events_weddings, 0)::integer as events_weddings,
      coalesce(em.events_sport_events, 0)::integer as events_sport_events,
      coalesce(em.events_appointments, 0)::integer as events_appointments,
      coalesce(em.events_doctor_appointments, 0)::integer as events_doctor_appointments,
      coalesce(em.events_play_days, 0)::integer as events_play_days,
      coalesce(em.events_general_events, 0)::integer as events_general_events,
      coalesce(em.events_car_pool, 0)::integer as events_car_pool,
      em.last_event_created_at,
      em.last_scan_created_at
    from users u
    left join event_metrics em on em.user_id = u.id
    left join share_metrics sm on sm.user_id = u.id
  )
`;

export const ADMIN_USER_METRICS_SELECT_SQL = `
  id, email, first_name, last_name, created_at, scans_total, shares_sent,
  scans_birthdays, scans_weddings, scans_sport_events,
  scans_appointments, scans_doctor_appointments, scans_play_days,
  scans_general_events, scans_car_pool,
  events_total, events_birthdays, events_weddings, events_sport_events,
  events_appointments, events_doctor_appointments, events_play_days,
  events_general_events, events_car_pool,
  last_event_created_at, last_scan_created_at
`;

// Project the small event facts once: repeatedly extracting keys from large saved
// artwork JSON can occupy every database connection for longer than checkout allows.
// The overview and initial directory share that projection and one connection.
export const ADMIN_USERS_PAGE_SQL = `
  ${ADMIN_USER_METRICS_CTE_SQL},
  event_totals as (
    select
      count(*)::text as total_events,
      count(*) filter (where category like '%birthday%')::text as events_birthdays,
      count(*) filter (where category like '%wedding%')::text as events_weddings,
      count(*) filter (where category like '%sport%')::text as events_sport_events,
      count(*) filter (where category = 'appointments' or category like '%appointment%')::text as events_appointments,
      count(*) filter (where category like '%doctor%' or category like '%medical%')::text as events_doctor_appointments,
      count(*) filter (where category like '%play%')::text as events_play_days,
      count(*) filter (where category like '%general%')::text as events_general_events,
      count(*) filter (where category like '%car%' or category like '%pool%')::text as events_car_pool
    from event_rows
  ),
  user_totals as (
    select
      count(*)::text as total_users,
      coalesce(sum(scans_total), 0)::text as scans_total,
      coalesce(sum(scans_birthdays), 0)::text as scans_birthdays,
      coalesce(sum(scans_weddings), 0)::text as scans_weddings,
      coalesce(sum(scans_sport_events), 0)::text as scans_sport_events,
      coalesce(sum(scans_appointments), 0)::text as scans_appointments,
      coalesce(sum(scans_doctor_appointments), 0)::text as scans_doctor_appointments,
      coalesce(sum(scans_play_days), 0)::text as scans_play_days,
      coalesce(sum(scans_general_events), 0)::text as scans_general_events,
      coalesce(sum(scans_car_pool), 0)::text as scans_car_pool,
      (
        select coalesce(jsonb_agg(initial_user order by created_at desc nulls last, id desc), '[]'::jsonb)
        from (
          select ${ADMIN_USER_METRICS_SELECT_SQL}
          from admin_users_with_metrics
          order by created_at desc nulls last, id desc
          limit $1
        ) initial_user
      ) as initial_users
    from admin_users_with_metrics
  )
  select user_totals.*, event_totals.*,
    (select count(*)::text from event_shares) as total_shares
  from user_totals cross join event_totals
`;
