import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { readStudioJson, studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { getConversation, updateConversation } from "@/lib/admin/marketing-studio/repository";
import {
  parseStudioConversationPatch,
  StudioRequestError,
} from "@/lib/admin/marketing-studio/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const conversation = await getConversation(id);
    if (!conversation) throw new StudioRequestError("Conversation not found.", 404);
    return NextResponse.json({ conversation });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const conversation = await updateConversation(
      id,
      parseStudioConversationPatch(await readStudioJson(request)),
    );
    if (!conversation) throw new StudioRequestError("Conversation not found.", 404);
    return NextResponse.json({ conversation });
  } catch (error) {
    return studioErrorResponse(error);
  }
}
