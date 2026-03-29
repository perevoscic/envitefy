import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeBlobPath(parts: string[]): string | null {
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

  if (!pathname.startsWith("event-media/")) {
    return null;
  }

  return pathname;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const awaitedParams = await params;
    const pathname = normalizeBlobPath(awaitedParams.path || []);
    if (!pathname) {
      return new Response("Not found", { status: 404 });
    }

    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return new Response("Not found", { status: 404 });
    }

    const responseHeaders = new Headers();
    for (const header of [
      "cache-control",
      "content-disposition",
      "content-length",
      "content-type",
      "etag",
      "last-modified",
    ]) {
      const value = result.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    return new Response(result.stream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[api/blob] failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response("Error loading media", { status: 500 });
  }
}
