export type EventCelebrationKind = "birthday-balloons" | "graduation-hats";

type EventCelebrationData = {
  category?: string | null;
  eventType?: string | null;
  templateId?: string | null;
  variationId?: string | null;
  createdVia?: string | null;
  title?: string | null;
  headlineTitle?: string | null;
  publicEvent?: {
    category?: string | null;
    eventType?: string | null;
    headline?: string | null;
  } | null;
  eventDetails?: {
    category?: string | null;
    eventTitle?: string | null;
  } | null;
  studioCard?: {
    invitationData?: {
      title?: string | null;
      eventDetails?: {
        category?: string | null;
        eventTitle?: string | null;
      } | null;
    } | null;
  } | null;
};

function cleanText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function resolveEventCelebrationKind(
  data: EventCelebrationData | null | undefined,
  fallbackTitle?: string | null,
): EventCelebrationKind | null {
  const haystack = [
    data?.category,
    data?.eventType,
    data?.templateId,
    data?.variationId,
    data?.createdVia,
    data?.title,
    data?.headlineTitle,
    data?.publicEvent?.category,
    data?.publicEvent?.eventType,
    data?.publicEvent?.headline,
    data?.eventDetails?.category,
    data?.eventDetails?.eventTitle,
    data?.studioCard?.invitationData?.title,
    data?.studioCard?.invitationData?.eventDetails?.category,
    data?.studioCard?.invitationData?.eventDetails?.eventTitle,
    fallbackTitle,
  ]
    .map(cleanText)
    .filter(Boolean)
    .join(" ");

  if (!haystack) return null;
  if (
    /\b(graduations?|graduat(?:e|es|ion|ing)?|commencement)\b|\bclass\s+of\s+\d{4}\b/.test(haystack)
  ) {
    return "graduation-hats";
  }
  if (/\bbirthdays?\b|\bb[-\s]?day\b/.test(haystack)) {
    return "birthday-balloons";
  }
  return null;
}
