export const ENVITEFY_PUBLIC_ORIGIN = "https://envitefy.com";

function ensureLeadingSlash(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^[?#]/.test(trimmed)) return trimmed;
  const withoutLeading = trimmed.replace(/^\/+/, "");
  return withoutLeading ? `/${withoutLeading}` : "/";
}

export function sanitizeOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    try {
      const url = new URL(`https://${candidate}`);
      return url.origin;
    } catch {
      return null;
    }
  }
}

export function isLoopbackHost(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `http://${candidate}`);
    const hostname = parsed.hostname.trim().toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export function rewriteLoopbackUrlToRelativePath(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (!isLoopbackHost(parsed.hostname)) return null;
    return `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function sanitizePersistedMediaUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const relativeLoopback = rewriteLoopbackUrlToRelativePath(trimmed);
  return relativeLoopback || trimmed;
}

export function resolvePublicAssetOrigin(preferredOrigin?: string | null): string {
  const candidates = [
    preferredOrigin,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXTAUTH_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.APP_URL,
  ];

  for (const candidate of candidates) {
    const origin = sanitizeOrigin(candidate);
    if (!origin || isLoopbackHost(origin)) continue;
    return origin;
  }

  return ENVITEFY_PUBLIC_ORIGIN;
}

export function buildPublicAssetUrl(
  pathOrUrl: string,
  preferredOrigin?: string | null,
): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return resolvePublicAssetOrigin(preferredOrigin);

  const relativeLoopback = rewriteLoopbackUrlToRelativePath(trimmed);
  if (relativeLoopback) {
    return `${resolvePublicAssetOrigin(preferredOrigin)}${relativeLoopback}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return isLoopbackHost(trimmed)
      ? `${resolvePublicAssetOrigin(preferredOrigin)}${new URL(trimmed).pathname}${new URL(trimmed).search}${new URL(trimmed).hash}`
      : trimmed;
  }

  const path = ensureLeadingSlash(trimmed);
  if (!path) return resolvePublicAssetOrigin(preferredOrigin);
  if (/^[?#]/.test(path)) {
    return `${resolvePublicAssetOrigin(preferredOrigin)}${path}`;
  }
  return `${resolvePublicAssetOrigin(preferredOrigin)}${path}`;
}
