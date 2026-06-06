import type { EventSection } from "../schemas/eventBlueprint.schema";
import { GenericListSection } from "../sections/GenericListSection";
import { HeroSection } from "../sections/HeroSection";
import { QuickDetailsSection } from "../sections/QuickDetailsSection";
import { RSVPSection } from "../sections/RSVPSection";
import { ScheduleTimelineSection } from "../sections/ScheduleTimelineSection";
import type { EventPageRendererContext } from "./types";

export function SectionRenderer({
  section,
  context,
}: {
  section: EventSection;
  context: EventPageRendererContext;
}) {
  if (section.type === "hero") {
    return <HeroSection section={section} actions={context.actions} />;
  }
  if (section.type === "quick_details") return <QuickDetailsSection section={section} />;
  if (section.type === "schedule_timeline") return <ScheduleTimelineSection section={section} />;
  if (section.type === "rsvp") {
    return (
      <RSVPSection
        section={section}
        eventId={context.eventId}
        eventTitle={context.title}
        shareUrl={context.shareUrl}
      />
    );
  }
  return <GenericListSection section={section} id={section.type} />;
}
