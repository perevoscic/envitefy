import { query } from "@/lib/db";
import { dashboardGamesFromSources, type DashboardGameSource } from "./dashboard-games.ts";

// Read schedules independently of the event-date window: season pages often
// have no primary start date, or one that predates their remaining fixtures.
export async function loadDashboardGames(userId: string, now = Date.now()) {
  const result = await query<DashboardGameSource>(
    `select eh.id::text, eh.title, eh.public_slug, fixtures.games,
      coalesce(eh.data->>'sport', eh.data->>'sportKind', eh.data#>>'{ocrSkin,sportKind}', eh.data#>>'{ocrSkin,category}', eh.data->>'category') as sport,
      jsonb_build_object(
        'teamName', coalesce(nullif(eh.data#>>'{customFields,team}', ''), nullif(eh.data#>>'{extra,team}', ''), eh.data#>>'{schedule,homeTeam}', eh.data#>>'{discoverySource,parseResult,homeTeam}'),
        'teamMascot', coalesce(eh.data#>>'{customFields,teamMascot}', eh.data#>>'{extra,teamMascot}', eh.data#>>'{discoverySource,parseResult,homeMascot}'),
        'season', coalesce(nullif(eh.data#>>'{customFields,season}', ''), nullif(eh.data#>>'{extra,season}', ''), eh.data#>>'{schedule,season}', eh.data#>>'{discoverySource,parseResult,season}'),
        'timezone', coalesce(nullif(eh.data->>'timezone', ''), eh.data->>'tz', eh.data#>>'{discoverySource,parseResult,timezone}'),
        'homeVenue', coalesce(nullif(eh.data#>>'{customFields,stadium}', ''), nullif(eh.data#>>'{extra,stadium}', ''), eh.data->>'venue'),
        'homeAddress', coalesce(nullif(eh.data#>>'{customFields,stadiumAddress}', ''), nullif(eh.data#>>'{extra,stadiumAddress}', ''), eh.data#>>'{schedule,homeAddress}', eh.data->>'address')
      ) as home
     from event_history eh
     cross join lateral (
       select case
         when jsonb_typeof(eh.data#>'{advancedSections,games,games}') = 'array' then eh.data#>'{advancedSections,games,games}'
         when jsonb_typeof(eh.data#>'{customFields,advancedSections,games,games}') = 'array' then eh.data#>'{customFields,advancedSections,games,games}'
         when jsonb_typeof(eh.data#>'{schedule,games}') = 'array' then eh.data#>'{schedule,games}'
         when jsonb_typeof(eh.data#>'{discoverySource,parseResult,games}') = 'array' then eh.data#>'{discoverySource,parseResult,games}'
         else '[]'::jsonb end as games
     ) fixtures
     where (eh.user_id = $1 or exists (
       select 1 from event_shares es where es.event_id = eh.id
         and es.recipient_user_id = $1 and es.status in ('pending', 'accepted') and es.revoked_at is null
     ))
       and lower(trim(coalesce(eh.data->>'status', ''))) not in ('draft', 'archived', 'canceled', 'cancelled')
       and lower(trim(coalesce(eh.data->>'draftStatus', ''))) <> 'draft'
       and jsonb_array_length(fixtures.games) > 0`,
    [userId],
  );
  return dashboardGamesFromSources(result.rows, now);
}
