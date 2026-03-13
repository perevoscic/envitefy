type Status = "ready" | "in-progress" | "not-started";

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasStoredScheduleContent(value: unknown): boolean {
  const schedule = value && typeof value === "object" ? (value as Record<string, any>) : {};
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  return days.some((day) => {
    const sessions = Array.isArray(day?.sessions) ? (day.sessions as any[]) : [];
    return sessions.some(
      (session: any) =>
        (Array.isArray(session?.clubs) && session.clubs.length > 0) ||
        Boolean(safeString(session?.group)) ||
        Boolean(safeString(session?.startTime)) ||
        Boolean(safeString(session?.code))
    );
  });
}

function getStatusFromFlags(required: boolean[]): Status {
  const filled = required.filter(Boolean).length;
  if (filled === 0) return "not-started";
  if (filled === required.length) return "ready";
  return "in-progress";
}

export function computeGymBuilderStatuses(data: any) {
  const adv = data?.advancedSections || {};
  const roster = adv?.roster || {};
  const meet = adv?.meet || {};
  const practice = adv?.practice || {};
  const logistics = adv?.logistics || {};
  const coaches = adv?.coaches || {};
  const schedule = adv?.schedule || {};
  const gear = adv?.gear || {};
  const volunteers = adv?.volunteers || {};
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
              meet?.awardsInfo
          )
        ),
      ]),
      design: "ready" as Status,
      images: data?.heroImage ? ("ready" as Status) : ("not-started" as Status),
    },
    operations: {
      rosterAttendance:
        Array.isArray(roster?.athletes) && roster.athletes.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      meetDetails: getStatusFromFlags([
        Boolean(
          safeString(
            meet?.warmUpTime ||
              meet?.marchInTime ||
              meet?.doorsOpen ||
              meet?.arrivalGuidance ||
              meet?.registrationInfo ||
              meet?.resultsInfo
          )
        ),
        Boolean(
          safeString(
            meet?.facilityLayout ||
              meet?.scoringInfo ||
              meet?.judgingNotes ||
              meet?.rotationSheetsInfo ||
              meet?.awardsInfo
          )
        ),
        (Array.isArray(meet?.rotationOrder) && meet.rotationOrder.length > 0) ||
          (Array.isArray(meet?.sessionWindows) && meet.sessionWindows.length > 0) ||
          (Array.isArray(meet?.operationalNotes) && meet.operationalNotes.length > 0),
      ]),
      coaches: getStatusFromFlags([
        Boolean(
          safeString(
            coaches?.signIn ||
              coaches?.hospitality ||
              coaches?.floorAccess ||
              coaches?.rotationSheets ||
              coaches?.paymentInstructions
          )
        ),
        Boolean(
          safeString(
            coaches?.attire ||
              coaches?.scratches ||
              coaches?.regionalCommitment ||
              coaches?.refundPolicy ||
              coaches?.qualification
          )
        ),
        (Array.isArray(coaches?.entryFees) && coaches.entryFees.length > 0) ||
          (Array.isArray(coaches?.teamFees) && coaches.teamFees.length > 0) ||
          (Array.isArray(coaches?.lateFees) && coaches.lateFees.length > 0) ||
          (Array.isArray(coaches?.deadlines) && coaches.deadlines.length > 0) ||
          (Array.isArray(coaches?.contacts) && coaches.contacts.length > 0),
      ]),
      schedule:
        hasStoredScheduleContent(schedule)
          ? ("ready" as Status)
          : ("not-started" as Status),
      practicePlanner:
        Array.isArray(practice?.blocks) && practice.blocks.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
      logisticsTravel: getStatusFromFlags([
        Boolean(safeString(logistics?.hotelName || logistics?.hotelAddress)),
        Boolean(safeString(logistics?.mealPlan || logistics?.policyFood)),
        Boolean(
          safeString(
            logistics?.feeAmount ||
              logistics?.parking ||
              logistics?.trafficAlerts ||
              logistics?.rideShare ||
              logistics?.accessibility
          )
        ),
      ]),
      gearUniform: getStatusFromFlags([
        Boolean(safeString(gear?.leotardOfDay)),
        Array.isArray(gear?.items) && gear.items.length > 0,
      ]),
      volunteersCarpool: getStatusFromFlags([
        Boolean(safeString(volunteers?.signupLink)),
        Boolean(safeString(volunteers?.notes)),
      ]),
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
        Array.isArray(announcements?.announcements) &&
        announcements.announcements.length > 0
          ? ("ready" as Status)
          : ("not-started" as Status),
    },
  };

  const essentialsReady =
    statuses.essentials.eventBasics === "ready" &&
    statuses.essentials.details !== "not-started";

  const missingEssentials: string[] = [];
  if (statuses.essentials.eventBasics !== "ready") missingEssentials.push("Event Basics");
  if (statuses.essentials.details === "not-started") missingEssentials.push("Details");

  return {
    ...statuses,
    beforePublish: {
      previewPublish: essentialsReady ? ("ready" as Status) : ("in-progress" as Status),
      missingEssentials,
    },
  };
}
