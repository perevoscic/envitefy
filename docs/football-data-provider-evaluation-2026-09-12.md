# Football data provider evaluation

Evaluated September 12, 2026. Scope: nationwide NFL, college and high-school American football for any Envitefy user. No predetermined schools or conferences.

Follow-up: the user selected ScoreStream. The first implementation uses its supported scoreboard embed; setup and activation status are recorded in [ScoreStream integration](scorestream-integration.md). The assessment of partner API access and standings below remains applicable.

## Decision

**Proceed with API-Sports as a candidate for a technical pilot; evaluate ScoreStream through its partner program for high-school scores. Neither is yet verified for universal automatic coverage or production use in Envitefy.**

The product should accept any team. Automatic enrichment should depend on a verified team, season and competition match, with separate coverage for scores, statistics and standings. Keep existing owner-entered results available when a feed is missing. Missing coverage must never become a fabricated score or position.

| Requirement | API-Sports NFL/NCAA | ScoreStream high school |
| --- | --- | --- |
| Scores and game state | Documented; payloads and latency untested | Supported by public widget offering; current partner API untested |
| Team/player game statistics | Documented, subject to coverage | Not established by reviewed API material |
| Complete competition standings | Endpoint documented; completeness untested | No complete standings endpoint established |
| Official tiebreak ordering | Not established | Not established |
| Every current team and level | Not established | Not established |
| Public Envitefy display | Publication rights require resolution | Supported embed available; custom feed needs current agreement |

## API-Sports findings

