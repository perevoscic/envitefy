import {
  getGymDiscoveryV2PipelineSummary,
  getGymDiscoveryV2PublicArtifacts,
  isGymDiscoveryV2EventData,
} from "@/lib/discovery/event-data";

type Status = "ready" | "in-progress" | "not-started";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getStatusFromFlags(required: boolean[]): Status {
  const filled = required.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === required.length) return "ready";
  return "in-progress";
}

export function computeGymBuilderStatuses(data: any) {
  const discoveryV2 = isGymDiscoveryV2EventData(data);
  const discoveryV2PublicArtifacts = getGymDiscoveryV2PublicArtifacts(data);
  const discoveryV2PipelineSummary = getGymDiscoveryV2PipelineSummary(data);
  const isPublicPageV2 =
    discoveryV2 ||
    data?.discoverySource?.pipelineVersion === "gym-public-v2" ||
    safeString(data?.createdVia) === "meet-discovery" ||
    safeString(data?.discoverySource?.workflow) === "gymnastics" ||
    Boolean(data?.discoverySource?.input || data?.discoverySource?.parseResult);
  const publicSections =
    (discoveryV2PublicArtifacts?.sections as Record<string, any>) ||
    data?.discoverySource?.publicPageSections ||
    {};
  const publishAssessment =
    discoveryV2PublicArtifacts?.publishAssessment ||
    data?.discoverySource?.publishAssessment ||
    null;
  const adv = data?.advancedSections || {};
  const roster = adv?.roster || {};
  const meet = adv?.meet || {};
  const logistics = adv?.logistics || {};
  const announcements = adv?.announcements || {};
  const startExists = Boolean(data?.date || data?.startISO);

  const statuses = {
    essentials: {
      eventBasics: getStatusFromFlags([
        Boolean(safeString(data?.title)),
        startExists,
        Boolean(safeString(data?.timezone)),
        Boolean(safeString(data?.venue)),
        Boolean(safeString(data?.address)),
      ]),
      details: getStatusFromFlags([
        Boolean(safeString(data?.details)),
        Boolean(
          safeString(
            (isPublicPageV2 ? publicSections?.meetDetails?.body : "") ||
              meet?.warmUpTime ||
              meet?.judgingNotes ||
              meet?.sessionNumber ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.facilityLayout ||
              meet?.scoringInfo ||
              meet?.resultsInfo ||
              meet?.rotationSheetsInfo ||
              meet?.awardsInfo,
          ),
        ),
      ]),
      design: "ready" as Status,
      images: data?.heroImage ? ("ready" as Status) : ("not-started" as Status),
    },
    operations: {
      rosterAttendance: "not-started" as Status,
      meetDetails: getStatusFromFlags([
        isPublicPageV2
          ? Boolean(safeString(publicSections?.meetDetails?.body))
          : !!(Array.isArray(roster?.athletes) && roster.athletes.length > 0),
        Boolean(
          safeString(
            (isPublicPageV2 ? publicSections?.meetDetails?.body : "") ||
              meet?.warmUpTime ||
              meet?.marchInTime ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.resultsInfo,
          ),
        ),
        Boolean(
          safeString(
            meet?.facilityLayout ||
              meet?.scoringInfo ||
              meet?.judgingNotes ||
              meet?.rotationSheetsInfo ||
              meet?.awardsInfo,
          ),
        ),
        (isPublicPageV2 && Array.isArray(publicSections?.meetDetails?.bullets)
          ? publicSections.meetDetails.bullets.length > 0
          : false) ||
          (Array.isArray(meet?.rotationOrder) && meet.rotationOrder.length > 0) ||
          (Array.isArray(meet?.sessionWindows) && meet.sessionWindows.length > 0) ||
          (Array.isArray(meet?.operationalNotes) && meet.operationalNotes.length > 0),
      ]),
      coaches: "not-started" as Status,
      schedule: "not-started" as Status,
      practicePlanner: "not-started" as Status,
      logisticsTravel: getStatusFromFlags([
        Boolean(
          safeString(
            (isPublicPageV2 ? publicSections?.travel?.body : "") ||
              logistics?.hotelName ||
              logistics?.hotelAddress,
          ),
        ),
        Boolean(safeString(logistics?.mealPlan || logistics?.policyFood)),
        Boolean(
          safeString(
            (isPublicPageV2 ? publicSections?.parking?.body : "") ||
              (isPublicPageV2 ? publicSections?.traffic?.body : "") ||
              logistics?.feeAmount ||
              logistics?.parking ||
              logistics?.trafficAlerts ||
              logistics?.rideShare ||
              logistics?.accessibility,
          ),
        ),
      ]),
      gearUniform: "not-started" as Status,
      volunteersCarpool: "not-started" as Status,
    },
    communication: {
      attendance: data?.rsvpEnabled ? ("ready" as Status) : ("not-started" as Status),
      passcode:
        data?.accessControl?.requirePasscode === true
          ? data?.accessControl?.passcodeHash
            ? ("ready" as Status)
            : ("in-progress" as Status)
          : ("not-started" as Status),
      announcements:
        Array.isArray(announcements?.announcements) && announcements.announcements.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
  };

  const essentialsReady =
    statuses.essentials.eventBasics === "ready" && statuses.essentials.details !== "not-started";

  const missingEssentials: string[] = [];
  if (statuses.essentials.eventBasics !== "ready") missingEssentials.push("Event Basics");
  if (statuses.essentials.details === "not-started") missingEssentials.push("Details");
  if (
    discoveryV2 &&
    safeString(discoveryV2PipelineSummary?.processingStage) &&
    safeString(discoveryV2PipelineSummary?.processingStage) !== "review_ready"
  ) {
    missingEssentials.unshift("Discovery review");
  }

  return {
    ...statuses,
    beforePublish: {
      previewPublish:
        publishAssessment?.state === "auto_publish"
          ? ("ready" as Status)
          : essentialsReady
            ? ("in-progress" as Status)
            : ("in-progress" as Status),
      missingEssentials:
        Array.isArray(publishAssessment?.reasons) && publishAssessment.reasons.length > 0
          ? publishAssessment.reasons
          : missingEssentials,
    },
  };
}
