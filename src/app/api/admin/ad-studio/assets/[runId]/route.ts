import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { AdminAdStudioGenerationError, resolveAdminAdStudioAssetPath } from "@/lib/admin/ad-studio";
import { adminErrorResponse, requireAdminSession } from "@/lib/admin/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function contentTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml; charset=utf-8";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".md") return "text/markdown; charset=utf-8";
  if (ext === ".txt" || ext === ".srt") return "text/plain; charset=utf-8";
  return "image/png";
}

export async function GET(request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    await requireAdminSession();
    const { runId } = await context.params;
    const file = new URL(request.url).searchParams.get("file") || "";
    const absolutePath = resolveAdminAdStudioAssetPath(runId, file);
    await fsPromises.access(absolutePath);
    const stream = fs.createReadStream(absolutePath);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": contentTypeForFile(absolutePath),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Ad studio asset not found" }, { status: 404 });
    }
    if (error instanceof AdminAdStudioGenerationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return adminErrorResponse(error, "Failed to read ad studio asset");
  }
}
