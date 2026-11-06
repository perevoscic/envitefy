type DashboardResult = { response: Response; body: unknown };

/** Retry temporary dashboard failures without retrying authorization or client errors. */
export async function requestDashboard(
  url: string,
  isCurrent: () => boolean,
  request: typeof fetch = fetch,
  delay: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<DashboardResult | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (!isCurrent()) return null;
    try {
      const response = await request(url, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body: unknown = response.ok ? await response.json().catch(() => null) : null;
      if (!isCurrent()) return null;
      const degraded = !!body && typeof body === "object" && "degraded" in body && body.degraded === true;
      const transient = response.status === 429 || response.status >= 500 || degraded;
      if (!transient || attempt === 2) return { response, body };
    } catch (error) {
      if (!isCurrent()) return null;
      if (attempt === 2) throw error;
    }
    await delay(attempt === 0 ? 500 : 1500);
  }
  return null;
}
