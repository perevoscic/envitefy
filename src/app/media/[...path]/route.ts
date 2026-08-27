import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePublicEventMediaPath(parts: string[]): string | null {
  const pathname = parts
    .map((part) => {
      try {
        return decodeURIComponent(part || "").trim();
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .join("/");

  return pathname.startsWith("event-media/") ? pathname : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const awaitedParams = await params;
    const pathname = normalizePublicEventMediaPath(awaitedParams.path || []);
    if (!pathname) return new Response("Not found", { status: 404 });

    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response("Not found", { status: 404 });
    }

    const responseHeaders = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    for (const header of [
      "content-disposition",
      "content-length",
      "content-type",
      "etag",
      "last-modified",
    ]) {
      const headerValue = result.headers.get(header);
      if (headerValue) responseHeaders.set(header, headerValue);
    }

    return new Response(result.stream, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error("[media] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response("Error loading media", { status: 500 });
  }
}
