import { AsyncLocalStorage } from "node:async_hooks";

const routeContext = new AsyncLocalStorage<string>();

export function withQueryRoute<T>(route: string, work: () => Promise<T>): Promise<T> {
  return routeContext.run(route, work);
}

/** Estimated result bytes, not a replacement for Supabase's network meter. */
export function recordQueryEgress(queryName: string, rows: object[]): void {
  if (process.env.DB_EGRESS_METRICS !== "1") return;
  let estimatedBytes = 0;
  try {
    for (const row of rows) estimatedBytes += Buffer.byteLength(JSON.stringify(row), "utf8");
  } catch {
    return; // Diagnostics must never fail a successful application query.
  }
  console.info("[db-egress]", {
    queryName,
    route: routeContext.getStore() || "server",
    calls: 1,
    rows: rows.length,
    estimatedBytes,
  });
}
