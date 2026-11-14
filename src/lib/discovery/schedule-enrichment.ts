import { readPublicCreateUrl } from "@/lib/create/read-source";
import { readGymnasticsSchedule, readGymnasticsScheduleSource } from "@/lib/gymnastics-schedule-reader";
import type { ScheduleImport } from "@/lib/gymnastics-schedule-import";
import { hasConflictingEventTitle, isOtherEventWebsiteUrl, readWebsiteImport } from "./event-website";

export type LinkedScheduleEnrichment = {
  imports: ScheduleImport[];
  documents: Array<{ url: string; status: "parsed" | "failed" | "pending"; reason?: string }>;
  notes: string[];
};
export const linkedScheduleDeps = { read: readPublicCreateUrl, parse: readGymnasticsSchedule, parseSource: readGymnasticsScheduleSource };

/** Follow documents linked by this event's schedule page, including public CDN redirects. */
export async function enrichLinkedMeetSchedules(options: {
  websiteImport: unknown; sourceUrl?: string | null; title?: string; year?: number | null;
  signal?: AbortSignal; budgetMs?: number;
  sourceDocument?: { fileName: string; text: string; images: string[] };
}): Promise<LinkedScheduleEnrichment> {
  const website = readWebsiteImport(options.websiteImport);
  const result: LinkedScheduleEnrichment = { imports: [], documents: [], notes: [] };
  if ((!website || !options.sourceUrl) && !options.sourceDocument) return result;
  const urls = [...new Set((options.sourceUrl ? website?.schedule.links || [] : []).filter(link => {
    try { return /\.pdf$/i.test(new URL(link.url).pathname) && !isOtherEventWebsiteUrl(options.sourceUrl!, link.url, true); }
    catch { return false; }
  }).map(link => link.url))].slice(0, 4);
  const signal = AbortSignal.any([...(options.signal ? [options.signal] : []), AbortSignal.timeout(options.budgetMs ?? 45000)]);
  const retain = (imported: ScheduleImport, key: string, url?: string) => {
    const title = imported.source.text.split(/\n/).map(line => line.trim()).find(line => line.length > 8) || "";
    if (options.title && hasConflictingEventTitle(options.title, title)) throw new Error("The schedule document identifies another event.");
    const year = options.year || website?.eventYear;
    if (imported.days.some(day => !day.isoDate || year && Number(day.isoDate.slice(0, 4)) !== year))
      throw new Error("The schedule dates need review against this event edition.");
    result.imports.push({ ...imported, source: { ...imported.source, ...(url ? { url } : {}) } });
    result.documents.push({ url: key, status: "parsed" });
    const publication = imported.source.text.match(/(?:full|final|detailed)\s+schedule[^\n]{0,160}/i)?.[0];
    if (publication) result.notes.push(publication.trim());
  };
  if (options.sourceDocument) {
    const key = `upload:${options.sourceDocument.fileName}`;
    try {
      retain(await linkedScheduleDeps.parseSource(options.sourceDocument, options.sourceDocument.fileName, signal), key);
    } catch (error) {
      options.signal?.throwIfAborted();
      result.documents.push({ url: key, status: signal.aborted ? "pending" : "failed", reason: error instanceof Error ? error.message : "The packet schedule could not be read." });
    }
  }
  for (const url of urls) {
    options.signal?.throwIfAborted();
    if (signal.aborted) { result.documents.push({ url, status: "pending", reason: "Schedule document reading reached its time limit." }); continue; }
    try {
      const remote = await linkedScheduleDeps.read(url, AbortSignal.any([signal, AbortSignal.timeout(10000)]));
      if (!/application\/pdf/i.test(remote.mimeType) || remote.bytes.length > 20 * 1024 * 1024)
        throw new Error("The linked schedule did not return a supported PDF.");
      const fileName = decodeURIComponent(new URL(url).pathname.split("/").pop() || "schedule.pdf");
      const imported = await linkedScheduleDeps.parse(new File([new Uint8Array(remote.bytes)], fileName, { type: "application/pdf" }), signal);
      retain(imported, url, url);
    } catch (error) {
      options.signal?.throwIfAborted();
      result.documents.push({ url, status: signal.aborted ? "pending" : "failed", reason: error instanceof Error ? error.message : "The linked schedule could not be read." });
    }
  }
  result.notes = [...new Set(result.notes)];
  return result;
}
