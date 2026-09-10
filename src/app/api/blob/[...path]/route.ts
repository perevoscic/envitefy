import { get } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { resolveScanMediaPolicy } from "@/lib/ocr/scan-media";

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

  if (!["event-media/", "profile-media/"].some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return pathname;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const awaitedParams = await params;
    const pathname = normalizeBlobPath(awaitedParams.path || []);
    if (!pathname) {
      return new Response("Not found", { status: 404 });
    }

    // Older medical scans used this proxy before encrypted original storage existed.
    // Protect their source and derived previews even when someone knows the old URL.
    let medicalSource = false;
    if (pathname.startsWith("event-media/") && !pathname.includes("/scan-artwork/")) {
      const mediaUrl = `/api/blob/${pathname.split("/").map(encodeURIComponent).join("/")}`;
      const matches = await query<{
        user_id: string | null;
        title: string;
        data: Record<string, unknown>;
      }>(
        `select user_id, title, jsonb_build_object('category', data->'category', 'createdVia', data->'createdVia', 'scanPersonalization', data->'scanPersonalization') as data
         from event_history where data->>'thumbnail' = $1 or data#>>'{attachment,dataUrl}' = $1
           or data#>>'{attachment,previewImageUrl}' = $1 or data#>>'{attachment,thumbnailUrl}' = $1
           or data->>'heroImage' = $1 or data->>'customHeroImage' = $1 or data->>'coverImageUrl' = $1`,
        [mediaUrl],
      );
      const restricted = matches.rows.filter(
        (row) => resolveScanMediaPolicy(row.data, row.title)?.medical,
      );
      medicalSource = restricted.length > 0;
      if (medicalSource) {
        const viewerId = await resolveSessionUserId(await getServerSession(authOptions));
        if (!viewerId || restricted.some((row) => row.user_id !== viewerId))
          return new Response("Not found", {
            status: 404,
            headers: { "Cache-Control": "private, no-store" },
          });
      }
    }

    const result = await get(pathname, { access: "private" });
    if (result?.statusCode !== 200 || !result.stream) {
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
    if (medicalSource) responseHeaders.set("Cache-Control", "private, no-store");

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
