type DashboardPayload = Record<string, unknown>;

const dashboardResponseCache = new Map<
  string,
  { at: number; payload: DashboardPayload }
>();

const dashboardRefreshInflight = new Map<string, Promise<DashboardPayload>>();

export function getDashboardResponseCache() {
  return dashboardResponseCache;
}

export function getDashboardRefreshInflight() {
  return dashboardRefreshInflight;
}

export function invalidateUserDashboard(userId: string): void {
  if (!userId) return;
  dashboardResponseCache.delete(userId);
}
