/** Next can expose its internal listener in request.url when behind a proxy. */
export function hasSameSignupOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  const requestUrl = new URL(request.url);
  const host =
    (request.headers.get("x-forwarded-host") || request.headers.get("host"))
      ?.split(",")[0]
      ?.trim() || requestUrl.host;
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    requestUrl.protocol.slice(0, -1);
  return origin === `${protocol}://${host}`;
}
