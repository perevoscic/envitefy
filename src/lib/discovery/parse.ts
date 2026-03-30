import { safeString, uniqueStrings } from "@/lib/discovery/shared";
import type {
  CanonicalDiscoveryParse,
  DiscoveryDocument,
  EventDiscoveryRow,
} from "@/lib/discovery/types";
import {
  parseMeetFromExtractedText,
  stripGymScheduleGridsFromParseResult,
} from "@/lib/meet-discovery";

function buildCanonicalDiscoveryParse(params: {
  document: DiscoveryDocument;
  parseResult: Record<string, any>;
  evidence: Record<string, any> | null;
}): CanonicalDiscoveryParse {
  const parseResult = params.parseResult || {};
  const resourceDocuments = params.document.resources.map((resource) => ({
    kind: resource.kind,
    label: resource.label,
    url: resource.url,
    status: resource.status || null,
  }));
  const issues = uniqueStrings(
    [
      ...(Array.isArray((parseResult as any)?.issues)
        ? (parseResult as any).issues.map((item: any) => item?.message || item?.code)
        : []),
    ],
    16,
  ).map((message) => ({
    code: "parse_issue",
    message,
    severity: "warning" as const,
  }));
  return {
    workflow: "gymnastics",
    eventCore: {
      title: parseResult.title || "",
      startAt: parseResult.startAt || null,
      endAt: parseResult.endAt || null,
      timezone: parseResult.timezone || null,
      category: "gymnastics",
    },
    venue: {
      venue: parseResult.venue || "",
      address: parseResult.address || "",
      hostGym: parseResult.hostGym || "",
    },
    spectatorInfo: {
      admission: Array.isArray(parseResult.admission) ? parseResult.admission : [],
      spectator: parseResult.spectator || {},
    },
    logistics: parseResult.logistics || {},
    links: {
      links: Array.isArray(parseResult.links) ? parseResult.links : [],
    },
    documents: resourceDocuments,
    meetDetailsInputs: uniqueStrings(
      [
        safeString(parseResult.dates),
        safeString(parseResult.meetDetails?.doorsOpen),
        safeString(parseResult.meetDetails?.arrivalGuidance),
        safeString(parseResult.meetDetails?.registrationInfo),
      ],
      12,
    ),
    confidence: {},
    issues,
  };
}

export async function runDiscoveryParseStage(discovery: EventDiscoveryRow) {
  const document = discovery.document;
  if (!document) throw new Error("Document extraction must complete before parse.");
  const extractedText = safeString((document.extractionMeta as any)?.extractedText);
  const parsed = await parseMeetFromExtractedText(extractedText, document.extractionMeta as any, {
    traceId: discovery.eventId,
    mode: "core",
  });
  const parseResult = stripGymScheduleGridsFromParseResult(parsed.parseResult as any);
  return {
    canonicalParse: buildCanonicalDiscoveryParse({
      document,
      parseResult,
      evidence: (parsed as any)?.evidence || null,
    }),
    debug: {
      coreParseResult: parseResult,
      coreEvidence: (parsed as any)?.evidence || null,
      coreRawModelOutput: (parsed as any)?.rawModelOutput || null,
      coreModelUsed: (parsed as any)?.modelUsed || null,
    },
  };
}
