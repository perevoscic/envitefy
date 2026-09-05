import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/lib/admin/require-admin";
import { StudioRequestError } from "./validation.ts";
export { requireStudioCron } from "./cron-auth.ts";

export async function readStudioJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new StudioRequestError("Invalid JSON body.");
  }
}

export function studioErrorResponse(error: unknown): Response {
  if (error instanceof StudioRequestError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return adminErrorResponse(error, "Content Studio could not complete this request.");
}
