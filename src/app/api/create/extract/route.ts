import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, resolveSessionUserId } from "@/lib/auth";
import { customEventCategory } from "@/lib/event-custom-design";
import { extractCreateInformation } from "@/lib/create/extract-information";
import { CreateSourceError } from "@/lib/create/read-source";
import { requireCreationAccess, creationAccessErrorResponse } from "@/lib/creation-access-server";
import { customCategoryForGuess } from "@/lib/create/create-intent";
import { validDiscoveryIntakeKey } from "@/lib/discovery/intake-recovery";
import { prepareSportsSourceIntake, sportsGuessForExtraction } from "@/lib/create/sport-source-intake";
import type { CreateExtractionMessage } from "@/lib/create/extraction-progress";

export const runtime = "nodejs";
export const maxDuration = 300;
const requests = new Map<string, { count: number; expires: number }>();
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Open Envitefy to import your event." }, 403);
    const userId = await resolveSessionUserId(await getServerSession(authOptions));
    if (!userId) return json({ error: "Sign in to read your event details. Your source stays here." }, 401);
    // Reading may identify an unavailable category; enforcement of that category happens before creation.
    await requireCreationAccess(userId, { product: "event_page" });
    const now = Date.now();
    for (const [key, entry] of requests) if (entry.expires <= now) requests.delete(key);
    const entry = requests.get(userId) || { count: 0, expires: now + 10 * 60_000 };
    if (entry.count >= 20 || (requests.size >= 10_000 && !requests.has(userId))) return json({ error: "Please wait a few minutes before reading another source." }, 429);
    entry.count++;
    requests.set(userId, entry);
    const contentType = request.headers.get("content-type") || "";
    let files: File[] = [], text = "", sourceText: string | undefined, url: string | undefined, rawCategory: unknown, rawSport: unknown, clientIntakeId: string | null = null;
    if (Number(request.headers.get("content-length")) > 55 * 1024 * 1024) return json({ error: "Choose smaller files for this import." }, 413);
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const items = [...form.getAll("file"), ...form.getAll("files")];
      if (items.some((item) => !(item instanceof File))) throw new CreateSourceError("Choose an event document or photo.");
      files = items as File[];
      text = String(form.get("text") || "");
      url = String(form.get("url") || "").trim() || undefined;
      rawCategory = form.get("category");
      rawSport = form.get("sport");
      clientIntakeId = validDiscoveryIntakeKey(form.get("clientIntakeId"));
    } else if (contentType.startsWith("application/json")) {
      const body = await request.text();
      if (body.length > 150_000) return json({ error: "Paste a shorter event description." }, 413);
      const raw = JSON.parse(body);
      text = typeof raw.text === "string" ? raw.text : "";
      url = typeof raw.url === "string" ? raw.url.trim() || undefined : undefined;
      rawCategory = raw.category;
      rawSport = raw.sport;
      clientIntakeId = validDiscoveryIntakeKey(raw.clientIntakeId);
      sourceText = typeof raw.sourceText === "string" ? raw.sourceText : undefined;
    } else return json({ error: "Add files, a public link or event details." }, 415);
    if (text.length > 12_000) throw new CreateSourceError("Keep your event notes under 12,000 characters.");
    if (sourceText && (sourceText.length > 120_000 || files.length || url || clientIntakeId))
      throw new CreateSourceError("Use retained event text by itself, up to 120,000 characters.");
    const category = customEventCategory(rawCategory) || undefined;
    if (rawCategory && !category) throw new CreateSourceError("Choose a supported event page category.");
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(260_000)]);
    const extract = (onStage?: (stage: string) => void) => extractCreateInformation({ files, text, sourceText, url, category }, signal, async (classification) => {
      // A host's explicit corrected category takes priority for authorization, while the
      // returned classification still reports what the source reader actually found.
      const operation = category ? { product: "event_page" as const, category }
        : ["medical-appointments", "appointments"].includes(classification.category)
        ? { product: "snap" as const }
        : classification.category === "signup-forms"
          ? { product: "signup_form" as const }
          : { product: "event_page" as const, category: customCategoryForGuess(classification) };
      try { await requireCreationAccess(userId, operation); return true; }
      catch (error) { if (creationAccessErrorResponse(error)) return false; throw error; }
    }, {
      onStage,
      prepareSports: clientIntakeId ? async (source, classification) => {
        const guess = sportsGuessForExtraction(classification, category, typeof rawSport === "string" ? rawSport : undefined);
        if (!guess) return undefined;
        return prepareSportsSourceIntake({ userId, clientIntakeId: clientIntakeId!, source, guess, files, text, url, signal, onStage });
      } : undefined,
    });
    if (!request.headers.get("accept")?.includes("application/x-ndjson")) return json(await extract());
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      async start(controller) {
        let connected = true;
        const send = (message: CreateExtractionMessage) => {
          if (connected) try { controller.enqueue(encoder.encode(`${JSON.stringify(message)}\n`)); } catch { connected = false; }
        };
        try { send({ result: await extract(stage => send({ stage })) }); }
        catch (error) {
          send({ error: error instanceof CreateSourceError ? error.message : "We couldn't finish reading that source. Your files and notes are kept; please retry." });
        } finally { if (connected) controller.close(); }
      },
    }), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error) {
    const accessResponse = creationAccessErrorResponse(error);
    if (accessResponse) return accessResponse;
    if (error instanceof CreateSourceError) return json({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return json({ error: "That request could not be read. Please retry." }, 400);
    return json({ error: "We couldn't finish reading that source. Your files and notes are kept; please retry." }, 502);
  }
}