Its NFL/NCAA offering advertises 907 teams. This is a catalogue headline, not evidence that every current college team has every data field. Free access allows 100 requests/day; Pro lists 7,500/day, Ultra 75,000/day and Mega 150,000/day. [Product and quotas](https://api-sports.io/sports/nfl)

The provider's August 2026 guide lists Pro at $15/month, Ultra at $25 and Mega at $35. It documents `/games`, `/games/statistics/teams`, `/games/statistics/players`, and `/standings`. Standings include position, conference/division, records, points and streaks. `/leagues` exposes season coverage flags; `/teams` supplies identities. Suggested refreshes are 30 seconds for games and hourly for standings. These are documented capabilities, not measured performance. [Provider guide](https://www.api-football.com/news/post/how-to-get-started-with-api-nfl-the-complete-beginners-guide)

Its terms say subscription access does not provide publication licences or competition commercial rights, and refresh frequencies are indicative rather than guaranteed. Resolve Envitefy's public display, caching and derived-record use with the provider and any relevant rights holder. An API subscription alone does not close this issue. [Terms](https://api-sports.io/terms)

Before accepting nationwide college coverage, enumerate the current catalogue and reconcile it against current football programs: FBS, FCS, Division II and Division III. Track NAIA and junior-college programs separately; the NCAA label does not establish their coverage. Test independent teams, realignment, renamed schools and games against opponents outside the covered competition. These are proposed acceptance checks, not provider coverage claims.

## ScoreStream findings

The current partner page offers free, configurable, responsive scoreboards populated by fans. Its widget setup supports selected teams or a geographic area. This provides a potential embedded scoreboard; it does not establish access to normalized records for Envitefy's existing game cards. [Partners](https://scorestream.com/partners), [widget setup](https://scorestream.com/make-a-scoreboard-widget)

The public partner API announcement dates to March 2018. It describes paid REST and WebSocket access, real-time scoring, and temporary developer keys available by inquiry. It distinguishes validated high-school coverage from other levels whose completeness was not tracked. Its historical coverage volumes are not current guarantees. Current endpoints, prices, update commitments, retention rights and nationwide coverage need written confirmation and a trial. [API announcement](https://blog.scorestream.com/scorestream-local-sports-api/)

No reviewed public partner material established a complete conference/district standings feed, a tiebreak explanation, or detailed player box scores. Treat those as unverified capabilities. Site terms require prior written consent for automated data collection; use an agreed partner feed or the supported embed integration. [Terms](https://scorestream.com/misc/termsOfService)

Require coverage reporting across all states and DC, broken down by varsity/JV/freshman, public/private schools and football format. Measure team-directory coverage, scheduled-game coverage, final-score completeness and live-update coverage separately. A searchable team does not prove its games will receive scores.

## Standings and tiebreakers

**Preferred approach: consume a complete, verified upstream standings table with an explicit competition, season and ranking scope.** Envitefy does not need to reproduce the entire rule engine if the source supplies validated official ordering. Obtain confirmation that provider `position` represents that ordering before describing it as official.

NFL tiebreaks can depend on opponents' results beyond the division. [NFL procedures](https://www.nfl.com/standings/tie-breaking-procedures)

A historical Big Ten procedure also uses other teams' conference records and an external rating. It illustrates why rules must be stored by competition and season; this 2024 document is not evidence of the applicable 2026 rule. [Big Ten's 2024 procedure](https://bigten.org/fb/article/blt6104802d94ebe1ab/)

Proposed display rules:

- Distinguish overall record, conference record, division position, playoff seed and national ranking. They are different facts.
- Save the source's rank, group identity, season, timestamp and verification status together. Never sort a filtered subset and call its row number the team’s rank.
- Keep tied positions tied until the appropriate source resolves them. Do not invent a winner using alphabetical order or points difference.
- If only scores exist, show scores and explicitly scoped records. A partial record can say “record from recorded games”; it must not imply a complete season.
- If a group table is incomplete, show standings unavailable. Preserve the last complete snapshot with its timestamp where retention permits.
- For locally computed standings, require complete relevant results, membership and rule version, plus every external input those rules need. Some outcomes require an official decision.

## Integration recommendation

This is a proposed architecture, not implemented functionality.

| Record | Information to preserve |
| --- | --- |
| Team mapping | Provider/team ID, school or franchise, location, competition, squad level, season |
| Game mapping | Provider/game ID, both team IDs, kickoff, home/away/neutral, season stage |
| Score snapshot | Separate numeric scores, nullable when unknown; state, period/clock when available, source/update times |
| Standings snapshot | Full group, stable membership, record scope, provider positions, rule/verification status, source/update times |
| Coverage | Separate available/unavailable/unverified states for scores, stats and standings |

Use shared server fetching and caching so the same game is fetched once for all viewers. Refresh active scores more often than standings; fetch detailed box scores on demand or after completion. Retain correction handling after a game first becomes final. Keep API keys on the server and restrict calls to verified provider identities.

Match teams using location, league, level and season, not name alone. Confirm ambiguous matches in the editor. Explicitly saved provider mappings can attach to events; live feed snapshots should live separately from authored event content. Opening an editor or looking up a team must not create a draft. Preserve owner-entered results with their source and a clear conflict policy when provider corrections arrive.

Existing integration points:

- `src/lib/football-games.ts`: has `score` as a string and a W/L/T result; lacks provider IDs, structured live scores and standings.
- `src/components/football-season-templates/FootballSchedule.tsx`: renders score only inside the result block; live scores need an independent state display.
- `src/components/event-templates/FootballSeasonTemplate.tsx`: already supports owner-entered results.
- `src/lib/football-game-context.ts`: currently enriches travel/weather; score refreshes should have their own cadence and identity.

## Request budget

These are planning calculations, not measured usage or a price quote. Assuming one shared live-games response covers the required competitions:

| Hypothetical day | Requests |
| --- | ---: |
| Live scoreboard every 30 seconds for 16 hours | 1,920 |
| Two competition standings requests hourly for 16 hours | 32 |
| 100 completed games, two detailed-stat requests each | 200 |
| Subtotal before discovery, retries and corrections | 2,152 |

That example fits Pro's 7,500 daily calls. Confirm response limits and catalogue size in a pilot. Per-game live statistics can dominate cost: polling 50 games every 30 seconds for four hours costs 24,000 calls for just one stat endpoint. User count is therefore less important than distinct active games and requested detail. Apply a shared daily budget, UTC quota reset handling and bounded retries.

## Pilot acceptance checks

No live test below has passed yet. A credentialed pilot should cover an entire game weekend and subsequent corrections.

| Check | Proposed acceptance condition |
| --- | --- |
| Nationwide identity coverage | Enumerated current catalogue; missing teams/levels explicitly classified |
| Scores | Sample finals reconcile to authoritative results, including zero scores and overtime |
| Latency | Measure source-to-app latency when source timestamps exist; otherwise report only observed polling delay |
| Match identity | No cross-school, cross-season or varsity/JV collisions |
| Standings | Complete groups reconcile to the official table, including tied records and membership changes |
| State changes | Postponed, cancelled, suspended, rescheduled and corrected games preserve the right identity |
| Missing data | Nulls remain unknown; scheduled games do not appear as 0–0 results |
| Reliability and cost | Measure errors, payload errors in HTTP 200 responses, rate limits, retries and total daily requests |
| Public display | Documented rights for the intended presentation, cache retention and any derived records |

The nationwide product can launch score coverage incrementally, with clear availability per team. It should promise universal automatic results only if evidence and the provider agreement support that claim.

## Provider inquiries prepared for the next step

These inquiries are unsent.

**API-Sports:** Envitefy will display NFL and college results and standings on public event pages for arbitrary user-selected teams. Please provide current season/team coverage by college subdivision and conference, missing-data and correction policies, and the exact semantics of standings position. Does ordering incorporate official season-specific tiebreaks and postseason eligibility? Please clarify public display, server caching, derived records and logo rights, including any separate permissions we need. We also need sample complete standings and tied-team cases for a trial.

**ScoreStream:** Envitefy needs nationwide high-school football scores for arbitrary user-selected schools. Please provide current partner API documentation, trial credentials and pricing for REST/WebSocket access. Please break down coverage and final-score completeness by state, squad level and football format; explain timestamps, corrections and duplicate-game handling. Do you supply season membership, complete district/conference standings and official tiebreak ordering? Please specify public display, caching/retention, derived-record and branding terms, and whether supported widgets can cover this use case during a pilot.

## Verification performed and limits

Reviewed the official provider pages and terms linked above, inspected Envitefy's score types and renderers, and checked local environment/configuration for provider credential names without printing secret values. No API-Sports, API-NFL, ScoreStream or RapidAPI credentials were found in the checked configuration.

The formal API-Sports documentation did not render through the web reader; a direct public documentation request returned HTTP 403. Its official published guide was used for the capability review. No protected endpoint was bypassed. No authenticated payloads, live latency, complete team catalogues or tiebreak accuracy were tested. No account was created, vendor contacted, subscription purchased or production feed connected. Application code was unchanged by this evaluation.
