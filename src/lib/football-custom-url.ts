import { footballMatchup, hasFootballGame, type FootballGame } from "./football-games";
import { footballTeamLabel } from "./football-team-name";
import { makeEventPublicSlugRoutable } from "@/utils/event-public-slug";

export function suggestFootballPublicSlug({ teamName, teamMascot, title, season, games = [] }: {
  teamName?: string; teamMascot?: string; title?: string; season?: string; games?: FootballGame[];
}) {
  const scheduled = games.filter(hasFootballGame);
  const singleGame = scheduled.length === 1 && scheduled[0].opponent?.trim() ? scheduled[0] : null;
  const team = footballTeamLabel(teamName, teamMascot);
  const year = (singleGame?.date || season || "").match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
  if (!team && !singleGame) return title ? makeEventPublicSlugRoutable(title) : "";
  return makeEventPublicSlugRoutable([singleGame ? footballMatchup(singleGame, teamName, teamMascot) : `${team} football`, year].filter(Boolean).join(" "));
}
