import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { readStudioJson, studioErrorResponse } from "@/lib/admin/marketing-studio/http";
import { createConversation, listConversations } from "@/lib/admin/marketing-studio/repository";
import { parseStudioConversationCreate } from "@/lib/admin/marketing-studio/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({ conversations: await listConversations() });
  } catch (error) {
    return studioErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await requireAdminSession();
    const input = parseStudioConversationCreate(await readStudioJson(request));
    return NextResponse.json(
      { conversation: await createConversation(email, input.title, input.settings) },
      { status: 201 },
    );
  } catch (error) {
    return studioErrorResponse(error);
  }
}
