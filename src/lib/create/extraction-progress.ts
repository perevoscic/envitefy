import type { CreateExtractionResult } from "./extract-information";

export const CREATE_EXTRACTION_STAGE_LABELS: Record<string, string> = {
  reading: "Reading your document…",
  transcribing: "Reading text from your document pages…",
  classifying: "Identifying your event type…",
  extracting_details: "Finding your event details and sections…",
  preparing_source: "Preparing your source file…",
  creating_draft: "Preparing your editable event…",
  storing_source: "Storing your source for import recovery…",
};

export type CreateExtractionMessage = { stage: string } | { result: CreateExtractionResult } | { error: string };

/** Stream server stages, retaining compatibility with ordinary JSON API responses. */
export async function readCreateExtractionResponse(response: Response, onStage: (stage: string) => void): Promise<CreateExtractionResult> {
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Your event source could not be read. Please retry.");
    return result;
  }
  if (!response.ok || !response.body) throw new Error("Your event source could not be read. Please retry.");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let pending = "", result: CreateExtractionResult | undefined;
  const consume = (line: string) => {
    if (!line.trim()) return;
    let message: CreateExtractionMessage;
    try { message = JSON.parse(line) as CreateExtractionMessage; }
    catch { throw new Error("The import connection ended before reading finished. Retry to resume your source."); }
    if ("error" in message) throw new Error(message.error);
    if ("stage" in message) onStage(message.stage);
    if ("result" in message) result = message.result;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() || "";
      for (const line of lines) consume(line);
      if (done) break;
    }
    consume(pending);
    if (!result?.classification) throw new Error("The import connection ended before reading finished. Retry to resume your source.");
    return result;
  } finally { reader.releaseLock(); }
}
