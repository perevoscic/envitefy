import { throwIfDiscoveryCancelled } from "@/lib/discovery/cancel";
import { safeString, uniqueStrings } from "@/lib/discovery/shared";
import type {
  CanonicalDiscoveryParse,
  DiscoveryDocument,
  DiscoveryWorkflow,
  EventDiscoveryRow,
} from "@/lib/discovery/types";
import type { SportDetectionResult } from "@/lib/sports-discovery";
import { getDiscoveryAdapter } from "@/lib/sports-discovery";

function buildCanonicalDiscoveryParse(params: {
  workflow: DiscoveryWorkflow;
  document: DiscoveryDocument;
  parseResult: Record<string, any>;
  evidence: Record<string, any> | null;
  detection: SportDetectionResult;
  parserAdapter: string;
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
    workflow: params.workflow,
    activityProfile: params.detection.profile,
    eventArchetype: params.detection.archetype,
    parserAdapter: params.parserAdapter,
    detection: params.detection,
    eventCore: {
      title: parseResult.title || "",
      startAt: parseResult.startAt || null,
      endAt: parseResult.endAt || null,
      timezone: parseResult.timezone || null,
      category:
        params.workflow === "gymnastics"
          ? "gymnastics"
          : params.workflow === "football"
            ? "football"
            : "sport_event",
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

export async function runDiscoveryParseStage(
  discovery: EventDiscoveryRow,
  options?: { signal?: AbortSignal },
) {
  throwIfDiscoveryCancelled(options?.signal);
  const document = discovery.document;
  if (!document) throw new Error("Document extraction must complete before parse.");
  const extractedText = safeString((document.extractionMeta as any)?.extractedText);
  const adapter = getDiscoveryAdapter(discovery.workflow);
  const parsed = await adapter.parse({
    extractedText,
    extractionMeta: document.extractionMeta as Record<string, any>,
    eventId: discovery.eventId,
    activityHint: discovery.source.activityProfile,
    archetypeHint: discovery.source.eventArchetype,
  });
  throwIfDiscoveryCancelled(options?.signal);
  const parseResult = parsed.parseResult as any;
  return {
    canonicalParse: buildCanonicalDiscoveryParse({
      workflow: discovery.workflow,
      document,
      parseResult,
      evidence: (parsed as any)?.evidence || null,
      detection: parsed.detection,
      parserAdapter: parsed.adapterId,
    }),
    debug: {
      coreParseResult: parseResult,
      coreEvidence: (parsed as any)?.evidence || null,
      coreRawModelOutput: (parsed as any)?.rawModelOutput || null,
      coreModelUsed: (parsed as any)?.modelUsed || null,
      sportDetection: parsed.detection,
      parserAdapter: parsed.adapterId,
    },
  };
}
