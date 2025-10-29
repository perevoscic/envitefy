import { headers } from "next/headers";

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

const fallbackOriginParts = (): { proto: string; host: string } => {
  const envOrigin =
    sanitizeOrigin(process.env.NEXTAUTH_URL) ||
    sanitizeOrigin(process.env.PUBLIC_BASE_URL) ||
    sanitizeOrigin(process.env.APP_URL) ||
    sanitizeOrigin(process.env.NEXT_PUBLIC_BASE_URL);
  const parsed = parseOrigin(envOrigin);
  if (parsed.proto && parsed.host) {
    return { proto: parsed.proto, host: parsed.host };
  }
  return { proto: "https", host: "envitefy.com" };
};

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
    if (headerProto && headerProto.includes(",")) {
      headerProto = headerProto.split(",")[0]?.trim() || headerProto;
    }
    headerProto = headerProto ? headerProto.replace(/:$/, "").toLowerCase() : null;
    if (headerHost && headerHost.includes(",")) {
      headerHost = headerHost.split(",")[0]?.trim() || headerHost;
    }
  } catch {
    headerProto = null;
    headerHost = null;
  }

  const overrideProto = process.env.PROTOCOL
    ? process.env.PROTOCOL.replace(/:$/, "").toLowerCase()
    : null;

  let hostCandidate = headerHost || fallback.host;
  if (hostCandidate && hostCandidate.includes("://")) {
    try {
      const parsed = new URL(hostCandidate);
      hostCandidate = parsed.host;
      if (!overrideProto && !headerProto) {
        headerProto = (parsed.protocol.replace(/:$/, "") || headerProto || "").toLowerCase() || null;
      }
    } catch {
      hostCandidate = hostCandidate.replace(/^https?:\/\//, "");
    }
  }
  const host = (hostCandidate || "envitefy.com").replace(/\/+$/, "");

  const isLocal =
    host.includes("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("0.") ||
    host === "[::1]";
  const proto =
    overrideProto ||
    headerProto ||
    (isLocal ? "http" : null) ||
    fallback.proto ||
    "https";

  const origin = `${proto}://${host}`;
  if (!cleanPath || cleanPath === "/") {
    return cleanPath === "/" ? `${origin}/` : origin;
  }

  return `${origin}${cleanPath}`;
}
