export const EVENT_WORKSPACE_VIEWS = ["all", "drafts", "schedules", "signups"] as const;
export type EventWorkspaceView = (typeof EVENT_WORKSPACE_VIEWS)[number];
export const EVENT_WORKSPACE_RELATIONS = ["all", "owned", "invited"] as const;
export type EventWorkspaceRelation = (typeof EVENT_WORKSPACE_RELATIONS)[number];
export type EventWorkspaceFilters = {
  kind: EventWorkspaceView;
  relation: EventWorkspaceRelation;
  search: string;
};
export function normalizeEventWorkspaceFilters(input: {
  kind?: unknown;
  relation?: unknown;
  search?: unknown;
}): EventWorkspaceFilters {
  return {
    kind: EVENT_WORKSPACE_VIEWS.includes(input.kind as EventWorkspaceView)
      ? (input.kind as EventWorkspaceView)
      : "all",
    relation: EVENT_WORKSPACE_RELATIONS.includes(input.relation as EventWorkspaceRelation)
      ? (input.relation as EventWorkspaceRelation)
      : "all",
    search: typeof input.search === "string" ? input.search.trim().slice(0, 200) : "",
  };
}
