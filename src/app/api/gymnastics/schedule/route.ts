import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { checkCreationAccess } from "@/lib/creation-access-server";
import { CreateSourceError } from "@/lib/create/read-source";
import { readGymnasticsSchedule } from "@/lib/gymnastics-schedule-reader";

export const runtime = "nodejs";
export const maxDuration = 300;
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Read-only: event changes happen in the editor, then through its explicit save. */
export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Open Envitefy to import a schedule." }, 403);
    const user = await getAuthenticatedRequestUser(request);
    if (!user.ok) return json({ error: "Sign in to import a schedule. Your edits are kept." }, 401);
    const denied = await checkCreationAccess(user.userId, { product: "event_page", category: "gymnastics", eventId: new URL(request.url).searchParams.get("edit") });
    if (denied) return denied;
    if (Number(request.headers.get("content-length")) > 4.5 * 1024 * 1024) return json({ error: "Choose a schedule file smaller than 4 MB." }, 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Choose a schedule PDF or photo." }, 400);
    if (file.size > 4 * 1024 * 1024) return json({ error: "Choose a schedule file smaller than 4 MB." }, 413);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(260_000)]);
    return json(await readGymnasticsSchedule(file, signal));
  } catch (error) {
    return json({ error: error instanceof CreateSourceError ? error.message : "We couldn't read that schedule. Try a clearer photo or a schedule PDF. Your edits are kept." }, error instanceof CreateSourceError ? error.status : 422);
  }
}
