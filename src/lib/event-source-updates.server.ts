import { getDiscoveryAdapter } from "@/lib/sports-discovery";
import {
  extractDiscoveryText,
  finalizeMeetParseResult,
  buildGymDiscoveryPublicPageArtifacts,
} from "@/lib/meet-discovery";
import { enrichLinkedMeetSchedules } from "@/lib/discovery/schedule-enrichment";
import { hasConflictingEventTitle } from "@/lib/discovery/event-website";
import { appendImportedSchedule } from "@/lib/gymnastics-schedule-import";
import { extractCreateInformation } from "@/lib/create/extract-information";
import { customEventCategory } from "@/lib/event-custom-design";
import {
  eventSourceUrl,
  informationSourceFacts,
  readSourceUpdateState,
  sourceFacts,
  sourceRecord,
} from "./event-source-updates";
import type { EventDiscoveryRow } from "@/lib/discovery/types";
import {
  enrichTravelAccommodation,
  buildTravelAccommodationState,
} from "@/lib/travel-accommodation-enrichment";

export const sourceCheckDeps = {
  getDiscoveryAdapter,
  extractDiscoveryText,
  finalizeMeetParseResult,
  buildGymDiscoveryPublicPageArtifacts,
  enrichLinkedMeetSchedules,
  extractCreateInformation,
  enrichTravelAccommodation,
};

