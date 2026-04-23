export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";
import { resolveRunAssetPath } from "@/lib/admin/marketing-campaigns";

function contentTypeForFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".srt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const file = new URL(request.url).searchParams.get("file") || "";
    const absolutePath = resolveRunAssetPath(runId, file);
    const stream = fs.createReadStream(absolutePath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentTypeForFile(absolutePath),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return adminErrorResponse(error, "Failed to read run asset");
  }
}
