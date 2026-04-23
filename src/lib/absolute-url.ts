import { headers } from "next/headers.js";

const ensureLeadingAppend = (path: string): string => {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^[?#]/.test(trimmed)) return trimmed;
  const withoutLeading = trimmed.replace(/^\/+/, "");
  return withoutLeading ? `/${withoutLeading}` : "/";
};

const sanitizeOrigin = (candidate: string | null | undefined): string | null => {
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
};

const parseOrigin = (origin: string | null): { proto: string | null; host: string | null } => {
  if (!origin) return { proto: null, host: null };
  try {
    const parsed = new URL(origin);
    return {
      proto: parsed.protocol.replace(/:$/, "") || null,
      host: parsed.host || null,
    };
  } catch {
    return { proto: null, host: null };
  }
};

function normalizeProto(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .split(",")[0]
    ?.trim()
    .replace(/:$/, "")
    .toLowerCase();
  return normalized || null;
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
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}

/**
 * Convert an absolute URL with a loopback host (e.g. `http://localhost:3000/api/blob/...`)
 * to a site-relative path so the value loads from whatever origin is serving the page.
 *
 * Returns `null` when the value is not a loopback absolute URL. Use this when reading
 * media URLs that may have been persisted during local development.
 */
export function rewriteLoopbackUrlToRelativePath(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (!isLoopbackHost(parsed.hostname)) return null;
    const path = parsed.pathname || "/";
    return `${path}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

/**
 * Sanitize a persisted media URL for client-side rendering. Loopback absolute URLs are
 * rewritten to relative paths so mobile browsers (which cannot reach the dev machine)
 * can still load them through the current origin. All other values pass through
 * unchanged; inline `data:`, site-relative, and remote `https:` URLs are all valid.
 */
export function sanitizePersistedMediaUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const loopback = rewriteLoopbackUrlToRelativePath(trimmed);
  return loopback || trimmed;
}

const fallbackOriginParts = (): { proto: string; host: string } => {
  const envOrigin =
    sanitizeOrigin(process.env.NEXTAUTH_URL) ||
    sanitizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    sanitizeOrigin(process.env.PUBLIC_BASE_URL) ||
    sanitizeOrigin(process.env.APP_URL) ||
    sanitizeOrigin(process.env.NEXT_PUBLIC_BASE_URL);
  const parsed = parseOrigin(envOrigin);
  if (parsed.proto && parsed.host) {
    return { proto: parsed.proto, host: parsed.host };
  }
  return { proto: "https", host: "envitefy.com" };
};

export function resolveAbsoluteUrlOrigin(input: {
  headerHost?: string | null;
  headerProto?: string | null;
  fallbackHost: string;
  fallbackProto: string;
  overrideProto?: string | null;
}): { proto: string; host: string } {
  const overrideProto = normalizeProto(input.overrideProto);
  let headerProto = normalizeProto(input.headerProto);
  let hostCandidate = input.headerHost?.trim() || input.fallbackHost;

  if (hostCandidate.includes("://")) {
    try {
      const parsed = new URL(hostCandidate);
      hostCandidate = parsed.host;
      if (!overrideProto && !headerProto) {
        headerProto = normalizeProto(parsed.protocol);
      }
    } catch {
      hostCandidate = hostCandidate.replace(/^https?:\/\//, "");
    }
  }

  const shouldUseFallbackHost =
    isLoopbackHost(hostCandidate) && !isLoopbackHost(input.fallbackHost);
  const host = (shouldUseFallbackHost ? input.fallbackHost : hostCandidate || "envitefy.com").replace(
    /\/+$/,
    "",
  );
  const isLocal = isLoopbackHost(host);
  const proto =
    overrideProto ||
    (shouldUseFallbackHost ? null : headerProto) ||
    (isLocal ? "http" : null) ||
    input.fallbackProto ||
    "https";

  return { proto, host };
}

export async function absoluteUrl(path = ""): Promise<string> {
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = ensureLeadingAppend(path);
  const fallback = fallbackOriginParts();

  let headerProto: string | null = null;
  let headerHost: string | null = null;
  try {
    const hdrs = await headers();
    headerProto = hdrs.get("x-forwarded-proto");
    headerHost = hdrs.get("x-forwarded-host") || hdrs.get("host");
    if (headerHost?.includes(",")) {
      headerHost = headerHost.split(",")[0]?.trim() || headerHost;
    }
  } catch {
    headerProto = null;
    headerHost = null;
  }

  const overrideProto = process.env.PROTOCOL
    ? process.env.PROTOCOL.replace(/:$/, "").toLowerCase()
    : null;

  const { proto, host } = resolveAbsoluteUrlOrigin({
    headerHost,
    headerProto,
    fallbackHost: fallback.host,
    fallbackProto: fallback.proto,
    overrideProto,
  });

  const origin = `${proto}://${host}`;
  if (!cleanPath || cleanPath === "/") {
    return cleanPath === "/" ? `${origin}/` : origin;
  }

  return `${origin}${cleanPath}`;
}
