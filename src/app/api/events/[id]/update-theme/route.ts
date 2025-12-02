import { NextResponse } from "next/server";
import {
  getEventHistoryById,
  updateEventHistoryDataMerge,
} from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { templateId } = await req.json();
    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const existing = await getEventHistoryById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = (existing.data as any) || {};
    const nextTheme = { ...(data.theme || {}), themeId: templateId };
    const patch = {
      variationId: templateId,
      theme: nextTheme,
    };

    await updateEventHistoryDataMerge(params.id, patch);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    try {
      // eslint-disable-next-line no-console
      console.error("[update-theme] error", err);
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: String(err?.message || err || "unknown error") },
      { status: 500 }
    );
  }
}
