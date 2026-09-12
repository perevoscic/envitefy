import { NextResponse } from "next/server";
import { getAuthenticatedRequestUser } from "@/lib/auth";
import { prepareDiscoverySourceFile } from "@/lib/media-upload";
import { fetchFootballSource, footballWebsiteText } from "@/lib/football-source";
import { extractDiscoveryText, type DiscoverySourceInput } from "@/lib/meet-discovery";
import {
  buildDefaultFootballDiscoveryData,
  mapParseResultToFootballData,
  parseFootballFromExtractedText,
} from "@/lib/football-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Prefill is a read operation: no event shell, draft, or uploaded asset is persisted. */
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedRequestUser(request);
    if (!user.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let source: DiscoverySourceInput;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Choose a schedule, packet, or roster file." },
          { status: 400 },
        );
      }
      const prepared = await prepareDiscoverySourceFile(file);
      source = {
        type: "file",
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        sizeBytes: prepared.sizeBytes,
        dataUrl: `data:${prepared.mimeType};base64,${prepared.buffer.toString("base64")}`,
      };
    } else {
      const body = await request.json();
      let url: URL;
      try {
        url = new URL(typeof body?.url === "string" ? body.url.trim() : "");
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
          throw new Error();
      } catch {
        return NextResponse.json(
          { error: "Enter a public http or https website URL." },
          { status: 400 },
        );
      }
      source = { type: "url", url: url.toString() };
    }
    let websiteText: string | null = null;
    let extractionSource = source;
    if (source.type === "url") {
      const page = await fetchFootballSource(source.url, request.signal);
      if (/pdf|image\//i.test(page.contentType)) {
        extractionSource = {
          type: "file",
          fileName: "website-source",
          mimeType: page.contentType,
          sizeBytes: page.buffer.length,
          dataUrl: `data:${page.contentType.split(";")[0]};base64,${page.buffer.toString("base64")}`,
        };
      } else if (/text\/|application\/(?:ld\+)?json/i.test(page.contentType)) {
        websiteText = footballWebsiteText(page.buffer.toString("utf8"), page.url);
      } else {
        throw new Error("This URL does not contain a readable page or document.");
      }
    }
    const extraction =
      websiteText !== null
        ? { extractedText: websiteText, extractionMeta: { textQuality: "good" as const } }
        : await extractDiscoveryText(extractionSource, {
            workflow: "football",
            mode: "core",
            budgetMs: 45_000,
            signal: request.signal,
          });
    if (
      extraction.extractedText.trim().length < 20 ||
      extraction.extractionMeta.textQuality === "poor"
    ) {
      return NextResponse.json(
        {
          error:
            "We could not read enough schedule information. Try a clearer file or a page with the schedule on it.",
        },
        { status: 422 },
      );
    }
    const { parseResult } = await parseFootballFromExtractedText(
      extraction.extractedText,
      extraction.extractionMeta,
      { openAiOnly: true },
    );
    if (!parseResult.title && !parseResult.games.length && !parseResult.roster.players.length) {
      return NextResponse.json(
        { error: "No football details were found in this source." },
        { status: 422 },
      );
    }
    const data = await mapParseResultToFootballData(
      parseResult,
      buildDefaultFootballDiscoveryData(),
    );
    return NextResponse.json(
      {
        data,
        source:
          source.type === "url"
            ? { type: "url", url: source.url, workflow: "football" }
            : { type: "file", fileName: source.fileName, workflow: "football" },
        passcode: parseResult.communications.passcode || "",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[football-prefill]", error instanceof Error ? error.message : "Import failed");
    return NextResponse.json(
      {
        error:
          "This source could not be parsed. Check the URL or file and try again. Your editor has been kept intact.",
      },
      { status: 422 },
    );
  }
}