/** Read/extract only: no pipeline persistence, publication, artwork or event writes. */
export async function checkEventSource(
  data: Record<string, any>,
  discovery: EventDiscoveryRow | null,
  signal: AbortSignal,
) {
  const url = discovery?.source.type === "url" ? discovery.source.url || "" : eventSourceUrl(data);
  if (!url) throw new Error("This event was not created from a URL.");
  const workflow = discovery?.workflow || data.discoverySource?.workflow;
  let incoming: Record<string, any>;
  const retained = readSourceUpdateState(data.sourceUpdates);
  let previous = retained?.facts;
  const hostNotes = String(discovery?.source.text || retained?.hostNotes || "").trim();
  const warnings: string[] = [];
  if (["gymnastics", "football", "sports"].includes(workflow)) {
    const source = { type: "url" as const, url };
    const extraction = await sourceCheckDeps.extractDiscoveryText(source, {
      workflow,
      mode: "enrich",
      signal,
    });
    signal.throwIfAborted();
    const extractedText =
      extraction.extractedText +
      (hostNotes
        ? `\n\nHOST-AUTHORED CORRECTIONS AND INSTRUCTIONS (factual corrections override source; visual styling stays out of guest wording):\n${hostNotes}`
        : "");
    const adapter = sourceCheckDeps.getDiscoveryAdapter(workflow);
    const parsed = await adapter.parse({
      extractedText,
      extractionMeta: extraction.extractionMeta as any,
      eventId: discovery?.eventId || "source-check",
      activityHint: discovery?.source.activityProfile,
      archetypeHint: discovery?.source.eventArchetype,
    });
    let parseResult: any = parsed.parseResult;
    // The immutable imported identity protects host-retitled events and next-year rollover pages.
    const original =
      discovery?.enrichment?.parseResult ||
      discovery?.debug?.coreParseResult ||
      data.discoverySource?.parseResult;
    const expectedTitle = original?.title || data.title;
    if (
      expectedTitle &&
      parseResult.title &&
      hasConflictingEventTitle(expectedTitle, parseResult.title)
    )
      throw new Error("The source now describes another event. No changes were applied.");
    const expectedYear = String(
      original?.startAt || data.startAt || data.startISO || data.date || "",
    ).slice(0, 4);
    const freshYear = String(parseResult.startAt || "").slice(0, 4);
    if (/^\d{4}$/.test(expectedYear) && /^\d{4}$/.test(freshYear) && expectedYear !== freshYear)
      throw new Error("The source now describes another event edition. No changes were applied.");
    if (workflow === "gymnastics")
      parseResult = await sourceCheckDeps.finalizeMeetParseResult(
        parseResult,
        extractedText,
        extraction.extractionMeta as any,
        { mode: "enrich" },
      );
    const map = (result: any, meta: any) =>
      adapter.map({
        parseResult: result,
        currentData: {
          // Reuse a verified unchanged venue zone; never merge host prose into source facts.
          timezone: data.timezone,
          address: data.address,
        },
        extractionMeta: meta,
        activityProfile: discovery?.source.activityProfile,
        eventArchetype: discovery?.source.eventArchetype,
      });
    const mapped = await map(parseResult, extraction.extractionMeta);
    incoming = sourceFacts(mapped);
    const website = (extraction.extractionMeta as any).websiteImport;
    if (website) {
      incoming.websiteImport = website;
      for (const entry of website.coverage || [])
        if (["failed", "pending"].includes(entry.status))
          warnings.push(`${entry.section}: ${entry.reason || entry.status}`);
    }
    if (workflow === "gymnastics") {
      const [linked, hotels] = await Promise.all([
        sourceCheckDeps.enrichLinkedMeetSchedules({
          websiteImport: website,
          sourceUrl: url,
          title: parseResult.title,
          year: Number(expectedYear) || null,
          signal,
        }),
        sourceCheckDeps.enrichTravelAccommodation({
          sourceType: "url",
          sourceUrl: url,
          sourceId: discovery?.id || url,
          eventYear: expectedYear || null,
          eventTitle: parseResult.title,
          extractedText,
          extractionMeta: extraction.extractionMeta as any,
          signal,
          budgetMs: 25000,
        }),
      ]);
      incoming.travelAccommodation = buildTravelAccommodationState(hotels);
      incoming.publicPageSections = sourceCheckDeps.buildGymDiscoveryPublicPageArtifacts({
        parseResult,
        baseData: {
          ...mapped,
          discoverySource: { travelAccommodation: incoming.travelAccommodation },
        },
        extractionMeta: extraction.extractionMeta as any,
      }).publicPageSections;
      let schedule = incoming.advancedSections?.schedule || {};
      for (const imported of linked.imports)
        schedule = appendImportedSchedule(schedule, imported, () => crypto.randomUUID());
      if (linked.imports.length)
        incoming.advancedSections = { ...incoming.advancedSections, schedule };
      for (const document of linked.documents)
        if (document.status !== "parsed")
          warnings.push(`${document.url}: ${document.reason || document.status}`);
    }
    if (!previous && original) {
      previous = sourceFacts(await map(original, discovery?.document?.extractionMeta));
      if (workflow === "gymnastics")
        previous.publicPageSections = sourceCheckDeps.buildGymDiscoveryPublicPageArtifacts({
          parseResult: original as any,
          extractionMeta: discovery?.document?.extractionMeta as any,
        }).publicPageSections;
      // Older additive imports retain the original session transcript and stable rows.
      // Without an earlier source snapshot these rows are deliberately treated as
      // unbaselined conflicts rather than assuming the host's current value is original.
      if (data.discoverySource?.websiteImport)
        previous.websiteImport = data.discoverySource.websiteImport;
    }
  } else {
    const page = data.customEventPage || data.customEventPageDraft;
    const extracted = await sourceCheckDeps.extractCreateInformation(
      {
        url,
        text: hostNotes,
        category: customEventCategory(page?.category || data.category) || undefined,
      },
      signal,
    );
    if (!extracted.information)
      throw new Error(
        "The source could not be read as event information. No changes were applied.",
      );
    incoming = informationSourceFacts(extracted.information.details);
    const baseline = sourceRecord(data.sourceUpdates).facts;
    if (!previous && baseline) previous = baseline;
    const title = previous?.title || data.title;
    if (title && incoming.title && hasConflictingEventTitle(title, incoming.title))
      throw new Error("The source now describes another event. No changes were applied.");
    const year = String(
      previous?.date || page?.details?.date || data.date || data.startISO || "",
    ).slice(0, 4);
    if (/^\d{4}$/.test(year) && incoming.date && String(incoming.date).slice(0, 4) !== year)
      throw new Error("The source now describes another event edition. No changes were applied.");
  }
  signal.throwIfAborted();
  return {
    url,
    previous,
    incoming,
    warnings: [...new Set(warnings)],
    checkedAt: new Date().toISOString(),
  };
}
